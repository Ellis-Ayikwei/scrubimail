from django.db import models
from django.conf import settings
from apps.User.models import User
import pyotp
import qrcode
import io
import base64
import secrets
from datetime import timedelta
from django.utils import timezone


class SocialAccount(models.Model):
    """A verified link between a User and an external OAuth identity.

    Identity is resolved by (provider, provider_uid) — never by email alone —
    so a provider account can only sign in as the user it is actually linked to.
    Linking a second provider to the same user is just a second row."""

    PROVIDER_CHOICES = [
        ("github", "GitHub"),
        ("gitlab", "GitLab"),
        ("google", "Google"),
    ]

    user = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name="social_accounts",
    )
    provider = models.CharField(max_length=32, choices=PROVIDER_CHOICES)
    provider_uid = models.CharField(max_length=255)
    email = models.EmailField(blank=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table = "social_account"
        # One external identity maps to exactly one link.
        unique_together = ("provider", "provider_uid")
        indexes = [
            models.Index(fields=["provider", "provider_uid"]),
            models.Index(fields=["user"]),
        ]

    def __str__(self):
        return f"{self.provider}:{self.provider_uid} -> {self.user_id}"


class OAuthExchangeCode(models.Model):
    """Short-lived, single-use code exchanged (over POST) for JWT tokens.

    Keeps tokens out of the browser redirect URL entirely: the callback redirects
    with only this opaque code; the SPA POSTs it to mint fresh tokens once."""

    code = models.CharField(max_length=64, unique=True)
    user = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE)
    provider = models.CharField(max_length=32, blank=True)
    used = models.BooleanField(default=False)
    expires_at = models.DateTimeField()
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table = "oauth_exchange_code"
        indexes = [models.Index(fields=["code"])]

    @classmethod
    def issue(cls, user, provider="", ttl_seconds=None):
        ttl = ttl_seconds or int(getattr(settings, "OAUTH_EXCHANGE_CODE_TTL", 120))
        return cls.objects.create(
            code=secrets.token_urlsafe(32),
            user=user,
            provider=provider,
            expires_at=timezone.now() + timedelta(seconds=ttl),
        )

    def is_valid(self):
        return (not self.used) and self.expires_at > timezone.now()


class TOTPDevice(models.Model):
    """
    Model to store TOTP (Time-based One-Time Password) devices for 2FA
    """

    user = models.OneToOneField(
        User, on_delete=models.CASCADE, related_name="totp_device"
    )
    secret_key = models.CharField(max_length=32, unique=True)
    is_enabled = models.BooleanField(default=False)
    created_at = models.DateTimeField(auto_now_add=True)
    last_used = models.DateTimeField(null=True, blank=True)
    backup_codes = models.JSONField(default=list, blank=True)

    class Meta:
        db_table = "totp_devices"
        verbose_name = "TOTP Device"
        verbose_name_plural = "TOTP Devices"

    def __str__(self):
        return f"TOTP Device for {self.user.email}"

    def generate_secret(self):
        """Generate a new secret key for TOTP"""
        if not self.secret_key:
            self.secret_key = pyotp.random_base32()
            self.save()
        return self.secret_key

    def get_totp_uri(self, issuer_name="ScrubiMail"):
        """Generate TOTP URI for QR code generation"""
        if not self.secret_key:
            self.generate_secret()

        totp = pyotp.TOTP(self.secret_key)
        return totp.provisioning_uri(name=self.user.email, issuer_name=issuer_name)

    def generate_qr_code(self, issuer_name="ScrubiMail"):
        """Generate QR code as base64 string"""
        uri = self.get_totp_uri(issuer_name)

        qr = qrcode.QRCode(
            version=1,
            error_correction=qrcode.constants.ERROR_CORRECT_L,
            box_size=10,
            border=4,
        )
        qr.add_data(uri)
        qr.make(fit=True)

        img = qr.make_image(fill_color="black", back_color="white")

        # Convert to base64
        buffer = io.BytesIO()
        img.save(buffer, format="PNG")
        img_str = base64.b64encode(buffer.getvalue()).decode()

        return f"data:image/png;base64,{img_str}"

    def verify_token(self, token):
        """Verify the provided TOTP token"""
        import logging

        logger = logging.getLogger(__name__)

        if not self.secret_key:
            logger.warning("No secret key found for TOTP device")
            return False

        totp = pyotp.TOTP(self.secret_key)
        current_time = totp.now()
        logger.info(f"Verifying token: {token}, Current TOTP: {current_time}")

        is_valid = totp.verify(token, valid_window=1)  # Allow 1 time step tolerance
        logger.info(f"Token verification result: {is_valid}")

        if is_valid:
            self.last_used = timezone.now()
            self.save(update_fields=["last_used"])

        return is_valid

    def generate_backup_codes(self, count=10):
        """Generate backup codes for account recovery"""
        import secrets
        import string

        codes = []
        for _ in range(count):
            code = "".join(
                secrets.choice(string.ascii_uppercase + string.digits) for _ in range(8)
            )
            codes.append(code)

        self.backup_codes = codes
        self.save(update_fields=["backup_codes"])
        return codes

    def verify_backup_code(self, code):
        """Verify and consume a backup code"""
        if not self.backup_codes or code not in self.backup_codes:
            return False

        # Remove the used backup code
        self.backup_codes.remove(code)
        self.save(update_fields=["backup_codes"])
        return True

    def enable_2fa(self, verification_token):
        """Enable 2FA after verifying the setup token"""
        if self.verify_token(verification_token):
            self.is_enabled = True
            self.save(update_fields=["is_enabled"])
            return True
        return False

    def disable_2fa(self):
        """Disable 2FA and clear backup codes"""
        self.is_enabled = False
        self.backup_codes = []
        self.save(update_fields=["is_enabled", "backup_codes"])


class TrustedDevice(models.Model):
    """
    Model to store trusted devices for "remember me" functionality
    """

    user = models.ForeignKey(
        User, on_delete=models.CASCADE, related_name="trusted_devices"
    )
    device_id = models.CharField(max_length=255)
    device_name = models.CharField(max_length=255, blank=True, null=True)
    device_fingerprint_hash = models.CharField(max_length=64)
    device_info = models.JSONField(default=dict, blank=True)
    refresh_token_hash = models.CharField(max_length=64, blank=True, null=True)
    created_at = models.DateTimeField(auto_now_add=True)
    last_used = models.DateTimeField(auto_now=True)
    expires_at = models.DateTimeField()
    is_active = models.BooleanField(default=True)

    class Meta:
        db_table = "trusted_devices"
        verbose_name = "Trusted Device"
        verbose_name_plural = "Trusted Devices"
        unique_together = ["user", "device_id"]
        ordering = ["-last_used"]

    def __str__(self):
        return f"Trusted Device for {self.user.email} - {self.device_name or self.device_id}"

    def is_expired(self):
        """Check if the trusted device has expired"""
        return timezone.now() > self.expires_at

    def deactivate(self):
        """Deactivate the trusted device"""
        self.is_active = False
        self.refresh_token_hash = ""
        self.save(update_fields=["is_active", "refresh_token_hash"])
