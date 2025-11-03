"""
Game models for storing spin data
"""
from django.db import models
from django.utils import timezone
from companies.models import Company


class GameSpin(models.Model):
    """
    Model for storing game spin results
    """
    company = models.ForeignKey(
        Company, 
        on_delete=models.CASCADE,
        related_name='spins',
        verbose_name="الشركة"
    )
    visitor_name = models.CharField(
        max_length=100,
        verbose_name="اسم الزائر"
    )
    visitor_phone = models.CharField(
        max_length=15,
        blank=True,
        null=True,
        verbose_name="رقم الجوال",
        help_text="رقم الجوال السعودي (مثال: 0501234567) - اختياري"
    )
    prize = models.CharField(
        max_length=200,
        verbose_name="الجائزة"
    )
    won = models.BooleanField(
        default=True,
        verbose_name="فاز"
    )
    session_id = models.CharField(
        max_length=100,
        blank=True,
        null=True,
        verbose_name="معرف الجلسة"
    )
    ip_address = models.GenericIPAddressField(
        blank=True,
        null=True,
        verbose_name="عنوان IP"
    )
    user_agent = models.TextField(
        blank=True,
        null=True,
        verbose_name="معلومات المتصفح"
    )
    created_at = models.DateTimeField(
        default=timezone.now,
        verbose_name="تاريخ الدورة"
    )
    
    class Meta:
        verbose_name = "دورة لعبة"
        verbose_name_plural = "دورات الألعاب"
        ordering = ['-created_at']
    
    def __str__(self):
        return f"{self.visitor_name} - {self.prize} ({self.company.name})"
