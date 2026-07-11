"""Issue 2 — per-provider SMTP rate limiting: concurrency cap, probes/minute
per provider and globally, and a cooldown on 421 / repeated 4xx."""

from unittest import mock

from django.test import SimpleTestCase

from apps.validation import rate_limit
from apps.validation.rate_limit import ProviderRateLimiter, provider_for_mx


class FakeRedisCache:
    """Cache stand-in implementing the atomic ops the limiter relies on
    (add/incr/decr) so tests exercise the real Redis code path."""

    def __init__(self):
        self.store = {}

    def get(self, key, default=None):
        return self.store.get(key, default)

    def set(self, key, value, timeout=None):
        self.store[key] = value

    def add(self, key, value, timeout=None):
        if key in self.store:
            return False
        self.store[key] = value
        return True

    def incr(self, key, delta=1):
        if key not in self.store:
            raise ValueError(key)
        self.store[key] = int(self.store[key]) + delta
        return self.store[key]

    def decr(self, key, delta=1):
        if key not in self.store:
            raise ValueError(key)
        self.store[key] = int(self.store[key]) - delta
        return self.store[key]


class ProviderFingerprintTests(SimpleTestCase):
    def test_known_providers(self):
        cases = {
            "gmail-smtp-in.l.google.com": "google",
            "outlook-com.olc.protection.outlook.com": "microsoft",
            "mta5.am0.yahoodns.net": "yahoo",
            "mx1.pphosted.com": "proofpoint",
            "us-smtp-inbound-1.mimecast.com": "mimecast",
            "mail.some-random-corp.com": "other",
            "": "other",
        }
        for host, expected in cases.items():
            self.assertEqual(provider_for_mx(host), expected, host)


class RateLimiterTests(SimpleTestCase):
    def setUp(self):
        self.cache = FakeRedisCache()
        self._patch = mock.patch.object(rate_limit, "_django_cache", self.cache)
        self._patch.start()
        rate_limit._local_counts.clear()
        self.lim = ProviderRateLimiter()

    def tearDown(self):
        self._patch.stop()

    def test_per_provider_minute_limit(self):
        self.lim.max_per_provider = 2
        self.lim.max_global = 100
        self.lim.max_concurrent = 100
        for _ in range(2):
            allowed, _, _ = self.lim.try_acquire("google")
            self.assertTrue(allowed)
            self.lim.release("google")
        allowed, retry_after, reason = self.lim.try_acquire("google")
        self.assertFalse(allowed)
        self.assertEqual(reason, "provider_rate")
        self.assertGreater(retry_after, 0)

    def test_concurrency_limit(self):
        self.lim.max_concurrent = 2
        self.lim.max_per_provider = 100
        self.lim.max_global = 100
        self.assertTrue(self.lim.try_acquire("microsoft")[0])
        self.assertTrue(self.lim.try_acquire("microsoft")[0])
        allowed, _, reason = self.lim.try_acquire("microsoft")
        self.assertFalse(allowed)
        self.assertEqual(reason, "concurrency")
        # Releasing a slot lets the next probe through.
        self.lim.release("microsoft")
        self.assertTrue(self.lim.try_acquire("microsoft")[0])

    def test_global_limit_across_providers(self):
        self.lim.max_global = 2
        self.lim.max_per_provider = 100
        self.lim.max_concurrent = 100
        for provider in ("google", "microsoft"):
            allowed, _, _ = self.lim.try_acquire(provider)
            self.assertTrue(allowed)
            self.lim.release(provider)
        allowed, _, reason = self.lim.try_acquire("yahoo")
        self.assertFalse(allowed)
        self.assertEqual(reason, "global_rate")

    def test_cooldown_blocks_provider(self):
        self.assertFalse(self.lim.in_cooldown("google"))
        self.lim.trip_cooldown("google")
        self.assertTrue(self.lim.in_cooldown("google"))
        allowed, retry_after, reason = self.lim.try_acquire("google")
        self.assertFalse(allowed)
        self.assertEqual(reason, "cooldown")
        self.assertGreater(retry_after, 0)
        # A different provider is unaffected.
        self.assertTrue(self.lim.try_acquire("yahoo")[0])

    def test_repeated_soft_failures_trip_cooldown(self):
        self.lim.soft_fail_threshold = 3
        for _ in range(2):
            self.lim.note_soft_failure("proofpoint")
            self.assertFalse(self.lim.in_cooldown("proofpoint"))
        self.lim.note_soft_failure("proofpoint")  # third 4xx
        self.assertTrue(self.lim.in_cooldown("proofpoint"))

    def test_disabled_limiter_always_allows(self):
        self.lim.enabled = False
        for _ in range(50):
            self.assertTrue(self.lim.try_acquire("google")[0])


class HandshakeRateLimitTests(SimpleTestCase):
    """When the limiter blocks, smtp_handshake must NOT open a connection and
    must return a rate_limited result the task can reschedule."""

    def test_handshake_returns_rate_limited_without_probing(self):
        from apps.validation import advanced_validator
        from apps.validation.advanced_validator import AdvancedEmailValidator

        opened = []

        class ExplodingSMTP:
            def __init__(self, *a, **k):
                opened.append(1)
                raise AssertionError("must not open a connection when rate-limited")

        validator = AdvancedEmailValidator()
        validator.smtp_enabled = True
        validator.rate_limiter = mock.Mock()
        validator.rate_limiter.try_acquire.return_value = (False, 42, "cooldown")

        with mock.patch.object(advanced_validator.smtplib, "SMTP", ExplodingSMTP):
            result = validator.smtp_handshake(
                "user@gmail.com",
                "gmail.com",
                [{"host": "gmail-smtp-in.l.google.com", "preference": 5, "score": 100}],
            )

        self.assertEqual(opened, [])
        self.assertEqual(result["status"], "unknown")
        self.assertEqual(result["sub_status"], "rate_limited")
        self.assertTrue(result["rate_limited"])
        self.assertEqual(result["retry_after"], 42)
        validator.rate_limiter.release.assert_not_called()
