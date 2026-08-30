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
import pyotp
from rest_framework.test import APIRequestFactory, force_authenticate

from apps.Authentication import oauth_views
from apps.Authentication.models import OAuthExchangeCode, SocialAccount, TOTPDevice
from apps.Authentication.oauth_views import (
    OAuthCallbackView,
    OAuthError,
    OAuthLoginView,
    OAuthTokenExchangeView,
    SocialAccountsView,
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

    def _exchange(self, code, **extra):
        req = self.factory.post(
            "/oauth/exchange/", {"code": code, **extra}, format="json"
        )
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

    def test_suspended_user_cannot_exchange(self):
        rec = OAuthExchangeCode.issue(self.user, "github")
        self.user.is_active = False
        self.user.save(update_fields=["is_active"])
        resp = self._exchange(rec.code)
        self.assertEqual(resp.status_code, 403)
        self.assertNotIn("access_token", resp.data)

    def test_totp_user_must_satisfy_2fa_and_code_survives_the_challenge(self):
        """Signing in with a provider must not be a way around a TOTP device the
        user deliberately enabled."""
        device = TOTPDevice.objects.create(
            user=self.user, secret_key=pyotp.random_base32(), is_enabled=True
        )
        rec = OAuthExchangeCode.issue(self.user, "github")

        challenged = self._exchange(rec.code)
        self.assertEqual(challenged.status_code, 401)
        self.assertTrue(challenged.data["requires_2fa"])
        self.assertNotIn("access_token", challenged.data)

        # The challenge must not have burned the code.
        rec.refresh_from_db()
        self.assertFalse(rec.used)

        wrong = self._exchange(rec.code, totp_token="000000")
        self.assertEqual(wrong.status_code, 401)

        valid = self._exchange(rec.code, totp_token=pyotp.TOTP(device.secret_key).now())
        self.assertEqual(valid.status_code, 200)
        self.assertIn("access_token", valid.data)

    def test_backup_code_satisfies_2fa_and_is_consumed(self):
        device = TOTPDevice.objects.create(
            user=self.user, secret_key=pyotp.random_base32(), is_enabled=True
        )
        codes = device.generate_backup_codes(count=2)
        rec = OAuthExchangeCode.issue(self.user, "github")

        resp = self._exchange(rec.code, backup_code=codes[0])
        self.assertEqual(resp.status_code, 200)
        device.refresh_from_db()
        self.assertNotIn(codes[0], device.backup_codes)

    def test_disabled_totp_device_does_not_challenge(self):
        TOTPDevice.objects.create(
            user=self.user, secret_key=pyotp.random_base32(), is_enabled=False
        )
        rec = OAuthExchangeCode.issue(self.user, "github")
        self.assertEqual(self._exchange(rec.code).status_code, 200)


class ProviderLinkingTests(TestCase):
    """The link_required error tells users to link the provider from their
    account settings — these cover the flow that makes that possible."""

    def setUp(self):
        self.user = User.objects.create_user(email="link@example.com", password="pw")
        self.factory = APIRequestFactory()

    def test_login_view_records_link_intent_for_an_authenticated_caller(self):
        request = self.factory.get("/oauth/github/login/")
        request.session = SessionStore()
        client = mock.Mock()
        client.authorize_redirect.return_value = "https://github.com/login/oauth"

        with mock.patch.object(
            oauth_views.oauth, "create_client", return_value=client
        ), mock.patch.object(OAuthLoginView, "throttle_classes", []):
            view = OAuthLoginView.as_view()
            force_authenticate(request, user=self.user)
            response = view(request, provider="github")

        self.assertEqual(response.status_code, 200)
        self.assertTrue(response.data["linking"])
        self.assertEqual(
            request.session[oauth_views.SESSION_LINK_USER_ID], str(self.user.pk)
        )

    def test_callback_links_provider_to_the_session_user(self):
        request = self.factory.get("/oauth/github/callback/", HTTP_ACCEPT="text/html")
        request.session = SessionStore()
        request.session[oauth_views.SESSION_REDIRECT_URI] = (
            settings.OAUTH_FRONTEND_CALLBACK_URL
        )
        request.session[oauth_views.SESSION_LINK_USER_ID] = str(self.user.pk)

        client = mock.Mock()
        client.authorize_access_token.return_value = {"access_token": "gh"}
        with mock.patch.object(
            oauth_views.oauth, "create_client", return_value=client
        ), mock.patch.object(
            OAuthCallbackView,
            "get_user_info",
            # An unverified email is fine when linking: the account is already
            # proven by the JWT that started the flow.
            return_value={
                "id": "999",
                "email": "other@example.com",
                "email_verified": False,
            },
        ), mock.patch.object(
            OAuthCallbackView, "throttle_classes", []
        ):
            response = OAuthCallbackView.as_view()(request, provider="github")

        self.assertIn(response.status_code, (301, 302))
        location = response.get("Location", "") or getattr(response, "url", "")
        self.assertIn("linked=1", location)
        self.assertTrue(
            SocialAccount.objects.filter(
                user=self.user, provider="github", provider_uid="999"
            ).exists()
        )

    def test_unlinking_the_last_credential_is_refused(self):
        """An OAuth-only account has an unusable password; unlinking its only
        provider would lock the user out for good."""
        oauth_only = User.objects.create_user(email="only@example.com", password=None)
        SocialAccount.objects.create(
            user=oauth_only, provider="github", provider_uid="1"
        )

        request = self.factory.delete("/oauth/accounts/github/")
        force_authenticate(request, user=oauth_only)
        with mock.patch.object(SocialAccountsView, "throttle_classes", []):
            response = SocialAccountsView.as_view()(request, provider="github")

        self.assertEqual(response.status_code, 409)
        self.assertTrue(SocialAccount.objects.filter(user=oauth_only).exists())

    def test_unlinking_is_allowed_when_a_password_remains(self):
        SocialAccount.objects.create(user=self.user, provider="github", provider_uid="2")

        request = self.factory.delete("/oauth/accounts/github/")
        force_authenticate(request, user=self.user)
        with mock.patch.object(SocialAccountsView, "throttle_classes", []):
            response = SocialAccountsView.as_view()(request, provider="github")

        self.assertEqual(response.status_code, 204)
        self.assertFalse(SocialAccount.objects.filter(user=self.user).exists())


class CallbackTokenTransportTests(TestCase):
    def setUp(self):
        self.user = User.objects.create_user(email="cb@example.com", password="pw")

    def test_browser_redirect_carries_code_not_tokens(self):
        factory = APIRequestFactory()
        request = factory.get("/oauth/github/callback/", HTTP_ACCEPT="text/html")
        request.session = SessionStore()
        request.session["oauth_redirect_uri"] = settings.OAUTH_FRONTEND_CALLBACK_URL
        request.user = AnonymousUser()

        response = self._run_callback(request)

        self.assertIn(response.status_code, (301, 302))
        location = response.get("Location", "") or getattr(response, "url", "")
        self.assertNotIn("access_token", location)
        self.assertNotIn("refresh_token", location)
        self.assertIn("code=", location)

    def test_suspended_user_cannot_sign_in_through_a_provider(self):
        """Password login rejects is_active=False; the provider path must too,
        rather than handing out a token the next request would reject."""
        self.user.is_active = False
        self.user.save(update_fields=["is_active"])

        factory = APIRequestFactory()
        request = factory.get("/oauth/github/callback/", HTTP_ACCEPT="text/html")
        request.session = SessionStore()
        request.session[oauth_views.SESSION_REDIRECT_URI] = (
            settings.OAUTH_FRONTEND_CALLBACK_URL
        )

        response = self._run_callback(request)

        location = response.get("Location", "") or getattr(response, "url", "")
        self.assertIn("error=account_suspended", location)
        self.assertNotIn("code=", location)

    def _run_callback(self, request):
        """Drive the real view. Nothing in the response path is mocked — an
        earlier version stubbed out django.contrib.auth.login here, which hid a
        ValueError that made every browser callback a 500 in production."""
        client = mock.Mock()
        client.authorize_access_token.return_value = {"access_token": "gh"}
        with mock.patch.object(
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
            return OAuthCallbackView.as_view()(request, provider="github")


class ConfigInSettingsTests(TestCase):
    def test_no_hardcoded_hosts_or_private_ip_in_oauth_views(self):
        import inspect

        source = inspect.getsource(oauth_views)
        # Environment-specific hosts/IPs must not be hardcoded in the auth path.
        self.assertNotIn("192.168.", source)
        self.assertNotIn("scrubimail.com/api/auth/oauth", source)
