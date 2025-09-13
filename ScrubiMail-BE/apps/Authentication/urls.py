from django.urls import path, include
from .views import (
    RegisterView,
    LoginView,
    UserProfileView,
    LogoutAPIView,
    LoginAPIView,
    PasswordChangeAPIView,
    NotificationPreferencesView,
    DeleteAccountView,
)
from .oauth_views import OAuthLoginView, OAuthCallbackView, OAuthProvidersView

urlpatterns = [
    path("register/", RegisterView.as_view(), name="register"),
    path("login/", LoginAPIView.as_view(), name="login"),
    path("logout/", LogoutAPIView.as_view(), name="logout"),
    path("user/", UserProfileView.as_view(), name="user-profile"),
    path("change-password/", PasswordChangeAPIView.as_view(), name="change-password"),
    path(
        "notification-preferences/",
        NotificationPreferencesView.as_view(),
        name="notification-preferences",
    ),
    path("delete-account/", DeleteAccountView.as_view(), name="delete-account"),
    # OAuth routes
    path("oauth/providers/", OAuthProvidersView.as_view(), name="oauth-providers"),
    path("oauth/<str:provider>/login/", OAuthLoginView.as_view(), name="oauth-login"),
    path(
        "oauth/<str:provider>/callback/",
        OAuthCallbackView.as_view(),
        name="oauth-callback",
    ),
]
