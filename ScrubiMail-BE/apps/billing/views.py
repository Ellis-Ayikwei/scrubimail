from django.views.decorators.csrf import csrf_exempt
from django.utils.decorators import method_decorator
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
from rest_framework.permissions import IsAuthenticated
from .models import BillingProfile
from django.conf import settings
import stripe

stripe.api_key = settings.STRIPE_SECRET_KEY


class CreditsView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        profile, _ = BillingProfile.objects.get_or_create(user=request.user)
        return Response({"credits": profile.credits})


class StripeWebhookView(APIView):
    authentication_classes = []
    permission_classes = []

    @method_decorator(csrf_exempt)
    def dispatch(self, *args, **kwargs):
        return super().dispatch(*args, **kwargs)

    def post(self, request, *args, **kwargs):
        # TODO: Add Stripe signature verification and event handling
        event = request.data
        # Handle event types (invoice.paid, customer.subscription.updated, etc.)
        return Response({"status": "received"}, status=status.HTTP_200_OK)


class CreateCheckoutSessionView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request):
        # Example: upgrade to Pro plan
        session = stripe.checkout.Session.create(
            payment_method_types=["card"],
            customer=request.user.stripe_customer_id,
            line_items=[
                {
                    "price": settings.STRIPE_PRO_PRICE_ID,
                    "quantity": 1,
                }
            ],
            mode="subscription",
            success_url=settings.FRONTEND_URL + "/billing?success=1",
            cancel_url=settings.FRONTEND_URL + "/billing?canceled=1",
        )
        return Response({"url": session.url})


class CreateCustomerPortalView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request):
        session = stripe.billing_portal.Session.create(
            customer=request.user.stripe_customer_id,
            return_url=settings.FRONTEND_URL + "/billing",
        )
        return Response({"url": session.url})
