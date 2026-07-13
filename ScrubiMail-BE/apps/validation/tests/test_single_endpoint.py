"""End-to-end contract of POST /validate/ after the latency work.

The endpoint must: return the verdict plus the id of a row that does not exist
yet (it is written off-path), spend exactly one credit synchronously, and refuse
the request when the atomic decrement loses a race — never hand out a free
validation.
"""

from unittest import mock

from django.contrib.auth import get_user_model
from django.test import TestCase
from rest_framework.test import APIRequestFactory, force_authenticate

from apps.billing.models import BillingProfile
from apps.billing.services import BillingService
from apps.validation import tasks, views
from apps.validation.advanced_validator import ValidationResult
from apps.validation.models import EmailValidation
from apps.validation.views import SingleEmailValidationView

VALID = ValidationResult(
    is_valid=True,
    score=95,
    verdict="Valid",
    breakdown={"syntax": {"valid": True}},
    suggestions=[],
    warnings=[],
    metadata={
        "status": "valid",
        "sub_status": "mailbox_exists",
        "validation_time": 0.281,
    },
)


class SingleValidationEndpointTests(TestCase):
    def setUp(self):
        self.factory = APIRequestFactory()
        self.user = get_user_model().objects.create_user(
            email="api@example.com", password="x"
        )
        # Go through the service so the profile carries a plan — it resets the
        # credit balance to the plan default for a profile that has none.
        self.profile = BillingService().get_or_create_billing_profile(self.user)
        self.profile.credits_remaining = 5
        self.profile.save(update_fields=["credits_remaining"])
        # Throttling reads plan config / cache; not what these tests are about.
        self._throttle = mock.patch.object(
            SingleEmailValidationView, "throttle_classes", []
        )
        self._throttle.start()

    def tearDown(self):
        self._throttle.stop()

    def _post(self, **params):
        request = self.factory.post(
            "/validate/", {"email": "user@example.com"}, format="json", **params
        )
        force_authenticate(request, user=self.user)
        return SingleEmailValidationView.as_view()(request)

    def test_returns_verdict_without_writing_the_row_on_the_request_path(self):
        with mock.patch.object(
            views, "verify_email_realtime", return_value=(VALID, False)
        ), mock.patch.object(
            tasks.persist_validation_record_task, "apply_async"
        ) as enqueue:
            response = self._post()

        self.assertEqual(response.status_code, 200)
        body = response.data
        self.assertEqual(body["verification_status"], "valid")
        self.assertEqual(body["sub_status"], "mailbox_exists")
        self.assertTrue(body["is_valid"])
        self.assertEqual(body["mode"], "deep")
        self.assertIn("request_time", body)

        # The row is NOT on the request path — it was handed to a worker...
        enqueue.assert_called_once()
        self.assertFalse(EmailValidation.objects.exists())

        # ...and lands under exactly the id the client was already given.
        tasks.persist_validation_record_task(**enqueue.call_args.kwargs["kwargs"])
        self.assertTrue(EmailValidation.objects.filter(id=body["id"]).exists())

    def test_spends_exactly_one_credit(self):
        with mock.patch.object(
            views, "verify_email_realtime", return_value=(VALID, False)
        ), mock.patch.object(tasks.persist_validation_record_task, "apply_async"):
            self._post()

        self.profile.refresh_from_db()
        self.assertEqual(self.profile.credits_remaining, 4)
        self.assertEqual(self.profile.credits_used_this_month, 1)

    def test_lost_credit_race_is_refused_not_given_away(self):
        # can_use_credits() passed, but the atomic UPDATE found no credit left
        # (a concurrent request took it). The response must be 402, not a free
        # validation.
        with mock.patch.object(
            views, "verify_email_realtime", return_value=(VALID, False)
        ), mock.patch.object(
            BillingProfile, "consume_credits", return_value=False
        ), mock.patch.object(
            tasks.persist_validation_record_task, "apply_async"
        ) as enqueue:
            response = self._post()

        self.assertEqual(response.status_code, 402)
        enqueue.assert_not_called()
        self.assertFalse(EmailValidation.objects.exists())

    def test_fast_mode_is_reported_as_such(self):
        with mock.patch.object(
            views, "verify_email_realtime", return_value=(VALID, True)
        ) as verify, mock.patch.object(
            tasks.persist_validation_record_task, "apply_async"
        ):
            response = self._post(QUERY_STRING="mode=fast")

        self.assertEqual(response.data["mode"], "fast")
        self.assertTrue(response.data["cached"])
        self.assertTrue(verify.call_args.kwargs["fast"])
