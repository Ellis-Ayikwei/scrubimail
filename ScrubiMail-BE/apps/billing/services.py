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


def _to_paystack_minor_units(amount):
    """Major currency units → smallest unit (kobo, pesewas, cents, etc.)."""
    d = Decimal(str(amount))
    return int((d * 100).to_integral_value(rounding=ROUND_HALF_UP))


def resolve_paystack_plan_charge(plan):
    """
    Map catalog Plan (e.g. USD in DB) to (amount_major, currency) for Paystack.

    - If PAYSTACK_CHARGE_CURRENCY matches plan.currency: no conversion.
    - If plan is USD and charge currency is GHS: amount = price * live rate (CurrencyFreaks,
      cached) with PAYSTACK_FX_BUFFER, else PAYSTACK_FX_USD_TO_GHS fallback.

    When Paystack enables USD: set PAYSTACK_CHARGE_CURRENCY=USD and keep Plan.currency=USD.
    """
    charge_ccy = (getattr(settings, "PAYSTACK_CHARGE_CURRENCY", None) or "").strip().upper()
    if not charge_ccy:
        charge_ccy = (plan.currency or "USD").upper()

    plan_ccy = (plan.currency or "USD").strip().upper()
    price = Decimal(str(plan.price))

    if charge_ccy == plan_ccy:
        amount = price
    elif plan_ccy == "USD" and charge_ccy == "GHS":
        rate = get_usd_to_ghs_rate()
        if rate is None or rate <= 0:
            raise ValueError(
                "Could not resolve USD→GHS rate: set CURRENCYFREAKS_API_KEY or a positive "
                "PAYSTACK_FX_USD_TO_GHS fallback."
            )
        amount = (price * rate).quantize(Decimal("0.01"), rounding=ROUND_HALF_UP)
        logger.info(
            "Paystack plan pricing: USD %s → GHS %s (rate=%s, plan=%s)",
            price,
            amount,
            rate,
            plan.name,
        )
    else:
        raise ValueError(
            f"No Paystack FX rule from catalog currency {plan_ccy} to "
            f"PAYSTACK_CHARGE_CURRENCY={charge_ccy}. Align Plan.currency with "
            "PAYSTACK_CHARGE_CURRENCY or extend resolve_paystack_plan_charge()."
        )

    if charge_ccy == "GHS":
        min_ghs = Decimal(str(getattr(settings, "PAYSTACK_MIN_GHS_MAJOR", "2.00")))
        if amount < min_ghs:
            raise ValueError(
                f"Converted charge {amount} GHS is below Paystack minimum {min_ghs} GHS "
                f"(plan={plan.name}). Raise the USD price, FX buffer/rate, or fallback."
            )

    return amount, charge_ccy


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
        self, email, amount, reference, callback_url=None, metadata=None
    ):
        """Initialize a payment transaction"""
        url = f"{self.base_url}/transaction/initialize"
        data = {
            "email": email,
            "amount": int(amount * 100),  # Convert to kobo
            "reference": reference,
            "callback_url": callback_url,
            "metadata": metadata or {},
        }

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
    ):
        """One-off Paystack checkout (e.g. credit packages)."""
        ref = reference or f"pkg_{uuid.uuid4().hex[:20]}"
        callback_url = getattr(settings, "PAYMENT_SUCCESS_URL", None) or (
            f"{getattr(settings, 'FRONTEND_URL', '')}/billing/payment/success"
        )
        amt = float(amount) if isinstance(amount, Decimal) else amount
        data = self.initialize_transaction(
            email, amt, ref, callback_url=callback_url, metadata=metadata or {}
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

    def get_or_create_billing_profile(self, user):
        """Get or create billing profile for user with Free plan assigned by default"""
        from apps.plan.models import Plan
        
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
        
        return profile

    def initialize_credit_purchase(self, user, amount, credits):
        """Initialize credit purchase"""
        profile = self.get_or_create_billing_profile(user)

        # Generate unique reference
        reference = f"credits_{user.id}_{timezone.now().timestamp()}"

        # Initialize Paystack transaction
        success_cb = getattr(settings, "PAYMENT_SUCCESS_URL", None) or (
            f"{settings.FRONTEND_URL}/billing/payment/success"
        )
        transaction_data = self.paystack.initialize_transaction(
            email=user.email,
            amount=amount,
            reference=reference,
            callback_url=success_cb,
            metadata={
                "user_id": str(user.id),
                "credits": credits,
                "type": "credit_purchase",
            },
        )

        return {
            "authorization_url": transaction_data["authorization_url"],
            "access_code": transaction_data["access_code"],
            "reference": reference,
        }

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
            try:
                credits = int(metadata.get("credits") or 0)
            except (TypeError, ValueError):
                credits = 0
            if credits <= 0:
                out["message"] = "Invalid or missing credit amount in transaction"
                return out
            profile = self.get_or_create_billing_profile(user)
            if CreditTransaction.objects.filter(
                billing_profile=profile, paystack_payment_reference=reference
            ).exists():
                out["ok"] = True
                out["message"] = "Payment was already applied to your account."
                return out
            profile.add_credits(
                amount=credits,
                description=f"Credit purchase - {credits} credits",
                payment_reference=reference,
            )
            try:
                amt_major = Decimal(str(transaction_data.get("amount", 0))) / Decimal(
                    "100"
                )
            except Exception:
                amt_major = Decimal("0")
            profile.total_amount_spent += amt_major
            profile.save(update_fields=["total_amount_spent"])
            out["ok"] = True
            out["message"] = "Payment verified. Credits have been added to your account."
            return out

        out["payment_type"] = trans_type
        out["ok"] = True
        out["message"] = "Payment confirmed with Paystack."
        return out

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
            # Credits come from what was recorded at checkout
            # (initialize_credit_purchase stores metadata['credits'] and
            # metadata['user_id']) — not from an amount-to-credit cast.
            credits = metadata.get("credits")
            if credits is None:
                logger.error(
                    "credit_purchase charge %s missing 'credits' metadata; "
                    "refusing to derive credits from the raw amount",
                    reference,
                )
                return
            profile = self._resolve_profile_for_charge(data, metadata)
            if profile is None:
                logger.error(
                    "credit_purchase charge %s: no billing profile found", reference
                )
                return
            profile.add_credits(
                int(credits), f"Credit purchase via Paystack (Ref: {reference})"
            )
            logger.info(
                "Added %s credits to profile %s (ref %s)",
                credits,
                profile.id,
                reference,
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
