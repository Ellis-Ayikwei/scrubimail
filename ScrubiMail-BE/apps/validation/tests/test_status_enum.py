"""Issue 5 — the verification status must be exactly one of five snake_case
values, spam traps fold into do_not_mail, and the keyword heuristic must never
classify a legitimate service (e.g. mailtrap.io) as a trap."""

from unittest import mock

from django.test import SimpleTestCase

from apps.validation import advanced_validator
from apps.validation.advanced_validator import AdvancedEmailValidator

ALLOWED_STATUSES = {"valid", "invalid", "catch_all", "unknown", "do_not_mail"}
ALLOWED_VERDICTS = {"Valid", "Invalid", "Catch-All", "Unknown", "Do Not Mail"}


def _vr(**over):
    """Build a validation_results dict with sensible valid defaults."""
    vr = {
        "syntax": {"valid": True, "suggestions": []},
        "dns": {"valid": True, "mx_records": [{"host": "mx", "preference": 10}],
                "score": 80},
        "smtp": {"status": "deliverable", "catch_all": False, "sub_status": ""},
        "reputation": {"is_disposable": False, "is_spam_trap": False,
                       "spam_trap_risk": 0.0, "tld_risk": False},
        "role_based": {"is_role_based": False, "role_score": 0},
    }
    for k, v in over.items():
        vr[k] = {**vr[k], **v} if isinstance(vr.get(k), dict) else v
    return vr


class StatusEnumContractTests(SimpleTestCase):
    def setUp(self):
        # Avoid touching the real (possibly-down) cache during reputation checks.
        self._patch = mock.patch.object(advanced_validator, "_django_cache", None)
        self._patch.start()
        advanced_validator._domain_cache.clear()
        self.v = AdvancedEmailValidator()

    def tearDown(self):
        self._patch.stop()

    def test_classify_only_emits_five_statuses(self):
        scenarios = [
            _vr(),  # valid
            _vr(smtp={"status": "deliverable", "catch_all": True}),  # catch_all
            _vr(smtp={"status": "undeliverable"}),  # invalid
            _vr(syntax={"valid": False, "suggestions": []}),  # invalid
            _vr(dns={"valid": False}),  # invalid
            _vr(smtp={"status": "unknown", "sub_status": "greylisted"}),  # unknown
            _vr(reputation={"is_disposable": True}),  # do_not_mail
            _vr(reputation={"is_spam_trap": True}),  # do_not_mail
            _vr(role_based={"is_role_based": True, "role_score": 1}),  # do_not_mail
        ]
        for vr in scenarios:
            status, sub = self.v._classify(vr)
            self.assertIn(status, ALLOWED_STATUSES, f"{status} from {vr['smtp']}")

    def test_catch_all_status_uses_underscore(self):
        status, sub = self.v._classify(
            _vr(smtp={"status": "deliverable", "catch_all": True})
        )
        self.assertEqual(status, "catch_all")
        self.assertEqual(sub, "accept_all")

    def test_spamtrap_folds_into_do_not_mail(self):
        status, sub = self.v._classify(_vr(reputation={"is_spam_trap": True}))
        self.assertEqual(status, "do_not_mail")
        self.assertEqual(sub, "spamtrap_detected")

    def test_risk_score_status_and_verdict_always_in_contract(self):
        for vr in [
            _vr(),
            _vr(smtp={"status": "deliverable", "catch_all": True}),
            _vr(smtp={"status": "undeliverable"}),
            _vr(smtp={"status": "unknown", "sub_status": "antispam_block"}),
            _vr(reputation={"is_disposable": True}),
            _vr(reputation={"is_spam_trap": True}),
        ]:
            risk = self.v.calculate_risk_score(vr)
            self.assertIn(risk["status"], ALLOWED_STATUSES)
            self.assertIn(risk["verdict"], ALLOWED_VERDICTS)

    def test_mailtrap_keyword_not_classified_as_trap(self):
        # mailtrap.io matches the keyword heuristic but is NOT on the data-driven
        # trap list, so it must not be flagged/classified as a spam trap.
        rep = self.v.check_domain_reputation("mailtrap.io")
        self.assertFalse(rep["is_spam_trap"])
        status, _ = self.v._classify(_vr(reputation=rep))
        self.assertEqual(status, "valid")  # deliverable + not a trap

    def test_data_driven_trap_list_classifies(self):
        self.v.spam_trap_domains = {"known-trap.example"}
        rep = self.v.check_domain_reputation("known-trap.example")
        self.assertTrue(rep["is_spam_trap"])
        status, sub = self.v._classify(_vr(reputation=rep))
        self.assertEqual((status, sub), ("do_not_mail", "spamtrap_detected"))
