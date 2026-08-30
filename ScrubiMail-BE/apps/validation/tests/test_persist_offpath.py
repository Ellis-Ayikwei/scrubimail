"""Validation records are persisted synchronously and durably.

record_validation writes the EmailValidation + usage rows in-request, so the
user's history reflects a validation the moment they see the verdict. (An
earlier version enqueued this to Celery to shave latency; when the worker
consuming that queue was down the rows were silently lost and users saw an empty
history despite being charged — this reverts to a durable synchronous write.)

These tests pin:
  * the row is written during the call, under the id returned to the client;
  * the write is idempotent (safe to re-run / redeliver);
  * a persistence failure is swallowed and logged, never raised at the caller.
"""

import uuid
from unittest import mock

from django.contrib.auth import get_user_model
from django.test import TestCase

from apps.billing.models import BillingProfile, EmailValidationUsage
from apps.validation import services, tasks
from apps.validation.advanced_validator import ValidationResult
from apps.validation.models import EmailValidation


def _result():
    return ValidationResult(
        is_valid=True,
        score=95,
        verdict="Valid",
        breakdown={"syntax": {"valid": True}, "dns": {"valid": True}},
        suggestions=[],
        warnings=[],
        metadata={"status": "valid", "sub_status": "mailbox_exists"},
    )


class RecordValidationTests(TestCase):
    def setUp(self):
        self.user = get_user_model().objects.create_user(
            email="owner@example.com", password="x"
        )
        self.profile = BillingProfile.objects.create(
            user=self.user, credits_remaining=10
        )

    def _record(self):
        return services.record_validation(
            email="user@example.com",
            result=_result(),
            user_id=self.user.id,
            billing_profile_id=self.profile.id,
        )

    def test_writes_the_row_synchronously(self):
        # No Celery hop — the row exists as soon as record_validation returns,
        # under the id handed back to the client.
        with mock.patch.object(
            tasks.persist_validation_record_task, "apply_async"
        ) as enqueue:
            validation_id, breakdown = self._record()

        enqueue.assert_not_called()
        self.assertEqual(breakdown["risk_score"]["score"], 95)
        row = EmailValidation.objects.get(id=validation_id)
        self.assertEqual(row.email, "user@example.com")
        self.assertEqual(row.status, "completed")
        self.assertEqual(row.score, 95)
        self.assertEqual(row.user_id, self.user.id)
        self.assertEqual(row.job_type, "api")
        self.assertEqual(row.metadata["status"], "valid")

    def test_write_is_idempotent(self):
        # persist_validation_record must be safe to run twice (retry / redelivery)
        # without double-writing the record or double-recording the usage.
        kwargs = {
            "validation_id": str(uuid.uuid4()),
            "email": "user@example.com",
            "user_id": str(self.user.id),
            "billing_profile_id": str(self.profile.id),
            "record": {
                "score": 95,
                "breakdown": {},
                "suggestions": [],
                "warnings": [],
                "metadata": {"status": "valid"},
            },
            "job_type": "api",
            "validation_type": "single",
            "credits_consumed": 1,
        }
        services.persist_validation_record(**kwargs)
        services.persist_validation_record(**kwargs)

        self.assertEqual(EmailValidation.objects.count(), 1)
        self.assertEqual(
            EmailValidationUsage.objects.filter(
                validation_request_id=kwargs["validation_id"]
            ).count(),
            1,
        )

    def test_persistence_failure_is_swallowed_not_raised(self):
        # A DB hiccup must not fail the request — the verdict is already computed
        # and the credit consumed. It is logged; the row is simply missing.
        with mock.patch.object(
            services, "persist_validation_record", side_effect=Exception("db down")
        ):
            validation_id, breakdown = self._record()

        self.assertTrue(validation_id)
        self.assertEqual(breakdown["risk_score"]["score"], 95)
        self.assertFalse(EmailValidation.objects.filter(id=validation_id).exists())

    def test_usage_row_records_the_charge(self):
        validation_id, _ = self._record()

        usage = EmailValidationUsage.objects.get(
            validation_request_id=str(validation_id)
        )
        self.assertEqual(usage.billing_profile_id, self.profile.id)
        self.assertEqual(usage.credits_consumed, 1)
        self.assertEqual(usage.validation_type, "single")
        self.assertEqual(usage.email_count, 1)


class CreditsStayOnPathTests(TestCase):
    """Money must be exact: the decrement is atomic AND its result is checked."""

    def setUp(self):
        self.user = get_user_model().objects.create_user(
            email="broke@example.com", password="x"
        )

    def test_concurrent_validations_cannot_overspend_one_credit(self):
        profile = BillingProfile.objects.create(user=self.user, credits_remaining=1)

        first = profile.consume_credits(1, "single")
        # A second request that passed the same can_use_credits() pre-check.
        second = profile.consume_credits(1, "single")

        self.assertTrue(first)
        self.assertFalse(second)  # the view raises InsufficientCredits on this
        profile.refresh_from_db()
        self.assertEqual(profile.credits_remaining, 0)
