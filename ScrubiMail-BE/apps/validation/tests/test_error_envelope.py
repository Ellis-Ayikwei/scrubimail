"""Issue 8 — every non-2xx API response must match the single error envelope
{success, error:{code, message, details:[{field, issue}]}} with a stable,
documented code, and must never leak a raw DRF error dict or a traceback."""

from unittest import mock

from django.contrib.auth import get_user_model
from django.http import Http404
from django.test import SimpleTestCase, TestCase
from rest_framework import exceptions as drf_exc
from rest_framework.test import APIRequestFactory, force_authenticate

from apps.billing.services import BillingService
from apps.validation.views import SingleEmailValidationView
from backend.api_exceptions import BulkLimitExceeded, InsufficientCredits
from backend.exception_handlers import ERROR_CODES, custom_exception_handler

User = get_user_model()
CTX = {"request": None, "view": None}


def _assert_envelope(test, response, *, status_code, code):
    test.assertEqual(response.status_code, status_code)
    body = response.data
    test.assertEqual(set(body.keys()), {"success", "error"})
    test.assertFalse(body["success"])
    err = body["error"]
    test.assertEqual(err["code"], code)
    test.assertIn(code, ERROR_CODES)
    test.assertIsInstance(err["message"], str)
    test.assertIsInstance(err["details"], list)
    for d in err["details"]:
        test.assertEqual(set(d.keys()) >= {"field", "issue"}, True)


class ErrorEnvelopeHandlerTests(SimpleTestCase):
    def test_validation_error_flattens_fields(self):
        exc = drf_exc.ValidationError({"email": ["This field is required."]})
        resp = custom_exception_handler(exc, CTX)
        _assert_envelope(self, resp, status_code=400, code="validation_error")
        self.assertEqual(resp.data["error"]["details"][0]["field"], "email")
        self.assertEqual(resp.data["error"]["message"], "email: This field is required.")

    def test_nested_validation_error_uses_dotted_path(self):
        exc = drf_exc.ValidationError({"profile": {"email": ["Enter a valid email."]}})
        resp = custom_exception_handler(exc, CTX)
        self.assertEqual(resp.data["error"]["details"][0]["field"], "profile.email")

    def test_not_authenticated(self):
        resp = custom_exception_handler(drf_exc.NotAuthenticated(), CTX)
        _assert_envelope(self, resp, status_code=401, code="authentication_required")

    def test_authentication_failed(self):
        resp = custom_exception_handler(drf_exc.AuthenticationFailed(), CTX)
        _assert_envelope(self, resp, status_code=401, code="invalid_credentials")

    def test_permission_denied(self):
        resp = custom_exception_handler(drf_exc.PermissionDenied(), CTX)
        _assert_envelope(self, resp, status_code=403, code="permission_denied")

    def test_not_found(self):
        resp = custom_exception_handler(drf_exc.NotFound(), CTX)
        _assert_envelope(self, resp, status_code=404, code="not_found")

    def test_django_http404(self):
        resp = custom_exception_handler(Http404("nope"), CTX)
        _assert_envelope(self, resp, status_code=404, code="not_found")

    def test_throttled_puts_retry_after_in_meta_not_top_level(self):
        resp = custom_exception_handler(drf_exc.Throttled(wait=30), CTX)
        _assert_envelope(self, resp, status_code=429, code="rate_limit_exceeded")
        self.assertEqual(resp.data["error"]["meta"]["retry_after"], 30)
        # retry_after must NOT be at the top level.
        self.assertNotIn("retry_after", resp.data)

    def test_insufficient_credits(self):
        resp = custom_exception_handler(InsufficientCredits("no credits"), CTX)
        _assert_envelope(self, resp, status_code=402, code="insufficient_credits")

    def test_bulk_limit_exceeded_meta(self):
        exc = BulkLimitExceeded(detail="too many", limit=100, requested=250)
        resp = custom_exception_handler(exc, CTX)
        _assert_envelope(self, resp, status_code=429, code="rate_limit_exceeded")
        self.assertEqual(resp.data["error"]["meta"]["limit"], 100)
        self.assertEqual(resp.data["error"]["meta"]["requested"], 250)

    def test_unhandled_exception_is_generic_500(self):
        resp = custom_exception_handler(RuntimeError("secret internals"), CTX)
        _assert_envelope(self, resp, status_code=500, code="internal_error")
        # No exception text / traceback leaks.
        self.assertNotIn("secret internals", str(resp.data))
        self.assertEqual(resp.data["error"]["details"], [])


class ErrorEnvelopeViewTests(TestCase):
    def setUp(self):
        self.user = User.objects.create_user(email="err@example.com", password="x")
        self.profile = BillingService().get_or_create_billing_profile(self.user)
        self.factory = APIRequestFactory()

    def _post_single(self, data):
        request = self.factory.post(
            "/scrubimail/api/v1/validate/", data, format="json"
        )
        force_authenticate(request, user=self.user)
        with mock.patch.object(SingleEmailValidationView, "throttle_classes", []):
            return SingleEmailValidationView.as_view()(request)

    def test_insufficient_credits_returns_envelope(self):
        self.profile.credits_remaining = 0
        self.profile.save(update_fields=["credits_remaining"])
        resp = self._post_single({"email": "user@example.com"})
        _assert_envelope(self, resp, status_code=402, code="insufficient_credits")

    def test_invalid_input_returns_validation_envelope(self):
        resp = self._post_single({"email": "not-an-email"})
        _assert_envelope(self, resp, status_code=400, code="validation_error")
        # The raw DRF shape {"email": [...]} must not be the body.
        self.assertNotIn("email", resp.data)
        self.assertEqual(resp.data["error"]["details"][0]["field"], "email")
