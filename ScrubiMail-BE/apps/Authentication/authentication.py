"""
Custom JWT authentication that rejects tokens belonging to suspended users.
This ensures that even if a user has a valid token, they cannot use it after
an admin suspends their account (is_active=False).
"""
from rest_framework_simplejwt.authentication import JWTAuthentication
from rest_framework_simplejwt.exceptions import AuthenticationFailed


class SuspensionAwareJWTAuthentication(JWTAuthentication):
    """
    Extends default JWT auth to check is_active on every authenticated request.
    If the user is suspended, their token is rejected immediately — no waiting
    for expiry.
    """

    def get_user(self, validated_token):
        user = super().get_user(validated_token)
        if not user.is_active:
            raise AuthenticationFailed(
                "Your account has been suspended. Please contact support.",
                code="account_suspended",
            )
        return user
