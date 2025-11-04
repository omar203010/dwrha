"""
Middleware for automatic activation based on schedules
"""
from django.utils import timezone
from .models import ActivationSchedule
import logging

logger = logging.getLogger(__name__)


class ScheduleActivationMiddleware:
    """
    Middleware to check and activate companies based on schedules
    Runs on every request to ensure timely activation
    """
    
    def __init__(self, get_response):
        self.get_response = get_response
        self.last_check = None
        self.check_interval = 1  # Check every 1 second
    
    def __call__(self, request):
        # Check if it's time to run the scheduler
        now = timezone.now()
        
        if self.last_check is None or (now - self.last_check).total_seconds() >= self.check_interval:
            self.last_check = now
            self.run_scheduler()
        
        response = self.get_response(request)
        return response
    
    def run_scheduler(self):
        """Run the activation scheduler"""
        try:
            # Get all active schedules
            schedules = ActivationSchedule.objects.filter(is_active=True).select_related('company')
            
            for schedule in schedules:
                if schedule.should_activate_now():
                    # Activate company with scheduled hour to ensure activation starts at exact hour
                    schedule.company.activate_now(hours=schedule.duration_hours, scheduled_hour=schedule.start_hour, scheduled_end_hour=schedule.end_hour)
                    schedule.last_activation = timezone.now()
                    schedule.save()
                    
                    logger.info(f"Auto-activated: {schedule.company.name} for {schedule.duration_hours} hours at {schedule.start_hour}:00")
        
        except Exception as e:
            logger.error(f"Error in schedule activation middleware: {e}")

