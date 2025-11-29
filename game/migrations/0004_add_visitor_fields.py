# Generated manually to add visitor fields to GameSpin
from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('game', '0003_alter_gamespin_visitor_phone'),
    ]

    operations = [
        # Add visitor_name field (already added via SQL)
        migrations.AddField(
            model_name='gamespin',
            name='visitor_name',
            field=models.CharField(max_length=100, verbose_name='اسم الزائر'),
        ),
        # Add visitor_phone field (already added via SQL)
        migrations.AddField(
            model_name='gamespin',
            name='visitor_phone',
            field=models.CharField(blank=True, help_text='رقم الجوال السعودي (مثال: 0501234567) - اختياري', max_length=15, null=True, verbose_name='رقم الجوال'),
        ),
    ]

