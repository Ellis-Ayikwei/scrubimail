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
    Custom authentication for API keys. Supports multiple header formats:
    - X-API-Key: <key>
    - Authorization: Api-Key <key>
    - Authorization: Bearer <key> (for API keys)
    Sets request.user to the user associated with the API key.
    """

    def authenticate(self, request):
        api_key = request.headers.get("X-API-Key")
        if not api_key:
            # Also support 'Authorization: Api-Key ...' and 'Authorization: Bearer ...'
            auth_header = request.headers.get("Authorization")
            if auth_header:
                if auth_header.lower().startswith("api-key "):
                    api_key = auth_header[8:].strip()
                elif auth_header.lower().startswith("bearer "):
                    # Check if it's an API key (not JWT) by trying to find it in APIKey model
                    potential_key = auth_header[7:].strip()
                    try:
                        key_obj = APIKey.objects.get(key=potential_key, is_active=True)
                        return (key_obj.user, None)
                    except APIKey.DoesNotExist:
                        # Not an API key, let JWT authentication handle it
                        return None
        if not api_key:
            return None
        try:
            key_obj = APIKey.objects.get(key=api_key, is_active=True)
            return (key_obj.user, None)
        except APIKey.DoesNotExist:
            raise exceptions.AuthenticationFailed("Invalid or inactive API key")


class APIKeyOnlyPermission(BasePermission):
    """
    Allows access only if the request was authenticated via APIKeyAuthentication.
    """

    def has_permission(self, request, view):
        # DRF sets request.successful_authenticator to the authenticator instance used
        from backend.middle_ware import APIKeyAuthentication

        return isinstance(
            getattr(request, "successful_authenticator", None), APIKeyAuthentication
        )
