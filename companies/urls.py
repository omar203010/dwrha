"""
URL patterns for companies app
"""
from django.urls import path
from . import views

app_name = 'companies'

urlpatterns = [
    path('', views.HomeView.as_view(), name='home'),
    path('thanks/<int:company_id>/', views.ThanksView.as_view(), name='thanks'),
    path('register/', views.register_company, name='register'),
    path('dashboard/<int:company_id>/', views.company_dashboard, name='dashboard'),
    path('admin/schedule-status/<int:schedule_id>/', views.get_schedule_status, name='schedule_status'),
]


