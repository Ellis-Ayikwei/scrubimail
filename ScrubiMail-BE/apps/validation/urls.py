from django.urls import path
from .views import (
    SingleEmailValidationView,
    BulkEmailValidationView,
    BulkJobStatusView,
    ValidationStatusView,
    ValidationHistoryView,
    ValidationAnalyticsView,
    DomainReputationView,
)

urlpatterns = [
    # Single email validation
    path("validate/", SingleEmailValidationView.as_view(), name="validate-email"),
    # Bulk validation
    path("validate-bulk/", BulkEmailValidationView.as_view(), name="validate-bulk"),
    # NOTE: ids are UUIDs (Basemodel), so these converters MUST be <uuid:...> —
    # <int:...> never matched a real id, leaving these endpoints unreachable.
    path(
        "bulk-status/<uuid:job_id>/",
        BulkJobStatusView.as_view(),
        name="bulk-job-status",
    ),
    # Validation status and history
    path(
        "status/<uuid:validation_id>/",
        ValidationStatusView.as_view(),
        name="validation-status",
    ),
    path("history/", ValidationHistoryView.as_view(), name="validation-history"),
    # Analytics and insights
    path("analytics/", ValidationAnalyticsView.as_view(), name="validation-analytics"),
    path(
        "domain-reputation/<str:domain>/",
        DomainReputationView.as_view(),
        name="domain-reputation",
    ),
]
