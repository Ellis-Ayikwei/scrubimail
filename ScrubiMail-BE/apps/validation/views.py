from rest_framework import generics, status, permissions
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.decorators import action
from django.shortcuts import get_object_or_404
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
from .advanced_validator import AdvancedEmailValidator
from django_celery_results.models import TaskResult
from rest_framework.permissions import IsAuthenticated
import json
from backend.middle_ware import APIKeyOnlyPermission


class SingleEmailValidationView(APIView):
    permission_classes = [APIKeyOnlyPermission]

    def post(self, request):
        """Single email validation with real-time option"""
        serializer = EmailValidationSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        email = serializer.validated_data["email"]
        real_time = serializer.validated_data.get("real_time", False)
        user = request.user if request.user.is_authenticated else None

        if real_time:
            # Perform real-time validation
            validator = AdvancedEmailValidator()
            result = validator.validate_email(email)

            # Create validation record
            validation = EmailValidation.objects.create(
                email=email,
                user=user,
                status="completed",
                score=result.score,
                breakdown={
                    "syntax": result.breakdown.get("syntax", {}),
                    "dns": result.breakdown.get("dns", {}),
                    "smtp": result.breakdown.get("smtp", {}),
                    "reputation": result.breakdown.get("reputation", {}),
                    "role_based": result.breakdown.get("role_based", {}),
                    "risk_score": {
                        "score": result.score,
                        "verdict": result.verdict,
                        "is_valid": result.is_valid,
                    },
                },
                suggestions=result.suggestions,
                warnings=result.warnings,
                metadata=result.metadata,
                job_type="api",
            )

            # Check for ?details=true in query params
            details = request.query_params.get("details", "false").lower() == "true"

            response_data = {
                "id": validation.id,
                "email": email,
                "status": "completed",
                "score": result.score,
                "verdict": result.verdict,
                "is_valid": result.is_valid,
                "suggestions": result.suggestions,
                "warnings": result.warnings,
                "validation_time": result.metadata.get("validation_time", 0),
            }
            if details:
                response_data["breakdown"] = validation.breakdown
                response_data["metadata"] = result.metadata

            return Response(response_data, status=status.HTTP_200_OK)
        else:
            # Create validation record
            validation = EmailValidation.objects.create(
                email=email, user=user, status="pending", job_type="single"
            )

            try:
                # Run validation synchronously (temporary fix for Celery connection issues)
                from .tasks import validate_email_task

                result = validate_email_task.apply(args=[validation.id])

                # Refresh the validation object
                validation.refresh_from_db()

                details = request.query_params.get("details", "false").lower() == "true"
                response_data = {
                    "id": validation.id,
                    "email": validation.email,
                    "status": validation.status,
                    "score": validation.score,
                    "verdict": validation.breakdown.get("risk_score", {}).get(
                        "verdict"
                    ),
                    "is_valid": validation.breakdown.get("risk_score", {}).get(
                        "is_valid"
                    ),
                    "suggestions": validation.suggestions,
                    "warnings": validation.warnings,
                    "validation_time": validation.metadata.get("validation_time", 0),
                }
                if details:
                    response_data["breakdown"] = validation.breakdown
                    response_data["metadata"] = validation.metadata

                return Response(response_data, status=status.HTTP_200_OK)
            except Exception as e:
                # If validation fails, return the pending status
                validation.status = "failed"
                validation.save()
                return Response(
                    {
                        "id": validation.id,
                        "email": validation.email,
                        "status": validation.status,
                    },
                    status=status.HTTP_202_ACCEPTED,
                )


class BulkEmailValidationView(APIView):
    permission_classes = [APIKeyOnlyPermission]

    def post(self, request):
        """Bulk email validation with job tracking"""
        serializer = BulkEmailValidationSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        emails = serializer.validated_data["emails"]

        # Create bulk job
        bulk_job = BulkValidationJob.objects.create(
            user=request.user, emails=emails, total_emails=len(emails), status="pending"
        )

        # Process bulk validation synchronously (temporary fix for Celery connection issues)
        try:
            from .tasks import bulk_validate_emails_task

            result = bulk_validate_emails_task.apply(args=[bulk_job.id])

            details = request.query_params.get("details", "false").lower() == "true"
            # Get all validations for this job
            validations = EmailValidation.objects.filter(
                user=request.user, job_type="bulk", created_at__gte=bulk_job.created_at
            )
            results = []
            for v in validations:
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
                }
                if details:
                    item["breakdown"] = v.breakdown
                    item["metadata"] = v.metadata
                results.append(item)

            return Response(
                {
                    "job_id": bulk_job.id,
                    "total_emails": len(emails),
                    "status": "completed",
                    "message": "Bulk validation completed successfully",
                    "results": results,
                },
                status=status.HTTP_200_OK,
            )
        except Exception as e:
            return Response(
                {
                    "job_id": bulk_job.id,
                    "total_emails": len(emails),
                    "status": "failed",
                    "message": "Bulk validation failed",
                },
                status=status.HTTP_202_ACCEPTED,
            )


class BulkJobStatusView(APIView):
    permission_classes = [APIKeyOnlyPermission]

    def get(self, request, job_id):
        """Get bulk job status and progress"""
        job = get_object_or_404(BulkValidationJob, id=job_id, user=request.user)

        # Get validation results for this job
        validations = EmailValidation.objects.filter(
            user=request.user, job_type="bulk", created_at__gte=job.created_at
        ).order_by("-created_at")

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
    permission_classes = [APIKeyOnlyPermission]

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


class ValidationHistoryView(generics.ListAPIView):
    serializer_class = EmailValidationSerializer
    permission_classes = [APIKeyOnlyPermission]

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
    permission_classes = [APIKeyOnlyPermission]

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

        # Top domains
        top_domains = (
            validations.filter(status="completed")
            .values("email")
            .annotate(
                domain=models.functions.Substr(
                    "email", models.functions.Position("@", "email") + 1
                )
            )
            .values("domain")
            .annotate(count=Count("id"), avg_score=Avg("score"))
            .order_by("-count")[:10]
        )

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
                "top_domains": list(top_domains),
            }
        )


class DomainReputationView(APIView):
    permission_classes = [APIKeyOnlyPermission]

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
