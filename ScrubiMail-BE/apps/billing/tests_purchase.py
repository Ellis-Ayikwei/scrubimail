"""Regression: the credit-package purchase flow against the lean model.

The model was rewritten to a paystack_reference-based schema, but the view,
serializer and complete_purchase() still referenced older field names
(payment_method / payment_reference / payment_provider / completed_at) that no
longer exist. That made POST /purchase-package/ 500 with a TypeError, and would
have crashed the webhook completion, the serializer, and invoice generation too.

These tests exercise each of those seams against the real model.
"""

from decimal import Decimal
from unittest import mock

from django.contrib.auth import get_user_model
from django.test import TestCase
from rest_framework.test import APIRequestFactory, force_authenticate

from apps.billing.models import BillingProfile, CreditPackage, CreditPackagePurchase
from apps.billing.serializers import CreditPackagePurchaseSerializer
from apps.billing.services import BillingService
from apps.billing.views import PurchaseCreditPackageView
from apps.admin.views import admin_sync_payment


class CreditPackagePurchaseFlowTests(TestCase):
    def setUp(self):
        self.factory = APIRequestFactory()
        self.user = get_user_model().objects.create_user(
            email="buyer@example.com", password="x"
        )
        self.package = CreditPackage.objects.create(
            name="Starter",
            credits=1000,
            price=Decimal("10.00"),
            currency="USD",
            is_active=True,
        )

    def _post(self, data):
        request = self.factory.post("/purchase-package/", data, format="json")
        force_authenticate(request, user=self.user)
        return PurchaseCreditPackageView.as_view()(request)

    def test_purchase_creates_row_and_initializes_payment(self):
        # The reported crash: create() used to be handed fields the model lacks.
        fake_paystack = mock.Mock()
        # Real Paystack echoes back the reference we send; mirror that.
        fake_paystack.initialize_payment.side_effect = lambda **kw: {
            "authorization_url": "https://paystack/checkout/abc",
            "reference": kw["reference"],
            "access_code": "ac_1",
        }
        with mock.patch("apps.billing.views.PaystackService", return_value=fake_paystack):
            response = self._post({"package_id": str(self.package.id)})

        self.assertEqual(response.status_code, 200, response.data)
        self.assertTrue(response.data["success"])

        purchase = CreditPackagePurchase.objects.get()
        self.assertEqual(purchase.credits_purchased, 1000)
        self.assertEqual(purchase.status, "pending")
        # The row carries a reference (satisfies the unique/non-null column)...
        self.assertTrue(purchase.paystack_reference)
        # ...and it is the SAME reference handed to the gateway.
        passed_ref = fake_paystack.initialize_payment.call_args.kwargs["reference"]
        self.assertEqual(purchase.paystack_reference, passed_ref)
        self.assertEqual(response.data["reference"], passed_ref)
        # payment_method has no column; it is preserved in metadata.
        self.assertEqual(purchase.metadata.get("payment_method"), "paystack")

    def test_client_supplied_reference_is_used_verbatim(self):
        # When the client supplies a reference, no gateway init happens and the
        # row stores exactly that reference.
        with mock.patch("apps.billing.views.PaystackService") as svc:
            response = self._post(
                {"package_id": str(self.package.id), "payment_reference": "ext_ref_99"}
            )
        self.assertEqual(response.status_code, 200, response.data)
        svc.assert_not_called()
        self.assertEqual(
            CreditPackagePurchase.objects.get().paystack_reference, "ext_ref_99"
        )

    def test_complete_purchase_adds_credits_and_stamps_metadata(self):
        profile = BillingProfile.objects.create(user=self.user, credits_remaining=0)
        purchase = CreditPackagePurchase.objects.create(
            user=self.user,
            billing_profile=profile,
            package=self.package,
            credits_purchased=1000,
            amount_paid=Decimal("10.00"),
            currency="USD",
            paystack_reference="pkg_complete_1",
            status="pending",
        )

        self.assertTrue(purchase.complete_purchase())
        purchase.refresh_from_db()
        profile.refresh_from_db()

        self.assertEqual(purchase.status, "completed")
        self.assertIsNotNone(purchase.credits_added_date)  # completion marker
        self.assertIn("completed_at", purchase.metadata)  # for serializer/invoice
        self.assertEqual(profile.credits_remaining, 1000)

    def test_serializer_exposes_legacy_field_shape(self):
        # The frontend contract still expects these keys; they must serialize
        # from the real columns / metadata without ImproperlyConfigured.
        purchase = CreditPackagePurchase.objects.create(
            user=self.user,
            billing_profile=BillingProfile.objects.create(user=self.user),
            package=self.package,
            credits_purchased=1000,
            amount_paid=Decimal("10.00"),
            currency="USD",
            paystack_reference="pkg_serialize_1",
            status="pending",
            metadata={"payment_method": "card"},
        )
        data = CreditPackagePurchaseSerializer(purchase).data

        for key in (
            "payment_method",
            "payment_reference",
            "payment_provider",
            "purchased_at",
            "completed_at",
            "failed_at",
            "refunded_at",
        ):
            self.assertIn(key, data)
        self.assertEqual(data["payment_reference"], "pkg_serialize_1")
        self.assertEqual(data["payment_method"], "card")
        self.assertIsNone(data["completed_at"])  # not completed yet


class SyncPaymentStatusTests(TestCase):
    """Admin re-fetches a payment status from Paystack and reconciles locally."""

    def setUp(self):
        self.factory = APIRequestFactory()
        self.admin = get_user_model().objects.create_user(
            email="admin@example.com", password="x", is_staff=True
        )
        self.buyer = get_user_model().objects.create_user(
            email="buyer2@example.com", password="x"
        )
        self.profile = BillingProfile.objects.create(
            user=self.buyer, credits_remaining=0
        )
        self.package = CreditPackage.objects.create(
            name="Pro", credits=500, price=Decimal("20.00"), currency="USD",
            is_active=True,
        )
        self.purchase = CreditPackagePurchase.objects.create(
            user=self.buyer,
            billing_profile=self.profile,
            package=self.package,
            credits_purchased=500,
            amount_paid=Decimal("20.00"),
            currency="USD",
            paystack_reference="pkg_sync_1",
            status="pending",
        )

    def _sync(self):
        request = self.factory.post(f"/payments/{self.purchase.id}/sync/")
        force_authenticate(request, user=self.admin)
        return admin_sync_payment(request, payment_id=self.purchase.id)

    def _verify_returns(self, status_str, txn_id=42):
        return mock.patch(
            "apps.billing.services.PaystackService.verify_transaction",
            return_value={"status": status_str, "id": txn_id, "amount": 2000},
        )

    def test_sync_success_completes_and_grants_credits(self):
        with self._verify_returns("success"):
            response = self._sync()

        self.assertEqual(response.status_code, 200, response.data)
        self.assertTrue(response.data["changed"])
        self.assertEqual(response.data["current_status"], "completed")
        self.profile.refresh_from_db()
        self.assertEqual(self.profile.credits_remaining, 500)
        self.purchase.refresh_from_db()
        self.assertEqual(self.purchase.paystack_transaction_id, "42")

    def test_re_sync_is_idempotent_and_grants_no_extra_credits(self):
        with self._verify_returns("success"):
            self._sync()
            second = self._sync()

        self.assertFalse(second.data["changed"])  # already completed
        self.profile.refresh_from_db()
        self.assertEqual(self.profile.credits_remaining, 500)  # not 1000

    def test_sync_failed_marks_purchase_failed(self):
        with self._verify_returns("failed"):
            response = self._sync()

        self.assertEqual(response.data["current_status"], "failed")
        self.purchase.refresh_from_db()
        self.assertEqual(self.purchase.status, "failed")
        self.assertIn("failed_at", self.purchase.metadata)
        self.profile.refresh_from_db()
        self.assertEqual(self.profile.credits_remaining, 0)

    def test_sync_pending_leaves_untouched(self):
        with self._verify_returns("ongoing"):
            response = self._sync()

        self.assertFalse(response.data["changed"])
        self.assertEqual(response.data["current_status"], "pending")

    def test_paystack_error_returns_502(self):
        with mock.patch(
            "apps.billing.services.PaystackService.verify_transaction",
            side_effect=Exception("Failed to verify transaction: 503"),
        ):
            response = self._sync()

        self.assertEqual(response.status_code, 502)
        self.purchase.refresh_from_db()
        self.assertEqual(self.purchase.status, "pending")  # unchanged

    def test_non_admin_is_forbidden(self):
        request = self.factory.post(f"/payments/{self.purchase.id}/sync/")
        force_authenticate(request, user=self.buyer)  # not staff
        response = admin_sync_payment(request, payment_id=self.purchase.id)
        self.assertEqual(response.status_code, 403)
