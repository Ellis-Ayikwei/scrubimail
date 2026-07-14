import logging

from django.db import connection
from rest_framework import status
from rest_framework.permissions import AllowAny
from rest_framework.response import Response
from rest_framework.views import APIView

logger = logging.getLogger(__name__)


class ApiConnectionStatusView(APIView):
    """Liveness: the process is up and serving HTTP. Touches nothing."""

    permission_classes = [AllowAny]

    def get(self, _):
        return Response({"status": "Connected ScrubiMail Api"})


class HealthCheckView(APIView):
    """Readiness: can this instance actually serve a real request?

    Point the platform health check HERE, not at `/`. `/` returns 200 from a
    process whose database is unreachable — every API route then hangs on the
    DB until gunicorn kills the worker, which the platform surfaces as an opaque
    502 while the deploy still looks healthy. This endpoint fails instead.
    """

    permission_classes = [AllowAny]

    def get(self, _):
        checks = {}
        healthy = True

        try:
            with connection.cursor() as cursor:
                cursor.execute("SELECT 1")
                cursor.fetchone()
            checks["database"] = "ok"
        except Exception as exc:
            healthy = False
            checks["database"] = f"error: {exc.__class__.__name__}: {exc}"
            logger.exception("Health check: database unreachable")

        return Response(
            {"status": "ok" if healthy else "unhealthy", "checks": checks},
            status=(
                status.HTTP_200_OK
                if healthy
                else status.HTTP_503_SERVICE_UNAVAILABLE
            ),
        )
