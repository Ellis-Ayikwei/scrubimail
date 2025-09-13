from django.contrib import admin
from django.utils.html import format_html
from django.urls import reverse
from django.utils import timezone
from .models import APIKey


@admin.register(APIKey)
class APIKeyAdmin(admin.ModelAdmin):
    list_display = [
        "user",
        "name",
        "masked_key_display",
        "is_active",
        "is_expired_display",
        "usage_count",
        "last_used",
        "created_at",
        "expires_at",
    ]
    list_filter = ["is_active", "created_at", "last_used", "expires_at", "user"]
    search_fields = ["user__username", "user__email", "name", "key", "description"]
    readonly_fields = [
        "key",
        "created_at",
        "updated_at",
        "usage_count",
        "last_used",
        "ip_address",
        "user_agent",
        "last_used_ip",
        "last_used_user_agent",
        "last_used_location",
        "last_used_device",
        "created_by_ip",
        "created_by_user_agent",
    ]

    fieldsets = (
        (
            "Basic Information",
            {"fields": ("user", "key", "name", "description", "is_active")},
        ),
        (
            "Usage Tracking",
            {
                "fields": (
                    "usage_count",
                    "last_used",
                    "last_used_ip",
                    "last_used_user_agent",
                    "last_used_location",
                    "last_used_device",
                ),
                "classes": ("collapse",),
            },
        ),
        (
            "Security & Limits",
            {"fields": ("expires_at", "rate_limit_per_hour"), "classes": ("collapse",)},
        ),
        (
            "Creation Metadata",
            {
                "fields": (
                    "ip_address",
                    "user_agent",
                    "created_by_ip",
                    "created_by_user_agent",
                ),
                "classes": ("collapse",),
            },
        ),
        (
            "Timestamps",
            {"fields": ("created_at", "updated_at"), "classes": ("collapse",)},
        ),
    )

    actions = ["deactivate_selected", "activate_selected", "regenerate_selected"]

    def masked_key_display(self, obj):
        """Display masked version of the API key"""
        return format_html(
            '<code style="background: #f0f0f0; padding: 2px 4px; border-radius: 3px;">{}</code>',
            obj.get_masked_key(),
        )

    masked_key_display.short_description = "API Key"
    masked_key_display.admin_order_field = "key"

    def is_expired_display(self, obj):
        """Display expiration status with color coding"""
        if not obj.expires_at:
            return format_html('<span style="color: #666;">Never</span>')

        if obj.is_expired():
            return format_html(
                '<span style="color: #d32f2f; font-weight: bold;">Expired</span>'
            )
        else:
            days_left = (obj.expires_at - timezone.now()).days
            if days_left <= 7:
                color = "#ff9800"  # Orange for warning
            else:
                color = "#4caf50"  # Green for good
            return format_html(
                '<span style="color: {};">{} days</span>', color, days_left
            )

    is_expired_display.short_description = "Expires"
    is_expired_display.admin_order_field = "expires_at"

    def deactivate_selected(self, request, queryset):
        """Admin action to deactivate selected API keys"""
        updated = queryset.filter(is_active=True).update(is_active=False)
        self.message_user(request, f"Successfully deactivated {updated} API key(s).")

    deactivate_selected.short_description = "Deactivate selected API keys"

    def activate_selected(self, request, queryset):
        """Admin action to activate selected API keys"""
        updated = queryset.filter(is_active=False).update(is_active=True)
        self.message_user(request, f"Successfully activated {updated} API key(s).")

    activate_selected.short_description = "Activate selected API keys"

    def regenerate_selected(self, request, queryset):
        """Admin action to regenerate selected API keys"""
        count = 0
        for api_key in queryset:
            # Deactivate current key
            api_key.deactivate()

            # Create new key with same settings
            APIKey.generate_for_user(
                user=api_key.user,
                name=api_key.name,
                description=api_key.description,
                expires_at=api_key.expires_at,
                rate_limit_per_hour=api_key.rate_limit_per_hour,
                ip_address=request.META.get("REMOTE_ADDR"),
                user_agent=request.META.get("HTTP_USER_AGENT", ""),
            )
            count += 1

        self.message_user(request, f"Successfully regenerated {count} API key(s).")

    regenerate_selected.short_description = "Regenerate selected API keys"

    def get_queryset(self, request):
        """Optimize queryset with select_related"""
        return super().get_queryset(request).select_related("user")

    def has_add_permission(self, request):
        """Prevent adding API keys through admin (use API instead)"""
        return False

    def has_change_permission(self, request, obj=None):
        """Allow limited changes to API keys"""
        return True

    def has_delete_permission(self, request, obj=None):
        """Prevent deletion (use deactivation instead)"""
        return False
