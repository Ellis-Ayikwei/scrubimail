# urls.py
from django.urls import path, include
from django.contrib import admin

import apps.ApiConnectionStatus.views
from rest_framework import routers
from rest_framework_simplejwt.views import (
    TokenObtainPairView,
    TokenRefreshView,
    TokenVerifyView,
)
from django.conf import settings
from django.conf.urls.static import static


router = routers.DefaultRouter(trailing_slash=True)


urlpatterns = [
    # Geocoding endpoints outside API path to bypass authentication issues
    # API routes with prefix
    path("", apps.ApiConnectionStatus.views.ApiConnectionStatusView.as_view()),
    path(
        "scrubimail/api/v1/",
        include(
            [
                # Admin API endpoints
                path("admin/", include("apps.admin.urls")),
                # Django admin interface (separate from API)
                path("django-admin/", admin.site.urls),
                # Media files under API prefix
                *static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT),
                path("", include("apps.validation.urls")),
                path("", include("apps.billing.urls")),
                path("plans/", include("apps.plan.urls")),
                path("", include("apps.apikey.urls")),
                path("auth/", include("apps.Authentication.urls")),
            ]
        ),
    ),
    # Add non-API routes here if needed
]
