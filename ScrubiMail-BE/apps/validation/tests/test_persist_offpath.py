"""Latency deep-dive — the record write leaves the request path.

The realtime response must not block on database I/O for data the client
already has in its body. Credits stay synchronous (money must be exact); the
EmailValidation + usage rows are enqueued and written by a worker.

These tests pin the properties that make that safe:
  * the id in the response is the id the row is eventually written with;
  * the write is idempotent, so an at-least-once redelivery can't double-record;
  * a broker outage falls back to an inline write — a spent credit never ends
    up without a record.
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

    def test_enqueues_instead_of_writing_on_the_request_path(self):
        with mock.patch.object(
            tasks.persist_validation_record_task, "apply_async"
        ) as enqueue:
            validation_id, breakdown = self._record()

        # Nothing written yet — the request path did no DB work for the record.
        enqueue.assert_called_once()
        self.assertFalse(EmailValidation.objects.filter(id=validation_id).exists())
        self.assertEqual(breakdown["risk_score"]["score"], 95)

        # The worker later writes the row under the id already returned.
        tasks.persist_validation_record_task(**enqueue.call_args.kwargs["kwargs"])
        row = EmailValidation.objects.get(id=validation_id)
        self.assertEqual(row.email, "user@example.com")
        self.assertEqual(row.status, "completed")
        self.assertEqual(row.score, 95)
        self.assertEqual(row.user_id, self.user.id)
        self.assertEqual(row.job_type, "api")
        self.assertEqual(row.metadata["status"], "valid")

    def test_write_is_idempotent_under_redelivery(self):
        # acks_late means a task can be delivered twice; it must not double-write
        # the record or double-record the usage (the user paid one credit).
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

    def test_broker_down_falls_back_to_an_inline_write(self):
        with mock.patch.object(
            tasks.persist_validation_record_task,
            "apply_async",
            side_effect=Exception("broker unreachable"),
        ):
            validation_id, _ = self._record()

        # The credit was spent, so the record must exist even with no broker.
        row = EmailValidation.objects.get(id=validation_id)
        self.assertEqual(row.status, "completed")
        self.assertEqual(
            EmailValidationUsage.objects.filter(
                validation_request_id=str(validation_id)
            ).count(),
            1,
        )

    def test_usage_row_records_the_charge(self):
        with mock.patch.object(
            tasks.persist_validation_record_task, "apply_async"
        ) as enqueue:
            validation_id, _ = self._record()
        tasks.persist_validation_record_task(**enqueue.call_args.kwargs["kwargs"])

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
