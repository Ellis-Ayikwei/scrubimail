from rest_framework.throttling import SimpleRateThrottle
from apps.billing.models import BillingProfile
from apps.billing.services import get_billing_profile_for_request
from apps.plan.models import Plan
import logging

logger = logging.getLogger(__name__)


class PlanBasedRateThrottle(SimpleRateThrottle):
    """
    Rate throttle based on user's plan limits.
    Enforces max_api_calls_per_hour from the user's current plan.
    """
    scope = 'plan_based'
    
    def get_cache_key(self, request, view):
        """Generate cache key based on user"""
        if not request.user or not request.user.is_authenticated:
            # For anonymous users, use IP-based throttling
            return self.cache_format % {
                'scope': self.scope,
                'ident': self.get_ident(request)
            }
        
        # For authenticated users, use user ID
        return self.cache_format % {
            'scope': self.scope,
            'ident': request.user.id
        }
    
    def get_rate(self):
        """
        Get rate limit from user's plan.
        Returns fallback rate for initialization (will be overridden in allow_request).
        """
        # This is called during __init__ before we have request context
        # The actual rate will be set dynamically in allow_request()
        # Return fallback rate from settings to avoid ImproperlyConfigured
        return '100/hour'  # Fallback rate, will be overridden in allow_request()
    
    def allow_request(self, request, view):
        """
        Check if request should be allowed based on plan limits.
        """
        # Skip for non-validation endpoints
        if not self._is_validation_endpoint(view):
            return True
        
        # Get user's plan
        if not request.user or not request.user.is_authenticated:
            # Anonymous users: very restrictive limit (10/hour)
            self.rate = '10/hour'
            self.num_requests, self.duration = self.parse_rate(self.rate)
        else:
            # One shared, read-only fetch of the profile for this request (see
            # get_billing_profile_for_request); create only when truly absent.
            profile = get_billing_profile_for_request(request)
            if profile is None:
                from apps.billing.services import BillingService
                profile = BillingService().get_or_create_billing_profile(
                    request.user, request=request
                )

            plan = profile.current_plan
            if not plan:
                # No plan - use Free tier limits
                plan = Plan.objects.filter(name='Free', is_active=True).first()

            if plan:
                max_calls = plan.max_api_calls_per_hour
                # Check for unlimited (Enterprise)
                if max_calls >= 10000:
                    return True  # Unlimited access
                self.rate = f'{max_calls}/hour'
                self.num_requests, self.duration = self.parse_rate(self.rate)
            else:
                # Fallback to default
                self.rate = '10/hour'
                self.num_requests, self.duration = self.parse_rate(self.rate)
        
        # Use parent's allow_request with our custom rate
        return super().allow_request(request, view)
    
    def _is_validation_endpoint(self, view):
        """Check if this is a validation endpoint that should be rate limited"""
        view_name = view.__class__.__name__
        validation_views = [
            'ValidateEmailView',
            'SingleEmailValidationView',
            'BulkValidateView',
            'BulkEmailValidationView',
            'EmailValidationViewSet',
        ]
        return any(v in view_name for v in validation_views)
    
    def wait(self):
        """
        Optionally, return a recommended next request time on throttled.
        """
        if self.history:
            remaining_duration = self.duration - (self.now - self.history[-1])
        else:
            remaining_duration = self.duration

        available_requests = self.num_requests - len(self.history) + 1
        if available_requests <= 0:
            return remaining_duration

        return remaining_duration / float(available_requests)


class BulkValidationThrottle(SimpleRateThrottle):
    """
    Special throttle for bulk validation based on plan's max_bulk_emails.
    This checks the size of bulk requests against plan limits.
    """
    scope = 'bulk_validation'
    
    def allow_request(self, request, view):
        """Check if bulk request size is allowed"""
        # Only apply to bulk validation endpoints
        if not self._is_bulk_endpoint(view):
            return True
        
        if not request.user or not request.user.is_authenticated:
            return False  # Require authentication for bulk
        
        try:
            profile = BillingProfile.objects.select_related('current_plan').get(user=request.user)
            plan = profile.current_plan
            
            if not plan:
                free_plan = Plan.objects.filter(name='Free', is_active=True).first()
                plan = free_plan
            
            if not plan:
                return False  # No plan, deny
            
            # Check if bulk is supported
            if not plan.supports_bulk:
                return False
            
            # Check request size
            emails = request.data.get('emails', [])
            if isinstance(emails, list):
                email_count = len(emails)
            else:
                # Could be file upload - check file size heuristic
                email_count = 1  # Will be validated in view
            
            max_bulk = plan.max_bulk_emails
            
            if email_count > max_bulk:
                # Store the limit exceeded info for better error message
                request.bulk_limit_exceeded = True
                request.bulk_limit = max_bulk
                request.bulk_requested = email_count
                return False
            
            return True
            
        except BillingProfile.DoesNotExist:
            return False
    
    def _is_bulk_endpoint(self, view):
        """Check if this is a bulk validation endpoint"""
        view_name = view.__class__.__name__
        return 'Bulk' in view_name
    
    def wait(self):
        return None  # Bulk limits are per-request, not time-based


class PlanFeatureThrottle(SimpleRateThrottle):
    """
    Throttle based on plan features (API access, bulk access, etc.)
    """
    scope = 'plan_feature'
    
    def allow_request(self, request, view):
        """Check if user's plan allows this feature"""
        if not request.user or not request.user.is_authenticated:
            # Allow only basic endpoints for anonymous
            return self._is_public_endpoint(view)

        # Shared read-only fetch; create only when the user has no profile yet.
        profile = get_billing_profile_for_request(request)
        if profile is None:
            from apps.billing.services import BillingService
            profile = BillingService().get_or_create_billing_profile(
                request.user, request=request
            )

        plan = profile.current_plan
        if not plan:
            plan = Plan.objects.filter(name='Free', is_active=True).first()

        if not plan:
            return False

        # Check feature access
        view_name = view.__class__.__name__

        # API access check
        if 'API' in view_name or request.headers.get('X-API-Key'):
            if not plan.supports_api:
                return False

        # Bulk validation check
        if 'Bulk' in view_name:
            if not plan.supports_bulk:
                return False

        return True
    
    def _is_public_endpoint(self, view):
        """Check if endpoint is publicly accessible"""
        public_views = ['PlanListView', 'PlanDetailView', 'PlanComparisonView']
        view_name = view.__class__.__name__
        return any(pv in view_name for pv in public_views)
    
    def wait(self):
        return None  # Feature access is boolean, not time-based
