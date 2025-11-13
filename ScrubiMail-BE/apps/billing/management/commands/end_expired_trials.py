from django.core.management.base import BaseCommand
from django.utils import timezone
from apps.billing.models import BillingProfile


class Command(BaseCommand):
    help = 'Check and end expired trials'

    def handle(self, *args, **options):
        # Find all active trials that have expired
        now = timezone.now()
        expired_trials = BillingProfile.objects.filter(
            is_trial=True,
            trial_end_date__lte=now,
            trial_converted=False
        )
        
        count = 0
        for profile in expired_trials:
            self.stdout.write(f'Ending trial for {profile.user.email}')
            profile.end_trial()
            count += 1
            
            # TODO: Send email notification about trial end
        
        self.stdout.write(
            self.style.SUCCESS(f'Successfully ended {count} expired trials')
        )
