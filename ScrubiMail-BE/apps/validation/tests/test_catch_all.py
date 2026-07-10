"""Issue 1 — catch-all detection must be cached per domain and must reuse the
existing SMTP session instead of opening a second connection per address."""

from unittest import mock

from django.test import SimpleTestCase

from apps.validation import advanced_validator
from apps.validation.advanced_validator import AdvancedEmailValidator


class FakeCache:
    """Minimal Django-cache stand-in backed by a dict (no TTL expiry needed
    for these tests — we only assert hit vs. miss)."""

    def __init__(self):
        self.store = {}

    def get(self, key, default=None):
        return self.store.get(key, default)

    def set(self, key, value, timeout=None):
        self.store[key] = value


class FakeSMTP:
    """Records connections and RCPTs so tests can assert probe counts.

    A real-address RCPT returns 250 (deliverable). The random catch-all probe
    (local part starts with ``xq7z9k-``) returns ``catchall_code`` so tests can
    drive catch-all True/False."""

    instances = []
    catchall_code = 550  # default: domain is NOT catch-all

    def __init__(self, timeout=None):
        self.timeout = timeout
        self.connected_to = None
        self.rcpt_calls = []
        self.rset_calls = 0
        self.mail_calls = 0
        self.quit_called = False
        FakeSMTP.instances.append(self)

    def connect(self, host, port):
        self.connected_to = (host, port)
        return (220, b"ready")

    def helo(self, host):
        return (250, b"ok")

    def has_extn(self, ext):
        return False  # skip STARTTLS to keep the handshake simple

    def mail(self, addr):
        self.mail_calls += 1
        return (250, b"ok")

    def rcpt(self, addr):
        self.rcpt_calls.append(addr)
        if addr.split("@", 1)[0].startswith("xq7z9k-"):
            return (self.catchall_code, b"catch-all probe")
        return (250, b"OK mailbox exists")

    def rset(self):
        self.rset_calls += 1
        return (250, b"ok")

    def quit(self):
        self.quit_called = True

    def close(self):
        pass


MX = [{"host": "mx.example.com", "preference": 10, "score": 50}]


class CatchAllReuseAndCacheTests(SimpleTestCase):
    def setUp(self):
        FakeSMTP.instances = []
        FakeSMTP.catchall_code = 550
        self._cache = FakeCache()
        self._patchers = [
            mock.patch.object(advanced_validator, "_django_cache", self._cache),
            mock.patch.object(advanced_validator.smtplib, "SMTP", FakeSMTP),
        ]
        for p in self._patchers:
            p.start()
        # Reset the module-level circuit breaker and the in-process fallback
        # cache between tests (both persist across test methods otherwise).
        advanced_validator._smtp_egress_blocked_until = 0.0
        advanced_validator._smtp_consecutive_failures = 0
        advanced_validator._domain_cache.clear()
        self.validator = AdvancedEmailValidator()
        self.validator.smtp_enabled = True

    def tearDown(self):
        for p in self._patchers:
            p.stop()

    def test_catch_all_reuses_single_connection(self):
        """A deliverable probe plus catch-all detection must use exactly ONE
        SMTP connection, issuing the catch-all RCPT on the same session."""
        result = self.validator.smtp_handshake(
            "user@example.com", "example.com", MX
        )

        self.assertEqual(result["status"], "deliverable")
        self.assertFalse(result["catch_all"])  # catchall_code 550
        # Exactly one connection opened — no second connection for catch-all.
        self.assertEqual(len(FakeSMTP.instances), 1)
        conn = FakeSMTP.instances[0]
        # Real RCPT then the catch-all RCPT on the SAME session.
        self.assertEqual(len(conn.rcpt_calls), 2)
        self.assertEqual(conn.rcpt_calls[0], "user@example.com")
        self.assertTrue(conn.rcpt_calls[1].startswith("xq7z9k-"))
        self.assertEqual(conn.rset_calls, 1)  # RSET before the second RCPT
        self.assertEqual(conn.mail_calls, 2)  # MAIL re-issued after RSET

    def test_catch_all_cached_per_domain(self):
        """The second address at the same domain must hit the cache and NOT
        probe catch-all again (at most one catch-all probe per domain)."""
        FakeSMTP.catchall_code = 250  # domain IS catch-all
        first = self.validator.smtp_handshake("a@example.com", "example.com", MX)
        self.assertTrue(first["catch_all"])
        self.assertEqual(len(FakeSMTP.instances), 1)
        self.assertEqual(len(FakeSMTP.instances[0].rcpt_calls), 2)

        # Second address, same domain — catch-all comes from cache.
        second = self.validator.smtp_handshake("b@example.com", "example.com", MX)
        self.assertTrue(second["catch_all"])  # cached True
        self.assertEqual(len(FakeSMTP.instances), 2)
        second_conn = FakeSMTP.instances[1]
        # Only the real address is probed — no catch-all RCPT, no RSET.
        self.assertEqual(second_conn.rcpt_calls, ["b@example.com"])
        self.assertEqual(second_conn.rset_calls, 0)

    def test_catch_all_falls_back_to_new_connection_when_rset_fails(self):
        """If the live session can't be reused (RSET raises), fall back to a
        fresh connection rather than losing catch-all detection."""

        class RsetBrokenSMTP(FakeSMTP):
            def rset(self):
                raise OSError("connection dropped")

        FakeSMTP.instances = []  # __init__ appends here even for the subclass
        FakeSMTP.catchall_code = 250
        with mock.patch.object(advanced_validator.smtplib, "SMTP", RsetBrokenSMTP):
            result = self.validator.smtp_handshake(
                "user@fallback.com",
                "fallback.com",
                [{"host": "mx.fallback.com", "preference": 10, "score": 50}],
            )

        self.assertTrue(result["catch_all"])
        # One connection for the real probe, a second (fallback) for catch-all.
        self.assertEqual(len(FakeSMTP.instances), 2)
