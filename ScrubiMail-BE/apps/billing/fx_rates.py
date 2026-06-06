"""
USD → GHS for Paystack via CurrencyFreaks (cached), with static fallback.
"""

import logging
import requests
from decimal import Decimal, ROUND_HALF_UP
from django.conf import settings
from django.core.cache import cache

logger = logging.getLogger(__name__)

_CACHE_KEY = "billing:usd_to_ghs_rate"


def _fetch_usd_to_ghs_from_currencyfreaks():
    api_key = (getattr(settings, "CURRENCYFREAKS_API_KEY", None) or "").strip()
    if not api_key:
        return None

    url = "https://api.fastforex.io/fetch-one?from=USD&to=GHS"
    try:
        response = requests.get(
            url,
            params={"api_key": api_key},
            timeout=getattr(settings, "CURRENCYFREAKS_REQUEST_TIMEOUT", 10),
        )
        response.raise_for_status()
        payload = response.json()
        rates = payload.get("result") or {}
        print("payload", payload)
        ghs_raw = rates.get("GHS")
        if ghs_raw is None:
            logger.warning("CurrencyFreaks response missing rates.GHS")
            return None

        # Typically: 1 USD = X GHS
        base_rate = Decimal(str(ghs_raw))
        buffer = Decimal(str(getattr(settings, "PAYSTACK_FX_BUFFER", "1.05")))
        safe_rate = (base_rate * buffer).quantize(
            Decimal("0.0001"), rounding=ROUND_HALF_UP
        )
        return safe_rate
    except requests.RequestException:
        logger.exception("CurrencyFreaks USD→GHS HTTP error")
        return None
    except (ValueError, TypeError, KeyError, ArithmeticError):
        logger.exception("CurrencyFreaks USD→GHS parse error")
        return None


def get_usd_to_ghs_rate():
    """
    Return Decimal rate (USD major → GHS major per 1 USD), with buffer already applied
    when sourced from CurrencyFreaks.

    Order: cached live rate → fresh API → PAYSTACK_FX_USD_TO_GHS fallback.
    """
    ttl = int(getattr(settings, "PAYSTACK_FX_CACHE_TTL", 3600))
    cached = cache.get(_CACHE_KEY)
    if cached is not None:
        return Decimal(str(cached))

    live = _fetch_usd_to_ghs_from_currencyfreaks()
    if live is not None and live > 0:
        cache.set(_CACHE_KEY, str(live), timeout=ttl)
        logger.info("Cached USD→GHS rate from CurrencyFreaks: %s (ttl=%ss)", live, ttl)
        return live

    fallback = Decimal(str(getattr(settings, "PAYSTACK_FX_USD_TO_GHS", "1")))
    if fallback <= 0:
        return None
    logger.warning(
        "Using PAYSTACK_FX_USD_TO_GHS fallback for USD→GHS (no live rate): %s",
        fallback,
    )
    return fallback
