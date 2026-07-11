"""Issue 9 — the realtime endpoint verifies deeply by default within a time
budget, returns valid/invalid inline, caches results, and degrades honestly to
unknown (never blocks, never fabricates valid). ?mode=fast opens no SMTP."""

from unittest import mock

from django.test import SimpleTestCase

from apps.validation import advanced_validator
from apps.validation.advanced_validator import AdvancedEmailValidator


class FakeCache:
    def __init__(self):
        self.store = {}

    def get(self, key, default=None):
        return self.store.get(key, default)

    def set(self, key, value, timeout=None):
        self.store[key] = value

    def delete(self, key):
        self.store.pop(key, None)


class FakeSMTP:
    instances = []
    rcpt_code = 250
    rcpt_msg = b"OK mailbox exists"

    def __init__(self, timeout=None):
        self.timeout = timeout
        FakeSMTP.instances.append(self)

    def connect(self, host, port):
        return (220, b"ready")

    def helo(self, host):
        return (250, b"ok")

    def has_extn(self, ext):
        return False

    def mail(self, addr):
        return (250, b"ok")

    def rcpt(self, addr):
        if addr.split("@", 1)[0].startswith("xq7z9k-"):
            return (550, b"no catch-all")
        return (FakeSMTP.rcpt_code, FakeSMTP.rcpt_msg)

    def rset(self):
        return (250, b"ok")

    def quit(self):
        pass

    def close(self):
        pass


MX = [{"host": "mx.example.com", "preference": 10, "score": 50}]
DNS_OK = {"valid": True, "null_mx": False, "mx_records": MX, "a_records": [], "score": 80}


class RealtimeTests(SimpleTestCase):
    def setUp(self):
        self.cache = FakeCache()
        self._patches = [
            mock.patch.object(advanced_validator, "_django_cache", self.cache),
            mock.patch.object(advanced_validator.smtplib, "SMTP", FakeSMTP),
        ]
        for p in self._patches:
            p.start()
        advanced_validator._domain_cache.clear()
        advanced_validator._smtp_egress_blocked_until = 0.0
        advanced_validator._smtp_consecutive_failures = 0
        FakeSMTP.instances = []
        FakeSMTP.rcpt_code = 250
        FakeSMTP.rcpt_msg = b"OK mailbox exists"
        self.v = AdvancedEmailValidator()
        self.v.smtp_enabled = True
        self.v.rate_limiter.enabled = False
        # DNS is mocked so tests never touch the network.
        self._dns = mock.patch.object(self.v, "check_dns_mx", return_value=dict(DNS_OK))
        self._dns.start()

    def tearDown(self):
        self._dns.stop()
        for p in self._patches:
            p.stop()

    def test_deep_returns_valid_and_caches_repeat(self):
        result, from_cache = self.v.validate_email_realtime("user@example.com")
        self.assertEqual(result.metadata["status"], "valid")
        self.assertEqual(result.metadata["sub_status"], "mailbox_exists")
        self.assertFalse(from_cache)
        self.assertTrue(result.is_valid)
        self.assertIsNotNone(result.metadata.get("verified_at"))
        self.assertEqual(len(FakeSMTP.instances), 1)

        # Repeat lookup: served from cache, no new SMTP probe.
        result2, from_cache2 = self.v.validate_email_realtime("user@example.com")
        self.assertTrue(from_cache2)
        self.assertEqual(result2.metadata["status"], "valid")
        self.assertEqual(len(FakeSMTP.instances), 1)

    def test_deep_returns_invalid_for_unknown_mailbox(self):
        FakeSMTP.rcpt_code = 550
        FakeSMTP.rcpt_msg = b"user unknown"
        result, _ = self.v.validate_email_realtime("nobody@example.com")
        self.assertEqual(result.metadata["status"], "invalid")
        self.assertEqual(result.metadata["sub_status"], "mailbox_not_found")

    def test_fast_mode_opens_no_smtp_and_is_not_cached(self):
        result, from_cache = self.v.validate_email_realtime("user@example.com", fast=True)
        self.assertEqual(len(FakeSMTP.instances), 0)  # never opened a connection
        self.assertEqual(result.metadata["status"], "unknown")
        self.assertFalse(from_cache)
        # Fast results must not poison the cache for a later deep lookup.
        result2, from_cache2 = self.v.validate_email_realtime("user@example.com", fast=True)
        self.assertFalse(from_cache2)

    def test_breaker_open_falls_back_to_smtp_unavailable(self):
        with mock.patch.object(self.v, "_breaker_is_open", return_value=True):
            result, _ = self.v.validate_email_realtime("user@example.com")
        self.assertEqual(len(FakeSMTP.instances), 0)  # no probe when egress down
        self.assertEqual(result.metadata["status"], "unknown")
        self.assertEqual(result.metadata["sub_status"], "smtp_unavailable")

    def test_rate_limited_returns_unknown_without_probing(self):
        self.v.rate_limiter.enabled = True
        with mock.patch.object(
            self.v.rate_limiter, "try_acquire", return_value=(False, 1, "cooldown")
        ):
            result, _ = self.v.validate_email_realtime("user@example.com")
        self.assertEqual(len(FakeSMTP.instances), 0)
        self.assertEqual(result.metadata["status"], "unknown")
        self.assertEqual(result.metadata["sub_status"], "rate_limited")

    def test_smtp_disabled_worker_reports_unavailable(self):
        self.v.smtp_enabled = False
        result, _ = self.v.validate_email_realtime("user@example.com")
        self.assertEqual(len(FakeSMTP.instances), 0)
        self.assertEqual(result.metadata["sub_status"], "smtp_unavailable")

    def test_budget_expired_skips_probe_with_timeout(self):
        # A near-zero budget means the SMTP stage would start after the budget is
        # spent, so it is skipped and reported honestly as unknown/timeout.
        result = self.v.validate_email("user@example.com", deep=True, budget=0.001)
        self.assertEqual(len(FakeSMTP.instances), 0)
        self.assertEqual(result.metadata["status"], "unknown")
        self.assertEqual(result.metadata["sub_status"], "timeout")
