from rest_framework import serializers
from django.utils import timezone
from .models import BillingProfile, CreditTransaction, Subscription, EmailValidationUsage
from apps.plan.models import Plan


class PlanSerializer(serializers.ModelSerializer):
    """Serializer for Plan model"""
    
    class Meta:
        model = Plan
        fields = [
            'id', 'name', 'description', 'price', 'currency', 'is_active',
            'credits_per_month', 'additional_credit_price', 'max_api_calls_per_hour',
            'max_bulk_emails', 'supports_api', 'supports_bulk', 'priority_support',
            'trial_days', 'features'
        ]


class CreditTransactionSerializer(serializers.ModelSerializer):
    """Serializer for CreditTransaction model"""
    
    class Meta:
        model = CreditTransaction
        fields = [
            'id', 'transaction_type', 'amount', 'description', 'created_at',
            'paystack_payment_reference', 'metadata'
        ]
        read_only_fields = ['id', 'created_at']


class BillingProfileSerializer(serializers.ModelSerializer):
    """Serializer for BillingProfile model"""
    current_plan = PlanSerializer(read_only=True)
    usage_percentage = serializers.SerializerMethodField()
    credits_used_this_month = serializers.SerializerMethodField()
    
    class Meta:
        model = BillingProfile
        fields = [
            'id', 'current_plan', 'credits_remaining', 'credits_used_this_month',
            'billing_status', 'total_credits_purchased', 'total_amount_spent',
            'last_credit_purchase', 'plan_start_date', 'plan_end_date',
            'auto_renew', 'usage_percentage', 'created_at', 'updated_at'
        ]
        read_only_fields = [
            'id', 'total_credits_purchased', 'total_amount_spent',
            'last_credit_purchase', 'created_at', 'updated_at'
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
            'id', 'plan', 'status', 'current_period_start', 'current_period_end',
            'cancel_at_period_end', 'trial_end', 'next_billing_date', 'created_at'
        ]
        read_only_fields = ['id', 'created_at']


class EmailValidationUsageSerializer(serializers.ModelSerializer):
    """Serializer for EmailValidationUsage model"""
    
    class Meta:
        model = EmailValidationUsage
        fields = [
            'id', 'validation_request_id', 'credits_consumed', 'cost_per_credit',
            'validation_type', 'email_count', 'created_at'
        ]
        read_only_fields = ['id', 'created_at']


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
