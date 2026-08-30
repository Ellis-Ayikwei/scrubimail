"""OAuth / social login.

Identity is resolved by (provider, provider_uid) via SocialAccount — never by
email alone — and auto-linking to an existing account requires a
provider-verified email. Tokens are never placed in a redirect URL: the browser
gets a one-time code exchanged over POST. All environment-specific config
(callback + frontend redirect URIs) lives in settings.

The flow is stateless as far as authentication goes — no Django session login
happens here. The session is used only to carry short-lived flow state across
the provider round-trip (authlib's state/nonce, the frontend redirect target,
and the "I am linking a provider to this account" intent).
"""

import logging
from urllib.parse import urlencode

from django.conf import settings
from django.db import transaction
from django.shortcuts import redirect
from django.utils import timezone
from rest_framework import status
from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView
from rest_framework_simplejwt.tokens import RefreshToken
from authlib.integrations.django_client import OAuth

from apps.User.models import User
from apps.User.serializer import UserSerializer
from .models import OAuthExchangeCode, SocialAccount, TOTPDevice

logger = logging.getLogger(__name__)

SUPPORTED_PROVIDERS = ("github", "gitlab", "google")

# Session keys holding per-flow state across the provider round-trip.
SESSION_REDIRECT_URI = "oauth_redirect_uri"
SESSION_LINK_USER_ID = "oauth_link_user_id"


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


def provider_availability():
    """Which providers actually have credentials configured in this environment."""
    return {
        "github": bool(settings.GITHUB_CLIENT_ID and settings.GITHUB_CLIENT_SECRET),
        "gitlab": bool(settings.GITLAB_CLIENT_ID and settings.GITLAB_CLIENT_SECRET),
        "google": bool(settings.GOOGLE_CLIENT_ID and settings.GOOGLE_CLIENT_SECRET),
    }


def _validate_frontend_redirect(uri):
    """Return `uri` only if it is on the configured allowlist, else the default
    frontend callback — never an attacker-supplied location (which would leak
    the one-time code).

    A non-allowlisted URI is a misconfiguration far more often than an attack
    (a frontend running on an unregistered port), and silently redirecting to
    the default sends the user to a dead origin with no clue why — so log it.
    """
    allowed = getattr(settings, "OAUTH_ALLOWED_REDIRECT_URIS", [])
    default = getattr(settings, "OAUTH_FRONTEND_CALLBACK_URL", "")
    if uri and uri not in allowed:
        logger.warning(
            "OAuth redirect_uri %r is not in OAUTH_ALLOWED_REDIRECT_URIS %r; "
            "falling back to %r",
            uri,
            allowed,
            default,
        )
    return uri if (uri and uri in allowed) else default


def _has_2fa(user):
    device = TOTPDevice.objects.filter(user=user).first()
    return bool(device and device.is_enabled), device


class OAuthLoginView(APIView):
    """Start the provider round-trip.

    Called by the SPA over XHR, so the Authorization header is present when the
    user is already signed in. That is the only point in the flow where we can
    observe the caller's identity (the provider's callback is a plain browser
    navigation with no header), so an authenticated caller's id is stashed in
    the session here and picked up by the callback to link the provider.
    """

    permission_classes = [AllowAny]

    def get(self, request, provider):
        if provider not in SUPPORTED_PROVIDERS:
            return Response(
                _envelope("invalid_provider", "Unsupported provider"),
                status=status.HTTP_400_BAD_REQUEST,
            )
        if not provider_availability().get(provider):
            return Response(
                _envelope(
                    "provider_unavailable",
                    f"{provider} sign-in is not configured on this server.",
                ),
                status=status.HTTP_400_BAD_REQUEST,
            )

        frontend_redirect = _validate_frontend_redirect(
            request.GET.get("redirect_uri")
        )
        request.session[SESSION_REDIRECT_URI] = frontend_redirect

        # Linking intent: only trusted because it comes from a JWT-authenticated
        # XHR, not from a query parameter the browser could be tricked into.
        if request.user and request.user.is_authenticated:
            request.session[SESSION_LINK_USER_ID] = str(request.user.pk)
        else:
            request.session.pop(SESSION_LINK_USER_ID, None)

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
                    "linking": SESSION_LINK_USER_ID in request.session,
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
    """Handle the provider callback.

    This is a browser navigation, never an XHR, so it carries no Authorization
    header — authentication classes are disabled explicitly rather than left to
    silently produce AnonymousUser.
    """

    permission_classes = [AllowAny]
    authentication_classes = []

    def get(self, request, provider):
        """Verify the provider identity, then hand back tokens via a one-time
        code (browser) or directly (JSON clients)."""
        if provider not in SUPPORTED_PROVIDERS:
            return self._fail(request, "invalid_provider", "Unsupported provider")

        linking = False
        try:
            oauth_client = oauth.create_client(provider)
            token = oauth_client.authorize_access_token(request)
            user_info = self.get_user_info(oauth_client, token, provider)
            link_user = self._link_target(request)
            linking = link_user is not None
            user = self.get_or_create_user(
                user_info, provider, request_user=link_user
            )
            # A suspended account must not be able to sidestep the password
            # login's suspension check by coming in through a provider.
            if not user.is_active:
                raise OAuthError(
                    "account_suspended",
                    "Your account has been suspended. Please contact support.",
                    status.HTTP_403_FORBIDDEN,
                )
        except OAuthError as exc:
            return self._fail(request, exc.code, exc.message)
        except Exception:
            logger.exception("OAuth callback error for %s", provider)
            return self._fail(request, "oauth_failed", "OAuth authentication failed")

        redirect_uri = _validate_frontend_redirect(
            request.session.get(SESSION_REDIRECT_URI)
        )
        self._clear_flow_state(request)

        # JSON API clients receive tokens directly; browsers NEVER do.
        # 2FA is enforced on the exchange step, so this direct path is only for
        # non-browser clients and still honours the user's TOTP device.
        if request.headers.get("Accept") == "application/json":
            has_2fa, _ = _has_2fa(user)
            if has_2fa:
                return Response(
                    _envelope(
                        "requires_2fa",
                        "This account has two-factor authentication enabled. "
                        "Use the browser sign-in flow.",
                    ),
                    status=status.HTTP_403_FORBIDDEN,
                )
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
        params = {"code": code.code, "provider": provider}
        if linking:
            params["linked"] = "1"
        return redirect(f"{redirect_uri}?{urlencode(params)}")

    def _link_target(self, request):
        """Resolve the account this flow was started from, if any.

        The id was written by OAuthLoginView from a JWT-authenticated request,
        so it is trustworthy; it is still re-checked against a live, active user.
        """
        user_id = request.session.get(SESSION_LINK_USER_ID)
        if not user_id:
            return None
        user = User.objects.filter(pk=user_id, is_active=True).first()
        if user is None:
            logger.warning("OAuth link intent referenced unknown user %s", user_id)
        return user

    def _clear_flow_state(self, request):
        request.session.pop(SESSION_REDIRECT_URI, None)
        request.session.pop(SESSION_LINK_USER_ID, None)

    def _fail(self, request, code, message):
        redirect_uri = _validate_frontend_redirect(
            request.session.get(SESSION_REDIRECT_URI)
        )
        self._clear_flow_state(request)
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
            # authorize_access_token already decoded and nonce-validated the
            # id_token against the state it stored — re-parsing here would
            # repeat the work with the nonce no longer available.
            info = token.get("userinfo")
            if not info:
                raise OAuthError("oauth_failed", "Google did not return an id_token.")
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
          2. If the flow was started from a signed-in session, link this
             provider to that user (explicit linking).
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
    a URL.

    This is also where two-factor is enforced: signing in with a provider must
    not be a way around a TOTP device the user deliberately enabled. An
    unsatisfied 2FA challenge leaves the code unconsumed so the SPA can retry
    with a token within the code's TTL.
    """

    permission_classes = [AllowAny]
    authentication_classes = []

    def post(self, request):
        code = (request.data.get("code") or "").strip()
        if not code:
            return Response(
                _envelope("invalid_code", "Missing code"),
                status=status.HTTP_400_BAD_REQUEST,
            )

        record = OAuthExchangeCode.objects.select_related("user").filter(code=code).first()
        if record is None or not record.is_valid():
            return Response(
                _envelope("invalid_code", "Invalid or expired code"),
                status=status.HTTP_400_BAD_REQUEST,
            )

        user = record.user
        if not user.is_active:
            return Response(
                _envelope(
                    "account_suspended",
                    "Your account has been suspended. Please contact support.",
                ),
                status=status.HTTP_403_FORBIDDEN,
            )

        has_2fa, device = _has_2fa(user)
        if has_2fa:
            totp_token = (request.data.get("totp_token") or "").strip()
            backup_code = (request.data.get("backup_code") or "").strip()
            if not totp_token and not backup_code:
                # Do NOT consume the code — the SPA will re-POST it with the token.
                return Response(
                    {
                        "requires_2fa": True,
                        "detail": "TOTP token or backup code is required for 2FA",
                    },
                    status=status.HTTP_401_UNAUTHORIZED,
                )
            verified = (
                device.verify_token(totp_token)
                if totp_token
                else device.verify_backup_code(backup_code)
            )
            if not verified:
                return Response(
                    {
                        "requires_2fa": True,
                        **_envelope("invalid_2fa", "Invalid verification code"),
                    },
                    status=status.HTTP_401_UNAUTHORIZED,
                )

        # Claim the code atomically; a concurrent exchange must lose the race.
        with transaction.atomic():
            claimed = OAuthExchangeCode.objects.select_for_update().filter(
                pk=record.pk, used=False
            ).first()
            if claimed is None or not claimed.is_valid():
                return Response(
                    _envelope("invalid_code", "Invalid or expired code"),
                    status=status.HTTP_400_BAD_REQUEST,
                )
            claimed.used = True
            claimed.save(update_fields=["used"])

        user.last_login = timezone.now()
        user.save(update_fields=["last_login"])

        refresh = RefreshToken.for_user(user)
        return Response(
            {
                "user": UserSerializer(user).data,
                "access_token": str(refresh.access_token),
                "refresh_token": str(refresh),
                "requires_2fa": False,
            }
        )


class OAuthProvidersView(APIView):
    """Which providers this deployment can actually offer — the SPA renders its
    buttons from this rather than from a hardcoded list, so a provider without
    credentials is never shown."""

    permission_classes = [AllowAny]
    authentication_classes = []

    DISPLAY = {
        "github": {"name": "GitHub", "color": "#24292e", "icon": "github"},
        "gitlab": {"name": "GitLab", "color": "#fc6d26", "icon": "gitlab"},
        "google": {"name": "Google", "color": "#4285f4", "icon": "google"},
    }

    def get(self, request):
        availability = provider_availability()
        return Response(
            {
                key: {
                    **self.DISPLAY[key],
                    "client_id": getattr(settings, f"{key.upper()}_CLIENT_ID", None),
                    "authorize_url": f"/scrubimail/api/v1/auth/oauth/{key}/login/",
                    "available": availability[key],
                }
                for key in SUPPORTED_PROVIDERS
            }
        )


class SocialAccountsView(APIView):
    """List the providers linked to the signed-in account, and unlink one.

    Unlinking is refused when it would remove the account's last way to sign in
    (an OAuth-only account has an unusable password), which would otherwise lock
    the user out permanently.
    """

    permission_classes = [IsAuthenticated]

    def get(self, request):
        links = SocialAccount.objects.filter(user=request.user).order_by("provider")
        availability = provider_availability()
        linked = {
            link.provider: {
                "provider": link.provider,
                "email": link.email,
                "linked_at": link.created_at,
            }
            for link in links
        }
        return Response(
            {
                "linked": list(linked.values()),
                "available": [
                    p
                    for p in SUPPORTED_PROVIDERS
                    if availability[p] and p not in linked
                ],
                "has_password": request.user.has_usable_password(),
            }
        )

    def delete(self, request, provider):
        if provider not in SUPPORTED_PROVIDERS:
            return Response(
                _envelope("invalid_provider", "Unsupported provider"),
                status=status.HTTP_400_BAD_REQUEST,
            )
        link = SocialAccount.objects.filter(
            user=request.user, provider=provider
        ).first()
        if link is None:
            return Response(
                _envelope("not_linked", f"{provider} is not linked to this account."),
                status=status.HTTP_404_NOT_FOUND,
            )

        remaining = (
            SocialAccount.objects.filter(user=request.user).exclude(pk=link.pk).count()
        )
        if remaining == 0 and not request.user.has_usable_password():
            return Response(
                _envelope(
                    "last_credential",
                    "This is your only way to sign in. Set a password first, "
                    "then unlink this provider.",
                ),
                status=status.HTTP_409_CONFLICT,
            )

        link.delete()
        return Response(status=status.HTTP_204_NO_CONTENT)
