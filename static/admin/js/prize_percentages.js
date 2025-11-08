// JavaScript for prize percentages admin
(function($) {
    'use strict';
    
    // Make function globally available
    window.updateTotalPercentage = function() {
        let total = 0;
        $('input[name^="prize_percentage_"]').each(function() {
            total += parseInt($(this).val()) || 0;
        });
        
        let totalSpan = $('#total-percentage');
        if (totalSpan.length) {
            totalSpan.text(total + '%');
            if (total == 100) {
                totalSpan.css('color', '#28a745');
            } else if (total < 100) {
                totalSpan.css('color', '#ffc107');
            } else {
                totalSpan.css('color', '#dc3545');
            }
        }
    };
    
    $(document).ready(function() {
        // Update total on input change
        $(document).on('input change', 'input[name^="prize_percentage_"]', function() {
            window.updateTotalPercentage();
        });
        
        // Update total on page load
        window.updateTotalPercentage();
    });
    
})(django.jQuery);

