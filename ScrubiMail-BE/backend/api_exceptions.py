"""Custom DRF API exceptions.

Views raise these instead of hand-building error Response(...) payloads, so every
error flows through custom_exception_handler and comes out in the single error
envelope (see backend/exception_handlers.py)."""

from rest_framework import status
from rest_framework.exceptions import APIException


class InsufficientCredits(APIException):
    status_code = status.HTTP_402_PAYMENT_REQUIRED
    default_detail = "Insufficient credits for this request."
    default_code = "insufficient_credits"


class BulkLimitExceeded(APIException):
    status_code = status.HTTP_429_TOO_MANY_REQUESTS
    default_detail = "Bulk validation limit exceeded for your plan."
    default_code = "bulk_limit_exceeded"

    def __init__(
        self, detail=None, code=None, limit=None, requested=None, upgrade_url="/plans/"
    ):
        super().__init__(detail, code)
        # Surfaced under error.meta by the exception handler (not top-level).
        self.extra_meta = {
            "limit": limit,
            "requested": requested,
            "upgrade_url": upgrade_url,
        }
