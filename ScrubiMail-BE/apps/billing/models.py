from django.db import models
from django.conf import settings
from apps.Basemodel.models import Basemodel


class BillingProfile(Basemodel):
    user = models.OneToOneField(settings.AUTH_USER_MODEL, on_delete=models.CASCADE)
    stripe_customer_id = models.CharField(max_length=128, blank=True, null=True)
    plan = models.CharField(max_length=64, default="free")
    credits = models.IntegerField(default=100)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return f"{self.user} ({self.plan})"

    class Meta:
        managed = True
        db_table = "billing_profile"
