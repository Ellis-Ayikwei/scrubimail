from django.core.management.base import BaseCommand
from django.contrib.auth import get_user_model
from apps.billing.models import BillingProfile
from decimal import Decimal

User = get_user_model()


class Command(BaseCommand):
    help = 'Grant bonus credits to users (for promotions, referrals, support, etc.)'

    def add_arguments(self, parser):
        parser.add_argument(
            'email',
            type=str,
            nargs='?',
            help='User email address (or use --all for all users)'
        )
        parser.add_argument(
            '--credits',
            type=int,
            default=50,
            help='Number of credits to grant (default: 50)'
        )
        parser.add_argument(
            '--reason',
            type=str,
            default='Promotional bonus',
            help='Reason for granting credits'
        )
        parser.add_argument(
            '--expiry-days',
            type=int,
            default=30,
            help='Days until credits expire (default: 30, 0 = no expiry)'
        )
        parser.add_argument(
            '--all',
            action='store_true',
            help='Grant credits to ALL active users'
        )
        parser.add_argument(
            '--new-users',
            action='store_true',
            help='Grant credits only to users registered in last 7 days'
        )

    def handle(self, *args, **options):
        credits = options['credits']
        reason = options['reason']
        expiry_days = options['expiry_days'] if options['expiry_days'] > 0 else None
        
        # Validate credits amount
        if credits <= 0:
            self.stdout.write(self.style.ERROR('Credits must be greater than 0'))
            return
        
        if credits > 10000:
            confirm = input(f'⚠️  You are granting {credits:,} credits. Confirm? (yes/no): ')
            if confirm.lower() != 'yes':
                self.stdout.write(self.style.WARNING('Cancelled'))
                return
        
        # Determine target users
        if options['all']:
            users = User.objects.filter(is_active=True)
            self.stdout.write(f'Targeting ALL {users.count()} active users...\n')
        elif options['new_users']:
            from django.utils import timezone
            from datetime import timedelta
            cutoff_date = timezone.now() - timedelta(days=7)
            users = User.objects.filter(
                is_active=True,
                date_joined__gte=cutoff_date
            )
            self.stdout.write(f'Targeting {users.count()} new users (last 7 days)...\n')
        else:
            email = options.get('email')
            if not email:
                self.stdout.write(
                    self.style.ERROR('Please provide user email or use --all/--new-users')
                )
                return
            
            try:
                users = User.objects.filter(email=email)
                if not users.exists():
                    self.stdout.write(self.style.ERROR(f'User not found: {email}'))
                    return
            except Exception as e:
                self.stdout.write(self.style.ERROR(f'Error: {str(e)}'))
                return
        
        # Confirm bulk operation
        if users.count() > 1:
            total_cost = credits * users.count() * 0.01  # Assuming $0.01/credit value
            confirm = input(
                f'\n⚠️  About to grant {credits:,} credits to {users.count()} users '
                f'(~${total_cost:.2f} value). Continue? (yes/no): '
            )
            if confirm.lower() != 'yes':
                self.stdout.write(self.style.WARNING('Cancelled'))
                return
        
        # Grant credits
        success_count = 0
        error_count = 0
        
        self.stdout.write('\nGranting credits...\n')
        
        for user in users:
            try:
                # Get or create billing profile
                billing_profile, created = BillingProfile.objects.get_or_create(
                    user=user,
                    defaults={
                        'credits_remaining': 0,
                        'billing_status': 'active'
                    }
                )
                
                # Add credits
                billing_profile.add_credits(
                    amount=credits,
                    description=reason,
                    payment_reference=f'BONUS-{user.id}',
                    expiry_days=expiry_days
                )
                
                success_count += 1
                expiry_text = f' (expires in {expiry_days} days)' if expiry_days else ' (no expiry)'
                
                self.stdout.write(
                    self.style.SUCCESS(
                        f'✓ {user.email:40s} | +{credits:,} credits{expiry_text}'
                    )
                )
                
            except Exception as e:
                error_count += 1
                self.stdout.write(
                    self.style.ERROR(f'✗ {user.email:40s} | Error: {str(e)}')
                )
        
        # Summary
        self.stdout.write('\n' + '='*80)
        self.stdout.write(self.style.SUCCESS(f'\n✓ Successfully granted credits to {success_count} users'))
        
        if error_count > 0:
            self.stdout.write(self.style.ERROR(f'✗ Failed for {error_count} users'))
        
        total_granted = success_count * credits
        estimated_value = total_granted * 0.01
        
        self.stdout.write(f'\nTotal credits granted: {total_granted:,}')
        self.stdout.write(f'Estimated value: ${estimated_value:.2f}')
        self.stdout.write(f'Reason: {reason}')
        if expiry_days:
            self.stdout.write(f'Expiry: {expiry_days} days\n')
        else:
            self.stdout.write('Expiry: None (permanent)\n')
