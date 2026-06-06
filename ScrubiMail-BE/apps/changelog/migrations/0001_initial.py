from django.db import migrations, models


class Migration(migrations.Migration):

    initial = True

    dependencies = []

    operations = [
        migrations.CreateModel(
            name='ChangelogEntry',
            fields=[
                ('id', models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('version', models.CharField(help_text='e.g. v2.4.0', max_length=30)),
                ('title', models.CharField(max_length=200)),
                ('summary', models.TextField(help_text='Short description shown in the list view')),
                ('body', models.TextField(help_text='Full markdown content shown on detail/expand')),
                ('entry_type', models.CharField(
                    choices=[
                        ('feature', 'New Feature'),
                        ('improvement', 'Improvement'),
                        ('fix', 'Bug Fix'),
                        ('security', 'Security'),
                        ('breaking', 'Breaking Change'),
                        ('deprecation', 'Deprecation'),
                    ],
                    default='feature',
                    max_length=20,
                )),
                ('status', models.CharField(
                    choices=[('draft', 'Draft'), ('published', 'Published')],
                    default='draft',
                    max_length=20,
                )),
                ('published_at', models.DateTimeField(blank=True, null=True)),
                ('created_at', models.DateTimeField(auto_now_add=True)),
                ('updated_at', models.DateTimeField(auto_now=True)),
            ],
            options={
                'db_table': 'changelog_entries',
                'ordering': ['-published_at', '-created_at'],
                'managed': True,
            },
        ),
    ]
