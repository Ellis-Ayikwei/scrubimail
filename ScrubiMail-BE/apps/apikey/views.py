from rest_framework import generics, permissions, status
from rest_framework.response import Response
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated
from django.shortcuts import get_object_or_404
from django.utils import timezone
from .models import APIKey
from .serializers import (
    APIKeySerializer,
    APIKeyCreateSerializer,
    APIKeyUpdateSerializer,
    APIKeyUsageSerializer,
)


class APIKeyListCreateView(generics.ListCreateAPIView):
    permission_classes = [IsAuthenticated]

    def get_serializer_class(self):
        if self.request.method == "POST":
            return APIKeyCreateSerializer
        return APIKeySerializer

    def get_queryset(self):
        return APIKey.objects.filter(user=self.request.user).order_by("-created_at")

    def perform_create(self, serializer):
        # Get client IP and user agent
        ip_address = self.get_client_ip()
        user_agent = self.request.META.get("HTTP_USER_AGENT", "")

        # Generate new API key with additional metadata
        api_key = APIKey.generate_for_user(
            user=self.request.user,
            name=serializer.validated_data.get("name"),
            description=serializer.validated_data.get("description"),
            expires_at=serializer.validated_data.get("expires_at"),
            rate_limit_per_hour=serializer.validated_data.get(
                "rate_limit_per_hour", 1000
            ),
            ip_address=ip_address,
            user_agent=user_agent,
        )

        # Return the created API key
        self.object = api_key

    def get_client_ip(self):
        """Get client IP address from request"""
        x_forwarded_for = self.request.META.get("HTTP_X_FORWARDED_FOR")
        if x_forwarded_for:
            ip = x_forwarded_for.split(",")[0]
        else:
            ip = self.request.META.get("REMOTE_ADDR")
        return ip


class APIKeyDetailView(generics.RetrieveUpdateDestroyAPIView):
    permission_classes = [IsAuthenticated]
    lookup_field = "pk"

    def get_serializer_class(self):
        if self.request.method in ["PUT", "PATCH"]:
            return APIKeyUpdateSerializer
        return APIKeySerializer

    def get_queryset(self):
        return APIKey.objects.filter(user=self.request.user)

    def perform_update(self, serializer):
        serializer.save()

    def perform_destroy(self, instance):
        # Soft delete by deactivating
        instance.deactivate()


class APIKeyDeactivateView(generics.UpdateAPIView):
    serializer_class = APIKeySerializer
    permission_classes = [IsAuthenticated]
    lookup_field = "pk"

    def get_queryset(self):
        return APIKey.objects.filter(user=self.request.user, is_active=True)

    def patch(self, request, *args, **kwargs):
        api_key = self.get_object()
        api_key.deactivate()
        serializer = self.get_serializer(api_key)
        return Response(serializer.data)


class APIKeyUsageView(generics.RetrieveAPIView):
    """View to get usage statistics for a specific API key"""

    serializer_class = APIKeyUsageSerializer
    permission_classes = [IsAuthenticated]
    lookup_field = "pk"

    def get_queryset(self):
        return APIKey.objects.filter(user=self.request.user)


@api_view(["GET"])
@permission_classes([IsAuthenticated])
def api_key_stats(request):
    """Get overall API key statistics for the user"""
    user_keys = APIKey.objects.filter(user=request.user)

    stats = {
        "total_keys": user_keys.count(),
        "active_keys": user_keys.filter(is_active=True).count(),
        "expired_keys": user_keys.filter(expires_at__lt=timezone.now()).count(),
        "total_usage": sum(key.usage_count for key in user_keys),
        "recent_usage": user_keys.filter(
            last_used__gte=timezone.now() - timezone.timedelta(days=7)
        ).count(),
    }

    return Response(stats)


@api_view(["POST"])
@permission_classes([IsAuthenticated])
def regenerate_api_key(request, pk):
    """Regenerate an existing API key"""
    api_key = get_object_or_404(APIKey, pk=pk, user=request.user)

    # Deactivate current key
    api_key.deactivate()

    # Create new key with same settings
    new_api_key = APIKey.generate_for_user(
        user=request.user,
        name=api_key.name,
        description=api_key.description,
        expires_at=api_key.expires_at,
        rate_limit_per_hour=api_key.rate_limit_per_hour,
        ip_address=request.META.get("REMOTE_ADDR"),
        user_agent=request.META.get("HTTP_USER_AGENT", ""),
    )

    serializer = APIKeySerializer(new_api_key)
    return Response(serializer.data, status=status.HTTP_201_CREATED)


@api_view(["POST"])
@permission_classes([IsAuthenticated])
def bulk_deactivate_keys(request):
    """Deactivate multiple API keys at once"""
    key_ids = request.data.get("key_ids", [])

    if not key_ids:
        return Response(
            {"error": "No key IDs provided"}, status=status.HTTP_400_BAD_REQUEST
        )

    # Deactivate keys belonging to the user
    updated_count = APIKey.objects.filter(
        id__in=key_ids, user=request.user, is_active=True
    ).update(is_active=False)

    return Response(
        {
            "message": f"Successfully deactivated {updated_count} API keys",
            "deactivated_count": updated_count,
        }
    )
