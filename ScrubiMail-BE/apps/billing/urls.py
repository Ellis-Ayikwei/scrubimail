from django.urls import path
from .views import (
    CreditsView,
    StripeWebhookView,
    CreateCheckoutSessionView,
    CreateCustomerPortalView,
)

urlpatterns = [
    path("credits/", CreditsView.as_view(), name="credits"),
    path("stripe/webhook/", StripeWebhookView.as_view(), name="stripe-webhook"),
    path(
        "stripe/checkout/", CreateCheckoutSessionView.as_view(), name="stripe-checkout"
    ),
    path("stripe/portal/", CreateCustomerPortalView.as_view(), name="stripe-portal"),
]
