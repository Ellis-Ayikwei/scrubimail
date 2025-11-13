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
    CreditPackage,
    CreditPackagePurchase,
    PromoCode,
    PromoCodeRedemption,
    Invoice,
    InvoiceLineItem,
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
    CreditPackageSerializer,
    CreditPackagePurchaseSerializer,
    PurchaseCreditPackageSerializer,
    PromoCodeSerializer,
    PromoCodeRedemptionSerializer,
    ValidatePromoCodeSerializer,
    InvoiceSerializer,
    InvoiceLineItemSerializer,
    CreateInvoiceSerializer,
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
        success_rate = (
            (valid_emails / completed_validations * 100)
            if completed_validations > 0
            else 0
        )

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
    """Handle Paystack webhook events with HMAC verification"""
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

    # Get webhook secret from settings
    from django.conf import settings
    webhook_secret = settings.PAYSTACK_WEBHOOK_SECRET
    
    if not webhook_secret:
        # Log error but process anyway in development
        import logging
        logger = logging.getLogger(__name__)
        logger.error("PAYSTACK_WEBHOOK_SECRET not configured")
        # In production, you should return error here
        # return Response({"error": "Webhook not configured"}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

    # Verify HMAC signature
    import hmac
    import hashlib
    
    # Get raw request body
    payload = request.body.decode('utf-8')
    
    # Compute expected signature
    expected_signature = hmac.new(
        webhook_secret.encode('utf-8') if webhook_secret else b'',
        payload.encode('utf-8'),
        hashlib.sha512
    ).hexdigest()
    
    # Compare signatures (constant time comparison to prevent timing attacks)
    if webhook_secret and not hmac.compare_digest(signature, expected_signature):
        return Response(
            {"error": "Invalid signature"}, 
            status=status.HTTP_401_UNAUTHORIZED
        )

    # Verify this is not a replay attack (check timestamp)
    try:
        event_data = json.loads(payload)
        
        # Paystack doesn't provide timestamp in webhook, but we can add our own tracking
        # For now, just process the event
        
        billing_service = BillingService()
        billing_service.handle_subscription_webhook(event_data)

        return Response({"status": "success"}, status=status.HTTP_200_OK)
    except json.JSONDecodeError:
        return Response(
            {"error": "Invalid JSON payload"}, 
            status=status.HTTP_400_BAD_REQUEST
        )
    except Exception as e:
        import logging
        logger = logging.getLogger(__name__)
        logger.error(f"Webhook processing error: {str(e)}")
        return Response(
            {"error": f"Processing error: {str(e)}"}, 
            status=status.HTTP_500_INTERNAL_SERVER_ERROR
        )


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


class StartTrialView(APIView):
    """Start a trial period for a plan"""
    
    permission_classes = [IsAuthenticated]
    
    def post(self, request):
        plan_id = request.data.get('plan_id')
        
        if not plan_id:
            return Response(
                {'error': 'plan_id is required'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        try:
            plan = Plan.objects.get(id=plan_id, is_active=True)
        except Plan.DoesNotExist:
            return Response(
                {'error': 'Plan not found'},
                status=status.HTTP_404_NOT_FOUND
            )
        
        if plan.trial_days == 0:
            return Response(
                {'error': 'This plan does not offer a trial'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        billing_service = BillingService()
        profile = billing_service.get_or_create_billing_profile(request.user)
        
        # Check if user already had a trial
        if profile.trial_converted or profile.is_trial:
            return Response(
                {'error': 'Trial already used or active'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        # Start trial
        success = profile.start_trial(plan)
        
        if success:
            return Response({
                'message': f'Trial started successfully for {plan.name}',
                'trial_end_date': profile.trial_end_date,
                'trial_days': plan.trial_days,
                'credits': profile.credits_remaining,
            }, status=status.HTTP_200_OK)
        else:
            return Response(
                {'error': 'Failed to start trial'},
                status=status.HTTP_400_BAD_REQUEST
            )


class TrialStatusView(APIView):
    """Get trial status for current user"""
    
    permission_classes = [IsAuthenticated]
    
    def get(self, request):
        billing_service = BillingService()
        profile = billing_service.get_or_create_billing_profile(request.user)
        
        return Response({
            'is_trial_active': profile.is_trial_active(),
            'is_trial': profile.is_trial,
            'trial_start_date': profile.trial_start_date,
            'trial_end_date': profile.trial_end_date,
            'days_left': profile.days_left_in_trial(),
            'trial_converted': profile.trial_converted,
            'current_plan': profile.current_plan.name if profile.current_plan else None,
        })


class RateLimitStatusView(APIView):
    """Get current rate limit status and remaining quota"""
    
    permission_classes = [IsAuthenticated]
    
    def get(self, request):
        from django.core.cache import cache
        from backend.throttling import PlanBasedRateThrottle
        
        billing_service = BillingService()
        profile = billing_service.get_or_create_billing_profile(request.user)
        
        # Get plan limits
        plan = profile.current_plan
        if not plan:
            from apps.plan.models import Plan
            plan = Plan.objects.filter(name='Free', is_active=True).first()
        
        if not plan:
            return Response({'error': 'No plan found'}, status=status.HTTP_404_NOT_FOUND)
        
        # Get current usage from cache
        throttle = PlanBasedRateThrottle()
        throttle.rate = f'{plan.max_api_calls_per_hour}/hour'
        throttle.num_requests, throttle.duration = throttle.parse_rate(throttle.rate)
        
        cache_key = f'throttle_plan_based_{request.user.id}'
        history = cache.get(cache_key, [])
        
        # Calculate usage
        current_time = timezone.now().timestamp()
        recent_requests = [h for h in history if current_time - h < throttle.duration]
        requests_made = len(recent_requests)
        requests_remaining = max(0, plan.max_api_calls_per_hour - requests_made)
        
        # Calculate reset time
        if recent_requests:
            oldest_request = min(recent_requests)
            reset_time = oldest_request + throttle.duration
            seconds_until_reset = max(0, reset_time - current_time)
        else:
            seconds_until_reset = 0
        
        return Response({
            'plan': {
                'name': plan.name,
                'max_api_calls_per_hour': plan.max_api_calls_per_hour,
                'max_bulk_emails': plan.max_bulk_emails,
                'supports_api': plan.supports_api,
                'supports_bulk': plan.supports_bulk,
            },
            'usage': {
                'requests_made_this_hour': requests_made,
                'requests_remaining': requests_remaining,
                'limit': plan.max_api_calls_per_hour,
                'percentage_used': round((requests_made / plan.max_api_calls_per_hour * 100) if plan.max_api_calls_per_hour > 0 else 0, 2),
            },
            'reset': {
                'seconds_until_reset': int(seconds_until_reset),
                'reset_time': timezone.now() + timedelta(seconds=seconds_until_reset) if seconds_until_reset > 0 else None,
            },
            'warnings': self._get_warnings(requests_remaining, plan.max_api_calls_per_hour),
        })
    
    def _get_warnings(self, remaining, limit):
        """Generate warnings based on usage"""
        warnings = []
        percentage_remaining = (remaining / limit * 100) if limit > 0 else 0
        
        if percentage_remaining <= 10:
            warnings.append('You have used 90% of your hourly rate limit. Consider upgrading your plan.')
        elif percentage_remaining <= 25:
            warnings.append('You have used 75% of your hourly rate limit.')
        
        if remaining == 0:
            warnings.append('Rate limit exceeded. Please wait or upgrade your plan.')
        
        return warnings


class ListCreditPackagesView(APIView):
    """List all available credit packages"""
    
    permission_classes = [AllowJWTOrAPIKey]
    
    def get(self, request):
        """Get all active credit packages"""
        packages = CreditPackage.objects.filter(
            is_active=True
        ).order_by('sort_order', 'price')
        
        # Filter by featured if requested
        if request.query_params.get('featured') == 'true':
            packages = packages.filter(is_featured=True)
        
        serializer = CreditPackageSerializer(
            packages,
            many=True,
            context={'request': request}
        )
        
        return Response({
            'success': True,
            'packages': serializer.data,
            'count': packages.count(),
        })


class CreditPackageDetailView(APIView):
    """Get details of a specific credit package"""
    
    permission_classes = [AllowJWTOrAPIKey]
    
    def get(self, request, package_id):
        """Get package details"""
        package = get_object_or_404(CreditPackage, id=package_id, is_active=True)
        
        serializer = CreditPackageSerializer(
            package,
            context={'request': request}
        )
        
        return Response({
            'success': True,
            'package': serializer.data,
        })


class PurchaseCreditPackageView(APIView):
    """Purchase a credit package"""
    
    permission_classes = [AllowJWTOrAPIKey]
    
    def post(self, request):
        """Initiate credit package purchase"""
        serializer = PurchaseCreditPackageSerializer(
            data=request.data,
            context={'request': request}
        )
        
        if not serializer.is_valid():
            return Response({
                'success': False,
                'errors': serializer.errors,
            }, status=status.HTTP_400_BAD_REQUEST)
        
        package_id = serializer.validated_data['package_id']
        payment_method = serializer.validated_data.get('payment_method', 'paystack')
        payment_reference = serializer.validated_data.get('payment_reference')
        promo_code_str = request.data.get('promo_code', '').upper()
        
        # Get package
        package = CreditPackage.objects.get(id=package_id)
        original_amount = package.get_effective_price()
        final_amount = original_amount
        promo_code = None
        discount_amount = Decimal('0')
        
        # Apply promo code if provided
        if promo_code_str:
            try:
                promo_code = PromoCode.objects.get(code=promo_code_str)
                
                # Validate promo code
                is_valid, message = promo_code.is_valid(
                    user=request.user,
                    package=package,
                    amount=original_amount
                )
                
                if not is_valid:
                    return Response({
                        'success': False,
                        'message': f'Promo code error: {message}',
                    }, status=status.HTTP_400_BAD_REQUEST)
                
                # Calculate discount
                discount_amount = promo_code.calculate_discount(original_amount)
                final_amount = promo_code.get_final_amount(original_amount)
                
            except PromoCode.DoesNotExist:
                return Response({
                    'success': False,
                    'message': 'Invalid promo code',
                }, status=status.HTTP_404_NOT_FOUND)
        
        # Get or create billing profile
        billing_profile, _ = BillingProfile.objects.get_or_create(user=request.user)
        
        # Create purchase record
        purchase = CreditPackagePurchase.objects.create(
            user=request.user,
            billing_profile=billing_profile,
            package=package,
            credits_purchased=package.credits,
            amount_paid=final_amount,  # Use discounted amount
            currency='NGN',
            payment_method=payment_method,
            payment_reference=payment_reference,
            payment_provider=payment_method,
            status='pending',
            metadata={
                'original_amount': float(original_amount),
                'discount_amount': float(discount_amount),
                'promo_code': promo_code_str if promo_code else None,
            }
        )
        
        # Create promo code redemption if applicable
        if promo_code:
            bonus_credits = 0
            if promo_code.discount_type == 'free_credits':
                bonus_credits = int(promo_code.discount_value)
            
            PromoCodeRedemption.objects.create(
                promo_code=promo_code,
                user=request.user,
                billing_profile=billing_profile,
                credit_package=package,
                original_amount=original_amount,
                discount_amount=discount_amount,
                final_amount=final_amount,
                bonus_credits=bonus_credits,
                metadata={
                    'purchase_id': str(purchase.id),
                }
            )
            
            # Increment promo code usage
            promo_code.increment_usage()
            
            # Add bonus credits immediately if applicable
            if bonus_credits > 0:
                billing_profile.add_credits(
                    amount=bonus_credits,
                    description=f"Bonus credits from promo code: {promo_code_str}",
                    expiry_days=90
                )
        
        # Initialize payment if no reference provided
        if not payment_reference and payment_method == 'paystack':
            try:
                paystack_service = PaystackService()
                payment_data = paystack_service.initialize_payment(
                    email=request.user.email,
                    amount=final_amount,  # Use discounted amount
                    metadata={
                        'purchase_id': str(purchase.id),
                        'package_id': str(package.id),
                        'credits': package.credits,
                        'user_id': str(request.user.id),
                        'type': 'credit_package',
                        'promo_code': promo_code_str if promo_code else None,
                        'original_amount': float(original_amount),
                        'discount_amount': float(discount_amount),
                    }
                )
                
                purchase.payment_reference = payment_data.get('reference')
                purchase.save()
                
                return Response({
                    'success': True,
                    'purchase_id': str(purchase.id),
                    'payment_url': payment_data.get('authorization_url'),
                    'reference': payment_data.get('reference'),
                    'amount': float(final_amount),
                    'discount_info': {
                        'original_amount': float(original_amount),
                        'discount_amount': float(discount_amount),
                        'promo_code': promo_code_str if promo_code else None,
                    } if promo_code else None,
                })
                
            except Exception as e:
                purchase.status = 'failed'
                purchase.failed_at = timezone.now()
                purchase.metadata = {'error': str(e)}
                purchase.save()
                
                return Response({
                    'success': False,
                    'message': f'Failed to initialize payment: {str(e)}',
                }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
        
        # Return purchase details
        purchase_serializer = CreditPackagePurchaseSerializer(purchase)
        return Response({
            'success': True,
            'purchase': purchase_serializer.data,
        })


class CreditPackagePurchaseHistoryView(APIView):
    """View user's credit package purchase history"""
    
    permission_classes = [AllowJWTOrAPIKey]
    
    def get(self, request):
        """Get purchase history"""
        purchases = CreditPackagePurchase.objects.filter(
            user=request.user
        ).select_related('package').order_by('-created_at')
        
        # Filter by status if provided
        status_filter = request.query_params.get('status')
        if status_filter:
            purchases = purchases.filter(status=status_filter)
        
        # Pagination
        page = int(request.query_params.get('page', 1))
        page_size = int(request.query_params.get('page_size', 20))
        start = (page - 1) * page_size
        end = start + page_size
        
        total_count = purchases.count()
        purchases_page = purchases[start:end]
        
        serializer = CreditPackagePurchaseSerializer(purchases_page, many=True)
        
        return Response({
            'success': True,
            'purchases': serializer.data,
            'pagination': {
                'total': total_count,
                'page': page,
                'page_size': page_size,
                'total_pages': (total_count + page_size - 1) // page_size,
            }
        })


class CompleteCreditPackagePurchaseView(APIView):
    """Complete a credit package purchase (called by webhook or admin)"""
    
    permission_classes = [AllowJWTOrAPIKey]
    
    def post(self, request, purchase_id):
        """Complete purchase and add credits"""
        purchase = get_object_or_404(
            CreditPackagePurchase,
            id=purchase_id,
            user=request.user
        )
        
        if purchase.status != 'pending':
            return Response({
                'success': False,
                'message': f'Purchase is already {purchase.status}',
            }, status=status.HTTP_400_BAD_REQUEST)
        
        try:
            purchase.complete_purchase()
            
            # Get updated billing profile
            billing_service = BillingService()
            profile = billing_service.get_or_create_billing_profile(request.user)
            
            return Response({
                'success': True,
                'message': f'{purchase.credits_purchased} credits added to your account',
                'credits': {
                    'balance': profile.credits,
                    'added': purchase.credits_purchased,
                },
            })
            
        except Exception as e:
            return Response({
                'success': False,
                'message': f'Failed to complete purchase: {str(e)}',
            }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


class ExpiringCreditsView(APIView):
    """Get information about expiring credits"""
    
    permission_classes = [AllowJWTOrAPIKey]
    
    def get(self, request):
        """Get expiring credits information"""
        billing_service = BillingService()
        profile = billing_service.get_or_create_billing_profile(request.user)
        
        # Get expiring credits with custom days parameter
        days = int(request.query_params.get('days', 7))
        expiring_info = profile.get_expiring_credits(days=days)
        
        # Serialize expiring transactions
        transactions = CreditTransactionSerializer(
            expiring_info['transactions'],
            many=True
        ).data
        
        # Get expired credits total
        expired_total = profile.get_expired_credits_total()
        
        return Response({
            'success': True,
            'expiring': {
                'total_credits': expiring_info['total_credits'],
                'days_until_expiry': expiring_info['days_until_expiry'],
                'transactions': transactions,
            },
            'expired': {
                'total_credits': expired_total,
            },
            'warnings': self._get_expiry_warnings(
                expiring_info['total_credits'],
                expiring_info['days_until_expiry']
            ),
        })
    
    def _get_expiry_warnings(self, credits, days):
        """Generate warnings based on expiring credits"""
        warnings = []
        
        if credits > 0 and days is not None:
            if days <= 1:
                warnings.append(
                    f'⚠️ URGENT: {credits} credits expiring in {days} day{"s" if days != 1 else ""}!'
                )
            elif days <= 3:
                warnings.append(
                    f'⚠️ Warning: {credits} credits expiring in {days} days.'
                )
            elif days <= 7:
                warnings.append(
                    f'ℹ️ Notice: {credits} credits will expire in {days} days.'
                )
        
        return warnings


class ExpiringCreditsView(APIView):
    """View credits that are expiring soon"""
    
    permission_classes = [AllowJWTOrAPIKey]
    
    def get(self, request):
        """Get expiring credits information"""
        billing_service = BillingService()
        profile = billing_service.get_or_create_billing_profile(request.user)
        
        # Get days parameter (default 7 days)
        days = int(request.query_params.get('days', 7))
        
        # Get expiring credits
        expiring_data = profile.get_expiring_credits(days=days)
        
        # Get expired credits total
        expired_total = profile.get_expired_credits_total()
        
        # Serialize transactions
        transactions_data = []
        for transaction in expiring_data['transactions']:
            transactions_data.append({
                'id': str(transaction.id),
                'amount': transaction.amount,
                'description': transaction.description,
                'expiry_date': transaction.expiry_date.isoformat() if transaction.expiry_date else None,
                'days_until_expiry': transaction.days_until_expiry(),
                'created_at': transaction.created_at.isoformat(),
            })
        
        return Response({
            'success': True,
            'expiring_credits': {
                'total_credits': expiring_data['total_credits'],
                'days_range': days,
                'earliest_expiry_days': expiring_data['days_until_expiry'],
                'transactions': transactions_data,
            },
            'expired_credits_total': expired_total,
            'current_balance': profile.credits_remaining,
            'warnings': self._generate_warnings(
                expiring_data['total_credits'], 
                expiring_data['days_until_expiry']
            ),
        })
    
    def _generate_warnings(self, expiring_credits, days_until):
        """Generate warning messages"""
        warnings = []
        
        if expiring_credits > 0 and days_until is not None:
            if days_until <= 1:
                warnings.append(
                    f'⚠️ URGENT: {expiring_credits} credits expiring in {days_until} day{"s" if days_until != 1 else ""}!'
                )
            elif days_until <= 3:
                warnings.append(
                    f'⚠️ {expiring_credits} credits expiring in {days_until} days'
                )
            elif days_until <= 7:
                warnings.append(
                    f'ℹ️ {expiring_credits} credits expiring in {days_until} days'
                )
        
        return warnings


class CreditBalanceDetailView(APIView):
    """Get detailed credit balance breakdown"""
    
    permission_classes = [AllowJWTOrAPIKey]
    
    def get(self, request):
        """Get detailed credit breakdown"""
        billing_service = BillingService()
        profile = billing_service.get_or_create_billing_profile(request.user)
        
        # Get all active (non-expired) credit transactions
        active_transactions = CreditTransaction.objects.filter(
            billing_profile=profile,
            amount__gt=0,
            is_expired=False,
            transaction_type__in=['purchase', 'bonus', 'plan_credits']
        ).order_by('expiry_date', '-created_at')
        
        # Separate into expiring and non-expiring
        expiring = []
        non_expiring = []
        
        for transaction in active_transactions:
            data = {
                'id': str(transaction.id),
                'amount': transaction.amount,
                'description': transaction.description,
                'type': transaction.transaction_type,
                'created_at': transaction.created_at.isoformat(),
                'expiry_date': transaction.expiry_date.isoformat() if transaction.expiry_date else None,
                'days_until_expiry': transaction.days_until_expiry(),
            }
            
            if transaction.expiry_date:
                expiring.append(data)
            else:
                non_expiring.append(data)
        
        # Get usage
        total_used = abs(
            CreditTransaction.objects.filter(
                billing_profile=profile,
                transaction_type='usage',
                amount__lt=0
            ).aggregate(total=Sum('amount'))['total'] or 0
        )
        
        return Response({
            'success': True,
            'balance': {
                'current': profile.credits_remaining,
                'available': profile.get_available_credits(),
                'total_purchased': profile.total_credits_purchased,
                'total_used': total_used,
                'total_expired': profile.get_expired_credits_total(),
            },
            'credits': {
                'expiring': {
                    'count': len(expiring),
                    'transactions': expiring,
                },
                'non_expiring': {
                    'count': len(non_expiring),
                    'transactions': non_expiring,
                },
            },
        })


class ValidatePromoCodeView(APIView):
    """Validate a promo code and return discount information"""
    
    permission_classes = [AllowJWTOrAPIKey]
    
    def post(self, request):
        """Validate promo code"""
        serializer = ValidatePromoCodeSerializer(
            data=request.data,
            context={'request': request}
        )
        
        if not serializer.is_valid():
            return Response({
                'success': False,
                'errors': serializer.errors,
            }, status=status.HTTP_400_BAD_REQUEST)
        
        code = serializer.validated_data['code']
        amount = serializer.validated_data.get('amount')
        
        try:
            promo_code = PromoCode.objects.get(code=code)
            
            # Calculate discount if amount provided
            discount_info = {}
            if amount:
                discount_amount = promo_code.calculate_discount(amount)
                final_amount = promo_code.get_final_amount(amount)
                
                discount_info = {
                    'original_amount': float(amount),
                    'discount_amount': float(discount_amount),
                    'final_amount': float(final_amount),
                    'savings_percentage': float((discount_amount / amount * 100) if amount > 0 else 0),
                }
            
            # Get bonus credits if applicable
            bonus_credits = 0
            if promo_code.discount_type == 'free_credits':
                bonus_credits = int(promo_code.discount_value)
            
            return Response({
                'success': True,
                'valid': True,
                'promo_code': PromoCodeSerializer(promo_code).data,
                'discount_info': discount_info,
                'bonus_credits': bonus_credits,
                'message': f'Promo code "{code}" applied successfully!',
            })
            
        except PromoCode.DoesNotExist:
            return Response({
                'success': False,
                'valid': False,
                'message': 'Invalid promo code',
            }, status=status.HTTP_404_NOT_FOUND)


class RedeemPromoCodeView(APIView):
    """Redeem a promo code during purchase"""
    
    permission_classes = [AllowJWTOrAPIKey]
    
    def post(self, request):
        """Redeem promo code and apply discount"""
        code = request.data.get('code', '').upper()
        package_id = request.data.get('package_id')
        plan_id = request.data.get('plan_id')
        
        if not code:
            return Response({
                'success': False,
                'message': 'Promo code is required',
            }, status=status.HTTP_400_BAD_REQUEST)
        
        try:
            promo_code = PromoCode.objects.get(code=code)
        except PromoCode.DoesNotExist:
            return Response({
                'success': False,
                'message': 'Invalid promo code',
            }, status=status.HTTP_404_NOT_FOUND)
        
        # Get plan or package
        plan = None
        package = None
        original_amount = None
        
        if package_id:
            try:
                package = CreditPackage.objects.get(id=package_id)
                original_amount = package.get_effective_price()
            except CreditPackage.DoesNotExist:
                return Response({
                    'success': False,
                    'message': 'Invalid package ID',
                }, status=status.HTTP_404_NOT_FOUND)
        
        elif plan_id:
            try:
                plan = Plan.objects.get(id=plan_id)
                original_amount = plan.price
            except Plan.DoesNotExist:
                return Response({
                    'success': False,
                    'message': 'Invalid plan ID',
                }, status=status.HTTP_404_NOT_FOUND)
        else:
            return Response({
                'success': False,
                'message': 'Either package_id or plan_id is required',
            }, status=status.HTTP_400_BAD_REQUEST)
        
        # Validate promo code
        is_valid, message = promo_code.is_valid(
            user=request.user,
            plan=plan,
            package=package,
            amount=original_amount
        )
        
        if not is_valid:
            return Response({
                'success': False,
                'message': message,
            }, status=status.HTTP_400_BAD_REQUEST)
        
        # Calculate discount
        discount_amount = promo_code.calculate_discount(original_amount)
        final_amount = promo_code.get_final_amount(original_amount)
        bonus_credits = 0
        
        if promo_code.discount_type == 'free_credits':
            bonus_credits = int(promo_code.discount_value)
        
        # Get or create billing profile
        billing_profile, _ = BillingProfile.objects.get_or_create(user=request.user)
        
        # Create redemption record
        redemption = PromoCodeRedemption.objects.create(
            promo_code=promo_code,
            user=request.user,
            billing_profile=billing_profile,
            plan=plan,
            credit_package=package,
            original_amount=original_amount,
            discount_amount=discount_amount,
            final_amount=final_amount,
            bonus_credits=bonus_credits,
            metadata={
                'redeemed_at': timezone.now().isoformat(),
            }
        )
        
        # Increment promo code usage
        promo_code.increment_usage()
        
        # Add bonus credits if applicable
        if bonus_credits > 0:
            billing_profile.add_credits(
                amount=bonus_credits,
                description=f"Bonus credits from promo code: {code}",
                expiry_days=90  # Bonus credits expire in 90 days
            )
        
        return Response({
            'success': True,
            'redemption': PromoCodeRedemptionSerializer(redemption).data,
            'discount_info': {
                'original_amount': float(original_amount),
                'discount_amount': float(discount_amount),
                'final_amount': float(final_amount),
                'bonus_credits': bonus_credits,
            },
            'message': f'Promo code "{code}" redeemed successfully!',
        })


class ListPromoCodesView(APIView):
    """List and create promo codes (admin only)"""
    
    permission_classes = [AllowJWTOrAPIKey]
    
    def get(self, request):
        """Get all promo codes"""
        # Check if user is admin
        if not (request.user.is_authenticated and (request.user.is_staff or getattr(request.user, 'user_type', None) == 'admin')):
            return Response({
                'success': False,
                'message': 'Admin access required',
            }, status=status.HTTP_403_FORBIDDEN)
        
        promo_codes = PromoCode.objects.all().order_by('-created_at')
        
        # Filter by active status if requested
        if request.query_params.get('active_only') == 'true':
            promo_codes = promo_codes.filter(is_active=True)
        
        serializer = PromoCodeSerializer(promo_codes, many=True)
        
        return Response({
            'success': True,
            'promo_codes': serializer.data,
            'count': promo_codes.count(),
        })
    
    def post(self, request):
        """Create a new promo code"""
        # Check if user is admin
        if not (request.user.is_authenticated and (request.user.is_staff or getattr(request.user, 'user_type', None) == 'admin')):
            return Response({
                'success': False,
                'message': 'Admin access required',
            }, status=status.HTTP_403_FORBIDDEN)
        
        # Normalize request data
        data = dict(request.data)
        # Map frontend field names to backend field names
        if 'min_purchase_amount' in data:
            data['minimum_purchase_amount'] = data.pop('min_purchase_amount')
        if 'applicable_plans' in data:
            data['valid_for_plans'] = data.pop('applicable_plans')
        if 'applicable_packages' in data:
            data['valid_for_packages'] = data.pop('applicable_packages')
        # Map discount_type
        if data.get('discount_type') == 'fixed_amount':
            data['discount_type'] = 'fixed'
        
        serializer = PromoCodeSerializer(data=data)
        if serializer.is_valid():
            promo_code = serializer.save()
            return Response({
                'success': True,
                'promo_code': PromoCodeSerializer(promo_code).data,
                'message': 'Promo code created successfully',
            }, status=status.HTTP_201_CREATED)
        
        return Response({
            'success': False,
            'errors': serializer.errors,
        }, status=status.HTTP_400_BAD_REQUEST)


class PromoCodeDetailView(APIView):
    """Get, update, or delete a specific promo code (admin only)"""
    
    permission_classes = [AllowJWTOrAPIKey]
    
    def get(self, request, pk):
        """Get a specific promo code"""
        # Check if user is admin
        if not (request.user.is_authenticated and (request.user.is_staff or getattr(request.user, 'user_type', None) == 'admin')):
            return Response({
                'success': False,
                'message': 'Admin access required',
            }, status=status.HTTP_403_FORBIDDEN)
        
        promo_code = get_object_or_404(PromoCode, pk=pk)
        serializer = PromoCodeSerializer(promo_code)
        
        return Response({
            'success': True,
            'promo_code': serializer.data,
        })
    
    def put(self, request, pk):
        """Update a promo code"""
        # Check if user is admin
        if not (request.user.is_authenticated and (request.user.is_staff or getattr(request.user, 'user_type', None) == 'admin')):
            return Response({
                'success': False,
                'message': 'Admin access required',
            }, status=status.HTTP_403_FORBIDDEN)
        
        promo_code = get_object_or_404(PromoCode, pk=pk)
        # Normalize request data
        data = dict(request.data)
        # Map frontend field names to backend field names
        if 'min_purchase_amount' in data:
            data['minimum_purchase_amount'] = data.pop('min_purchase_amount')
        if 'applicable_plans' in data:
            data['valid_for_plans'] = data.pop('applicable_plans')
        if 'applicable_packages' in data:
            data['valid_for_packages'] = data.pop('applicable_packages')
        # Map discount_type
        if data.get('discount_type') == 'fixed_amount':
            data['discount_type'] = 'fixed'
        
        serializer = PromoCodeSerializer(promo_code, data=data, partial=True)
        
        if serializer.is_valid():
            promo_code = serializer.save()
            return Response({
                'success': True,
                'promo_code': PromoCodeSerializer(promo_code).data,
                'message': 'Promo code updated successfully',
            })
        
        return Response({
            'success': False,
            'errors': serializer.errors,
        }, status=status.HTTP_400_BAD_REQUEST)
    
    def delete(self, request, pk):
        """Delete (deactivate) a promo code"""
        # Check if user is admin
        if not (request.user.is_authenticated and (request.user.is_staff or getattr(request.user, 'user_type', None) == 'admin')):
            return Response({
                'success': False,
                'message': 'Admin access required',
            }, status=status.HTTP_403_FORBIDDEN)
        
        promo_code = get_object_or_404(PromoCode, pk=pk)
        # Soft delete by deactivating
        promo_code.is_active = False
        promo_code.save()
        
        return Response({
            'success': True,
            'message': 'Promo code deactivated successfully',
        }, status=status.HTTP_200_OK)


class PromoCodeRedemptionHistoryView(APIView):
    """View user's promo code redemption history"""
    
    permission_classes = [AllowJWTOrAPIKey]
    
    def get(self, request):
        """Get redemption history"""
        redemptions = PromoCodeRedemption.objects.filter(
            user=request.user
        ).select_related('promo_code').order_by('-created_at')
        
        # Pagination
        page = int(request.query_params.get('page', 1))
        page_size = int(request.query_params.get('page_size', 20))
        start = (page - 1) * page_size
        end = start + page_size
        
        total_count = redemptions.count()
        redemptions_page = redemptions[start:end]
        
        serializer = PromoCodeRedemptionSerializer(redemptions_page, many=True)
        
        # Calculate total savings
        total_savings = sum(r.discount_amount for r in redemptions)
        total_bonus_credits = sum(r.bonus_credits for r in redemptions)
        
        return Response({
            'success': True,
            'redemptions': serializer.data,
            'stats': {
                'total_redemptions': total_count,
                'total_savings': float(total_savings),
                'total_bonus_credits': total_bonus_credits,
            },
            'pagination': {
                'total': total_count,
                'page': page,
                'page_size': page_size,
                'total_pages': (total_count + page_size - 1) // page_size,
            }
        })


class ListInvoicesView(APIView):
    """List user's invoices"""
    
    permission_classes = [AllowJWTOrAPIKey]
    
    def get(self, request):
        """Get invoice list"""
        invoices = Invoice.objects.filter(
            user=request.user
        ).prefetch_related('line_items').order_by('-invoice_date')
        
        # Filter by status if provided
        status_filter = request.query_params.get('status')
        if status_filter:
            invoices = invoices.filter(status=status_filter)
        
        # Filter by type if provided
        type_filter = request.query_params.get('type')
        if type_filter:
            invoices = invoices.filter(invoice_type=type_filter)
        
        # Pagination
        page = int(request.query_params.get('page', 1))
        page_size = int(request.query_params.get('page_size', 20))
        start = (page - 1) * page_size
        end = start + page_size
        
        total_count = invoices.count()
        invoices_page = invoices[start:end]
        
        serializer = InvoiceSerializer(invoices_page, many=True)
        
        # Calculate stats
        total_amount = sum(inv.total_amount for inv in invoices)
        paid_amount = sum(inv.amount_paid for inv in invoices.filter(status='paid'))
        
        return Response({
            'success': True,
            'invoices': serializer.data,
            'stats': {
                'total_invoices': total_count,
                'total_amount': float(total_amount),
                'paid_amount': float(paid_amount),
            },
            'pagination': {
                'total': total_count,
                'page': page,
                'page_size': page_size,
                'total_pages': (total_count + page_size - 1) // page_size,
            }
        })


class InvoiceDetailView(APIView):
    """Get invoice details"""
    
    permission_classes = [AllowJWTOrAPIKey]
    
    def get(self, request, invoice_id):
        """Get invoice details"""
        invoice = get_object_or_404(
            Invoice,
            id=invoice_id,
            user=request.user
        )
        
        serializer = InvoiceSerializer(invoice)
        
        return Response({
            'success': True,
            'invoice': serializer.data,
        })


class GenerateInvoiceView(APIView):
    """Generate invoice for a purchase"""
    
    permission_classes = [AllowJWTOrAPIKey]
    
    def post(self, request):
        """Generate invoice"""
        serializer = CreateInvoiceSerializer(data=request.data)
        
        if not serializer.is_valid():
            return Response({
                'success': False,
                'errors': serializer.errors,
            }, status=status.HTTP_400_BAD_REQUEST)
        
        invoice_type = serializer.validated_data['invoice_type']
        notes = serializer.validated_data.get('notes', '')
        
        # Get or create billing profile
        billing_profile, _ = BillingProfile.objects.get_or_create(user=request.user)
        
        # Create invoice
        invoice = Invoice.objects.create(
            user=request.user,
            billing_profile=billing_profile,
            invoice_type=invoice_type,
            status='draft',
            notes=notes,
        )
        
        # Add line items based on type
        if invoice_type == 'credit_package':
            purchase_id = serializer.validated_data.get('credit_package_purchase_id')
            
            try:
                purchase = CreditPackagePurchase.objects.get(
                    id=purchase_id,
                    user=request.user
                )
                
                # Create line item
                InvoiceLineItem.objects.create(
                    invoice=invoice,
                    description=f"{purchase.package.name} - {purchase.credits_purchased} credits",
                    quantity=1,
                    unit_price=purchase.amount_paid,
                    credit_package=purchase.package,
                )
                
                # Update invoice
                invoice.payment_reference = purchase.payment_reference
                invoice.payment_method = purchase.payment_method
                
                if purchase.status == 'completed':
                    invoice.status = 'paid'
                    invoice.paid_date = purchase.completed_at
                
                invoice.save()
                
            except CreditPackagePurchase.DoesNotExist:
                invoice.delete()
                return Response({
                    'success': False,
                    'message': 'Credit package purchase not found',
                }, status=status.HTTP_404_NOT_FOUND)
        
        # Calculate totals
        invoice.calculate_totals()
        
        serializer = InvoiceSerializer(invoice)
        
        return Response({
            'success': True,
            'invoice': serializer.data,
            'message': 'Invoice generated successfully',
        })


class DownloadInvoicePDFView(APIView):
    """Download invoice as PDF"""
    
    permission_classes = [AllowJWTOrAPIKey]
    
    def get(self, request, invoice_id):
        """Download PDF invoice"""
        from django.http import HttpResponse
        from .invoice_generator import InvoiceGenerator
        
        invoice = get_object_or_404(
            Invoice,
            id=invoice_id,
            user=request.user
        )
        
        # Generate PDF
        try:
            generator = InvoiceGenerator(invoice)
            pdf_data = generator.generate()
            
            # Mark as generated
            if not invoice.pdf_generated:
                invoice.pdf_generated = True
                invoice.save(update_fields=['pdf_generated'])
            
            # Return PDF response
            response = HttpResponse(pdf_data, content_type='application/pdf')
            response['Content-Disposition'] = f'attachment; filename=\"invoice_{invoice.invoice_number}.pdf\"'
            
            return response
            
        except Exception as e:
            return Response({
                'success': False,
                'message': f'Failed to generate PDF: {str(e)}',
            }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


class UsageAlertsStatusView(APIView):
    """Get usage alerts status and trigger manual check"""
    
    permission_classes = [AllowJWTOrAPIKey]
    
    def get(self, request):
        """Get current usage alert status"""
        from .notifications import UsageNotificationService
        
        billing_service = BillingService()
        profile = billing_service.get_or_create_billing_profile(request.user)
        
        notification_service = UsageNotificationService()
        
        # Get usage percentage
        usage_percentage = profile.get_usage_percentage()
        
        # Check which thresholds have been crossed
        crossed_thresholds = []
        alerts_sent = []
        pending_alerts = []
        
        for threshold in notification_service.THRESHOLDS:
            crossed = usage_percentage >= threshold
            sent = notification_service._has_sent_alert(profile, threshold)
            
            if crossed:
                crossed_thresholds.append(threshold)
                
                if sent:
                    alerts_sent.append(threshold)
                else:
                    pending_alerts.append(threshold)
        
        return Response({
            'success': True,
            'usage': {
                'percentage': usage_percentage,
                'credits_remaining': profile.credits_remaining,
                'credits_used': notification_service._get_credits_used(profile),
                'current_plan': profile.current_plan.name if profile.current_plan else 'Free',
            },
            'alerts': {
                'crossed_thresholds': crossed_thresholds,
                'alerts_sent': alerts_sent,
                'pending_alerts': pending_alerts,
            },
            'recommendations': {
                'should_upgrade': usage_percentage >= 75,
                'upgrade_suggestion': notification_service._get_upgrade_suggestion(profile),
            }
        })
    
    def post(self, request):
        """Manually trigger usage alerts check"""
        from .notifications import UsageNotificationService
        
        billing_service = BillingService()
        profile = billing_service.get_or_create_billing_profile(request.user)
        
        notification_service = UsageNotificationService()
        
        # Check and send alerts
        triggered_alerts = notification_service.check_usage_alerts(profile)
        
        return Response({
            'success': True,
            'message': f'Usage check completed. {len(triggered_alerts)} alert(s) sent.',
            'triggered_alerts': triggered_alerts,
        })


