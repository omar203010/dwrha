"""
Views for companies app
"""
from django.shortcuts import render, redirect, get_object_or_404
from django.contrib import messages
from django.contrib.admin.views.decorators import staff_member_required
from django.http import JsonResponse
from django.views.decorators.csrf import csrf_exempt
from django.views.decorators.http import require_http_methods
from django.utils.decorators import method_decorator
from django.views.generic import TemplateView
from django.urls import reverse
import json
import random
import logging
from .models import Company, ActivationSchedule

logger = logging.getLogger(__name__)


class HomeView(TemplateView):
    """Home page view"""
    template_name = 'companies/index.html'
    
    def get_context_data(self, **kwargs):
        context = super().get_context_data(**kwargs)
        context['title'] = 'دوّرها | منصة الجوائز التفاعلية'
        return context


class ThanksView(TemplateView):
    """Thanks page view"""
    template_name = 'companies/thanks.html'
    
    def get_context_data(self, **kwargs):
        context = super().get_context_data(**kwargs)
        company_id = self.kwargs.get('company_id')
        if company_id:
            try:
                company = Company.objects.get(id=company_id)
                context['company'] = company
                context['company_url'] = company.company_url
            except Company.DoesNotExist:
                pass
        return context


@csrf_exempt
@require_http_methods(["POST"])
def register_company(request):
    """Register a new company"""
    try:
        data = json.loads(request.body)
        
        # Extract form data
        company_name = data.get('company', '').strip()
        company_type = data.get('type', '')
        custom_type = data.get('customType', '').strip()
        email = data.get('email', '').strip()
        phone = data.get('phone', '').strip()
        
        # Process prizes - support both old format (comma-separated) and new format (list with percentages)
        prizes = data.get('prizes', [])
        prize_percentages = data.get('prize_percentages', [])
        
        # Validate required fields
        if not company_name:
            return JsonResponse({
                'success': False,
                'message': 'اسم الجهة مطلوب'
            }, status=400)
        
        if not company_type:
            return JsonResponse({
                'success': False,
                'message': 'نوع الجهة مطلوب'
            }, status=400)
        
        if not email:
            return JsonResponse({
                'success': False,
                'message': 'البريد الإلكتروني مطلوب'
            }, status=400)
        
        # If prizes is a string (old format), convert it
        if isinstance(prizes, str):
            prizes = [prize.strip() for prize in prizes.split(',') if prize.strip()]
            # Default equal percentages for old format
            if prizes:
                equal_percentage = 100 // len(prizes)
                prize_percentages = [equal_percentage] * len(prizes)
                # Adjust last item to make total 100
                remainder = 100 - (equal_percentage * len(prizes))
                if remainder > 0:
                    prize_percentages[-1] += remainder
        
        # Validate prizes after conversion
        if not prizes or (isinstance(prizes, list) and len(prizes) == 0):
            return JsonResponse({
                'success': False,
                'message': 'يجب تحديد جوائز واحدة على الأقل'
            }, status=400)
        
        # Ensure prize_percentages is a list
        if not isinstance(prize_percentages, list):
            prize_percentages = []
        
        # Validate percentages if provided
        if prize_percentages and len(prize_percentages) > 0:
            if len(prize_percentages) != len(prizes):
                return JsonResponse({
                    'success': False,
                    'message': 'عدد النسب المئوية يجب أن يساوي عدد الجوائز'
                }, status=400)
            
            # Validate that all percentages are positive
            if any(p <= 0 for p in prize_percentages):
                return JsonResponse({
                    'success': False,
                    'message': 'جميع النسب المئوية يجب أن تكون أكبر من 0'
                }, status=400)
            
            # Normalize percentages to sum to 100
            # This works for any total (e.g., 50%, 150%, 300%, etc.)
            # The algorithm preserves the relative ratios between prizes
            total_percentage = sum(prize_percentages)
            if total_percentage > 0:
                # Normalize to percentages that sum to 100
                # Formula: (each_percentage / total) * 100
                # This preserves the relative weights
                normalized = [(float(p) / total_percentage) * 100.0 for p in prize_percentages]
                
                # Round to nearest integer for display/storage
                prize_percentages = [round(p) for p in normalized]
                
                # Adjust to ensure sum is exactly 100 (handle rounding errors)
                current_sum = sum(prize_percentages)
                if current_sum != 100:
                    difference = 100 - current_sum
                    # Add/subtract difference from the prize with the highest percentage
                    # This maintains the relative importance
                    max_idx = prize_percentages.index(max(prize_percentages))
                    prize_percentages[max_idx] += difference
                
                # Ensure no percentage is less than 1 after normalization
                # This prevents prizes from having 0% chance
                for i in range(len(prize_percentages)):
                    if prize_percentages[i] < 1:
                        prize_percentages[i] = 1
                
                # Re-adjust if needed after ensuring minimum of 1%
                current_sum = sum(prize_percentages)
                if current_sum != 100:
                    difference = 100 - current_sum
                    # Adjust the highest percentage to compensate
                    max_idx = prize_percentages.index(max(prize_percentages))
                    prize_percentages[max_idx] += difference
                    # Ensure it doesn't go below 1
                    if prize_percentages[max_idx] < 1:
                        prize_percentages[max_idx] = 1
        else:
            # Default equal percentages if not provided
            equal_percentage = 100 // len(prizes)
            prize_percentages = [equal_percentage] * len(prizes)
            remainder = 100 - (equal_percentage * len(prizes))
            if remainder > 0:
                prize_percentages[-1] += remainder
        
        # Ensure prize_percentages has the same length as prizes
        if not prize_percentages or len(prize_percentages) != len(prizes):
            # Generate default equal percentages
            equal_percentage = 100 // len(prizes)
            prize_percentages = [equal_percentage] * len(prizes)
            remainder = 100 - (equal_percentage * len(prizes))
            if remainder > 0:
                prize_percentages[-1] += remainder
        
        # Store prizes with percentages as list of dicts
        prizes_with_percentages = [
            {'name': prize, 'percentage': percentage}
            for prize, percentage in zip(prizes, prize_percentages)
        ]
        
        # Generate colors
        dawerha_colors = [
            "#6A3FA0", "#F2C23E", "#8C59C4", "#FF6B9D", 
            "#2E2240", "#4ECDC4", "#B794F6", "#FF8B5A"
        ]
        colors = random.sample(dawerha_colors, min(len(prizes), len(dawerha_colors)))
        
        # Determine final type
        final_type = custom_type if company_type == 'other' else company_type
        
        try:
            # Create company - store prizes as list of names for backward compatibility
            # and store percentages separately in a new field if needed
            company = Company.objects.create(
                name=company_name,
                type=company_type,
                custom_type=custom_type if company_type == 'other' else None,
                email=email,
                phone=phone if phone else None,
                prizes=prizes,  # Store as list of names
                colors=colors,
                status='pending',
                is_active=False
            )
            
            # Store prize percentages in notes field as JSON (temporary solution)
            # In production, you might want to add a separate JSONField for this
            if prize_percentages and len(prize_percentages) > 0:
                company.notes = json.dumps({
                    'prize_percentages': prize_percentages,
                    'prizes_with_percentages': prizes_with_percentages
                }, ensure_ascii=False)
                company.save()
        except Exception as db_error:
            logger.error(f'Database error creating company: {db_error}')
            raise
        
        return JsonResponse({
            'success': True,
            'message': 'تم التسجيل بنجاح! سيتم التواصل معك قريباً',
            'company_id': company.id,
            'redirect_url': reverse('companies:thanks', kwargs={'company_id': company.id})
        })
        
    except json.JSONDecodeError as e:
        logger.error(f'JSON decode error in register_company: {e}')
        return JsonResponse({
            'success': False,
            'message': 'خطأ في البيانات المرسلة'
        }, status=400)
    except Exception as e:
        logger.exception(f'Error in register_company: {e}')
        import traceback
        error_details = traceback.format_exc()
        logger.error(f'Full traceback: {error_details}')
        return JsonResponse({
            'success': False,
            'message': f'حدث خطأ: {str(e)}'
        }, status=500)


def company_dashboard(request, company_id):
    """Company dashboard view"""
    company = get_object_or_404(Company, id=company_id)
    
    # Get game statistics
    spins = company.spins.all()
    total_spins = spins.count()
    unique_visitors = spins.values('visitor_name').distinct().count()
    
    # Today's spins
    from django.utils import timezone
    today = timezone.now().date()
    today_spins = spins.filter(created_at__date=today).count()
    
    # This week's spins
    from datetime import timedelta
    week_ago = today - timedelta(days=7)
    week_spins = spins.filter(created_at__date__gte=week_ago).count()
    
    # Prize distribution
    prize_distribution = {}
    for spin in spins:
        prize = spin.prize
        prize_distribution[prize] = prize_distribution.get(prize, 0) + 1
    
    # Recent spins
    recent_spins = spins[:10]
    
    context = {
        'company': company,
        'total_spins': total_spins,
        'unique_visitors': unique_visitors,
        'today_spins': today_spins,
        'week_spins': week_spins,
        'prize_distribution': prize_distribution,
        'recent_spins': recent_spins,
    }
    
    return render(request, 'companies/dashboard.html', context)


@staff_member_required
@require_http_methods(["GET"])
def get_schedule_status(request, schedule_id):
    """Get real-time schedule activation status"""
    try:
        schedule = get_object_or_404(ActivationSchedule, id=schedule_id)
        company_status = schedule.get_company_activation_status()
        
        return JsonResponse({
            'success': True,
            'status': company_status['status'],
            'display': company_status['display'],
            'color': company_status['color'],
            'is_active': company_status['is_active'],
            'end_time': company_status.get('end_time'),
            'schedule_active': schedule.is_active,
            'should_activate_soon': schedule.should_activate_soon()
        })
    except Exception as e:
        return JsonResponse({
            'success': False,
            'error': str(e)
        }, status=500)


