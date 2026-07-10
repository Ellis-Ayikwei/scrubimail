"""Issue 4 — the disposable-domain list must be refreshable from external feeds,
merged with the bundled baseline, never emptied on failure, and reloaded by
workers via the file mtime."""

import os
import shutil
import tempfile
from unittest import mock

from django.core.management import call_command
from django.test import SimpleTestCase, override_settings

from apps.validation import advanced_validator
from apps.validation.advanced_validator import (
    _DISPOSABLE_BASELINE,
    _load_domain_file,
    load_disposable_domains,
)

CMD = "apps.validation.management.commands.update_disposable_domains.requests.get"


def _fake_response(text):
    resp = mock.Mock()
    resp.text = text
    resp.raise_for_status = mock.Mock(return_value=None)
    return resp


class UpdateDisposableDomainsTests(SimpleTestCase):
    def setUp(self):
        self.tmpdir = tempfile.mkdtemp()
        self.out_path = os.path.join(self.tmpdir, "disposable_external.txt")
        # Reset the module-level cache so each test loads fresh.
        advanced_validator._disposable_domains = None
        advanced_validator._disposable_external_mtime = None

    def tearDown(self):
        shutil.rmtree(self.tmpdir, ignore_errors=True)
        advanced_validator._disposable_domains = None
        advanced_validator._disposable_external_mtime = None

    def test_merges_feed_with_baseline_and_writes(self):
        feed = "mailinator-fresh-alias.com\nzzz-temp-mail.com\n# a comment\n\n"
        with override_settings(VALIDATION_DISPOSABLE_DOMAINS_FILE=self.out_path):
            with mock.patch(CMD, return_value=_fake_response(feed)):
                call_command("update_disposable_domains")

            self.assertTrue(os.path.exists(self.out_path))
            written = _load_domain_file(self.out_path)
            baseline = _load_domain_file(_DISPOSABLE_BASELINE)
            # Merged = baseline ∪ feed, de-duplicated, comments stripped.
            self.assertIn("mailinator-fresh-alias.com", written)
            self.assertIn("zzz-temp-mail.com", written)
            self.assertTrue(baseline.issubset(written))
            self.assertNotIn("# a comment", written)

            # A freshly-listed disposable domain now classifies as disposable.
            loaded = load_disposable_domains(force=True)
            self.assertIn("zzz-temp-mail.com", loaded)

    def test_keeps_previous_file_when_all_feeds_fail(self):
        # Pre-existing file must survive a total download failure (never emptied).
        with open(self.out_path, "w", encoding="utf-8") as fh:
            fh.write("keepme-existing.com\n")

        with override_settings(VALIDATION_DISPOSABLE_DOMAINS_FILE=self.out_path):
            with mock.patch(CMD, side_effect=Exception("network down")):
                with self.assertRaises(SystemExit):
                    call_command("update_disposable_domains")

        self.assertEqual(
            _load_domain_file(self.out_path), {"keepme-existing.com"}
        )

    def test_workers_reload_on_mtime_change(self):
        with open(self.out_path, "w", encoding="utf-8") as fh:
            fh.write("first-temp.com\n")
        old_mtime = os.path.getmtime(self.out_path)

        with override_settings(VALIDATION_DISPOSABLE_DOMAINS_FILE=self.out_path):
            loaded = load_disposable_domains(force=True)
            self.assertIn("first-temp.com", loaded)
            self.assertNotIn("second-temp.com", loaded)

            # Simulate a weekly refresh writing a new file with a later mtime.
            with open(self.out_path, "w", encoding="utf-8") as fh:
                fh.write("first-temp.com\nsecond-temp.com\n")
            os.utime(self.out_path, (old_mtime + 100, old_mtime + 100))

            # No force: the mtime change alone must trigger a reload.
            reloaded = load_disposable_domains()
            self.assertIn("second-temp.com", reloaded)
