(function($) {
    'use strict';
    
    // Function to update all company status indicators after schedule deletion
    function updateAllStatusIndicators() {
        // Update all schedule status indicators
        const statusElements = document.querySelectorAll('[id^="schedule-status-"]');
        statusElements.forEach(function(element) {
            const scheduleId = element.id.replace('schedule-status-', '');
            if (scheduleId && window.updateScheduleStatus) {
                window.updateScheduleStatus(scheduleId);
            }
        });
    }
    
    // Handle delete confirmation and update after deletion
    $(document).ready(function() {
        // Intercept delete confirmations
        $(document).on('click', 'a.deletelink', function(e) {
            const link = $(this);
            if (link.attr('href') && link.attr('href').indexOf('/activationschedule/') !== -1) {
                // We're deleting a schedule, update status after deletion
                // Listen for the delete form submission
                setTimeout(function() {
                    $(document).on('submit', 'form[action*="delete"]', function() {
                        // After delete form is submitted, update status
                        setTimeout(function() {
                            updateAllStatusIndicators();
                        }, 1000);
                    });
                }, 100);
            }
        });
        
        // Also handle bulk delete
        $(document).on('submit', 'form[action*="delete_selected"]', function(e) {
            if (window.location.href.indexOf('/activationschedule/') !== -1) {
                // Update status after bulk delete completes
                setTimeout(function() {
                    updateAllStatusIndicators();
                }, 1500);
            }
        });
    });
    
    // Update status when page loads (in case we just came from a deletion redirect)
    setTimeout(function() {
        if (window.location.href.indexOf('/activationschedule/') !== -1 && 
            window.location.href.indexOf('/change/') === -1) {
            updateAllStatusIndicators();
        }
    }, 1000);
    
})(django.jQuery);
