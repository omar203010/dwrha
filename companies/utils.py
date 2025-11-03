"""
Utility functions for companies app
"""
from django.utils import timezone
import pytz
from datetime import datetime


def get_riyadh_time(dt=None):
    """
    Get datetime in Riyadh timezone
    Args:
        dt: datetime object (if None, uses current time)
    Returns:
        datetime in Asia/Riyadh timezone
    """
    riyadh_tz = pytz.timezone('Asia/Riyadh')
    
    if dt is None:
        # Get current time
        return timezone.now().astimezone(riyadh_tz)
    
    # Convert given datetime to Riyadh timezone
    if dt.tzinfo is None:
        # If naive datetime, assume it's UTC
        dt = pytz.UTC.localize(dt)
    
    return dt.astimezone(riyadh_tz)


def format_riyadh_datetime(dt, format_string='%Y-%m-%d %I:%M %p'):
    """
    Format datetime in Riyadh timezone
    Args:
        dt: datetime object
        format_string: strftime format string
    Returns:
        formatted string in Riyadh timezone
    """
    if dt is None:
        return '-'
    
    riyadh_time = get_riyadh_time(dt)
    return riyadh_time.strftime(format_string)


def format_arabic_datetime(dt):
    """
    Format datetime with Arabic labels
    Args:
        dt: datetime object
    Returns:
        formatted string like "2025-10-16 الساعة 01:30 مساءً"
    """
    if dt is None:
        return '-'
    
    riyadh_time = get_riyadh_time(dt)
    
    # Format date and time
    date_str = riyadh_time.strftime('%Y-%m-%d')
    hour = riyadh_time.hour
    minute = riyadh_time.strftime('%M')
    
    # Convert to 12-hour format with Arabic AM/PM
    if hour == 0:
        hour_12 = 12
        period = 'صباحاً'
    elif hour < 12:
        hour_12 = hour
        period = 'صباحاً'
    elif hour == 12:
        hour_12 = 12
        period = 'ظهراً'
    else:
        hour_12 = hour - 12
        period = 'مساءً'
    
    return f"{date_str} الساعة {hour_12:02d}:{minute} {period}"



