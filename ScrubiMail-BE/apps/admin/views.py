from rest_framework import generics, status, permissions
from rest_framework.decorators import api_view, permission_classes
from rest_framework.response import Response
from django.contrib.auth import get_user_model
from django.db.models import Count, Q, Sum, F
from django.utils import timezone
from datetime import timedelta
from apps.User.serializer import UserSerializer, AdminUserSerializer
from apps.billing.models import (
    BillingProfile, CreditTransaction, Subscription,
    CreditPackagePurchase, Invoice, InvoiceLineItem,
)
from apps.billing.serializers import (
    BillingProfileSerializer,
    CreditTransactionSerializer,
    SubscriptionSerializer,
    InvoiceSerializer,
)
from apps.validation.models import EmailValidation, BulkValidationJob
from apps.plan.models import Plan
from apps.validation.serializers import EmailValidationSerializer
from apps.plan.serializers import PlanSerializer
from apps.apikey.models import APIKey
from apps.apikey.serializers import APIKeySerializer, APIKeyCreateSerializer, APIKeyUpdateSerializer
from apps.Authentication.models import TOTPDevice, TrustedDevice
from django.contrib.auth.models import Group, Permission
from django.shortcuts import get_object_or_404
from apps.User.serializer import GroupSerializer, GroupDetailSerializer, PermissionSerializer

User = get_user_model()


class AdminUserListView(generics.ListAPIView):
    """List all users for admin"""

    serializer_class = AdminUserSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        return User.objects.all().order_by("-date_joined")

    def list(self, request, *args, **kwargs):
        queryset = self.get_queryset()
        serializer = self.get_serializer(queryset, many=True)
        data = serializer.data

        # Attach billing snapshots in bulk
        user_ids = [u["id"] for u in data]
        billing_map = {
            bp.user_id: bp
            for bp in BillingProfile.objects.select_related("current_plan").filter(
                user_id__in=user_ids
            )
        }
        for user_data in data:
            bp = billing_map.get(user_data["id"])
            if bp:
                user_data["billing"] = {
                    "credits_remaining": bp.credits_remaining,
                    "credits_used_this_month": bp.credits_used_this_month,
                    "current_plan": {
                        "id": bp.current_plan.id,
                        "name": bp.current_plan.name,
                        "price": str(bp.current_plan.price),
                        "credits_per_month": bp.current_plan.credits_per_month,
                    } if bp.current_plan else None,
                }
            else:
                user_data["billing"] = None

        return Response(data)


class AdminUserDetailView(generics.RetrieveUpdateDestroyAPIView):
    """Get, update, or delete a specific user"""

    serializer_class = AdminUserSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        return User.objects.all()

    def retrieve(self, request, *args, **kwargs):
        instance = self.get_object()
        data = self.get_serializer(instance).data

        # Attach billing profile data
        try:
            bp = BillingProfile.objects.select_related("current_plan").get(user=instance)
            data["billing"] = {
                "credits_remaining": bp.credits_remaining,
                "credits_used_this_month": bp.credits_used_this_month,
                "credits_reset_date": bp.credits_reset_date.isoformat() if bp.credits_reset_date else None,
                "plan_start_date": bp.plan_start_date.isoformat() if bp.plan_start_date else None,
                "current_plan": {
                    "id": bp.current_plan.id,
                    "name": bp.current_plan.name,
                    "price": str(bp.current_plan.price),
                    "credits_per_month": bp.current_plan.credits_per_month,
                } if bp.current_plan else None,
            }
        except BillingProfile.DoesNotExist:
            data["billing"] = None

        return Response(data)


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


# ---------------------------------------------------------------------------
# Admin 2FA / Security management
# ---------------------------------------------------------------------------

@api_view(["GET"])
@permission_classes([permissions.IsAdminUser])
def admin_user_security(request, user_id):
    """Get 2FA and trusted device status for a user."""
    try:
        user = User.objects.get(pk=user_id)
    except User.DoesNotExist:
        return Response({"detail": "User not found"}, status=status.HTTP_404_NOT_FOUND)

    try:
        totp = TOTPDevice.objects.get(user=user)
        totp_data = {
            "enabled": totp.is_enabled,
            "backup_codes_remaining": len([c for c in (totp.backup_codes or []) if c]),
        }
    except TOTPDevice.DoesNotExist:
        totp_data = {"enabled": False, "backup_codes_remaining": 0}

    trusted_devices = TrustedDevice.objects.filter(user=user).values(
        "id", "device_name", "created_at", "last_used"
    )

    return Response({
        "totp": totp_data,
        "trusted_devices": list(trusted_devices),
    })


@api_view(["POST"])
@permission_classes([permissions.IsAdminUser])
def admin_disable_2fa(request, user_id):
    """Force-disable 2FA for a user (admin action)."""
    try:
        user = User.objects.get(pk=user_id)
    except User.DoesNotExist:
        return Response({"detail": "User not found"}, status=status.HTTP_404_NOT_FOUND)

    try:
        totp = TOTPDevice.objects.get(user=user)
        totp.disable()
    except TOTPDevice.DoesNotExist:
        pass

    return Response({"detail": "2FA disabled successfully."})


@api_view(["POST"])
@permission_classes([permissions.IsAdminUser])
def admin_revoke_trusted_devices(request, user_id):
    """Revoke all trusted devices for a user."""
    try:
        user = User.objects.get(pk=user_id)
    except User.DoesNotExist:
        return Response({"detail": "User not found"}, status=status.HTTP_404_NOT_FOUND)

    count, _ = TrustedDevice.objects.filter(user=user).delete()
    return Response({"detail": f"Revoked {count} trusted device(s)."})


# ---------------------------------------------------------------------------
# Admin Billing / Credits / Plan management
# ---------------------------------------------------------------------------

@api_view(["POST"])
@permission_classes([permissions.IsAdminUser])
def admin_adjust_credits(request):
    """Add or deduct credits for a user. Expects {user_id, amount, reason}."""
    user_id = request.data.get("user_id")
    amount = request.data.get("amount")
    reason = request.data.get("reason", "Admin adjustment")

    if not user_id or amount is None:
        return Response(
            {"detail": "user_id and amount are required."},
            status=status.HTTP_400_BAD_REQUEST,
        )
    amount = int(amount)
    if amount == 0:
        return Response(
            {"detail": "Amount must be non-zero."},
            status=status.HTTP_400_BAD_REQUEST,
        )

    try:
        bp = BillingProfile.objects.select_related("current_plan").get(user_id=user_id)
    except BillingProfile.DoesNotExist:
        return Response({"detail": "Billing profile not found."}, status=status.HTTP_404_NOT_FOUND)

    if amount > 0:
        bp.credits_remaining += amount
        bp.save(update_fields=["credits_remaining"])
        tx_type = "grant"
    else:
        deduct = abs(amount)
        if bp.credits_remaining < deduct:
            return Response(
                {"detail": f"Insufficient credits. User has {bp.credits_remaining}."},
                status=status.HTTP_400_BAD_REQUEST,
            )
        bp.credits_remaining -= deduct
        bp.save(update_fields=["credits_remaining"])
        tx_type = "deduction"

    CreditTransaction.objects.create(
        billing_profile=bp,
        transaction_type=tx_type,
        amount=amount,
        description=reason,
    )

    return Response({
        "detail": f"{'Added' if amount > 0 else 'Deducted'} {abs(amount)} credits.",
        "credits_remaining": bp.credits_remaining,
    })


@api_view(["POST"])
@permission_classes([permissions.IsAdminUser])
def admin_reset_billing_cycle(request, user_id):
    """
    Reset a user's billing cycle to now:
      - credits_remaining → plan.credits_per_month
      - credits_used_this_month → 0
      - credits_reset_date → now
      - plan_start_date → now
    """
    try:
        bp = BillingProfile.objects.select_related("current_plan").get(user_id=user_id)
    except BillingProfile.DoesNotExist:
        return Response({"detail": "Billing profile not found."}, status=status.HTTP_404_NOT_FOUND)

    if not bp.current_plan:
        return Response({"detail": "User has no plan assigned."}, status=status.HTTP_400_BAD_REQUEST)

    old_remaining = bp.credits_remaining
    old_used = bp.credits_used_this_month

    bp.credits_remaining = bp.current_plan.credits_per_month
    bp.credits_used_this_month = 0
    bp.credits_reset_date = timezone.now()
    bp.plan_start_date = timezone.now()
    bp.save(update_fields=[
        "credits_remaining",
        "credits_used_this_month",
        "credits_reset_date",
        "plan_start_date",
    ])

    CreditTransaction.objects.create(
        billing_profile=bp,
        transaction_type="manual_reset",
        amount=bp.current_plan.credits_per_month,
        description=f"Manual billing cycle reset by admin ({bp.current_plan.name})",
        metadata={
            "previous_remaining": old_remaining,
            "previous_used": old_used,
            "plan_credits": bp.current_plan.credits_per_month,
            "reset_by": request.user.email,
        },
    )

    return Response({
        "detail": f"Billing cycle reset. {bp.current_plan.credits_per_month} credits allocated.",
        "credits_remaining": bp.credits_remaining,
    })


@api_view(["POST"])
@permission_classes([permissions.IsAdminUser])
def admin_change_plan(request, user_id):
    """Change a user's plan. Expects {plan_id}. Resets credits to the new plan's allocation."""
    plan_id = request.data.get("plan_id")
    if not plan_id:
        return Response({"detail": "plan_id is required."}, status=status.HTTP_400_BAD_REQUEST)

    try:
        new_plan = Plan.objects.get(pk=plan_id, is_active=True)
    except Plan.DoesNotExist:
        return Response({"detail": "Plan not found or inactive."}, status=status.HTTP_404_NOT_FOUND)

    try:
        bp = BillingProfile.objects.get(user_id=user_id)
    except BillingProfile.DoesNotExist:
        return Response({"detail": "Billing profile not found."}, status=status.HTTP_404_NOT_FOUND)

    old_plan_name = bp.current_plan.name if bp.current_plan else "None"
    old_remaining = bp.credits_remaining
    old_used = bp.credits_used_this_month

    bp.current_plan = new_plan
    bp.credits_remaining = new_plan.credits_per_month
    bp.credits_used_this_month = 0
    bp.credits_reset_date = timezone.now()
    bp.plan_start_date = timezone.now()
    bp.save(update_fields=[
        "current_plan",
        "credits_remaining",
        "credits_used_this_month",
        "credits_reset_date",
        "plan_start_date",
    ])

    CreditTransaction.objects.create(
        billing_profile=bp,
        transaction_type="manual_reset",
        amount=new_plan.credits_per_month,
        description=f"Plan changed: {old_plan_name} → {new_plan.name}",
        metadata={
            "old_plan": old_plan_name,
            "new_plan": new_plan.name,
            "previous_remaining": old_remaining,
            "previous_used": old_used,
            "plan_credits": new_plan.credits_per_month,
            "changed_by": request.user.email,
        },
    )

    return Response({
        "detail": f"Plan changed to {new_plan.name} with {new_plan.credits_per_month} credits.",
        "credits_remaining": bp.credits_remaining,
    })


# ---------------------------------------------------------------------------
# Admin Groups & Permissions management
# ---------------------------------------------------------------------------

def _admin_group_refreshed(pk):
    return Group.objects.prefetch_related("permissions", "custom_user_set").get(pk=pk)


@api_view(["GET", "POST"])
@permission_classes([permissions.IsAdminUser])
def admin_groups_collection(request):
    """List all groups (GET) or create a group (POST)."""
    if request.method == "GET":
        groups = Group.objects.prefetch_related("permissions").all()
        return Response(GroupDetailSerializer(groups, many=True).data)

    name = (request.data.get("name") or "").strip()
    if not name:
        return Response(
            {"detail": "name is required"},
            status=status.HTTP_400_BAD_REQUEST,
        )
    if Group.objects.filter(name=name).exists():
        return Response(
            {"detail": "A group with this name already exists."},
            status=status.HTTP_400_BAD_REQUEST,
        )
    group = Group.objects.create(name=name)
    fresh = Group.objects.prefetch_related("permissions").get(pk=group.pk)
    return Response(GroupDetailSerializer(fresh).data, status=status.HTTP_201_CREATED)


@api_view(["PATCH", "DELETE"])
@permission_classes([permissions.IsAdminUser])
def admin_group_detail(request, pk):
    """Rename a group (PATCH) or delete if it has no members (DELETE)."""
    group = get_object_or_404(Group.objects.prefetch_related("permissions"), pk=pk)

    if request.method == "PATCH":
        name = request.data.get("name")
        if name is not None:
            name = str(name).strip()
            if not name:
                return Response(
                    {"detail": "name cannot be empty"},
                    status=status.HTTP_400_BAD_REQUEST,
                )
            if Group.objects.filter(name=name).exclude(pk=pk).exists():
                return Response(
                    {"detail": "A group with this name already exists."},
                    status=status.HTTP_400_BAD_REQUEST,
                )
            group.name = name
            group.save(update_fields=["name"])
        refreshed = Group.objects.prefetch_related("permissions").get(pk=group.pk)
        return Response(GroupDetailSerializer(refreshed).data)

    if group.custom_user_set.exists():
        n = group.custom_user_set.count()
        return Response(
            {
                "detail": f"Cannot delete this group: {n} user(s) are still assigned.",
            },
            status=status.HTTP_400_BAD_REQUEST,
        )
    group.delete()
    return Response(status=status.HTTP_204_NO_CONTENT)


@api_view(["PUT"])
@permission_classes([permissions.IsAdminUser])
def admin_group_permissions(request, pk):
    """Replace a group's Django permissions. Body: { permission_ids: [1, 2, ...] }"""
    group = get_object_or_404(Group, pk=pk)
    permission_ids = request.data.get("permission_ids")
    if permission_ids is None:
        return Response(
            {"detail": "permission_ids is required"},
            status=status.HTTP_400_BAD_REQUEST,
        )
    if not isinstance(permission_ids, list):
        return Response(
            {"detail": "permission_ids must be a list"},
            status=status.HTTP_400_BAD_REQUEST,
        )
    perms = Permission.objects.filter(id__in=permission_ids)
    group.permissions.set(perms)
    refreshed = _admin_group_refreshed(group.pk)
    return Response(GroupDetailSerializer(refreshed).data)


@api_view(["POST"])
@permission_classes([permissions.IsAdminUser])
def admin_group_add_users(request, pk):
    """Add users to a group. Body: { user_ids: ["uuid", ...] }"""
    group = get_object_or_404(Group, pk=pk)
    user_ids = request.data.get("user_ids")
    if not user_ids or not isinstance(user_ids, list):
        return Response(
            {"detail": "user_ids is required and must be a non-empty list"},
            status=status.HTTP_400_BAD_REQUEST,
        )
    users = list(User.objects.filter(id__in=user_ids))
    if not users:
        return Response(
            {"detail": "No matching users found for the given ids."},
            status=status.HTTP_400_BAD_REQUEST,
        )
    group.custom_user_set.add(*users)
    refreshed = _admin_group_refreshed(group.pk)
    return Response(GroupDetailSerializer(refreshed).data)


@api_view(["POST"])
@permission_classes([permissions.IsAdminUser])
def admin_group_remove_users(request, pk):
    """Remove users from a group. Body: { user_ids: ["uuid", ...] }"""
    group = get_object_or_404(Group, pk=pk)
    user_ids = request.data.get("user_ids")
    if not user_ids or not isinstance(user_ids, list):
        return Response(
            {"detail": "user_ids is required and must be a non-empty list"},
            status=status.HTTP_400_BAD_REQUEST,
        )
    users = list(User.objects.filter(id__in=user_ids))
    if not users:
        return Response(
            {"detail": "No matching users found for the given ids."},
            status=status.HTTP_400_BAD_REQUEST,
        )
    group.custom_user_set.remove(*users)
    refreshed = _admin_group_refreshed(group.pk)
    return Response(GroupDetailSerializer(refreshed).data)


@api_view(["GET"])
@permission_classes([permissions.IsAdminUser])
def admin_permissions_list(request):
    """List all available permissions."""
    perms = Permission.objects.select_related("content_type").all().order_by(
        "content_type__app_label", "codename"
    )
    return Response(PermissionSerializer(perms, many=True).data)


@api_view(["GET", "PUT"])
@permission_classes([permissions.IsAdminUser])
def admin_user_groups(request, user_id):
    """
    GET  → current groups for the user
    PUT  → replace user's groups. Expects { group_ids: [1, 2, ...] }
    """
    try:
        user = User.objects.get(pk=user_id)
    except User.DoesNotExist:
        return Response({"detail": "User not found"}, status=status.HTTP_404_NOT_FOUND)

    if request.method == "GET":
        return Response(GroupSerializer(user.groups.all(), many=True).data)

    # PUT
    group_ids = request.data.get("group_ids", [])
    groups = Group.objects.filter(id__in=group_ids)
    user.groups.set(groups)
    return Response({
        "detail": f"Updated groups for {user.email}.",
        "groups": GroupSerializer(user.groups.all(), many=True).data,
    })


@api_view(["GET", "PUT"])
@permission_classes([permissions.IsAdminUser])
def admin_user_permissions(request, user_id):
    """
    GET  → current direct permissions for the user
    PUT  → replace user's direct permissions. Expects { permission_ids: [1, 2, ...] }
    """
    try:
        user = User.objects.get(pk=user_id)
    except User.DoesNotExist:
        return Response({"detail": "User not found"}, status=status.HTTP_404_NOT_FOUND)

    if request.method == "GET":
        direct = user.user_permissions.all()
        group_perms = Permission.objects.filter(group__in=user.groups.all()).distinct()
        return Response({
            "direct": PermissionSerializer(direct, many=True).data,
            "from_groups": PermissionSerializer(group_perms, many=True).data,
        })

    # PUT
    perm_ids = request.data.get("permission_ids", [])
    perms = Permission.objects.filter(id__in=perm_ids)
    user.user_permissions.set(perms)
    return Response({
        "detail": f"Updated permissions for {user.email}.",
        "direct": PermissionSerializer(user.user_permissions.all(), many=True).data,
    })


# ---------------------------------------------------------------------------
# Admin Payments management  (covers CreditTransactions, CreditPackagePurchases,
# Subscriptions — everything that represents a "payment" in the system)
# ---------------------------------------------------------------------------

@api_view(["GET"])
@permission_classes([permissions.IsAdminUser])
def admin_payments_list(request):
    """
    Unified payment list for admin.  Merges CreditTransactions that have a
    paystack reference (real payments) with CreditPackagePurchases.
    Supports ?status=, ?search=, ?date_from=, ?date_to= query params.
    """
    search = request.GET.get("search", "").strip()
    status_filter = request.GET.get("status", "").strip()
    date_from = request.GET.get("date_from")
    date_to = request.GET.get("date_to")
    page = int(request.GET.get("page", 1))
    page_size = int(request.GET.get("page_size", 50))

    # Build from CreditPackagePurchase (the most reliable payment records)
    purchases_qs = (
        CreditPackagePurchase.objects
        .select_related("user", "package", "billing_profile")
        .order_by("-created_at")
    )
    if status_filter:
        purchases_qs = purchases_qs.filter(status=status_filter)
    if search:
        purchases_qs = purchases_qs.filter(
            Q(user__email__icontains=search)
            | Q(user__first_name__icontains=search)
            | Q(user__last_name__icontains=search)
            | Q(paystack_reference__icontains=search)
        )
    if date_from:
        purchases_qs = purchases_qs.filter(created_at__date__gte=date_from)
    if date_to:
        purchases_qs = purchases_qs.filter(created_at__date__lte=date_to)

    # Also include CreditTransactions with a paystack reference (plan upgrades, credit purchases)
    tx_qs = (
        CreditTransaction.objects
        .select_related("billing_profile", "billing_profile__user")
        .exclude(paystack_payment_reference__isnull=True)
        .exclude(paystack_payment_reference="")
        .order_by("-created_at")
    )
    if search:
        tx_qs = tx_qs.filter(
            Q(billing_profile__user__email__icontains=search)
            | Q(billing_profile__user__first_name__icontains=search)
            | Q(billing_profile__user__last_name__icontains=search)
            | Q(paystack_payment_reference__icontains=search)
        )
    if date_from:
        tx_qs = tx_qs.filter(created_at__date__gte=date_from)
    if date_to:
        tx_qs = tx_qs.filter(created_at__date__lte=date_to)

    # Normalise both into a flat list
    results = []
    seen_refs = set()

    for p in purchases_qs:
        ref = p.paystack_reference or ""
        seen_refs.add(ref)
        results.append({
            "id": str(p.id),
            "user": {
                "id": str(p.user.id),
                "email": p.user.email,
                "name": f"{p.user.first_name} {p.user.last_name}".strip() or None,
            },
            "amount": float(p.amount_paid),
            "currency": p.currency,
            "status": p.status,
            "payment_method": "paystack",
            "transaction_id": ref,
            "created_at": p.created_at.isoformat(),
            "updated_at": p.updated_at.isoformat(),
            "description": f"Credit package: {p.package.name}" if p.package else "Credit package purchase",
            "plan": None,
            "type": "credit_package",
        })

    for tx in tx_qs:
        ref = tx.paystack_payment_reference or ""
        if ref in seen_refs:
            continue
        seen_refs.add(ref)
        user = tx.billing_profile.user
        tx_type = (tx.metadata or {}).get("type", tx.transaction_type)
        results.append({
            "id": str(tx.id),
            "user": {
                "id": str(user.id),
                "email": user.email,
                "name": f"{user.first_name} {user.last_name}".strip() or None,
            },
            "amount": abs(tx.amount) if tx.transaction_type == "purchase" else float(abs(tx.amount)),
            "currency": "NGN",
            "status": "completed",
            "payment_method": "paystack",
            "transaction_id": ref,
            "created_at": tx.created_at.isoformat(),
            "updated_at": tx.created_at.isoformat(),
            "description": tx.description,
            "plan": (tx.metadata or {}).get("plan_name"),
            "type": tx_type,
        })

    # Sort by date descending
    results.sort(key=lambda r: r["created_at"], reverse=True)

    # Paginate
    total = len(results)
    start = (page - 1) * page_size
    end = start + page_size
    page_results = results[start:end]

    return Response({
        "results": page_results,
        "count": total,
        "page": page,
        "page_size": page_size,
        "total_pages": (total + page_size - 1) // page_size if total else 1,
    })


@api_view(["GET"])
@permission_classes([permissions.IsAdminUser])
def admin_payments_stats(request):
    """Revenue & payment statistics for admin dashboard."""
    now = timezone.now()
    month_start = now.replace(day=1, hour=0, minute=0, second=0, microsecond=0)

    # Total revenue from completed credit package purchases
    pkg_revenue = CreditPackagePurchase.objects.filter(
        status="completed",
    ).aggregate(total=Sum("amount_paid"))["total"] or 0

    # Monthly revenue
    monthly_pkg = CreditPackagePurchase.objects.filter(
        status="completed", created_at__gte=month_start,
    ).aggregate(total=Sum("amount_paid"))["total"] or 0

    # Also count purchase-type credit transactions (plan upgrades, credit buys)
    tx_revenue = CreditTransaction.objects.filter(
        transaction_type="purchase",
    ).exclude(
        paystack_payment_reference__isnull=True,
    ).exclude(
        paystack_payment_reference="",
    ).aggregate(total=Sum("amount"))["total"] or 0

    monthly_tx = CreditTransaction.objects.filter(
        transaction_type="purchase",
        created_at__gte=month_start,
    ).exclude(
        paystack_payment_reference__isnull=True,
    ).exclude(
        paystack_payment_reference="",
    ).aggregate(total=Sum("amount"))["total"] or 0

    total_revenue = float(pkg_revenue) + float(tx_revenue)
    monthly_revenue = float(monthly_pkg) + float(monthly_tx)

    pending_payments = CreditPackagePurchase.objects.filter(status="pending").count()
    failed_payments = CreditPackagePurchase.objects.filter(status="failed").count()

    total_payments = CreditPackagePurchase.objects.filter(status="completed").count()
    average_transaction = total_revenue / total_payments if total_payments else 0

    # Top plans by subscription count
    top_plans = list(
        Subscription.objects
        .values(plan_name=F("plan__name"))
        .annotate(count=Count("id"), revenue=Sum("plan__price"))
        .order_by("-count")[:5]
    )

    return Response({
        "total_revenue": round(total_revenue, 2),
        "monthly_revenue": round(monthly_revenue, 2),
        "pending_payments": pending_payments,
        "failed_payments": failed_payments,
        "average_transaction": round(average_transaction, 2),
        "top_plans": top_plans,
    })


# ---------------------------------------------------------------------------
# Admin Invoices management
# ---------------------------------------------------------------------------

@api_view(["GET"])
@permission_classes([permissions.IsAdminUser])
def admin_invoices_list(request):
    """List ALL invoices across all users for admin."""
    search = request.GET.get("search", "").strip()
    status_filter = request.GET.get("status", "").strip()
    type_filter = request.GET.get("type", "").strip()
    page = int(request.GET.get("page", 1))
    page_size = int(request.GET.get("page_size", 50))

    qs = Invoice.objects.select_related("user", "billing_profile").prefetch_related("line_items").order_by("-invoice_date")

    if status_filter:
        qs = qs.filter(status=status_filter)
    if type_filter:
        qs = qs.filter(invoice_type=type_filter)
    if search:
        qs = qs.filter(
            Q(user__email__icontains=search)
            | Q(invoice_number__icontains=search)
            | Q(customer_name__icontains=search)
        )

    total = qs.count()
    start = (page - 1) * page_size
    invoices_page = qs[start:start + page_size]

    data = InvoiceSerializer(invoices_page, many=True).data

    # Attach user info to each invoice
    for inv_data, inv_obj in zip(data, invoices_page):
        inv_data["user_info"] = {
            "id": str(inv_obj.user.id),
            "email": inv_obj.user.email,
            "name": f"{inv_obj.user.first_name} {inv_obj.user.last_name}".strip() or None,
        }

    # Stats
    all_invoices = Invoice.objects.all()
    paid_total = all_invoices.filter(status="paid").aggregate(t=Sum("total_amount"))["t"] or 0
    pending_total = all_invoices.filter(status="pending").aggregate(t=Sum("total_amount"))["t"] or 0
    overdue_count = all_invoices.filter(status="overdue").count()

    return Response({
        "results": data,
        "count": total,
        "page": page,
        "page_size": page_size,
        "total_pages": (total + page_size - 1) // page_size if total else 1,
        "stats": {
            "paid_total": float(paid_total),
            "pending_total": float(pending_total),
            "overdue_count": overdue_count,
            "total_invoices": all_invoices.count(),
        },
    })


@api_view(["PATCH"])
@permission_classes([permissions.IsAdminUser])
def admin_invoice_update_status(request, invoice_id):
    """Update an invoice status (admin action)."""
    try:
        invoice = Invoice.objects.get(pk=invoice_id)
    except Invoice.DoesNotExist:
        return Response({"detail": "Invoice not found"}, status=status.HTTP_404_NOT_FOUND)

    new_status = request.data.get("status")
    valid = {c[0] for c in Invoice.STATUS_CHOICES}
    if new_status not in valid:
        return Response(
            {"detail": f"Invalid status. Must be one of: {', '.join(sorted(valid))}"},
            status=status.HTTP_400_BAD_REQUEST,
        )

    invoice.status = new_status
    if new_status == "paid" and not invoice.paid_date:
        invoice.paid_date = timezone.now()
    invoice.save()

    return Response(InvoiceSerializer(invoice).data)
