from rest_framework import generics, status, permissions
from rest_framework.decorators import api_view, permission_classes
from rest_framework.response import Response
from django.contrib.auth import get_user_model
from django.db.models import Count, Q, Sum, F, Value
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

import logging

logger = logging.getLogger(__name__)

User = get_user_model()


class AdminUserListView(generics.ListAPIView):
    """List all users for admin"""

    serializer_class = AdminUserSerializer
    permission_classes = [permissions.IsAdminUser]

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
    permission_classes = [permissions.IsAdminUser]

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

    def perform_update(self, serializer):
        """Guard the changes that could lock an admin out or escalate privilege.

        - An admin cannot suspend, de-staff or de-superuser their own account
          (the last admin doing so would lock everyone out of the panel).
        - Only a superuser may grant or revoke superuser.
        """
        from rest_framework.exceptions import PermissionDenied, ValidationError

        instance = serializer.instance
        incoming = serializer.validated_data
        actor = self.request.user

        if instance.pk == actor.pk:
            for field in ("is_active", "is_staff", "is_superuser"):
                if field in incoming and incoming[field] is False and getattr(instance, field):
                    raise ValidationError(
                        {"detail": f"You cannot remove {field.replace('is_', '')} from your own account."}
                    )

        if "is_superuser" in incoming and incoming["is_superuser"] != instance.is_superuser:
            if not actor.is_superuser:
                raise PermissionDenied("Only a superuser can change superuser status.")

        extra = {}
        # Keep the informational account_status in step with the flag the auth
        # layer actually enforces (is_active), unless the caller set it explicitly.
        if "is_active" in incoming and "account_status" not in incoming:
            extra["account_status"] = "active" if incoming["is_active"] else "suspended"
        serializer.save(**extra)

    def perform_destroy(self, instance):
        from rest_framework.exceptions import PermissionDenied, ValidationError

        if instance.pk == self.request.user.pk:
            raise ValidationError({"detail": "You cannot delete your own account."})
        if instance.is_superuser and not self.request.user.is_superuser:
            raise PermissionDenied("Only a superuser can delete a superuser.")
        instance.delete()


class AdminUserCreateView(generics.CreateAPIView):
    """Create a user from the admin panel.

    Body: {email, first_name?, last_name?, phone_number?, user_type?, is_staff?,
    password?, send_reset_link?}. Without a password the account gets an
    unusable one and (by default) a reset link is emailed so the user sets their
    own. Billing profile / free plan provisioning happens in the post_save signal.
    """

    serializer_class = AdminUserSerializer
    permission_classes = [permissions.IsAdminUser]

    def create(self, request, *args, **kwargs):
        from django.contrib.auth.password_validation import validate_password
        from django.core.exceptions import ValidationError as DjangoValidationError

        email = (request.data.get("email") or "").strip().lower()
        if not email:
            return Response({"detail": "email is required."}, status=status.HTTP_400_BAD_REQUEST)
        if User.objects.filter(email__iexact=email).exists():
            return Response(
                {"detail": "A user with this email already exists."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        is_staff = bool(request.data.get("is_staff", False))
        user_type = request.data.get("user_type") or ("admin" if is_staff else "customer")
        if user_type not in dict(User.USER_TYPE_CHOICES):
            return Response({"detail": "Invalid user_type."}, status=status.HTTP_400_BAD_REQUEST)

        password = request.data.get("password") or None
        if password:
            try:
                validate_password(password)
            except DjangoValidationError as exc:
                return Response({"detail": " ".join(exc.messages)}, status=status.HTTP_400_BAD_REQUEST)

        user = User.objects.create_user(
            email=email,
            password=password,
            first_name=(request.data.get("first_name") or "").strip(),
            last_name=(request.data.get("last_name") or "").strip(),
            phone_number=(request.data.get("phone_number") or "").strip() or None,
            user_type=user_type,
            is_staff=is_staff,
        )
        if not password:
            user.set_unusable_password()
            user.save(update_fields=["password"])

        data = AdminUserSerializer(user).data
        send_link = request.data.get("send_reset_link", not password)
        if send_link:
            data["reset_link_sent"], data["reset_url"] = _send_password_reset(user)
        return Response(data, status=status.HTTP_201_CREATED)


def _password_reset_url(user):
    import os
    from django.contrib.auth.tokens import PasswordResetTokenGenerator
    from django.utils.encoding import force_bytes
    from django.utils.http import urlsafe_base64_encode

    uid = urlsafe_base64_encode(force_bytes(user.pk))
    token = PasswordResetTokenGenerator().make_token(user)
    base = (os.getenv("FRONTEND_URL") or "").rstrip("/")
    return f"{base}/reset-password/{uid}/{token}"


def _send_password_reset(user):
    """Email a reset link. Returns (sent, url) — the URL is handed back to the
    admin so support can share it by other means when email delivery fails."""
    from django.conf import settings
    from django.core.mail import send_mail

    url = _password_reset_url(user)
    try:
        send_mail(
            "Password Reset Request",
            f"Use this link to reset your password: {url}",
            getattr(settings, "DEFAULT_FROM_EMAIL", "noreply@example.com"),
            [user.email],
            fail_silently=False,
        )
        return True, url
    except Exception:
        logger.exception("Admin-triggered password reset email failed for %s", user.email)
        return False, url


@api_view(["POST"])
@permission_classes([permissions.IsAdminUser])
def admin_send_password_reset(request, user_id):
    """Email the user a password-reset link; also returns the link."""
    user = get_object_or_404(User, pk=user_id)
    sent, url = _send_password_reset(user)
    return Response(
        {
            "detail": "Password reset link sent." if sent
            else "Email delivery failed — share the link below with the user directly.",
            "email_sent": sent,
            "reset_url": url,
        }
    )


@api_view(["POST"])
@permission_classes([permissions.IsAdminUser])
def admin_set_password(request, user_id):
    """Set a user's password directly. Body: {password, revoke_sessions?}."""
    from django.contrib.auth.password_validation import validate_password
    from django.core.exceptions import ValidationError as DjangoValidationError

    user = get_object_or_404(User, pk=user_id)
    if user.is_superuser and not request.user.is_superuser:
        return Response(
            {"detail": "Only a superuser can change a superuser's password."},
            status=status.HTTP_403_FORBIDDEN,
        )
    password = request.data.get("password") or ""
    try:
        validate_password(password, user=user)
    except DjangoValidationError as exc:
        return Response({"detail": " ".join(exc.messages)}, status=status.HTTP_400_BAD_REQUEST)

    user.set_password(password)
    user.save(update_fields=["password"])
    revoked = 0
    if request.data.get("revoke_sessions", True):
        revoked = _revoke_refresh_tokens(user)
    return Response({"detail": "Password updated.", "sessions_revoked": revoked})


def _revoke_refresh_tokens(user):
    """Blacklist every outstanding refresh token so the user's sessions cannot
    be renewed. Access tokens already issued live until they expire."""
    from rest_framework_simplejwt.token_blacklist.models import BlacklistedToken, OutstandingToken

    revoked = 0
    for token in OutstandingToken.objects.filter(user=user, blacklistedtoken__isnull=True):
        BlacklistedToken.objects.get_or_create(token=token)
        revoked += 1
    return revoked


@api_view(["POST"])
@permission_classes([permissions.IsAdminUser])
def admin_revoke_sessions(request, user_id):
    """Sign the user out everywhere (refresh tokens + trusted 2FA devices)."""
    user = get_object_or_404(User, pk=user_id)
    revoked = _revoke_refresh_tokens(user)
    devices, _ = TrustedDevice.objects.filter(user=user).delete()
    return Response(
        {
            "detail": f"Revoked {revoked} session(s) and {devices} trusted device(s).",
            "sessions_revoked": revoked,
            "trusted_devices_revoked": devices,
        }
    )


@api_view(["GET"])
@permission_classes([permissions.IsAdminUser])
def admin_user_summary(request, user_id):
    """Everything an admin needs at a glance about one user's activity."""
    user = get_object_or_404(User, pk=user_id)
    now = timezone.now()
    validations = EmailValidation.objects.filter(user=user)
    outcome_counts = _outcome_counts(validations)

    last_validation = validations.order_by("-created_at").values_list("created_at", flat=True).first()
    keys = APIKey.objects.filter(user=user)
    purchases = CreditPackagePurchase.objects.filter(user=user)
    paid = purchases.filter(status="completed").aggregate(total=Sum("amount_paid"), n=Count("id"))

    try:
        totp_enabled = TOTPDevice.objects.get(user=user).is_enabled
    except TOTPDevice.DoesNotExist:
        totp_enabled = False

    return Response(
        {
            "validations": {
                "total": validations.count(),
                "last_30_days": validations.filter(created_at__gte=now - timedelta(days=30)).count(),
                "last_at": last_validation.isoformat() if last_validation else None,
                "by_outcome": outcome_counts,
                "bulk_jobs": BulkValidationJob.objects.filter(user=user).count(),
            },
            "api_keys": {
                "total": keys.count(),
                "active": keys.filter(is_active=True).count(),
                "requests": keys.aggregate(n=Sum("usage_count"))["n"] or 0,
            },
            "payments": {
                "completed": paid["n"] or 0,
                "total_paid": float(paid["total"] or 0),
                "pending": purchases.filter(status="pending").count(),
                "failed": purchases.filter(status="failed").count(),
            },
            "security": {
                "two_factor_enabled": totp_enabled,
                "has_usable_password": user.has_usable_password(),
                "trusted_devices": TrustedDevice.objects.filter(user=user).count(),
            },
        }
    )


@api_view(["GET"])
@permission_classes([permissions.IsAdminUser])
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
@permission_classes([permissions.IsAdminUser])
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


# ---------------------------------------------------------------------------
# Validation outcomes
#
# A row's `status` is the JOB state (pending/processing/completed/failed). The
# deliverability verdict lives in metadata.status (valid / invalid / catch_all /
# unknown / do_not_mail). The admin wants the verdict, so "outcome" below is the
# verdict for completed rows and the job state for everything else.
# ---------------------------------------------------------------------------

VERDICT_STATUSES = ("valid", "invalid", "catch_all", "unknown", "do_not_mail")
JOB_STATUSES = ("pending", "processing", "failed")

_LEGACY_VERDICT_MAP = {
    "valid": "valid",
    "invalid": "invalid",
    "catch-all": "catch_all",
    "catch_all": "catch_all",
    "do not mail": "do_not_mail",
    "unknown": "unknown",
    "risky": "unknown",
    "error": "unknown",
}


def _validation_outcome(v):
    if v.status != "completed":
        return v.status
    meta_status = (v.metadata or {}).get("status")
    if meta_status in VERDICT_STATUSES:
        return meta_status
    # Rows written before metadata.status existed carry the verdict here.
    verdict = (((v.breakdown or {}).get("risk_score") or {}).get("verdict") or "").lower()
    return _LEGACY_VERDICT_MAP.get(verdict, "unknown")


def _outcome_counts(qs):
    """{outcome: count} over a queryset, aggregated in the database."""
    counts = {key: 0 for key in VERDICT_STATUSES + JOB_STATUSES}
    for row in qs.exclude(status="completed").values("status").annotate(n=Count("id")):
        counts[row["status"]] = counts.get(row["status"], 0) + row["n"]
    for row in qs.filter(status="completed").values("metadata__status").annotate(n=Count("id")):
        key = row["metadata__status"] if row["metadata__status"] in VERDICT_STATUSES else "unknown"
        counts[key] += row["n"]
    return counts


def _serialize_admin_validation(v, user_map):
    meta = v.metadata or {}
    risk = (v.breakdown or {}).get("risk_score") or {}
    vt = meta.get("validation_time")
    user = user_map.get(v.user_id)
    outcome = _validation_outcome(v)
    return {
        "id": str(v.id),
        "email": v.email,
        "status": outcome,
        "job_status": v.status,
        "sub_status": meta.get("sub_status"),
        "score": v.score,
        "verdict": risk.get("verdict") or outcome.replace("_", " ").title(),
        "is_valid": outcome == "valid",
        "job_type": v.job_type,
        "bulk_job_id": str(v.bulk_job_id) if v.bulk_job_id else None,
        "processing_ms": round(vt * 1000) if isinstance(vt, (int, float)) else None,
        "created_at": v.created_at.isoformat(),
        "user": user,
        "breakdown": v.breakdown or {},
        "suggestions": v.suggestions or [],
        "warnings": v.warnings or [],
        "metadata": meta,
    }


def _filter_validations(request, qs):
    params = request.query_params
    user_id = params.get("user_id")
    if user_id:
        qs = qs.filter(user_id=user_id)

    outcome = (params.get("status") or "").strip()
    if outcome in JOB_STATUSES:
        qs = qs.filter(status=outcome)
    elif outcome in VERDICT_STATUSES:
        qs = qs.filter(status="completed", metadata__status=outcome)

    job_type = (params.get("job_type") or "").strip()
    if job_type:
        qs = qs.filter(job_type=job_type)

    search = (params.get("search") or "").strip()
    if search:
        qs = qs.filter(Q(email__icontains=search) | Q(user__email__icontains=search))

    days = params.get("days")
    if days and str(days).isdigit():
        qs = qs.filter(created_at__gte=timezone.now() - timedelta(days=int(days)))
    return qs


def _bounded_int(value, default, lo, hi):
    try:
        return max(lo, min(hi, int(value)))
    except (TypeError, ValueError):
        return default


@api_view(["GET"])
@permission_classes([permissions.IsAdminUser])
def admin_validations_stats(request):
    """Validation statistics for the admin. Honours the same filters as the list
    (user_id, status, job_type, search, days)."""
    from django.db.models import Avg
    from django.db.models.functions import Lower, StrIndex, Substr, TruncDate

    qs = _filter_validations(request, EmailValidation.objects.all())
    counts = _outcome_counts(qs)
    total = sum(counts.values())
    completed = sum(counts[k] for k in VERDICT_STATUSES)

    avg_score = qs.filter(status="completed").aggregate(a=Avg("score"))["a"]

    # Processing time lives in JSON; average a recent sample in Python rather
    # than casting JSON in SQL (which errors on any malformed legacy value).
    times = [
        m.get("validation_time")
        for m in qs.filter(status="completed").order_by("-created_at").values_list("metadata", flat=True)[:2000]
        if isinstance(m, dict)
    ]
    times = [t for t in times if isinstance(t, (int, float))]
    avg_ms = round(sum(times) / len(times) * 1000) if times else None

    domain_expr = Lower(Substr("email", StrIndex("email", Value("@")) + 1))
    top_domains = []
    for row in (
        qs.annotate(domain=domain_expr)
        .values("domain")
        .annotate(
            count=Count("id"),
            valid=Count("id", filter=Q(status="completed", metadata__status="valid")),
        )
        .order_by("-count")[:10]
    ):
        top_domains.append(
            {
                "domain": row["domain"],
                "count": row["count"],
                "valid_rate": round(row["valid"] / row["count"] * 100, 1) if row["count"] else 0,
            }
        )

    since = timezone.now() - timedelta(days=30)
    daily = [
        {
            "date": row["day"].isoformat() if row["day"] else None,
            "validations": row["n"],
            "valid_count": row["valid"],
            "invalid_count": row["invalid"],
        }
        for row in (
            qs.filter(created_at__gte=since)
            .annotate(day=TruncDate("created_at"))
            .values("day")
            .annotate(
                n=Count("id"),
                valid=Count("id", filter=Q(status="completed", metadata__status="valid")),
                invalid=Count("id", filter=Q(status="completed", metadata__status="invalid")),
            )
            .order_by("day")
        )
    ]

    return Response(
        {
            "total_validations": total,
            "completed": completed,
            "valid_emails": counts["valid"],
            "invalid_emails": counts["invalid"],
            "catch_all_emails": counts["catch_all"],
            "unknown_emails": counts["unknown"],
            "do_not_mail_emails": counts["do_not_mail"],
            # "risky" = deliverable-but-unconfirmed buckets, kept for older UIs.
            "risky_emails": counts["catch_all"] + counts["unknown"] + counts["do_not_mail"],
            "pending": counts["pending"] + counts["processing"],
            "failed": counts["failed"],
            "by_outcome": counts,
            "success_rate": round(counts["valid"] / completed * 100, 1) if completed else 0,
            "average_score": round(avg_score, 1) if avg_score is not None else 0,
            "processing_time_avg_ms": avg_ms,
            "top_domains": top_domains,
            "daily_stats": daily,
            "users_validating": qs.exclude(user__isnull=True).values("user_id").distinct().count(),
            "bulk_jobs": BulkValidationJob.objects.count(),
            # Unchanged shape — the dashboard and analytics pages read this.
            "recent_validations": EmailValidationSerializer(qs.order_by("-created_at")[:10], many=True).data,
        }
    )


class AdminBillingListView(generics.ListAPIView):
    """Credit transactions for admin. ?user_id= narrows to one user; ?limit=
    caps the result (default 500) since the table grows with every validation."""

    serializer_class = CreditTransactionSerializer
    permission_classes = [permissions.IsAdminUser]

    def get_queryset(self):
        qs = CreditTransaction.objects.select_related("billing_profile").order_by("-created_at")
        user_id = self.request.query_params.get("user_id")
        if user_id:
            qs = qs.filter(billing_profile__user_id=user_id)
        tx_type = self.request.query_params.get("type")
        if tx_type:
            qs = qs.filter(transaction_type=tx_type)
        limit = _bounded_int(self.request.query_params.get("limit"), 500, 1, 5000)
        return qs[:limit]


class AdminPlansListView(generics.ListCreateAPIView):
    """List and create plans for admin"""

    serializer_class = PlanSerializer
    permission_classes = [permissions.IsAdminUser]

    def get_queryset(self):
        return Plan.objects.all().order_by("-created_at")


class AdminPlanDetailView(generics.RetrieveUpdateDestroyAPIView):
    """Get, update, or delete a specific plan"""

    serializer_class = PlanSerializer
    permission_classes = [permissions.IsAdminUser]

    def get_queryset(self):
        return Plan.objects.all()


@api_view(["GET"])
@permission_classes([permissions.IsAdminUser])
def admin_plans_stats(request):
    """Get plans statistics for admin"""
    total_plans = Plan.objects.count()
    active_plans = Plan.objects.filter(is_active=True).count()

    return Response({"total_plans": total_plans, "active_plans": active_plans})


class AdminValidationsListView(generics.ListAPIView):
    """Validation records for admin, newest first.

    Filters: user_id, status (an outcome: valid/invalid/catch_all/unknown/
    do_not_mail/pending/processing/failed), job_type, search, days.
    Paging: limit (default 500, max 5000) and offset. Returns
    {results, count, limit, offset} — count is the total matching the filters.
    """

    permission_classes = [permissions.IsAdminUser]

    def get_queryset(self):
        return _filter_validations(self.request, EmailValidation.objects.all()).order_by("-created_at")

    def list(self, request, *args, **kwargs):
        qs = self.get_queryset()
        limit = _bounded_int(request.query_params.get("limit"), 500, 1, 5000)
        offset = _bounded_int(request.query_params.get("offset"), 0, 0, 10**9)
        rows = list(qs[offset:offset + limit])

        user_ids = {v.user_id for v in rows if v.user_id}
        user_map = {
            u.id: {
                "id": str(u.id),
                "email": u.email,
                "name": f"{u.first_name} {u.last_name}".strip() or None,
            }
            for u in User.objects.filter(id__in=user_ids)
        }
        return Response(
            {
                "results": [_serialize_admin_validation(v, user_map) for v in rows],
                "count": qs.count(),
                "limit": limit,
                "offset": offset,
            }
        )


class AdminAPIKeySerializer(APIKeySerializer):
    """APIKeySerializer without the plaintext secret. Keys are stored in clear,
    so listing them returned every user's live credential to the browser; the
    admin sees prefix/masked_key, and the full key only in the create response."""

    class Meta(APIKeySerializer.Meta):
        fields = [f for f in APIKeySerializer.Meta.fields if f != "key"]


class AdminAPIKeyListView(generics.ListCreateAPIView):
    """List a user's API keys (?user_id=) and provision new ones, as an admin.

    Admin-only: with plain IsAuthenticated this exposed — and let anyone revoke —
    EVERY user's keys. Filtered by user_id so the user-detail tab shows just that
    user's keys; omit user_id for the global keys view.
    """

    permission_classes = [permissions.IsAdminUser]

    def get_serializer_class(self):
        if self.request.method == "POST":
            return APIKeyCreateSerializer
        return AdminAPIKeySerializer

    def get_queryset(self):
        qs = APIKey.objects.select_related("user").order_by("-created_at")
        user_id = self.request.query_params.get("user_id")
        if user_id:
            qs = qs.filter(user_id=user_id)
        return qs

    def create(self, request, *args, **kwargs):
        """Provision a key for the given user and return the plaintext key ONCE.

        generate_for_user rotates the user's active key (deactivating the old
        one). The full secret is returned only here — the list endpoint shows a
        prefix, never the whole key — so the admin can hand it over immediately.
        """
        from rest_framework.exceptions import ValidationError

        in_ser = APIKeyCreateSerializer(data=request.data)
        in_ser.is_valid(raise_exception=True)

        try:
            user = User.objects.get(id=in_ser.validated_data["user_id"])
        except User.DoesNotExist:
            raise ValidationError({"user_id": "User not found."})

        api_key = APIKey.generate_for_user(
            user=user,
            name=in_ser.validated_data.get("name"),
            description=in_ser.validated_data.get("description"),
            expires_at=in_ser.validated_data.get("expires_at"),
            rate_limit_per_hour=in_ser.validated_data.get("rate_limit_per_hour", 1000),
            ip_address=self.get_client_ip(),
            user_agent=request.META.get("HTTP_USER_AGENT", ""),
        )
        # APIKeySerializer includes the full `key`; this response is the only
        # place it is ever returned.
        return Response(APIKeySerializer(api_key).data, status=status.HTTP_201_CREATED)

    def get_client_ip(self):
        """Get client IP address from request"""
        x_forwarded_for = self.request.META.get("HTTP_X_FORWARDED_FOR")
        if x_forwarded_for:
            return x_forwarded_for.split(",")[0]
        return self.request.META.get("REMOTE_ADDR")


class AdminAPIKeyDetailView(generics.RetrieveUpdateDestroyAPIView):
    """Retrieve, update, or revoke (soft-delete) any user's API key, as an admin."""

    serializer_class = AdminAPIKeySerializer
    permission_classes = [permissions.IsAdminUser]
    lookup_field = "pk"

    def get_serializer_class(self):
        if self.request.method in ["PUT", "PATCH"]:
            return APIKeyUpdateSerializer
        return AdminAPIKeySerializer

    def get_queryset(self):
        return APIKey.objects.select_related("user")

    def perform_update(self, serializer):
        serializer.save()

    def perform_destroy(self, instance):
        # Soft delete by deactivating so historical usage rows keep their FK.
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
        totp.disable_2fa()
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


def _serialize_purchase_payment(p):
    """The same normalized payment row admin_payments_list emits, for one
    CreditPackagePurchase (so the admin UI can drop in the synced record)."""
    return {
        "id": str(p.id),
        "user": {
            "id": str(p.user.id),
            "email": p.user.email,
            "name": f"{p.user.first_name} {p.user.last_name}".strip() or None,
        },
        "amount": float(p.amount_paid),
        "currency": p.currency,
        "status": p.status,
        "payment_method": (p.metadata or {}).get("payment_method", "paystack"),
        "transaction_id": p.paystack_reference or "",
        "paystack_transaction_id": p.paystack_transaction_id,
        "created_at": p.created_at.isoformat(),
        "updated_at": p.updated_at.isoformat(),
        "description": (
            f"Credit package: {p.package.name}" if p.package else "Credit package purchase"
        ),
        "plan": None,
        "type": "credit_package",
    }


@api_view(["POST"])
@permission_classes([permissions.IsAdminUser])
def admin_sync_payment(request, payment_id):
    """Re-fetch a payment's status from Paystack and reconcile the local record.

    Manual reconciliation for when a Paystack webhook was missed or delayed: the
    admin clicks "Sync" on a payment and we call Paystack's verify endpoint live,
    then complete/fail the purchase to match. Idempotent — re-syncing a completed
    payment grants no further credits.

    Only credit-package purchases carry a local record that can be reconciled;
    `payment_id` is a CreditPackagePurchase id.
    """
    from apps.billing.services import BillingService

    try:
        purchase = CreditPackagePurchase.objects.select_related(
            "user", "package", "billing_profile"
        ).get(pk=payment_id)
    except CreditPackagePurchase.DoesNotExist:
        return Response(
            {"detail": "Payment not found"}, status=status.HTTP_404_NOT_FOUND
        )

    if not purchase.paystack_reference:
        return Response(
            {"detail": "Payment has no Paystack reference to sync."},
            status=status.HTTP_400_BAD_REQUEST,
        )

    try:
        sync = BillingService().sync_purchase_status(purchase)
    except Exception as exc:
        # A Paystack API/transport error is not a server bug — report it as a
        # bad gateway with the reason so the admin knows the sync didn't run.
        logger.exception(
            "Admin payment sync failed for purchase %s (ref=%s)",
            payment_id,
            purchase.paystack_reference,
        )
        return Response(
            {"detail": f"Could not verify with Paystack: {exc}"},
            status=status.HTTP_502_BAD_GATEWAY,
        )

    purchase.refresh_from_db()
    return Response(
        {
            "success": True,
            "changed": sync["changed"],
            "gateway_status": sync["gateway_status"],
            "previous_status": sync["previous_status"],
            "current_status": sync["current_status"],
            "payment": _serialize_purchase_payment(purchase),
        }
    )
