from django.views.decorators.csrf import csrf_exempt
from django.utils.decorators import method_decorator
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
from rest_framework.permissions import IsAuthenticated
from backend.middle_ware import AllowJWTOrAPIKey
from rest_framework.decorators import api_view, permission_classes
from django.shortcuts import get_object_or_404
from django.utils import timezone
from django.db.models import Sum, Count
from datetime import datetime, timedelta
import json
import hashlib
import hmac

from .models import (
    BillingProfile,
    CreditTransaction,
    Subscription,
    EmailValidationUsage,
)
from .serializers import (
    BillingProfileSerializer,
    CreditTransactionSerializer,
    PlanSerializer,
    BillingAnalyticsSerializer,
    CreditPurchaseSerializer,
    PlanUpgradeSerializer,
    PaymentVerificationSerializer,
    UsageStatsSerializer,
    BillingHistorySerializer,
)
from .services import BillingService, PaystackService
from apps.plan.models import Plan


class CreditsView(APIView):
    """Get user's current credit balance"""

    permission_classes = [AllowJWTOrAPIKey]

    def get(self, request):
        billing_service = BillingService()
        profile = billing_service.get_or_create_billing_profile(request.user)

        serializer = BillingProfileSerializer(profile)
        return Response(serializer.data)


class BillingAnalyticsView(APIView):
    """Get billing analytics and usage statistics"""

    permission_classes = [AllowJWTOrAPIKey]

    def get(self, request):
        print(f"DEBUG: BillingAnalyticsView - User: {request.user}")
        print(
            f"DEBUG: BillingAnalyticsView - Authenticated: {request.user.is_authenticated}"
        )
        print(f"DEBUG: BillingAnalyticsView - Auth headers: {dict(request.headers)}")

        billing_service = BillingService()
        analytics = billing_service.get_usage_analytics(request.user)

        serializer = BillingAnalyticsSerializer(analytics)
        return Response(serializer.data)


class PlansView(APIView):
    """Get available plans"""

    permission_classes = [AllowJWTOrAPIKey]

    def get(self, request):
        plans = Plan.objects.filter(is_active=True).order_by("price")
        serializer = PlanSerializer(plans, many=True)
        return Response(serializer.data)


class CreditPurchaseView(APIView):
    """Initialize credit purchase"""

    permission_classes = [AllowJWTOrAPIKey]

    def post(self, request):
        serializer = CreditPurchaseSerializer(data=request.data)
        if serializer.is_valid():
            billing_service = BillingService()

            try:
                result = billing_service.initialize_credit_purchase(
                    user=request.user,
                    amount=serializer.validated_data["amount"],
                    credits=serializer.validated_data["credits"],
                )
                return Response(result, status=status.HTTP_200_OK)
            except Exception as e:
                return Response({"error": str(e)}, status=status.HTTP_400_BAD_REQUEST)

        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


class PlanUpgradeView(APIView):
    """Initialize plan upgrade"""

    permission_classes = [AllowJWTOrAPIKey]

    def post(self, request):
        serializer = PlanUpgradeSerializer(data=request.data)
        if serializer.is_valid():
            billing_service = BillingService()
            plan = get_object_or_404(Plan, id=serializer.validated_data["plan_id"])

            try:
                result = billing_service.initialize_plan_upgrade(
                    user=request.user, plan=plan
                )
                return Response(result, status=status.HTTP_200_OK)
            except Exception as e:
                return Response({"error": str(e)}, status=status.HTTP_400_BAD_REQUEST)

        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


class PaymentVerificationView(APIView):
    """Verify payment after successful transaction"""

    permission_classes = [AllowJWTOrAPIKey]

    def post(self, request):
        serializer = PaymentVerificationSerializer(data=request.data)
        if serializer.is_valid():
            billing_service = BillingService()

            success = billing_service.handle_payment_verification(
                serializer.validated_data["reference"]
            )

            if success:
                return Response(
                    {"status": "success", "message": "Payment verified successfully"},
                    status=status.HTTP_200_OK,
                )
            else:
                return Response(
                    {"status": "failed", "message": "Payment verification failed"},
                    status=status.HTTP_400_BAD_REQUEST,
                )

        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


class BillingHistoryView(APIView):
    """Get billing history and transactions"""

    permission_classes = [AllowJWTOrAPIKey]

    def get(self, request):
        profile = BillingService().get_or_create_billing_profile(request.user)

        # Get pagination parameters
        page = int(request.GET.get("page", 1))
        page_size = int(request.GET.get("page_size", 20))

        # Get transactions
        transactions = profile.credit_transactions.all()[
            (page - 1) * page_size : page * page_size
        ]

        # Get subscriptions
        subscriptions = profile.subscriptions.all()

        # Calculate pagination info
        total_transactions = profile.credit_transactions.count()
        total_pages = (total_transactions + page_size - 1) // page_size

        data = {
            "transactions": CreditTransactionSerializer(transactions, many=True).data,
            "subscriptions": [
                {"id": sub.id, "plan": sub.plan.name, "status": sub.status}
                for sub in subscriptions
            ],
            "total_pages": total_pages,
            "current_page": page,
            "has_next": page < total_pages,
            "has_previous": page > 1,
        }

        serializer = BillingHistorySerializer(data)
        return Response(serializer.data)


class UsageStatsView(APIView):
    """Get detailed usage statistics"""

    permission_classes = [AllowJWTOrAPIKey]

    def get(self, request):
        profile = BillingService().get_or_create_billing_profile(request.user)
        period = request.GET.get("period", "month")  # day, week, month, year

        # Calculate date range
        now = timezone.now()
        if period == "day":
            start_date = now.replace(hour=0, minute=0, second=0, microsecond=0)
        elif period == "week":
            start_date = now - timedelta(days=7)
        elif period == "month":
            start_date = now.replace(day=1, hour=0, minute=0, second=0, microsecond=0)
        elif period == "year":
            start_date = now.replace(
                month=1, day=1, hour=0, minute=0, second=0, microsecond=0
            )
        else:
            start_date = now.replace(day=1, hour=0, minute=0, second=0, microsecond=0)

        # Get actual validation data from EmailValidation model
        from apps.validation.models import EmailValidation
        
        validation_queryset = EmailValidation.objects.filter(
            user=request.user, created_at__gte=start_date
        )
        
        total_validations = validation_queryset.count()
        valid_emails = validation_queryset.filter(
            status="completed", score__gte=80
        ).count()
        invalid_emails = validation_queryset.filter(
            status="completed", score__lt=50
        ).count()
        risky_emails = validation_queryset.filter(
            status="completed", score__range=[50, 79]
        ).count()
        
        # Calculate success rate
        completed_validations = validation_queryset.filter(status="completed").count()
        success_rate = (valid_emails / completed_validations * 100) if completed_validations > 0 else 0
        
        # Get usage data from credit transactions
        usage_queryset = profile.credit_transactions.filter(
            transaction_type="usage", created_at__gte=start_date
        )
        credits_used = abs(usage_queryset.aggregate(Sum("amount"))["amount__sum"] or 0)

        # Calculate daily usage for the period
        daily_usage = []
        current_date = start_date
        while current_date <= now:
            day_usage = (
                profile.credit_transactions.filter(
                    transaction_type="usage", created_at__date=current_date.date()
                ).aggregate(Sum("amount"))["amount__sum"]
                or 0
            )

            daily_usage.append(
                {
                    "date": current_date.strftime("%Y-%m-%d"),
                    "validations": abs(day_usage),
                }
            )
            current_date += timedelta(days=1)

        data = {
            "period": period,
            "total_validations": total_validations,
            "valid_emails": valid_emails,
            "invalid_emails": invalid_emails,
            "risky_emails": risky_emails,
            "success_rate": success_rate,
            "credits_used": credits_used,
            "credits_remaining": profile.credits_remaining,
            "cost_per_validation": 0.01,  # This could be calculated from plan
            "daily_usage": daily_usage,
            "weekly_usage": daily_usage[-7:],  # Last 7 days
            "monthly_usage": (
                daily_usage[-30:] if len(daily_usage) >= 30 else daily_usage
            ),
        }

        serializer = UsageStatsSerializer(data)
        return Response(serializer.data)


class CancelSubscriptionView(APIView):
    """Cancel user's subscription"""

    permission_classes = [AllowJWTOrAPIKey]

    def post(self, request):
        profile = BillingService().get_or_create_billing_profile(request.user)

        if not profile.paystack_subscription_id:
            return Response(
                {"error": "No active subscription found"},
                status=status.HTTP_400_BAD_REQUEST,
            )

        try:
            paystack_service = PaystackService()
            paystack_service.cancel_subscription(profile.paystack_subscription_id)

            # Update local subscription status
            subscription = profile.subscriptions.filter(
                paystack_subscription_id=profile.paystack_subscription_id
            ).first()
            if subscription:
                subscription.status = "canceled"
                subscription.cancel_at_period_end = True
                subscription.save()

            profile.billing_status = "canceled"
            profile.save()

            return Response(
                {"message": "Subscription canceled successfully"},
                status=status.HTTP_200_OK,
            )
        except Exception as e:
            return Response({"error": str(e)}, status=status.HTTP_400_BAD_REQUEST)


@api_view(["POST"])
@permission_classes([])
def paystack_webhook(request):
    """Handle Paystack webhook events"""
    if request.method != "POST":
        return Response(
            {"error": "Method not allowed"}, status=status.HTTP_405_METHOD_NOT_ALLOWED
        )

    # Verify webhook signature
    signature = request.headers.get("X-Paystack-Signature")
    if not signature:
        return Response(
            {"error": "Missing signature"}, status=status.HTTP_400_BAD_REQUEST
        )

    # Verify webhook signature (implement proper verification)
    # This is a simplified version - implement proper HMAC verification
    try:
        event_data = request.data
        billing_service = BillingService()
        billing_service.handle_subscription_webhook(event_data)

        return Response({"status": "success"}, status=status.HTTP_200_OK)
    except Exception as e:
        return Response({"error": str(e)}, status=status.HTTP_400_BAD_REQUEST)


class DownloadInvoiceView(APIView):
    """Download invoice for billing period"""

    permission_classes = [AllowJWTOrAPIKey]

    def get(self, request):
        # This would typically generate and return a PDF invoice
        # For now, return a placeholder response
        return Response(
            {"message": "Invoice download feature coming soon"},
            status=status.HTTP_501_NOT_IMPLEMENTED,
        )


@api_view(["GET"])
def debug_auth(request):
    """Debug authentication endpoint"""
    return Response(
        {
            "user": str(request.user),
            "authenticated": request.user.is_authenticated,
            "auth_type": (
                str(type(request.successful_authenticator))
                if hasattr(request, "successful_authenticator")
                else None
            ),
            "headers": dict(request.headers),
        }
    )
