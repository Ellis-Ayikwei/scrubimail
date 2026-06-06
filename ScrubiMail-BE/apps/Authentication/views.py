from django.contrib.auth import get_user_model
from rest_framework import generics
from django.contrib.auth.tokens import PasswordResetTokenGenerator
from django.core.mail import send_mail
from django.conf import settings
from django.urls import reverse
from django.utils.encoding import force_bytes, force_str
from django.utils.http import urlsafe_base64_encode, urlsafe_base64_decode
from apps.User.models import User
from apps.User.serializer import UserSerializer, MinimalUserSerializer
from rest_framework import status, permissions
from rest_framework.views import APIView
from rest_framework import viewsets
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework_simplejwt.tokens import RefreshToken, TokenError, AccessToken
from rest_framework_simplejwt.backends import TokenBackend
from rest_framework_simplejwt.settings import api_settings
from rest_framework.throttling import AnonRateThrottle
from rest_framework_simplejwt.exceptions import (
    TokenError,
    InvalidToken,
    AuthenticationFailed,
)
from django.core.cache import cache
from django.utils import timezone
from django.contrib.auth import authenticate
from datetime import timedelta
import hashlib
import logging

from .serializer import (
    LoginSerializer,
    PasswordChangeSerializer,
    PasswordRecoverySerializer,
    PasswordResetConfirmSerializer,
    RegisterSerializer,
    TOTPSetupSerializer,
    TOTPVerifySerializer,
    TOTPEnableSerializer,
    TOTPDisableSerializer,
    BackupCodeSerializer,
    LoginWithTOTPSerializer,
)
from .models import TOTPDevice, TrustedDevice

logger = logging.getLogger(__name__)


class UserViewSet(viewsets.ModelViewSet):
    queryset = User.objects.all()
    serializer_class = UserSerializer
    permission_classes = [permissions.IsAuthenticated]

    @action(detail=False, methods=["get"])
    def me(self, request):
        serializer = self.get_serializer(request.user)
        return Response(serializer.data)


def _flatten_serializer_errors(errors):
    """Human-readable strings from DRF serializer.errors (nested dict/list safe)."""
    messages = []

    def walk(node):
        if isinstance(node, dict):
            for v in node.values():
                walk(v)
        elif isinstance(node, list):
            for item in node:
                if isinstance(item, (dict, list)):
                    walk(item)
                elif item is not None and str(item).strip():
                    messages.append(str(item))

    walk(errors)
    return messages


def registration_error_response(serializer_errors):
    msgs = _flatten_serializer_errors(dict(serializer_errors))
    detail = (
        msgs[0]
        if msgs
        else "Registration could not be completed. Please check your input."
    )
    return Response(
        {"detail": detail, "errors": serializer_errors},
        status=status.HTTP_400_BAD_REQUEST,
    )


def normalize_register_payload(request_data):
    """Align client payloads with RegisterSerializer (e.g. confirm_password → password2)."""
    data = request_data.copy() if hasattr(request_data, "copy") else dict(request_data)
    if data.get("confirm_password") and not data.get("password2"):
        data["password2"] = data.get("confirm_password")
    return data


class RegisterView(generics.CreateAPIView):
    queryset = User.objects.all()
    serializer_class = RegisterSerializer
    permission_classes = [permissions.AllowAny]

    def create(self, request, *args, **kwargs):
        serializer = self.get_serializer(data=normalize_register_payload(request.data))
        if not serializer.is_valid():
            return registration_error_response(serializer.errors)
        self.perform_create(serializer)
        headers = self.get_success_headers(serializer.data)
        return Response(
            {
                "message": "User created successfully. Please check your email for verification.",
            },
            status=status.HTTP_201_CREATED,
            headers=headers,
        )


class LoginView(APIView):
    permission_classes = [permissions.AllowAny]

    def post(self, request):
        serializer = LoginSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        return Response(serializer.validated_data, status=status.HTTP_200_OK)


class UserProfileView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request):
        """Get current user's profile"""
        serializer = UserSerializer(request.user)
        return Response(serializer.data)

    def patch(self, request):
        """Update current user's profile"""
        serializer = UserSerializer(request.user, data=request.data, partial=True)
        if serializer.is_valid():
            serializer.save()
            return Response(serializer.data)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


class MyProfileView(APIView):
    """Comprehensive profile view with additional user data"""

    permission_classes = [permissions.IsAuthenticated]

    def get(self, request):
        """Get comprehensive current user's profile with additional data"""
        try:
            from apps.billing.models import BillingProfile
            from apps.billing.services import BillingService

            # Get basic user data
            user_serializer = UserSerializer(request.user)
            user_data = user_serializer.data

            # Get billing profile data
            billing_service = BillingService()
            billing_profile = billing_service.get_or_create_billing_profile(
                request.user
            )

            # Get usage statistics
            from apps.billing.views import UsageStatsView

            usage_view = UsageStatsView()
            usage_view.request = request
            usage_response = usage_view.get(request)
            usage_data = usage_response.data

            # Combine all data
            profile_data = {
                "user": user_data,
                "billing": {
                    "credits_remaining": billing_profile.credits_remaining,
                    "credits_used_this_month": billing_profile.credits_used_this_month,
                    "current_plan": {
                        "name": (
                            billing_profile.current_plan.name
                            if billing_profile.current_plan
                            else "Free Plan"
                        ),
                        "price": (
                            billing_profile.current_plan.price
                            if billing_profile.current_plan
                            else 0
                        ),
                        "credits": (
                            billing_profile.current_plan.credits_per_month
                            if billing_profile.current_plan
                            else 100
                        ),
                    },
                },
                "usage": usage_data,
                "stats": {
                    "total_validations": usage_data.get("total_validations", 0),
                    "valid_emails": usage_data.get("valid_emails", 0),
                    "invalid_emails": usage_data.get("invalid_emails", 0),
                    "risky_emails": usage_data.get("risky_emails", 0),
                    "success_rate": usage_data.get("success_rate", 0),
                },
            }

            return Response(profile_data)

        except Exception as e:
            logger.error(f"Error fetching comprehensive profile: {str(e)}")
            # Fallback to basic user data
            serializer = UserSerializer(request.user)
            return Response(
                {
                    "user": serializer.data,
                    "billing": None,
                    "usage": None,
                    "stats": None,
                    "error": "Some profile data could not be loaded",
                }
            )


class NotificationPreferencesView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request):
        """Get current user's notification preferences"""
        return Response(request.user.notification_preferences)

    def patch(self, request):
        """Update current user's notification preferences"""
        try:
            request.user.notification_preferences = request.data
            request.user.save(update_fields=["notification_preferences"])
            return Response(request.user.notification_preferences)
        except Exception as e:
            return Response(
                {"error": "Failed to update notification preferences"},
                status=status.HTTP_400_BAD_REQUEST,
            )


class DeleteAccountView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def delete(self, request):
        """Delete current user's account"""
        try:
            user = request.user
            user.delete()
            return Response(
                {"detail": "Account deleted successfully"}, status=status.HTTP_200_OK
            )
        except Exception as e:
            return Response(
                {"error": "Failed to delete account"},
                status=status.HTTP_400_BAD_REQUEST,
            )


class RegisterAPIView(APIView):
    permission_classes = [permissions.AllowAny]

    def post(self, request):
        serializer = RegisterSerializer(data=normalize_register_payload(request.data))
        if serializer.is_valid():
            serializer.save()
            return Response(
                {
                    "message": "User created successfully. Please check your email for verification."
                },
                status=status.HTTP_201_CREATED,
            )
        return registration_error_response(serializer.errors)


class LoginAPIView(APIView):
    permission_classes = [permissions.AllowAny]
    authentication_classes = []  # Explicitly skip authentication for login
    throttle_classes = [AnonRateThrottle]  # Add rate limiting

    def post(self, request):
        # Force request.user to be AnonymousUser to prevent any token authentication influence
        # request._authenticator = None

        serializer = LoginSerializer(data=request.data, context={"request": request})

        try:
            if not serializer.is_valid():
                errors = serializer.errors
                ip = get_client_ip(request)
                email = request.data.get("email", "unknown")
                # Field-level errors (missing/invalid format) → 400
                if "email" in errors or "password" in errors:
                    return Response(errors, status=status.HTTP_400_BAD_REQUEST)
                # Wrong credentials (non_field_errors from validate()) → 401
                logger.warning(f"Failed login attempt for {email} from IP {ip}")
                increment_failed_logins(email, ip)
                return Response(
                    {"detail": "Invalid email or password"},
                    status=status.HTTP_401_UNAUTHORIZED,
                )

            user = serializer.validated_data["user"]

            # Suspended check (belt-and-suspenders — LoginSerializer also checks)
            if not user.is_active:
                return Response(
                    {
                        "detail": "Your account has been suspended. Please contact support."
                    },
                    status=status.HTTP_403_FORBIDDEN,
                )

            # Check if account requires further verification
            if hasattr(user, "requires_verification") and user.requires_verification:
                return Response(
                    {
                        "detail": "Account requires verification. Please check your email."
                    },
                    status=status.HTTP_403_FORBIDDEN,
                )

            # Check if account is locked due to too many failed attempts
            if is_account_locked(user.email):
                return Response(
                    {
                        "detail": "Account temporarily locked. Try again later or reset your password."
                    },
                    status=status.HTTP_403_FORBIDDEN,
                )

            # Record successful login
            ip = get_client_ip(request)
            logger.info(f"Successful login for user {user.id} from IP {ip}")
            reset_failed_logins(user.email)

            # Log user activity
            # from apps.User.models import UserActivity

            # UserActivity.objects.create(
            #     user=user, activity_type="login", details={"ip": ip}
            # )

            # Update last login timestamp
            user.last_login = timezone.now()
            user.save(update_fields=["last_login"])

            # Create refresh token for the user
            try:
                refresh = RefreshToken.for_user(user)
                access_token = str(refresh.access_token)
                refresh_token = str(refresh)

                # Debug token generation
                print(f"LoginAPI Generated access_token: {access_token[:20]}...")
                print(f"LoginAPI Generated refresh_token: {refresh_token[:20]}...")

            except Exception as e:
                logger.error(f"LoginAPI Token generation failed: {str(e)}")
                return Response(
                    {"detail": "Token generation failed"},
                    status=status.HTTP_500_INTERNAL_SERVER_ERROR,
                )

            # Serialize user data
            try:
                user_data = MinimalUserSerializer(user).data
                print(f"LoginAPI User data: {user_data}")
            except Exception as e:
                logger.error(f"LoginAPI User serialization failed: {str(e)}")
                return Response(
                    {"detail": "User serialization failed"},
                    status=status.HTTP_500_INTERNAL_SERVER_ERROR,
                )

            # Create response with minimal user data to keep cookie size small
            response = Response({"user": user_data})

            # Add tokens to response headers
            response["Authorization"] = f"Bearer {access_token}"
            response["X-Refresh-Token"] = refresh_token

            # Set Access-Control-Expose-Headers to make headers available to JavaScript
            response["Access-Control-Expose-Headers"] = "Authorization, X-Refresh-Token"

            # Debug response headers
            print("LoginAPI Response headers before return:")
            for key, value in response.headers.items():
                print(f"  {key}: {value}")

            return response

        except Exception as e:
            # Log the exception securely without exposing details
            logger.exception(f"Login error: {str(e)}")
            return Response(
                {"detail": "Authentication failed. Please try again."},
                status=status.HTTP_401_UNAUTHORIZED,
            )


# Helper functions - implement these in a utils.py file
def get_client_ip(request):
    x_forwarded_for = request.META.get("HTTP_X_FORWARDED_FOR")
    if x_forwarded_for:
        ip = x_forwarded_for.split(",")[0]
    else:
        ip = request.META.get("REMOTE_ADDR")
    return ip


def increment_failed_logins(email, ip):
    # Implement with your caching system (Redis, Memcached, etc.)
    # Example with Django's cache framework:
    cache_key = f"login_attempts:{email}"
    attempts = cache.get(cache_key, 0) + 1
    cache.set(cache_key, attempts, timeout=3600)  # 1 hour

    # Also track by IP to prevent attacks across multiple accounts
    ip_key = f"login_attempts_ip:{ip}"
    ip_attempts = cache.get(ip_key, 0) + 1
    cache.set(ip_key, ip_attempts, timeout=3600)


def is_account_locked(email):
    # Check if too many failed attempts
    cache_key = f"login_attempts:{email}"
    attempts = cache.get(cache_key, 0)
    return attempts >= 5  # Lock after 5 failed attempts


def reset_failed_logins(email):
    cache_key = f"login_attempts:{email}"
    cache.delete(cache_key)


def hash_device_fingerprint(raw_fingerprint):
    """Server-side hash for storing/comparing client fingerprint strings."""
    if raw_fingerprint is None:
        return ""
    return hashlib.sha256(
        (settings.SECRET_KEY + str(raw_fingerprint)).encode()
    ).hexdigest()


def find_active_trusted_device(user, request_data):
    logger.info(f"Finding active trusted device for user {user.id} ")
    device_id = (request_data.get("device_id") or "").strip()
    raw = request_data.get("fingerprint") or request_data.get("device_fingerprint")
    if not device_id or not raw:
        logger.info(f"No device id or fingerprint found for user {user.id}")
        return None
    fp_hash = hash_device_fingerprint(raw)
    logger.info(f"Hashed fingerprint: {fp_hash} for user {user.id}")
    return TrustedDevice.objects.filter(
        user=user,
        device_id=device_id,
        device_fingerprint_hash=fp_hash,
        is_active=True,
        expires_at__gte=timezone.now(),
    ).first()


def remember_trusted_device(user, request_data, refresh_token):
    """Create or refresh a trusted device row after successful 2FA + remember flag."""
    want = (
        request_data.get("trust_device")
        or request_data.get("remember_device")
        or request_data.get("remember_me")
    )
    if not want:
        return
    device_id = (request_data.get("device_id") or "").strip()
    raw = request_data.get("fingerprint") or request_data.get("device_fingerprint")
    if not device_id or not raw:
        return
    fp_hash = hash_device_fingerprint(raw)
    device_name = (request_data.get("device_name") or "").strip() or None
    info = request_data.get("device_info")
    device_info = info if isinstance(info, dict) else {}
    days = int(getattr(settings, "TRUSTED_DEVICE_DAYS", 30))
    refresh_hash = (
        hashlib.sha256(refresh_token.encode()).hexdigest() if refresh_token else ""
    )
    TrustedDevice.objects.update_or_create(
        user=user,
        device_id=device_id,
        defaults={
            "device_fingerprint_hash": fp_hash,
            "device_name": device_name,
            "device_info": device_info,
            "refresh_token_hash": refresh_hash or None,
            "expires_at": timezone.now() + timedelta(days=days),
            "is_active": True,
        },
    )


class LogoutAPIView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def post(self, request):
        print("the logout data", request.headers, request.data)
        try:
            # Get the refresh token from headers or request body
            refresh_token = request.headers.get("X-Refresh-Token") or request.data.get(
                "refresh_token"
            )

            if refresh_token:
                try:
                    # Blacklist the refresh token
                    token = RefreshToken(refresh_token)
                    token.blacklist()
                except TokenError:
                    # Token might already be invalid, but that's okay for logout
                    pass

            # Log user activity if UserActivity model exists
            try:
                from apps.User.models import UserActivity

                ip = get_client_ip(request)
                UserActivity.objects.create(
                    user=request.user, activity_type="logout", details={"ip": ip}
                )
            except ImportError:
                # UserActivity model might not exist, skip logging
                pass

            return Response({"detail": "Logout successful."}, status=status.HTTP_200_OK)
        except Exception as e:
            logger.error(f"Logout error: {str(e)}")
            return Response({"detail": "Logout successful."}, status=status.HTTP_200_OK)


class PasswordRecoveryAPIView(APIView):
    permission_classes = [permissions.AllowAny]

    def post(self, request):
        import os

        serializer = PasswordRecoverySerializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        user = User.objects.filter(email=serializer.validated_data["email"]).first()
        email_sent = False

        if user:
            token_generator = PasswordResetTokenGenerator()
            uid = urlsafe_base64_encode(force_bytes(user.pk))
            token = token_generator.make_token(user)

            reset_url = reverse(
                "password_reset_confirm", kwargs={"uidb64": uid, "token": token}
            )
            absolute_url = request.build_absolute_uri(reset_url)
            # Get frontend URL from request origin
            request_scheme = request.scheme  # http or https
            request_host = request.get_host()  # domain:port
            frontend_base_url = os.getenv("FRONTEND_URL")
            frontend_url = f"{frontend_base_url}/reset-password/{uid}/{token}"
            absolute_url = frontend_url
            try:
                send_mail(
                    "Password Reset Request",
                    f"Use this link to reset your password: {absolute_url}",
                    getattr(settings, "DEFAULT_FROM_EMAIL", "noreply@example.com"),
                    [user.email],
                    fail_silently=False,
                )
                email_sent = True
            except Exception as e:
                # Log the error but don't expose it to the user
                import logging

                logger = logging.getLogger(__name__)
                logger.error(f"Email Error in password reset: {str(e)}")
                email_sent = False

        if email_sent:
            return Response(
                {"detail": "Password reset link sent successfully"},
                status=status.HTTP_200_OK,
            )
        else:
            return Response(
                {
                    "detail": "Password reset link could not be sent. Please try again later."
                },
                status=status.HTTP_500_INTERNAL_SERVER_ERROR,
            )


class PasswordResetConfirmAPIView(APIView):
    """
    API endpoint for confirming a password reset.

    - Accepts a JSON payload with the following format:
      {
        "password": "<new password>",
        "uidb64": "<base64 encoded user id>",
        "token": "<reset token>"
      }

    - Returns a JSON response with the following format:
      {
        "detail": "Password reset successfully"
      }

    - If the token is invalid, returns a JSON response with the following format:
      {
        "detail": "Invalid token"
      }
      with a 400 status code.

    :param request: The request object.
    :param uidb64: The base64 encoded user id.
    :param token: The token to verify the user.
    :return: A JSON response with the result of the operation.
    """

    permission_classes = [permissions.AllowAny]

    def post(self, request, uidb64, token):
        serializer = PasswordResetConfirmSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        try:
            uid = force_str(urlsafe_base64_decode(serializer.validated_data["uidb64"]))
            user = User.objects.get(pk=uid)
        except (TypeError, ValueError, OverflowError, User.DoesNotExist):
            user = None

        token_generator = PasswordResetTokenGenerator()
        if user and token_generator.check_token(
            user, serializer.validated_data["token"]
        ):
            user.set_password(serializer.validated_data["password"])
            user.save()
            return Response({"detail": "Password reset successfully"})

        return Response({"detail": "Invalid token"}, status=status.HTTP_400_BAD_REQUEST)


class PasswordChangeAPIView(APIView):
    """
    API endpoint for changing the current user's password.

    - Accepts a JSON payload with the following format:
      {
        "old_password": "<current password>",
        "new_password": "<new password>"
      }

    - Returns a JSON response with the following format:
      {
        "detail": "Password updated successfully"
      }

    - Returns a JSON response with the following format in case of an error:
      {
        "old_password": "<error message>"
      }

    - Requires the "is_authenticated" permission.
    """

    permission_classes = [permissions.IsAuthenticated]

    def post(self, request):
        """
        Handles the POST request to change the current user's password.
        """
        serializer = PasswordChangeSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        # Check if the old password is correct
        if not request.user.check_password(serializer.validated_data["old_password"]):
            return Response(
                {"old_password": "Wrong password"}, status=status.HTTP_400_BAD_REQUEST
            )

        # Update the user's password
        request.user.set_password(serializer.validated_data["new_password"])
        request.user.save()

        # Return a success response
        return Response({"detail": "Password updated successfully"})


class TokenRefreshView(APIView):
    """
    Takes a refresh token and returns an access token if the refresh token is valid.
    This view expects the refresh token to be in an HTTP-only cookie.
    """

    permission_classes = [permissions.AllowAny]

    def post(self, request):
        # Detailed header logging
        print("=== HEADERS RECEIVED IN TOKEN REFRESH ===")
        for header_name, header_value in request.headers.items():
            # Don't print actual token values for security
            if header_name.lower() in ["authorization", "x-refresh-token"]:
                print(f"{header_name}: {'PRESENT' if header_value else 'MISSING'}")
            else:
                print(f"{header_name}: {header_value}")
        print("======================================")

        # Check multiple possible sources for the refresh token
        refresh_token = None

        # 1. Check headers with detailed logging
        refresh_token = request.headers.get("X-Refresh-Token")
        print(f"X-Refresh-Token header: {refresh_token}")

        # 2. Try to get from request data
        if not refresh_token and request.data:
            print(f"Request data: {request.data}")
            if isinstance(request.data, dict) and "refresh_token" in request.data:
                refresh_token = request.data.get("refresh_token")
                print(f"refresh_token from request data: {refresh_token}")

        # 3. Try to get from cookies
        if not refresh_token:
            print(f"Cookies: {request.COOKIES}")
            refresh_token = request.COOKIES.get("_auth_refresh")
            print(f"_auth_refresh cookie: {refresh_token}")

        if not refresh_token:
            return Response(
                {"detail": "Refresh token not found in headers, data, or cookies."},
                status=status.HTTP_401_UNAUTHORIZED,
            )

        try:
            # Validate the refresh token
            refresh = RefreshToken(refresh_token)

            # Get user from token payload
            user_id = refresh.payload.get("user_id")

            try:
                user = User.objects.get(id=user_id)

                # Check if user is still active
                if not user.is_active:
                    raise AuthenticationFailed("User is inactive")

                # Generate new access token
                access_token = str(refresh.access_token)

                # Return empty response with token in header
                response = Response(status=status.HTTP_200_OK)

                # Add token to response header
                response["Authorization"] = f"Bearer {access_token}"

                # Set Access-Control-Expose-Headers
                response["Access-Control-Expose-Headers"] = "Authorization"

                return response

            except User.DoesNotExist:
                return Response(
                    {"detail": "User not found."}, status=status.HTTP_401_UNAUTHORIZED
                )

        except TokenError as e:
            return Response(
                {"detail": "Invalid or expired token."},
                status=status.HTTP_401_UNAUTHORIZED,
            )

        except Exception as e:
            logger.exception(f"Token refresh error: {str(e)}")
            return Response(
                {"detail": "An error occurred while refreshing token."},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR,
            )


class TokenVerifyView(APIView):
    """
    Takes a token and returns a success response if it is valid.
    This allows clients to validate both access and refresh tokens.
    """

    permission_classes = [permissions.AllowAny]

    def post(self, request):
        token = request.data.get("token")

        if not token:
            return Response(
                {"detail": "Token is required."}, status=status.HTTP_400_BAD_REQUEST
            )

        try:
            # Try to parse as access token first
            try:
                AccessToken(token)
                return Response({"status": "valid"})
            except TokenError:
                # If it's not an access token, try as refresh token
                RefreshToken(token)
                return Response({"status": "valid"})

        except TokenError as e:
            return Response(
                {"detail": "Token is invalid or expired"},
                status=status.HTTP_401_UNAUTHORIZED,
            )

        except Exception as e:
            logger.exception(f"Token verification error: {str(e)}")
            return Response(
                {"detail": "An error occurred during token verification."},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR,
            )


# TOTP 2FA Views
class TOTPSetupView(APIView):
    """
    Setup TOTP 2FA for the authenticated user.
    Returns QR code and backup codes for setup.
    """

    permission_classes = [permissions.IsAuthenticated]

    def get(self, request):
        """Get TOTP setup data (QR code, secret, backup codes)"""
        try:
            logger.info(f"TOTP Setup - User: {request.user.id}")

            # Get or create TOTP device for user
            totp_device, created = TOTPDevice.objects.get_or_create(
                user=request.user, defaults={"secret_key": ""}
            )
            logger.info(
                f"TOTP Device {'created' if created else 'found'}: {totp_device.id}"
            )

            # Generate secret if not exists
            if not totp_device.secret_key:
                totp_device.generate_secret()

            # Generate QR code
            qr_code = totp_device.generate_qr_code()

            # Generate backup codes
            backup_codes = totp_device.generate_backup_codes()

            return Response(
                {
                    "secret_key": totp_device.secret_key,
                    "qr_code": qr_code,
                    "backup_codes": backup_codes,
                    "is_enabled": totp_device.is_enabled,
                }
            )

        except Exception as e:
            logger.exception(f"TOTP setup error: {str(e)}")
            return Response(
                {"detail": "Failed to setup TOTP. Please try again."},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR,
            )


class TOTPEnableView(APIView):
    """
    Enable TOTP 2FA after verifying the setup token.
    """

    permission_classes = [permissions.IsAuthenticated]

    def post(self, request):
        serializer = TOTPEnableSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        try:
            # Debug: Check if TOTP device exists
            logger.info(f"TOTP Enable - User: {request.user.id}, Data: {request.data}")

            # Get user's TOTP device
            totp_device = TOTPDevice.objects.get(user=request.user)
            logger.info(
                f"TOTP Device found: {totp_device.id}, Secret exists: {bool(totp_device.secret_key)}"
            )

            # Verify the token and enable 2FA
            verification_token = serializer.validated_data["verification_token"]
            logger.info(f"Attempting to verify token: {verification_token}")

            if totp_device.enable_2fa(verification_token):
                logger.info("TOTP 2FA enabled successfully")
                return Response(
                    {"detail": "TOTP 2FA enabled successfully", "is_enabled": True}
                )
            else:
                logger.warning(
                    f"Token verification failed for token: {verification_token}"
                )
                return Response(
                    {"detail": "Invalid verification token"},
                    status=status.HTTP_400_BAD_REQUEST,
                )

        except TOTPDevice.DoesNotExist:
            return Response(
                {"detail": "TOTP device not found. Please setup TOTP first."},
                status=status.HTTP_404_NOT_FOUND,
            )
        except Exception as e:
            logger.exception(f"TOTP enable error: {str(e)}")
            return Response(
                {"detail": "Failed to enable TOTP. Please try again."},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR,
            )


class TOTPDisableView(APIView):
    """
    Disable TOTP 2FA for the authenticated user.
    Requires password verification.
    """

    permission_classes = [permissions.IsAuthenticated]

    def post(self, request):
        serializer = TOTPDisableSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        try:
            # Verify password
            if not request.user.check_password(serializer.validated_data["password"]):
                return Response(
                    {"detail": "Invalid password"}, status=status.HTTP_400_BAD_REQUEST
                )

            # Get and disable TOTP device
            try:
                totp_device = TOTPDevice.objects.get(user=request.user)
                totp_device.disable_2fa()
                return Response({"detail": "TOTP 2FA disabled successfully"})
            except TOTPDevice.DoesNotExist:
                return Response(
                    {"detail": "TOTP 2FA is not enabled"},
                    status=status.HTTP_404_NOT_FOUND,
                )

        except Exception as e:
            logger.exception(f"TOTP disable error: {str(e)}")
            return Response(
                {"detail": "Failed to disable TOTP. Please try again."},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR,
            )


class TOTPStatusView(APIView):
    """
    Get TOTP 2FA status for the authenticated user.
    """

    permission_classes = [permissions.IsAuthenticated]

    def get(self, request):
        try:
            totp_device = TOTPDevice.objects.get(user=request.user)
            return Response(
                {
                    "is_enabled": totp_device.is_enabled,
                    "has_backup_codes": len(totp_device.backup_codes) > 0,
                    "created_at": totp_device.created_at,
                    "last_used": totp_device.last_used,
                }
            )
        except TOTPDevice.DoesNotExist:
            return Response(
                {
                    "is_enabled": False,
                    "has_backup_codes": False,
                    "created_at": None,
                    "last_used": None,
                }
            )


class TOTPVerifyView(APIView):
    """
    Verify TOTP token for the authenticated user.
    Used for testing or additional verification.
    """

    permission_classes = [permissions.IsAuthenticated]

    def post(self, request):
        serializer = TOTPVerifySerializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        try:
            totp_device = TOTPDevice.objects.get(user=request.user)

            if not totp_device.is_enabled:
                return Response(
                    {"detail": "TOTP 2FA is not enabled"},
                    status=status.HTTP_400_BAD_REQUEST,
                )

            if totp_device.verify_token(serializer.validated_data["token"]):
                return Response({"detail": "Token verified successfully"})
            else:
                return Response(
                    {"detail": "Invalid token"}, status=status.HTTP_400_BAD_REQUEST
                )

        except TOTPDevice.DoesNotExist:
            return Response(
                {"detail": "TOTP device not found"}, status=status.HTTP_404_NOT_FOUND
            )
        except Exception as e:
            logger.exception(f"TOTP verify error: {str(e)}")
            return Response(
                {"detail": "Failed to verify token. Please try again."},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR,
            )


class BackupCodeView(APIView):
    """
    Regenerate backup codes for the authenticated user.
    """

    permission_classes = [permissions.IsAuthenticated]

    def post(self, request):
        try:
            totp_device = TOTPDevice.objects.get(user=request.user)

            if not totp_device.is_enabled:
                return Response(
                    {"detail": "TOTP 2FA is not enabled"},
                    status=status.HTTP_400_BAD_REQUEST,
                )

            # Generate new backup codes
            backup_codes = totp_device.generate_backup_codes()

            return Response(
                {
                    "detail": "Backup codes regenerated successfully",
                    "backup_codes": backup_codes,
                }
            )

        except TOTPDevice.DoesNotExist:
            return Response(
                {"detail": "TOTP device not found"}, status=status.HTTP_404_NOT_FOUND
            )
        except Exception as e:
            logger.exception(f"Backup code generation error: {str(e)}")
            return Response(
                {"detail": "Failed to generate backup codes. Please try again."},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR,
            )


class LoginWithTOTPView(APIView):
    """
    Login with TOTP 2FA verification and device fingerprinting.
    This view handles the complete login flow including 2FA and trusted devices.
    """

    permission_classes = [permissions.AllowAny]
    authentication_classes = []
    throttle_classes = [AnonRateThrottle]

    def post(self, request):
        # First, authenticate the user with email and password
        print("request data", request.data)

        email = request.data.get("email")
        password = request.data.get("password")

        if not email or not password:
            return Response(
                {"detail": "Email and password are required"},
                status=status.HTTP_400_BAD_REQUEST,
            )

        # Check suspension before authenticate() so we give a clear message
        try:
            from apps.User.models import User as UserModel

            candidate = UserModel.objects.get(email__iexact=email)
            if not candidate.is_active:
                return Response(
                    {
                        "detail": "Your account has been suspended. Please contact support."
                    },
                    status=status.HTTP_403_FORBIDDEN,
                )
        except Exception:
            pass

        # Authenticate user
        user = authenticate(email=email, password=password)

        if not user:
            ip = get_client_ip(request)
            logger.warning(f"Failed login attempt for {email} from IP {ip}")
            increment_failed_logins(email, ip)
            return Response(
                {"detail": "Invalid credentials"},
                status=status.HTTP_401_UNAUTHORIZED,
            )

        # Check if user has 2FA enabled
        try:
            totp_device = TOTPDevice.objects.get(user=user)
            has_2fa = totp_device.is_enabled
        except TOTPDevice.DoesNotExist:
            has_2fa = False

        if is_account_locked(user.email):
            return Response(
                {
                    "detail": "Account temporarily locked. Try again later or reset your password."
                },
                status=status.HTTP_403_FORBIDDEN,
            )

        # If 2FA is not enabled, proceed with normal login
        if not has_2fa:
            # Record successful login
            ip = get_client_ip(request)
            logger.info(f"Successful login for user {user.id} from IP {ip}")
            reset_failed_logins(user.email)

            # Update last login timestamp
            user.last_login = timezone.now()
            user.save(update_fields=["last_login"])

            # Add tokens to response headers
            try:
                refresh = RefreshToken.for_user(user)
                access_token = str(refresh.access_token)
                refresh_token = str(refresh)

                # Debug token generation
                print(f"Generated access_token: {access_token[:20]}...")
                print(f"Generated refresh_token: {refresh_token[:20]}...")

            except Exception as e:
                logger.error(f"Token generation failed: {str(e)}")
                return Response(
                    {"detail": "Token generation failed"},
                    status=status.HTTP_500_INTERNAL_SERVER_ERROR,
                )

            # Serialize user data
            try:
                user_data = MinimalUserSerializer(user).data
                print(f"User data: {user_data}")
            except Exception as e:
                logger.error(f"User serialization failed: {str(e)}")
                return Response(
                    {"detail": "User serialization failed"},
                    status=status.HTTP_500_INTERNAL_SERVER_ERROR,
                )

            # Create response with minimal user data to keep cookie size small
            response = Response({"user": user_data, "requires_2fa": False})

            # Add tokens to response headers
            response["Authorization"] = f"Bearer {access_token}"
            response["X-Refresh-Token"] = refresh_token

            # Set Access-Control-Expose-Headers to make headers available to JavaScript
            response["Access-Control-Expose-Headers"] = "Authorization, X-Refresh-Token"

            # Debug response headers
            print("Response headers before return:")
            for key, value in response.headers.items():
                print(f"  {key}: {value}")

            return response

        # Trusted device: same fingerprint + device_id as a non-expired trusted row → skip TOTP
        trusted = find_active_trusted_device(user, request.data)

        if trusted:
            ip = get_client_ip(request)
            logger.info(
                f"Trusted device login (2FA skipped) for user {user.id} from IP {ip}"
            )
            reset_failed_logins(user.email)
            user.last_login = timezone.now()
            user.save(update_fields=["last_login"])
            try:
                refresh = RefreshToken.for_user(user)
                access_token = str(refresh.access_token)
                refresh_token = str(refresh)
            except Exception as e:
                logger.error(f"Token generation failed: {str(e)}")
                return Response(
                    {"detail": "Token generation failed"},
                    status=status.HTTP_500_INTERNAL_SERVER_ERROR,
                )
            try:
                user_data = MinimalUserSerializer(user).data
            except Exception as e:
                logger.error(f"User serialization failed: {str(e)}")
                return Response(
                    {"detail": "User serialization failed"},
                    status=status.HTTP_500_INTERNAL_SERVER_ERROR,
                )
            response = Response(
                {
                    "user": user_data,
                    "requires_2fa": False,
                    "trusted_device": True,
                    "device_name": trusted.device_name or trusted.device_id,
                },
                status=status.HTTP_200_OK,
            )
            response["Authorization"] = f"Bearer {access_token}"
            response["X-Refresh-Token"] = refresh_token
            response["Access-Control-Expose-Headers"] = "Authorization, X-Refresh-Token"
            return response

        # If 2FA is enabled, validate TOTP token or backup code
        # Check if TOTP token or backup code is provided
        totp_token = request.data.get("totp_token")
        backup_code = request.data.get("backup_code")

        if not totp_token and not backup_code:
            logger.info(f"No TOTP token or backup code provided for user {user.id}")
            return Response(
                {
                    "detail": "TOTP token or backup code is required for 2FA",
                    "requires_2fa": True,
                    "user_id": str(user.id),
                    "status": "2FA_REQUIRED",
                },
                status=status.HTTP_200_OK,
            )

        # Validate TOTP token or backup code
        try:
            totp_device = TOTPDevice.objects.get(user=user)

            if totp_token:
                # Verify TOTP token
                if not totp_device.verify_token(totp_token):
                    return Response(
                        {"detail": "Invalid TOTP token"},
                        status=status.HTTP_400_BAD_REQUEST,
                    )
            elif backup_code:
                # Verify backup code
                if not totp_device.verify_backup_code(backup_code):
                    return Response(
                        {"detail": "Invalid backup code"},
                        status=status.HTTP_400_BAD_REQUEST,
                    )

            # 2FA verification successful

            # Record successful login
            ip = get_client_ip(request)
            logger.info(f"Successful 2FA login for user {user.id} from IP {ip}")
            reset_failed_logins(user.email)

            # Update last login timestamp
            user.last_login = timezone.now()
            user.save(update_fields=["last_login"])

            try:
                refresh = RefreshToken.for_user(user)
                access_token = str(refresh.access_token)
                refresh_token = str(refresh)

                # Debug token generation
                print(f"2FA Generated access_token: {access_token[:20]}...")
                print(f"2FA Generated refresh_token: {refresh_token[:20]}...")

            except Exception as e:
                logger.error(f"2FA Token generation failed: {str(e)}")
                return Response(
                    {"detail": "Token generation failed"},
                    status=status.HTTP_500_INTERNAL_SERVER_ERROR,
                )

            remember_trusted_device(user, request.data, refresh_token)

            # Serialize user data
            try:
                user_data = MinimalUserSerializer(user).data
                print(f"2FA User data: {user_data}")
            except Exception as e:
                logger.error(f"2FA User serialization failed: {str(e)}")
                return Response(
                    {"detail": "User serialization failed"},
                    status=status.HTTP_500_INTERNAL_SERVER_ERROR,
                )

            # Create response with minimal user data to keep cookie size small
            response = Response({"user": user_data, "requires_2fa": False})

            # Add tokens to response headers
            response["Authorization"] = f"Bearer {access_token}"
            response["X-Refresh-Token"] = refresh_token

            # Set Access-Control-Expose-Headers to make headers available to JavaScript
            response["Access-Control-Expose-Headers"] = "Authorization, X-Refresh-Token"

            # Debug response headers
            print("2FA Response headers before return:")
            for key, value in response.headers.items():
                print(f"  {key}: {value}")

            return response

        except TOTPDevice.DoesNotExist:
            return Response(
                {"detail": "2FA not configured for this user"},
                status=status.HTTP_400_BAD_REQUEST,
            )
        except Exception as e:
            logger.error(f"2FA verification error: {str(e)}")
            return Response(
                {"detail": "2FA verification failed"},
                status=status.HTTP_400_BAD_REQUEST,
            )


class TrustedDevicesView(APIView):
    """
    List trusted devices for the authenticated user.
    """

    permission_classes = [permissions.IsAuthenticated]

    def get(self, request):
        try:
            from .models import TrustedDevice

            devices = TrustedDevice.objects.filter(
                user=request.user, is_active=True
            ).order_by("-created_at")

            device_data = []
            for device in devices:
                device_data.append(
                    {
                        "id": device.id,
                        "device_name": device.device_name,
                        "device_id": device.device_id,
                        "created_at": device.created_at,
                        "last_used": device.last_used,
                        "expires_at": device.expires_at,
                    }
                )

            return Response(
                {
                    "devices": device_data,
                    "count": len(device_data),
                }
            )

        except Exception as e:
            logger.exception(f"Error fetching trusted devices: {str(e)}")
            return Response(
                {"detail": "Failed to fetch trusted devices."},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR,
            )


class RevokeTrustedDeviceView(APIView):
    """
    Revoke a specific trusted device.
    """

    permission_classes = [permissions.IsAuthenticated]

    def delete(self, request, device_id):
        try:
            from .models import TrustedDevice

            device = TrustedDevice.objects.filter(
                id=device_id, user=request.user
            ).first()

            if not device:
                return Response(
                    {"detail": "Trusted device not found."},
                    status=status.HTTP_404_NOT_FOUND,
                )

            device.deactivate()

            return Response(
                {
                    "detail": "Trusted device revoked successfully.",
                    "device_name": device.device_name,
                }
            )

        except Exception as e:
            logger.exception(f"Error revoking trusted device: {str(e)}")
            return Response(
                {"detail": "Failed to revoke trusted device."},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR,
            )


class RevokeAllTrustedDevicesView(APIView):
    """
    Revoke all trusted devices for the authenticated user.
    """

    permission_classes = [permissions.IsAuthenticated]

    def post(self, request):
        try:
            from .models import TrustedDevice

            devices = TrustedDevice.objects.filter(user=request.user, is_active=True)
            count = devices.count()

            devices.update(is_active=False, refresh_token_hash="")

            return Response(
                {
                    "detail": f"Successfully revoked {count} trusted devices.",
                    "revoked_count": count,
                }
            )

        except Exception as e:
            logger.exception(f"Error revoking all trusted devices: {str(e)}")
            return Response(
                {"detail": "Failed to revoke trusted devices."},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR,
            )
