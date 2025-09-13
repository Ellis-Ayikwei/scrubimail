from django.urls import path
from .views import (
    CreditsView,
    BillingAnalyticsView,
    PlansView,
    CreditPurchaseView,
    PlanUpgradeView,
    PaymentVerificationView,
    BillingHistoryView,
    UsageStatsView,
    CancelSubscriptionView,
    paystack_webhook,
    DownloadInvoiceView,
    debug_auth,
)

urlpatterns = [
    # Credits and billing profile
    path("credits/", CreditsView.as_view(), name="credits"),
    path("analytics/", BillingAnalyticsView.as_view(), name="billing-analytics"),
    # Plans and subscriptions
    path("plans/", PlansView.as_view(), name="plans"),
    path("upgrade/", PlanUpgradeView.as_view(), name="plan-upgrade"),
    path(
        "cancel-subscription/",
        CancelSubscriptionView.as_view(),
        name="cancel-subscription",
    ),
    # Credit purchases
    path("purchase-credits/", CreditPurchaseView.as_view(), name="purchase-credits"),
    # Payment verification
    path("verify-payment/", PaymentVerificationView.as_view(), name="verify-payment"),
    # Billing history and usage
    path("history/", BillingHistoryView.as_view(), name="billing-history"),
    path("usage-stats/", UsageStatsView.as_view(), name="usage-stats"),
    # Invoice and downloads
    path("download-invoice/", DownloadInvoiceView.as_view(), name="download-invoice"),
    # Webhooks
    path("webhook/paystack/", paystack_webhook, name="paystack-webhook"),
    # Debug
    path("debug-auth/", debug_auth, name="debug-auth"),
]
