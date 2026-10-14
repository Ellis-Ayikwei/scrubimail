import requests
import json
import logging
import uuid
from django.conf import settings
from django.utils import timezone
from datetime import datetime, timedelta
from decimal import Decimal, ROUND_HALF_UP
from .models import BillingProfile, CreditTransaction, Subscription
from .fx_rates import get_usd_to_ghs_rate
from apps.plan.models import Plan

logger = logging.getLogger(__name__)

# Sentinel telling "not fetched yet" apart from "fetched, and the user has no
# profile" (None), so the request-scoped memo below caches negative lookups too.
_UNSET = object()


def get_billing_profile_for_request(request):
    """Fetch the request user's BillingProfile once per request, memoized on the
    request object. READ-ONLY: unlike ``BillingService.get_or_create_billing_profile``
    it never creates a profile nor resets credits.

    The single-validation path otherwise fetches this same profile up to three
    times before verification even starts — ``PlanBasedRateThrottle``,
    ``PlanFeatureThrottle`` and the view — each an identical SELECT holding the DB
    connection that is then pinned across the multi-second egress wait. Sharing one
    fetch removes the two redundant round trips. Returns None when no profile exists.
    """
    cached = getattr(request, "_billing_profile", _UNSET)
    if cached is not _UNSET:
        return cached
    profile = (
        BillingProfile.objects.select_related("current_plan")
        .filter(user=request.user)
        .first()
    )
    request._billing_profile = profile
    return profile


def _to_paystack_minor_units(amount):
    """Major currency units → smallest unit (kobo, pesewas, cents, etc.)."""
    d = Decimal(str(amount))
    return int((d * 100).to_integral_value(rounding=ROUND_HALF_UP))


def resolve_paystack_charge(amount, currency, label=""):
    """
    Map a catalog price (e.g. USD in DB) to (amount_major, currency) for Paystack.

    - If PAYSTACK_CHARGE_CURRENCY matches ``currency``: no conversion.
    - If the price is USD and charge currency is GHS: amount = price * live rate
      (CurrencyFreaks, cached) with PAYSTACK_FX_BUFFER, else PAYSTACK_FX_USD_TO_GHS fallback.

    When Paystack enables USD: set PAYSTACK_CHARGE_CURRENCY=USD and keep catalog prices in USD.
    """
    catalog_ccy = (currency or "USD").strip().upper()
    charge_ccy = (getattr(settings, "PAYSTACK_CHARGE_CURRENCY", None) or "").strip().upper()
    if not charge_ccy:
        charge_ccy = catalog_ccy

    price = Decimal(str(amount))

    if charge_ccy == catalog_ccy:
        charge = price
    elif catalog_ccy == "USD" and charge_ccy == "GHS":
        rate = get_usd_to_ghs_rate()
        if rate is None or rate <= 0:
            raise ValueError(
                "Could not resolve USD→GHS rate: set CURRENCYFREAKS_API_KEY or a positive "
                "PAYSTACK_FX_USD_TO_GHS fallback."
            )
        charge = (price * rate).quantize(Decimal("0.01"), rounding=ROUND_HALF_UP)
        logger.info(
            "Paystack pricing: USD %s → GHS %s (rate=%s, %s)", price, charge, rate, label
        )
    else:
        raise ValueError(
            f"No Paystack FX rule from catalog currency {catalog_ccy} to "
            f"PAYSTACK_CHARGE_CURRENCY={charge_ccy}. Align the catalog currency with "
            "PAYSTACK_CHARGE_CURRENCY or extend resolve_paystack_charge()."
        )

    if charge_ccy == "GHS":
        min_ghs = Decimal(str(getattr(settings, "PAYSTACK_MIN_GHS_MAJOR", "2.00")))
        if charge < min_ghs:
            raise ValueError(
                f"Converted charge {charge} GHS is below Paystack minimum {min_ghs} GHS "
                f"({label}). Raise the price, FX buffer/rate, or fallback."
            )

    return charge, charge_ccy


def resolve_paystack_plan_charge(plan):
    """Plan price → (amount_major, currency) for Paystack. See resolve_paystack_charge."""
    return resolve_paystack_charge(plan.price, plan.currency, label=f"plan={plan.name}")


class PaystackService:
    """Service class for Paystack integration"""

    def __init__(self):
        self.secret_key = settings.PAYSTACK_SECRET_KEY
        self.public_key = settings.PAYSTACK_PUBLIC_KEY
        self.base_url = "https://api.paystack.co"
        
        # Validate credentials
        if not self.secret_key or not self.public_key:
            raise ValueError(
                "Paystack credentials not configured. Please set PAYSTACK_SECRET_KEY "
                "and PAYSTACK_PUBLIC_KEY in your environment variables."
            )
        
        self.headers = {
            "Authorization": f"Bearer {self.secret_key}",
            "Content-Type": "application/json",
        }

    def create_customer(self, user, email, first_name=None, last_name=None):
        """Create a Paystack customer"""
        url = f"{self.base_url}/customer"
        data = {
            "email": email,
            "first_name": first_name or user.first_name,
            "last_name": last_name or user.last_name,
        }

        response = requests.post(url, headers=self.headers, json=data)
        try:
            payload = response.json()
        except ValueError as e:
            raise Exception(f"Invalid Paystack response: {response.text}") from e

        # Paystack may return 200 (e.g. existing customer) or 201; trust JSON status + data
        if response.status_code in (200, 201) and payload.get("status") and payload.get(
            "data"
        ):
            return payload["data"]
        raise Exception(f"Failed to create customer: {response.text}")

    def initialize_transaction(
        self, email, amount, reference, callback_url=None, metadata=None, currency=None
    ):
        """Initialize a payment transaction (``amount`` in major units)."""
        url = f"{self.base_url}/transaction/initialize"
        data = {
            "email": email,
            "amount": _to_paystack_minor_units(amount),
            "reference": reference,
            "callback_url": callback_url,
            "metadata": metadata or {},
        }
        if currency:
            data["currency"] = currency

        response = requests.post(url, headers=self.headers, json=data)
        if response.status_code == 200:
            return response.json()["data"]
        else:
            raise Exception(f"Failed to initialize transaction: {response.text}")

    def initialize_subscription_checkout(
        self,
        email,
        plan_code,
        reference,
        callback_url=None,
        metadata=None,
        customer_code=None,
        amount_minor=None,
    ):
        """
        Start a subscription for a customer who has no saved card yet.

        Paystack POST /subscription requires an existing authorization; this uses
        POST /transaction/initialize with ``plan`` so the user pays on authorization_url
        and Paystack creates the subscription after success (see webhooks).
        """
        url = f"{self.base_url}/transaction/initialize"
        data = {
            "email": email,
            "plan": plan_code,
            "reference": reference,
        }
        if callback_url:
            data["callback_url"] = callback_url
        if metadata:
            data["metadata"] = metadata
        if customer_code:
            data["customer"] = customer_code
        if amount_minor is not None:
            data["amount"] = amount_minor

        response = requests.post(url, headers=self.headers, json=data)
        try:
            payload = response.json()
        except ValueError as e:
            raise Exception(f"Invalid Paystack response: {response.text}") from e
        if response.status_code == 200 and payload.get("status") and payload.get(
            "data"
        ):
            return payload["data"]
        raise Exception(
            f"Failed to initialize subscription checkout: {response.text}"
        )

    def initialize_payment(
        self,
        email,
        amount,
        metadata=None,
        reference=None,
        currency=None,
    ):
        """One-off Paystack checkout (e.g. credit packages)."""
        ref = reference or f"pkg_{uuid.uuid4().hex[:20]}"
        callback_url = getattr(settings, "PAYMENT_SUCCESS_URL", None) or (
            f"{getattr(settings, 'FRONTEND_URL', '')}/billing/payment/success"
        )
        data = self.initialize_transaction(
            email,
            amount,
            ref,
            callback_url=callback_url,
            metadata=metadata or {},
            currency=currency,
        )
        return {
            "authorization_url": data.get("authorization_url"),
            "access_code": data.get("access_code"),
            "reference": data.get("reference") or ref,
        }

    def verify_transaction(self, reference):
        """Verify a payment transaction"""
        url = f"{self.base_url}/transaction/verify/{reference}"
        response = requests.get(url, headers=self.headers)

        if response.status_code == 200:
            return response.json()["data"]
        else:
            raise Exception(f"Failed to verify transaction: {response.text}")

    def create_plan(
        self, name, amount, interval, description=None, currency=None
    ):
        """Create a subscription plan. Amount is in major units; currency must match the plan."""
        minor = _to_paystack_minor_units(amount)
        if minor <= 0:
            raise ValueError(
                "Plan price must be greater than zero to create a Paystack plan."
            )
        currency = currency or getattr(
            settings, "PAYSTACK_CHARGE_CURRENCY", None
        ) or getattr(settings, "PAYSTACK_CURRENCY", "NGN")
        url = f"{self.base_url}/plan"
        data = {
            "name": name,
            "amount": minor,
            "interval": interval,
            "description": description or f"ScrubiMail {name} Plan",
            "currency": currency,
        }

        response = requests.post(url, headers=self.headers, json=data)
        try:
            payload = response.json()
        except ValueError as e:
            raise Exception(f"Invalid Paystack response: {response.text}") from e
        if response.status_code in (200, 201) and payload.get("status") and payload.get(
            "data"
        ):
            return payload["data"]
        raise Exception(f"Failed to create plan: {response.text}")

    def create_subscription(self, customer_id, plan_code, start_date=None):
        """Create a subscription for a customer"""
        url = f"{self.base_url}/subscription"
        data = {
            "customer": customer_id,
            "plan": plan_code,
            "start": start_date or timezone.now().isoformat(),
        }

        response = requests.post(url, headers=self.headers, json=data)
        if response.status_code == 201:
            return response.json()["data"]
        else:
            raise Exception(f"Failed to create subscription: {response.text}")

    def get_subscription(self, subscription_id):
        """Get subscription details"""
        url = f"{self.base_url}/subscription/{subscription_id}"
        response = requests.get(url, headers=self.headers)

        if response.status_code == 200:
            return response.json()["data"]
        else:
            raise Exception(f"Failed to get subscription: {response.text}")

    def cancel_subscription(self, subscription_id):
        """Cancel a subscription"""
        url = f"{self.base_url}/subscription/{subscription_id}/disable"
        response = requests.post(url, headers=self.headers)

        if response.status_code == 200:
            return response.json()["data"]
        else:
            raise Exception(f"Failed to cancel subscription: {response.text}")

    def get_customer(self, customer_id):
        """Get customer details"""
        url = f"{self.base_url}/customer/{customer_id}"
        response = requests.get(url, headers=self.headers)

        if response.status_code == 200:
            return response.json()["data"]
        else:
            raise Exception(f"Failed to get customer: {response.text}")


class BillingService:
    """Service class for billing operations"""

    def __init__(self):
        self.paystack = PaystackService()

    def get_or_create_billing_profile(self, user, request=None):
        """Get or create billing profile for user with Free plan assigned by default"""
        from apps.plan.models import Plan

        # Reuse a profile already loaded on this request (e.g. by a throttle) when
        # it is safe: an existing profile that already has a plan is exactly what
        # this method returns without side effects, so skip the extra queries. A
        # planless/absent cached value falls through to the create-and-assign logic
        # below (which resets credits) — preserving existing behavior exactly.
        if request is not None:
            cached = getattr(request, "_billing_profile", None)
            if cached is not None and cached.current_plan_id:
                return cached

        # Get or create Free plan (use existing if setup_plans was run, otherwise create with defaults)
        free_plan, _ = Plan.objects.get_or_create(
            name='Free',
            defaults={
                'description': 'Perfect for getting started with email validation',
                'price': 0.00,
                'currency': 'USD',
                'credits_per_month': 100,  # Default, can be updated by setup_plans command
                'additional_credit_price': 0.01,
                'max_api_calls_per_hour': 10,
                'max_bulk_emails': 50,
                'supports_api': True,
                'supports_bulk': False,
                'priority_support': False,
                'trial_days': 0,
                'is_active': True,
            }
        )
        
        profile, created = BillingProfile.objects.get_or_create(
            user=user,
            defaults={
                "credits_remaining": free_plan.credits_per_month,
                "billing_status": "active",
                "current_plan": free_plan,
            }
        )
        
        # If profile exists but has no plan, assign Free plan
        if not created and not profile.current_plan:
            profile.current_plan = free_plan
            profile.credits_remaining = free_plan.credits_per_month
            profile.save(update_fields=['current_plan', 'credits_remaining'])

        if request is not None:
            request._billing_profile = profile
        return profile

    def initialize_credit_purchase(self, user, credits=None, amount=None):
        """Start a pay-as-you-go credit purchase.

        The caller names *either* how many credits it wants or how much it wants
        to spend; the price/credit count always comes from the admin pricing
        rules (``credit_pricing``), never from the client.
        """
        from .credit_pricing import CreditPricingError, get_pricer

        pricer = get_pricer()
        if not pricer.config.is_enabled:
            raise CreditPricingError("Custom credit purchases are currently unavailable.")
        quote = pricer.quote(credits=credits, amount=amount)

        charge_amount, charge_currency = resolve_paystack_charge(
            quote["total"], quote["currency"], label=f"credits={quote['credits']}"
        )
        reference = f"credits_{user.id}_{uuid.uuid4().hex[:16]}"
        success_cb = getattr(settings, "PAYMENT_SUCCESS_URL", None) or (
            f"{settings.FRONTEND_URL}/billing/payment/success"
        )
        transaction_data = self.paystack.initialize_transaction(
            email=user.email,
            amount=charge_amount,
            reference=reference,
            callback_url=success_cb,
            currency=charge_currency,
            metadata={
                "user_id": str(user.id),
                "type": "credit_purchase",
                "credits": quote["credits"],
                "quote_total": quote["total"],
                "quote_currency": quote["currency"],
                "unit_price": quote["effective_unit_price"],
                "tiers_mode": quote["tiers_mode"],
                "charge_amount": str(charge_amount),
                "charge_currency": charge_currency,
                "expiry_days": quote["expiry_days"],
            },
        )

        return {
            "authorization_url": transaction_data["authorization_url"],
            "access_code": transaction_data["access_code"],
            "reference": reference,
            "quote": quote,
            "charge_amount": str(charge_amount),
            "charge_currency": charge_currency,
        }

    def fulfill_credit_purchase(self, profile, reference, metadata, paid_minor=None):
        """Grant a pay-as-you-go purchase exactly once.

        Shared by the verify endpoint and the charge.success webhook, which can
        race: the profile row lock + reference check makes the second caller a
        no-op. Returns True if credits were granted by this call.
        """
        from django.db import transaction as db_transaction

        try:
            credits = int(metadata.get("credits") or 0)
        except (TypeError, ValueError):
            credits = 0
        if credits <= 0:
            raise ValueError("Invalid or missing credit amount in transaction")

        expected = metadata.get("charge_amount")
        if expected is not None and paid_minor is not None:
            if int(paid_minor) < _to_paystack_minor_units(expected):
                raise ValueError(
                    f"Paid amount {paid_minor} is below the quoted charge {expected}"
                )

        try:
            expiry_days = int(metadata.get("expiry_days") or 0) or None
        except (TypeError, ValueError):
            expiry_days = None

        with db_transaction.atomic():
            locked = BillingProfile.objects.select_for_update().get(pk=profile.pk)
            if CreditTransaction.objects.filter(
                billing_profile=locked, paystack_payment_reference=reference
            ).exists():
                return False
            locked.add_credits(
                amount=credits,
                description=f"Credit purchase - {credits:,} credits",
                payment_reference=reference,
                expiry_days=expiry_days,
            )
            try:
                spent = Decimal(str(metadata.get("quote_total") or 0))
            except Exception:
                spent = Decimal("0")
            locked.total_amount_spent += spent
            locked.save(update_fields=["total_amount_spent"])
        return True

    def initialize_plan_upgrade(self, user, plan):
        """
        Initialize plan upgrade: ensure Paystack customer + plan exist, then open checkout.

        Uses transaction/initialize + ``plan`` so the user can add a card; Paystack
        rejects POST /subscription without a saved authorization (no_active_authorizations).
        After payment, subscription.create webhook updates the billing profile.
        """
        profile = self.get_or_create_billing_profile(user)

        # Create Paystack customer if not exists
        if not profile.paystack_customer_id:
            customer_data = self.paystack.create_customer(user=user, email=user.email)
            profile.paystack_customer_id = customer_data["customer_code"]
            profile.save()

        # Create or get Paystack plan (amount/currency may differ from DB when FX is applied)
        if not plan.paystack_plan_code:
            charge_amount, charge_currency = resolve_paystack_plan_charge(plan)
            paystack_plan = self.paystack.create_plan(
                name=plan.name,
                amount=charge_amount,
                interval="monthly",
                description=plan.description,
                currency=charge_currency,
            )
            plan.paystack_plan_code = paystack_plan["plan_code"]
            plan.save()

        charge_amount, _charge_currency = resolve_paystack_plan_charge(plan)
        amount_minor = _to_paystack_minor_units(charge_amount)
        reference = f"planup_{user.id}_{uuid.uuid4().hex[:16]}"

        checkout = self.paystack.initialize_subscription_checkout(
            email=user.email,
            plan_code=plan.paystack_plan_code,
            reference=reference,
            callback_url=getattr(settings, "PAYMENT_SUCCESS_URL", None)
            or f"{getattr(settings, 'FRONTEND_URL', '')}/billing/payment/success",
            metadata={
                "user_id": str(user.id),
                "plan_id": str(plan.id),
                "type": "plan_upgrade",
            },
            customer_code=profile.paystack_customer_id,
            amount_minor=amount_minor,
        )

        return {
            "authorization_url": checkout["authorization_url"],
            "access_code": checkout.get("access_code"),
            "reference": reference,
            "subscription_pending": True,
        }

    def handle_payment_verification(self, reference, user):
        """
        Verify a Paystack transaction server-side and apply fulfillment when safe.

        Returns a dict: ok, message, payment_type, paystack_status.
        Always checks metadata.user_id matches ``user`` before mutating data.
        """
        out = {
            "ok": False,
            "message": "",
            "payment_type": None,
            "paystack_status": None,
        }
        if not reference:
            out["message"] = "Reference is required"
            return out
        if user is None or not getattr(user, "is_authenticated", False):
            out["message"] = "Authentication required"
            return out

        try:
            transaction_data = self.paystack.verify_transaction(reference)
        except Exception as e:
            logger.exception("Paystack verify failed reference=%s", reference)
            out["message"] = str(e)
            return out

        paystack_status = transaction_data.get("status")
        out["paystack_status"] = paystack_status
        if paystack_status != "success":
            out["message"] = "Transaction was not successful"
            return out

        metadata = transaction_data.get("metadata") or {}
        if not isinstance(metadata, dict):
            metadata = {}

        uid = metadata.get("user_id")
        if uid is None or str(uid) != str(user.id):
            out["message"] = "This payment is not linked to your account"
            return out

        trans_type = (metadata.get("type") or "").strip() or "credit_purchase"

        if trans_type == "credit_package":
            from .models import CreditPackagePurchase

            out["payment_type"] = "credit_package"
            purchase_id = metadata.get("purchase_id")
            if not purchase_id:
                out["message"] = "Missing purchase reference in payment metadata"
                return out
            try:
                purchase = CreditPackagePurchase.objects.select_related(
                    "package", "billing_profile"
                ).get(id=purchase_id, user=user)
            except CreditPackagePurchase.DoesNotExist:
                out["message"] = "Purchase record not found"
                return out
            if purchase.status == "pending":
                purchase.complete_purchase()
                out["message"] = "Payment verified. Credits have been added to your account."
            else:
                out["message"] = "Payment was already applied to your account."
            out["ok"] = True
            return out

        if trans_type == "plan_upgrade":
            out["payment_type"] = "plan_upgrade"
            out["ok"] = True
            out["message"] = (
                "Payment confirmed with Paystack. If your plan has not updated yet, "
                "wait a moment and open Billing again — subscription activation is usually automatic."
            )
            return out

        if trans_type == "credit_purchase":
            out["payment_type"] = "credit_purchase"
            profile = self.get_or_create_billing_profile(user)
            try:
                granted = self.fulfill_credit_purchase(
                    profile, reference, metadata, transaction_data.get("amount")
                )
            except ValueError as e:
                logger.error("credit_purchase verify %s rejected: %s", reference, e)
                out["message"] = str(e)
                return out
            out["ok"] = True
            out["message"] = (
                "Payment verified. Credits have been added to your account."
                if granted
                else "Payment was already applied to your account."
            )
            return out

        out["payment_type"] = trans_type
        out["ok"] = True
        out["message"] = "Payment confirmed with Paystack."
        return out

    def sync_purchase_status(self, purchase):
        """Re-fetch a credit-package purchase's status from Paystack and
        reconcile the local record. Manual counterpart to the charge.success
        webhook, for when a webhook was missed or delayed.

        Idempotent and safe to call repeatedly:
          * Paystack `success`  -> complete_purchase() (grants credits, stamps
            completed_at). complete_purchase() is a no-op if already completed,
            so credits are never granted twice.
          * `failed`/`abandoned`/`reversed` -> mark the purchase failed (records
            failed_at); never touches an already-completed purchase.
          * anything else (pending/ongoing) -> leave untouched.

        Returns a summary dict describing what the gateway said and whether the
        local record changed. Raises on a Paystack API/transport error so the
        caller can surface it (never silently reports "synced").
        """
        reference = purchase.paystack_reference
        data = self.paystack.verify_transaction(reference)  # raises on non-200
        gateway_status = (data.get("status") or "").lower()

        result = {
            "reference": reference,
            "gateway_status": gateway_status,
            "previous_status": purchase.status,
            "changed": False,
            "gateway_amount": data.get("amount"),
        }

        # Record the gateway transaction id whenever we learn it.
        txn_id = data.get("id")
        if txn_id and str(purchase.paystack_transaction_id or "") != str(txn_id):
            purchase.paystack_transaction_id = str(txn_id)
            purchase.save(update_fields=["paystack_transaction_id", "updated_at"])

        if gateway_status == "success":
            if purchase.status != "completed":
                purchase.complete_purchase()  # idempotent; grants credits once
                result["changed"] = True
        elif gateway_status in ("failed", "abandoned", "reversed"):
            # Never override a completed purchase on a stale/failed re-read.
            if purchase.status not in ("failed", "completed"):
                purchase.status = "failed"
                purchase.metadata = {
                    **(purchase.metadata or {}),
                    "failed_at": timezone.now().isoformat(),
                    "gateway_status": gateway_status,
                }
                purchase.save(update_fields=["status", "metadata", "updated_at"])
                result["changed"] = True
        # else: pending/ongoing/queued -> nothing to reconcile yet.

        purchase.refresh_from_db()
        result["current_status"] = purchase.status
        return result

    def handle_subscription_webhook(self, event_data):
        """Handle subscription webhook events"""
        event_type = event_data.get("event")
        data = event_data.get("data", {})

        if event_type == "subscription.create":
            self._handle_subscription_created(data)
        elif event_type == "subscription.disable":
            self._handle_subscription_canceled(data)
        elif event_type == "invoice.payment_failed":
            self._handle_payment_failed(data)
        elif event_type == "invoice.payment_successful":
            self._handle_payment_successful(data)
        elif event_type == "charge.success":
            # Handle one-time payments (credit packages, etc.)
            self._handle_charge_success(data)

    # NOTE: these handlers no longer swallow exceptions. They run inside the
    # webhook's transaction (see paystack_webhook); on failure the transaction
    # rolls back — so the idempotency marker and any credit change are undone
    # together — and the webhook logs/alerts and returns 200 (no retry storm).

    def _handle_subscription_created(self, data):
        """Handle subscription created event"""
        subscription_code = data["subscription_code"]
        customer_code = data["customer"]["customer_code"]

        profile = BillingProfile.objects.get(paystack_customer_id=customer_code)
        plan = Plan.objects.get(paystack_plan_code=data["plan"]["plan_code"])

        # Create subscription record
        Subscription.objects.create(
            billing_profile=profile,
            paystack_subscription_id=subscription_code,
            plan=plan,
            status="active",
            current_period_start=datetime.fromisoformat(
                data["start"].replace("Z", "+00:00")
            ),
            current_period_end=datetime.fromisoformat(
                data["next_payment_date"].replace("Z", "+00:00")
            ),
            next_billing_date=datetime.fromisoformat(
                data["next_payment_date"].replace("Z", "+00:00")
            ),
        )

        # Update billing profile
        profile.current_plan = plan
        profile.billing_status = "active"
        profile.plan_start_date = timezone.now()
        profile.reset_monthly_credits()
        profile.save()

    def _handle_subscription_canceled(self, data):
        """Handle subscription canceled event"""
        subscription_code = data["subscription_code"]

        subscription = Subscription.objects.get(
            paystack_subscription_id=subscription_code
        )
        subscription.status = "canceled"
        subscription.save()

        profile = subscription.billing_profile
        profile.billing_status = "canceled"
        profile.save()

    def _handle_payment_failed(self, data):
        """Handle payment failed event"""
        customer_code = data["customer"]["customer_code"]

        profile = BillingProfile.objects.get(paystack_customer_id=customer_code)
        profile.billing_status = "past_due"
        profile.save()

    def _handle_payment_successful(self, data):
        """Handle payment successful event"""
        customer_code = data["customer"]["customer_code"]

        profile = BillingProfile.objects.get(paystack_customer_id=customer_code)
        profile.billing_status = "active"
        profile.save()

        # Reset monthly credits if it's a new billing period
        if profile.current_plan:
            profile.reset_monthly_credits()

    def _resolve_profile_for_charge(self, data, metadata):
        """Resolve the billing profile for a one-time charge, preferring the
        user_id recorded at checkout, then the Paystack customer code."""
        user_id = metadata.get("user_id")
        if user_id:
            profile = BillingProfile.objects.filter(user_id=user_id).first()
            if profile:
                return profile
        customer_code = (data.get("customer") or {}).get("customer_code")
        if customer_code:
            return BillingProfile.objects.filter(
                paystack_customer_id=customer_code
            ).first()
        return None

    def _handle_charge_success(self, data):
        """Handle a successful one-time charge (credit packages / direct credits).

        Credits are derived from the catalog package or the credit count recorded
        at checkout — NEVER cast from the raw paid amount, which would assume a
        single currency (the old "kobo to naira, 1 naira = 1 credit" was wrong;
        the product bills GHS/USD via the FX layer).
        """
        from .models import CreditPackagePurchase

        reference = data.get("reference")
        metadata = data.get("metadata", {}) or {}
        charge_type = metadata.get("type")

        if charge_type == "credit_package":
            purchase_id = metadata.get("purchase_id")
            if not purchase_id:
                logger.error("credit_package charge %s missing purchase_id", reference)
                return
            purchase = CreditPackagePurchase.objects.get(id=purchase_id)
            if purchase.status == "pending":
                # Credits come from purchase.credits_purchased (catalog package).
                purchase.complete_purchase()
                logger.info("Credit package purchase %s completed", purchase_id)

        elif charge_type == "credit_purchase":
            # Credits come from what initialize_credit_purchase recorded at
            # checkout (server-side quote) — never from the raw paid amount.
            profile = self._resolve_profile_for_charge(data, metadata)
            if profile is None:
                logger.error(
                    "credit_purchase charge %s: no billing profile found", reference
                )
                return
            try:
                granted = self.fulfill_credit_purchase(
                    profile, reference, metadata, data.get("amount")
                )
            except ValueError as e:
                logger.error("credit_purchase charge %s rejected: %s", reference, e)
                return
            logger.info(
                "credit_purchase %s for profile %s (granted=%s)",
                reference,
                profile.id,
                granted,
            )
        else:
            logger.info(
                "charge.success with unhandled type=%s (ref %s)", charge_type, reference
            )


    def get_usage_analytics(self, user):
        """Get usage analytics for user"""
        profile = self.get_or_create_billing_profile(user)

        # Get current month usage
        current_month = timezone.now().replace(
            day=1, hour=0, minute=0, second=0, microsecond=0
        )
        this_month_usage = (
            profile.credit_transactions.filter(
                transaction_type="usage", created_at__gte=current_month
            ).aggregate(total=models.Sum("amount"))["total"]
            or 0
        )

        # Get total usage
        total_usage = abs(
            profile.credit_transactions.filter(transaction_type="usage").aggregate(
                total=models.Sum("amount")
            )["total"]
            or 0
        )

        return {
            "credits_remaining": profile.credits_remaining,
            "credits_used_this_month": abs(this_month_usage),
            "total_validations": total_usage,
            "current_plan": (
                profile.current_plan.name if profile.current_plan else "Free"
            ),
            "billing_status": profile.billing_status,
            "usage_percentage": profile.get_usage_percentage(),
        }
