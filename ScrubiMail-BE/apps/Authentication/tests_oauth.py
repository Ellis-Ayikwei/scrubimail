"""Issue 11 — social login identity linking, verified-email gating, one-time
code token transport (no tokens in URLs), and config-in-settings."""

from datetime import timedelta
from unittest import mock

from django.conf import settings
from django.contrib.auth import get_user_model
from django.contrib.auth.models import AnonymousUser
from django.contrib.sessions.backends.db import SessionStore
from django.test import TestCase
from django.utils import timezone
from rest_framework.test import APIRequestFactory

from apps.Authentication import oauth_views
from apps.Authentication.models import OAuthExchangeCode, SocialAccount
from apps.Authentication.oauth_views import (
    OAuthCallbackView,
    OAuthError,
    OAuthTokenExchangeView,
)

User = get_user_model()


class GetOrCreateUserTests(TestCase):
    def setUp(self):
        self.view = OAuthCallbackView()

    def test_unverified_email_cannot_take_over_password_account(self):
        victim = User.objects.create_user(email="victim@example.com", password="pw")
        info = {"id": "gh-1", "email": "victim@example.com", "email_verified": False}
        with self.assertRaises(OAuthError) as ctx:
            self.view.get_or_create_user(info, "github")
        self.assertEqual(ctx.exception.code, "unverified_email")
        # The victim account is untouched and unlinked.
        self.assertFalse(SocialAccount.objects.filter(user=victim).exists())

    def test_verified_email_on_existing_account_requires_explicit_link(self):
        User.objects.create_user(email="u@example.com", password="pw")
        info = {"id": "gh-2", "email": "u@example.com", "email_verified": True}
        with self.assertRaises(OAuthError) as ctx:
            self.view.get_or_create_user(info, "github")
        self.assertEqual(ctx.exception.code, "link_required")

    def test_verified_email_new_user_is_created_and_linked(self):
        info = {
            "id": "gh-3",
            "email": "new@example.com",
            "email_verified": True,
            "first_name": "New",
        }
        user = self.view.get_or_create_user(info, "github")
        self.assertEqual(user.email, "new@example.com")
        self.assertTrue(
            SocialAccount.objects.filter(
                provider="github", provider_uid="gh-3", user=user
            ).exists()
        )

    def test_identity_resolves_by_uid_not_email(self):
        user = User.objects.create_user(email="linked@example.com", password=None)
        SocialAccount.objects.create(
            provider="github", provider_uid="gh-4", user=user, email="linked@example.com"
        )
        # A changed email in the payload still resolves to the linked user by uid.
        info = {"id": "gh-4", "email": "changed@example.com", "email_verified": True}
        self.assertEqual(self.view.get_or_create_user(info, "github"), user)

    def test_authenticated_linking_creates_two_social_accounts(self):
        user = User.objects.create_user(email="multi@example.com", password="pw")
        self.view.get_or_create_user(
            {"id": "gh-5", "email": "multi@example.com", "email_verified": True},
            "github",
            request_user=user,
        )
        self.view.get_or_create_user(
            {"id": "go-5", "email": "multi@example.com", "email_verified": True},
            "google",
            request_user=user,
        )
        rows = SocialAccount.objects.filter(user=user)
        self.assertEqual(rows.count(), 2)
        self.assertEqual(
            set(rows.values_list("provider", flat=True)), {"github", "google"}
        )


class TokenExchangeTests(TestCase):
    def setUp(self):
        self.user = User.objects.create_user(email="ex@example.com", password="pw")
        self.factory = APIRequestFactory()

    def _exchange(self, code):
        req = self.factory.post("/oauth/exchange/", {"code": code}, format="json")
        with mock.patch.object(OAuthTokenExchangeView, "throttle_classes", []):
            return OAuthTokenExchangeView.as_view()(req)

    def test_valid_code_returns_tokens_and_is_single_use(self):
        rec = OAuthExchangeCode.issue(self.user, "github")
        resp = self._exchange(rec.code)
        self.assertEqual(resp.status_code, 200)
        self.assertIn("access_token", resp.data)
        self.assertIn("refresh_token", resp.data)
        # Single-use: a second exchange of the same code fails.
        resp2 = self._exchange(rec.code)
        self.assertEqual(resp2.status_code, 400)

    def test_expired_code_rejected(self):
        rec = OAuthExchangeCode.issue(self.user, "github")
        rec.expires_at = timezone.now() - timedelta(seconds=1)
        rec.save(update_fields=["expires_at"])
        self.assertEqual(self._exchange(rec.code).status_code, 400)

    def test_missing_code_rejected(self):
        self.assertEqual(self._exchange("").status_code, 400)


class CallbackTokenTransportTests(TestCase):
    def setUp(self):
        self.user = User.objects.create_user(email="cb@example.com", password="pw")

    def test_browser_redirect_carries_code_not_tokens(self):
        factory = APIRequestFactory()
        request = factory.get("/oauth/github/callback/", HTTP_ACCEPT="text/html")
        request.session = SessionStore()
        request.session["oauth_redirect_uri"] = settings.OAUTH_FRONTEND_CALLBACK_URL
        request.user = AnonymousUser()

        client = mock.Mock()
        client.authorize_access_token.return_value = {"access_token": "gh"}
        with mock.patch.object(oauth_views, "login"), mock.patch.object(
            oauth_views.oauth, "create_client", return_value=client
        ), mock.patch.object(
            OAuthCallbackView,
            "get_user_info",
            return_value={"id": "1", "email": "cb@example.com", "email_verified": True},
        ), mock.patch.object(
            OAuthCallbackView, "get_or_create_user", return_value=self.user
        ), mock.patch.object(
            OAuthCallbackView, "throttle_classes", []
        ):
            response = OAuthCallbackView.as_view()(request, provider="github")

        self.assertIn(response.status_code, (301, 302))
        location = response.get("Location", "") or getattr(response, "url", "")
        self.assertNotIn("access_token", location)
        self.assertNotIn("refresh_token", location)
        self.assertIn("code=", location)


class ConfigInSettingsTests(TestCase):
    def test_no_hardcoded_hosts_or_private_ip_in_oauth_views(self):
        import inspect

        source = inspect.getsource(oauth_views)
        # Environment-specific hosts/IPs must not be hardcoded in the auth path.
        self.assertNotIn("192.168.", source)
        self.assertNotIn("scrubimail.com/api/auth/oauth", source)
