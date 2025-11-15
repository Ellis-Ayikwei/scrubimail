from django.core.management.base import BaseCommand
from django.contrib.auth import get_user_model
from apps.billing.models import BillingProfile
from apps.plan.models import Plan

User = get_user_model()


class Command(BaseCommand):
    help = "Set up all billing plans and assign Free plan to all users"

    def add_arguments(self, parser):
        parser.add_argument(
            "--dry-run",
            action="store_true",
            help="Show what would be done without making changes",
        )
        parser.add_argument(
            "--skip-plans",
            action="store_true",
            help="Skip creating plans (only assign Free plan to users)",
        )
        parser.add_argument(
            "--skip-users",
            action="store_true",
            help="Skip assigning plans to users (only create plans)",
        )

    def handle(self, *args, **options):
        dry_run = options["dry_run"]
        skip_plans = options["skip_plans"]
        skip_users = options["skip_users"]

        # Step 1: Create/Update all plans
        if not skip_plans:
            self.stdout.write(
                self.style.SUCCESS("\n=== Step 1: Setting up billing plans ===\n")
            )
            self._setup_plans(dry_run)
        else:
            self.stdout.write(self.style.WARNING("\n=== Skipping plan setup ===\n"))

        # Step 2: Assign Free plan to all users
        if not skip_users:
            self.stdout.write(
                self.style.SUCCESS("\n=== Step 2: Assigning Free plan to users ===\n")
            )
            self._assign_free_plan(dry_run)
        else:
            self.stdout.write(
                self.style.WARNING("\n=== Skipping user assignment ===\n")
            )

        self.stdout.write(self.style.SUCCESS("\n✅ Billing setup complete!\n"))

    def _setup_plans(self, dry_run):
        """Create or update all billing plans"""
        plans_data = [
            {
                "name": "Free",
                "description": "Perfect for getting started with email validation",
                "price": 0.00,
                "yearly_price": 0.00,
                "currency": "USD",
                "credits_per_month": 1000,
                "additional_credit_price": 0.01,
                "max_api_calls_per_hour": 10,
                "max_bulk_emails": 50,
                "supports_api": True,
                "supports_bulk": False,
                "priority_support": False,
                "trial_days": 0,
                "is_active": True,
                "features": {
                    "validations_per_month": 1000,
                    "api_access": True,
                    "bulk_validation": False,
                    "priority_support": False,
                    "analytics": False,
                    "smtp_verification": False,
                    "disposable_detection": True,
                    "dns_validation": True,
                },
            },
            {
                "name": "Starter",
                "description": "Ideal for small businesses and growing teams",
                "price": 29.00,
                "yearly_price": 290.00,  # 10 months (17% discount)
                "currency": "USD",
                "credits_per_month": 10000,
                "additional_credit_price": 0.0025,
                "max_api_calls_per_hour": 100,
                "max_bulk_emails": 1000,
                "supports_api": True,
                "supports_bulk": True,
                "priority_support": False,
                "trial_days": 7,
                "is_active": True,
                "features": {
                    "validations_per_month": 10000,
                    "api_access": True,
                    "bulk_validation": True,
                    "priority_support": False,
                    "analytics": True,
                    "smtp_verification": True,
                    "disposable_detection": True,
                    "role_based_detection": True,
                    "dns_validation": True,
                    "basic_analytics": True,
                },
            },
            {
                "name": "Professional",
                "description": "Advanced features for marketing teams and agencies",
                "price": 99.00,
                "yearly_price": 990.00,  # 10 months (17% discount)
                "currency": "USD",
                "credits_per_month": 50000,
                "additional_credit_price": 0.0018,
                "max_api_calls_per_hour": 500,
                "max_bulk_emails": 10000,
                "supports_api": True,
                "supports_bulk": True,
                "priority_support": True,
                "trial_days": 14,
                "is_active": True,
                "features": {
                    "validations_per_month": 50000,
                    "api_access": True,
                    "bulk_validation": True,
                    "priority_support": True,
                    "analytics": True,
                    "webhooks": True,
                    "csv_export": True,
                    "smtp_verification": True,
                    "catch_all_detection": True,
                    "spam_trap_detection": True,
                    "domain_reputation": True,
                    "advanced_analytics": True,
                    "custom_validation_rules": True,
                },
            },
            {
                "name": "Enterprise",
                "description": "Custom solutions for large organizations",
                "price": 0.00,  # Custom pricing - handled via sales
                "yearly_price": None,  # Custom pricing - handled via sales
                "currency": "USD",
                "credits_per_month": 1000000,
                "additional_credit_price": 0.001,
                "max_api_calls_per_hour": 10000,
                "max_bulk_emails": 100000,
                "supports_api": True,
                "supports_bulk": True,
                "priority_support": True,
                "trial_days": 30,
                "is_active": True,
                "features": {
                    "validations_per_month": "unlimited",
                    "api_access": True,
                    "bulk_validation": True,
                    "priority_support": True,
                    "analytics": True,
                    "webhooks": True,
                    "csv_export": True,
                    "dedicated_support": True,
                    "custom_integrations": True,
                    "sla_guarantee": True,
                    "dedicated_infrastructure": True,
                    "white_label": True,
                    "on_premise_deployment": True,
                    "custom_validation_rules": True,
                    "advanced_security": True,
                    "dedicated_account_manager": True,
                },
            },
        ]

        created_count = 0
        updated_count = 0

        for plan_data in plans_data:
            if dry_run:
                plan_exists = Plan.objects.filter(name=plan_data["name"]).exists()
                if plan_exists:
                    self.stdout.write(
                        self.style.WARNING(f'  Would update plan: {plan_data["name"]}')
                    )
                else:
                    self.stdout.write(
                        self.style.SUCCESS(f'  Would create plan: {plan_data["name"]}')
                    )
            else:
                plan, created = Plan.objects.get_or_create(
                    name=plan_data["name"], defaults=plan_data
                )

                if created:
                    created_count += 1
                    self.stdout.write(
                        self.style.SUCCESS(f"  ✓ Created plan: {plan.name}")
                    )
                else:
                    # Update existing plan
                    for key, value in plan_data.items():
                        setattr(plan, key, value)
                    plan.save()
                    updated_count += 1
                    self.stdout.write(
                        self.style.WARNING(f"  ↻ Updated plan: {plan.name}")
                    )

        if not dry_run:
            self.stdout.write(
                self.style.SUCCESS(
                    f"\nPlans setup complete! Created {created_count} plans, updated {updated_count} plans."
                )
            )

    def _assign_free_plan(self, dry_run):
        """Assign Free plan to all users who don't have a plan"""
        # Get Free plan
        try:
            free_plan = Plan.objects.get(name="Free", is_active=True)
        except Plan.DoesNotExist:
            self.stdout.write(
                self.style.ERROR(
                    "ERROR: Free plan does not exist! Please run plan setup first or use --skip-plans=false"
                )
            )
            return

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
                f"Found {len(users_without_plans)} users without plans out of {total_users} total users"
            )
        )

        if dry_run:
            self.stdout.write(
                self.style.WARNING("\nDRY RUN MODE - No changes will be made\n")
            )
            for user in users_without_plans:
                self.stdout.write(f"  Would assign Free plan to: {user.email}")
        else:
            assigned_count = 0
            created_count = 0

            for user in users_without_plans:
                try:
                    profile = user.billing_profile
                    # Profile exists but no plan
                    profile.current_plan = free_plan
                    if (
                        profile.credits_remaining == 0
                        or profile.credits_remaining < free_plan.credits_per_month
                    ):
                        profile.credits_remaining = free_plan.credits_per_month
                    profile.save(update_fields=["current_plan", "credits_remaining"])
                    assigned_count += 1
                    self.stdout.write(
                        self.style.SUCCESS(f"  ✓ Assigned Free plan to: {user.email}")
                    )
                except BillingProfile.DoesNotExist:
                    # Create new billing profile with Free plan
                    BillingProfile.objects.create(
                        user=user,
                        current_plan=free_plan,
                        credits_remaining=free_plan.credits_per_month,
                        billing_status="active",
                    )
                    created_count += 1
                    self.stdout.write(
                        self.style.SUCCESS(
                            f"  ✓ Created billing profile with Free plan for: {user.email}"
                        )
                    )

            self.stdout.write(
                self.style.SUCCESS(
                    f"\nUser assignment complete! Assigned plans to {assigned_count} existing profiles, "
                    f"created {created_count} new profiles."
                )
            )
