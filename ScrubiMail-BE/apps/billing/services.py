import requests
import json
from django.conf import settings
from django.utils import timezone
from datetime import datetime, timedelta
from decimal import Decimal
from .models import BillingProfile, CreditTransaction, Subscription
from apps.plan.models import Plan


class PaystackService:
    """Service class for Paystack integration"""

    def __init__(self):
        self.secret_key = settings.PAYSTACK_SECRET_KEY
        self.public_key = settings.PAYSTACK_PUBLIC_KEY
        self.base_url = "https://api.paystack.co"
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
        if response.status_code == 201:
            customer_data = response.json()["data"]
            return customer_data
        else:
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

    def verify_transaction(self, reference):
        """Verify a payment transaction"""
        url = f"{self.base_url}/transaction/verify/{reference}"
        response = requests.get(url, headers=self.headers)

        if response.status_code == 200:
            return response.json()["data"]
        else:
            raise Exception(f"Failed to verify transaction: {response.text}")

    def create_plan(self, name, amount, interval, description=None):
        """Create a subscription plan"""
        url = f"{self.base_url}/plan"
        data = {
            "name": name,
            "amount": int(amount * 100),  # Convert to kobo
            "interval": interval,  # daily, weekly, monthly, yearly
            "description": description or f"ScrubiMail {name} Plan",
        }

        response = requests.post(url, headers=self.headers, json=data)
        if response.status_code == 201:
            return response.json()["data"]
        else:
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
        """Get or create billing profile for user"""
        profile, created = BillingProfile.objects.get_or_create(
            user=user, defaults={"credits_remaining": 100, "billing_status": "active"}
        )
        return profile

    def initialize_credit_purchase(self, user, amount, credits):
        """Initialize credit purchase"""
        profile = self.get_or_create_billing_profile(user)

        # Generate unique reference
        reference = f"credits_{user.id}_{timezone.now().timestamp()}"

        # Initialize Paystack transaction
        transaction_data = self.paystack.initialize_transaction(
            email=user.email,
            amount=amount,
            reference=reference,
            callback_url=f"{settings.FRONTEND_URL}/billing?success=1",
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
        """Initialize plan upgrade"""
        profile = self.get_or_create_billing_profile(user)

        # Create Paystack customer if not exists
        if not profile.paystack_customer_id:
            customer_data = self.paystack.create_customer(user=user, email=user.email)
            profile.paystack_customer_id = customer_data["customer_code"]
            profile.save()

        # Create or get Paystack plan
        if not plan.paystack_plan_code:
            paystack_plan = self.paystack.create_plan(
                name=plan.name,
                amount=plan.price,
                interval="monthly",
                description=plan.description,
            )
            plan.paystack_plan_code = paystack_plan["plan_code"]
            plan.save()

        # Create subscription
        subscription_data = self.paystack.create_subscription(
            customer_id=profile.paystack_customer_id, plan_code=plan.paystack_plan_code
        )

        return {
            "subscription_id": subscription_data["subscription_code"],
            "authorization_url": subscription_data["authorization_url"],
        }

    def handle_payment_verification(self, reference):
        """Handle payment verification after successful payment"""
        try:
            transaction_data = self.paystack.verify_transaction(reference)

            if transaction_data["status"] == "success":
                metadata = transaction_data.get("metadata", {})
                user_id = metadata.get("user_id")
                credits = metadata.get("credits", 0)
                transaction_type = metadata.get("type", "credit_purchase")

                if user_id and credits:
                    from django.contrib.auth import get_user_model

                    User = get_user_model()
                    user = User.objects.get(id=user_id)
                    profile = self.get_or_create_billing_profile(user)

                    if transaction_type == "credit_purchase":
                        profile.add_credits(
                            amount=credits,
                            description=f"Credit purchase - {credits} credits",
                            payment_reference=reference,
                        )
                        profile.total_amount_spent += Decimal(
                            str(transaction_data["amount"] / 100)
                        )
                        profile.save()

                    return True
            return False
        except Exception as e:
            print(f"Payment verification error: {e}")
            return False

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

    def _handle_subscription_created(self, data):
        """Handle subscription created event"""
        subscription_code = data["subscription_code"]
        customer_code = data["customer"]["customer_code"]

        try:
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

        except Exception as e:
            print(f"Error handling subscription created: {e}")

    def _handle_subscription_canceled(self, data):
        """Handle subscription canceled event"""
        subscription_code = data["subscription_code"]

        try:
            subscription = Subscription.objects.get(
                paystack_subscription_id=subscription_code
            )
            subscription.status = "canceled"
            subscription.save()

            profile = subscription.billing_profile
            profile.billing_status = "canceled"
            profile.save()

        except Exception as e:
            print(f"Error handling subscription canceled: {e}")

    def _handle_payment_failed(self, data):
        """Handle payment failed event"""
        customer_code = data["customer"]["customer_code"]

        try:
            profile = BillingProfile.objects.get(paystack_customer_id=customer_code)
            profile.billing_status = "past_due"
            profile.save()
        except Exception as e:
            print(f"Error handling payment failed: {e}")

    def _handle_payment_successful(self, data):
        """Handle payment successful event"""
        customer_code = data["customer"]["customer_code"]

        try:
            profile = BillingProfile.objects.get(paystack_customer_id=customer_code)
            profile.billing_status = "active"
            profile.save()

            # Reset monthly credits if it's a new billing period
            if profile.current_plan:
                profile.reset_monthly_credits()

        except Exception as e:
            print(f"Error handling payment successful: {e}")

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
