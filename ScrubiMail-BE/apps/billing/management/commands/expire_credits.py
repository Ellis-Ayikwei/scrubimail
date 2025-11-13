from django.core.management.base import BaseCommand
from django.utils import timezone
from django.db.models import Q, Sum
from apps.billing.models import CreditTransaction, BillingProfile
from django.core.mail import send_mail
from django.conf import settings


class Command(BaseCommand):
    help = 'Expire old credits and send warnings for expiring credits'

    def add_arguments(self, parser):
        parser.add_argument(
            '--grace-days',
            type=int,
            default=7,
            help='Number of days before expiry to send warning emails',
        )
        parser.add_argument(
            '--dry-run',
            action='store_true',
            help='Run without actually expiring credits',
        )
        parser.add_argument(
            '--send-warnings',
            action='store_true',
            help='Send warning emails for expiring credits',
        )

    def handle(self, *args, **options):
        grace_days = options['grace_days']
        dry_run = options['dry_run']
        send_warnings = options['send_warnings']

        self.stdout.write(
            self.style.WARNING(
                f'Running credit expiration {"(DRY RUN)" if dry_run else ""}...'
            )
        )

        # Expire old credits
        expired_count = self.expire_old_credits(dry_run)

        # Send warnings for expiring credits
        warned_count = 0
        if send_warnings:
            warned_count = self.send_expiry_warnings(grace_days, dry_run)

        # Summary
        self.stdout.write(
            self.style.SUCCESS(
                f'\n✓ Summary:'
                f'\n  - Credits expired: {expired_count}'
                f'\n  - Warning emails sent: {warned_count}'
            )
        )

    def expire_old_credits(self, dry_run=False):
        """Expire credits that have passed their expiry date"""
        now = timezone.now()
        
        # Find all credit transactions that have expired
        expired_transactions = CreditTransaction.objects.filter(
            expiry_date__isnull=False,
            expiry_date__lte=now,
            is_expired=False,
            amount__gt=0,
            transaction_type__in=['purchase', 'bonus', 'plan_credits']
        )

        expired_count = 0
        total_expired_credits = 0

        for transaction in expired_transactions:
            if dry_run:
                self.stdout.write(
                    f'  [DRY RUN] Would expire {transaction.amount} credits '
                    f'for {transaction.billing_profile.user.email} '
                    f'(expired on {transaction.expiry_date.date()})'
                )
                expired_count += 1
                total_expired_credits += transaction.amount
            else:
                # Expire the transaction
                success = transaction.expire_credits()
                if success:
                    self.stdout.write(
                        self.style.WARNING(
                            f'  ✗ Expired {transaction.amount} credits '
                            f'for {transaction.billing_profile.user.email} '
                            f'(expired on {transaction.expiry_date.date()})'
                        )
                    )
                    expired_count += 1
                    total_expired_credits += transaction.amount

        if expired_count > 0:
            self.stdout.write(
                self.style.WARNING(
                    f'\n✓ Expired {total_expired_credits} credits '
                    f'across {expired_count} transactions'
                )
            )
        else:
            self.stdout.write(
                self.style.SUCCESS('✓ No credits to expire')
            )

        return expired_count

    def send_expiry_warnings(self, grace_days=7, dry_run=False):
        """Send warning emails for credits expiring soon"""
        from datetime import timedelta
        
        now = timezone.now()
        future_date = now + timedelta(days=grace_days)
        
        # Find transactions expiring within grace period
        expiring_transactions = CreditTransaction.objects.filter(
            expiry_date__isnull=False,
            expiry_date__gt=now,
            expiry_date__lte=future_date,
            is_expired=False,
            amount__gt=0,
            transaction_type__in=['purchase', 'bonus', 'plan_credits']
        ).select_related('billing_profile', 'billing_profile__user')

        # Group by user
        user_credits = {}
        for transaction in expiring_transactions:
            user = transaction.billing_profile.user
            if user.email not in user_credits:
                user_credits[user.email] = {
                    'user': user,
                    'profile': transaction.billing_profile,
                    'transactions': [],
                    'total_expiring': 0,
                }
            user_credits[user.email]['transactions'].append(transaction)
            user_credits[user.email]['total_expiring'] += transaction.amount

        warned_count = 0
        for email, data in user_credits.items():
            days_until = min(
                (t.expiry_date - now).days 
                for t in data['transactions']
            )
            
            if dry_run:
                self.stdout.write(
                    f'  [DRY RUN] Would send warning to {email}: '
                    f'{data["total_expiring"]} credits expiring in {days_until} days'
                )
                warned_count += 1
            else:
                # Send email warning
                sent = self.send_warning_email(
                    data['user'],
                    data['total_expiring'],
                    days_until,
                    data['transactions']
                )
                if sent:
                    self.stdout.write(
                        self.style.WARNING(
                            f'  ⚠ Sent warning to {email}: '
                            f'{data["total_expiring"]} credits expiring in {days_until} days'
                        )
                    )
                    warned_count += 1

        if warned_count > 0:
            self.stdout.write(
                self.style.SUCCESS(
                    f'\n✓ Sent {warned_count} warning emails'
                )
            )
        else:
            self.stdout.write(
                self.style.SUCCESS('✓ No warnings to send')
            )

        return warned_count

    def send_warning_email(self, user, total_credits, days_until, transactions):
        """Send warning email to user about expiring credits"""
        try:
            subject = f'⚠️ {total_credits} credits expiring in {days_until} days'
            
            # Build transaction details
            details = '\n'.join(
                f'  - {t.amount} credits from {t.description} '
                f'(expires {t.expiry_date.strftime("%Y-%m-%d")})'
                for t in transactions
            )
            
            message = f"""
Hello {user.email},

This is a reminder that you have {total_credits} credits expiring soon:

{details}

These credits will expire in {days_until} day{"s" if days_until != 1 else ""}.

To avoid losing these credits, please use them before they expire. 
You can also consider purchasing a subscription plan which includes 
credits that don't expire during your active subscription.

Visit your dashboard to check your credit balance and usage:
{settings.FRONTEND_URL}/dashboard

Best regards,
ScrubiMail Team
"""
            
            send_mail(
                subject,
                message,
                settings.DEFAULT_FROM_EMAIL,
                [user.email],
                fail_silently=False,
            )
            return True
        except Exception as e:
            self.stdout.write(
                self.style.ERROR(
                    f'  ✗ Failed to send email to {user.email}: {str(e)}'
                )
            )
            return False
