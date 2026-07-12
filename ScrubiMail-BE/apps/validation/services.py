"""Application services for the validation app.

`verify_email_realtime` is the orchestration behind the single-validation
endpoint. Deep (SMTP-confirmed) verification stays the default, but the probe
itself runs on the SMTP-egress worker — the only host with outbound port 25
open — while the web request waits for the verdict within the realtime budget.
The web host never opens an SMTP connection itself (cloud providers block
port 25, so inline probes could only ever return `unknown`).
"""

import logging
import time
from typing import Optional, Tuple

from celery.exceptions import TimeoutError as CeleryTimeoutError
from django.conf import settings
from django.core.cache import cache as _shared_cache

from .advanced_validator import AdvancedEmailValidator, ValidationResult

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

    # Honest degradation: on a non-egress host this is the fast pipeline marked
    # smtp_unavailable — a transient sub_status, so it is never cached and the
    # next request attempts deep verification again.
    return _validator.validate_email_realtime(
        email, fast=False, budget=max(0.5, deadline - time.monotonic())
    )
