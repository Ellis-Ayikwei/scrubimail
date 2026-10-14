"""Admin user-management and validation-explorer endpoints.

Regression guards for:
- /admin/validations/stats/ returning only two fields, which crashed the
  Validation Explorer (it read valid_emails/success_rate/... -> undefined).
- /admin/validations/ and /admin/billing/ ignoring ?user_id=, so a user's
  detail page showed every user's validations and an empty credit history.
- the admin API-key list returning every user's plaintext key.
- an admin being able to suspend / delete / de-staff their own account.
"""

from django.contrib.auth import get_user_model
from django.core import mail
from django.urls import reverse
from rest_framework import status
from rest_framework.test import APITestCase

from apps.apikey.models import APIKey
from apps.billing.models import BillingProfile, CreditTransaction
from apps.validation.models import EmailValidation

User = get_user_model()


def _validation(user, email, outcome, score=50):
    return EmailValidation.objects.create(
        user=user,
        email=email,
        status="completed",
        score=score,
        metadata={"status": outcome, "validation_time": 0.25},
        breakdown={"risk_score": {"verdict": outcome.title(), "score": score}},
    )


class AdminValidationEndpointsTests(APITestCase):
    def setUp(self):
        self.admin = User.objects.create_user(email="admin@example.com", password="x", is_staff=True)
        self.alice = User.objects.create_user(email="alice@example.com", password="x")
        self.bob = User.objects.create_user(email="bob@example.com", password="x")
        _validation(self.alice, "a1@gmail.com", "valid", 95)
        _validation(self.alice, "a2@gmail.com", "invalid", 5)
        _validation(self.bob, "b1@yahoo.com", "catch_all", 60)
        EmailValidation.objects.create(user=self.bob, email="b2@yahoo.com", status="pending")
        self.client.force_authenticate(self.admin)

    def test_stats_has_every_field_the_explorer_reads(self):
        res = self.client.get(reverse("admin-validations-stats"))
        self.assertEqual(res.status_code, status.HTTP_200_OK)
        d = res.data
        self.assertEqual(d["total_validations"], 4)
        self.assertEqual(d["valid_emails"], 1)
        self.assertEqual(d["invalid_emails"], 1)
        self.assertEqual(d["catch_all_emails"], 1)
        self.assertEqual(d["pending"], 1)
        self.assertAlmostEqual(d["success_rate"], 33.3)
        self.assertEqual(d["processing_time_avg_ms"], 250)
        self.assertEqual({x["domain"] for x in d["top_domains"]}, {"gmail.com", "yahoo.com"})
        self.assertIn("recent_validations", d)
        self.assertTrue(d["daily_stats"])

    def test_stats_on_empty_table(self):
        EmailValidation.objects.all().delete()
        res = self.client.get(reverse("admin-validations-stats"))
        self.assertEqual(res.status_code, status.HTTP_200_OK)
        self.assertEqual(res.data["success_rate"], 0)
        self.assertIsNone(res.data["processing_time_avg_ms"])

    def test_list_filters_by_user_and_outcome(self):
        res = self.client.get(reverse("admin-validations-list"), {"user_id": str(self.alice.id)})
        self.assertEqual(res.data["count"], 2)
        self.assertTrue(all(r["user"]["email"] == "alice@example.com" for r in res.data["results"]))

        res = self.client.get(reverse("admin-validations-list"), {"status": "catch_all"})
        self.assertEqual([r["email"] for r in res.data["results"]], ["b1@yahoo.com"])
        self.assertEqual(res.data["results"][0]["processing_ms"], 250)

        res = self.client.get(reverse("admin-validations-list"), {"status": "pending"})
        self.assertEqual([r["email"] for r in res.data["results"]], ["b2@yahoo.com"])

    def test_list_respects_limit(self):
        res = self.client.get(reverse("admin-validations-list"), {"limit": 1})
        self.assertEqual(len(res.data["results"]), 1)
        self.assertEqual(res.data["count"], 4)


class AdminUserManagementTests(APITestCase):
    def setUp(self):
        self.admin = User.objects.create_user(email="admin@example.com", password="x", is_staff=True)
        self.user = User.objects.create_user(email="user@example.com", password="Old-passw0rd!")
        self.client.force_authenticate(self.admin)

    def test_admin_cannot_suspend_or_delete_self(self):
        url = reverse("admin-user-detail", args=[self.admin.id])
        self.assertEqual(self.client.patch(url, {"is_active": False}).status_code, 400)
        self.assertEqual(self.client.patch(url, {"is_staff": False}).status_code, 400)
        self.assertEqual(self.client.delete(url).status_code, 400)

    def test_suspend_syncs_account_status(self):
        url = reverse("admin-user-detail", args=[self.user.id])
        res = self.client.patch(url, {"is_active": False})
        self.assertEqual(res.status_code, 200)
        self.user.refresh_from_db()
        self.assertFalse(self.user.is_active)
        self.assertEqual(self.user.account_status, "suspended")

    def test_only_superuser_grants_superuser(self):
        url = reverse("admin-user-detail", args=[self.user.id])
        self.assertEqual(self.client.patch(url, {"is_superuser": True}).status_code, 403)

    def test_create_user_without_password_sends_reset(self):
        res = self.client.post(
            reverse("admin-user-create"),
            {"email": "New@Example.com", "first_name": "New"},
        )
        self.assertEqual(res.status_code, 201, res.data)
        created = User.objects.get(email="new@example.com")
        self.assertFalse(created.has_usable_password())
        self.assertTrue(res.data["reset_link_sent"])
        self.assertEqual(len(mail.outbox), 1)

    def test_create_rejects_duplicate_email(self):
        res = self.client.post(reverse("admin-user-create"), {"email": "user@example.com"})
        self.assertEqual(res.status_code, 400)

    def test_send_password_reset(self):
        res = self.client.post(reverse("admin-user-reset-password", args=[self.user.id]))
        self.assertEqual(res.status_code, 200)
        self.assertIn("/reset-password/", res.data["reset_url"])
        self.assertEqual(len(mail.outbox), 1)

    def test_set_password_validates_and_applies(self):
        url = reverse("admin-user-set-password", args=[self.user.id])
        self.assertEqual(self.client.post(url, {"password": "123"}).status_code, 400)
        res = self.client.post(url, {"password": "A-much-better-passw0rd"})
        self.assertEqual(res.status_code, 200, res.data)
        self.user.refresh_from_db()
        self.assertTrue(self.user.check_password("A-much-better-passw0rd"))

    def test_revoke_sessions(self):
        res = self.client.post(reverse("admin-user-revoke-sessions", args=[self.user.id]))
        self.assertEqual(res.status_code, 200)

    def test_summary(self):
        _validation(self.user, "x@gmail.com", "valid")
        res = self.client.get(reverse("admin-user-summary", args=[self.user.id]))
        self.assertEqual(res.status_code, 200)
        self.assertEqual(res.data["validations"]["total"], 1)
        self.assertEqual(res.data["validations"]["by_outcome"]["valid"], 1)
        self.assertTrue(res.data["security"]["has_usable_password"])

    def test_billing_list_filters_by_user(self):
        other = User.objects.create_user(email="other@example.com", password="x")
        for u in (self.user, other):
            bp, _ = BillingProfile.objects.get_or_create(user=u)
            CreditTransaction.objects.create(
                billing_profile=bp, transaction_type="grant", amount=5, description=u.email
            )
        res = self.client.get(reverse("admin-billing-list"), {"user_id": str(self.user.id)})
        self.assertEqual(res.status_code, 200)
        self.assertTrue(res.data)
        self.assertTrue(all(t["description"] == "user@example.com" for t in res.data))

    def test_api_key_list_hides_plaintext(self):
        APIKey.objects.create(user=self.user, name="k")
        res = self.client.get(reverse("admin-api-keys-list"), {"user_id": str(self.user.id)})
        self.assertEqual(res.status_code, 200)
        self.assertNotIn("key", res.data[0])
        self.assertIn("masked_key", res.data[0])

    def test_non_admin_forbidden(self):
        self.client.force_authenticate(self.user)
        res = self.client.get(reverse("admin-user-summary", args=[self.user.id]))
        self.assertEqual(res.status_code, 403)
