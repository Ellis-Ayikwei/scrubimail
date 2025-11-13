from rest_framework import generics, status, permissions
from rest_framework.decorators import api_view, permission_classes
from rest_framework.response import Response
from django.contrib.auth import get_user_model
from django.db.models import Count, Q, Sum
from django.utils import timezone
from datetime import timedelta
from apps.User.serializer import UserSerializer
from apps.billing.models import BillingProfile, CreditTransaction, Subscription
from apps.validation.models import EmailValidation, BulkValidationJob
from apps.plan.models import Plan
from apps.billing.serializers import (
    BillingProfileSerializer,
    CreditTransactionSerializer,
)
from apps.validation.serializers import EmailValidationSerializer
from apps.plan.serializers import PlanSerializer
from apps.apikey.models import APIKey
from apps.apikey.serializers import APIKeySerializer, APIKeyCreateSerializer, APIKeyUpdateSerializer

User = get_user_model()


class AdminUserListView(generics.ListAPIView):
    """List all users for admin"""

    serializer_class = UserSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        return User.objects.all().order_by("-date_joined")


class AdminUserDetailView(generics.RetrieveUpdateDestroyAPIView):
    """Get, update, or delete a specific user"""

    serializer_class = UserSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        return User.objects.all()


class AdminUserCreateView(generics.CreateAPIView):
    """Create a new user"""

    serializer_class = UserSerializer
    permission_classes = [permissions.IsAuthenticated]


@api_view(["GET"])
@permission_classes([permissions.IsAuthenticated])
def admin_user_stats(request):
    """Get user statistics for admin dashboard"""
    total_users = User.objects.count()
    active_users = User.objects.filter(is_active=True).count()

    # Users joined in last 30 days
    thirty_days_ago = timezone.now() - timedelta(days=30)
    new_users = User.objects.filter(date_joined__gte=thirty_days_ago).count()

    # Suspended users (assuming is_active=False means suspended)
    suspended_users = User.objects.filter(is_active=False).count()

    # Recent users (last 10)
    recent_users = User.objects.all().order_by("-date_joined")[:10]
    recent_users_data = UserSerializer(recent_users, many=True).data

    return Response(
        {
            "total": total_users,
            "active": active_users,
            "new": new_users,
            "suspended": suspended_users,
            "recent_users": recent_users_data,
        }
    )


@api_view(["GET"])
@permission_classes([permissions.IsAuthenticated])
def admin_billing_stats(request):
    """Get billing statistics for admin dashboard"""
    # Calculate total revenue from credit transactions
    total_revenue = (
        CreditTransaction.objects.filter(transaction_type="purchase").aggregate(
            total=Sum("amount")
        )["total"]
        or 0
    )

    # Recent credit transactions
    recent_transactions = CreditTransaction.objects.all().order_by("-created_at")[:10]
    recent_transactions_data = CreditTransactionSerializer(
        recent_transactions, many=True
    ).data

    return Response(
        {"total_revenue": total_revenue, "recent_billing": recent_transactions_data}
    )


@api_view(["GET"])
@permission_classes([permissions.IsAuthenticated])
def admin_validations_stats(request):
    """Get validation statistics for admin dashboard"""
    total_validations = EmailValidation.objects.count()

    # Recent validations
    recent_validations = EmailValidation.objects.all().order_by("-created_at")[:10]
    recent_validations_data = EmailValidationSerializer(
        recent_validations, many=True
    ).data

    return Response(
        {
            "total_validations": total_validations,
            "recent_validations": recent_validations_data,
        }
    )


class AdminBillingListView(generics.ListAPIView):
    """List all billing records for admin"""

    serializer_class = CreditTransactionSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        return CreditTransaction.objects.all().order_by("-created_at")


class AdminPlansListView(generics.ListCreateAPIView):
    """List and create plans for admin"""

    serializer_class = PlanSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        return Plan.objects.all().order_by("-created_at")


class AdminPlanDetailView(generics.RetrieveUpdateDestroyAPIView):
    """Get, update, or delete a specific plan"""

    serializer_class = PlanSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        return Plan.objects.all()


@api_view(["GET"])
@permission_classes([permissions.IsAuthenticated])
def admin_plans_stats(request):
    """Get plans statistics for admin"""
    total_plans = Plan.objects.count()
    active_plans = Plan.objects.filter(is_active=True).count()

    return Response({"total_plans": total_plans, "active_plans": active_plans})


class AdminValidationsListView(generics.ListAPIView):
    """List all validation records for admin"""

    serializer_class = EmailValidationSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        return EmailValidation.objects.all().order_by("-created_at")


class AdminAPIKeyListView(generics.ListCreateAPIView):
    """List and create API keys for admin"""

    serializer_class = APIKeySerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_serializer_class(self):
        if self.request.method == "POST":
            return APIKeyCreateSerializer
        return APIKeySerializer

    def get_queryset(self):
        return APIKey.objects.all().select_related('user').order_by("-created_at")

    def perform_create(self, serializer):
        """Create API key for specified user"""
        user_id = self.request.data.get('user_id')
        if not user_id:
            from rest_framework.exceptions import ValidationError
            raise ValidationError({'user_id': 'This field is required.'})
        
        try:
            user = User.objects.get(id=user_id)
        except User.DoesNotExist:
            from rest_framework.exceptions import ValidationError
            raise ValidationError({'user_id': 'User not found.'})
        
        # Get client IP and user agent
        ip_address = self.get_client_ip()
        user_agent = self.request.META.get("HTTP_USER_AGENT", "")

        # Generate new API key
        api_key = APIKey.generate_for_user(
            user=user,
            name=serializer.validated_data.get("name"),
            description=serializer.validated_data.get("description"),
            expires_at=serializer.validated_data.get("expires_at"),
            rate_limit_per_hour=serializer.validated_data.get("rate_limit_per_hour", 1000),
            ip_address=ip_address,
            user_agent=user_agent,
        )

        # Return the created API key
        self.object = api_key

    def get_client_ip(self):
        """Get client IP address from request"""
        x_forwarded_for = self.request.META.get("HTTP_X_FORWARDED_FOR")
        if x_forwarded_for:
            ip = x_forwarded_for.split(",")[0]
        else:
            ip = self.request.META.get("REMOTE_ADDR")
        return ip


class AdminAPIKeyDetailView(generics.RetrieveUpdateDestroyAPIView):
    """Get, update, or delete a specific API key for admin"""

    serializer_class = APIKeySerializer
    permission_classes = [permissions.IsAuthenticated]
    lookup_field = "pk"

    def get_serializer_class(self):
        if self.request.method in ["PUT", "PATCH"]:
            return APIKeyUpdateSerializer
        return APIKeySerializer

    def get_queryset(self):
        return APIKey.objects.all().select_related('user')

    def perform_update(self, serializer):
        serializer.save()

    def perform_destroy(self, instance):
        # Soft delete by deactivating
        instance.deactivate()
