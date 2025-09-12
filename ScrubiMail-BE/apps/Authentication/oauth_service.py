from django.conf import settings
from django.urls import reverse
from authlib.integrations.django_client import OAuth
import logging

logger = logging.getLogger(__name__)

# Initialize OAuth
oauth = OAuth()


def get_oauth_client(provider):
    """Get OAuth client for the specified provider"""
    if provider == "github":
        return oauth.create_client("github")
    elif provider == "gitlab":
        return oauth.create_client("gitlab")
    elif provider == "google":
        return oauth.create_client("google")
    else:
        raise ValueError(f"Unsupported provider: {provider}")


def get_authorization_url(provider, request, redirect_uri=None):
    """Generate authorization URL for OAuth login"""
    if not redirect_uri:
        redirect_uri = request.build_absolute_uri(
            reverse("oauth-callback", kwargs={"provider": provider})
        )

    oauth_client = get_oauth_client(provider)
    authorization_url, state = oauth_client.authorize_redirect(request, redirect_uri)

    return authorization_url, state


def get_provider_config():
    """Get configuration for all available OAuth providers"""
    return {
        "github": {
            "name": "GitHub",
            "client_id": settings.GITHUB_CLIENT_ID,
            "available": bool(
                settings.GITHUB_CLIENT_ID and settings.GITHUB_CLIENT_SECRET
            ),
            "color": "#24292e",
            "icon": "github",
        },
        "gitlab": {
            "name": "GitLab",
            "client_id": settings.GITLAB_CLIENT_ID,
            "available": bool(
                settings.GITLAB_CLIENT_ID and settings.GITLAB_CLIENT_SECRET
            ),
            "color": "#fc6d26",
            "icon": "gitlab",
        },
        "google": {
            "name": "Google",
            "client_id": settings.GOOGLE_CLIENT_ID,
            "available": bool(
                settings.GOOGLE_CLIENT_ID and settings.GOOGLE_CLIENT_SECRET
            ),
            "color": "#4285f4",
            "icon": "google",
        },
    }


def validate_oauth_state(request, state):
    """Validate OAuth state parameter to prevent CSRF attacks"""
    stored_state = request.session.get("oauth_state")
    if not stored_state or stored_state != state:
        logger.warning(f"OAuth state mismatch: stored={stored_state}, received={state}")
        return False
    return True


def store_oauth_state(request, state):
    """Store OAuth state in session"""
    request.session["oauth_state"] = state


def clear_oauth_state(request):
    """Clear OAuth state from session"""
    if "oauth_state" in request.session:
        del request.session["oauth_state"]
