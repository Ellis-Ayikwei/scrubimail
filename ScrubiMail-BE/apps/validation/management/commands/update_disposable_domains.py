"""Refresh the disposable-email-domain blocklist.

The bundled baseline is only a few hundred domains; real coverage needs 100k+
because DEA services rotate domains weekly to evade small lists. This command
downloads the widely-used disposable-email-domains GitHub dataset (plus any
configured extra feeds), merges and de-duplicates them with the bundled
baseline, and writes the result to VALIDATION_DISPOSABLE_DOMAINS_FILE.

On download failure it keeps the previous file and exits non-zero — it never
ships an empty list. After a successful write it reloads the in-process set.

Usage:
    python manage.py update_disposable_domains
    python manage.py update_disposable_domains --timeout 60

Schedule it weekly via Celery beat (see CELERY_BEAT_SCHEDULE).
"""

import os

import requests
from django.conf import settings
from django.core.management.base import BaseCommand

from apps.validation.advanced_validator import (
    _DISPOSABLE_BASELINE,
    _load_domain_file,
    load_disposable_domains,
)

# The maintained community dataset (~100k+ domains).
DEFAULT_SOURCE_URL = (
    "https://raw.githubusercontent.com/disposable-email-domains/"
    "disposable-email-domains/master/disposable_email_domains.txt"
)


class Command(BaseCommand):
    help = (
        "Download + merge disposable-domain feeds with the bundled baseline "
        "and write to VALIDATION_DISPOSABLE_DOMAINS_FILE."
    )

    def add_arguments(self, parser):
        parser.add_argument(
            "--timeout", type=int, default=30, help="Per-feed HTTP timeout (s)."
        )

    def handle(self, *args, **opts):
        timeout = opts["timeout"]
        out_path = getattr(settings, "VALIDATION_DISPOSABLE_DOMAINS_FILE", None)
        if not out_path:
            self.stderr.write(
                self.style.ERROR(
                    "VALIDATION_DISPOSABLE_DOMAINS_FILE is not set — nowhere to "
                    "write the merged list."
                )
            )
            raise SystemExit(1)

        source = getattr(settings, "VALIDATION_DISPOSABLE_SOURCE_URL", DEFAULT_SOURCE_URL)
        extra = list(getattr(settings, "VALIDATION_DISPOSABLE_EXTRA_FEEDS", []) or [])
        feeds = [source] + extra

        downloaded = set()
        any_success = False
        for url in feeds:
            try:
                resp = requests.get(url, timeout=timeout)
                resp.raise_for_status()
                got = {
                    line.strip().lower()
                    for line in resp.text.splitlines()
                    if line.strip() and not line.strip().startswith("#")
                }
                downloaded |= got
                any_success = True
                self.stdout.write(f"  {len(got):>7} domains from {url}")
            except Exception as exc:  # network/HTTP error on this feed
                self.stderr.write(self.style.WARNING(f"  FAILED {url}: {exc}"))

        if not any_success:
            # Never ship an empty list — leave the existing file untouched.
            self.stderr.write(
                self.style.ERROR(
                    "All feeds failed; keeping the existing disposable file unchanged."
                )
            )
            raise SystemExit(1)

        baseline = _load_domain_file(_DISPOSABLE_BASELINE)
        merged = baseline | downloaded
        if not merged:
            self.stderr.write(
                self.style.ERROR("Merged set is empty; refusing to overwrite.")
            )
            raise SystemExit(1)

        # Atomic write: write to a temp file then replace, so a crashed run can
        # never leave a half-written (or empty) blocklist in place.
        out_dir = os.path.dirname(out_path)
        if out_dir:
            os.makedirs(out_dir, exist_ok=True)
        tmp_path = out_path + ".tmp"
        with open(tmp_path, "w", encoding="utf-8") as fh:
            fh.write("\n".join(sorted(merged)) + "\n")
        os.replace(tmp_path, out_path)

        self.stdout.write(
            self.style.SUCCESS(
                f"Wrote {len(merged)} disposable domains to {out_path} "
                f"(baseline {len(baseline)} + feeds {len(downloaded)})."
            )
        )

        # Refresh this process's set immediately; other workers pick it up via
        # the file mtime on their next reputation check.
        load_disposable_domains(force=True)
        self.stdout.write("Reloaded in-process disposable set.")
