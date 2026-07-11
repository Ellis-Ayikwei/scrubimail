"""Issue 10 — payment/billing hardening: mandatory webhook signature,
idempotency, atomic credit consumption, no retry-inducing 5xx, GHS/USD-safe
credit math (never a raw amount cast)."""

import hashlib
import hmac
import json

from django.contrib.auth import get_user_model
from django.test import TestCase, override_settings
from rest_framework.test import APIRequestFactory

from apps.billing.models import BillingProfile, ProcessedWebhookEvent
from apps.billing.views import paystack_webhook

User = get_user_model()
SECRET = "whsec_test_secret"


def _sign(body: bytes, secret: str = SECRET) -> str:
    return hmac.new(secret.encode("utf-8"), body, hashlib.sha512).hexdigest()


def _post(event: dict, signature=None, secret=SECRET):
    body = json.dumps(event).encode("utf-8")
    sig = signature if signature is not None else _sign(body, secret)
    factory = APIRequestFactory()
    kwargs = {"data": body, "content_type": "application/json"}
    if sig is not False:
        kwargs["HTTP_X_PAYSTACK_SIGNATURE"] = sig
    request = factory.post("/scrubimail/api/v1/billing/webhook/paystack/", **kwargs)
    return paystack_webhook(request)


@override_settings(
    PAYSTACK_WEBHOOK_SECRET=SECRET,
    PAYSTACK_SECRET_KEY="sk_test_x",
    PAYSTACK_PUBLIC_KEY="pk_test_x",
)
class WebhookSecurityTests(TestCase):
    def setUp(self):
        self.user = User.objects.create_user(email="pay@example.com", password="x")
        self.profile = BillingProfile.objects.create(user=self.user)
        self.profile.credits_remaining = 0
        self.profile.save(update_fields=["credits_remaining"])

    def _charge_event(self, credits=100, reference="ref_100"):
        return {
            "event": "charge.success",
            "data": {
                "reference": reference,
                "amount": 9999999,  # deliberately huge — must be IGNORED
                "customer": {"customer_code": "CUS_x"},
                "metadata": {
                    "type": "credit_purchase",
                    "user_id": str(self.user.id),
                    "credits": credits,
                },
            },
        }

    def test_missing_signature_rejected(self):
        resp = _post(self._charge_event(), signature=False)
        self.assertEqual(resp.status_code, 400)
        self.profile.refresh_from_db()
        self.assertEqual(self.profile.credits_remaining, 0)

    def test_forged_signature_rejected_no_side_effects(self):
        resp = _post(self._charge_event(), signature="deadbeef")
        self.assertEqual(resp.status_code, 401)
        self.assertEqual(ProcessedWebhookEvent.objects.count(), 0)
        self.profile.refresh_from_db()
        self.assertEqual(self.profile.credits_remaining, 0)

    @override_settings(PAYSTACK_WEBHOOK_SECRET=None)
    def test_unset_secret_never_applies_credits(self):
        resp = _post(self._charge_event(), secret="anything")
        self.assertEqual(resp.status_code, 500)
        self.profile.refresh_from_db()
        self.assertEqual(self.profile.credits_remaining, 0)

    def test_duplicate_event_credits_once(self):
        event = self._charge_event(credits=100, reference="ref_dup")
        r1 = _post(event)
        self.assertEqual(r1.status_code, 200)
        self.profile.refresh_from_db()
        self.assertEqual(self.profile.credits_remaining, 100)

        # Same event delivered again (Paystack retry) must NOT double-credit.
        r2 = _post(event)
        self.assertEqual(r2.status_code, 200)
        self.assertEqual(r2.data["status"], "already_processed")
        self.profile.refresh_from_db()
        self.assertEqual(self.profile.credits_remaining, 100)
        self.assertEqual(ProcessedWebhookEvent.objects.count(), 1)

    def test_credits_from_metadata_not_amount(self):
        # amount is 9,999,999 minor units; credits must be the catalog value (50).
        _post(self._charge_event(credits=50, reference="ref_ccy"))
        self.profile.refresh_from_db()
        self.assertEqual(self.profile.credits_remaining, 50)

    def test_handler_failure_returns_200_and_rolls_back(self):
        # credit_package with a non-existent purchase -> handler raises. The
        # webhook must NOT 5xx (no retry storm) and must roll back the marker.
        event = {
            "event": "charge.success",
            "data": {
                "reference": "ref_bad",
                "metadata": {"type": "credit_package", "purchase_id": "00000000-0000-0000-0000-000000000000"},
            },
        }
        resp = _post(event)
        self.assertEqual(resp.status_code, 200)
        self.assertEqual(ProcessedWebhookEvent.objects.count(), 0)  # rolled back


class AtomicConsumeCreditsTests(TestCase):
    def setUp(self):
        self.user = User.objects.create_user(email="c@example.com", password="x")
        self.profile = BillingProfile.objects.create(user=self.user)

    def _set_credits(self, n):
        self.profile.credits_remaining = n
        self.profile.save(update_fields=["credits_remaining"])

    def test_cannot_overspend_below_zero(self):
        self._set_credits(1)
        self.assertTrue(self.profile.consume_credits(1))
        self.profile.refresh_from_db()
        self.assertEqual(self.profile.credits_remaining, 0)
        # No credits left — the next consume must fail, balance stays at 0.
        self.assertFalse(self.profile.consume_credits(1))
        self.profile.refresh_from_db()
        self.assertEqual(self.profile.credits_remaining, 0)

    def test_insufficient_amount_is_rejected_atomically(self):
        self._set_credits(3)
        self.assertFalse(self.profile.consume_credits(5))
        self.profile.refresh_from_db()
        self.assertEqual(self.profile.credits_remaining, 3)  # unchanged
