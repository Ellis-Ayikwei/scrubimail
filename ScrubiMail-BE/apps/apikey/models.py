from django.db import models
from django.conf import settings
import secrets
from apps.Basemodel.models import Basemodel


class APIKey(Basemodel):
    user = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE)
    key = models.CharField(max_length=128, unique=True, default=secrets.token_urlsafe)
    is_active = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"{self.user} - {self.key[:8]}..."

    @classmethod
    def generate_for_user(cls, user):
        cls.objects.filter(user=user, is_active=True).update(is_active=False)
        return cls.objects.create(user=user)

    class Meta:
        managed = True
        db_table = "api_keys"
