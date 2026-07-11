"""Single API error envelope.

Every non-2xx response from the API is normalized to:

    {
      "success": false,
      "error": {
        "code": "<stable machine-readable code>",
        "message": "<human summary>",
        "details": [{"field": "<dotted.path>", "issue": "<message>"}, ...],
        "meta": { ... }          # optional (throttle / bulk-limit extras)
      }
    }

Clients branch on error.code (documented, test-covered). Raw DRF error dicts,
Django exception text and tracebacks are never exposed.
"""

import logging

from django.http import Http404
from rest_framework import status
from rest_framework.exceptions import (
    APIException,
    AuthenticationFailed,
    NotAuthenticated,
    NotFound,
    PermissionDenied,
    Throttled,
    ValidationError,
)
from rest_framework.response import Response
from rest_framework.views import exception_handler

logger = logging.getLogger(__name__)

# Documented, stable error codes. See the API docs "Error handling" section.
ERROR_CODES = (
    "validation_error",
    "authentication_required",
    "invalid_credentials",
    "permission_denied",
    "not_found",
    "rate_limit_exceeded",
    "insufficient_credits",
    "internal_error",
    "api_error",  # fallback for anything unmapped
)

# Fields that are "non-field" errors — their message is rendered bare (no
# "field: issue" prefix), and they surface DRF's generic "detail" key too.
_NON_FIELD = {"non_field_errors", "non_field", "detail", "", None}

_CODE_BY_STATUS = {
    status.HTTP_400_BAD_REQUEST: "validation_error",
    status.HTTP_401_UNAUTHORIZED: "authentication_required",
    status.HTTP_402_PAYMENT_REQUIRED: "insufficient_credits",
    status.HTTP_403_FORBIDDEN: "permission_denied",
    status.HTTP_404_NOT_FOUND: "not_found",
    status.HTTP_429_TOO_MANY_REQUESTS: "rate_limit_exceeded",
}


def _error_code(exc, status_code):
    """Map an exception to a stable, machine-readable code."""
    if isinstance(exc, Throttled):
        return "rate_limit_exceeded"
    if isinstance(exc, AuthenticationFailed):
        return "invalid_credentials"
    if isinstance(exc, NotAuthenticated):
        return "authentication_required"
    if isinstance(exc, PermissionDenied):
        return "permission_denied"
    if isinstance(exc, (NotFound, Http404)):
        return "not_found"
    if isinstance(exc, ValidationError):
        return "validation_error"
    if getattr(exc, "default_code", None) == "insufficient_credits":
        return "insufficient_credits"
    return _CODE_BY_STATUS.get(status_code, "api_error")


def _flatten(detail, prefix=""):
    """Flatten DRF's nested error detail (dicts / lists / nested serializers)
    into a flat list of {field, issue} with dotted field paths."""
    out = []
    if isinstance(detail, dict):
        for key, value in detail.items():
            path = f"{prefix}.{key}" if prefix else str(key)
            out.extend(_flatten(value, path))
    elif isinstance(detail, (list, tuple)):
        for item in detail:
            out.extend(_flatten(item, prefix))
    else:
        out.append({"field": prefix or "non_field_errors", "issue": str(detail)})
    return out


def _message_from(details, exc):
    """First detail as "field: issue" (bare issue for non-field errors)."""
    if details:
        first = details[0]
        field, issue = first.get("field"), first.get("issue")
        if field in _NON_FIELD:
            return issue
        return f"{field}: {issue}"
    detail = getattr(exc, "detail", None)
    return str(detail) if detail else "Request could not be processed."


def _throttle_meta(exc, context):
    meta = {}
    wait = getattr(exc, "wait", None)
    if wait:
        meta["retry_after"] = int(wait)
        meta["retry_after_human"] = format_wait_time(wait)

    request = context.get("request") if context else None
    if request and getattr(request, "user", None) and request.user.is_authenticated:
        try:
            from apps.billing.models import BillingProfile

            profile = BillingProfile.objects.select_related("current_plan").get(
                user=request.user
            )
            if profile.current_plan:
                meta["plan"] = profile.current_plan.name
                meta["current_limit"] = (
                    f"{profile.current_plan.max_api_calls_per_hour} requests/hour"
                )
                meta["upgrade_url"] = "/scrubimail/api/v1/plans/"
        except Exception:
            pass
    return meta


def custom_exception_handler(exc, context):
    """Normalize every API error to the single envelope."""
    response = exception_handler(exc, context)

    if response is None:
        # Unhandled exception -> 500. Log the full traceback for us, but return
        # only the generic envelope — never leak exception text or a stack trace.
        logger.exception("Unhandled API exception")
        return Response(
            {
                "success": False,
                "error": {
                    "code": "internal_error",
                    "message": "An unexpected server error occurred.",
                    "details": [],
                },
            },
            status=status.HTTP_500_INTERNAL_SERVER_ERROR,
        )

    status_code = response.status_code
    detail = getattr(exc, "detail", response.data)
    details = _flatten(detail)
    error = {
        "code": _error_code(exc, status_code),
        "message": _message_from(details, exc),
        "details": details,
    }

    meta = {}
    if isinstance(exc, Throttled):
        meta.update(_throttle_meta(exc, context))
    extra = getattr(exc, "extra_meta", None)
    if extra:
        meta.update({k: v for k, v in extra.items() if v is not None})
    if meta:
        error["meta"] = meta

    return Response({"success": False, "error": error}, status=status_code)


def format_wait_time(seconds):
    """Format wait time in human-readable format"""
    if seconds < 60:
        return f"{int(seconds)} seconds"
    elif seconds < 3600:
        minutes = int(seconds / 60)
        return f"{minutes} minute{'s' if minutes != 1 else ''}"
    else:
        hours = int(seconds / 3600)
        return f"{hours} hour{'s' if hours != 1 else ''}"
