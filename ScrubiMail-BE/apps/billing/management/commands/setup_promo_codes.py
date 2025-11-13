from django.core.management.base import BaseCommand
from django.utils import timezone
from datetime import timedelta
from decimal import Decimal
from apps.billing.models import PromoCode


class Command(BaseCommand):
    help = 'Set up default promotional codes'

    def handle(self, *args, **options):
        self.stdout.write('Setting up default promo codes...')

        # Calculate dates
        now = timezone.now()
        next_month = now + timedelta(days=30)
        next_quarter = now + timedelta(days=90)
        next_year = now + timedelta(days=365)

        promo_codes = [
            {
                'code': 'WELCOME10',
                'description': 'Welcome discount for new users',
                'discount_type': 'percentage',
                'discount_value': Decimal('10.00'),
                'max_uses': None,  # Unlimited
                'max_uses_per_user': 1,
                'valid_from': now,
                'valid_until': None,  # Never expires
                'first_purchase_only': True,
                'is_active': True,
                'campaign_name': 'Welcome Campaign',
            },
            {
                'code': 'SAVE20',
                'description': '20% off any purchase',
                'discount_type': 'percentage',
                'discount_value': Decimal('20.00'),
                'max_uses': 500,
                'max_uses_per_user': 2,
                'valid_from': now,
                'valid_until': next_quarter,
                'minimum_purchase_amount': Decimal('50.00'),
                'is_active': True,
                'campaign_name': 'Quarterly Promotion',
            },
            {
                'code': 'BONUS100',
                'description': '100 free bonus credits',
                'discount_type': 'free_credits',
                'discount_value': Decimal('100.00'),
                'max_uses': 1000,
                'max_uses_per_user': 1,
                'valid_from': now,
                'valid_until': next_month,
                'is_active': True,
                'campaign_name': 'Credits Bonus Campaign',
            },
            {
                'code': 'FIXED50',
                'description': '$50 off any package',
                'discount_type': 'fixed',
                'discount_value': Decimal('50.00'),
                'max_uses': 100,
                'max_uses_per_user': 1,
                'valid_from': now,
                'valid_until': next_quarter,
                'minimum_purchase_amount': Decimal('100.00'),
                'is_active': True,
                'campaign_name': 'Big Spender Discount',
            },
            {
                'code': 'EARLYBIRD',
                'description': '30% off for early adopters',
                'discount_type': 'percentage',
                'discount_value': Decimal('30.00'),
                'max_uses': 50,
                'max_uses_per_user': 1,
                'valid_from': now,
                'valid_until': next_month,
                'first_purchase_only': True,
                'is_active': True,
                'campaign_name': 'Early Adopter Program',
            },
            {
                'code': 'BLACKFRIDAY',
                'description': 'Black Friday mega sale - 50% off',
                'discount_type': 'percentage',
                'discount_value': Decimal('50.00'),
                'max_uses': 1000,
                'max_uses_per_user': 3,
                'valid_from': now,
                'valid_until': now + timedelta(days=7),
                'is_active': False,  # Inactive by default
                'campaign_name': 'Black Friday 2025',
            },
        ]

        for promo_data in promo_codes:
            promo_code, created = PromoCode.objects.update_or_create(
                code=promo_data['code'],
                defaults=promo_data
            )
            
            if created:
                self.stdout.write(
                    self.style.SUCCESS(
                        f'✓ Created promo code: {promo_code.code} '
                        f'({promo_code.discount_type}: {promo_code.discount_value})'
                    )
                )
            else:
                self.stdout.write(
                    self.style.WARNING(
                        f'↻ Updated promo code: {promo_code.code} '
                        f'({promo_code.discount_type}: {promo_code.discount_value})'
                    )
                )

        self.stdout.write(
            self.style.SUCCESS(
                f'\n✓ Successfully set up {len(promo_codes)} promo codes'
            )
        )
