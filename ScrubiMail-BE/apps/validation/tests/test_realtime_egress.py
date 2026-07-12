"""Issue 12 — single validation delegates the SMTP probe to the egress worker.

The realtime service enqueues verify_email_deep_task to the smtp_validation
queue (the Hetzner box — the only host with port-25 egress) and waits for the
verdict within the realtime budget. When the worker can't answer in time it
degrades to an honest unknown/smtp_unavailable, and if the probe was never
claimed at all it starts a cooldown so an egress outage doesn't make every
request burn the full budget.
"""

import json
from unittest import mock

from celery.exceptions import TimeoutError as CeleryTimeoutError
from django.test import SimpleTestCase

from apps.validation import advanced_validator, services, tasks
from apps.validation.advanced_validator import ValidationResult


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


def _worker_payload():
    """What verify_email_deep_task returns for a confirmed mailbox."""
    return {
        "is_valid": True,
        "score": 95,
        "verdict": "Valid",
        "breakdown": {"syntax": {"valid": True}},
        "suggestions": [],
        "warnings": [],
        "metadata": {
            "status": "valid",
            "sub_status": "mailbox_exists",
            "verified_at": "2026-07-12T00:00:00+00:00",
        },
    }


class FakeAsyncResult:
    def __init__(self, payload=None, exc=None, state="SUCCESS"):
        self._payload = payload
        self._exc = exc
        self.state = state
        self.get_calls = []

    def get(self, timeout=None, interval=None):
        self.get_calls.append(timeout)
        if self._exc is not None:
            raise self._exc
        return self._payload


class RealtimeEgressServiceTests(SimpleTestCase):
    def setUp(self):
        self.cache = FakeCache()
        self._patches = [
            mock.patch.object(advanced_validator, "_django_cache", self.cache),
            mock.patch.object(services, "_shared_cache", self.cache),
            # The web host must never probe SMTP itself — deep goes via queue.
            mock.patch.object(services._validator, "smtp_enabled", False),
            mock.patch.object(
                services._validator, "check_dns_mx", return_value=dict(DNS_OK)
            ),
        ]
        for p in self._patches:
            p.start()
        advanced_validator._domain_cache.clear()
        advanced_validator._smtp_egress_blocked_until = 0.0
        advanced_validator._smtp_consecutive_failures = 0

    def tearDown(self):
        for p in self._patches:
            p.stop()

    def test_deep_verdict_comes_from_egress_worker(self):
        fake = FakeAsyncResult(payload=_worker_payload())
        with mock.patch.object(
            tasks.verify_email_deep_task, "apply_async", return_value=fake
        ) as enqueue:
            result, from_cache = services.verify_email_realtime("user@example.com")

        enqueue.assert_called_once()
        self.assertEqual(enqueue.call_args.kwargs["args"], ["user@example.com"])
        self.assertIn("expires", enqueue.call_args.kwargs)
        self.assertEqual(len(fake.get_calls), 1)
        self.assertFalse(from_cache)
        self.assertTrue(result.is_valid)
        self.assertEqual(result.metadata["status"], "valid")
        self.assertEqual(result.metadata["sub_status"], "mailbox_exists")

    def test_cache_hit_skips_the_queue(self):
        cached = ValidationResult(
            is_valid=True,
            score=95,
            verdict="Valid",
            breakdown={},
            suggestions=[],
            warnings=[],
            metadata={"status": "valid", "sub_status": "mailbox_exists"},
        )
        services._validator.store_result("user@example.com", cached)

        with mock.patch.object(
            tasks.verify_email_deep_task, "apply_async"
        ) as enqueue:
            result, from_cache = services.verify_email_realtime("user@example.com")

        enqueue.assert_not_called()
        self.assertTrue(from_cache)
        self.assertEqual(result.metadata["status"], "valid")

    def test_timeout_while_pending_flags_cooldown_and_degrades(self):
        fake = FakeAsyncResult(exc=CeleryTimeoutError(), state="PENDING")
        with mock.patch.object(
            tasks.verify_email_deep_task, "apply_async", return_value=fake
        ):
            result, from_cache = services.verify_email_realtime(
                "user@example.com", budget=1
            )

        self.assertFalse(from_cache)
        self.assertEqual(result.metadata["status"], "unknown")
        self.assertEqual(result.metadata["sub_status"], "smtp_unavailable")
        # Nobody consumed the probe -> cooldown flag set for later requests.
        self.assertTrue(self.cache.get(services._EGRESS_UNRESPONSIVE_KEY))

    def test_timeout_while_started_does_not_flag(self):
        # Worker is alive but slow on this address (tarpit/greylist): degrade
        # this request, but don't punish the whole queue.
        fake = FakeAsyncResult(exc=CeleryTimeoutError(), state="STARTED")
        with mock.patch.object(
            tasks.verify_email_deep_task, "apply_async", return_value=fake
        ):
            result, _ = services.verify_email_realtime("user@example.com", budget=1)

        self.assertEqual(result.metadata["sub_status"], "smtp_unavailable")
        self.assertIsNone(self.cache.get(services._EGRESS_UNRESPONSIVE_KEY))

    def test_cooldown_skips_wait_but_still_enqueues(self):
        self.cache.set(services._EGRESS_UNRESPONSIVE_KEY, True)
        fake = FakeAsyncResult(payload=_worker_payload())
        with mock.patch.object(
            tasks.verify_email_deep_task, "apply_async", return_value=fake
        ) as enqueue:
            result, _ = services.verify_email_realtime("user@example.com")

        # Still enqueued (warms the cache once the worker returns), never waited.
        enqueue.assert_called_once()
        self.assertEqual(fake.get_calls, [])
        self.assertEqual(result.metadata["status"], "unknown")
        self.assertEqual(result.metadata["sub_status"], "smtp_unavailable")

    def test_broker_down_degrades_honestly(self):
        with mock.patch.object(
            tasks.verify_email_deep_task,
            "apply_async",
            side_effect=Exception("broker unreachable"),
        ):
            result, from_cache = services.verify_email_realtime("user@example.com")

        self.assertFalse(from_cache)
        self.assertEqual(result.metadata["status"], "unknown")
        self.assertEqual(result.metadata["sub_status"], "smtp_unavailable")

    def test_degraded_result_is_not_cached(self):
        fake = FakeAsyncResult(exc=CeleryTimeoutError(), state="STARTED")
        with mock.patch.object(
            tasks.verify_email_deep_task, "apply_async", return_value=fake
        ):
            services.verify_email_realtime("user@example.com", budget=1)
        # smtp_unavailable is transient — the next request must re-verify.
        self.assertIsNone(
            services._validator.get_cached_result("user@example.com")
        )

    def test_fast_mode_never_enqueues(self):
        with mock.patch.object(
            tasks.verify_email_deep_task, "apply_async"
        ) as enqueue:
            result, from_cache = services.verify_email_realtime(
                "user@example.com", fast=True
            )

        enqueue.assert_not_called()
        self.assertFalse(from_cache)
        self.assertEqual(result.metadata["status"], "unknown")


class VerifyEmailDeepTaskTests(SimpleTestCase):
    """The task itself: probes over SMTP, warms the shared cache, and returns a
    JSON-serializable payload the waiting web request can rebuild a result from."""

    def setUp(self):
        self.cache = FakeCache()
        self._patches = [
            mock.patch.object(advanced_validator, "_django_cache", self.cache),
            mock.patch.object(advanced_validator.smtplib, "SMTP", FakeSMTP),
            mock.patch.object(tasks.validator, "smtp_enabled", True),
            mock.patch.object(tasks.validator.rate_limiter, "enabled", False),
            mock.patch.object(
                tasks.validator, "check_dns_mx", return_value=dict(DNS_OK)
            ),
        ]
        for p in self._patches:
            p.start()
        advanced_validator._domain_cache.clear()
        advanced_validator._smtp_egress_blocked_until = 0.0
        advanced_validator._smtp_consecutive_failures = 0
        FakeSMTP.instances = []
        FakeSMTP.rcpt_code = 250
        FakeSMTP.rcpt_msg = b"OK mailbox exists"

    def tearDown(self):
        for p in self._patches:
            p.stop()

    def test_probes_warms_cache_and_returns_serializable_payload(self):
        payload = tasks.verify_email_deep_task("user@example.com")

        self.assertEqual(len(FakeSMTP.instances), 1)
        self.assertTrue(payload["is_valid"])
        self.assertEqual(payload["metadata"]["status"], "valid")
        self.assertIsNotNone(payload["metadata"].get("verified_at"))
        json.dumps(payload)  # must survive the JSON result backend

        cached = tasks.validator.get_cached_result("user@example.com")
        self.assertIsNotNone(cached)
        self.assertEqual(cached.metadata["status"], "valid")
