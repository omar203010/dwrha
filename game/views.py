"""
Views for game app
"""
from django.shortcuts import render, get_object_or_404
from django.http import JsonResponse
from django.views.decorators.csrf import csrf_exempt
from django.views.decorators.http import require_http_methods
from django.utils import timezone
from django.db.models import Count
from companies.models import Company
from .models import GameSpin
import json
import random
from datetime import timedelta


def select_weighted_prize(company, prizes):
    """
    Select a prize using weighted random algorithm to ensure fair distribution.
    
    Algorithm:
    1. Calculate recent prize frequency (last 100 spins)
    2. Give higher weights to less frequently won prizes
    3. Ensure randomness but prevent over-repetition
    4. Use exponential decay for recent frequency to balance fairness and unpredictability
    """
    # Get recent spins for this company (last 100 spins)
    recent_limit = 100
    recent_spins = GameSpin.objects.filter(
        company=company
    ).order_by('-created_at')[:recent_limit]
    
    # Count recent occurrences of each prize
    prize_counts = {}
    for spin in recent_spins:
        prize = spin.prize
        prize_counts[prize] = prize_counts.get(prize, 0) + 1
    
    # Calculate base weight for each prize (inverse of recent frequency)
    # Add 1 to avoid division by zero and give each prize a minimum weight
    weights = []
    for prize in prizes:
        recent_count = prize_counts.get(prize, 0)
        # Weight formula: 1 / (count + 1)^2
        # This gives exponentially lower weight to frequently won prizes
        weight = 1 / ((recent_count + 1) ** 1.5)
        weights.append(weight)
    
    # Normalize weights to sum to 1 (probability distribution)
    total_weight = sum(weights)
    if total_weight > 0:
        weights = [w / total_weight for w in weights]
    
    # Select prize based on weighted random
    selected_prize = random.choices(prizes, weights=weights, k=1)[0]
    
    return selected_prize


def play_game(request, slug):
    """Game page view"""
    company = get_object_or_404(Company, slug=slug)
    
    # Always show the play page, but pass activation status
    context = {
        'company': company,
        'prizes': company.get_prizes_list(),
        'colors': company.get_colors_list(),
        'status': company.status,
        'is_active': company.is_currently_active,
        'activation_end_time': company.activation_end_time
    }
    
    return render(request, 'game/play.html', context)


@csrf_exempt
@require_http_methods(["POST"])
def spin_wheel(request, slug):
    """Handle wheel spin"""
    try:
        company = get_object_or_404(Company, slug=slug)
        
        # Check if company is currently active (allow pending companies if they are active)
        if not company.is_currently_active:
            return JsonResponse({
                'success': False,
                'message': 'الشركة غير مفعلة حالياً'
            }, status=403)
        
        data = json.loads(request.body)
        visitor_name = data.get('visitor_name', '').strip()
        visitor_phone = data.get('visitor_phone', '').strip()
        
        if not visitor_name:
            return JsonResponse({
                'success': False,
                'message': 'اسم الزائر مطلوب'
            }, status=400)
        
        # Validate phone number format (optional)
        import re
        phone_pattern = r'^05[0-9]{8}$'
        if visitor_phone and not re.match(phone_pattern, visitor_phone):
            return JsonResponse({
                'success': False,
                'message': 'رقم الجوال غير صحيح. يجب أن يبدأ بـ 05 ويحتوي على 10 أرقام أو تركه فارغاً'
            }, status=400)
        
        # Get prizes
        prizes = company.get_prizes_list()
        if not prizes:
            return JsonResponse({
                'success': False,
                'message': 'لا توجد جوائز متاحة'
            }, status=400)
        
        # Select random prize using weighted algorithm to prevent over-repetition
        selected_prize = select_weighted_prize(company, prizes)
        
        # Get client info
        ip_address = request.META.get('REMOTE_ADDR')
        user_agent = request.META.get('HTTP_USER_AGENT', '')
        
        # Create spin record
        spin = GameSpin.objects.create(
            company=company,
            visitor_name=visitor_name,
            visitor_phone=visitor_phone if visitor_phone else None,
            prize=selected_prize,
            won=True,
            session_id=request.session.session_key or f'session_{timezone.now().timestamp()}',
            ip_address=ip_address,
            user_agent=user_agent
        )
        
        return JsonResponse({
            'success': True,
            'prize': selected_prize,
            'spin_id': spin.id
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


def game_dashboard(request, slug):
    """Game dashboard for company"""
    company = get_object_or_404(Company, slug=slug)
    
    # Get statistics
    spins = company.spins.all()
    total_spins = spins.count()
    unique_visitors = spins.values('visitor_name').distinct().count()
    
    # Today's spins
    today = timezone.now().date()
    today_spins = spins.filter(created_at__date=today).count()
    
    # This week's spins
    from datetime import timedelta
    week_ago = today - timedelta(days=7)
    week_spins = spins.filter(created_at__date__gte=week_ago).count()
    
    # Prize distribution
    prize_distribution = spins.values('prize').annotate(count=Count('prize')).order_by('-count')
    
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
    
    return render(request, 'game/dashboard.html', context)
