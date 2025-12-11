from django.core.management.base import BaseCommand
from apps.plan.models import Plan
from decimal import Decimal


class Command(BaseCommand):
    help = 'Set up default subscription plans for ScrubiMail (monthly/yearly)'

    def add_arguments(self, parser):
        parser.add_argument(
            '--clear',
            action='store_true',
            help='Clear existing plans before creating new ones',
        )

    def handle(self, *args, **options):
        if options['clear']:
            count = Plan.objects.all().count()
            Plan.objects.all().delete()
            self.stdout.write(self.style.WARNING(f'Cleared {count} existing plans'))

        self.stdout.write('Setting up subscription plans...\n')
        plans_data = [
            # FREE TIER - For testing and evaluation
            {
                'name': 'Free',
                'description': 'Perfect for getting started with email validation. Test our service with no commitment.',
                'price': Decimal('0.00'),
                'yearly_price': Decimal('0.00'),
                'currency': 'USD',
                'credits_per_month': 100,  # Limited free credits
                'additional_credit_price': Decimal('0.01'),  # High overage price to encourage upgrade
                'max_api_calls_per_hour': 10,
                'max_bulk_emails': 50,
                'supports_api': True,
                'supports_bulk': False,
                'priority_support': False,
                'trial_days': 0,
                'is_active': True,
                'features': {
                    'validations_per_month': '100',
                    'api_access': 'Basic',
                    'bulk_validation': False,
                    'priority_support': False,
                    'analytics': 'Basic',
                    'smtp_verification': False,
                    'disposable_detection': True,
                    'dns_validation': True,
                    'rate_limit': '10/hour',
                    'support': 'Community forum',
                }
            },
            
            # STARTER TIER - Entry level paid plan
            {
                'name': 'Starter',
                'description': 'Ideal for freelancers and small businesses starting their email marketing journey.',
                'price': Decimal('9.00'),
                'yearly_price': Decimal('90.00'),  # 2 months free
                'currency': 'USD',
                'credits_per_month': 10000,
                'additional_credit_price': Decimal('0.0015'),  # Reasonable overage
                'max_api_calls_per_hour': 100,
                'max_bulk_emails': 5000,
                'supports_api': True,
                'supports_bulk': True,
                'priority_support': False,
                'trial_days': 7,
                'is_active': True,
                'features': {
                    'validations_per_month': '10,000',
                    'api_access': 'Full',
                    'bulk_validation': True,
                    'priority_support': False,
                    'analytics': 'Standard',
                    'smtp_verification': True,
                    'disposable_detection': True,
                    'role_based_detection': True,
                    'dns_validation': True,
                    'catch_all_detection': True,
                    'rate_limit': '100/hour',
                    'support': 'Email support',
                    'overage_cost': '$0.0015/credit',
                }
            },
            # PROFESSIONAL TIER - For growing businesses and agencies
            {
                'name': 'Professional',
                'description': 'Advanced features for marketing teams, agencies, and growing businesses.',
                'price': Decimal('29.00'),
                'yearly_price': Decimal('290.00'),  # 2 months free
                'currency': 'USD',
                'credits_per_month': 50000,
                'additional_credit_price': Decimal('0.0009'),  # Better overage rate
                'max_api_calls_per_hour': 500,
                'max_bulk_emails': 25000,
                'supports_api': True,
                'supports_bulk': True,
                'priority_support': True,
                'trial_days': 14,
                'is_active': True,
                'features': {
                    'validations_per_month': '50,000',
                    'api_access': 'Full + Webhooks',
                    'bulk_validation': True,
                    'priority_support': True,
                    'analytics': 'Advanced',
                    'webhooks': True,
                    'csv_export': True,
                    'smtp_verification': True,
                    'catch_all_detection': True,
                    'spam_trap_detection': True,
                    'domain_reputation': True,
                    'role_based_detection': True,
                    'disposable_detection': True,
                    'dns_validation': True,
                    'advanced_analytics': True,
                    'custom_validation_rules': True,
                    'rate_limit': '500/hour',
                    'support': 'Priority email & chat',
                    'overage_cost': '$0.0009/credit',
                }
            },
            
            # BUSINESS TIER - For established businesses
            {
                'name': 'Business',
                'description': 'Comprehensive solution for established businesses with high validation needs.',
                'price': Decimal('49.00'),
                'yearly_price': Decimal('490.00'),  # 2 months free
                'currency': 'USD',
                'credits_per_month': 150000,
                'additional_credit_price': Decimal('0.0006'),  # Even better overage
                'max_api_calls_per_hour': 1000,
                'max_bulk_emails': 100000,
                'supports_api': True,
                'supports_bulk': True,
                'priority_support': True,
                'trial_days': 14,
                'is_active': True,
                'features': {
                    'validations_per_month': '150,000',
                    'api_access': 'Full + Advanced',
                    'bulk_validation': True,
                    'priority_support': True,
                    'analytics': 'Advanced + Insights',
                    'webhooks': True,
                    'csv_export': True,
                    'api_export': True,
                    'smtp_verification': True,
                    'catch_all_detection': True,
                    'spam_trap_detection': True,
                    'domain_reputation': True,
                    'role_based_detection': True,
                    'disposable_detection': True,
                    'dns_validation': True,
                    'advanced_analytics': True,
                    'custom_validation_rules': True,
                    'custom_integrations': True,
                    'rate_limit': '1000/hour',
                    'support': 'Priority 24/7 support',
                    'overage_cost': '$0.0006/credit',
                    'sla': '99.5% uptime',
                }
            },
            
            # ENTERPRISE TIER - Custom solutions
            {
                'name': 'Enterprise',
                'description': 'Custom solutions for large organizations with unlimited needs. Contact sales for pricing.',
                'price': Decimal('99.00'),  # Base price, customizable
                'yearly_price': Decimal('990.00'),  # 2 months free
                'currency': 'USD',
                'credits_per_month': 500000,  # High base limit
                'additional_credit_price': Decimal('0.0004'),  # Lowest overage
                'max_api_calls_per_hour': 10000,
                'max_bulk_emails': 500000,
                'supports_api': True,
                'supports_bulk': True,
                'priority_support': True,
                'trial_days': 30,
                'is_active': True,
                'features': {
                    'validations_per_month': '500,000+',
                    'api_access': 'Full + Unlimited',
                    'bulk_validation': True,
                    'priority_support': True,
                    'analytics': 'Enterprise Dashboard',
                    'webhooks': True,
                    'csv_export': True,
                    'api_export': True,
                    'dedicated_support': True,
                    'custom_integrations': True,
                    'sla_guarantee': '99.9% uptime',
                    'dedicated_infrastructure': True,
                    'white_label': True,
                    'on_premise_deployment': 'Optional',
                    'custom_validation_rules': True,
                    'advanced_security': True,
                    'dedicated_account_manager': True,
                    'smtp_verification': True,
                    'catch_all_detection': True,
                    'spam_trap_detection': True,
                    'domain_reputation': True,
                    'role_based_detection': True,
                    'disposable_detection': True,
                    'dns_validation': True,
                    'rate_limit': '10,000/hour',
                    'support': 'Dedicated account manager',
                    'overage_cost': '$0.0004/credit',
                    'custom_pricing': 'Available',
                    'volume_discounts': True,
                }
            }
        ]

        created_count = 0
        updated_count = 0

        for plan_data in plans_data:
            plan, created = Plan.objects.update_or_create(
                name=plan_data['name'],
                defaults=plan_data
            )
            
            # Calculate yearly savings
            monthly_yearly = float(plan.price) * 12
            yearly_price = float(plan.yearly_price or 0)
            yearly_savings = monthly_yearly - yearly_price
            savings_pct = (yearly_savings / monthly_yearly * 100) if monthly_yearly > 0 else 0
            
            if created:
                created_count += 1
                self.stdout.write(
                    self.style.SUCCESS(
                        f'✓ Created: {plan.name:15s} | '
                        f'${plan.price:>6}/mo | '
                        f'{plan.credits_per_month:>7,} credits | '
                        f'Yearly saves {savings_pct:.0f}% | '
                        f'Trial: {plan.trial_days} days'
                    )
                )
            else:
                updated_count += 1
                self.stdout.write(
                    self.style.WARNING(
                        f'↻ Updated: {plan.name:15s} | '
                        f'${plan.price:>6}/mo | '
                        f'{plan.credits_per_month:>7,} credits | '
                        f'Yearly saves {savings_pct:.0f}% | '
                        f'Trial: {plan.trial_days} days'
                    )
                )

        self.stdout.write('\n' + '='*80)
        self.stdout.write(
            self.style.SUCCESS(
                f'\n✓ Setup complete! Created {created_count} | Updated {updated_count}\n'
            )
        )
        
        # Show plan comparison
        self.stdout.write('\n📊 Plan Comparison:\n')
        plans = Plan.objects.filter(is_active=True).order_by('price')
        
        for plan in plans:
            price_per_credit = float(plan.price) / plan.credits_per_month if plan.credits_per_month > 0 else 0
            self.stdout.write(
                f'  {plan.name:15s}: ${plan.price:>6}/mo → '
                f'{plan.credits_per_month:>8,} credits → '
                f'${price_per_credit:.5f}/credit'
            )
        
        self.stdout.write('\n💡 Recommendations:')
        self.stdout.write('  - Free: For testing (100 credits/month)')
        self.stdout.write('  - Starter: Small businesses ($9/mo, 10k credits) 🔥 BEST ENTRY')
        self.stdout.write('  - Professional: Growing teams ($29/mo, 50k credits) ⭐ MOST POPULAR')
        self.stdout.write('  - Business: Established businesses ($49/mo, 150k credits) 🏆 BEST VALUE')
        self.stdout.write('  - Enterprise: Large scale ($99/mo, 500k+ credits)\n')
        )
