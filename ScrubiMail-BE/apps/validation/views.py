from rest_framework import generics, status, permissions
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.decorators import action
from django.shortcuts import get_object_or_404
from django.utils import timezone
from django.db.models import Q, Avg, Count
from django.db import models
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
from backend.middle_ware import AllowJWTOrAPIKey
from rest_framework.permissions import IsAuthenticatedOrReadOnly
from rest_framework.permissions import BasePermission
from apps.billing.services import BillingService
from apps.billing.models import CreditTransaction, EmailValidationUsage
from backend.throttling import PlanBasedRateThrottle, BulkValidationThrottle, PlanFeatureThrottle


class SingleEmailValidationView(APIView):
    permission_classes = [AllowJWTOrAPIKey]
    throttle_classes = [PlanBasedRateThrottle, PlanFeatureThrottle]

    def post(self, request):
        """Single email validation with real-time option"""
        serializer = EmailValidationSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        email = serializer.validated_data["email"]
        real_time = serializer.validated_data.get("real_time", False)
        user = request.user

        # Check if user has enough credits
        billing_service = BillingService()
        profile = billing_service.get_or_create_billing_profile(user)

        if not profile.can_use_credits(1):
            return Response(
                {"error": "Insufficient credits. Please purchase more credits."},
                status=status.HTTP_402_PAYMENT_REQUIRED,
            )

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

            # Consume credits and create billing records
            profile.consume_credits(1, f"Email validation: {email}")

            # Create usage tracking record
            EmailValidationUsage.objects.create(
                billing_profile=profile,
                validation_request_id=str(validation.id),
                credits_consumed=1,
                cost_per_credit=0.01,
                validation_type="single",
                email_count=1,
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
            # Non-real-time path: still validate synchronously using the
            # validator directly (avoids Celery dependency) but with the
            # same optimised AdvancedEmailValidator pipeline.
            validator = AdvancedEmailValidator()
            result = validator.validate_email(email)

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
                job_type="single",
            )

            # Consume credits and create billing records
            profile.consume_credits(1, f"Email validation: {email}")

            EmailValidationUsage.objects.create(
                billing_profile=profile,
                validation_request_id=str(validation.id),
                credits_consumed=1,
                cost_per_credit=0.01,
                validation_type="single",
                email_count=1,
            )

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


class BulkEmailValidationView(APIView):
    permission_classes = [AllowJWTOrAPIKey]
    throttle_classes = [BulkValidationThrottle, PlanFeatureThrottle]

    def post(self, request):
        """Bulk email validation with job tracking"""
        # Check if bulk limit was exceeded by throttle
        if hasattr(request, 'bulk_limit_exceeded') and request.bulk_limit_exceeded:
            return Response(
                {
                    "error": f"Bulk validation limit exceeded. Your plan allows {request.bulk_limit} emails per request, but you requested {request.bulk_requested}. Please upgrade your plan or reduce the number of emails.",
                    "limit": request.bulk_limit,
                    "requested": request.bulk_requested,
                    "upgrade_url": "/plans/",
                },
                status=status.HTTP_429_TOO_MANY_REQUESTS,
            )
        
        serializer = BulkEmailValidationSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        emails = serializer.validated_data["emails"]
        user = request.user

        # Check if user has enough credits
        billing_service = BillingService()
        profile = billing_service.get_or_create_billing_profile(user)

        required_credits = len(emails)
        if not profile.can_use_credits(required_credits):
            return Response(
                {
                    "error": f"Insufficient credits. You need {required_credits} credits but only have {profile.credits_remaining}."
                },
                status=status.HTTP_402_PAYMENT_REQUIRED,
            )

        # Create bulk job
        bulk_job = BulkValidationJob.objects.create(
            user=user, emails=emails, total_emails=len(emails), status="pending"
        )

        # Process bulk validation directly (no Celery dependency)
        try:
            from concurrent.futures import ThreadPoolExecutor, as_completed

            validator = AdvancedEmailValidator()
            bulk_job.status = "processing"
            bulk_job.save()

            validation_records = []
            details = request.query_params.get("details", "false").lower() == "true"

            def validate_one(email_addr):
                return email_addr, validator.validate_email(email_addr)

            # Validate emails in parallel (up to 5 concurrent)
            with ThreadPoolExecutor(max_workers=5) as executor:
                futures = {executor.submit(validate_one, em): em for em in emails}
                for future in as_completed(futures):
                    try:
                        email_addr, result = future.result()
                        v = EmailValidation.objects.create(
                            email=email_addr,
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
                            job_type="bulk",
                        )
                        validation_records.append(v)
                    except Exception:
                        continue

            bulk_job.status = "completed"
            bulk_job.total_processed = len(validation_records)
            bulk_job.progress = 100
            bulk_job.save()

            # Consume credits and create billing records
            profile.consume_credits(
                required_credits, f"Bulk email validation: {len(emails)} emails"
            )

            EmailValidationUsage.objects.create(
                billing_profile=profile,
                validation_request_id=str(bulk_job.id),
                credits_consumed=required_credits,
                cost_per_credit=0.01,
                validation_type="bulk",
                email_count=len(emails),
            )

            results = []
            for v in validation_records:
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
            bulk_job.status = "failed"
            bulk_job.save()
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
    permission_classes = [AllowJWTOrAPIKey]

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
