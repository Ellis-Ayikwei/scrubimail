from django.core.management.base import BaseCommand
from django.utils import timezone
from apps.billing.models import BillingProfile


class Command(BaseCommand):
    help = 'Reset monthly usage (credits_used_this_month) and restore credits_remaining for all users'

    def add_arguments(self, parser):
        parser.add_argument(
            '--dry-run',
            action='store_true',
            help='Show what would be done without making changes',
        )
        parser.add_argument(
            '--reset-credits',
            action='store_true',
            help='Also reset credits_remaining to plan default (default: only reset usage counter)',
        )

    def handle(self, *args, **options):
        dry_run = options['dry_run']
        reset_credits = options['reset_credits']
        
        # Get all billing profiles
        profiles = BillingProfile.objects.select_related('current_plan').all()
        total_profiles = profiles.count()
        
        self.stdout.write(
            self.style.WARNING(
                f'\nFound {total_profiles} billing profiles to process'
            )
        )
        
        if dry_run:
            self.stdout.write(
                self.style.WARNING('\nDRY RUN MODE - No changes will be made\n')
            )
        
        reset_count = 0
        no_plan_count = 0
        
        for profile in profiles:
            if profile.current_plan:
                # User has a plan - use the reset_monthly_credits method
                if dry_run:
                    self.stdout.write(
                        f'  Would reset usage for: {profile.user.email} '
                        f'(Plan: {profile.current_plan.name}, '
                        f'Current usage: {profile.credits_used_this_month}, '
                        f'Credits remaining: {profile.credits_remaining})'
                    )
                else:
                    if reset_credits:
                        # Full reset: usage counter + credits to plan default
                        profile.reset_monthly_credits()
                        self.stdout.write(
                            self.style.SUCCESS(
                                f'  Reset usage and credits for: {profile.user.email} '
                                f'(Plan: {profile.current_plan.name}, '
                                f'Credits restored to: {profile.current_plan.credits_per_month})'
                            )
                        )
                    else:
                        # Only reset usage counter, keep current credits
                        profile.credits_used_this_month = 0
                        profile.credits_reset_date = timezone.now()
                        profile.save(update_fields=['credits_used_this_month', 'credits_reset_date'])
                        self.stdout.write(
                            self.style.SUCCESS(
                                f'  Reset usage counter for: {profile.user.email} '
                                f'(Plan: {profile.current_plan.name}, '
                                f'Credits remaining unchanged: {profile.credits_remaining})'
                            )
                        )
                    reset_count += 1
            else:
                # User has no plan - just reset usage counter
                no_plan_count += 1
                if dry_run:
                    self.stdout.write(
                        f'  Would reset usage for: {profile.user.email} '
                        f'(No plan assigned, Current usage: {profile.credits_used_this_month})'
                    )
                else:
                    profile.credits_used_this_month = 0
                    profile.credits_reset_date = timezone.now()
                    profile.save(update_fields=['credits_used_this_month', 'credits_reset_date'])
                    self.stdout.write(
                        self.style.SUCCESS(
                            f'  Reset usage counter for: {profile.user.email} (No plan assigned)'
                        )
                    )
                    reset_count += 1
        
        if not dry_run:
            self.stdout.write(
                self.style.SUCCESS(
                    f'\n✅ Complete! Reset usage for {reset_count} users '
                    f'({total_profiles - no_plan_count} with plans, {no_plan_count} without plans)'
                )
            )
            if reset_credits:
                self.stdout.write(
                    self.style.SUCCESS(
                        '  Credits were also reset to plan defaults'
                    )
                )
            else:
                self.stdout.write(
                    self.style.WARNING(
                        '  Note: Only usage counters were reset. Credits remaining were preserved.'
                    )
                )
                self.stdout.write(
                    self.style.WARNING(
                        '  Use --reset-credits flag to also restore credits to plan defaults.'
                    )
                )

