from django.urls import path
from .views import (
    AdminUserListView,
    AdminUserDetailView,
    AdminUserCreateView,
    AdminBillingListView,
    AdminPlansListView,
    AdminPlanDetailView,
    AdminValidationsListView,
    AdminAPIKeyListView,
    AdminAPIKeyDetailView,
    admin_user_stats,
    admin_billing_stats,
    admin_validations_stats,
    admin_plans_stats,
)

urlpatterns = [
    # User management
    path("users/", AdminUserListView.as_view(), name="admin-users-list"),
    path("users/<uuid:pk>/", AdminUserDetailView.as_view(), name="admin-user-detail"),
    path("users/create/", AdminUserCreateView.as_view(), name="admin-user-create"),
    path("users/stats/", admin_user_stats, name="admin-users-stats"),
    # Billing management
    path("billing/", AdminBillingListView.as_view(), name="admin-billing-list"),
    path("billing/stats/", admin_billing_stats, name="admin-billing-stats"),
    # Plans management
    path("plans/", AdminPlansListView.as_view(), name="admin-plans-list"),
    path("plans/<int:pk>/", AdminPlanDetailView.as_view(), name="admin-plan-detail"),
    path("plans/stats/", admin_plans_stats, name="admin-plans-stats"),
    # Validations management
    path(
        "validations/",
        AdminValidationsListView.as_view(),
        name="admin-validations-list",
    ),
    path("validations/stats/", admin_validations_stats, name="admin-validations-stats"),
    # API Keys management
    path("api-keys/", AdminAPIKeyListView.as_view(), name="admin-api-keys-list"),
    path("api-keys/<uuid:pk>/", AdminAPIKeyDetailView.as_view(), name="admin-api-key-detail"),
]

