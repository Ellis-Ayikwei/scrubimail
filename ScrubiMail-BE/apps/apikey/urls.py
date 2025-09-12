from django.urls import path
from .views import APIKeyListCreateView, APIKeyDeactivateView

urlpatterns = [
    path("api-keys/", APIKeyListCreateView.as_view(), name="apikey-list-create"),
    path(
        "api-keys/<int:pk>/deactivate/",
        APIKeyDeactivateView.as_view(),
        name="apikey-deactivate",
    ),
]
