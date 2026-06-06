# Generated manually
from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('plan', '0001_initial'),
    ]

    operations = [
        migrations.AddField(
            model_name='plan',
            name='yearly_price',
            field=models.DecimalField(decimal_places=2, help_text='Yearly price (if null, calculated as monthly * 10)', max_digits=10, null=True, blank=True),
        ),
    ]





