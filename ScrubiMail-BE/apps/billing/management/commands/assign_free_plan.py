from django.core.management.base import BaseCommand
from django.contrib.auth import get_user_model
from apps.billing.models import BillingProfile
from apps.plan.models import Plan

User = get_user_model()


class Command(BaseCommand):
    help = 'Assign Free plan to all users who do not have a plan assigned'

    def add_arguments(self, parser):
        parser.add_argument(
            '--dry-run',
            action='store_true',
            help='Show what would be done without making changes',
        )

    def handle(self, *args, **options):
        dry_run = options['dry_run']
        
        # Get Free plan (should exist if setup_plans was run, otherwise create with defaults)
        free_plan, created = Plan.objects.get_or_create(
            name='Free',
            defaults={
                'description': 'Perfect for getting started with email validation',
                'price': 0.00,
                'currency': 'USD',
                'credits_per_month': 100,  # Default, can be updated by setup_plans command
                'additional_credit_price': 0.01,
                'max_api_calls_per_hour': 10,
                'max_bulk_emails': 50,
                'supports_api': True,
                'supports_bulk': False,
                'priority_support': False,
                'trial_days': 0,
                'is_active': True,
            }
        )
        
        if created:
            self.stdout.write(
                self.style.SUCCESS(f'Created Free plan: {free_plan.name}')
            )
        else:
            self.stdout.write(
                self.style.SUCCESS(f'Free plan already exists: {free_plan.name}')
            )
        
        # Get all users
        all_users = User.objects.all()
        total_users = all_users.count()
        
        # Get users without billing profiles or without plans
        users_without_plans = []
        for user in all_users:
            try:
                profile = user.billing_profile
                if not profile.current_plan:
                    users_without_plans.append(user)
            except BillingProfile.DoesNotExist:
                users_without_plans.append(user)
        
        self.stdout.write(
            self.style.WARNING(
                f'\nFound {len(users_without_plans)} users without plans out of {total_users} total users'
            )
        )
        
        if dry_run:
            self.stdout.write(
                self.style.WARNING('\nDRY RUN MODE - No changes will be made\n')
            )
            for user in users_without_plans:
                self.stdout.write(f'  Would assign Free plan to: {user.email}')
        else:
            assigned_count = 0
            created_count = 0
            
            for user in users_without_plans:
                try:
                    profile = user.billing_profile
                    # Profile exists but no plan
                    profile.current_plan = free_plan
                    if profile.credits_remaining == 0 or profile.credits_remaining < free_plan.credits_per_month:
                        profile.credits_remaining = free_plan.credits_per_month
                    profile.save(update_fields=['current_plan', 'credits_remaining'])
                    assigned_count += 1
                    self.stdout.write(
                        self.style.SUCCESS(f'  Assigned Free plan to: {user.email}')
                    )
                except BillingProfile.DoesNotExist:
                    # Create new billing profile with Free plan
                    BillingProfile.objects.create(
                        user=user,
                        current_plan=free_plan,
                        credits_remaining=free_plan.credits_per_month,
                        billing_status='active'
                    )
                    created_count += 1
                    self.stdout.write(
                        self.style.SUCCESS(f'  Created billing profile with Free plan for: {user.email}')
                    )
            
            self.stdout.write(
                self.style.SUCCESS(
                    f'\n✅ Complete! Assigned plans to {assigned_count} existing profiles, '
                    f'created {created_count} new profiles.'
                )
            )

