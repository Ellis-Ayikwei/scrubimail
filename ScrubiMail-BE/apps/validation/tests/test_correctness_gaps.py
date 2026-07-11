"""Issue 7 — smaller correctness gaps: null MX (RFC 7505), Damerau-Levenshtein
typo suggestions, per-kind cache TTLs, greylist retry, and 3-MX fallback that
only advances on a connection failure."""

from unittest import mock

from django.test import SimpleTestCase

from apps.validation import advanced_validator, tasks
from apps.validation.advanced_validator import (
    AdvancedEmailValidator,
    ValidationResult,
    _damerau_levenshtein,
)


class DamerauLevenshteinTests(SimpleTestCase):
    def test_basic_edits(self):
        self.assertEqual(_damerau_levenshtein("gmail", "gmail"), 0)
        self.assertEqual(_damerau_levenshtein("gmai", "gmail"), 1)   # insertion
        self.assertEqual(_damerau_levenshtein("gmial", "gmail"), 1)  # transposition
        self.assertEqual(_damerau_levenshtein("gmal", "gmail"), 1)   # deletion
        self.assertEqual(_damerau_levenshtein("gmayl", "gmail"), 1)  # substitution

    def test_early_exit_caps_distance(self):
        self.assertEqual(
            _damerau_levenshtein("totally-different", "gmail.com", max_distance=2), 3
        )


class TypoSuggestionTests(SimpleTestCase):
    def setUp(self):
        self.v = AdvancedEmailValidator()

    def test_common_typos_suggest_nearest_known_domain(self):
        cases = {
            "user@gmial.com": "user@gmail.com",   # transposition
            "user@gmai.com": "user@gmail.com",    # missing letter
            "user@yaho.com": "user@yahoo.com",
            "user@hotmial.com": "user@hotmail.com",
            "user@outlok.com": "user@outlook.com",
        }
        for bad, expected in cases.items():
            self.assertIn(expected, self.v._generate_suggestions(bad), bad)

    def test_tld_typos(self):
        self.assertIn("a@hotmail.com", self.v._generate_suggestions("a@hotmail.con"))
        self.assertIn("a@gmail.com", self.v._generate_suggestions("a@gmail.cmo"))
        self.assertIn("a@gmail.com", self.v._generate_suggestions("a@gmail.co"))

    def test_valid_domain_has_no_suggestion(self):
        self.assertEqual(self.v._generate_suggestions("real@gmail.com"), [])

    def test_far_domain_not_auto_corrected(self):
        # A legitimate custom domain far from every known one gets no suggestion.
        self.assertEqual(self.v._generate_suggestions("ceo@my-startup-hq.io"), [])


class NullMxTests(SimpleTestCase):
    def setUp(self):
        self._patch = mock.patch.object(advanced_validator, "_django_cache", None)
        self._patch.start()
        advanced_validator._domain_cache.clear()
        self.v = AdvancedEmailValidator()

    def tearDown(self):
        self._patch.stop()

    def test_null_mx_classifies_invalid(self):
        vr = {
            "syntax": {"valid": True, "suggestions": []},
            "dns": {"valid": True, "null_mx": True, "mx_records": [], "score": 0},
            "smtp": {"status": "skipped"},
            "reputation": {},
            "role_based": {},
        }
        self.assertEqual(
            self.v._classify(vr), ("invalid", "does_not_accept_mail")
        )

    def test_validate_email_skips_smtp_on_null_mx(self):
        null_dns = {
            "valid": True,
            "null_mx": True,
            "mx_records": [{"host": "", "preference": 0, "score": 50}],
            "a_records": [],
            "score": 0,
        }
        with mock.patch.object(self.v, "check_dns_mx", return_value=null_dns), \
             mock.patch.object(
                 self.v, "smtp_handshake",
                 side_effect=AssertionError("SMTP must be skipped for null MX"),
             ):
            result = self.v.validate_email("user@no-mail.example", deep=True)

        self.assertEqual(result.metadata["status"], "invalid")
        self.assertEqual(result.metadata["sub_status"], "does_not_accept_mail")


class CacheTtlTests(SimpleTestCase):
    def setUp(self):
        self._patch = mock.patch.object(advanced_validator, "_django_cache", None)
        self._patch.start()
        advanced_validator._domain_cache.clear()
        self.v = AdvancedEmailValidator()

    def tearDown(self):
        self._patch.stop()

    def _run_with_records(self, a_records, mx_records):
        def fake_resolve(domain, rtype):
            if rtype == "A" and a_records:
                return a_records
            if rtype == "MX" and mx_records:
                return mx_records
            raise Exception("no records")

        with mock.patch.object(
            advanced_validator._dns_resolver, "resolve", side_effect=fake_resolve
        ), mock.patch.object(self.v, "_set_cached") as set_cached:
            self.v.check_dns_mx("example-ttl.test")
        return set_cached

    def test_positive_dns_uses_dns_ttl(self):
        set_cached = self._run_with_records(a_records=["1.2.3.4"], mx_records=[])
        _, kwargs = set_cached.call_args
        self.assertEqual(kwargs["ttl"], self.v.dns_ttl)

    def test_negative_dns_uses_short_ttl(self):
        set_cached = self._run_with_records(a_records=[], mx_records=[])
        _, kwargs = set_cached.call_args
        self.assertEqual(kwargs["ttl"], self.v.negative_dns_ttl)


class _FakeSMTP:
    instances = []
    fail_hosts = set()

    def __init__(self, timeout=None):
        self.host = None
        self.rcpt_calls = []
        _FakeSMTP.instances.append(self)

    def connect(self, host, port):
        self.host = host
        if host in _FakeSMTP.fail_hosts:
            raise OSError("cannot connect")
        return (220, b"ok")

    def helo(self, host):
        return (250, b"ok")

    def has_extn(self, ext):
        return False

    def mail(self, addr):
        return (250, b"ok")

    def rcpt(self, addr):
        self.rcpt_calls.append(addr)
        if addr.split("@", 1)[0].startswith("xq7z9k-"):
            return (550, b"no catch-all")
        return _FakeSMTP.answer

    def rset(self):
        return (250, b"ok")

    def quit(self):
        pass

    def close(self):
        pass


class MxFallbackTests(SimpleTestCase):
    def setUp(self):
        self._patches = [
            mock.patch.object(advanced_validator, "_django_cache", None),
            mock.patch.object(advanced_validator.smtplib, "SMTP", _FakeSMTP),
        ]
        for p in self._patches:
            p.start()
        advanced_validator._domain_cache.clear()
        advanced_validator._smtp_egress_blocked_until = 0.0
        advanced_validator._smtp_consecutive_failures = 0
        _FakeSMTP.instances = []
        _FakeSMTP.fail_hosts = set()
        _FakeSMTP.answer = (250, b"OK")
        self.v = AdvancedEmailValidator()
        self.v.smtp_enabled = True
        self.v.rate_limiter.enabled = False

    def tearDown(self):
        for p in self._patches:
            p.stop()

    def _mx(self, *hosts):
        return [{"host": h, "preference": 10 + i, "score": 50}
                for i, h in enumerate(hosts)]

    def test_stops_after_first_answer_no_second_probe(self):
        _FakeSMTP.answer = (450, b"greylisted")  # an answer, not a connect failure
        result = self.v.smtp_handshake(
            "u@x.com", "x.com", self._mx("mx1", "mx2", "mx3")
        )
        # Answered on mx1 -> we must NOT probe mx2/mx3.
        self.assertEqual(len(_FakeSMTP.instances), 1)
        self.assertEqual(result["sub_status"], "greylisted")

    def test_advances_only_on_connection_failure(self):
        _FakeSMTP.fail_hosts = {"mx1"}  # mx1 can't connect; mx2 answers
        result = self.v.smtp_handshake(
            "u@x.com", "x.com", self._mx("mx1", "mx2", "mx3")
        )
        # One failed connect (mx1) + one that answered (mx2) = 2 connections.
        self.assertEqual(len(_FakeSMTP.instances), 2)
        self.assertEqual(result["status"], "deliverable")


class GreylistRetryTaskTests(SimpleTestCase):
    def test_task_retries_on_greylist(self):
        greylisted = ValidationResult(
            is_valid=False, score=55, verdict="Unknown",
            breakdown={"syntax": {}, "dns": {}, "smtp": {}, "reputation": {},
                       "role_based": {}},
            suggestions=[], warnings=[],
            metadata={"status": "unknown", "sub_status": "greylisted"},
        )
        fake_validation = mock.Mock(email="u@x.com")
        # A direct task call defaults request.retries to 0 (< the greylist cap),
        # so the greylisted result must trigger a retry.
        with mock.patch.object(
            tasks.EmailValidation.objects, "get", return_value=fake_validation
        ), mock.patch.object(
            tasks.validator, "validate_email", return_value=greylisted
        ), mock.patch.object(
            tasks.validate_email_task, "retry", side_effect=RuntimeError("retry")
        ) as retry_mock:
            with self.assertRaises(RuntimeError):
                tasks.validate_email_task(object())
        retry_mock.assert_called_once()
