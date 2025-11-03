"""
Admin configuration for game app
"""
from django.contrib import admin
from django.utils.html import format_html
from .models import GameSpin


@admin.register(GameSpin)
class GameSpinAdmin(admin.ModelAdmin):
    list_display = [
        'visitor_name', 
        'visitor_phone',
        'company', 
        'prize', 
        'won', 
        'created_at',
        'ip_address'
    ]
    list_filter = ['won', 'company', 'created_at']
    search_fields = ['visitor_name', 'visitor_phone', 'prize', 'company__name']
    readonly_fields = ['created_at', 'session_id', 'ip_address', 'user_agent']
    
    fieldsets = (
        ('معلومات الدورة', {
            'fields': ('company', 'visitor_name', 'visitor_phone', 'prize', 'won')
        }),
        ('معلومات تقنية', {
            'fields': ('session_id', 'ip_address', 'user_agent', 'created_at'),
            'classes': ('collapse',)
        }),
    )
    
    def get_queryset(self, request):
        return super().get_queryset(request).select_related('company')
