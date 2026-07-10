"""Per-provider SMTP probe rate limiting (Issue 2).

The egress IP's reputation is the most fragile asset in the system. Gmail and
Microsoft reputation-score probing IPs; a burst of simultaneous probes leads to
tempfails for every address and then blocklisting. This module caps, per
destination provider:

  * concurrent connections (default 2),
  * probes per minute per provider (default 10),
  * probes per minute across ALL providers (default 20),

and applies a cooldown (default 15 min) to a provider after a 421 or repeated
4xx. State lives in the shared Django cache (Redis) so limits hold across every
worker process; if Redis is unreachable it degrades to a per-process fallback
(still better than nothing — limits then apply per worker).

Defaults are deliberately conservative: loosen later with data, never before.
"""

import threading
import time
from typing import Any, Optional, Tuple

try:
    from django.conf import settings as _django_settings
except Exception:  # pragma: no cover - allow use outside Django
    _django_settings = None

try:
    from django.core.cache import cache as _django_cache
except Exception:  # pragma: no cover - allow use outside Django
    _django_cache = None


def _conf(name: str, default: Any) -> Any:
    if _django_settings is not None:
        try:
            return getattr(_django_settings, name, default)
        except Exception:
            return default
    return default


# MX-hostname substrings -> provider fingerprint. Order matters (first match).
_PROVIDER_FINGERPRINTS = [
    ("google", ("google", "googlemail", "gmail")),
    ("microsoft", ("outlook", "microsoft", "office365", "hotmail", "protection.outlook")),
    ("yahoo", ("yahoo", "yahoodns", "ymail")),
    ("proofpoint", ("pphosted", "proofpoint")),
    ("mimecast", ("mimecast",)),
]


def provider_for_mx(mx_host: str) -> str:
    """Fingerprint an MX hostname to a coarse provider bucket.

    Providers with distinct reputation systems (google, microsoft, yahoo,
    proofpoint, mimecast) get their own bucket; everything else is ``other``."""
    host = (mx_host or "").lower()
    for name, needles in _PROVIDER_FINGERPRINTS:
        if any(n in host for n in needles):
            return name
    return "other"


# In-process fallback used only when the shared cache is unavailable.
_local_lock = threading.Lock()
_local_counts = {}  # key -> (value, expires_at)


class ProviderRateLimiter:
    """Redis-backed token bucket + concurrency semaphore + cooldown, keyed on
    the MX provider fingerprint."""

    def __init__(self):
        self.enabled = bool(_conf("VALIDATION_SMTP_RATE_LIMIT_ENABLED", True))
        self.max_concurrent = int(
            _conf("VALIDATION_SMTP_MAX_CONCURRENT_PER_PROVIDER", 2)
        )
        self.max_per_provider = int(
            _conf("VALIDATION_SMTP_MAX_PROBES_PER_MINUTE_PER_PROVIDER", 10)
        )
        self.max_global = int(_conf("VALIDATION_SMTP_MAX_PROBES_PER_MINUTE_GLOBAL", 20))
        self.cooldown_seconds = int(_conf("VALIDATION_SMTP_PROVIDER_COOLDOWN", 900))
        self.soft_fail_threshold = int(_conf("VALIDATION_SMTP_SOFT_FAIL_THRESHOLD", 3))
        # Safety TTL on the concurrency counter so a crashed worker's slot frees.
        self.concurrency_ttl = int(_conf("VALIDATION_SMTP_CONCURRENCY_TTL", 120))

    # ------------------------------------------------------------ cache prims
    def _key(self, *parts: str) -> str:
        return "emailval:rl:" + ":".join(parts)

    def _get(self, key: str) -> int:
        if _django_cache is not None:
            try:
                return int(_django_cache.get(key) or 0)
            except Exception:
                pass
        with _local_lock:
            val, exp = _local_counts.get(key, (0, 0))
            if exp and time.time() >= exp:
                _local_counts.pop(key, None)
                return 0
            return int(val)

    def _incr(self, key: str, ttl: int) -> int:
        """Increment a counter, creating it (with TTL) if absent. Returns the
        new value. Falls back to an in-process counter if Redis is down."""
        if _django_cache is not None:
            try:
                if _django_cache.add(key, 1, timeout=ttl):
                    return 1
                return int(_django_cache.incr(key))
            except Exception:
                pass
        with _local_lock:
            val, exp = _local_counts.get(key, (0, 0))
            now = time.time()
            if not exp or now >= exp:
                _local_counts[key] = (1, now + ttl)
                return 1
            _local_counts[key] = (val + 1, exp)
            return val + 1

    def _decr(self, key: str) -> None:
        if _django_cache is not None:
            try:
                if _django_cache.get(key) is not None:
                    new = int(_django_cache.decr(key))
                    if new < 0:
                        _django_cache.set(key, 0, timeout=self.concurrency_ttl)
                return
            except Exception:
                pass
        with _local_lock:
            val, exp = _local_counts.get(key, (0, 0))
            if val > 0:
                _local_counts[key] = (val - 1, exp)

    def _set_flag(self, key: str, ttl: int) -> None:
        if _django_cache is not None:
            try:
                _django_cache.set(key, 1, timeout=ttl)
                return
            except Exception:
                pass
        with _local_lock:
            _local_counts[key] = (1, time.time() + ttl)

    def _flag_ttl(self, key: str) -> int:
        """Best-effort remaining TTL for a flag key (used as retry_after)."""
        if _django_cache is not None:
            try:
                # RedisCache exposes ttl(); fall back to the configured cooldown.
                ttl = getattr(_django_cache, "ttl", None)
                if callable(ttl):
                    remaining = ttl(key)
                    if remaining:
                        return int(remaining)
            except Exception:
                pass
        with _local_lock:
            _, exp = _local_counts.get(key, (0, 0))
            if exp:
                return max(1, int(exp - time.time()))
        return self.cooldown_seconds

    # --------------------------------------------------------------- public
    @staticmethod
    def _minute_bucket() -> str:
        return str(int(time.time() // 60))

    @staticmethod
    def _seconds_to_next_minute() -> int:
        return max(1, 60 - int(time.time()) % 60)

    def in_cooldown(self, provider: str) -> bool:
        return self._get(self._key("cooldown", provider)) > 0

    def try_acquire(self, provider: str) -> Tuple[bool, int, str]:
        """Attempt to reserve one probe slot for `provider`.

        Returns ``(allowed, retry_after_seconds, reason)``. On success the
        caller MUST later call :meth:`release`. On failure nothing is reserved.
        """
        if not self.enabled:
            return True, 0, "disabled"

        cooldown_key = self._key("cooldown", provider)
        if self._get(cooldown_key) > 0:
            return False, self._flag_ttl(cooldown_key), "cooldown"

        minute = self._minute_bucket()
        prov_key = self._key("min", provider, minute)
        global_key = self._key("min", "global", minute)
        conc_key = self._key("conc", provider)

        # Rate windows: check before counting so rejected attempts never inflate
        # the window (which would keep it blocked after load subsides).
        if self._get(prov_key) >= self.max_per_provider:
            return False, self._seconds_to_next_minute(), "provider_rate"
        if self._get(global_key) >= self.max_global:
            return False, self._seconds_to_next_minute(), "global_rate"

        # Concurrency: increment-then-check-and-rollback so it is atomic on
        # Redis (INCR), avoiding a check/incr race under bursty load.
        conc = self._incr(conc_key, ttl=self.concurrency_ttl)
        if conc > self.max_concurrent:
            self._decr(conc_key)
            return False, 5, "concurrency"

        self._incr(prov_key, ttl=70)
        self._incr(global_key, ttl=70)
        return True, 0, "ok"

    def release(self, provider: str) -> None:
        if not self.enabled:
            return
        self._decr(self._key("conc", provider))

    def trip_cooldown(self, provider: str) -> None:
        """Pause all probing to `provider` for the cooldown window (421 or
        repeated 4xx)."""
        if not self.enabled:
            return
        self._set_flag(self._key("cooldown", provider), ttl=self.cooldown_seconds)

    def note_soft_failure(self, provider: str) -> None:
        """Record a transient 4xx; trip the cooldown once they repeat."""
        if not self.enabled:
            return
        count = self._incr(self._key("soft", provider), ttl=70)
        if count >= self.soft_fail_threshold:
            self.trip_cooldown(provider)
