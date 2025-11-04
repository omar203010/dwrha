(function($) {
    'use strict';
    
    // Make updateScheduleStatus globally available
    window.updateScheduleStatus = function(scheduleId) {
        const statusElement = document.getElementById('schedule-status-' + scheduleId);
        if (!statusElement) return;
        
        // Get status URL
        const statusUrl = '/companies/admin/schedule-status/' + scheduleId + '/';
        
        // Make AJAX request
        fetch(statusUrl, {
            method: 'GET',
            headers: {
                'X-Requested-With': 'XMLHttpRequest',
            },
            credentials: 'same-origin'
        })
        .then(response => response.json())
        .then(data => {
            if (data.success) {
                // Update status display
                let displayText = '';
                let color = data.color;
                
                if (!data.schedule_active) {
                    displayText = '⏸️ الجدولة متوقفة';
                    color = '#dc3545';
                } else if (data.is_active) {
                    displayText = '✅ ' + data.display;
                    color = data.color;
                } else if (data.should_activate_soon) {
                    displayText = '⏳ جاهز للتفعيل (ضمن النطاق)';
                    color = '#ffc107';
                } else {
                    displayText = '⏳ ' + data.display + ' - خارج نطاق الجدولة';
                    color = '#6c757d';
                }
                
                statusElement.textContent = displayText;
                statusElement.style.color = color;
                if (data.is_active) {
                    statusElement.style.fontWeight = 'bold';
                } else {
                    statusElement.style.fontWeight = 'normal';
                }
            }
        })
        .catch(error => {
            console.error('Error updating schedule status:', error);
        });
    };
    
    // Track which schedules are already being updated to avoid duplicates
    const updatingSchedules = new Set();
    
    // Function to add updates for a specific schedule
    function addScheduleUpdate(scheduleId) {
        if (updatingSchedules.has(scheduleId)) {
            return; // Already updating this schedule
        }
        
        updatingSchedules.add(scheduleId);
        
        // Update immediately
        updateScheduleStatus(scheduleId);
        
        // Update every 5 seconds
        setInterval(function() {
            updateScheduleStatus(scheduleId);
        }, 5000);
    }
    
    // Modify startStatusUpdates to use addScheduleUpdate
    function startStatusUpdates() {
        const statusElements = document.querySelectorAll('[id^="schedule-status-"]');
        
        statusElements.forEach(function(element) {
            const scheduleId = element.id.replace('schedule-status-', '');
            if (scheduleId && !updatingSchedules.has(scheduleId)) {
                addScheduleUpdate(scheduleId);
            }
        });
    }
    
    // Start updates when DOM is ready
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', startStatusUpdates);
    } else {
        startStatusUpdates();
    }
    
    // Also start after page changes (for admin changelist pagination, etc.)
    $(document).on('DOMNodeInserted', function() {
        startStatusUpdates();
    });
    
})(django.jQuery);
