"""
Management command to run the activation scheduler
Run this command periodically (e.g., every hour) using cron or task scheduler
"""
from django.core.management.base import BaseCommand
from django.utils import timezone
from companies.models import ActivationSchedule


class Command(BaseCommand):
    help = 'Run the activation scheduler to automatically activate companies based on their schedules'

    def add_arguments(self, parser):
        parser.add_argument(
            '--dry-run',
            action='store_true',
            help='Show what would be activated without actually activating',
        )

    def handle(self, *args, **options):
        dry_run = options['dry_run']
        
        if dry_run:
            self.stdout.write(self.style.WARNING('[DRY RUN] Running in DRY RUN mode - no changes will be made'))
        
        self.stdout.write('=' * 70)
        self.stdout.write(self.style.SUCCESS(f'Running Activation Scheduler at {timezone.now().strftime("%Y-%m-%d %H:%M:%S")}'))
        self.stdout.write('=' * 70)
        
        # Get all active schedules
        schedules = ActivationSchedule.objects.filter(is_active=True).select_related('company')
        
        if not schedules.exists():
            self.stdout.write(self.style.WARNING('[!] No active schedules found'))
            return
        
        self.stdout.write(f'\nFound {schedules.count()} active schedule(s)\n')
        
        activated_count = 0
        skipped_count = 0
        
        for schedule in schedules:
            self.stdout.write(f'\n{"-" * 70}')
            self.stdout.write(f'Company ID: {schedule.company.id}')
            self.stdout.write(f'Days: Sat={schedule.saturday}, Sun={schedule.sunday}, Mon={schedule.monday}, Tue={schedule.tuesday}, Wed={schedule.wednesday}, Thu={schedule.thursday}, Fri={schedule.friday}')
            self.stdout.write(f'Time: {schedule.start_hour}:00 - {schedule.end_hour}:00')
            self.stdout.write(f'Duration: {schedule.duration_hours} hours')
            
            if schedule.should_activate_now():
                self.stdout.write(self.style.SUCCESS('[OK] Should activate now!'))
                
                if dry_run:
                    self.stdout.write(self.style.WARNING('   [DRY RUN] Would activate company'))
                    activated_count += 1
                else:
                    success = schedule.activate_company()
                    if success:
                        self.stdout.write(self.style.SUCCESS(f'   [OK] Activated company for {schedule.duration_hours} hours'))
                        self.stdout.write(f'   Activation ends at: {schedule.company.activation_end_time.strftime("%Y-%m-%d %H:%M:%S")}')
                        activated_count += 1
                    else:
                        self.stdout.write(self.style.WARNING('   [SKIP] Already activated recently, skipping'))
                        skipped_count += 1
            else:
                self.stdout.write(self.style.WARNING('[SKIP] Not in activation window, skipping'))
                skipped_count += 1
        
        self.stdout.write(f'\n{"=" * 70}')
        self.stdout.write(self.style.SUCCESS(f'[OK] Activated: {activated_count}'))
        self.stdout.write(self.style.WARNING(f'[SKIP] Skipped: {skipped_count}'))
        self.stdout.write('=' * 70)
        
        if dry_run:
            self.stdout.write(self.style.WARNING('\n[!] DRY RUN completed - no changes were made'))

