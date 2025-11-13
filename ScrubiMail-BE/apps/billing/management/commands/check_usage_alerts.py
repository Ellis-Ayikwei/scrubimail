from django.core.management.base import BaseCommand
from apps.billing.models import BillingProfile
from apps.billing.notifications import UsageNotificationService


class Command(BaseCommand):
    help = 'Check usage levels and send alerts for users approaching credit limits'

    def add_arguments(self, parser):
        parser.add_argument(
            '--dry-run',
            action='store_true',
            help='Show what alerts would be sent without actually sending them',
        )
        parser.add_argument(
            '--user-email',
            type=str,
            help='Check specific user by email',
        )
        parser.add_argument(
            '--threshold',
            type=int,
            choices=[50, 75, 90, 100],
            help='Only check for specific threshold',
        )

    def handle(self, *args, **options):
        dry_run = options['dry_run']
        user_email = options.get('user_email')
        specific_threshold = options.get('threshold')
        
        self.stdout.write(self.style.NOTICE('Checking usage alerts...'))
        if dry_run:
            self.stdout.write(self.style.WARNING('DRY RUN MODE - No emails will be sent'))
        
        # Get billing profiles to check
        profiles = BillingProfile.objects.select_related('user', 'current_plan').all()
        
        if user_email:
            profiles = profiles.filter(user__email=user_email)
        
        # Only check active users with credits
        profiles = profiles.exclude(billing_status='canceled')
        
        notification_service = UsageNotificationService()
        
        total_checked = 0
        total_alerts = 0
        alerts_by_threshold = {50: 0, 75: 0, 90: 0, 100: 0}
        
        for profile in profiles:
            total_checked += 1
            
            # Calculate usage percentage
            usage_percentage = profile.get_usage_percentage()
            
            if dry_run:
                # Show what would happen
                for threshold in notification_service.THRESHOLDS:
                    if specific_threshold and threshold != specific_threshold:
                        continue
                    
                    if usage_percentage >= threshold:
                        if not notification_service._has_sent_alert(profile, threshold):
                            self.stdout.write(
                                f"  [DRY RUN] Would send {threshold}% alert to {profile.user.email} "
                                f"(usage: {usage_percentage:.1f}%, credits: {profile.credits_remaining})"
                            )
                            total_alerts += 1
                            alerts_by_threshold[threshold] += 1
            else:
                # Actually send alerts
                if specific_threshold:
                    # Check only specific threshold
                    if usage_percentage >= specific_threshold:
                        if not notification_service._has_sent_alert(profile, specific_threshold):
                            notification_service._send_usage_alert(
                                profile, 
                                specific_threshold, 
                                usage_percentage
                            )
                            notification_service._mark_alert_sent(profile, specific_threshold)
                            
                            self.stdout.write(
                                self.style.SUCCESS(
                                    f"  ✓ Sent {specific_threshold}% alert to {profile.user.email}"
                                )
                            )
                            total_alerts += 1
                            alerts_by_threshold[specific_threshold] += 1
                else:
                    # Check all thresholds
                    triggered = notification_service.check_usage_alerts(profile)
                    
                    if triggered:
                        total_alerts += len(triggered)
                        for threshold in triggered:
                            alerts_by_threshold[threshold] += 1
                            self.stdout.write(
                                self.style.SUCCESS(
                                    f"  ✓ Sent {threshold}% alert to {profile.user.email} "
                                    f"(usage: {usage_percentage:.1f}%)"
                                )
                            )
        
        # Summary
        self.stdout.write(self.style.SUCCESS('\n' + '='*60))
        self.stdout.write(self.style.SUCCESS('USAGE ALERTS SUMMARY'))
        self.stdout.write(self.style.SUCCESS('='*60))
        
        self.stdout.write(f'Total profiles checked: {total_checked}')
        self.stdout.write(f'Total alerts sent: {total_alerts}')
        
        if total_alerts > 0:
            self.stdout.write('\nAlerts by threshold:')
            for threshold, count in alerts_by_threshold.items():
                if count > 0:
                    self.stdout.write(f'  {threshold}% threshold: {count} alerts')
        
        if dry_run:
            self.stdout.write(
                self.style.WARNING(
                    '\nThis was a dry run. Use without --dry-run to actually send emails.'
                )
            )
        
        self.stdout.write(self.style.SUCCESS('\n' + '='*60 + '\n'))
