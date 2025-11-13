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
    StartTrialView,
    TrialStatusView,
    RateLimitStatusView,
    ListCreditPackagesView,
    CreditPackageDetailView,
    PurchaseCreditPackageView,
    CreditPackagePurchaseHistoryView,
    CompleteCreditPackagePurchaseView,
    ExpiringCreditsView,
    CreditBalanceDetailView,
    ValidatePromoCodeView,
    RedeemPromoCodeView,
    ListPromoCodesView,
    PromoCodeRedemptionHistoryView,
    ListInvoicesView,
    InvoiceDetailView,
    GenerateInvoiceView,
    DownloadInvoicePDFView,
    UsageAlertsStatusView,
)

urlpatterns = [
    # Credits and billing profile
    path("credits/", CreditsView.as_view(), name="credits"),
    path("credits/expiring/", ExpiringCreditsView.as_view(), name="expiring-credits"),
    path("credits/balance-detail/", CreditBalanceDetailView.as_view(), name="credit-balance-detail"),
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
    # Credit packages
    path("credit-packages/", ListCreditPackagesView.as_view(), name="list-credit-packages"),
    path("credit-packages/<uuid:package_id>/", CreditPackageDetailView.as_view(), name="credit-package-detail"),
    path("purchase-package/", PurchaseCreditPackageView.as_view(), name="purchase-credit-package"),
    path("package-purchases/", CreditPackagePurchaseHistoryView.as_view(), name="package-purchase-history"),
    path("package-purchases/<uuid:purchase_id>/complete/", CompleteCreditPackagePurchaseView.as_view(), name="complete-package-purchase"),
    # Credit expiration
    path("expiring-credits/", ExpiringCreditsView.as_view(), name="expiring-credits"),
    # Promo codes
    path("promo-codes/validate/", ValidatePromoCodeView.as_view(), name="validate-promo-code"),
    path("promo-codes/redeem/", RedeemPromoCodeView.as_view(), name="redeem-promo-code"),
    path("promo-codes/", ListPromoCodesView.as_view(), name="list-promo-codes"),
    path("promo-codes/redemptions/", PromoCodeRedemptionHistoryView.as_view(), name="promo-redemption-history"),
    # Invoices
    path("invoices/", ListInvoicesView.as_view(), name="list-invoices"),
    path("invoices/generate/", GenerateInvoiceView.as_view(), name="generate-invoice"),
    path("invoices/<uuid:invoice_id>/", InvoiceDetailView.as_view(), name="invoice-detail"),
    path("invoices/<uuid:invoice_id>/download/", DownloadInvoicePDFView.as_view(), name="download-invoice-pdf"),
    # Payment verification
    path("verify-payment/", PaymentVerificationView.as_view(), name="verify-payment"),
    # Trial management
    path("start-trial/", StartTrialView.as_view(), name="start-trial"),
    path("trial-status/", TrialStatusView.as_view(), name="trial-status"),
    # Rate limit status
    path("rate-limit-status/", RateLimitStatusView.as_view(), name="rate-limit-status"),
    # Usage stats and alerts
    path("usage-stats/", UsageStatsView.as_view(), name="usage-stats"),
    path("usage-alerts/", UsageAlertsStatusView.as_view(), name="usage-alerts"),
    # Invoice and downloads
    path("download-invoice/", DownloadInvoiceView.as_view(), name="download-invoice"),
    # Webhooks
    path("webhook/paystack/", paystack_webhook, name="paystack-webhook"),
    # Debug
    path("debug-auth/", debug_auth, name="debug-auth"),
]
