"""Application services for the validation app.

`verify_email_realtime` is the orchestration behind the single-validation
endpoint. Deep (SMTP-confirmed) verification stays the default, but the probe
itself runs on the SMTP-egress worker — the only host with outbound port 25
open — while the web request waits for the verdict within the realtime budget.
The web host never opens an SMTP connection itself (cloud providers block
port 25, so inline probes could only ever return `unknown`).

`record_validation` is the other half of the realtime path: the record/usage
rows are written OFF the request path, so the client never waits on database
I/O for data it already has in the response body. Money stays on-path — the
credit decrement is synchronous and atomic in the view.
"""

import logging
import time
import uuid
from typing import Any, Dict, Optional, Tuple

from celery.exceptions import TimeoutError as CeleryTimeoutError
from django.conf import settings
from django.core.cache import cache as _shared_cache
from django.db import transaction

from .advanced_validator import AdvancedEmailValidator, ValidationResult, _now_iso

logger = logging.getLogger(__name__)

# One validator per process (mirrors tasks.py). Its result cache and circuit
# breaker live in the shared Redis cache, not on the instance.
_validator = AdvancedEmailValidator()

# When a wait for the egress worker times out while the probe is still PENDING
# (nobody consumed it), this flag makes subsequent requests skip the wait for a
# cooldown period, so an egress outage degrades to instant honest `unknown`s
# instead of every request burning the full realtime budget.
_EGRESS_UNRESPONSIVE_KEY = "emailval:egress_unresponsive"

# A realtime probe is pointless long after its caller gave up: expire queued
# tasks so an outage doesn't leave the worker chewing a backlog of stale
# probes (and burning per-provider rate limits) when it comes back. A short
# grace period is kept because a finished probe still warms the result cache.
_TASK_EXPIRES_SECONDS = 600


def _egress_unresponsive() -> bool:
    try:
        return bool(_shared_cache.get(_EGRESS_UNRESPONSIVE_KEY))
    except Exception:
        return False  # cache down -> assume responsive and let the wait decide


def _flag_egress_unresponsive() -> None:
    ttl = int(getattr(settings, "VALIDATION_EGRESS_UNRESPONSIVE_COOLDOWN", 60))
    if ttl <= 0:
        return
    logger.warning(
        "Realtime egress verification: no worker claimed the probe within the "
        "budget — skipping the wait for the next %ss. Is the smtp-egress "
        "worker running and consuming the smtp_validation queue on the same "
        "broker?",
        ttl,
    )
    try:
        _shared_cache.set(_EGRESS_UNRESPONSIVE_KEY, True, timeout=ttl)
    except Exception:
        pass


def _result_from_payload(payload: dict) -> ValidationResult:
    return ValidationResult(
        is_valid=payload["is_valid"],
        score=payload["score"],
        verdict=payload["verdict"],
        breakdown=payload.get("breakdown", {}),
        suggestions=payload.get("suggestions", []),
        warnings=payload.get("warnings", []),
        metadata=payload.get("metadata", {}),
    )


def verify_email_realtime(
    email: str, fast: bool = False, budget: Optional[float] = None
) -> Tuple[ValidationResult, bool]:
    """Verify `email` for the realtime endpoint. Returns (result, from_cache).

    Fast mode runs the syntax/DNS/list pipeline inline — sub-100ms, no SMTP.

    Deep mode (the default) enqueues the SMTP probe to the `smtp_validation`
    queue (consumed only by the egress worker) and waits for the verdict within
    the realtime budget. If the worker can't answer in time — or the broker is
    unreachable — it degrades to the fast pipeline relabelled
    `smtp_unavailable`: an honest `unknown`, never a fabricated `valid`. The
    enqueued probe still completes and warms the shared result cache, so the
    next lookup for the same address returns the confirmed verdict instantly.
    """
    from .tasks import verify_email_deep_task

    if fast:
        return _validator.validate_email_realtime(email, fast=True)

    budget = budget or _validator.realtime_budget
    deadline = time.monotonic() + budget

    # Result cache first — verdicts from earlier realtime probes (including
    # ones whose caller timed out) and bulk jobs make repeat lookups instant.
    cached = _validator.get_cached_result(email)
    if cached is not None:
        return cached, True

    # Local pre-flight (syntax/DNS/list checks, ~10-50ms, no SMTP): a large
    # class of addresses is TERMINALLY classifiable without probing — bad
    # syntax, non-existent domain, null MX, disposable, role-based. Settle
    # those here and skip the queue round trip; only mailbox existence needs
    # the egress worker. Terminal verdicts are cached like any deep result.
    local = _validator.validate_email(email, deep=False)
    if local.metadata.get("status") in ("invalid", "do_not_mail"):
        local.metadata["verified_at"] = _now_iso()
        _validator.store_result(email, local)
        return local, False

    skip_wait = _egress_unresponsive()
    async_result = None
    try:
        # Enqueue even when skipping the wait: once the worker is back it still
        # warms the cache for this address (bounded by the task expiry).
        async_result = verify_email_deep_task.apply_async(
            args=[email], expires=_TASK_EXPIRES_SECONDS
        )
    except Exception:
        logger.exception(
            "Realtime egress verification: could not enqueue probe for %s", email
        )

    if async_result is not None and not skip_wait:
        try:
            payload = async_result.get(
                timeout=max(0.5, deadline - time.monotonic()), interval=0.1
            )
            return _result_from_payload(payload), False
        except CeleryTimeoutError:
            # Distinguish "worker is slow on this address" (STARTED — tarpit,
            # greylist) from "nobody is consuming the queue" (still PENDING
            # after a full budget; requires CELERY_TASK_TRACK_STARTED). Only
            # the latter starts the cooldown.
            if async_result.state == "PENDING":
                _flag_egress_unresponsive()
        except Exception:
            logger.exception("Realtime egress verification failed for %s", email)

    # Honest degradation: return the local pre-flight result relabelled
    # smtp_unavailable — a transient sub_status, so it is never cached and the
    # next request attempts deep verification again.
    _validator._mark_smtp_unavailable(local)
    local.metadata["verified_at"] = _now_iso()
    return local, False


# ------------------------------------------------------------------ persistence
def build_breakdown(result: ValidationResult) -> Dict[str, Any]:
    """The breakdown payload persisted by every path (realtime, single, bulk)."""
    return {
        "syntax": result.breakdown.get("syntax", {}),
        "dns": result.breakdown.get("dns", {}),
        "smtp": result.breakdown.get("smtp", {}),
        "reputation": result.breakdown.get("reputation", {}),
        "role_based": result.breakdown.get("role_based", {}),
        "risk_score": {
            "score": result.score,
            "verdict": result.verdict,
            "is_valid": result.is_valid,
        },
    }


def persist_validation_record(
    validation_id: str,
    email: str,
    user_id: Optional[str],
    billing_profile_id: Optional[str],
    record: Dict[str, Any],
    job_type: str = "api",
    validation_type: str = "single",
    credits_consumed: int = 1,
) -> None:
    """Write the EmailValidation row and its billing-usage row in ONE transaction.

    Idempotent by construction: the caller generates `validation_id` up front, so
    a retry (or an at-least-once redelivery) rewrites the same row rather than
    creating a second one, and the usage row is keyed on that same id. Safe to
    run from a Celery task, or inline as the fallback when the broker is down.
    """
    from apps.billing.models import EmailValidationUsage
    from .models import EmailValidation

    with transaction.atomic():
        EmailValidation.objects.update_or_create(
            id=validation_id,
            defaults={
                "email": email,
                "user_id": user_id,
                "status": "completed",
                "score": record["score"],
                "breakdown": record["breakdown"],
                "suggestions": record["suggestions"],
                "warnings": record["warnings"],
                "metadata": record["metadata"],
                "job_type": job_type,
            },
        )
        if billing_profile_id and credits_consumed:
            EmailValidationUsage.objects.get_or_create(
                validation_request_id=str(validation_id),
                defaults={
                    "billing_profile_id": billing_profile_id,
                    "credits_consumed": credits_consumed,
                    "cost_per_credit": 0.01,
                    "validation_type": validation_type,
                    "email_count": 1,
                },
            )


def record_validation(
    email: str,
    result: ValidationResult,
    user_id: Optional[str],
    billing_profile_id: Optional[str],
    job_type: str = "api",
    validation_type: str = "single",
    credits_consumed: int = 1,
) -> Tuple[str, Dict[str, Any]]:
    """Record a completed validation OFF the request path.

    Returns (validation_id, breakdown) immediately — the id is generated here, so
    the response can carry it before the row exists. The rows are written by a
    worker a few hundred ms later; nothing user-facing depends on them existing
    yet, because the client already has the verdict in the response body.

    If the enqueue fails (broker down), the write happens inline rather than
    being lost: a credit was already spent, so the record must survive.
    """
    from .tasks import persist_validation_record_task

    validation_id = str(uuid.uuid4())
    record = {
        "score": result.score,
        "breakdown": build_breakdown(result),
        "suggestions": result.suggestions,
        "warnings": result.warnings,
        "metadata": result.metadata,
    }
    kwargs = {
        "validation_id": validation_id,
        "email": email,
        "user_id": str(user_id) if user_id else None,
        "billing_profile_id": (
            str(billing_profile_id) if billing_profile_id else None
        ),
        "record": record,
        "job_type": job_type,
        "validation_type": validation_type,
        "credits_consumed": credits_consumed,
    }

    try:
        persist_validation_record_task.apply_async(kwargs=kwargs)
    except Exception:
        logger.exception(
            "Could not enqueue the validation record for %s — writing inline so "
            "the charged credit still has a record",
            email,
        )
        persist_validation_record(**kwargs)

    return validation_id, record["breakdown"]
