from django.db import models
from django.conf import settings
from django.utils import timezone
import secrets
from apps.Basemodel.models import Basemodel


class APIKey(Basemodel):
    user = models.ForeignKey(
        settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name="api_keys"
    )
    key = models.CharField(max_length=128, unique=True, default=secrets.token_urlsafe)
    is_active = models.BooleanField(default=True)
    name = models.CharField(
        max_length=100,
        null=True,
        blank=True,
        help_text="Human-readable name for this API key",
    )
    description = models.TextField(
        null=True,
        blank=True,
        help_text="Optional description of what this key is used for",
    )

    # Usage tracking fields
    last_used = models.DateTimeField(
        null=True, blank=True, help_text="When this key was last used"
    )
    usage_count = models.PositiveIntegerField(
        default=0, help_text="Total number of times this key has been used"
    )

    # Security and monitoring fields
    ip_address = models.GenericIPAddressField(
        null=True, blank=True, help_text="IP address when key was created"
    )
    user_agent = models.TextField(
        null=True, blank=True, help_text="User agent when key was created"
    )
    last_used_ip = models.GenericIPAddressField(
        null=True, blank=True, help_text="IP address of last usage"
    )
    last_used_user_agent = models.TextField(
        null=True, blank=True, help_text="User agent of last usage"
    )
    last_used_location = models.TextField(
        null=True, blank=True, help_text="Geographic location of last usage"
    )
    last_used_device = models.TextField(
        null=True, blank=True, help_text="Device information of last usage"
    )

    # Expiration and limits
    expires_at = models.DateTimeField(
        null=True, blank=True, help_text="When this key expires (optional)"
    )
    rate_limit_per_hour = models.PositiveIntegerField(
        default=1000, help_text="Maximum requests per hour"
    )

    # Metadata
    created_by_ip = models.GenericIPAddressField(null=True, blank=True)
    created_by_user_agent = models.TextField(null=True, blank=True)

    def __str__(self):
        user_name = (
            getattr(self.user, "username", str(self.user)) if self.user else "Unknown"
        )
        key_preview = (
            self.key[:8] if self.key and len(self.key) > 8 else (self.key or "")
        )
        return f"{user_name} - {self.name or key_preview}..."

    @classmethod
    def generate_for_user(
        cls,
        user,
        name=None,
        description=None,
        expires_at=None,
        ip_address=None,
        user_agent=None,
        **kwargs,
    ):
        """Generate a new API key for a user, deactivating existing active keys"""
        # Deactivate existing active keys for this user
        cls.objects.filter(user=user, is_active=True).update(is_active=False)

        # Create new key
        api_key = cls.objects.create(
            user=user,
            name=name,
            description=description,
            expires_at=expires_at,
            created_by_ip=ip_address,
            created_by_user_agent=user_agent,
            **kwargs,
        )
        return api_key

    def is_expired(self):
        """Check if the API key has expired"""
        if not self.expires_at:
            return False
        return timezone.now() > self.expires_at

    def is_valid(self):
        """Check if the API key is valid (active and not expired)"""
        return self.is_active and not self.is_expired()

    def update_usage(
        self, ip_address=None, user_agent=None, location=None, device=None
    ):
        """Update usage statistics when the key is used"""
        self.last_used = timezone.now()
        self.usage_count += 1

        if ip_address:
            self.last_used_ip = ip_address
        if user_agent:
            self.last_used_user_agent = user_agent
        if location:
            self.last_used_location = location
        if device:
            self.last_used_device = device

        self.save(
            update_fields=[
                "last_used",
                "usage_count",
                "last_used_ip",
                "last_used_user_agent",
                "last_used_location",
                "last_used_device",
            ]
        )

    def deactivate(self):
        """Deactivate this API key"""
        self.is_active = False
        self.save(update_fields=["is_active"])

    def get_masked_key(self):
        """Return a masked version of the key for display"""
        if not self.key:
            return "*" * 8
        if len(self.key) <= 8:
            return "*" * len(self.key)
        return f"{self.key[:4]}...{self.key[-4:]}"

    class Meta:
        managed = True
        db_table = "api_keys"
        verbose_name = "API Key"
        verbose_name_plural = "API Keys"
        ordering = ["-created_at"]
        indexes = [
            models.Index(fields=["user", "is_active"]),
            models.Index(fields=["key"]),
            models.Index(fields=["last_used"]),
        ]
