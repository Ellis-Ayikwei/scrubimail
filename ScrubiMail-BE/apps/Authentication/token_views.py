"""
Custom token refresh view that blocks suspended users.
Kept separate from authentication.py to avoid circular imports
(TokenRefreshView triggers DRF settings → DEFAULT_AUTHENTICATION_CLASSES).
"""
from rest_framework_simplejwt.views import TokenRefreshView
from rest_framework.response import Response
from rest_framework import status


class SuspensionAwareTokenRefreshView(TokenRefreshView):
    """
    Overrides token refresh to block suspended users from getting new access tokens.
    """

    def post(self, request, *args, **kwargs):
        response = super().post(request, *args, **kwargs)

        if response.status_code == 200:
            try:
                from rest_framework_simplejwt.tokens import AccessToken
                from django.contrib.auth import get_user_model
                User = get_user_model()

                access_token = AccessToken(response.data["access"])
                user_id = access_token.get("user_id")
                user = User.objects.get(id=user_id)

                if not user.is_active:
                    return Response(
                        {"detail": "Your account has been suspended. Please contact support."},
                        status=status.HTTP_403_FORBIDDEN,
                    )
            except Exception:
                pass

        return response
