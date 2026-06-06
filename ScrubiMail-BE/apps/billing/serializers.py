from rest_framework import serializers
from django.utils import timezone
from .models import (
    BillingProfile,
    CreditTransaction,
    Subscription,
    EmailValidationUsage,
    CreditPackage,
    CreditPackagePurchase,
    PromoCode,
    PromoCodeRedemption,
    Invoice,
    InvoiceLineItem,
)
from apps.plan.models import Plan
import logging

logger = logging.getLogger(__name__)


class PlanSerializer(serializers.ModelSerializer):
    """Serializer for Plan model"""

    class Meta:
        model = Plan
        fields = [
            "id",
            "name",
            "description",
            "price",
            "currency",
            "is_active",
            "credits_per_month",
            "additional_credit_price",
            "max_api_calls_per_hour",
            "max_bulk_emails",
            "supports_api",
            "supports_bulk",
            "priority_support",
            "trial_days",
            "features",
        ]


class CreditTransactionSerializer(serializers.ModelSerializer):
    """Serializer for CreditTransaction model"""

    is_expiring_soon = serializers.SerializerMethodField()
    days_until_expiry = serializers.SerializerMethodField()

    class Meta:
        model = CreditTransaction
        fields = [
            "id",
            "transaction_type",
            "amount",
            "description",
            "created_at",
            "paystack_payment_reference",
            "metadata",
            "expiry_date",
            "is_expired",
            "expired_at",
            "is_expiring_soon",
            "days_until_expiry",
        ]
        read_only_fields = ["id", "created_at"]

    def get_is_expiring_soon(self, obj):
        """Check if credits are expiring within 7 days"""
        return obj.is_expiring_soon(days=7)

    def get_days_until_expiry(self, obj):
        """Get days until expiry"""
        return obj.days_until_expiry()


class BillingProfileSerializer(serializers.ModelSerializer):
    """Serializer for BillingProfile model"""

    current_plan = PlanSerializer(read_only=True)
    usage_percentage = serializers.SerializerMethodField()
    credits_used_this_month = serializers.SerializerMethodField()

    class Meta:
        model = BillingProfile
        fields = [
            "id",
            "current_plan",
            "credits_remaining",
            "credits_used_this_month",
            "billing_status",
            "total_credits_purchased",
            "total_amount_spent",
            "last_credit_purchase",
            "plan_start_date",
            "plan_end_date",
            "auto_renew",
            "usage_percentage",
            "created_at",
            "updated_at",
        ]
        read_only_fields = [
            "id",
            "total_credits_purchased",
            "total_amount_spent",
            "last_credit_purchase",
            "created_at",
            "updated_at",
        ]

    def get_usage_percentage(self, obj):
        return obj.get_usage_percentage()

    def get_credits_used_this_month(self, obj):
        return obj.get_credits_used_this_month()


class SubscriptionSerializer(serializers.ModelSerializer):
    """Serializer for Subscription model"""

    plan = PlanSerializer(read_only=True)

    class Meta:
        model = Subscription
        fields = [
            "id",
            "plan",
            "status",
            "current_period_start",
            "current_period_end",
            "cancel_at_period_end",
            "trial_end",
            "next_billing_date",
            "created_at",
        ]
        read_only_fields = ["id", "created_at"]


class EmailValidationUsageSerializer(serializers.ModelSerializer):
    """Serializer for EmailValidationUsage model"""

    class Meta:
        model = EmailValidationUsage
        fields = [
            "id",
            "validation_request_id",
            "credits_consumed",
            "cost_per_credit",
            "validation_type",
            "email_count",
            "created_at",
        ]
        read_only_fields = ["id", "created_at"]


class BillingAnalyticsSerializer(serializers.Serializer):
    """Serializer for billing analytics data"""

    credits_remaining = serializers.IntegerField()
    credits_used_this_month = serializers.IntegerField()
    total_validations = serializers.IntegerField()
    current_plan = serializers.CharField()
    billing_status = serializers.CharField()
    usage_percentage = serializers.FloatField()


class CreditPurchaseSerializer(serializers.Serializer):
    """Serializer for credit purchase requests"""

    credits = serializers.IntegerField(min_value=1, max_value=10000)
    amount = serializers.DecimalField(max_digits=10, decimal_places=2)

    def validate_credits(self, value):
        if value < 1:
            raise serializers.ValidationError("Credits must be at least 1")
        if value > 10000:
            raise serializers.ValidationError("Credits cannot exceed 10,000")
        return value

    def validate_amount(self, value):
        if value <= 0:
            raise serializers.ValidationError("Amount must be greater than 0")
        return value


class PlanUpgradeSerializer(serializers.Serializer):
    """Serializer for plan upgrade requests"""

    plan_id = serializers.IntegerField()

    def validate_plan_id(self, value):
        try:
            plan = Plan.objects.get(id=value, is_active=True)
            return value
        except Plan.DoesNotExist:
            raise serializers.ValidationError("Invalid plan selected")


class PaymentVerificationSerializer(serializers.Serializer):
    """Serializer for payment verification"""

    reference = serializers.CharField(max_length=128)

    def validate_reference(self, value):
        if not value:
            raise serializers.ValidationError("Reference is required")
        return value


class BillingAddressSerializer(serializers.Serializer):
    """Serializer for billing address"""

    street = serializers.CharField(max_length=255)
    city = serializers.CharField(max_length=100)
    state = serializers.CharField(max_length=100)
    country = serializers.CharField(max_length=100)
    postal_code = serializers.CharField(max_length=20)

    def validate_country(self, value):
        # Add country validation if needed
        return value


class InvoiceSerializer(serializers.Serializer):
    """Serializer for invoice data"""

    invoice_id = serializers.CharField()
    amount = serializers.DecimalField(max_digits=10, decimal_places=2)
    currency = serializers.CharField()
    status = serializers.CharField()
    created_at = serializers.DateTimeField()
    due_date = serializers.DateTimeField()
    description = serializers.CharField()
    items = serializers.ListField(child=serializers.DictField())


class UsageStatsSerializer(serializers.Serializer):
    """Serializer for usage statistics"""

    period = serializers.CharField()
    total_validations = serializers.IntegerField()
    valid_emails = serializers.IntegerField()
    invalid_emails = serializers.IntegerField()
    risky_emails = serializers.IntegerField()
    success_rate = serializers.FloatField()
    credits_used = serializers.IntegerField()
    credits_remaining = serializers.IntegerField()
    cost_per_validation = serializers.DecimalField(max_digits=6, decimal_places=4)
    daily_usage = serializers.ListField(child=serializers.DictField())
    weekly_usage = serializers.ListField(child=serializers.DictField())
    monthly_usage = serializers.ListField(child=serializers.DictField())


class PaymentMethodSerializer(serializers.Serializer):
    """Serializer for payment method information"""

    method_id = serializers.CharField()
    type = serializers.CharField()
    last_four = serializers.CharField()
    brand = serializers.CharField()
    expiry_month = serializers.IntegerField()
    expiry_year = serializers.IntegerField()
    is_default = serializers.BooleanField()


class BillingHistorySerializer(serializers.Serializer):
    """Serializer for billing history"""

    transactions = CreditTransactionSerializer(many=True)
    subscriptions = SubscriptionSerializer(many=True)
    total_pages = serializers.IntegerField()
    current_page = serializers.IntegerField()
    has_next = serializers.BooleanField()
    has_previous = serializers.BooleanField()


class CreditPackageSerializer(serializers.ModelSerializer):
    """Serializer for credit packages"""

    effective_price = serializers.DecimalField(
        max_digits=10, decimal_places=2, read_only=True, source="get_effective_price"
    )
    price_per_credit = serializers.DecimalField(
        max_digits=10, decimal_places=4, read_only=True, source="get_price_per_credit"
    )
    is_available = serializers.BooleanField(read_only=True)
    savings = serializers.SerializerMethodField()

    class Meta:
        model = CreditPackage
        fields = [
            "id",
            "name",
            "description",
            "credits",
            "price",
            "original_price",
            "discount_percentage",
            "effective_price",
            "price_per_credit",
            "expiry_days",
            "is_active",
            "is_featured",
            "sort_order",
            "max_purchases_per_user",
            "total_available",
            "total_sold",
            "is_available",
            "savings",
            "created_at",
            "updated_at",
        ]
        read_only_fields = ["total_sold", "created_at", "updated_at"]

    def get_savings(self, obj):
        """Calculate savings amount"""
        if obj.original_price and obj.original_price > obj.price:
            return float(obj.original_price - obj.price)
        return 0.0

    def to_representation(self, instance):
        """Add user-specific purchase info if user is authenticated"""
        data = super().to_representation(instance)
        request = self.context.get("request")

        if request and request.user.is_authenticated:
            # Add user-specific purchase count
            user_purchases = CreditPackagePurchase.objects.filter(
                user=request.user, package=instance, status="completed"
            ).count()
            data["user_purchases"] = user_purchases
            data["can_purchase"] = instance.can_user_purchase(request.user)

        return data


class CreditPackagePurchaseSerializer(serializers.ModelSerializer):
    """Serializer for credit package purchases"""

    package_details = CreditPackageSerializer(source="package", read_only=True)

    class Meta:
        model = CreditPackagePurchase
        fields = [
            "id",
            "user",
            "billing_profile",
            "package",
            "package_details",
            "credits_purchased",
            "amount_paid",
            "currency",
            "payment_method",
            "payment_reference",
            "payment_provider",
            "status",
            "metadata",
            "purchased_at",
            "completed_at",
            "failed_at",
            "refunded_at",
            "created_at",
            "updated_at",
        ]
        read_only_fields = [
            "user",
            "billing_profile",
            "credits_purchased",
            "purchased_at",
            "completed_at",
            "failed_at",
            "refunded_at",
            "created_at",
            "updated_at",
        ]

    def create(self, validated_data):
        """Create purchase with automatic user and billing profile"""
        request = self.context.get("request")
        validated_data["user"] = request.user

        # Get or create billing profile
        billing_profile, _ = BillingProfile.objects.get_or_create(user=request.user)
        validated_data["billing_profile"] = billing_profile

        # Set credits from package
        package = validated_data["package"]
        validated_data["credits_purchased"] = package.credits

        # Set amount and currency
        validated_data["amount_paid"] = package.get_effective_price()
        validated_data["currency"] = validated_data.get("currency", "NGN")

        return super().create(validated_data)


class PurchaseCreditPackageSerializer(serializers.Serializer):
    """Serializer for purchasing a credit package"""

    package_id = serializers.UUIDField(required=True)
    payment_method = serializers.CharField(required=False, default="paystack")
    payment_reference = serializers.CharField(required=False, allow_blank=True)

    def validate_package_id(self, value):
        """Validate package exists and is available"""
        try:
            package = CreditPackage.objects.get(id=value)
        except CreditPackage.DoesNotExist:
            raise serializers.ValidationError("Credit package not found")

        if not package.is_available():
            raise serializers.ValidationError("This package is not currently available")

        request = self.context.get("request")
        if not package.can_user_purchase(request.user):
            raise serializers.ValidationError(
                f"You have reached the maximum purchase limit for this package "
                f"({package.max_purchases_per_user} purchases)"
            )

        return value

    def validate(self, attrs):
        """Additional validation"""
        package = CreditPackage.objects.get(id=attrs["package_id"])

        # Check if user has sufficient funds (if applicable)
        request = self.context.get("request")

        return attrs


class PromoCodeSerializer(serializers.ModelSerializer):
    """Serializer for promo codes"""

    is_valid = serializers.SerializerMethodField()
    discount_display = serializers.SerializerMethodField()
    usage_stats = serializers.SerializerMethodField()

    class Meta:
        model = PromoCode
        fields = [
            "id",
            "code",
            "description",
            "discount_type",
            "discount_value",
            "max_uses",
            "max_uses_per_user",
            "current_uses",
            "valid_from",
            "valid_until",
            "minimum_purchase_amount",
            "first_purchase_only",
            "is_active",
            "campaign_name",
            "valid_for_plans",
            "valid_for_packages",
            "is_valid",
            "discount_display",
            "usage_stats",
            "created_at",
            "updated_at",
        ]
        read_only_fields = [
            "current_uses",
            "created_at",
            "updated_at",
            "is_valid",
            "discount_display",
            "usage_stats",
        ]

    def __init__(self, *args, **kwargs):
        super().__init__(*args, **kwargs)
        # Set queryset for ManyToMany fields after initialization
        from apps.plan.models import Plan

        if "valid_for_plans" in self.fields:
            self.fields["valid_for_plans"] = serializers.PrimaryKeyRelatedField(
                many=True, queryset=Plan.objects.all(), required=False, allow_empty=True
            )
        if "valid_for_packages" in self.fields:
            self.fields["valid_for_packages"] = serializers.PrimaryKeyRelatedField(
                many=True,
                queryset=CreditPackage.objects.all(),
                required=False,
                allow_empty=True,
            )

    def validate_discount_type(self, value):
        """Normalize discount_type values"""
        # Map frontend values to backend values
        mapping = {
            "fixed_amount": "fixed",
            "percentage": "percentage",
            "free_credits": "free_credits",
        }
        return mapping.get(value, value)

    def create(self, validated_data):
        """Create promo code with ManyToMany relationships"""
        valid_for_plans = validated_data.pop("valid_for_plans", [])
        valid_for_packages = validated_data.pop("valid_for_packages", [])
        # Handle frontend field name mapping
        if "min_purchase_amount" in validated_data:
            validated_data["minimum_purchase_amount"] = validated_data.pop(
                "min_purchase_amount"
            )
        if "applicable_plans" in validated_data:
            valid_for_plans = validated_data.pop("applicable_plans", [])
        if "applicable_packages" in validated_data:
            valid_for_packages = validated_data.pop("applicable_packages", [])

        promo_code = PromoCode.objects.create(**validated_data)
        if valid_for_plans:
            promo_code.valid_for_plans.set(valid_for_plans)
        if valid_for_packages:
            promo_code.valid_for_packages.set(valid_for_packages)

        return promo_code

    def update(self, instance, validated_data):
        """Update promo code with ManyToMany relationships"""
        valid_for_plans = validated_data.pop("valid_for_plans", None)
        valid_for_packages = validated_data.pop("valid_for_packages", None)
        # Handle frontend field name mapping
        if "min_purchase_amount" in validated_data:
            validated_data["minimum_purchase_amount"] = validated_data.pop(
                "min_purchase_amount"
            )
        if "applicable_plans" in validated_data:
            valid_for_plans = validated_data.pop("applicable_plans", None)
        if "applicable_packages" in validated_data:
            valid_for_packages = validated_data.pop("applicable_packages", None)

        for attr, value in validated_data.items():
            setattr(instance, attr, value)
        instance.save()

        if valid_for_plans is not None:
            instance.valid_for_plans.set(valid_for_plans)
        if valid_for_packages is not None:
            instance.valid_for_packages.set(valid_for_packages)

        return instance

    def get_is_valid(self, obj):
        """Check if promo code is currently valid"""
        is_valid, message = obj.is_valid()
        return is_valid

    def get_discount_display(self, obj):
        """Get human-readable discount display"""
        if obj.discount_type == "percentage":
            return f"{obj.discount_value}% off"
        elif obj.discount_type == "fixed":
            return f"${obj.discount_value} off"
        elif obj.discount_type == "free_credits":
            return f"{int(obj.discount_value)} free credits"
        return ""

    def get_usage_stats(self, obj):
        """Get usage statistics"""
        remaining = None
        if obj.max_uses:
            remaining = max(0, obj.max_uses - obj.current_uses)

        return {
            "total_uses": obj.current_uses,
            "max_uses": obj.max_uses,
            "remaining_uses": remaining,
            "is_unlimited": obj.max_uses is None,
        }


class PromoCodeRedemptionSerializer(serializers.ModelSerializer):
    """Serializer for promo code redemptions"""

    promo_code_details = PromoCodeSerializer(source="promo_code", read_only=True)

    class Meta:
        model = PromoCodeRedemption
        fields = [
            "id",
            "promo_code",
            "promo_code_details",
            "user",
            "plan",
            "credit_package",
            "original_amount",
            "discount_amount",
            "final_amount",
            "bonus_credits",
            "metadata",
            "created_at",
        ]
        read_only_fields = ["user", "created_at"]


class ValidatePromoCodeSerializer(serializers.Serializer):
    """Serializer for validating promo codes"""

    code = serializers.CharField(max_length=50, required=True)
    plan_id = serializers.UUIDField(required=False, allow_null=True)
    package_id = serializers.UUIDField(required=False, allow_null=True)
    amount = serializers.DecimalField(
        max_digits=10, decimal_places=2, required=False, allow_null=True
    )

    def validate_code(self, value):
        """Validate promo code exists"""
        try:
            promo_code = PromoCode.objects.get(code=value.upper())
        except PromoCode.DoesNotExist:
            logger.error(f"Invalid promo code: {value}")
            raise serializers.ValidationError("Invalid promo code")

        return value.upper()

    def validate(self, attrs):
        """Validate promo code applicability"""
        code = attrs.get("code")
        plan_id = attrs.get("plan_id")
        package_id = attrs.get("package_id")
        amount = attrs.get("amount")

        promo_code = PromoCode.objects.get(code=code)
        request = self.context.get("request")

        # Get plan or package if provided
        plan = None
        package = None

        if plan_id:
            try:
                from apps.plan.models import Plan

                plan = Plan.objects.get(id=plan_id)
            except Plan.DoesNotExist:
                logger.error(f"Invalid plan ID: {plan_id}")
                raise serializers.ValidationError({"plan_id": "Invalid plan ID"})

        if package_id:
            try:
                package = CreditPackage.objects.get(id=package_id)
            except CreditPackage.DoesNotExist:
                raise serializers.ValidationError({"package_id": "Invalid package ID"})

        # Validate promo code
        is_valid, message = promo_code.is_valid(
            user=request.user if request else None,
            plan=plan,
            package=package,
            amount=amount,
        )

        if not is_valid:
            raise serializers.ValidationError(message)

        return attrs


class InvoiceLineItemSerializer(serializers.ModelSerializer):
    """Serializer for invoice line items"""

    class Meta:
        model = InvoiceLineItem
        fields = [
            "id",
            "description",
            "quantity",
            "unit_price",
            "total",
            "credit_package",
            "plan",
            "metadata",
            "created_at",
        ]
        read_only_fields = ["id", "total", "created_at"]


class InvoiceSerializer(serializers.ModelSerializer):
    """Serializer for invoices"""

    line_items = InvoiceLineItemSerializer(many=True, read_only=True)
    is_overdue = serializers.SerializerMethodField()
    balance_due = serializers.SerializerMethodField()

    class Meta:
        model = Invoice
        fields = [
            "id",
            "invoice_number",
            "user",
            "invoice_type",
            "status",
            "invoice_date",
            "due_date",
            "paid_date",
            "subtotal",
            "discount_amount",
            "tax_amount",
            "total_amount",
            "amount_paid",
            "currency",
            "payment_method",
            "payment_reference",
            "customer_name",
            "customer_email",
            "customer_address",
            "notes",
            "metadata",
            "pdf_generated",
            "line_items",
            "is_overdue",
            "balance_due",
            "created_at",
            "updated_at",
        ]
        read_only_fields = [
            "id",
            "invoice_number",
            "user",
            "pdf_generated",
            "created_at",
            "updated_at",
        ]

    def get_is_overdue(self, obj):
        """Check if invoice is overdue"""
        return obj.is_overdue()

    def get_balance_due(self, obj):
        """Calculate balance due"""
        return float(obj.total_amount - obj.amount_paid)


class CreateInvoiceSerializer(serializers.Serializer):
    """Serializer for creating invoices"""

    invoice_type = serializers.ChoiceField(
        choices=["subscription", "credit_package", "credit_purchase", "refund"]
    )
    credit_package_purchase_id = serializers.UUIDField(required=False, allow_null=True)
    subscription_id = serializers.UUIDField(required=False, allow_null=True)
    notes = serializers.CharField(required=False, allow_blank=True)

    def validate(self, attrs):
        """Validate invoice creation data"""
        invoice_type = attrs.get("invoice_type")

        if invoice_type == "credit_package":
            if not attrs.get("credit_package_purchase_id"):
                raise serializers.ValidationError(
                    "credit_package_purchase_id is required for credit_package invoices"
                )

        return attrs
