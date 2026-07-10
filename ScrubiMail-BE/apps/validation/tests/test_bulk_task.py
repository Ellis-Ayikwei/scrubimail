"""Issue 3 — the bulk endpoint must enqueue and return immediately, and all
processing must happen in the Celery task: chunked, idempotent/resumable, and
charging exactly one credit per processed address."""

from unittest import mock

from django.contrib.auth import get_user_model
from django.test import TestCase
from rest_framework.test import APIRequestFactory, force_authenticate

from apps.billing.services import BillingService
from apps.validation import tasks
from apps.validation.advanced_validator import ValidationResult
from apps.validation.models import BulkValidationJob, EmailValidation
from apps.validation.views import BulkEmailValidationView

User = get_user_model()


def _ok_result(email, rate_limited=False):
    meta = {"status": "valid", "sub_status": "mailbox_exists", "validation_time": 0.01}
    if rate_limited:
        meta = {"status": "unknown", "sub_status": "rate_limited",
                "rate_limited": True, "retry_after": 30}
    return ValidationResult(
        is_valid=not rate_limited,
        score=95 if not rate_limited else 55,
        verdict="Valid" if not rate_limited else "Unknown",
        breakdown={"syntax": {}, "dns": {}, "smtp": {}, "reputation": {},
                   "role_based": {}},
        suggestions=[],
        warnings=[],
        metadata=meta,
    )


class BulkTaskTests(TestCase):
    def setUp(self):
        self.user = User.objects.create_user(
            email="bulk@example.com", password="x"
        )
        self.profile = BillingService().get_or_create_billing_profile(self.user)
        self.profile.credits_remaining = 10
        self.profile.save(update_fields=["credits_remaining"])
        self.emails = ["a@example.com", "b@example.com", "c@example.com"]

    def _make_job(self):
        return BulkValidationJob.objects.create(
            user=self.user, emails=self.emails,
            total_emails=len(self.emails), status="pending",
        )

    def test_processes_and_charges_one_credit_per_address(self):
        job = self._make_job()
        with mock.patch.object(
            tasks.validator, "validate_email",
            side_effect=lambda email, deep=None: _ok_result(email),
        ):
            tasks.bulk_validate_emails_task(job.id)

        rows = EmailValidation.objects.filter(bulk_job=job, status="completed")
        self.assertEqual(rows.count(), 3)
        job.refresh_from_db()
        self.assertEqual(job.status, "completed")
        self.assertEqual(job.total_processed, 3)
        self.assertEqual(job.progress, 100)
        self.profile.refresh_from_db()
        self.assertEqual(self.profile.credits_remaining, 7)  # 10 - 3

    def test_idempotent_resume_no_duplicate_rows_or_charges(self):
        job = self._make_job()
        with mock.patch.object(
            tasks.validator, "validate_email",
            side_effect=lambda email, deep=None: _ok_result(email),
        ) as m:
            tasks.bulk_validate_emails_task(job.id)
            first_calls = m.call_count
            # Re-run the SAME job (simulating a worker restart).
            tasks.bulk_validate_emails_task(job.id)

        self.assertEqual(
            EmailValidation.objects.filter(bulk_job=job).count(), 3
        )  # no duplicates
        self.profile.refresh_from_db()
        self.assertEqual(self.profile.credits_remaining, 7)  # not double-charged
        # Second pass re-validated nothing (all already completed).
        self.assertEqual(m.call_count, first_calls)

    def test_rate_limited_addresses_are_deferred_via_retry(self):
        job = self._make_job()
        with mock.patch.object(
            tasks.validator, "validate_email",
            side_effect=lambda email, deep=None: _ok_result(email, rate_limited=True),
        ):
            with mock.patch.object(
                tasks.bulk_validate_emails_task, "retry",
                side_effect=RuntimeError("retry-called"),
            ) as retry_mock:
                with self.assertRaises(RuntimeError):
                    tasks.bulk_validate_emails_task(job.id)

        self.assertTrue(retry_mock.called)
        # Nothing finalized, nothing charged while rate-limited.
        self.assertEqual(
            EmailValidation.objects.filter(bulk_job=job, status="completed").count(),
            0,
        )
        self.profile.refresh_from_db()
        self.assertEqual(self.profile.credits_remaining, 10)

    def test_stops_when_credits_run_out(self):
        self.profile.credits_remaining = 2
        self.profile.save(update_fields=["credits_remaining"])
        job = self._make_job()
        with mock.patch.object(
            tasks.validator, "validate_email",
            side_effect=lambda email, deep=None: _ok_result(email),
        ):
            tasks.bulk_validate_emails_task(job.id)

        # Only as many rows as we had credits for; never a free completed row.
        self.assertEqual(
            EmailValidation.objects.filter(bulk_job=job, status="completed").count(),
            2,
        )
        self.profile.refresh_from_db()
        self.assertEqual(self.profile.credits_remaining, 0)
        job.refresh_from_db()
        self.assertEqual(job.status, "failed")


class BulkViewAsyncTests(TestCase):
    """The view must NOT process inline: it enqueues and returns 202 quickly."""

    def setUp(self):
        self.user = User.objects.create_user(email="v@example.com", password="x")
        self.profile = BillingService().get_or_create_billing_profile(self.user)
        self.profile.credits_remaining = 100
        self.profile.save(update_fields=["credits_remaining"])

    def test_returns_202_and_enqueues_without_inline_processing(self):
        factory = APIRequestFactory()
        request = factory.post(
            "/scrubimail/api/v1/validate-bulk/",
            {"emails": ["a@example.com", "b@example.com"]},
            format="json",
        )
        force_authenticate(request, user=self.user)

        with mock.patch.object(
            BulkEmailValidationView, "throttle_classes", []
        ), mock.patch(
            "apps.validation.views.bulk_validate_emails_task.delay"
        ) as delay_mock:
            response = BulkEmailValidationView.as_view()(request)

        self.assertEqual(response.status_code, 202)
        self.assertIn("job_id", response.data)
        self.assertEqual(response.data["status"], "pending")
        delay_mock.assert_called_once()
        # No results were computed inline; only the job row exists.
        self.assertEqual(EmailValidation.objects.count(), 0)
        self.assertEqual(BulkValidationJob.objects.count(), 1)
        # Credits are NOT consumed at request time (the task does that).
        self.profile.refresh_from_db()
        self.assertEqual(self.profile.credits_remaining, 100)
