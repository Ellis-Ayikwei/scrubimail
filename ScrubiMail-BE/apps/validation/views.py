import time

from rest_framework import generics, status, permissions
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.decorators import action
from django.shortcuts import get_object_or_404
from django.urls import reverse
from django.utils import timezone
from django.db.models import Q, Avg, Count
from .models import (
    EmailValidation,
    BulkValidationJob,
    ValidationStats,
    DomainReputation,
)
from .serializers import (
    EmailValidationSerializer,
    BulkEmailValidationSerializer,
    BulkJobSerializer,
)
from .tasks import validate_email_task, bulk_validate_emails_task
from .services import verify_email_realtime, record_validation
from .advanced_validator import AdvancedEmailValidator
from django_celery_results.models import TaskResult
from rest_framework.permissions import IsAuthenticated
import json
from backend.middle_ware import AllowJWTOrAPIKey
from rest_framework.permissions import IsAuthenticatedOrReadOnly
from rest_framework.permissions import BasePermission
from apps.billing.services import BillingService
from apps.billing.models import CreditTransaction, EmailValidationUsage
from backend.throttling import PlanBasedRateThrottle, BulkValidationThrottle, PlanFeatureThrottle
from backend.api_exceptions import InsufficientCredits, BulkLimitExceeded


class SingleEmailValidationView(APIView):
    permission_classes = [AllowJWTOrAPIKey]
    throttle_classes = [PlanBasedRateThrottle, PlanFeatureThrottle]

    def post(self, request):
        """Single email validation.

        DEEP by default: the SMTP probe runs on the egress worker (the only
        host with port-25 egress) and this request waits for the verdict within
        a hard time budget (VALIDATION_REALTIME_BUDGET_SECONDS), so it can
        return status=valid. If the worker can't answer in time the response is
        an honest `unknown` (sub_status=smtp_unavailable) and the finished
        probe warms the result cache for the next lookup. Pass ?mode=fast (or
        ?deep=false) for the sub-100ms syntax/DNS/list-only path that never
        touches SMTP. A shared result cache returns repeat lookups instantly
        with "cached": true.
        """
        request_started = time.monotonic()

        serializer = EmailValidationSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        email = serializer.validated_data["email"]
        user = request.user

        # Fast mode is opt-in: ?mode=fast or ?deep=false (back-compat). Deep is
        # the default so the endpoint can produce the product's core answer.
        mode = request.query_params.get("mode", "").lower()
        deep_q = request.query_params.get("deep", "").lower()
        fast = mode == "fast" or deep_q in ("false", "0", "no")

        # Check if user has enough credits. Reuses the profile the throttles
        # already loaded for this request (see get_billing_profile_for_request)
        # instead of issuing another identical SELECT.
        billing_service = BillingService()
        profile = billing_service.get_or_create_billing_profile(user, request=request)

        if not profile.can_use_credits(1):
            raise InsufficientCredits(
                "Insufficient credits. Please purchase more credits."
            )

        verify_started = time.monotonic()
        result, from_cache = verify_email_realtime(email, fast=fast)
        verify_ms = round((time.monotonic() - verify_started) * 1000)

        persist_started = time.monotonic()

        # Money stays ON the request path: the decrement is a single atomic
        # UPDATE and its result is CHECKED here. can_use_credits() above is only
        # an early-out — this is what actually reserves the credit, so two
        # concurrent validations on a 1-credit account can't both succeed.
        if not profile.consume_credits(1, "single"):
            raise InsufficientCredits(
                "Insufficient credits. Please purchase more credits."
            )
        # consume_ms = the credit decrement (DB write). enqueue_ms = handing the
        # record write to the broker. They are timed separately because they fail
        # slow for DIFFERENT reasons — consume under row-lock contention (same
        # account), enqueue when the broker is remote/flaky — and persist_ms alone
        # can't tell them apart.
        consume_ms = round((time.monotonic() - persist_started) * 1000)

        # Records go OFF the request path (~1ms to enqueue instead of ~4 blocking
        # writes). The client already has the verdict in this response, so
        # nothing user-facing waits on the row; a worker writes it a few hundred
        # ms later and history/analytics read rows that are milliseconds old. The
        # id is generated up front so the response can carry it immediately.
        # If the broker is down the write falls back to inline — a spent credit
        # must never end up without a record.
        record_started = time.monotonic()
        validation_id, breakdown = record_validation(
            email=email,
            result=result,
            user_id=user.id,
            billing_profile_id=profile.id,
            job_type="api",
            validation_type="single",
        )
        enqueue_ms = round((time.monotonic() - record_started) * 1000)
        persist_ms = consume_ms + enqueue_ms

        details = request.query_params.get("details", "false").lower() == "true"
        response_data = {
            "id": validation_id,
            "email": email,
            "status": "completed",
            "score": result.score,
            "verdict": result.verdict,
            "is_valid": result.is_valid,
            "verification_status": result.metadata.get("status"),
            "sub_status": result.metadata.get("sub_status"),
            "mode": "fast" if fast else "deep",
            "cached": from_cache,
            "verified_at": result.metadata.get("verified_at"),
            "suggestions": result.suggestions,
            "warnings": result.warnings,
            # validation_time = how long the SMTP verification itself took (on
            # the egress worker; replayed from cache on cache hits).
            # request_time = wall-clock this HTTP request spent server-side —
            # the number to look at when diagnosing perceived latency.
            "validation_time": result.metadata.get("validation_time", 0),
            "request_time": round(time.monotonic() - request_started, 3),
            # Where request_time went: verify_ms = the verification itself
            # (cache lookup / local pre-flight / egress wait); persist_ms = the
            # credit decrement plus enqueueing the record write (the row itself
            # is written off-path). A large gap between their sum and
            # request_time (or between request_time and what the client
            # measures) points at billing pre-checks, auth/throttling, or the
            # network — not the validation pipeline.
            # persist_ms = consume_ms + enqueue_ms, split out so a slow persist
            # can be attributed to the credit-decrement DB write vs the broker
            # publish without guessing.
            "timing": {
                "verify_ms": verify_ms,
                "persist_ms": persist_ms,
                "consume_ms": consume_ms,
                "enqueue_ms": enqueue_ms,
            },
        }
        if details:
            response_data["breakdown"] = breakdown
            response_data["metadata"] = result.metadata

        return Response(response_data, status=status.HTTP_200_OK)


class BulkEmailValidationView(APIView):
    permission_classes = [AllowJWTOrAPIKey]
    throttle_classes = [BulkValidationThrottle, PlanFeatureThrottle]

    def post(self, request):
        """Bulk email validation with job tracking"""
        # Check if bulk limit was exceeded by throttle
        if hasattr(request, 'bulk_limit_exceeded') and request.bulk_limit_exceeded:
            raise BulkLimitExceeded(
                detail=(
                    f"Bulk validation limit exceeded. Your plan allows "
                    f"{request.bulk_limit} emails per request, but you requested "
                    f"{request.bulk_requested}. Please upgrade your plan or reduce "
                    f"the number of emails."
                ),
                limit=request.bulk_limit,
                requested=request.bulk_requested,
                upgrade_url="/plans/",
            )

        serializer = BulkEmailValidationSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        emails = serializer.validated_data["emails"]
        user = request.user

        # Check if user has enough credits. This is an upfront guard only — the
        # task consumes credits per processed address (never here), so the job
        # can't over-charge and a worker restart can't double-charge.
        billing_service = BillingService()
        profile = billing_service.get_or_create_billing_profile(user)

        required_credits = len(emails)
        # (profile reused from the throttles' request-scoped fetch)
        if not profile.can_use_credits(required_credits):
            raise InsufficientCredits(
                f"Insufficient credits. You need {required_credits} credits but "
                f"only have {profile.credits_remaining}."
            )

        # Create the job row and hand ALL processing to Celery. The request must
        # never do the work inline — a large job would tie up a gunicorn worker
        # for minutes and die on gateway timeout or deploy. Return 202 + job id
        # immediately; the client polls BulkJobStatusView for progress.
        bulk_job = BulkValidationJob.objects.create(
            user=user, emails=emails, total_emails=len(emails), status="pending"
        )
        bulk_validate_emails_task.delay(bulk_job.id)

        status_path = reverse("bulk-job-status", args=[bulk_job.id])
        return Response(
            {
                "job_id": bulk_job.id,
                "total_emails": len(emails),
                "status": "pending",
                "message": "Bulk validation job accepted and queued for processing.",
                "status_url": request.build_absolute_uri(status_path),
            },
            status=status.HTTP_202_ACCEPTED,
        )


class BulkJobStatusView(APIView):
    permission_classes = [AllowJWTOrAPIKey]

    def get(self, request, job_id):
        """Get bulk job status and progress"""
        job = get_object_or_404(BulkValidationJob, id=job_id, user=request.user)

        # Results are linked to the job via the bulk_job FK — exact, not a fuzzy
        # "bulk rows created after this job started" heuristic.
        validations = EmailValidation.objects.filter(bulk_job=job).order_by(
            "-created_at"
        )

        # Calculate summary
        total_validations = validations.count()
        completed_validations = validations.filter(status="completed").count()
        valid_emails = validations.filter(status="completed", score__gte=80).count()
        invalid_emails = validations.filter(status="completed", score__lt=50).count()
        risky_emails = validations.filter(
            status="completed", score__range=[50, 79]
        ).count()

        avg_score = (
            validations.filter(status="completed").aggregate(avg_score=Avg("score"))[
                "avg_score"
            ]
            or 0
        )

        return Response(
            {
                "job_id": job.id,
                "status": job.status,
                "progress": job.progress,
                "total_emails": job.total_emails,
                "total_processed": job.total_processed,
                "summary": {
                    "total_validations": total_validations,
                    "completed_validations": completed_validations,
                    "valid_emails": valid_emails,
                    "invalid_emails": invalid_emails,
                    "risky_emails": risky_emails,
                    "avg_score": round(avg_score, 2),
                },
                "created_at": job.created_at,
                "updated_at": job.updated_at,
            }
        )


class ValidationStatusView(APIView):
    permission_classes = [AllowJWTOrAPIKey]

    def get(self, request, validation_id):
        """Get individual validation status and results"""
        validation = get_object_or_404(
            EmailValidation, id=validation_id, user=request.user
        )
        details = request.query_params.get("details", "false").lower() == "true"
        response_data = {
            "id": validation.id,
            "email": validation.email,
            "status": validation.status,
            "score": validation.score,
            "verdict": validation.breakdown.get("risk_score", {}).get("verdict"),
            "is_valid": validation.breakdown.get("risk_score", {}).get("is_valid"),
            "suggestions": validation.suggestions,
            "warnings": validation.warnings,
            "validation_time": validation.metadata.get("validation_time", 0),
            "created_at": validation.created_at,
            "updated_at": validation.updated_at,
        }
        if details:
            response_data["breakdown"] = validation.breakdown
            response_data["metadata"] = validation.metadata
        return Response(response_data)

    def delete(self, request, validation_id):
        """Delete a single validation from the user's history.

        Scoped to request.user, so a user can only delete their own. The billing
        usage/credit records (EmailValidationUsage) are intentionally left
        untouched — clearing history must not erase the financial audit trail.
        """
        validation = get_object_or_404(
            EmailValidation, id=validation_id, user=request.user
        )
        validation.delete()
        return Response(status=status.HTTP_204_NO_CONTENT)


class ValidationHistoryView(generics.ListAPIView):
    serializer_class = EmailValidationSerializer
    permission_classes = [AllowJWTOrAPIKey]

    def get_queryset(self):
        queryset = EmailValidation.objects.filter(user=self.request.user)

        # Filter by status
        status_filter = self.request.query_params.get("status")
        if status_filter:
            queryset = queryset.filter(status=status_filter)

        # Filter by date range
        date_from = self.request.query_params.get("date_from")
        date_to = self.request.query_params.get("date_to")

        if date_from:
            queryset = queryset.filter(created_at__date__gte=date_from)
        if date_to:
            queryset = queryset.filter(created_at__date__lte=date_to)

        # Filter by score range
        min_score = self.request.query_params.get("min_score")
        max_score = self.request.query_params.get("max_score")

        if min_score:
            queryset = queryset.filter(score__gte=min_score)
        if max_score:
            queryset = queryset.filter(score__lte=max_score)

        return queryset.order_by("-created_at")

    def delete(self, request, *args, **kwargs):
        """Clear the user's validation history.

        Deletes the SAME set the list endpoint would return, so it honours any
        active filters (status / date / score) — "clear all" with no filters
        deletes everything for the user. Billing usage records are left intact
        (they are a separate model, not FK-linked), so the financial audit trail
        survives a history clear.
        """
        deleted, _ = self.get_queryset().delete()
        return Response({"deleted": deleted}, status=status.HTTP_200_OK)

    def get(self, request, *args, **kwargs):
        """Enhanced history view with summary statistics"""
        queryset = self.get_queryset()
        details = request.query_params.get("details", "false").lower() == "true"

        # Get summary statistics
        total_validations = queryset.count()
        completed_validations = queryset.filter(status="completed").count()
        valid_emails = queryset.filter(status="completed", score__gte=80).count()
        invalid_emails = queryset.filter(status="completed", score__lt=50).count()
        risky_emails = queryset.filter(
            status="completed", score__range=[50, 79]
        ).count()

        avg_score = (
            queryset.filter(status="completed").aggregate(avg_score=Avg("score"))[
                "avg_score"
            ]
            or 0
        )

        # Paginate results
        page = self.paginate_queryset(queryset)

        def format_result(v):
            item = {
                "id": v.id,
                "email": v.email,
                "status": v.status,
                "score": v.score,
                "verdict": v.breakdown.get("risk_score", {}).get("verdict"),
                "is_valid": v.breakdown.get("risk_score", {}).get("is_valid"),
                "suggestions": v.suggestions,
                "warnings": v.warnings,
                "validation_time": v.metadata.get("validation_time", 0),
                "created_at": v.created_at,
                "updated_at": v.updated_at,
            }
            if details:
                item["breakdown"] = v.breakdown
                item["metadata"] = v.metadata
            return item

        if page is not None:
            serializer = self.get_serializer(page, many=True)
            results = [format_result(v) for v in page]
            return self.get_paginated_response(
                {
                    "results": results,
                    "summary": {
                        "total_validations": total_validations,
                        "completed_validations": completed_validations,
                        "valid_emails": valid_emails,
                        "invalid_emails": invalid_emails,
                        "risky_emails": risky_emails,
                        "avg_score": round(avg_score, 2),
                    },
                }
            )

        results = [format_result(v) for v in queryset]
        return Response(
            {
                "results": results,
                "summary": {
                    "total_validations": total_validations,
                    "completed_validations": completed_validations,
                    "valid_emails": valid_emails,
                    "invalid_emails": invalid_emails,
                    "risky_emails": risky_emails,
                    "avg_score": round(avg_score, 2),
                },
            }
        )


class ValidationAnalyticsView(APIView):
    permission_classes = [AllowJWTOrAPIKey]

    def get(self, request):
        """Get validation analytics and statistics"""
        # Get date range from query params
        days = int(request.query_params.get("days", 30))
        end_date = timezone.now().date()
        start_date = end_date - timezone.timedelta(days=days)

        # Get validations in date range
        validations = EmailValidation.objects.filter(
            user=request.user, created_at__date__range=[start_date, end_date]
        )

        # Daily statistics
        daily_stats = []
        current_date = start_date
        while current_date <= end_date:
            day_validations = validations.filter(created_at__date=current_date)
            daily_stats.append(
                {
                    "date": current_date.isoformat(),
                    "total": day_validations.count(),
                    "valid": day_validations.filter(
                        status="completed", score__gte=80
                    ).count(),
                    "invalid": day_validations.filter(
                        status="completed", score__lt=50
                    ).count(),
                    "risky": day_validations.filter(
                        status="completed", score__range=[50, 79]
                    ).count(),
                    "avg_score": day_validations.filter(status="completed").aggregate(
                        avg_score=Avg("score")
                    )["avg_score"]
                    or 0,
                }
            )
            current_date += timezone.timedelta(days=1)

        # Top domains - extract domain from email using Python processing
        # Get all completed validations and process domains in Python
        completed_validations = validations.filter(status="completed").values(
            "email", "score"
        )

        # Group by domain and calculate stats
        domain_stats = {}
        for validation in completed_validations:
            email = validation["email"]
            score = validation["score"]

            if "@" in email:
                domain = email.split("@")[1]
                if domain not in domain_stats:
                    domain_stats[domain] = {"count": 0, "total_score": 0, "scores": []}
                domain_stats[domain]["count"] += 1
                domain_stats[domain]["total_score"] += score
                domain_stats[domain]["scores"].append(score)

        # Convert to list and sort by count
        top_domains = []
        for domain, stats in domain_stats.items():
            avg_score = (
                stats["total_score"] / stats["count"] if stats["count"] > 0 else 0
            )
            top_domains.append(
                {
                    "domain": domain,
                    "count": stats["count"],
                    "avg_score": round(avg_score, 2),
                }
            )

        # Sort by count and take top 10
        top_domains = sorted(top_domains, key=lambda x: x["count"], reverse=True)[:10]

        # Validation success rate
        total_completed = validations.filter(status="completed").count()
        success_rate = (
            (total_completed / validations.count() * 100)
            if validations.count() > 0
            else 0
        )

        return Response(
            {
                "period": {
                    "start_date": start_date.isoformat(),
                    "end_date": end_date.isoformat(),
                    "days": days,
                },
                "overview": {
                    "total_validations": validations.count(),
                    "completed_validations": total_completed,
                    "success_rate": round(success_rate, 2),
                    "avg_score": validations.filter(status="completed").aggregate(
                        avg_score=Avg("score")
                    )["avg_score"]
                    or 0,
                },
                "daily_stats": daily_stats,
                "top_domains": top_domains,
            }
        )


class DomainReputationView(APIView):
    permission_classes = [AllowJWTOrAPIKey]

    def get(self, request, domain):
        """Get domain reputation information"""
        try:
            # Check if we have cached reputation data
            reputation = DomainReputation.objects.get(domain=domain)

            # Check if data is fresh (less than 24 hours old)
            if timezone.now() - reputation.last_checked < timezone.timedelta(hours=24):
                return Response(
                    {
                        "domain": domain,
                        "reputation_score": reputation.reputation_score,
                        "is_disposable": reputation.is_disposable,
                        "is_corporate": reputation.is_corporate,
                        "tld_risk": reputation.tld_risk,
                        "spam_trap_risk": reputation.spam_trap_risk,
                        "last_checked": reputation.last_checked,
                        "cached": True,
                    }
                )
        except DomainReputation.DoesNotExist:
            pass

        # Perform fresh reputation check
        validator = AdvancedEmailValidator()
        reputation_result = validator.check_domain_reputation(domain)

        # Cache the result
        DomainReputation.objects.update_or_create(
            domain=domain,
            defaults={
                "reputation_score": reputation_result.get("reputation_score", 50),
                "is_disposable": reputation_result.get("is_disposable", False),
                "is_corporate": reputation_result.get("is_corporate", False),
                "tld_risk": reputation_result.get("tld_risk", False),
                "spam_trap_risk": reputation_result.get("spam_trap_risk", 0.0),
                "last_checked": timezone.now(),
            },
        )

        return Response({"domain": domain, **reputation_result, "cached": False})
