"""
URL patterns for game app
"""
from django.urls import path
from . import views

app_name = 'game'

urlpatterns = [
    path('play/<slug:slug>/', views.play_game, name='play'),
    path('spin/<slug:slug>/', views.spin_wheel, name='spin'),
    path('dashboard/<slug:slug>/', views.game_dashboard, name='dashboard'),
]
