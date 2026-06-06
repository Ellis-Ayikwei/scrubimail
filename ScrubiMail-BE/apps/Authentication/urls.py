from django.urls import path, include
from .views import (
    RegisterView,
    LoginView,
    UserProfileView,
    MyProfileView,
    LogoutAPIView,
    LoginAPIView,
    PasswordChangeAPIView,
    NotificationPreferencesView,
    DeleteAccountView,
    TOTPSetupView,
    TOTPEnableView,
    TOTPDisableView,
    TOTPStatusView,
    TOTPVerifyView,
    BackupCodeView,
    LoginWithTOTPView,
    TrustedDevicesView,
    RevokeTrustedDeviceView,
    RevokeAllTrustedDevicesView,
    TokenRefreshView,
)
from .token_views import SuspensionAwareTokenRefreshView
from .oauth_views import OAuthLoginView, OAuthCallbackView, OAuthProvidersView

urlpatterns = [
    path("register/", RegisterView.as_view(), name="register"),
    path("login/", LoginAPIView.as_view(), name="login"),
    path("logout/", LogoutAPIView.as_view(), name="logout"),
    path("user/", UserProfileView.as_view(), name="user-profile"),
    path("my-profile/", MyProfileView.as_view(), name="my-profile"),
    path("change-password/", PasswordChangeAPIView.as_view(), name="change-password"),
    path("refresh_token/", TokenRefreshView.as_view(), name="refresh-token"),
    path(
        "notification-preferences/",
        NotificationPreferencesView.as_view(),
        name="notification-preferences",
    ),
    path("delete-account/", DeleteAccountView.as_view(), name="delete-account"),
    # TOTP 2FA routes
    path("totp/setup/", TOTPSetupView.as_view(), name="totp-setup"),
    path("totp/enable/", TOTPEnableView.as_view(), name="totp-enable"),
    path("totp/disable/", TOTPDisableView.as_view(), name="totp-disable"),
    path("totp/status/", TOTPStatusView.as_view(), name="totp-status"),
    path("totp/verify/", TOTPVerifyView.as_view(), name="totp-verify"),
    path("totp/backup-codes/", BackupCodeView.as_view(), name="totp-backup-codes"),
    path("login-with-totp/", LoginWithTOTPView.as_view(), name="login-with-totp"),
    # Trusted device routes
    path("trusted-devices/", TrustedDevicesView.as_view(), name="trusted-devices"),
    path(
        "trusted-devices/<str:device_id>/",
        RevokeTrustedDeviceView.as_view(),
        name="revoke-trusted-device",
    ),
    path(
        "trusted-devices/revoke-all/",
        RevokeAllTrustedDevicesView.as_view(),
        name="revoke-all-trusted-devices",
    ),
    # OAuth routes
    path("oauth/providers/", OAuthProvidersView.as_view(), name="oauth-providers"),
    path("oauth/<str:provider>/login/", OAuthLoginView.as_view(), name="oauth-login"),
    path(
        "oauth/<str:provider>/callback/",
        OAuthCallbackView.as_view(),
        name="oauth-callback",
    ),
]
