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
                'credits_per_month': 100,
                'additional_credit_price': 0.01,
                'max_api_calls_per_hour': 10,
                'max_bulk_emails': 50,
                'supports_api': False,
                'supports_bulk': False,
                'priority_support': False,
                'trial_days': 0,
                'features': {
                    'validations_per_month': 100,
                    'api_access': False,
                    'bulk_validation': False,
                    'priority_support': False,
                    'analytics': False
                }
            },
            {
                'name': 'Professional',
                'description': 'Ideal for growing businesses and developers',
                'price': 29.00,
                'currency': 'USD',
                'credits_per_month': 1000,
                'additional_credit_price': 0.02,
                'max_api_calls_per_hour': 100,
                'max_bulk_emails': 1000,
                'supports_api': True,
                'supports_bulk': True,
                'priority_support': True,
                'trial_days': 7,
                'features': {
                    'validations_per_month': 1000,
                    'api_access': True,
                    'bulk_validation': True,
                    'priority_support': True,
                    'analytics': True,
                    'webhooks': True,
                    'csv_export': True
                }
            },
            {
                'name': 'Enterprise',
                'description': 'For large organizations with high-volume needs',
                'price': 99.00,
                'currency': 'USD',
                'credits_per_month': 5000,
                'additional_credit_price': 0.015,
                'max_api_calls_per_hour': 1000,
                'max_bulk_emails': 10000,
                'supports_api': True,
                'supports_bulk': True,
                'priority_support': True,
                'trial_days': 14,
                'features': {
                    'validations_per_month': 5000,
                    'api_access': True,
                    'bulk_validation': True,
                    'priority_support': True,
                    'analytics': True,
                    'webhooks': True,
                    'csv_export': True,
                    'dedicated_support': True,
                    'custom_integrations': True,
                    'sla_guarantee': True
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
