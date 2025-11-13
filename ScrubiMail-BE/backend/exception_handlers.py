from rest_framework.views import exception_handler
from rest_framework.exceptions import Throttled
from rest_framework.response import Response
from rest_framework import status


def custom_exception_handler(exc, context):
    """
    Custom exception handler for better rate limiting error messages
    """
    # Call REST framework's default exception handler first
    response = exception_handler(exc, context)
    
    # Handle throttled requests with plan-specific messages
    if isinstance(exc, Throttled):
        custom_response_data = {
            'error': 'Rate limit exceeded',
            'message': 'You have exceeded your API rate limit for your current plan.',
            'detail': str(exc.detail),
        }
        
        # Try to get user's plan info for upgrade suggestion
        request = context.get('request')
        if request and hasattr(request, 'user') and request.user.is_authenticated:
            try:
                from apps.billing.models import BillingProfile
                profile = BillingProfile.objects.select_related('current_plan').get(user=request.user)
                
                if profile.current_plan:
                    custom_response_data.update({
                        'current_plan': profile.current_plan.name,
                        'current_limit': f"{profile.current_plan.max_api_calls_per_hour} requests/hour",
                        'upgrade_suggestion': 'Consider upgrading to a higher tier plan for increased limits.',
                        'upgrade_url': '/scrubimail/api/v1/plans/',
                    })
            except Exception:
                pass
        
        # Add wait time if available
        if hasattr(exc, 'wait'):
            wait_time = exc.wait
            if wait_time:
                custom_response_data['retry_after'] = int(wait_time)
                custom_response_data['retry_after_human'] = format_wait_time(wait_time)
        
        return Response(custom_response_data, status=status.HTTP_429_TOO_MANY_REQUESTS)
    
    return response


def format_wait_time(seconds):
    """Format wait time in human-readable format"""
    if seconds < 60:
        return f"{int(seconds)} seconds"
    elif seconds < 3600:
        minutes = int(seconds / 60)
        return f"{minutes} minute{'s' if minutes != 1 else ''}"
    else:
        hours = int(seconds / 3600)
        return f"{hours} hour{'s' if hours != 1 else ''}"
