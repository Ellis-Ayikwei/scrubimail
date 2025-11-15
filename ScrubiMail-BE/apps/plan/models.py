from django.db import models


class Plan(models.Model):
    name = models.CharField(max_length=50, unique=True)
    description = models.TextField(blank=True)
    price = models.DecimalField(max_digits=10, decimal_places=2, default=0.00)
    yearly_price = models.DecimalField(max_digits=10, decimal_places=2, null=True, blank=True, help_text="Yearly price (if null, calculated as monthly * 10)")
    currency = models.CharField(max_length=10, default="USD")
    is_active = models.BooleanField(default=True)
    features = models.JSONField(default=dict, blank=True)
    
    # Billing specific fields
    credits_per_month = models.PositiveIntegerField(default=100)
    additional_credit_price = models.DecimalField(max_digits=6, decimal_places=4, default=0.01)
    paystack_plan_code = models.CharField(max_length=128, null=True, blank=True)
    
    # Plan limits
    max_api_calls_per_hour = models.PositiveIntegerField(default=100)
    max_bulk_emails = models.PositiveIntegerField(default=1000)
    supports_api = models.BooleanField(default=False)
    supports_bulk = models.BooleanField(default=False)
    priority_support = models.BooleanField(default=False)
    
    # Trial settings
    trial_days = models.PositiveIntegerField(default=0)
    
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return self.name
    
    def get_monthly_credits(self):
        """Get monthly credits for this plan"""
        return self.credits_per_month
    
    def get_additional_credit_price(self):
        """Get price per additional credit"""
        return self.additional_credit_price
    
    class Meta:
        managed = True
        db_table = "plans"
        ordering = ['price']
