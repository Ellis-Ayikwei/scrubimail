"""OAuth / social login.

Identity is resolved by (provider, provider_uid) via SocialAccount — never by
email alone — and auto-linking to an existing account requires a
provider-verified email. Tokens are never placed in a redirect URL: the browser
gets a one-time code exchanged over POST. All environment-specific config
(callback + frontend redirect URIs) lives in settings.
"""

import logging
from urllib.parse import urlencode

from django.conf import settings
from django.contrib.auth import login
from django.db import transaction
from django.shortcuts import redirect
from rest_framework import status
from rest_framework.permissions import AllowAny
from rest_framework.response import Response
from rest_framework.views import APIView
from rest_framework_simplejwt.tokens import RefreshToken
from authlib.integrations.django_client import OAuth

from apps.User.models import User
from apps.User.serializer import UserSerializer
from .models import OAuthExchangeCode, SocialAccount

logger = logging.getLogger(__name__)

SUPPORTED_PROVIDERS = ("github", "gitlab", "google")


class OAuthError(Exception):
    """OAuth flow failure with a stable, client-safe error code (aligns with the
    Issue-8 error envelope vocabulary)."""

    def __init__(self, code, message, http_status=status.HTTP_400_BAD_REQUEST):
        self.code = code
        self.message = message
        self.http_status = http_status
        super().__init__(message)


def _envelope(code, message):
    return {"success": False, "error": {"code": code, "message": message}}


# Client config + redirect URIs come from settings per environment — no hardcoded
# hosts or private IPs. The registered redirect_uri is the backend callback the
# provider calls back to (settings.<PROVIDER>_CALLBACK_URL).
oauth = OAuth()
oauth.register(
    name="github",
    client_id=settings.GITHUB_CLIENT_ID,
    client_secret=settings.GITHUB_CLIENT_SECRET,
    access_token_url="https://github.com/login/oauth/access_token",
    access_token_params=None,
    authorize_url="https://github.com/login/oauth/authorize",
    authorize_params=None,
    api_base_url="https://api.github.com/",
    client_kwargs={"scope": "read:user user:email"},
    redirect_uri=settings.GITHUB_CALLBACK_URL,
)
oauth.register(
    name="gitlab",
    client_id=settings.GITLAB_CLIENT_ID,
    client_secret=settings.GITLAB_CLIENT_SECRET,
    access_token_url="https://gitlab.com/oauth/token",
    access_token_params=None,
    authorize_url="https://gitlab.com/oauth/authorize",
    authorize_params=None,
    api_base_url="https://gitlab.com/api/v4/",
    client_kwargs={"scope": "read_user"},
    redirect_uri=settings.GITLAB_CALLBACK_URL,
)
oauth.register(
    name="google",
    client_id=settings.GOOGLE_CLIENT_ID,
    client_secret=settings.GOOGLE_CLIENT_SECRET,
    server_metadata_url="https://accounts.google.com/.well-known/openid-configuration",
    client_kwargs={"scope": "openid email profile"},
    redirect_uri=settings.GOOGLE_CALLBACK_URL,
)


def _validate_frontend_redirect(uri):
    """Return `uri` only if it is on the configured allowlist, else the default
    frontend callback — never an attacker-supplied location (which would leak
    the one-time code)."""
    allowed = getattr(settings, "OAUTH_ALLOWED_REDIRECT_URIS", [])
    default = getattr(settings, "OAUTH_FRONTEND_CALLBACK_URL", "")
    return uri if (uri and uri in allowed) else default


class OAuthLoginView(APIView):
    permission_classes = [AllowAny]

    def get(self, request, provider):
        """Initiate OAuth login for the specified provider."""
        if provider not in SUPPORTED_PROVIDERS:
            return Response(
                _envelope("invalid_provider", "Unsupported provider"),
                status=status.HTTP_400_BAD_REQUEST,
            )

        frontend_redirect = _validate_frontend_redirect(
            request.GET.get("redirect_uri")
        )
        request.session["oauth_redirect_uri"] = frontend_redirect

        try:
            oauth_client = oauth.create_client(provider)
            if not oauth_client:
                raise OAuthError(
                    "oauth_init_failed",
                    f"OAuth client for {provider} is not configured.",
                    status.HTTP_500_INTERNAL_SERVER_ERROR,
                )
            result = oauth_client.authorize_redirect(request)
            if isinstance(result, tuple) and len(result) == 2:
                authorization_url, state = result
            elif isinstance(result, str):
                authorization_url, state = result, None
            elif hasattr(result, "url"):
                authorization_url, state = result.url, None
            else:
                raise OAuthError(
                    "oauth_init_failed",
                    "Unexpected response from the OAuth client.",
                    status.HTTP_500_INTERNAL_SERVER_ERROR,
                )
            return Response(
                {
                    "authorization_url": authorization_url,
                    "state": state,
                    "provider": provider,
                    "redirect_uri": frontend_redirect,
                }
            )
        except OAuthError as exc:
            return Response(_envelope(exc.code, exc.message), status=exc.http_status)
        except Exception:
            logger.exception("OAuth login init failed for %s", provider)
            return Response(
                _envelope(
                    "oauth_init_failed",
                    f"Failed to initialize OAuth for {provider}.",
                ),
                status=status.HTTP_500_INTERNAL_SERVER_ERROR,
            )


class OAuthCallbackView(APIView):
    permission_classes = [AllowAny]

    def get(self, request, provider):
        """Handle the OAuth callback: verify identity, then hand back tokens via
        a one-time code (browser) or directly (JSON clients)."""
        if provider not in SUPPORTED_PROVIDERS:
            return self._fail(request, "invalid_provider", "Unsupported provider")

        try:
            oauth_client = oauth.create_client(provider)
            token = oauth_client.authorize_access_token(request)
            user_info = self.get_user_info(oauth_client, token, provider)
            authed_user = request.user if request.user.is_authenticated else None
            user = self.get_or_create_user(user_info, provider, request_user=authed_user)
        except OAuthError as exc:
            return self._fail(request, exc.code, exc.message)
        except Exception:
            logger.exception("OAuth callback error for %s", provider)
            return self._fail(request, "oauth_failed", "OAuth authentication failed")

        login(request, user)
        redirect_uri = _validate_frontend_redirect(
            request.session.get("oauth_redirect_uri")
        )

        # JSON API clients receive tokens directly; browsers NEVER do.
        if request.headers.get("Accept") == "application/json":
            refresh = RefreshToken.for_user(user)
            return Response(
                {
                    "user": UserSerializer(user).data,
                    "access_token": str(refresh.access_token),
                    "refresh_token": str(refresh),
                    "provider": provider,
                }
            )

        # Browser: redirect with ONLY an opaque, single-use code — no tokens in
        # the URL (query strings leak via history/logs/Referer).
        code = OAuthExchangeCode.issue(user, provider=provider)
        query = urlencode({"code": code.code, "provider": provider})
        return redirect(f"{redirect_uri}?{query}")

    def _fail(self, request, code, message):
        redirect_uri = _validate_frontend_redirect(
            request.session.get("oauth_redirect_uri")
        )
        if request.headers.get("Accept") == "application/json":
            return Response(
                _envelope(code, message), status=status.HTTP_400_BAD_REQUEST
            )
        return redirect(f"{redirect_uri}?{urlencode({'error': code})}")

    # ------------------------------------------------------------ provider info
    def get_user_info(self, oauth_client, token, provider):
        """Fetch normalized user info INCLUDING a provider-verified email flag."""
        if provider == "github":
            info = oauth_client.get("user", token=token).json()
            email, verified = self._github_primary_email(oauth_client, token, info)
            name = (info.get("name") or "").split()
            return {
                "id": str(info["id"]),
                "email": email,
                "email_verified": verified,
                "username": info.get("login", ""),
                "first_name": name[0] if name else "",
                "last_name": " ".join(name[1:]) if len(name) > 1 else "",
                "avatar_url": info.get("avatar_url", ""),
            }

        if provider == "gitlab":
            info = oauth_client.get("user", token=token).json()
            # GitLab only exposes a confirmed email on the account.
            email = info.get("email", "")
            return {
                "id": str(info["id"]),
                "email": email,
                "email_verified": bool(email),
                "username": info.get("username", ""),
                "first_name": info.get("first_name", ""),
                "last_name": info.get("last_name", ""),
                "avatar_url": info.get("avatar_url", ""),
            }

        if provider == "google":
            info = oauth_client.parse_id_token(
                token, nonce=self.request.session.get("oauth_nonce")
            )
            return {
                "id": info["sub"],
                "email": info.get("email", ""),
                "email_verified": bool(info.get("email_verified", False)),
                "username": (info.get("email", "").split("@") or [""])[0],
                "first_name": info.get("given_name", ""),
                "last_name": info.get("family_name", ""),
                "avatar_url": info.get("picture", ""),
            }

        raise OAuthError("invalid_provider", "Unsupported provider")

    def _github_primary_email(self, oauth_client, token, info):
        """GitHub's /user email may be null or unverified; the emails API is the
        authoritative source for the primary, verified address."""
        try:
            entries = oauth_client.get("user/emails", token=token).json()
            for entry in entries:
                if entry.get("primary") and entry.get("verified"):
                    return entry.get("email", ""), True
            for entry in entries:
                if entry.get("verified"):
                    return entry.get("email", ""), True
        except Exception:
            logger.warning("GitHub emails API failed; treating email as unverified")
        return info.get("email") or "", False

    # --------------------------------------------------------- identity linking
    def get_or_create_user(self, user_info, provider, request_user=None):
        """Resolve the User for this provider identity.

        Order matters:
          1. An existing SocialAccount for (provider, uid) is authoritative.
          2. If the request is already authenticated, link this provider to that
             user (explicit linking).
          3. Otherwise auto-create/login ONLY with a provider-verified email and
             ONLY when no unlinked account already owns that email — this closes
             the email-based account-takeover vector.
        """
        provider_uid = str(user_info["id"])
        email = (user_info.get("email") or "").strip().lower()
        email_verified = bool(user_info.get("email_verified"))

        link = (
            SocialAccount.objects.filter(provider=provider, provider_uid=provider_uid)
            .select_related("user")
            .first()
        )
        if link:
            if request_user and request_user.pk != link.user_id:
                raise OAuthError(
                    "already_linked",
                    "This provider account is linked to a different user.",
                    status.HTTP_409_CONFLICT,
                )
            return link.user

        # Explicit linking while authenticated.
        if request_user is not None:
            SocialAccount.objects.create(
                provider=provider,
                provider_uid=provider_uid,
                user=request_user,
                email=email,
            )
            return request_user

        # Unauthenticated login requires a provider-verified email.
        if not email or not email_verified:
            raise OAuthError(
                "unverified_email",
                f"Your {provider} email is not verified. Verify it with the "
                "provider or sign in another way.",
            )

        existing = User.objects.filter(email__iexact=email).first()
        if existing:
            # Email owns an existing account NOT linked to this provider — the
            # takeover vector. Refuse to auto-login; require explicit linking.
            raise OAuthError(
                "link_required",
                "An account with this email already exists. Sign in, then link "
                f"{provider} from your account settings.",
                status.HTTP_409_CONFLICT,
            )

        with transaction.atomic():
            user = User.objects.create_user(
                email=email,
                first_name=user_info.get("first_name", ""),
                last_name=user_info.get("last_name", ""),
                password=None,  # OAuth-only account
            )
            SocialAccount.objects.create(
                provider=provider,
                provider_uid=provider_uid,
                user=user,
                email=email,
            )
        return user


class OAuthTokenExchangeView(APIView):
    """Exchange the one-time code from the browser redirect for fresh JWT tokens
    (over POST). The code is single-use and short-lived; no token ever appears in
    a URL."""

    permission_classes = [AllowAny]

    def post(self, request):
        code = (request.data.get("code") or "").strip()
        if not code:
            return Response(
                _envelope("invalid_code", "Missing code"),
                status=status.HTTP_400_BAD_REQUEST,
            )
        with transaction.atomic():
            record = (
                OAuthExchangeCode.objects.select_for_update()
                .filter(code=code)
                .first()
            )
            if record is None or not record.is_valid():
                return Response(
                    _envelope("invalid_code", "Invalid or expired code"),
                    status=status.HTTP_400_BAD_REQUEST,
                )
            record.used = True
            record.save(update_fields=["used"])
            user = record.user

        refresh = RefreshToken.for_user(user)
        return Response(
            {
                "user": UserSerializer(user).data,
                "access_token": str(refresh.access_token),
                "refresh_token": str(refresh),
            }
        )


class OAuthProvidersView(APIView):
    permission_classes = [AllowAny]

    def get(self, request):
        """Get available OAuth providers and their configuration"""
        providers = {
            "github": {
                "name": "GitHub",
                "client_id": settings.GITHUB_CLIENT_ID,
                "authorize_url": "/api/auth/oauth/github/login/",
                "available": bool(
                    settings.GITHUB_CLIENT_ID and settings.GITHUB_CLIENT_SECRET
                ),
            },
            "gitlab": {
                "name": "GitLab",
                "client_id": settings.GITLAB_CLIENT_ID,
                "authorize_url": "/api/auth/oauth/gitlab/login/",
                "available": bool(
                    settings.GITLAB_CLIENT_ID and settings.GITLAB_CLIENT_SECRET
                ),
            },
            "google": {
                "name": "Google",
                "client_id": settings.GOOGLE_CLIENT_ID,
                "authorize_url": "/api/auth/oauth/google/login/",
                "available": bool(
                    settings.GOOGLE_CLIENT_ID and settings.GOOGLE_CLIENT_SECRET
                ),
            },
        }

        return Response(providers)
