from django.contrib import admin
from .models import Plan


@admin.register(Plan)
class PlanAdmin(admin.ModelAdmin):
    list_display = ['name', 'price', 'yearly_price', 'credits_per_month', 'is_active', 'created_at']
    list_filter = ['is_active', 'supports_api', 'supports_bulk', 'priority_support']
    search_fields = ['name', 'description']
    readonly_fields = ['created_at', 'updated_at']
    
    fieldsets = (
        ('Basic Information', {
            'fields': ('name', 'description', 'is_active')
        }),
        ('Pricing', {
            'fields': ('price', 'yearly_price', 'currency')
        }),
        ('Credits & Billing', {
            'fields': ('credits_per_month', 'additional_credit_price', 'paystack_plan_code')
        }),
        ('Plan Limits', {
            'fields': ('max_api_calls_per_hour', 'max_bulk_emails', 'supports_api', 'supports_bulk')
        }),
        ('Support & Trial', {
            'fields': ('priority_support', 'trial_days')
        }),
        ('Features', {
            'fields': ('features',)
        }),
        ('Timestamps', {
            'fields': ('created_at', 'updated_at'),
            'classes': ('collapse',)
        }),
    )
