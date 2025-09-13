from rest_framework import serializers
from django.utils import timezone
from .models import APIKey


class APIKeySerializer(serializers.ModelSerializer):
    # Read-only fields for display
    masked_key = serializers.SerializerMethodField()
    is_expired = serializers.SerializerMethodField()
    is_valid = serializers.SerializerMethodField()
    days_until_expiry = serializers.SerializerMethodField()

    class Meta:
        model = APIKey
        fields = [
            "id",
            "key",
            "masked_key",
            "is_active",
            "is_expired",
            "is_valid",
            "name",
            "description",
            "last_used",
            "usage_count",
            "expires_at",
            "days_until_expiry",
            "rate_limit_per_hour",
            "created_at",
            "updated_at",
            "ip_address",
            "user_agent",
            "last_used_ip",
            "last_used_user_agent",
            "last_used_location",
            "last_used_device",
            "created_by_ip",
            "created_by_user_agent",
        ]
        read_only_fields = [
            "id",
            "key",
            "masked_key",
            "is_expired",
            "is_valid",
            "days_until_expiry",
            "last_used",
            "usage_count",
            "created_at",
            "updated_at",
            "ip_address",
            "user_agent",
            "last_used_ip",
            "last_used_user_agent",
            "last_used_location",
            "last_used_device",
            "created_by_ip",
            "created_by_user_agent",
        ]

    def get_masked_key(self, obj):
        return obj.get_masked_key()

    def get_is_expired(self, obj):
        return obj.is_expired()

    def get_is_valid(self, obj):
        return obj.is_valid()

    def get_days_until_expiry(self, obj):
        if not obj.expires_at:
            return None
        delta = obj.expires_at - timezone.now()
        return delta.days if delta.days > 0 else 0

    def validate_expires_at(self, value):
        if value and value <= timezone.now():
            raise serializers.ValidationError("Expiration date must be in the future.")
        return value

    def validate_rate_limit_per_hour(self, value):
        if value <= 0:
            raise serializers.ValidationError("Rate limit must be greater than 0.")
        return value

    def validate_name(self, value):
        if value and len(value.strip()) == 0:
            raise serializers.ValidationError("Name cannot be empty.")
        return value


class APIKeyCreateSerializer(serializers.ModelSerializer):
    """Serializer for creating new API keys with additional options"""

    class Meta:
        model = APIKey
        fields = ["name", "description", "expires_at", "rate_limit_per_hour"]

    def validate_expires_at(self, value):
        if value and value <= timezone.now():
            raise serializers.ValidationError("Expiration date must be in the future.")
        return value

    def validate_rate_limit_per_hour(self, value):
        if value <= 0:
            raise serializers.ValidationError("Rate limit must be greater than 0.")
        return value


class APIKeyUpdateSerializer(serializers.ModelSerializer):
    """Serializer for updating existing API keys"""

    class Meta:
        model = APIKey
        fields = [
            "name",
            "description",
            "expires_at",
            "rate_limit_per_hour",
            "is_active",
        ]

    def validate_expires_at(self, value):
        if value and value <= timezone.now():
            raise serializers.ValidationError("Expiration date must be in the future.")
        return value

    def validate_rate_limit_per_hour(self, value):
        if value <= 0:
            raise serializers.ValidationError("Rate limit must be greater than 0.")
        return value


class APIKeyUsageSerializer(serializers.ModelSerializer):
    """Serializer for API key usage statistics"""

    class Meta:
        model = APIKey
        fields = [
            "id",
            "name",
            "is_active",
            "last_used",
            "usage_count",
            "last_used_ip",
            "last_used_location",
            "last_used_device",
            "created_at",
            "expires_at",
        ]
        read_only_fields = fields
