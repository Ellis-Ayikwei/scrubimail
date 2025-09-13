from django.db import models
from django.conf import settings
from django.utils import timezone
from decimal import Decimal
from apps.Basemodel.models import Basemodel


class BillingProfile(Basemodel):
    user = models.OneToOneField(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name="billing_profile",
    )

    # Paystack Integration
    paystack_customer_id = models.CharField(
        max_length=128, unique=True, null=True, blank=True
    )
    paystack_subscription_id = models.CharField(max_length=128, null=True, blank=True)

    # Plan & Credits
    current_plan = models.ForeignKey(
        "plan.Plan",
        on_delete=models.SET_NULL,
        null=True,
        related_name="billing_profiles",
    )
    credits_remaining = models.PositiveIntegerField(default=100)
    credits_used_this_month = models.PositiveIntegerField(default=0)
    credits_reset_date = models.DateTimeField(null=True, blank=True)

    # Billing Status
    BILLING_STATUS_CHOICES = [
        ("active", "Active"),
        ("past_due", "Past Due"),
        ("canceled", "Canceled"),
        ("unpaid", "Unpaid"),
        ("trialing", "Trialing"),
        ("suspended", "Suspended"),
    ]
    billing_status = models.CharField(
        max_length=20, choices=BILLING_STATUS_CHOICES, default="active"
    )

    # Payment Information
    payment_method_id = models.CharField(max_length=128, null=True, blank=True)
    default_payment_method = models.CharField(max_length=50, null=True, blank=True)

    # Billing Address
    billing_address = models.JSONField(default=dict, blank=True)

    # Usage Tracking
    last_credit_purchase = models.DateTimeField(null=True, blank=True)
    total_credits_purchased = models.PositiveIntegerField(default=0)
    total_amount_spent = models.DecimalField(
        max_digits=10, decimal_places=2, default=0.00
    )

    # Plan-specific settings
    plan_start_date = models.DateTimeField(null=True, blank=True)
    plan_end_date = models.DateTimeField(null=True, blank=True)
    auto_renew = models.BooleanField(default=True)

    def __str__(self):
        return f"{self.user.email} ({self.current_plan.name if self.current_plan else 'No Plan'})"

    def get_credits_remaining(self):
        """Get remaining credits for current billing period"""
        return self.credits_remaining

    def get_credits_used_this_month(self):
        """Get credits used in current billing period"""
        return self.credits_used_this_month

    def get_usage_percentage(self):
        """Get usage percentage for current plan"""
        if not self.current_plan:
            return 0
        total_credits = (
            self.current_plan.credits_per_month
            if hasattr(self.current_plan, "credits_per_month")
            else 100
        )
        return (self.credits_used_this_month / total_credits) * 100

    def can_use_credits(self, amount):
        """Check if user can use specified amount of credits"""
        return self.credits_remaining >= amount

    def consume_credits(self, amount, validation_type="single"):
        """Consume credits for email validation"""
        if not self.can_use_credits(amount):
            return False

        self.credits_remaining -= amount
        self.credits_used_this_month += amount
        self.save(update_fields=["credits_remaining", "credits_used_this_month"])

        # Create usage record
        CreditTransaction.objects.create(
            billing_profile=self,
            transaction_type="usage",
            amount=-amount,
            description=f"Email validation ({validation_type})",
            metadata={"validation_type": validation_type},
        )
        return True

    def add_credits(
        self, amount, description="Credit purchase", payment_reference=None
    ):
        """Add credits to user's account"""
        self.credits_remaining += amount
        self.total_credits_purchased += amount
        self.last_credit_purchase = timezone.now()
        self.save(
            update_fields=[
                "credits_remaining",
                "total_credits_purchased",
                "last_credit_purchase",
            ]
        )

        # Create transaction record
        CreditTransaction.objects.create(
            billing_profile=self,
            transaction_type="purchase",
            amount=amount,
            description=description,
            paystack_payment_reference=payment_reference,
        )

    def reset_monthly_credits(self):
        """Reset credits for new billing period"""
        if self.current_plan:
            self.credits_remaining = self.current_plan.credits_per_month
            self.credits_used_this_month = 0
            self.credits_reset_date = timezone.now()
            self.save(
                update_fields=[
                    "credits_remaining",
                    "credits_used_this_month",
                    "credits_reset_date",
                ]
            )

    class Meta:
        managed = True
        db_table = "billing_profile"


class CreditTransaction(Basemodel):
    billing_profile = models.ForeignKey(
        BillingProfile, on_delete=models.CASCADE, related_name="credit_transactions"
    )

    TRANSACTION_TYPE_CHOICES = [
        ("purchase", "Credit Purchase"),
        ("usage", "Email Validation"),
        ("refund", "Refund"),
        ("bonus", "Bonus Credits"),
        ("expired", "Credits Expired"),
        ("plan_credits", "Plan Credits"),
    ]

    transaction_type = models.CharField(max_length=20, choices=TRANSACTION_TYPE_CHOICES)
    amount = models.IntegerField()  # Positive for credits added, negative for usage
    description = models.TextField()
    paystack_payment_reference = models.CharField(max_length=128, null=True, blank=True)
    paystack_transaction_id = models.CharField(max_length=128, null=True, blank=True)
    metadata = models.JSONField(default=dict, blank=True)

    def __str__(self):
        return f"{self.billing_profile.user.email} - {self.transaction_type} - {self.amount}"

    class Meta:
        managed = True
        db_table = "credit_transactions"
        ordering = ["-created_at"]


class EmailValidationUsage(Basemodel):
    billing_profile = models.ForeignKey(
        BillingProfile, on_delete=models.CASCADE, related_name="validation_usage"
    )
    validation_request_id = models.CharField(
        max_length=128
    )  # Reference to validation request
    credits_consumed = models.PositiveIntegerField(default=1)
    cost_per_credit = models.DecimalField(max_digits=6, decimal_places=4, default=0.01)
    validation_type = models.CharField(max_length=50)  # 'single', 'bulk', 'api'
    email_count = models.PositiveIntegerField(default=1)

    def __str__(self):
        return f"{self.billing_profile.user.email} - {self.validation_type} - {self.credits_consumed} credits"

    class Meta:
        managed = True
        db_table = "email_validation_usage"
        ordering = ["-created_at"]


class Subscription(Basemodel):
    billing_profile = models.ForeignKey(
        BillingProfile, on_delete=models.CASCADE, related_name="subscriptions"
    )
    paystack_subscription_id = models.CharField(max_length=128, unique=True)
    plan = models.ForeignKey("plan.Plan", on_delete=models.CASCADE)

    SUBSCRIPTION_STATUS_CHOICES = [
        ("active", "Active"),
        ("canceled", "Canceled"),
        ("past_due", "Past Due"),
        ("unpaid", "Unpaid"),
        ("trialing", "Trialing"),
        ("suspended", "Suspended"),
    ]

    status = models.CharField(max_length=20, choices=SUBSCRIPTION_STATUS_CHOICES)
    current_period_start = models.DateTimeField()
    current_period_end = models.DateTimeField()
    cancel_at_period_end = models.BooleanField(default=False)
    trial_end = models.DateTimeField(null=True, blank=True)
    next_billing_date = models.DateTimeField(null=True, blank=True)

    def __str__(self):
        return f"{self.billing_profile.user.email} - {self.plan.name} ({self.status})"

    class Meta:
        managed = True
        db_table = "subscriptions"
        ordering = ["-created_at"]
