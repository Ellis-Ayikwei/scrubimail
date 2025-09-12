from rest_framework import serializers
from .models import (
    EmailValidation,
    BulkValidationJob,
    ValidationStats,
    DomainReputation,
)


class EmailValidationSerializer(serializers.ModelSerializer):
    class Meta:
        model = EmailValidation
        fields = [
            "id",
            "email",
            "status",
            "score",
            "breakdown",
            "suggestions",
            "warnings",
            "metadata",
            "job_type",
            "created_at",
            "updated_at",
        ]


class EmailValidationRequestSerializer(serializers.Serializer):
    email = serializers.EmailField()
    real_time = serializers.BooleanField(default=False)


class BulkEmailValidationSerializer(serializers.Serializer):
    emails = serializers.ListField(
        child=serializers.EmailField(),
        allow_empty=False,
        max_length=10000,  # Limit bulk uploads
    )


class BulkJobSerializer(serializers.ModelSerializer):
    class Meta:
        model = BulkValidationJob
        fields = [
            "id",
            "status",
            "total_emails",
            "total_processed",
            "progress",
            "results_summary",
            "created_at",
            "updated_at",
        ]


class ValidationStatsSerializer(serializers.ModelSerializer):
    class Meta:
        model = ValidationStats
        fields = [
            "date",
            "total_validations",
            "valid_emails",
            "invalid_emails",
            "risky_emails",
            "high_risk_emails",
            "avg_score",
        ]


class DomainReputationSerializer(serializers.ModelSerializer):
    class Meta:
        model = DomainReputation
        fields = [
            "domain",
            "reputation_score",
            "is_disposable",
            "is_corporate",
            "tld_risk",
            "spam_trap_risk",
            "last_checked",
        ]


class ValidationResultSerializer(serializers.Serializer):
    """Detailed validation result serializer"""

    id = serializers.IntegerField()
    email = serializers.EmailField()
    status = serializers.CharField()
    score = serializers.IntegerField()
    verdict = serializers.CharField()
    is_valid = serializers.BooleanField()
    breakdown = serializers.DictField()
    suggestions = serializers.ListField(child=serializers.CharField())
    warnings = serializers.ListField(child=serializers.CharField())
    validation_time = serializers.FloatField()
    created_at = serializers.DateTimeField()


class BulkJobStatusSerializer(serializers.Serializer):
    """Bulk job status serializer"""

    job_id = serializers.IntegerField()
    status = serializers.CharField()
    progress = serializers.IntegerField()
    total_emails = serializers.IntegerField()
    total_processed = serializers.IntegerField()
    summary = serializers.DictField()
    created_at = serializers.DateTimeField()
    updated_at = serializers.DateTimeField()


class ValidationAnalyticsSerializer(serializers.Serializer):
    """Analytics data serializer"""

    period = serializers.DictField()
    overview = serializers.DictField()
    daily_stats = serializers.ListField(child=serializers.DictField())
    top_domains = serializers.ListField(child=serializers.DictField())
