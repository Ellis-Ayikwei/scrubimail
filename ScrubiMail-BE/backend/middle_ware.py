from django.http import HttpResponsePermanentRedirect
from rest_framework.authentication import BaseAuthentication
from rest_framework import exceptions
from apps.apikey.models import APIKey
from apps.User.models import User
from rest_framework.permissions import BasePermission


# middleware.py in any of your apps
class ConditionalSlashMiddleware:
    def __init__(self, get_response):
        self.get_response = get_response

    def __call__(self, request):
        # Skip for certain URL patterns that should not have trailing slashes
        if request.path.startswith("/api/v1/") and not request.path.endswith("/"):
            # Don't add slashes to API endpoints
            pass
        elif not request.path.endswith("/") and not request.path.startswith("/admin/"):
            # For non-API, non-admin URLs that don't end with slash, redirect
            return HttpResponsePermanentRedirect(request.path + "/")

        return self.get_response(request)


class APIKeyAuthentication(BaseAuthentication):
    """
    Custom authentication for API keys. Only processes X-API-Key header.
    If X-API-Key is present, validates it. If not present, returns None to let JWT handle it.
    """

    def authenticate(self, request):
        # Prefer explicit X-API-Key header
        api_key = request.headers.get("X-API-Key")
        auth_header = request.headers.get("Authorization")

        # If no X-API-Key, accept Authorization only when it uses an ApiKey prefix.
        # Explicitly ignore Bearer so JWT auth can run.
        if not api_key:
            if auth_header and auth_header.startswith("ApiKey "):
                api_key = auth_header[len("ApiKey "):]
            else:
                # Let other authenticators (e.g. JWT Bearer) handle the request
                return None

        # Validate the API key
        try:
            key_obj = APIKey.objects.get(key=api_key, is_active=True)
            return (key_obj.user, None)
        except APIKey.DoesNotExist:
            raise exceptions.AuthenticationFailed("Invalid or inactive API key")


class AllowJWTOrAPIKey(BasePermission):
    """
    Allows access if user is authenticated via JWT or API key.
    If X-API-Key is present, it must be valid. If not present, JWT auth is used.
    """

    def has_permission(self, request, view):
        # Check if user is authenticated (JWT)
        if request.user and request.user.is_authenticated:
            return True

        # Check if authenticated via API key
        if isinstance(
            getattr(request, "successful_authenticator", None), APIKeyAuthentication
        ):
            return True

        return False
