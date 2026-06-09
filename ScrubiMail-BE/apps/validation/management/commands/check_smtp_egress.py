"""
Preflight check for SMTP mailbox-verification egress.

Run this on the host that will perform SMTP probes (the egress Celery worker)
to confirm it can actually do ZeroBounce-style verification BEFORE you rely on
it. It checks, in order:

  1. Outbound port 25 connectivity to real MX servers
  2. HELO host has an A record
  3. PTR (reverse DNS) of the HELO host's IP matches the HELO host (FCrDNS)
  4. SPF record exists on the MAIL FROM domain (and ideally lists the IP)
  5. A live SMTP handshake (HELO -> MAIL FROM -> RCPT) against a real MX

Usage:
    python manage.py check_smtp_egress
    python manage.py check_smtp_egress --probe someone@gmail.com
    python manage.py check_smtp_egress --mx outlook.com

Exit code is non-zero if any blocking check fails, so it's CI/healthcheck-safe.
"""

import smtplib
import socket

import dns.resolver
import dns.reversename
from django.conf import settings
from django.core.management.base import BaseCommand

# Well-known MX hosts used to prove port-25 egress works.
_DEFAULT_TEST_MX = [
    "gmail-smtp-in.l.google.com",
    "alt1.gmail-smtp-in.l.google.com",
]


class Command(BaseCommand):
    help = "Preflight-check this host's ability to do SMTP mailbox verification."

    def add_arguments(self, parser):
        parser.add_argument(
            "--probe",
            metavar="EMAIL",
            help="Run a live RCPT probe against this address (uses its domain's MX).",
        )
        parser.add_argument(
            "--mx",
            metavar="DOMAIN_OR_HOST",
            help="Domain (resolve its MX) or MX host to use for the live handshake. "
            "Defaults to Gmail.",
        )
        parser.add_argument(
            "--timeout", type=int, default=8, help="Per-connection timeout (seconds)."
        )

    # -- small output helpers -------------------------------------------------
    def _ok(self, msg):
        self.stdout.write(self.style.SUCCESS(f"  PASS  {msg}"))

    def _fail(self, msg):
        self.stdout.write(self.style.ERROR(f"  FAIL  {msg}"))

    def _warn(self, msg):
        self.stdout.write(self.style.WARNING(f"  WARN  {msg}"))

    def _info(self, msg):
        self.stdout.write(f"        {msg}")

    # -- main -----------------------------------------------------------------
    def handle(self, *args, **opts):
        timeout = opts["timeout"]
        helo = getattr(settings, "VALIDATION_SMTP_HELO_HOST", "scrubimail.com")
        mail_from = getattr(
            settings, "VALIDATION_SMTP_MAIL_FROM", "verify@scrubimail.com"
        )
        enabled = getattr(settings, "VALIDATION_SMTP_ENABLED", False)
        mail_from_domain = mail_from.split("@", 1)[-1]

        self.stdout.write(self.style.MIGRATE_HEADING("\nSMTP egress preflight\n"))
        self._info(f"VALIDATION_SMTP_ENABLED = {enabled}")
        self._info(f"HELO host               = {helo}")
        self._info(f"MAIL FROM               = {mail_from}")
        self.stdout.write("")

        failures = 0

        if not enabled:
            self._warn(
                "VALIDATION_SMTP_ENABLED is False — this host won't run SMTP probes. "
                "Set it to True on the egress worker. (Checks below still run.)"
            )
            self.stdout.write("")

        # 1) Port 25 egress -----------------------------------------------------
        self.stdout.write("1) Outbound port 25 connectivity")
        port25_ok = False
        for host in _DEFAULT_TEST_MX:
            try:
                with socket.create_connection((host, 25), timeout=timeout):
                    self._ok(f"connected to {host}:25")
                    port25_ok = True
                    break
            except Exception as e:
                self._info(f"{host}:25 -> {e}")
        if not port25_ok:
            failures += 1
            self._fail(
                "Could not open ANY outbound port 25 connection. This host blocks "
                "port 25 (AWS/GCP/Azure/Heroku/Railway do). Use a VPS that allows it."
            )
        self.stdout.write("")

        # 2) HELO host A record -------------------------------------------------
        self.stdout.write("2) HELO host resolves (A record)")
        helo_ip = None
        try:
            answers = dns.resolver.resolve(helo, "A")
            helo_ip = str(answers[0])
            self._ok(f"{helo} -> {helo_ip}")
        except Exception as e:
            failures += 1
            self._fail(f"{helo} has no A record ({e}). Add an A record for it.")
        self.stdout.write("")

        # 3) PTR / FCrDNS -------------------------------------------------------
        self.stdout.write("3) Reverse DNS (PTR) matches HELO host")
        if helo_ip:
            try:
                rev = dns.reversename.from_address(helo_ip)
                ptr = str(dns.resolver.resolve(rev, "PTR")[0]).rstrip(".")
                if ptr.lower() == helo.lower().rstrip("."):
                    self._ok(f"PTR {helo_ip} -> {ptr} (matches HELO host)")
                else:
                    failures += 1
                    self._fail(
                        f"PTR {helo_ip} -> {ptr}, but HELO host is {helo}. "
                        "They must match (forward-confirmed reverse DNS). "
                        "Set the PTR in your VPS provider's panel."
                    )
            except Exception as e:
                failures += 1
                self._fail(
                    f"No PTR record for {helo_ip} ({e}). Set reverse DNS in your "
                    "VPS provider's control panel to point at the HELO host."
                )
        else:
            self._warn("skipped (HELO host did not resolve)")
        self.stdout.write("")

        # 4) SPF ----------------------------------------------------------------
        self.stdout.write(f"4) SPF record on {mail_from_domain}")
        try:
            txts = dns.resolver.resolve(mail_from_domain, "TXT")
            spf = next(
                (
                    t.to_text().strip('"')
                    for t in txts
                    if "v=spf1" in t.to_text().lower()
                ),
                None,
            )
            if not spf:
                failures += 1
                self._fail(
                    f"No SPF (v=spf1) record on {mail_from_domain}. Add one that "
                    f"authorizes your egress IP, e.g. 'v=spf1 ip4:{helo_ip or '<IP>'} -all'."
                )
            else:
                self._ok(f"SPF present: {spf}")
                if helo_ip and helo_ip not in spf:
                    self._warn(
                        f"SPF does not literally contain {helo_ip}. If it's covered "
                        "by an include/ip range that's fine; otherwise add it."
                    )
        except Exception as e:
            failures += 1
            self._fail(f"Could not read TXT/SPF for {mail_from_domain} ({e}).")
        self.stdout.write("")

        # 5) Live handshake -----------------------------------------------------
        self.stdout.write("5) Live SMTP handshake")
        probe = opts.get("probe")
        target_domain = None
        if probe and "@" in probe:
            target_domain = probe.split("@", 1)[1]
        elif opts.get("mx"):
            target_domain = opts["mx"]

        mx_host = self._resolve_mx_host(target_domain) if target_domain else _DEFAULT_TEST_MX[0]
        if not mx_host:
            self._warn("skipped (could not determine an MX host to test)")
        elif not port25_ok:
            self._warn("skipped (port 25 egress already failed)")
        else:
            self._live_handshake(mx_host, helo, mail_from, probe, timeout)
        self.stdout.write("")

        # Summary ---------------------------------------------------------------
        if failures == 0:
            self.stdout.write(
                self.style.SUCCESS(
                    "All blocking checks passed — this host can do SMTP verification.\n"
                )
            )
        else:
            self.stdout.write(
                self.style.ERROR(
                    f"{failures} blocking check(s) failed — fix the FAIL items above "
                    "before enabling SMTP verification here.\n"
                )
            )
            raise SystemExit(1)

    # -- helpers --------------------------------------------------------------
    def _resolve_mx_host(self, domain):
        try:
            mx = dns.resolver.resolve(domain, "MX")
            best = sorted(mx, key=lambda r: r.preference)[0]
            return str(best.exchange).rstrip(".")
        except Exception:
            # Maybe the caller passed an MX host directly.
            return domain

    def _live_handshake(self, mx_host, helo, mail_from, probe, timeout):
        try:
            server = smtplib.SMTP(timeout=timeout)
            code, banner = server.connect(mx_host, 25)
            self._info(f"connect {mx_host}:25 -> {code} {banner.decode(errors='ignore')[:60]}")
            server.helo(helo)
            if server.has_extn("starttls"):
                try:
                    server.starttls()
                    server.helo(helo)
                    self._info("STARTTLS negotiated")
                except Exception:
                    self._info("STARTTLS offered but failed; continued plaintext")
            server.mail(mail_from)
            rcpt_target = probe or f"definitely-not-real-{int(__import__('time').time())}@{mx_host.split('.')[-2]}.com"
            code, msg = server.rcpt(rcpt_target)
            self._info(f"RCPT {rcpt_target} -> {code} {msg.decode(errors='ignore')[:80]}")
            try:
                server.quit()
            except Exception:
                server.close()
            if code in (250, 251, 550, 551, 553):
                self._ok(
                    "Server engaged in RCPT verification — SMTP probing works from here."
                )
            else:
                self._warn(
                    f"Server returned {code} (greylist/policy). Verification may be "
                    "rate-limited from a cold IP; warm it up gradually."
                )
        except Exception as e:
            self._fail(f"Live handshake to {mx_host} failed: {e}")
