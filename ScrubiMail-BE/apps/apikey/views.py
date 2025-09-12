from rest_framework import generics, permissions, status
from rest_framework.response import Response
from .models import APIKey
from .serializers import APIKeySerializer
from rest_framework.permissions import IsAuthenticated


class APIKeyListCreateView(generics.ListCreateAPIView):
    serializer_class = APIKeySerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        return APIKey.objects.filter(user=self.request.user)

    def post(self, request, *args, **kwargs):
        api_key = APIKey.generate_for_user(request.user)
        serializer = self.get_serializer(api_key)
        return Response(serializer.data, status=status.HTTP_201_CREATED)


class APIKeyDeactivateView(generics.UpdateAPIView):
    serializer_class = APIKeySerializer
    permission_classes = [IsAuthenticated]
    lookup_field = "pk"

    def get_queryset(self):
        return APIKey.objects.filter(user=self.request.user, is_active=True)

    def patch(self, request, *args, **kwargs):
        api_key = self.get_object()
        api_key.is_active = False
        api_key.save()
        serializer = self.get_serializer(api_key)
        return Response(serializer.data)
