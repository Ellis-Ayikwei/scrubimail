"""The single-validation request must fetch the caller's BillingProfile ONCE,
not once per throttle plus once in the view.

Before the request-scoped memo, POST /validate/ issued the same
`SELECT ... FROM billing_billingprofile` three times before verification even
started (PlanBasedRateThrottle, PlanFeatureThrottle, the view), each holding the
DB connection that is then pinned across the multi-second egress wait. These
tests pin the fetch down so the redundancy can't creep back.
"""

from unittest import mock

from django.contrib.auth import get_user_model
from django.db import connection
from django.test import TestCase, override_settings
from django.test.utils import CaptureQueriesContext
from rest_framework.test import APIRequestFactory, force_authenticate

from apps.billing.models import BillingProfile
from apps.billing.services import BillingService, get_billing_profile_for_request
from apps.validation import tasks, views
from apps.validation.advanced_validator import ValidationResult
from apps.validation.views import SingleEmailValidationView


class _Req:
    """Minimal stand-in for a request: a plain object the helper can read
    `.user` from and stash `._billing_profile` on (no Mock auto-attributes)."""

    def __init__(self, user):
        self.user = user

VALID = ValidationResult(
    is_valid=True,
    score=95,
    verdict="Valid",
    breakdown={"syntax": {"valid": True}},
    suggestions=[],
    warnings=[],
    metadata={"status": "valid", "sub_status": "mailbox_exists", "validation_time": 0.1},
)


# Real table name (custom db_table via Basemodel), not the app_label default.
_PROFILE_TABLE = BillingProfile._meta.db_table


def _profile_selects(captured):
    return [
        q["sql"]
        for q in captured
        if _PROFILE_TABLE in q["sql"].lower()
        and q["sql"].lstrip().lower().startswith("select")
    ]


class ProfileMemoHelperTests(TestCase):
    def setUp(self):
        self.user = get_user_model().objects.create_user(
            email="memo@example.com", password="x"
        )
        BillingService().get_or_create_billing_profile(self.user)

    def test_second_call_on_same_request_hits_no_db(self):
        req = _Req(self.user)

        with CaptureQueriesContext(connection) as first:
            p1 = get_billing_profile_for_request(req)
        with CaptureQueriesContext(connection) as second:
            p2 = get_billing_profile_for_request(req)

        self.assertIsNotNone(p1)
        self.assertIs(p1, p2)  # same instance handed back
        self.assertEqual(len(_profile_selects(first.captured_queries)), 1)
        self.assertEqual(len(_profile_selects(second.captured_queries)), 0)

    def test_absent_profile_is_cached_as_none(self):
        other = get_user_model().objects.create_user(email="noprof@example.com", password="x")
        BillingProfile.objects.filter(user=other).delete()
        req = _Req(other)

        self.assertIsNone(get_billing_profile_for_request(req))
        with CaptureQueriesContext(connection) as again:
            self.assertIsNone(get_billing_profile_for_request(req))
        self.assertEqual(len(_profile_selects(again.captured_queries)), 0)


@override_settings(
    CACHES={"default": {"BACKEND": "django.core.cache.backends.locmem.LocMemCache"}}
)
class SingleEndpointProfileFetchTests(TestCase):
    """Full request WITH throttles active — the real redundancy path."""

    def setUp(self):
        self.factory = APIRequestFactory()
        self.user = get_user_model().objects.create_user(
            email="dedup@example.com", password="x"
        )
        self.profile = BillingService().get_or_create_billing_profile(self.user)
        self.profile.credits_remaining = 50
        self.profile.save(update_fields=["credits_remaining"])

    def _post(self):
        request = self.factory.post(
            "/validate/", {"email": "user@example.com"}, format="json"
        )
        force_authenticate(request, user=self.user)
        return SingleEmailValidationView.as_view()(request)

    def test_profile_selected_at_most_twice_across_throttles_and_view(self):
        with mock.patch.object(
            views, "verify_email_realtime", return_value=(VALID, False)
        ), mock.patch.object(tasks.persist_validation_record_task, "apply_async"):
            with CaptureQueriesContext(connection) as ctx:
                response = self._post()

        self.assertEqual(response.status_code, 200)
        selects = _profile_selects(ctx.captured_queries)
        # One shared read (throttles + view) + one refresh_from_db inside
        # consume_credits. Was 4 before the request-scoped memo.
        self.assertLessEqual(
            len(selects),
            2,
            msg=f"expected <=2 BillingProfile SELECTs, got {len(selects)}:\n"
            + "\n".join(selects),
        )

    def test_rate_limit_still_enforced_through_rewritten_throttle(self):
        # The dedup rewrote PlanBasedRateThrottle; enforcement must still fire.
        plan = self.profile.current_plan
        plan.max_api_calls_per_hour = 1
        plan.save(update_fields=["max_api_calls_per_hour"])

        with mock.patch.object(
            views, "verify_email_realtime", return_value=(VALID, False)
        ), mock.patch.object(tasks.persist_validation_record_task, "apply_async"):
            first = self._post()
            second = self._post()

        self.assertEqual(first.status_code, 200)
        self.assertEqual(second.status_code, 429)  # over the 1/hour cap
