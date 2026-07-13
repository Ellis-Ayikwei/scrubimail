import re
import dns.resolver
import smtplib
import socket
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart
from celery import shared_task
from django.conf import settings
from .models import EmailValidation
from .advanced_validator import AdvancedEmailValidator, _now_iso
from .services import build_breakdown as _build_breakdown, persist_validation_record

# Initialize the advanced validator
validator = AdvancedEmailValidator()


@shared_task(
    bind=True,
    max_retries=5,
    acks_late=True,
    autoretry_for=(Exception,),
    retry_backoff=True,
)
def persist_validation_record_task(self, **kwargs):
    """Write a completed realtime validation's rows off the request path.

    Runs on the DEFAULT queue (the main app's worker), never the egress box —
    this is database work, not SMTP work. acks_late + retries make it
    at-least-once, and persist_validation_record is idempotent on the caller's
    pre-generated validation_id, so a redelivery rewrites the same row instead
    of double-recording a charge.
    """
    persist_validation_record(**kwargs)
    return {"status": "completed", "validation_id": kwargs.get("validation_id")}


@shared_task(bind=True, max_retries=3)
def validate_email_task(self, email_validation_id):
    """Advanced email validation task using comprehensive validation pipeline"""
    try:
        validation = EmailValidation.objects.get(id=email_validation_id)
        email = validation.email

        # Async/background path: run full SMTP verification (deep) since
        # multi-second latency is acceptable here, unlike the realtime API.
        result = validator.validate_email(email, deep=True)
    except Exception as exc:
        raise self.retry(exc=exc, countdown=2 ** self.request.retries)

    # Rate limited by our own per-provider limiter or a provider cooldown:
    # reschedule this address with backoff instead of finalizing it, so we stay
    # within the configured probes/minute and don't burn IP reputation. A
    # generous max_retries lets an address wait out a 15-minute cooldown.
    if result.metadata.get("rate_limited"):
        countdown = result.metadata.get("retry_after") or 60
        raise self.retry(countdown=countdown, max_retries=20)

    # Greylisting (SMTP 450): the server asked us to come back later. Re-probe
    # automatically after a delay, up to a small cap, before finalizing the
    # address as unknown/greylisted.
    if result.metadata.get("sub_status") == "greylisted":
        delay = int(getattr(settings, "VALIDATION_GREYLIST_RETRY_DELAY", 600))
        max_greylist = int(getattr(settings, "VALIDATION_GREYLIST_MAX_RETRIES", 2))
        if self.request.retries < max_greylist:
            raise self.retry(countdown=delay, max_retries=max_greylist)
        # Out of greylist retries — fall through and finalize as unknown.

    # Warm the shared result cache so the realtime endpoint benefits from this
    # deep verification (Issue 9).
    validator.store_result(email, result)

    try:
        # Update validation record
        validation.status = "completed"
        validation.score = result.score
        validation.breakdown = _build_breakdown(result)
        validation.suggestions = result.suggestions
        validation.warnings = result.warnings
        validation.metadata = result.metadata
        validation.save()

        return {
            "status": validation.status,
            "score": result.score,
            "verdict": result.verdict,
            "is_valid": result.is_valid,
        }

    except Exception as exc:
        self.retry(exc=exc, countdown=2**self.request.retries)


@shared_task
def verify_email_deep_task(email):
    """Deep (SMTP) mailbox verification for the realtime single-validation
    endpoint. Routed to the `smtp_validation` queue, so it only ever runs on
    the egress worker — the one host with outbound port 25 open.

    No retries, unlike validate_email_task: the caller is an HTTP request
    waiting on the verdict, so transient outcomes (greylisted, rate_limited,
    timeout) are returned as an honest `unknown` rather than re-probed —
    store_result skips them, so a later request re-verifies. Terminal verdicts
    warm the shared result cache; even when the caller times out before the
    probe finishes, the next lookup for this address is instant and confirmed.
    """
    result = validator.validate_email(email, deep=True)
    result.metadata.setdefault("verified_at", _now_iso())
    validator.store_result(email, result)
    return {
        "is_valid": result.is_valid,
        "score": result.score,
        "verdict": result.verdict,
        "breakdown": result.breakdown,
        "suggestions": result.suggestions,
        "warnings": result.warnings,
        "metadata": result.metadata,
    }


@shared_task(bind=True, max_retries=20)
def bulk_validate_emails_task(self, validation_job_id):
    """Process a bulk validation job entirely in the background.

    The HTTP view only enqueues this task and returns 202 immediately. Here we:

      * process addresses in chunks, updating job.progress / total_processed as
        each chunk completes so the status endpoint shows real progress;
      * stay idempotent and resumable — addresses that already have a completed
        EmailValidation row for THIS job are skipped, so a worker restart never
        re-probes or double-charges;
      * consume exactly one credit per processed address (never upfront, never
        twice); the row is created first, then the credit is consumed, so a
        crash between the two under-charges (customer-favorable) rather than
        billing for work with no record;
      * defer rate-limited addresses (provider cooldown / empty bucket) and
        self.retry, so we finish them later without exceeding probe limits.
    """
    from django.conf import settings as dj_settings
    from .models import BulkValidationJob
    from apps.billing.services import BillingService
    from apps.billing.models import EmailValidationUsage

    try:
        job = BulkValidationJob.objects.get(id=validation_job_id)
    except BulkValidationJob.DoesNotExist:
        return {"status": "error", "error": "job not found"}

    job.status = "processing"
    job.save(update_fields=["status", "updated_at"])

    profile = BillingService().get_or_create_billing_profile(job.user)

    emails = job.emails or []
    total = len(emails)
    chunk_size = int(getattr(dj_settings, "VALIDATION_BULK_CHUNK_SIZE", 100))

    # Resume set: addresses already completed for THIS job are never redone.
    done = set(
        EmailValidation.objects.filter(
            bulk_job=job, status="completed"
        ).values_list("email", flat=True)
    )
    processed = len(done)
    deferred = False
    deferred_after = 60
    out_of_credits = False

    for start in range(0, total, chunk_size):
        chunk = emails[start : start + chunk_size]
        for email in chunk:
            if email in done:
                continue

            try:
                result = validator.validate_email(email, deep=True)
            except Exception:
                # Transient per-address failure — leave it for the retry pass.
                deferred = True
                continue

            if result.metadata.get("rate_limited"):
                # Provider is rate-limited / cooling down: defer this address.
                deferred = True
                deferred_after = max(
                    deferred_after, int(result.metadata.get("retry_after") or 60)
                )
                continue

            if result.metadata.get("sub_status") == "greylisted":
                # Server greylisted us — defer and re-probe on the next pass
                # instead of finalizing this address as unknown right away.
                deferred = True
                deferred_after = max(
                    deferred_after,
                    int(getattr(dj_settings, "VALIDATION_GREYLIST_RETRY_DELAY", 600)),
                )
                continue

            # One credit per processed address. Check first so we never create a
            # completed row we can't charge for; create the row, then consume.
            if not profile.can_use_credits(1):
                out_of_credits = True
                break

            EmailValidation.objects.create(
                email=email,
                user=job.user,
                bulk_job=job,
                status="completed",
                score=result.score,
                breakdown=_build_breakdown(result),
                suggestions=result.suggestions,
                warnings=result.warnings,
                metadata=result.metadata,
                job_type="bulk",
            )
            profile.consume_credits(1, "bulk")
            # Warm the shared result cache for the realtime endpoint (Issue 9).
            validator.store_result(email, result)
            done.add(email)
            processed += 1

        job.total_processed = processed
        job.progress = min(100, int(processed / total * 100)) if total else 100
        job.save(update_fields=["total_processed", "progress", "updated_at"])

        if out_of_credits:
            break

    if out_of_credits:
        job.results_summary = {
            **(job.results_summary or {}),
            "stopped_reason": "insufficient_credits",
            "processed": processed,
            "total": total,
        }
        job.status = "failed"
        job.save(update_fields=["results_summary", "status", "updated_at"])
        return {
            "status": "failed",
            "reason": "insufficient_credits",
            "total_processed": processed,
            "total_emails": total,
        }

    if deferred:
        # Some addresses await a provider cooldown / rate-limit window. Retry the
        # whole job; already-completed addresses are skipped on the next pass.
        raise self.retry(countdown=min(deferred_after, 900))

    # Fully processed — record one usage summary (guarded against resume).
    if processed and not EmailValidationUsage.objects.filter(
        validation_request_id=str(job.id)
    ).exists():
        EmailValidationUsage.objects.create(
            billing_profile=profile,
            validation_request_id=str(job.id),
            credits_consumed=processed,
            cost_per_credit=0.01,
            validation_type="bulk",
            email_count=processed,
        )

    job.status = "completed"
    job.progress = 100
    job.total_processed = processed
    job.save(update_fields=["status", "progress", "total_processed", "updated_at"])
    return {
        "status": "completed",
        "total_processed": processed,
        "total_emails": total,
    }


@shared_task(bind=True, max_retries=3)
def refresh_disposable_domains_task(self):
    """Weekly refresh of the disposable-domain blocklist (Celery beat).

    Delegates to the update_disposable_domains management command, which keeps
    the previous file on failure (never ships an empty list). Retries later if
    every feed was unreachable."""
    from django.core.management import call_command

    try:
        call_command("update_disposable_domains")
        return {"status": "completed"}
    except SystemExit as exc:
        # Command signalled failure (all feeds down); the old file is kept.
        raise self.retry(countdown=3600, exc=exc)
    except Exception as exc:
        raise self.retry(countdown=3600, exc=exc)


@shared_task
def cleanup_old_validations_task():
    """Clean up old validation records (older than 30 days)"""
    try:
        from django.utils import timezone
        from datetime import timedelta

        cutoff_date = timezone.now() - timedelta(days=30)
        deleted_count = EmailValidation.objects.filter(
            created_at__lt=cutoff_date
        ).delete()[0]

        return {"status": "completed", "deleted_count": deleted_count}

    except Exception as e:
        return {"status": "error", "error": str(e)}
