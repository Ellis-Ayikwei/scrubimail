import re
import dns.resolver
import smtplib
import socket
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart
from celery import shared_task
from .models import EmailValidation
from .advanced_validator import AdvancedEmailValidator

# Initialize the advanced validator
validator = AdvancedEmailValidator()


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

    try:
        # Update validation record
        validation.status = "completed"
        validation.score = result.score
        validation.breakdown = {
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


@shared_task(bind=True, max_retries=3)
def bulk_validate_emails_task(self, validation_job_id):
    """Bulk email validation task for CSV/NDJSON processing"""
    try:
        from .models import BulkValidationJob

        job = BulkValidationJob.objects.get(id=validation_job_id)
        job.status = "processing"
        job.save()

        # Process emails in batches
        batch_size = 100
        total_processed = 0

        for i in range(0, len(job.emails), batch_size):
            batch = job.emails[i : i + batch_size]

            for email in batch:
                try:
                    # Create individual validation record
                    validation = EmailValidation.objects.create(
                        email=email, user=job.user, job_type="bulk", status="pending"
                    )

                    # Queue individual validation task
                    validate_email_task.delay(validation.id)
                    total_processed += 1

                except Exception as e:
                    # Log error but continue processing
                    continue

            # Update progress
            job.progress = min(100, (total_processed / len(job.emails)) * 100)
            job.save()

        job.status = "completed"
        job.total_processed = total_processed
        job.save()

        return {
            "status": "completed",
            "total_processed": total_processed,
            "total_emails": len(job.emails),
        }

    except Exception as exc:
        self.retry(exc=exc, countdown=2**self.request.retries)


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
