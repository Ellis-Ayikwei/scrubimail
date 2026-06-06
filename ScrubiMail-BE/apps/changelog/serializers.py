from rest_framework import serializers
from .models import ChangelogEntry


class ChangelogEntrySerializer(serializers.ModelSerializer):
    entry_type_display = serializers.CharField(source='get_entry_type_display', read_only=True)
    status_display = serializers.CharField(source='get_status_display', read_only=True)

    class Meta:
        model = ChangelogEntry
        fields = '__all__'
