from django.db import models
from django.conf import settings
from apps.Basemodel.models import Basemodel


class EmailValidation(Basemodel):
    STATUS_CHOICES = [
        ("pending", "Pending"),
        ("processing", "Processing"),
        ("completed", "Completed"),
        ("failed", "Failed"),
    ]

    JOB_TYPE_CHOICES = [
        ("single", "Single"),
        ("bulk", "Bulk"),
        ("api", "API"),
    ]

    email = models.EmailField()
    user = models.ForeignKey(
        settings.AUTH_USER_MODEL, on_delete=models.CASCADE, null=True
    )
    # Links a per-address result to its originating bulk job so the bulk task
    # can resume idempotently (skip already-completed addresses for this job)
    # and the status endpoint can report real per-job progress.
    bulk_job = models.ForeignKey(
        "BulkValidationJob",
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="validations",
    )
    status = models.CharField(max_length=16, choices=STATUS_CHOICES, default="pending")
    score = models.IntegerField(default=0)
    breakdown = models.JSONField(default=dict)
    suggestions = models.JSONField(default=list)
    warnings = models.JSONField(default=list)
    metadata = models.JSONField(default=dict)
    job_type = models.CharField(
        max_length=10, choices=JOB_TYPE_CHOICES, default="single"
    )
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return f"{self.email} ({self.status})"

    class Meta:
        db_table = "email_validation"
        managed = True
        indexes = [
            models.Index(fields=["user", "created_at"]),
            models.Index(fields=["status", "created_at"]),
            models.Index(fields=["email"]),
            # Supports the bulk task's resume query (completed rows per job).
            models.Index(fields=["bulk_job", "status"]),
        ]


class BulkValidationJob(Basemodel):
    STATUS_CHOICES = [
        ("pending", "Pending"),
        ("processing", "Processing"),
        ("completed", "Completed"),
        ("failed", "Failed"),
    ]

    user = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE)
    status = models.CharField(max_length=16, choices=STATUS_CHOICES, default="pending")
    emails = models.JSONField(default=list)  # List of email addresses
    total_emails = models.IntegerField(default=0)
    total_processed = models.IntegerField(default=0)
    progress = models.IntegerField(default=0)  # Percentage complete
    results_summary = models.JSONField(default=dict)  # Summary of results
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return f"Bulk Job {self.id} - {self.user.email} ({self.status})"

    class Meta:
        db_table = "bulk_validation_job"
        managed = True
        indexes = [
            models.Index(fields=["user", "created_at"]),
            models.Index(fields=["status", "created_at"]),
        ]


class ValidationStats(Basemodel):
    """Aggregated validation statistics for analytics"""

    user = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE)
    date = models.DateField()
    total_validations = models.IntegerField(default=0)
    valid_emails = models.IntegerField(default=0)
    invalid_emails = models.IntegerField(default=0)
    risky_emails = models.IntegerField(default=0)
    high_risk_emails = models.IntegerField(default=0)
    avg_score = models.FloatField(default=0.0)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = "validation_stats"
        managed = True
        unique_together = ["user", "date"]
        indexes = [
            models.Index(fields=["user", "date"]),
        ]


class DomainReputation(Basemodel):
    """Cached domain reputation data"""

    domain = models.CharField(max_length=255, unique=True)
    reputation_score = models.IntegerField(default=50)
    is_disposable = models.BooleanField(default=False)
    is_corporate = models.BooleanField(default=False)
    tld_risk = models.BooleanField(default=False)
    spam_trap_risk = models.FloatField(default=0.0)
    last_checked = models.DateTimeField(auto_now=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table = "domain_reputation"
        managed = True
        indexes = [
            models.Index(fields=["domain"]),
            models.Index(fields=["reputation_score"]),
            models.Index(fields=["is_disposable"]),
        ]
