from django.urls import path
from .views import (
    APIKeyListCreateView,
    APIKeyDetailView,
    APIKeyDeactivateView,
    APIKeyUsageView,
    api_key_stats,
    regenerate_api_key,
    bulk_deactivate_keys,
)

urlpatterns = [
    # List and create API keys
    path("api-keys/", APIKeyListCreateView.as_view(), name="apikey-list-create"),
    # Individual API key operations
    path("api-keys/<uuid:pk>/", APIKeyDetailView.as_view(), name="apikey-detail"),
    path(
        "api-keys/<uuid:pk>/deactivate/",
        APIKeyDeactivateView.as_view(),
        name="apikey-deactivate",
    ),
    path("api-keys/<uuid:pk>/usage/", APIKeyUsageView.as_view(), name="apikey-usage"),
    path(
        "api-keys/<uuid:pk>/regenerate/", regenerate_api_key, name="apikey-regenerate"
    ),
    # Bulk operations and statistics
    path("api-keys/stats/", api_key_stats, name="apikey-stats"),
    path(
        "api-keys/bulk-deactivate/", bulk_deactivate_keys, name="apikey-bulk-deactivate"
    ),
]
