"""
Usage notification system for ScrubiMail
Sends alerts when users reach credit usage milestones
"""
from django.core.mail import send_mail
from django.template.loader import render_to_string
from django.conf import settings
from django.utils import timezone
from apps.billing.models import BillingProfile, CreditTransaction
from decimal import Decimal


class UsageNotificationService:
    """Service for sending usage-related notifications"""
    
    # Usage thresholds for alerts (percentage of credits used)
    THRESHOLDS = [50, 75, 90, 100]
    
    def __init__(self):
        self.from_email = getattr(settings, 'DEFAULT_FROM_EMAIL', 'noreply@scrubimail.com')
    
    def check_usage_alerts(self, billing_profile):
        """
        Check if user has crossed any usage thresholds and send alerts
        Returns list of thresholds that triggered alerts
        """
        triggered_alerts = []
        
        # Calculate usage percentage
        usage_percentage = billing_profile.get_usage_percentage()
        
        # Check each threshold
        for threshold in self.THRESHOLDS:
            if usage_percentage >= threshold:
                # Check if we've already sent this alert
                if not self._has_sent_alert(billing_profile, threshold):
                    self._send_usage_alert(billing_profile, threshold, usage_percentage)
                    self._mark_alert_sent(billing_profile, threshold)
                    triggered_alerts.append(threshold)
        
        return triggered_alerts
    
    def _has_sent_alert(self, billing_profile, threshold):
        """Check if alert for this threshold was already sent this billing period"""
        # Store in metadata to track sent alerts
        metadata = billing_profile.metadata or {}
        alerts_sent = metadata.get('usage_alerts_sent', {})
        
        # Get current billing period key
        period_key = self._get_period_key(billing_profile)
        
        # Check if alert was sent for this period
        period_alerts = alerts_sent.get(period_key, [])
        return threshold in period_alerts
    
    def _mark_alert_sent(self, billing_profile, threshold):
        """Mark that alert for this threshold was sent"""
        metadata = billing_profile.metadata or {}
        alerts_sent = metadata.get('usage_alerts_sent', {})
        
        period_key = self._get_period_key(billing_profile)
        
        if period_key not in alerts_sent:
            alerts_sent[period_key] = []
        
        if threshold not in alerts_sent[period_key]:
            alerts_sent[period_key].append(threshold)
        
        metadata['usage_alerts_sent'] = alerts_sent
        billing_profile.metadata = metadata
        billing_profile.save(update_fields=['metadata'])
    
    def _get_period_key(self, billing_profile):
        """Get unique key for current billing period"""
        if billing_profile.credits_reset_date:
            return billing_profile.credits_reset_date.strftime('%Y-%m')
        return timezone.now().strftime('%Y-%m')
    
    def _send_usage_alert(self, billing_profile, threshold, current_usage):
        """Send usage alert email"""
        user = billing_profile.user
        
        # Prepare context for email template
        context = {
            'user': user,
            'threshold': threshold,
            'current_usage': current_usage,
            'credits_remaining': billing_profile.credits_remaining,
            'credits_used': self._get_credits_used(billing_profile),
            'current_plan': billing_profile.current_plan,
            'upgrade_url': self._get_upgrade_url(),
            'is_critical': threshold >= 90,
        }
        
        # Choose appropriate template and subject based on threshold
        if threshold == 100:
            subject = '🚨 You\'ve used all your credits!'
            template = 'emails/usage_alert_100.html'
        elif threshold >= 90:
            subject = '⚠️ 90% of your credits used'
            template = 'emails/usage_alert_90.html'
        elif threshold >= 75:
            subject = '📊 75% of your credits used'
            template = 'emails/usage_alert_75.html'
        else:  # 50%
            subject = '📈 You\'re halfway through your credits'
            template = 'emails/usage_alert_50.html'
        
        # Add upgrade suggestions based on usage patterns
        context['upgrade_suggestion'] = self._get_upgrade_suggestion(billing_profile)
        
        # Render email
        try:
            # HTML version
            html_message = render_to_string(template, context)
            
            # Plain text fallback
            plain_message = self._create_plain_text_message(context, threshold)
            
            # Send email
            send_mail(
                subject=subject,
                message=plain_message,
                from_email=self.from_email,
                recipient_list=[user.email],
                html_message=html_message,
                fail_silently=False,
            )
            
            return True
            
        except Exception as e:
            # Log error but don't crash
            import logging
            logger = logging.getLogger(__name__)
            logger.error(f"Failed to send usage alert to {user.email}: {str(e)}")
            return False
    
    def _get_credits_used(self, billing_profile):
        """Calculate total credits used this period"""
        if billing_profile.current_plan:
            total_credits = billing_profile.current_plan.credits_per_month
            return total_credits - billing_profile.credits_remaining
        return 0
    
    def _get_upgrade_url(self):
        """Get URL for plan upgrade page"""
        # This should point to your frontend upgrade page
        base_url = getattr(settings, 'FRONTEND_URL', 'https://scrubimail.com')
        return f"{base_url}/billing/upgrade"
    
    def _get_upgrade_suggestion(self, billing_profile):
        """Generate personalized upgrade suggestion"""
        from apps.plan.models import Plan
        
        current_plan = billing_profile.current_plan
        
        if not current_plan:
            return "Consider upgrading to a paid plan for more credits."
        
        # Get next tier plan
        try:
            next_plan = Plan.objects.filter(
                is_active=True,
                credits_per_month__gt=current_plan.credits_per_month
            ).order_by('credits_per_month').first()
            
            if next_plan:
                savings_per_validation = (
                    current_plan.price / current_plan.credits_per_month -
                    next_plan.price / next_plan.credits_per_month
                )
                
                return (
                    f"Upgrade to {next_plan.name} for {next_plan.credits_per_month:,} credits/month "
                    f"and save ${savings_per_validation:.4f} per validation!"
                )
            else:
                return "You're on our highest tier plan. Contact us for enterprise options."
                
        except Exception:
            return "Check out our other plans to find the best fit for your needs."
    
    def _create_plain_text_message(self, context, threshold):
        """Create plain text version of email"""
        user = context['user']
        credits_remaining = context['credits_remaining']
        current_plan = context['current_plan']
        
        message = f"""
Hello {user.get_full_name() or user.email},

You've used {threshold}% of your email validation credits this billing period.

Credits remaining: {credits_remaining:,}
Current plan: {current_plan.name if current_plan else 'Free'}

{context['upgrade_suggestion']}

To avoid service interruption, consider upgrading your plan or purchasing additional credits.

Upgrade now: {context['upgrade_url']}

Best regards,
The ScrubiMail Team
        """.strip()
        
        return message
    
    def send_low_credits_warning(self, billing_profile, credits_threshold=100):
        """Send warning when credits fall below threshold"""
        if billing_profile.credits_remaining <= credits_threshold:
            user = billing_profile.user
            
            subject = '⚠️ Low Credits Warning'
            message = f"""
Hello {user.get_full_name() or user.email},

Your account has {billing_profile.credits_remaining} credits remaining.

To continue using ScrubiMail without interruption, please:
- Purchase additional credits: {self._get_upgrade_url()}/credits
- Upgrade your plan: {self._get_upgrade_url()}

Best regards,
The ScrubiMail Team
            """.strip()
            
            try:
                send_mail(
                    subject=subject,
                    message=message,
                    from_email=self.from_email,
                    recipient_list=[user.email],
                    fail_silently=False,
                )
                return True
            except Exception as e:
                import logging
                logger = logging.getLogger(__name__)
                logger.error(f"Failed to send low credits warning: {str(e)}")
                return False
        
        return False
    
    def send_expiring_credits_notification(self, billing_profile, days=7):
        """Send notification about expiring credits"""
        expiring_info = billing_profile.get_expiring_credits(days=days)
        
        if expiring_info['total_credits'] > 0:
            user = billing_profile.user
            days_left = expiring_info['days_until_expiry']
            credits = expiring_info['total_credits']
            
            subject = f'⏰ {credits:,} credits expiring in {days_left} days'
            message = f"""
Hello {user.get_full_name() or user.email},

You have {credits:,} credits that will expire in {days_left} days.

Don't let your credits go to waste! Use them before they expire or consider:
- Running pending email validation campaigns
- Upgrading to a plan with non-expiring credits

View your credits: {self._get_upgrade_url()}/credits

Best regards,
The ScrubiMail Team
            """.strip()
            
            try:
                send_mail(
                    subject=subject,
                    message=message,
                    from_email=self.from_email,
                    recipient_list=[user.email],
                    fail_silently=False,
                )
                return True
            except Exception as e:
                import logging
                logger = logging.getLogger(__name__)
                logger.error(f"Failed to send expiring credits notification: {str(e)}")
                return False
        
        return False
