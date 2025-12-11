from django.core.management.base import BaseCommand
from apps.billing.models import CreditPackage
from decimal import Decimal


class Command(BaseCommand):
    help = 'Set up default credit packages including free, cheap, and premium tiers'

    def add_arguments(self, parser):
        parser.add_argument(
            '--clear',
            action='store_true',
            help='Clear existing packages before creating new ones',
        )

    def handle(self, *args, **options):
        if options['clear']:
            count = CreditPackage.objects.all().count()
            CreditPackage.objects.all().delete()
            self.stdout.write(self.style.WARNING(f'Cleared {count} existing packages'))

        self.stdout.write('Setting up credit packages...\n')

        packages = [
            # FREE BONUS CREDITS (for promotions/referrals)
            {
                'name': 'Free Bonus Pack',
                'description': 'Complimentary credits for new users, referrals, or promotions',
                'credits': 50,
                'price': Decimal('0.00'),
                'original_price': Decimal('0.00'),
                'discount_percentage': Decimal('0.00'),
                'expiry_days': 30,
                'is_active': True,
                'is_featured': False,
                'sort_order': 0,
                'max_purchases_per_user': 1,
                'metadata': {
                    'type': 'bonus',
                    'use_case': 'promotions, referrals, welcome credits'
                }
            },
            
            # MICRO PACKAGE (Cheapest - Test the waters)
            {
                'name': 'Micro Pack',
                'description': 'Test our service with minimal commitment - perfect for small tasks',
                'credits': 100,
                'price': Decimal('1.00'),
                'original_price': Decimal('1.00'),
                'discount_percentage': Decimal('0.00'),
                'expiry_days': 30,
                'is_active': True,
                'is_featured': False,
                'sort_order': 1,
                'max_purchases_per_user': 5,
                'metadata': {
                    'price_per_credit': 0.01,
                    'best_for': 'testing, one-time validations'
                }
            },
            
            # STARTER PACKAGE (Entry level with value)
            {
                'name': 'Starter Pack',
                'description': 'Perfect for getting started - 25% savings on regular price',
                'credits': 1000,
                'price': Decimal('7.50'),
                'original_price': Decimal('10.00'),
                'discount_percentage': Decimal('25.00'),
                'expiry_days': 90,
                'is_active': True,
                'is_featured': False,
                'sort_order': 2,
                'max_purchases_per_user': 10,
                'metadata': {
                    'price_per_credit': 0.0075,
                    'best_for': 'small businesses, freelancers'
                }
            },
            # GROWTH PACKAGE (Most popular)
            {
                'name': 'Growth Pack',
                'description': 'Most popular! Great value for growing businesses - 30% savings',
                'credits': 5000,
                'price': Decimal('30.00'),
                'original_price': Decimal('50.00'),
                'discount_percentage': Decimal('40.00'),
                'expiry_days': 120,
                'is_active': True,
                'is_featured': True,
                'sort_order': 3,
                'max_purchases_per_user': 10,
                'metadata': {
                    'price_per_credit': 0.006,
                    'best_for': 'growing businesses, marketing teams',
                    'badge': 'MOST POPULAR'
                }
            },
            
            # BUSINESS PACKAGE (Professional tier)
            {
                'name': 'Business Pack',
                'description': 'Best value! Ideal for regular business needs - 35% savings',
                'credits': 10000,
                'price': Decimal('50.00'),
                'original_price': Decimal('100.00'),
                'discount_percentage': Decimal('50.00'),
                'expiry_days': 180,
                'is_active': True,
                'is_featured': True,
                'sort_order': 4,
                'max_purchases_per_user': 10,
                'metadata': {
                    'price_per_credit': 0.005,
                    'best_for': 'established businesses, agencies',
                    'badge': 'BEST VALUE'
                }
            },
            
            # PRO PACKAGE (High volume)
            {
                'name': 'Pro Pack',
                'description': 'Professional package for high-volume needs - 40% savings',
                'credits': 25000,
                'price': Decimal('100.00'),
                'original_price': Decimal('250.00'),
                'discount_percentage': Decimal('60.00'),
                'expiry_days': 240,
                'is_active': True,
                'is_featured': True,
                'sort_order': 5,
                'max_purchases_per_user': 8,
                'metadata': {
                    'price_per_credit': 0.004,
                    'best_for': 'high-volume users, SaaS platforms'
                }
            },
            
            # ENTERPRISE PACKAGE (Large scale)
            {
                'name': 'Enterprise Pack',
                'description': 'Maximum value for large-scale validation campaigns - 45% savings',
                'credits': 50000,
                'price': Decimal('175.00'),
                'original_price': Decimal('500.00'),
                'discount_percentage': Decimal('65.00'),
                'expiry_days': 365,
                'is_active': True,
                'is_featured': True,
                'sort_order': 6,
                'max_purchases_per_user': 5,
                'metadata': {
                    'price_per_credit': 0.0035,
                    'best_for': 'enterprises, large campaigns'
                }
            },
            
            # MEGA PACKAGE (Ultimate)
            {
                'name': 'Mega Pack',
                'description': 'Ultimate package for massive validation needs - 50% savings',
                'credits': 100000,
                'price': Decimal('300.00'),
                'original_price': Decimal('1000.00'),
                'discount_percentage': Decimal('70.00'),
                'expiry_days': 365,
                'is_active': True,
                'is_featured': False,
                'sort_order': 7,
                'max_purchases_per_user': 3,
                'metadata': {
                    'price_per_credit': 0.003,
                    'best_for': 'enterprise level, bulk operations'
                }
            },
            
            # CUSTOM PACKAGE (Negotiable for VIP clients)
            {
                'name': 'Custom Pack',
                'description': 'Custom credits for special arrangements - Contact sales for pricing',
                'credits': 500,  # Placeholder, adjusted per customer
                'price': Decimal('5.00'),  # Placeholder
                'original_price': Decimal('5.00'),
                'discount_percentage': Decimal('0.00'),
                'expiry_days': 365,
                'is_active': False,  # Only activated for specific customers
                'is_featured': False,
                'sort_order': 99,
                'max_purchases_per_user': None,  # Unlimited for custom deals
                'metadata': {
                    'type': 'custom',
                    'requires_approval': True,
                    'contact': 'sales@scrubimail.com'
                }
            },
        ]

        created_count = 0
        updated_count = 0
        
        for package_data in packages:
            package, created = CreditPackage.objects.update_or_create(
                name=package_data['name'],
                defaults=package_data
            )
            
            price_per_credit = float(package.get_price_per_credit())
            
            if created:
                created_count += 1
                self.stdout.write(
                    self.style.SUCCESS(
                        f'✓ Created: {package.name:20s} | '
                        f'{package.credits:,} credits | '
                        f'${package.price:>7} | '
                        f'${price_per_credit:.4f}/credit | '
                        f'{package.expiry_days} days'
                    )
                )
            else:
                updated_count += 1
                self.stdout.write(
                    self.style.WARNING(
                        f'↻ Updated: {package.name:20s} | '
                        f'{package.credits:,} credits | '
                        f'${package.price:>7} | '
                        f'${price_per_credit:.4f}/credit | '
                        f'{package.expiry_days} days'
                    )
                )
        
        self.stdout.write('\n' + '='*80)
        self.stdout.write(
            self.style.SUCCESS(
                f'\n✓ Setup complete! Created {created_count} | Updated {updated_count}\n'
            )
        )
        
        # Show summary stats
        total_packages = CreditPackage.objects.filter(is_active=True).count()
        featured_packages = CreditPackage.objects.filter(is_active=True, is_featured=True).count()
        
        self.stdout.write(f'\nPackage Summary:')
        self.stdout.write(f'  Total active: {total_packages}')
        self.stdout.write(f'  Featured: {featured_packages}')
        self.stdout.write(f'  Cheapest: $1.00 (Micro Pack - 100 credits)')
        self.stdout.write(f'  Best value: $0.003/credit (Mega Pack - 100,000 credits)\n')

        self.stdout.write(
            self.style.SUCCESS(
                f'\n✓ Successfully set up {len(packages)} credit packages'
            )
        )
