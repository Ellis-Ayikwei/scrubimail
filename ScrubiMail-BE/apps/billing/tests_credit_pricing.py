"""Pay-as-you-go credit pricing: quote engine, checkout, fulfillment, admin rules.

The old /purchase-credits/ trusted the client for both the price and the credit
count (pay $1, ask for 10,000 credits). Checkout now re-quotes from the
admin-managed CreditPricingConfig, so these tests pin that the server alone
decides what a payment buys.
"""

from decimal import Decimal
from unittest import mock

from django.contrib.auth import get_user_model
from django.test import TestCase, override_settings
from rest_framework.test import APIRequestFactory, force_authenticate

from apps.billing.credit_pricing import CreditPricer, CreditPricingError, parse_tiers
from apps.billing.models import (
    BillingProfile,
    CreditPackage,
    CreditPricingConfig,
    CreditTransaction,
)
from apps.billing.services import BillingService
from apps.plan.models import Plan
from apps.billing.views import (
    AdminCreditPricingView,
    CreditPackageDetailView,
    CreditPricingQuoteView,
    CreditPricingView,
    CreditPurchaseView,
    ListCreditPackagesView,
)

TIERS = [
    {"from": 1000, "unit_price": "0.0100"},
    {"from": 5000, "unit_price": "0.0080"},
    {"from": 10000, "unit_price": "0.0060"},
]


def make_config(**overrides):
    fields = dict(
        tiers=TIERS,
        tiers_mode="volume",
        currency="USD",
        min_credits=1000,
        max_credits=100000,
        credit_step=100,
    )
    fields.update(overrides)
    config = CreditPricingConfig.get_solo()
    for k, v in fields.items():
        setattr(config, k, v)
    config.save()
    return config


class QuoteEngineTests(TestCase):
    def test_volume_prices_whole_purchase_at_reached_tier(self):
        pricer = CreditPricer(make_config())
        self.assertEqual(pricer.quote_for_credits(1000)["total"], "10.00")
        q = pricer.quote_for_credits(5000)
        self.assertEqual(q["total"], "40.00")
        self.assertEqual(q["tier_index"], 1)
        self.assertEqual(q["savings"], "10.00")  # vs 5000 x base rate

    def test_graduated_sums_each_slice(self):
        pricer = CreditPricer(make_config(tiers_mode="graduated"))
        # 4999 @ .01 + 1001 @ .008 = 49.99 + 8.008 = 57.998 -> 58.00
        self.assertEqual(pricer.quote_for_credits(6000)["total"], "58.00")

    def test_next_tier_nudge(self):
        pricer = CreditPricer(make_config())
        nudge = pricer.quote_for_credits(4500)["next_tier"]
        self.assertEqual(nudge["credits"], 5000)
        self.assertEqual(nudge["credits_needed"], 500)
        # Volume cliff: 4,500 credits cost $45 but 5,000 cost only $40.
        self.assertEqual(nudge["total"], "40.00")
        self.assertIsNone(pricer.quote_for_credits(20000)["next_tier"])

    def test_limits_and_step(self):
        pricer = CreditPricer(make_config())
        for bad in (900, 100100, 1050):
            with self.assertRaises(CreditPricingError):
                pricer.quote_for_credits(bad)

    def test_amount_to_credits_volume_takes_best_tier(self):
        pricer = CreditPricer(make_config())
        # $45 buys 4,500 at tier 0 but 5,600 at tier 1 ($44.80).
        self.assertEqual(pricer.credits_for_amount(Decimal("45")), 5600)
        self.assertEqual(pricer.credits_for_amount(Decimal("10")), 1000)
        # Never more than the cap.
        self.assertEqual(pricer.credits_for_amount(Decimal("100000")), 100000)

    def test_amount_to_credits_never_overcharges(self):
        for mode in ("volume", "graduated"):
            pricer = CreditPricer(make_config(tiers_mode=mode))
            for amount in ("10", "12.34", "57.99", "58", "250", "601.01"):
                credits = pricer.credits_for_amount(Decimal(amount))
                q = pricer.quote_for_credits(credits)
                self.assertLessEqual(Decimal(q["total"]), Decimal(amount), (mode, amount))
                # One more step would exceed the budget (it is the max) unless capped.
                if credits + pricer.step <= pricer.max_credits and mode == "graduated":
                    nxt = pricer.quote_for_credits(credits + pricer.step)
                    self.assertGreater(Decimal(nxt["total"]), Decimal(amount))

    def test_amount_below_minimum(self):
        pricer = CreditPricer(make_config())
        with self.assertRaisesMessage(CreditPricingError, "minimum purchase"):
            pricer.credits_for_amount(Decimal("5"))

    def test_rule_validation(self):
        with self.assertRaises(CreditPricingError):
            parse_tiers([{"from": 1, "unit_price": "0.01"}, {"from": 1, "unit_price": "0.005"}])
        with self.assertRaises(CreditPricingError):
            parse_tiers([{"from": 1, "unit_price": "0.01"}, {"from": 10, "unit_price": "0.02"}])
        with self.assertRaises(CreditPricingError):
            parse_tiers([{"from": 1, "unit_price": "0.0000001"}])
        with self.assertRaises(CreditPricingError):
            CreditPricer(make_config(min_credits=500))  # first tier starts at 1000


LOCMEM = {"default": {"BACKEND": "django.core.cache.backends.locmem.LocMemCache"}}


@override_settings(PAYSTACK_CHARGE_CURRENCY="GHS", PAYSTACK_MIN_GHS_MAJOR="2.00", CACHES=LOCMEM)
class CreditPurchaseCheckoutTests(TestCase):
    def setUp(self):
        self.factory = APIRequestFactory()
        self.user = get_user_model().objects.create_user(email="payg@example.com", password="x")
        make_config()
        self.paystack = mock.Mock()
        self.paystack.initialize_transaction.return_value = {
            "authorization_url": "https://paystack/checkout/x",
            "access_code": "ac",
        }
        patcher = mock.patch("apps.billing.services.PaystackService", return_value=self.paystack)
        patcher.start()
        self.addCleanup(patcher.stop)
        fx = mock.patch("apps.billing.services.get_usd_to_ghs_rate", return_value=Decimal("15"))
        fx.start()
        self.addCleanup(fx.stop)

    def _post(self, data):
        request = self.factory.post("/purchase-credits/", data, format="json")
        force_authenticate(request, user=self.user)
        return CreditPurchaseView.as_view()(request)

    def test_client_cannot_set_price(self):
        # The old exploit: name a tiny amount *and* a big credit count.
        response = self._post({"credits": 10000, "amount": "1.00"})
        self.assertEqual(response.status_code, 400)
        self.paystack.initialize_transaction.assert_not_called()

    def test_credits_request_is_priced_server_side_and_converted(self):
        response = self._post({"credits": 10000})
        self.assertEqual(response.status_code, 200, response.data)
        kwargs = self.paystack.initialize_transaction.call_args.kwargs
        # 10,000 x $0.006 = $60 -> GHS 900 at the mocked rate.
        self.assertEqual(kwargs["amount"], Decimal("900.00"))
        self.assertEqual(kwargs["currency"], "GHS")
        self.assertEqual(kwargs["metadata"]["credits"], 10000)
        self.assertEqual(kwargs["metadata"]["quote_total"], "60.00")
        self.assertEqual(response.data["quote"]["total"], "60.00")

    def test_amount_request_buys_most_credits(self):
        response = self._post({"amount": "45"})
        self.assertEqual(response.status_code, 200, response.data)
        self.assertEqual(response.data["quote"]["credits"], 5600)

    def test_disabled_rules_block_checkout(self):
        make_config(is_enabled=False)
        response = self._post({"credits": 1000})
        self.assertEqual(response.status_code, 400)

    def test_quote_endpoint_reports_charge_estimate(self):
        request = self.factory.get("/credit-pricing/quote/", {"credits": 5000})
        response = CreditPricingQuoteView.as_view()(request)
        self.assertEqual(response.status_code, 200, response.data)
        self.assertEqual(response.data["total"], "40.00")
        self.assertEqual(response.data["charge_estimate"], {"amount": "600.00", "currency": "GHS"})

    def test_public_rules_include_charge_rate(self):
        response = CreditPricingView.as_view()(self.factory.get("/credit-pricing/"))
        self.assertEqual(response.status_code, 200, response.data)
        self.assertEqual(response.data["min_total"], "10.00")
        self.assertEqual(response.data["charge_currency"], "GHS")
        self.assertEqual(response.data["charge_rate"], "15.0000")


class FulfillmentTests(TestCase):
    def setUp(self):
        self.user = get_user_model().objects.create_user(email="ful@example.com", password="x")
        # A plan is required: get_or_create_billing_profile resets planless profiles.
        plan = Plan.objects.create(name="Starter", price=Decimal("0"), credits_per_month=0)
        self.profile = BillingProfile.objects.create(
            user=self.user, credits_remaining=0, current_plan=plan
        )
        self.meta = {
            "user_id": str(self.user.id),
            "type": "credit_purchase",
            "credits": 5000,
            "quote_total": "40.00",
            "charge_amount": "600.00",
            "expiry_days": 365,
        }

    def _service(self):
        with mock.patch("apps.billing.services.PaystackService"):
            return BillingService()

    def test_verify_and_webhook_grant_once(self):
        svc = self._service()
        svc._handle_charge_success(
            {"reference": "ref1", "amount": 60000, "metadata": self.meta}
        )
        svc.paystack.verify_transaction.return_value = {
            "status": "success",
            "amount": 60000,
            "metadata": self.meta,
        }
        out = svc.handle_payment_verification("ref1", self.user)
        self.assertTrue(out["ok"])
        self.profile.refresh_from_db()
        self.assertEqual(self.profile.credits_remaining, 5000)
        self.assertEqual(self.profile.total_amount_spent, Decimal("40.00"))
        txn = CreditTransaction.objects.get(paystack_payment_reference="ref1")
        self.assertIsNotNone(txn.expiry_date)

    def test_underpayment_is_rejected(self):
        svc = self._service()
        svc._handle_charge_success({"reference": "ref2", "amount": 100, "metadata": self.meta})
        self.profile.refresh_from_db()
        self.assertEqual(self.profile.credits_remaining, 0)


@override_settings(CACHES=LOCMEM)
class AdminRulesTests(TestCase):
    def setUp(self):
        self.factory = APIRequestFactory()
        User = get_user_model()
        self.admin = User.objects.create_user(email="admin@example.com", password="x", is_staff=True)
        self.user = User.objects.create_user(email="user@example.com", password="x")

    def _call(self, view, method, user, data=None, **kwargs):
        request = getattr(self.factory, method)("/x/", data, format="json")
        force_authenticate(request, user=user)
        return view.as_view()(request, **kwargs)

    def test_only_admins_edit_rules(self):
        self.assertEqual(self._call(AdminCreditPricingView, "get", self.user).status_code, 403)
        response = self._call(AdminCreditPricingView, "get", self.admin)
        self.assertEqual(response.status_code, 200)
        self.assertTrue(response.data["preview"])

    def test_admin_update_validates_and_normalises(self):
        bad = {"tiers": [{"from": 1000, "unit_price": "0.01"}, {"from": 500, "unit_price": "0.005"}]}
        self.assertEqual(self._call(AdminCreditPricingView, "put", self.admin, bad).status_code, 400)

        good = {
            "tiers": [{"from": "1000", "unit_price": 0.009}, {"from": 20000, "unit_price": "0.005"}],
            "tiers_mode": "graduated",
            "min_credits": 1000,
            "max_credits": 50000,
            "credit_step": 500,
        }
        response = self._call(AdminCreditPricingView, "put", self.admin, good)
        self.assertEqual(response.status_code, 200, response.data)
        config = CreditPricingConfig.get_solo()
        self.assertEqual(config.tiers[0], {"from": 1000, "unit_price": "0.009"})
        self.assertEqual(config.updated_by, self.admin)

    def test_package_writes_are_admin_only(self):
        payload = {"name": "Free money", "credits": 1000000, "price": "0.01"}
        self.assertEqual(self._call(ListCreditPackagesView, "post", self.user, payload).status_code, 403)
        pkg = CreditPackage.objects.create(name="P", credits=100, price=Decimal("1.00"))
        self.assertEqual(
            self._call(CreditPackageDetailView, "put", self.user, {"price": "0.01"}, package_id=pkg.id).status_code,
            403,
        )
        response = self._call(
            CreditPackageDetailView, "put", self.admin, {"price": "2.00"}, package_id=pkg.id
        )
        self.assertEqual(response.status_code, 200, response.data)
        pkg.refresh_from_db()
        self.assertEqual(pkg.price, Decimal("2.00"))
