from django.core.management.base import BaseCommand
from apps.plan.models import Plan


class Command(BaseCommand):
    help = 'Set up default billing plans for ScrubiMail'

    def handle(self, *args, **options):
        plans_data = [
            {
                'name': 'Free',
                'description': 'Perfect for getting started with email validation',
                'price': 0.00,
                'currency': 'USD',
                'credits_per_month': 1000,  # Updated to match frontend
                'additional_credit_price': 0.01,
                'max_api_calls_per_hour': 10,
                'max_bulk_emails': 50,
                'supports_api': True,  # Basic API access
                'supports_bulk': False,
                'priority_support': False,
                'trial_days': 0,
                'features': {
                    'validations_per_month': 1000,
                    'api_access': True,
                    'bulk_validation': False,
                    'priority_support': False,
                    'analytics': False,
                    'smtp_verification': False,
                    'disposable_detection': True,
                    'dns_validation': True,
                }
            },
            {
                'name': 'Starter',  # NEW TIER
                'description': 'Ideal for small businesses and growing teams',
                'price': 29.00,
                'currency': 'USD',
                'credits_per_month': 10000,
                'additional_credit_price': 0.0025,  # $0.0025 per credit
                'max_api_calls_per_hour': 100,
                'max_bulk_emails': 1000,
                'supports_api': True,
                'supports_bulk': True,
                'priority_support': False,
                'trial_days': 7,
                'features': {
                    'validations_per_month': 10000,
                    'api_access': True,
                    'bulk_validation': True,
                    'priority_support': False,
                    'analytics': True,
                    'smtp_verification': True,
                    'disposable_detection': True,
                    'role_based_detection': True,
                    'dns_validation': True,
                    'basic_analytics': True,
                }
            },
            {
                'name': 'Professional',
                'description': 'Advanced features for marketing teams and agencies',
                'price': 99.00,  # Updated price
                'currency': 'USD',
                'credits_per_month': 50000,  # Updated to match frontend
                'additional_credit_price': 0.0018,  # $0.0018 per credit
                'max_api_calls_per_hour': 500,
                'max_bulk_emails': 10000,
                'supports_api': True,
                'supports_bulk': True,
                'priority_support': True,
                'trial_days': 14,
                'features': {
                    'validations_per_month': 50000,
                    'api_access': True,
                    'bulk_validation': True,
                    'priority_support': True,
                    'analytics': True,
                    'webhooks': True,
                    'csv_export': True,
                    'smtp_verification': True,
                    'catch_all_detection': True,
                    'spam_trap_detection': True,
                    'domain_reputation': True,
                    'advanced_analytics': True,
                    'custom_validation_rules': True,
                }
            },
            {
                'name': 'Enterprise',
                'description': 'Custom solutions for large organizations',
                'price': 0.00,  # Custom pricing - handled via sales
                'currency': 'USD',
                'credits_per_month': 1000000,  # High limit, effectively unlimited
                'additional_credit_price': 0.001,  # $0.001 per credit for overages
                'max_api_calls_per_hour': 10000,
                'max_bulk_emails': 100000,
                'supports_api': True,
                'supports_bulk': True,
                'priority_support': True,
                'trial_days': 30,
                'features': {
                    'validations_per_month': 'unlimited',
                    'api_access': True,
                    'bulk_validation': True,
                    'priority_support': True,
                    'analytics': True,
                    'webhooks': True,
                    'csv_export': True,
                    'dedicated_support': True,
                    'custom_integrations': True,
                    'sla_guarantee': True,
                    'dedicated_infrastructure': True,
                    'white_label': True,
                    'on_premise_deployment': True,
                    'custom_validation_rules': True,
                    'advanced_security': True,
                    'dedicated_account_manager': True,
                }
            }
        ]

        created_count = 0
        updated_count = 0

        for plan_data in plans_data:
            plan, created = Plan.objects.get_or_create(
                name=plan_data['name'],
                defaults=plan_data
            )
            
            if created:
                created_count += 1
                self.stdout.write(
                    self.style.SUCCESS(f'Created plan: {plan.name}')
                )
            else:
                # Update existing plan
                for key, value in plan_data.items():
                    setattr(plan, key, value)
                plan.save()
                updated_count += 1
                self.stdout.write(
                    self.style.WARNING(f'Updated plan: {plan.name}')
                )

        self.stdout.write(
            self.style.SUCCESS(
                f'Setup complete! Created {created_count} plans, updated {updated_count} plans.'
            )
        )
