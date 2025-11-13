from django.core.management.base import BaseCommand
from apps.billing.models import CreditPackage
from decimal import Decimal


class Command(BaseCommand):
    help = 'Set up default credit packages'

    def handle(self, *args, **options):
        self.stdout.write('Setting up default credit packages...')

        packages = [
            {
                'name': 'Starter Pack',
                'description': 'Perfect for getting started with extra validations',
                'credits': 1000,
                'price': Decimal('15.00'),
                'original_price': Decimal('20.00'),
                'discount_percentage': Decimal('25.00'),
                'expiry_days': 90,
                'is_active': True,
                'is_featured': False,
                'sort_order': 1,
                'max_purchases_per_user': 10,
            },
            {
                'name': 'Growth Pack',
                'description': 'Great for growing businesses with higher validation needs',
                'credits': 5000,
                'price': Decimal('65.00'),
                'original_price': Decimal('85.00'),
                'discount_percentage': Decimal('23.53'),
                'expiry_days': 120,
                'is_active': True,
                'is_featured': True,
                'sort_order': 2,
                'max_purchases_per_user': 10,
            },
            {
                'name': 'Business Pack',
                'description': 'Ideal for businesses with regular validation requirements',
                'credits': 10000,
                'price': Decimal('120.00'),
                'original_price': Decimal('160.00'),
                'discount_percentage': Decimal('25.00'),
                'expiry_days': 180,
                'is_active': True,
                'is_featured': True,
                'sort_order': 3,
                'max_purchases_per_user': 10,
            },
            {
                'name': 'Enterprise Pack',
                'description': 'Maximum value for large-scale email validation campaigns',
                'credits': 50000,
                'price': Decimal('500.00'),
                'original_price': Decimal('700.00'),
                'discount_percentage': Decimal('28.57'),
                'expiry_days': 365,
                'is_active': True,
                'is_featured': True,
                'sort_order': 4,
                'max_purchases_per_user': 5,
            },
            {
                'name': 'Mega Pack',
                'description': 'Ultimate package for enterprise-level validation needs',
                'credits': 100000,
                'price': Decimal('900.00'),
                'original_price': Decimal('1300.00'),
                'discount_percentage': Decimal('30.77'),
                'expiry_days': 365,
                'is_active': True,
                'is_featured': False,
                'sort_order': 5,
                'max_purchases_per_user': 3,
            },
        ]

        for package_data in packages:
            package, created = CreditPackage.objects.update_or_create(
                name=package_data['name'],
                defaults=package_data
            )
            
            if created:
                self.stdout.write(
                    self.style.SUCCESS(
                        f'✓ Created package: {package.name} '
                        f'({package.credits} credits for ${package.price})'
                    )
                )
            else:
                self.stdout.write(
                    self.style.WARNING(
                        f'↻ Updated package: {package.name} '
                        f'({package.credits} credits for ${package.price})'
                    )
                )

        self.stdout.write(
            self.style.SUCCESS(
                f'\n✓ Successfully set up {len(packages)} credit packages'
            )
        )
