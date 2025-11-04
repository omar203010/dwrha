(function($) {
    'use strict';
    
    // Function to update company status indicators after schedule deletion
    function updateCompanyStatusIndicators() {
        // Reload the page after 1 second to reflect updated status
        setTimeout(function() {
            location.reload();
        }, 1000);
    }
    
    // Handle schedule deletion from company detail page (inline)
    $(document).ready(function() {
        // Listen for deletion of inline schedules
        $(document).on('click', 'a[id*="deletelink"], .deletelink', function(e) {
            if ($(this).closest('.inline-group').length > 0 || 
                window.location.href.indexOf('/activationschedule/') !== -1) {
                // We're deleting a schedule inline or from schedule admin
                // Update status after deletion
                $(document).one('submit', 'form', function() {
                    updateCompanyStatusIndicators();
                });
            }
        });
    });
    
    // Update company status when returning from schedule deletion
    if (document.referrer && document.referrer.indexOf('/activationschedule/') !== -1) {
        // We came from schedule admin, update company status
        setTimeout(function() {
            // Reload to show updated status
            if (window.location.href.indexOf('/company/') !== -1) {
                location.reload();
            }
        }, 500);
    }
    
})(django.jQuery);
