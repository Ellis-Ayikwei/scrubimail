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
    admin_user_security,
    admin_disable_2fa,
    admin_revoke_trusted_devices,
    admin_adjust_credits,
    admin_reset_billing_cycle,
    admin_change_plan,
    admin_groups_collection,
    admin_group_detail,
    admin_group_permissions,
    admin_group_add_users,
    admin_group_remove_users,
    admin_permissions_list,
    admin_user_groups,
    admin_user_permissions,
    admin_payments_list,
    admin_payments_stats,
    admin_invoices_list,
    admin_invoice_update_status,
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
    # Security / 2FA management
    path("users/<uuid:user_id>/security/", admin_user_security, name="admin-user-security"),
    path("users/<uuid:user_id>/disable-2fa/", admin_disable_2fa, name="admin-disable-2fa"),
    path("users/<uuid:user_id>/revoke-trusted-devices/", admin_revoke_trusted_devices, name="admin-revoke-trusted-devices"),
    # Billing / Credits / Plan management
    path("billing/adjust/", admin_adjust_credits, name="admin-adjust-credits"),
    path("users/<uuid:user_id>/reset-billing/", admin_reset_billing_cycle, name="admin-reset-billing"),
    path("users/<uuid:user_id>/change_plan/", admin_change_plan, name="admin-change-plan"),
    # Groups & Permissions management
    path("groups/", admin_groups_collection, name="admin-groups-collection"),
    path("groups/<int:pk>/", admin_group_detail, name="admin-group-detail"),
    path(
        "groups/<int:pk>/permissions/",
        admin_group_permissions,
        name="admin-group-permissions",
    ),
    path(
        "groups/<int:pk>/add-users/",
        admin_group_add_users,
        name="admin-group-add-users",
    ),
    path(
        "groups/<int:pk>/remove-users/",
        admin_group_remove_users,
        name="admin-group-remove-users",
    ),
    path("permissions/", admin_permissions_list, name="admin-permissions-list"),
    path("users/<uuid:user_id>/groups/", admin_user_groups, name="admin-user-groups"),
    path("users/<uuid:user_id>/permissions/", admin_user_permissions, name="admin-user-permissions"),
    # Payments management
    path("payments/", admin_payments_list, name="admin-payments-list"),
    path("payments/stats/", admin_payments_stats, name="admin-payments-stats"),
    # Invoices management
    path("invoices/", admin_invoices_list, name="admin-invoices-list"),
    path("invoices/<uuid:invoice_id>/", admin_invoice_update_status, name="admin-invoice-update-status"),
]
