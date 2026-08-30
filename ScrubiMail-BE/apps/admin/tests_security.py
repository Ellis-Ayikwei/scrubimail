"""Admin security actions: force-disabling a user's 2FA.

Regression guard for calling the wrong model method (totp.disable() — which does
not exist — instead of totp.disable_2fa()).
"""

import pyotp
from django.contrib.auth import get_user_model
from django.urls import reverse
from rest_framework import status
from rest_framework.test import APITestCase

from apps.Authentication.models import TOTPDevice

User = get_user_model()


class AdminDisable2FATests(APITestCase):
    def setUp(self):
        self.admin = User.objects.create_user(email="admin@example.com", password="x")
        self.admin.is_staff = True
        self.admin.save(update_fields=["is_staff"])
        self.user = User.objects.create_user(email="user@example.com", password="x")

    def test_admin_disables_2fa(self):
        totp = TOTPDevice.objects.create(
            user=self.user,
            secret_key=pyotp.random_base32(),
            is_enabled=True,
            backup_codes=["a", "b", "c"],
        )
        self.client.force_authenticate(self.admin)

        res = self.client.post(reverse("admin-disable-2fa", args=[self.user.id]))
        self.assertEqual(res.status_code, status.HTTP_200_OK)

        totp.refresh_from_db()
        self.assertFalse(totp.is_enabled)
        self.assertEqual(totp.backup_codes, [])

    def test_no_device_is_a_noop_not_a_500(self):
        self.client.force_authenticate(self.admin)
        res = self.client.post(reverse("admin-disable-2fa", args=[self.user.id]))
        self.assertEqual(res.status_code, status.HTTP_200_OK)

    def test_non_admin_forbidden(self):
        self.client.force_authenticate(self.user)
        res = self.client.post(reverse("admin-disable-2fa", args=[self.user.id]))
        self.assertEqual(res.status_code, status.HTTP_403_FORBIDDEN)
