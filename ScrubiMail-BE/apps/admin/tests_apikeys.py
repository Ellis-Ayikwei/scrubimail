"""Admin API-key management: an admin can view a user's keys and provision new
ones, and — critically — a non-admin cannot touch anyone's keys.

Before the fix these views were IsAuthenticated and returned APIKey.objects.all(),
so any logged-in user could enumerate and revoke every user's keys.
"""

from django.contrib.auth import get_user_model
from django.urls import reverse
from rest_framework import status
from rest_framework.test import APITestCase

from apps.apikey.models import APIKey

User = get_user_model()


class AdminAPIKeyManagementTests(APITestCase):
    def setUp(self):
        self.admin = User.objects.create_user(email="admin@example.com", password="x")
        self.admin.is_staff = True
        self.admin.save(update_fields=["is_staff"])
        self.target = User.objects.create_user(email="target@example.com", password="x")
        self.other = User.objects.create_user(email="other@example.com", password="x")
        self.list_url = reverse("admin-api-keys-list")

    def test_non_admin_is_forbidden(self):
        self.client.force_authenticate(self.target)
        res = self.client.get(self.list_url, {"user_id": str(self.target.id)})
        self.assertEqual(res.status_code, status.HTTP_403_FORBIDDEN)

    def test_list_is_scoped_to_the_requested_user(self):
        APIKey.generate_for_user(user=self.target, name="target-key")
        APIKey.generate_for_user(user=self.other, name="other-key")
        self.client.force_authenticate(self.admin)

        res = self.client.get(self.list_url, {"user_id": str(self.target.id)})
        self.assertEqual(res.status_code, status.HTTP_200_OK)
        rows = res.data if isinstance(res.data, list) else res.data.get("results", [])
        self.assertEqual(len(rows), 1)
        self.assertEqual(rows[0]["name"], "target-key")
        # The tab reads these; they must be present.
        self.assertIn("prefix", rows[0])
        self.assertIn("last_used_at", rows[0])

    def test_create_provisions_for_the_user_and_returns_the_key_once(self):
        self.client.force_authenticate(self.admin)
        res = self.client.post(
            self.list_url, {"user_id": str(self.target.id), "name": "prod"}
        )
        self.assertEqual(res.status_code, status.HTTP_201_CREATED)
        self.assertTrue(res.data.get("key"), "plaintext key must be returned on create")
        self.assertEqual(res.data["prefix"], res.data["key"][:8])
        self.assertTrue(
            APIKey.objects.filter(user=self.target, name="prod", is_active=True).exists()
        )

    def test_revoke_soft_deletes(self):
        key = APIKey.generate_for_user(user=self.target, name="to-revoke")
        self.client.force_authenticate(self.admin)
        res = self.client.delete(reverse("admin-api-key-detail", args=[key.id]))
        self.assertIn(res.status_code, (status.HTTP_200_OK, status.HTTP_204_NO_CONTENT))
        key.refresh_from_db()
        self.assertFalse(key.is_active)
