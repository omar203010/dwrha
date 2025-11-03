"""
Views for companies app
"""
from django.shortcuts import render, redirect, get_object_or_404
from django.contrib import messages
from django.http import JsonResponse
from django.views.decorators.csrf import csrf_exempt
from django.views.decorators.http import require_http_methods
from django.utils.decorators import method_decorator
from django.views.generic import TemplateView
from django.urls import reverse
import json
import random
from .models import Company


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
        prizes_text = data.get('prizes', '').strip()
        
        # Validate required fields
        if not all([company_name, company_type, email, prizes_text]):
            return JsonResponse({
                'success': False,
                'message': 'جميع الحقول المطلوبة يجب ملؤها'
            }, status=400)
        
        # Process prizes
        prizes = [prize.strip() for prize in prizes_text.split(',') if prize.strip()]
        if not prizes:
            return JsonResponse({
                'success': False,
                'message': 'يجب تحديد جوائز واحدة على الأقل'
            }, status=400)
        
        # Generate colors
        dawerha_colors = [
            "#6A3FA0", "#F2C23E", "#8C59C4", "#FF6B9D", 
            "#2E2240", "#4ECDC4", "#B794F6", "#FF8B5A"
        ]
        colors = random.sample(dawerha_colors, min(len(prizes), len(dawerha_colors)))
        
        # Determine final type
        final_type = custom_type if company_type == 'other' else company_type
        
        # Create company
        company = Company.objects.create(
            name=company_name,
            type=company_type,
            custom_type=custom_type if company_type == 'other' else None,
            email=email,
            phone=phone if phone else None,
            prizes=prizes,
            colors=colors,
            status='pending',
            is_active=False
        )
        
        return JsonResponse({
            'success': True,
            'message': 'تم التسجيل بنجاح! سيتم التواصل معك قريباً',
            'company_id': company.id,
            'redirect_url': reverse('companies:thanks', kwargs={'company_id': company.id})
        })
        
    except json.JSONDecodeError:
        return JsonResponse({
            'success': False,
            'message': 'خطأ في البيانات المرسلة'
        }, status=400)
    except Exception as e:
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


