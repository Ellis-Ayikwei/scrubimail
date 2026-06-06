from rest_framework import generics, status
from rest_framework.permissions import AllowAny, IsAdminUser
from rest_framework.response import Response
from rest_framework.views import APIView
from django.utils import timezone
from .models import ChangelogEntry
from .serializers import ChangelogEntrySerializer


class PublicChangelogListView(generics.ListAPIView):
    """
    Public endpoint — returns all published changelog entries.
    No authentication required.
    GET /changelog/
    """
    serializer_class = ChangelogEntrySerializer
    permission_classes = [AllowAny]

    def get_queryset(self):
        qs = ChangelogEntry.objects.filter(status='published')
        entry_type = self.request.query_params.get('type')
        if entry_type:
            qs = qs.filter(entry_type=entry_type)
        return qs


class AdminChangelogListCreateView(generics.ListCreateAPIView):
    """
    Admin endpoint — list all entries (any status) and create new ones.
    Requires admin authentication.
    GET/POST /admin/changelog/
    """
    serializer_class = ChangelogEntrySerializer
    permission_classes = [IsAdminUser]
    queryset = ChangelogEntry.objects.all()


class AdminChangelogDetailView(generics.RetrieveUpdateDestroyAPIView):
    """
    Admin endpoint — retrieve, update, or delete a single entry.
    Requires admin authentication.
    GET/PUT/PATCH/DELETE /admin/changelog/<pk>/
    """
    serializer_class = ChangelogEntrySerializer
    permission_classes = [IsAdminUser]
    queryset = ChangelogEntry.objects.all()


class AdminPublishChangelogView(APIView):
    """
    Admin endpoint — publish a draft entry immediately.
    Sets status='published' and published_at=now.
    POST /admin/changelog/<pk>/publish/
    """
    permission_classes = [IsAdminUser]

    def post(self, request, pk):
        try:
            entry = ChangelogEntry.objects.get(pk=pk)
        except ChangelogEntry.DoesNotExist:
            return Response({'detail': 'Not found.'}, status=status.HTTP_404_NOT_FOUND)

        entry.status = 'published'
        entry.published_at = timezone.now()
        entry.save()
        return Response(ChangelogEntrySerializer(entry).data)
