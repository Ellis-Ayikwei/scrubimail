from django.db import models


class ChangelogEntry(models.Model):
    TYPE_CHOICES = [
        ('feature', 'New Feature'),
        ('improvement', 'Improvement'),
        ('fix', 'Bug Fix'),
        ('security', 'Security'),
        ('breaking', 'Breaking Change'),
        ('deprecation', 'Deprecation'),
    ]

    STATUS_CHOICES = [
        ('draft', 'Draft'),
        ('published', 'Published'),
    ]

    version = models.CharField(max_length=30, help_text="e.g. v2.4.0")
    title = models.CharField(max_length=200)
    summary = models.TextField(help_text="Short description shown in the list view")
    body = models.TextField(help_text="Full markdown content shown on detail/expand")
    entry_type = models.CharField(max_length=20, choices=TYPE_CHOICES, default='feature')
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='draft')
    published_at = models.DateTimeField(null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return f"{self.version} — {self.title}"

    class Meta:
        managed = True
        db_table = 'changelog_entries'
        ordering = ['-published_at', '-created_at']
