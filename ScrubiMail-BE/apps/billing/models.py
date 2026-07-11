from django.db import models, transaction
from django.db.models import F
from django.conf import settings
from django.utils import timezone
from datetime import timedelta
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

    # Trial tracking
    is_trial = models.BooleanField(default=False)
    trial_start_date = models.DateTimeField(null=True, blank=True)
    trial_end_date = models.DateTimeField(null=True, blank=True)
    trial_converted = models.BooleanField(default=False)
    trial_converted_date = models.DateTimeField(null=True, blank=True)

    # Metadata for flexible data storage (alerts, preferences, etc.)
    metadata = models.JSONField(default=dict, blank=True)

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
        """Atomically consume credits.

        Concurrent validations of the same profile must never overspend, so the
        deduction is a single conditional UPDATE (credits_remaining >= amount)
        rather than a Python read-modify-write. Zero rows updated == insufficient
        credits; the balance can never be driven below zero."""
        if amount <= 0:
            return True
        with transaction.atomic():
            updated = BillingProfile.objects.filter(
                pk=self.pk, credits_remaining__gte=amount
            ).update(
                credits_remaining=F("credits_remaining") - amount,
                credits_used_this_month=F("credits_used_this_month") + amount,
            )
            if not updated:
                return False  # insufficient credits (lost the race / not enough)

            # Keep the in-memory instance consistent with the DB.
            self.refresh_from_db(
                fields=["credits_remaining", "credits_used_this_month"]
            )
            CreditTransaction.objects.create(
                billing_profile=self,
                transaction_type="usage",
                amount=-amount,
                description=f"Email validation ({validation_type})",
                metadata={"validation_type": validation_type},
            )
        return True

    def add_credits(
        self,
        amount,
        description="Credit purchase",
        payment_reference=None,
        expiry_days=None,
    ):
        """Add credits to user's account with optional expiry"""
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

        # Calculate expiry date if provided
        expiry_date = None
        if expiry_days:
            from datetime import timedelta

            expiry_date = timezone.now() + timedelta(days=expiry_days)

        # Create transaction record
        CreditTransaction.objects.create(
            billing_profile=self,
            transaction_type="purchase",
            amount=amount,
            description=description,
            paystack_payment_reference=payment_reference,
            expiry_date=expiry_date,
        )

    def reset_monthly_credits(self):
        """Reset credits for new billing period (automatic)"""
        if self.current_plan:
            old_remaining = self.credits_remaining
            old_used = self.credits_used_this_month
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
            CreditTransaction.objects.create(
                billing_profile=self,
                transaction_type="auto_reset",
                amount=self.current_plan.credits_per_month,
                description=f"Automatic monthly reset ({self.current_plan.name})",
                metadata={
                    "previous_remaining": old_remaining,
                    "previous_used": old_used,
                    "plan_credits": self.current_plan.credits_per_month,
                },
            )

    def is_trial_active(self):
        """Check if trial is currently active"""
        if not self.is_trial or not self.trial_end_date:
            return False
        return timezone.now() <= self.trial_end_date

    def days_left_in_trial(self):
        """Get number of days left in trial"""
        if not self.is_trial_active():
            return 0
        delta = self.trial_end_date - timezone.now()
        return max(0, delta.days)

    def start_trial(self, plan):
        """Start trial period for a plan"""
        from datetime import timedelta

        if not plan or plan.trial_days == 0:
            return False

        self.current_plan = plan
        self.is_trial = True
        self.trial_start_date = timezone.now()
        self.trial_end_date = timezone.now() + timedelta(days=plan.trial_days)
        self.plan_start_date = timezone.now()
        self.billing_status = "trialing"
        self.credits_remaining = plan.credits_per_month
        self.save()
        return True

    def convert_trial_to_paid(self):
        """Convert trial to paid subscription"""
        if not self.is_trial:
            return False

        self.is_trial = False
        self.trial_converted = True
        self.trial_converted_date = timezone.now()
        self.billing_status = "active"
        self.save()
        return True

    def end_trial(self):
        """End trial and revert to free plan if not converted"""
        if not self.trial_converted:
            # Revert to free plan
            from apps.plan.models import Plan

            free_plan = Plan.objects.filter(name="Free", is_active=True).first()
            if free_plan:
                self.current_plan = free_plan
                self.credits_remaining = free_plan.credits_per_month

        self.is_trial = False
        self.save()

    def get_expiring_credits(self, days=7):
        """Get credits that are expiring within specified days"""
        now = timezone.now()
        future_date = now + timedelta(days=days)

        expiring_transactions = self.credit_transactions.filter(
            transaction_type__in=["purchase", "bonus", "plan_credits"],
            amount__gt=0,
            is_expired=False,
            expiry_date__isnull=False,
            expiry_date__lte=future_date,
            expiry_date__gte=now,
        )

        total_expiring = sum(t.amount for t in expiring_transactions)
        return {
            "total_credits": total_expiring,
            "transactions": expiring_transactions,
            "days_until_expiry": (
                min(
                    (t.expiry_date - now).days
                    for t in expiring_transactions
                    if t.expiry_date
                )
                if expiring_transactions
                else None
            ),
        }

    def get_expired_credits_total(self):
        """Get total amount of expired credits"""
        return abs(
            self.credit_transactions.filter(transaction_type="expired").aggregate(
                total=models.Sum("amount")
            )["total"]
            or 0
        )

    def get_available_credits(self):
        """Get available (non-expired) credits"""
        # Get all positive transactions that haven't expired
        active_credits = (
            self.credit_transactions.filter(
                amount__gt=0,
                is_expired=False,
                transaction_type__in=["purchase", "bonus", "plan_credits"],
            ).aggregate(total=models.Sum("amount"))["total"]
            or 0
        )

        # Subtract usage
        used_credits = abs(
            self.credit_transactions.filter(
                transaction_type="usage", amount__lt=0
            ).aggregate(total=models.Sum("amount"))["total"]
            or 0
        )

        return max(0, active_credits - used_credits)

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
        ("grant", "Admin Grant"),
        ("deduction", "Admin Deduction"),
        ("auto_reset", "Automatic Monthly Reset"),
        ("manual_reset", "Manual Billing Reset"),
    ]

    transaction_type = models.CharField(max_length=20, choices=TRANSACTION_TYPE_CHOICES)
    amount = models.IntegerField()  # Positive for credits added, negative for usage
    description = models.TextField()
    paystack_payment_reference = models.CharField(max_length=128, null=True, blank=True)
    paystack_transaction_id = models.CharField(max_length=128, null=True, blank=True)
    metadata = models.JSONField(default=dict, blank=True)

    # Credit expiry tracking
    expiry_date = models.DateTimeField(
        null=True, blank=True, help_text="Date when these credits will expire"
    )
    is_expired = models.BooleanField(
        default=False, help_text="Whether these credits have expired"
    )
    expired_at = models.DateTimeField(
        null=True, blank=True, help_text="Actual expiration timestamp"
    )

    def __str__(self):
        return f"{self.billing_profile.user.email} - {self.transaction_type} - {self.amount}"

    def is_expiring_soon(self, days=7):
        """Check if credits are expiring within specified days"""
        if not self.expiry_date or self.is_expired:
            return False

        now = timezone.now()
        days_until_expiry = (self.expiry_date - now).days
        return 0 <= days_until_expiry <= days

    def days_until_expiry(self):
        """Get number of days until expiry"""
        if not self.expiry_date or self.is_expired:
            return None

        now = timezone.now()
        delta = self.expiry_date - now
        return max(0, delta.days)

    def expire_credits(self):
        """Mark credits as expired and create expiry transaction"""
        if self.is_expired or not self.expiry_date:
            return False

        if timezone.now() >= self.expiry_date:
            self.is_expired = True
            self.expired_at = timezone.now()
            self.save()

            # Create expiry transaction (negative amount)
            if self.amount > 0:  # Only expire positive credit transactions
                CreditTransaction.objects.create(
                    billing_profile=self.billing_profile,
                    transaction_type="expired",
                    amount=-abs(self.amount),
                    description=f"Credits expired from transaction: {self.description}",
                    metadata={
                        "original_transaction_id": str(self.id),
                        "original_amount": self.amount,
                        "expiry_date": self.expiry_date.isoformat(),
                    },
                )

                # Update billing profile
                self.billing_profile.credits_remaining -= abs(self.amount)
                self.billing_profile.save()

            return True

        return False

    class Meta:
        managed = True
        db_table = "credit_transactions"
        ordering = ["-created_at"]
        indexes = [
            models.Index(fields=["billing_profile", "transaction_type"]),
            models.Index(fields=["expiry_date", "is_expired"]),
            models.Index(fields=["-created_at"]),
            models.Index(fields=["paystack_payment_reference"]),
        ]


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


class CreditPackage(Basemodel):
    """
    One-time credit packages that users can purchase
    without subscribing to a plan
    """

    name = models.CharField(max_length=100)
    description = models.TextField(blank=True)
    credits = models.PositiveIntegerField(help_text="Number of credits in package")
    price = models.DecimalField(max_digits=10, decimal_places=2)
    currency = models.CharField(max_length=10, default="USD")

    # Discount and promotions
    discount_percentage = models.DecimalField(
        max_digits=5,
        decimal_places=2,
        default=0,
        help_text="Discount percentage off regular price",
    )
    original_price = models.DecimalField(
        max_digits=10,
        decimal_places=2,
        null=True,
        blank=True,
        help_text="Original price before discount",
    )

    # Expiry settings
    expiry_days = models.PositiveIntegerField(
        default=365, help_text="Number of days until credits expire after purchase"
    )

    # Availability
    is_active = models.BooleanField(default=True)
    is_featured = models.BooleanField(default=False)
    sort_order = models.PositiveIntegerField(default=0)

    # Limits
    max_purchases_per_user = models.PositiveIntegerField(
        null=True,
        blank=True,
        help_text="Maximum times a user can purchase this package",
    )
    total_available = models.PositiveIntegerField(
        null=True,
        blank=True,
        help_text="Total number of packages available (for limited offers)",
    )
    total_sold = models.PositiveIntegerField(default=0)

    # Metadata
    paystack_plan_code = models.CharField(max_length=128, null=True, blank=True)
    metadata = models.JSONField(default=dict, blank=True)

    def __str__(self):
        return f"{self.name} - {self.credits} credits (${self.price})"

    def get_effective_price(self):
        """Calculate price after discount"""
        if self.discount_percentage > 0:
            discount_amount = (self.price * self.discount_percentage) / 100
            return self.price - discount_amount
        return self.price

    def get_price_per_credit(self):
        """Calculate cost per credit"""
        effective_price = self.get_effective_price()
        return float(effective_price / self.credits) if self.credits > 0 else 0

    def is_available(self):
        """Check if package is still available for purchase"""
        if not self.is_active:
            return False

        if self.total_available is not None:
            return self.total_sold < self.total_available

        return True

    def can_user_purchase(self, user):
        """Check if user can purchase this package"""
        if not self.is_available():
            return False, "Package is not available"

        if self.max_purchases_per_user:
            purchase_count = CreditPackagePurchase.objects.filter(
                user=user, package=self
            ).count()

            if purchase_count >= self.max_purchases_per_user:
                return (
                    False,
                    f"Maximum purchases ({self.max_purchases_per_user}) exceeded",
                )

        return True, "OK"

    class Meta:
        managed = True
        db_table = "credit_packages"
        ordering = ["sort_order", "-is_featured", "price"]
        indexes = [
            models.Index(fields=["is_active", "is_featured"]),
            models.Index(fields=["sort_order", "price"]),
        ]


class CreditPackagePurchase(Basemodel):
    """
    Track purchases of credit packages
    """

    user = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name="package_purchases",
    )
    billing_profile = models.ForeignKey(
        BillingProfile, on_delete=models.CASCADE, related_name="package_purchases"
    )
    package = models.ForeignKey(
        CreditPackage, on_delete=models.CASCADE, related_name="purchases"
    )

    # Payment details
    amount_paid = models.DecimalField(max_digits=10, decimal_places=2)
    currency = models.CharField(max_length=10, default="USD")
    paystack_reference = models.CharField(max_length=128, unique=True)
    paystack_transaction_id = models.CharField(max_length=128, null=True, blank=True)

    # Purchase status
    STATUS_CHOICES = [
        ("pending", "Pending"),
        ("completed", "Completed"),
        ("failed", "Failed"),
        ("refunded", "Refunded"),
    ]
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default="pending")

    # Credits info
    credits_purchased = models.PositiveIntegerField()
    credits_added_date = models.DateTimeField(null=True, blank=True)
    credits_expiry_date = models.DateTimeField(null=True, blank=True)

    # Metadata
    metadata = models.JSONField(default=dict, blank=True)

    def __str__(self):
        return f"{self.user.email} - {self.package.name} - {self.status}"

    def complete_purchase(self):
        """Mark purchase as complete and add credits to user"""
        if self.status != "pending":
            return False

        from django.utils import timezone
        from datetime import timedelta

        self.status = "completed"
        self.completed_at = timezone.now()

        # Calculate expiry date
        if self.package.expiry_days:
            self.credits_expiry_date = timezone.now() + timedelta(
                days=self.package.expiry_days
            )

        self.save()

        # Add credits to billing profile with expiry
        self.billing_profile.add_credits(
            amount=self.credits_purchased,
            description=f"Credit package purchase: {self.package.name}",
            payment_reference=self.payment_reference,
            expiry_days=self.package.expiry_days if self.package.expiry_days else None,
        )

        # Update package sold count
        self.package.total_sold += 1
        self.package.save(update_fields=["total_sold"])

        return True

    class Meta:
        managed = True
        db_table = "credit_package_purchases"
        ordering = ["-created_at"]
        indexes = [
            models.Index(fields=["user", "status"]),
            models.Index(fields=["paystack_reference"]),
            models.Index(fields=["-created_at"]),
        ]


class PromoCode(Basemodel):
    """Promotional codes for discounts on plans and credit packages"""

    code = models.CharField(
        max_length=50,
        unique=True,
        db_index=True,
        help_text="Unique promo code (case-insensitive)",
    )
    description = models.TextField(
        blank=True, help_text="Internal description of this promo code"
    )

    # Discount configuration
    DISCOUNT_TYPE_CHOICES = [
        ("percentage", "Percentage Discount"),
        ("fixed", "Fixed Amount Discount"),
        ("free_credits", "Free Credits Bonus"),
    ]
    discount_type = models.CharField(
        max_length=20, choices=DISCOUNT_TYPE_CHOICES, default="percentage"
    )
    discount_value = models.DecimalField(
        max_digits=10,
        decimal_places=2,
        help_text="Percentage (0-100) or fixed amount or credits",
    )

    # Usage limits
    max_uses = models.PositiveIntegerField(
        null=True, blank=True, help_text="Maximum total uses (null = unlimited)"
    )
    max_uses_per_user = models.PositiveIntegerField(
        default=1, help_text="Maximum uses per user"
    )
    current_uses = models.PositiveIntegerField(
        default=0, help_text="Current total uses"
    )

    # Validity period
    valid_from = models.DateTimeField(
        null=True, blank=True, help_text="When the code becomes valid"
    )
    valid_until = models.DateTimeField(
        null=True, blank=True, help_text="When the code expires"
    )

    # Applicability
    valid_for_plans = models.ManyToManyField(
        "plan.Plan",
        blank=True,
        related_name="promo_codes",
        help_text="Plans this code applies to (empty = all plans)",
    )
    valid_for_packages = models.ManyToManyField(
        CreditPackage,
        blank=True,
        related_name="promo_codes",
        help_text="Credit packages this code applies to (empty = all packages)",
    )

    # Restrictions
    minimum_purchase_amount = models.DecimalField(
        max_digits=10,
        decimal_places=2,
        null=True,
        blank=True,
        help_text="Minimum purchase amount required",
    )
    first_purchase_only = models.BooleanField(
        default=False, help_text="Only valid for user's first purchase"
    )

    # Status
    is_active = models.BooleanField(
        default=True, help_text="Whether this code is currently active"
    )

    # Metadata
    campaign_name = models.CharField(
        max_length=100, blank=True, help_text="Marketing campaign name"
    )
    metadata = models.JSONField(
        default=dict, blank=True, help_text="Additional metadata"
    )

    def __str__(self):
        return f"{self.code} ({self.discount_type}: {self.discount_value})"

    def clean(self):
        """Validate promo code data"""
        from django.core.exceptions import ValidationError

        # Uppercase the code
        if self.code:
            self.code = self.code.upper()

        # Validate discount value
        if self.discount_type == "percentage" and self.discount_value > 100:
            raise ValidationError("Percentage discount cannot exceed 100%")

        if self.discount_value < 0:
            raise ValidationError("Discount value cannot be negative")

    def save(self, *args, **kwargs):
        self.code = self.code.upper()
        super().save(*args, **kwargs)

    def is_valid(self, user=None, plan=None, package=None, amount=None):
        """Check if promo code is currently valid"""
        from django.utils import timezone

        now = timezone.now()

        # Check if active
        if not self.is_active:
            return False, "This promo code is not active"

        # Check validity period
        if self.valid_from and now < self.valid_from:
            return False, "This promo code is not yet valid"

        if self.valid_until and now > self.valid_until:
            return False, "This promo code has expired"

        # Check usage limits
        if self.max_uses and self.current_uses >= self.max_uses:
            return False, "This promo code has reached its usage limit"

        # Check per-user usage limit
        if user:
            user_uses = PromoCodeRedemption.objects.filter(
                promo_code=self, user=user
            ).count()

            if user_uses >= self.max_uses_per_user:
                return (
                    False,
                    f"You have already used this code {self.max_uses_per_user} time(s)",
                )

            # Check first purchase only
            if self.first_purchase_only:
                has_previous_purchase = CreditPackagePurchase.objects.filter(
                    user=user, status="completed"
                ).exists()

                if has_previous_purchase:
                    return False, "This code is only valid for first-time purchases"

        # Check minimum purchase amount
        if amount and self.minimum_purchase_amount:
            if amount < self.minimum_purchase_amount:
                return (
                    False,
                    f"Minimum purchase amount is ${self.minimum_purchase_amount}",
                )

        # Check plan/package applicability
        if plan:
            valid_plans = self.valid_for_plans.all()
            if valid_plans.exists() and plan not in valid_plans:
                return False, "This code is not valid for the selected plan"

        if package:
            valid_packages = self.valid_for_packages.all()
            if valid_packages.exists() and package not in valid_packages:
                return False, "This code is not valid for the selected package"

        return True, "Valid"

    def calculate_discount(self, original_amount):
        """Calculate discount amount"""
        from decimal import Decimal

        if self.discount_type == "percentage":
            discount = original_amount * (self.discount_value / Decimal("100"))
            return min(discount, original_amount)  # Cannot exceed original amount

        elif self.discount_type == "fixed":
            return min(
                self.discount_value, original_amount
            )  # Cannot exceed original amount

        elif self.discount_type == "free_credits":
            return Decimal("0")  # No monetary discount, credits added separately

        return Decimal("0")

    def get_final_amount(self, original_amount):
        """Get final amount after discount"""
        discount = self.calculate_discount(original_amount)
        return max(Decimal("0"), original_amount - discount)

    def increment_usage(self):
        """Increment usage counter"""
        self.current_uses += 1
        self.save(update_fields=["current_uses"])

    class Meta:
        managed = True
        db_table = "promo_codes"
        ordering = ["-created_at"]
        indexes = [
            models.Index(fields=["code"]),
            models.Index(fields=["is_active", "valid_until"]),
        ]


class PromoCodeRedemption(Basemodel):
    """Track promo code redemptions"""

    promo_code = models.ForeignKey(
        PromoCode, on_delete=models.CASCADE, related_name="redemptions"
    )
    user = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name="promo_redemptions",
    )
    billing_profile = models.ForeignKey(
        BillingProfile,
        on_delete=models.CASCADE,
        related_name="promo_redemptions",
        null=True,
    )

    # What was purchased
    plan = models.ForeignKey(
        "plan.Plan", on_delete=models.SET_NULL, null=True, blank=True
    )
    credit_package = models.ForeignKey(
        CreditPackage, on_delete=models.SET_NULL, null=True, blank=True
    )

    # Financial details
    original_amount = models.DecimalField(
        max_digits=10, decimal_places=2, help_text="Original price before discount"
    )
    discount_amount = models.DecimalField(
        max_digits=10, decimal_places=2, help_text="Amount discounted"
    )
    final_amount = models.DecimalField(
        max_digits=10, decimal_places=2, help_text="Final amount paid"
    )

    # Bonus credits (for free_credits type)
    bonus_credits = models.PositiveIntegerField(
        default=0, help_text="Bonus credits awarded"
    )

    # Metadata
    metadata = models.JSONField(default=dict, blank=True)

    def __str__(self):
        return f"{self.user.email} - {self.promo_code.code} - ${self.discount_amount}"

    class Meta:
        managed = True
        db_table = "promo_code_redemptions"
        ordering = ["-created_at"]
        indexes = [
            models.Index(fields=["user", "promo_code"]),
            models.Index(fields=["promo_code", "created_at"]),
        ]


class Invoice(Basemodel):
    """Invoice for billing transactions"""

    invoice_number = models.CharField(
        max_length=50,
        unique=True,
        db_index=True,
        help_text="Unique invoice number (auto-generated)",
    )
    user = models.ForeignKey(
        settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name="invoices"
    )
    billing_profile = models.ForeignKey(
        BillingProfile, on_delete=models.CASCADE, related_name="invoices"
    )

    # Invoice type
    INVOICE_TYPE_CHOICES = [
        ("subscription", "Subscription Payment"),
        ("credit_package", "Credit Package Purchase"),
        ("credit_purchase", "Credit Purchase"),
        ("refund", "Refund"),
    ]
    invoice_type = models.CharField(
        max_length=20, choices=INVOICE_TYPE_CHOICES, default="credit_package"
    )

    # Status
    STATUS_CHOICES = [
        ("draft", "Draft"),
        ("pending", "Pending"),
        ("paid", "Paid"),
        ("overdue", "Overdue"),
        ("cancelled", "Cancelled"),
        ("refunded", "Refunded"),
    ]
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default="pending")

    # Dates
    invoice_date = models.DateTimeField(
        default=timezone.now, help_text="Date invoice was created"
    )
    due_date = models.DateTimeField(null=True, blank=True, help_text="Payment due date")
    paid_date = models.DateTimeField(
        null=True, blank=True, help_text="Date invoice was paid"
    )

    # Financial details
    subtotal = models.DecimalField(
        max_digits=10,
        decimal_places=2,
        default=Decimal("0.00"),
        help_text="Subtotal before tax and discounts",
    )
    discount_amount = models.DecimalField(
        max_digits=10,
        decimal_places=2,
        default=Decimal("0.00"),
        help_text="Total discount applied",
    )
    tax_amount = models.DecimalField(
        max_digits=10,
        decimal_places=2,
        default=Decimal("0.00"),
        help_text="Total tax amount",
    )
    total_amount = models.DecimalField(
        max_digits=10,
        decimal_places=2,
        default=Decimal("0.00"),
        help_text="Final total amount",
    )
    amount_paid = models.DecimalField(
        max_digits=10,
        decimal_places=2,
        default=Decimal("0.00"),
        help_text="Amount paid",
    )

    # Currency
    currency = models.CharField(
        max_length=3, default="NGN", help_text="Currency code (NGN, USD, etc.)"
    )

    # Payment details
    payment_method = models.CharField(max_length=50, null=True, blank=True)
    payment_reference = models.CharField(max_length=128, null=True, blank=True)

    # Customer details (snapshot at time of invoice)
    customer_name = models.CharField(max_length=200)
    customer_email = models.EmailField()
    customer_address = models.JSONField(
        default=dict, blank=True, help_text="Billing address snapshot"
    )

    # Notes and metadata
    notes = models.TextField(blank=True, help_text="Additional notes or terms")
    metadata = models.JSONField(default=dict, blank=True)

    # PDF generation
    pdf_generated = models.BooleanField(
        default=False, help_text="Whether PDF has been generated"
    )
    pdf_file = models.FileField(
        upload_to="invoices/%Y/%m/",
        null=True,
        blank=True,
        help_text="Generated PDF file",
    )

    def __str__(self):
        return f"Invoice {self.invoice_number} - {self.user.email} - {self.currency}{self.total_amount}"

    def save(self, *args, **kwargs):
        # Generate invoice number if not exists
        if not self.invoice_number:
            self.invoice_number = self.generate_invoice_number()

        # Update customer details from user
        if not self.customer_name:
            self.customer_name = self.user.get_full_name() or self.user.email
        if not self.customer_email:
            self.customer_email = self.user.email

        super().save(*args, **kwargs)

    @staticmethod
    def generate_invoice_number():
        """Generate unique invoice number"""
        import random
        import string
        from django.utils import timezone

        # Format: INV-YYYYMMDD-XXXX (e.g., INV-20251112-A3F9)
        date_part = timezone.now().strftime("%Y%m%d")
        random_part = "".join(
            random.choices(string.ascii_uppercase + string.digits, k=4)
        )
        invoice_number = f"INV-{date_part}-{random_part}"

        # Ensure uniqueness
        while Invoice.objects.filter(invoice_number=invoice_number).exists():
            random_part = "".join(
                random.choices(string.ascii_uppercase + string.digits, k=4)
            )
            invoice_number = f"INV-{date_part}-{random_part}"

        return invoice_number

    def calculate_totals(self):
        """Calculate invoice totals from line items"""
        line_items = self.line_items.all()

        self.subtotal = sum(item.total for item in line_items)
        self.total_amount = self.subtotal - self.discount_amount + self.tax_amount
        self.save(update_fields=["subtotal", "total_amount"])

    def mark_as_paid(self, payment_reference=None):
        """Mark invoice as paid"""
        self.status = "paid"
        self.paid_date = timezone.now()
        self.amount_paid = self.total_amount

        if payment_reference:
            self.payment_reference = payment_reference

        self.save(
            update_fields=["status", "paid_date", "amount_paid", "payment_reference"]
        )

    def is_overdue(self):
        """Check if invoice is overdue"""
        if self.status == "paid":
            return False

        if self.due_date and timezone.now() > self.due_date:
            return True

        return False

    class Meta:
        managed = True
        db_table = "invoices"
        ordering = ["-invoice_date"]
        indexes = [
            models.Index(fields=["invoice_number"]),
            models.Index(fields=["user", "status"]),
            models.Index(fields=["invoice_date"]),
        ]


class InvoiceLineItem(Basemodel):
    """Individual line items in an invoice"""

    invoice = models.ForeignKey(
        Invoice, on_delete=models.CASCADE, related_name="line_items"
    )

    description = models.CharField(max_length=500, help_text="Item description")
    quantity = models.DecimalField(
        max_digits=10,
        decimal_places=2,
        default=Decimal("1.00"),
        help_text="Quantity of items",
    )
    unit_price = models.DecimalField(
        max_digits=10, decimal_places=2, help_text="Price per unit"
    )
    total = models.DecimalField(
        max_digits=10,
        decimal_places=2,
        help_text="Total for this line (quantity * unit_price)",
    )

    # Optional references
    credit_package = models.ForeignKey(
        CreditPackage, on_delete=models.SET_NULL, null=True, blank=True
    )
    plan = models.ForeignKey(
        "plan.Plan", on_delete=models.SET_NULL, null=True, blank=True
    )

    metadata = models.JSONField(default=dict, blank=True)

    def __str__(self):
        return f"{self.description} - {self.quantity} x {self.unit_price}"

    def save(self, *args, **kwargs):
        # Calculate total
        self.total = self.quantity * self.unit_price
        super().save(*args, **kwargs)

        # Update invoice totals
        self.invoice.calculate_totals()

    class Meta:
        managed = True
        db_table = "invoice_line_items"
        ordering = ["created_at"]


class ProcessedWebhookEvent(models.Model):
    """Idempotency ledger for payment-provider webhooks.

    Paystack retries webhooks and may deliver an event more than once. We record
    each event's stable id here (unique) inside the same transaction that applies
    its effects, so a duplicate delivery is a no-op instead of a double-credit.
    """

    provider = models.CharField(max_length=32, default="paystack")
    # Stable, per-event id: "{event_type}:{data.id|reference|subscription_code}".
    event_id = models.CharField(max_length=255, unique=True)
    event_type = models.CharField(max_length=100, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"{self.provider}:{self.event_id}"

    class Meta:
        managed = True
        db_table = "processed_webhook_event"
        indexes = [
            models.Index(fields=["provider", "event_id"]),
            models.Index(fields=["-created_at"]),
        ]
