"""Issue 6 — the SMTP circuit breaker state must be shared (Redis) so all
worker processes trip together on their COMBINED failure count, not each on its
own private counter."""

from unittest import mock

from django.test import SimpleTestCase

from apps.validation import advanced_validator
from apps.validation.advanced_validator import AdvancedEmailValidator


class FakeCache:
    """Shared cache stand-in with the ops the breaker uses."""

    def __init__(self):
        self.store = {}

    def get(self, key, default=None):
        return self.store.get(key, default)

    def set(self, key, value, timeout=None):
        self.store[key] = value

    def delete(self, key):
        self.store.pop(key, None)

    def add(self, key, value, timeout=None):
        if key in self.store:
            return False
        self.store[key] = value
        return True

    def incr(self, key, delta=1):
        if key not in self.store:
            raise ValueError(key)
        self.store[key] += delta
        return self.store[key]


class CircuitBreakerSharedStateTests(SimpleTestCase):
    def setUp(self):
        self.cache = FakeCache()
        self._patch = mock.patch.object(advanced_validator, "_django_cache", self.cache)
        self._patch.start()
        # Reset the in-process fallback so the test proves the SHARED path.
        advanced_validator._smtp_egress_blocked_until = 0.0
        advanced_validator._smtp_consecutive_failures = 0
        self.w1 = self._worker()
        self.w2 = self._worker()

    def tearDown(self):
        self._patch.stop()

    def _worker(self):
        v = AdvancedEmailValidator()
        v.smtp_failure_threshold = 3
        v.smtp_block_ttl = 600
        return v

    def test_combined_failures_across_workers_trip_both(self):
        # Two failures (one per worker) — below the threshold of 3.
        self.w1._breaker_record_failure()
        self.w2._breaker_record_failure()
        self.assertFalse(self.w1._breaker_is_open())
        self.assertFalse(self.w2._breaker_is_open())

        # The third failure (combined) trips the breaker for BOTH workers.
        self.w1._breaker_record_failure()
        self.assertTrue(self.w1._breaker_is_open())
        self.assertTrue(self.w2._breaker_is_open())
        self.assertIn("emailval:smtp:breaker_block", self.cache.store)

    def test_fresh_process_sees_breaker_via_shared_cache(self):
        for _ in range(3):
            self.w1._breaker_record_failure()
        self.assertTrue(self.w1._breaker_is_open())

        # Simulate a brand-new worker process: in-process globals are pristine,
        # but it must still see the breaker open (state came from Redis).
        advanced_validator._smtp_egress_blocked_until = 0.0
        advanced_validator._smtp_consecutive_failures = 0
        fresh = self._worker()
        self.assertTrue(fresh._breaker_is_open())

    def test_success_resets_shared_state(self):
        for _ in range(3):
            self.w1._breaker_record_failure()
        self.assertTrue(self.w2._breaker_is_open())

        # A single successful connection anywhere clears the shared breaker.
        self.w2._breaker_record_success()
        self.assertFalse(self.w1._breaker_is_open())
        self.assertFalse(self.w2._breaker_is_open())
        self.assertNotIn("emailval:smtp:breaker_block", self.cache.store)
        self.assertNotIn("emailval:smtp:breaker_failcount", self.cache.store)

    def test_falls_back_to_in_process_when_cache_down(self):
        # With no shared cache, the breaker still works per-process.
        with mock.patch.object(advanced_validator, "_django_cache", None):
            advanced_validator._smtp_egress_blocked_until = 0.0
            advanced_validator._smtp_consecutive_failures = 0
            w = self._worker()
            w._breaker_record_failure()
            w._breaker_record_failure()
            self.assertFalse(w._breaker_is_open())
            w._breaker_record_failure()
            self.assertTrue(w._breaker_is_open())
