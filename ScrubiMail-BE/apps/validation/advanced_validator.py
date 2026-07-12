import os
import re
import hashlib
import dns.resolver
import smtplib
import socket
import time
import logging
from datetime import datetime, timezone as _dt_timezone
from typing import Dict, List, Any, Optional
from dataclasses import dataclass
from concurrent.futures import ThreadPoolExecutor

try:
    import idna  # internationalized domain name handling
except Exception:  # pragma: no cover - idna is a declared dependency
    idna = None

try:
    from django.conf import settings as _django_settings
except Exception:  # pragma: no cover - allow use outside Django
    _django_settings = None

try:
    from django.core.cache import cache as _django_cache
except Exception:  # pragma: no cover - allow use outside Django
    _django_cache = None

from .rate_limit import ProviderRateLimiter, provider_for_mx

logger = logging.getLogger(__name__)


def _now_iso() -> str:
    """UTC verification timestamp for cached/realtime results."""
    return datetime.now(_dt_timezone.utc).isoformat()


def _conf(name: str, default: Any) -> Any:
    """Read a validation setting from Django settings with a safe fallback.

    Accessing the lazy settings object raises ImproperlyConfigured when Django
    isn't configured (e.g. standalone use/tests), so swallow any error and fall
    back to the default.
    """
    if _django_settings is not None:
        try:
            return getattr(_django_settings, name, default)
        except Exception:
            return default
    return default


# Module-level DNS resolver with short timeouts. Kept tight so a single slow
# lookup can't blow the realtime p99 budget (worst case ~lifetime seconds).
_dns_resolver = dns.resolver.Resolver()
_dns_resolver.timeout = 2  # per-query timeout
_dns_resolver.lifetime = 3  # total resolution lifetime

# Simple TTL cache for domain DNS/reputation results
_domain_cache: Dict[str, Dict[str, Any]] = {}
_cache_ttl = 300  # 5 minutes

# SMTP egress circuit breaker. Outbound port 25 is blocked on most cloud hosts,
# so the first connect just burns the full timeout. We trip the breaker only
# after several CONSECUTIVE total failures (systemic block) — a single slow MX
# on an otherwise-working host must not disable verification for every domain.
# Any successful connection resets the counter.
#
# Breaker state lives in the shared cache (Redis) so all gunicorn/Celery worker
# processes trip together on their COMBINED failure count — module globals gave
# each process its own copy, so each burned full timeouts before tripping. These
# in-process values remain only as a fallback when Redis is unreachable.
_smtp_egress_blocked_until = 0.0
_smtp_consecutive_failures = 0
_SMTP_BREAKER_BLOCK_KEY = "smtp:breaker_block"
_SMTP_BREAKER_FAIL_KEY = "smtp:breaker_failcount"

# Disposable-domain blocklist, loaded once from the bundled baseline plus an
# optional external feed (VALIDATION_DISPOSABLE_DOMAINS_FILE).
_DISPOSABLE_BASELINE = os.path.join(
    os.path.dirname(__file__), "data", "disposable_domains.txt"
)
# Bundled top consumer-mail domains, used for Damerau-Levenshtein typo suggestions.
_TOP_DOMAINS_FILE = os.path.join(os.path.dirname(__file__), "data", "top_domains.txt")
_disposable_domains: Optional[set] = None
# mtime of the external feed file last loaded, so workers pick up a weekly
# refresh (see update_disposable_domains) without a restart.
_disposable_external_mtime: Optional[float] = None


def _damerau_levenshtein(a: str, b: str, max_distance: int = 2) -> int:
    """Optimal string alignment (Damerau-Levenshtein) distance between two
    strings, counting insertions, deletions, substitutions AND adjacent
    transpositions (so "gmial" -> "gmail" is distance 1). Returns early with
    max_distance + 1 once the best possible distance exceeds max_distance."""
    la, lb = len(a), len(b)
    if abs(la - lb) > max_distance:
        return max_distance + 1
    # d[i][j] = distance between a[:i] and b[:j]
    prev2 = None
    prev = list(range(lb + 1))
    for i in range(1, la + 1):
        cur = [i] + [0] * lb
        row_min = cur[0]
        for j in range(1, lb + 1):
            cost = 0 if a[i - 1] == b[j - 1] else 1
            cur[j] = min(
                prev[j] + 1,  # deletion
                cur[j - 1] + 1,  # insertion
                prev[j - 1] + cost,  # substitution
            )
            if i > 1 and j > 1 and a[i - 1] == b[j - 2] and a[i - 2] == b[j - 1]:
                cur[j] = min(cur[j], prev2[j - 2] + 1)  # transposition
            row_min = min(row_min, cur[j])
        if row_min > max_distance:
            return max_distance + 1
        prev2, prev = prev, cur
    return prev[lb]


def _load_domain_file(path: str) -> set:
    domains: set = set()
    try:
        with open(path, "r", encoding="utf-8") as fh:
            for line in fh:
                line = line.strip().lower()
                if not line or line.startswith("#"):
                    continue
                domains.add(line)
    except FileNotFoundError:
        logger.warning("Disposable-domain file not found: %s", path)
    except Exception as exc:  # pragma: no cover - defensive
        logger.error("Failed reading disposable-domain file %s: %s", path, exc)
    return domains


def _external_disposable_mtime() -> Optional[float]:
    external = _conf("VALIDATION_DISPOSABLE_DOMAINS_FILE", None)
    if not external:
        return None
    try:
        return os.path.getmtime(external)
    except OSError:
        return None


def load_disposable_domains(force: bool = False) -> set:
    """Load and cache the disposable-domain set (baseline + optional feed).

    The set is reloaded when forced, when never loaded, or when the external
    feed file's mtime changed on disk — so a weekly refresh written by the
    update_disposable_domains command is picked up by long-lived workers
    without a restart (the cache is keyed on the file's mtime)."""
    global _disposable_domains, _disposable_external_mtime
    current_mtime = _external_disposable_mtime()
    if (
        _disposable_domains is not None
        and not force
        and current_mtime == _disposable_external_mtime
    ):
        return _disposable_domains

    domains = _load_domain_file(_DISPOSABLE_BASELINE)

    external = _conf("VALIDATION_DISPOSABLE_DOMAINS_FILE", None)
    if external:
        domains |= _load_domain_file(external)

    _disposable_domains = domains
    _disposable_external_mtime = current_mtime
    logger.info("Loaded %d disposable domains", len(domains))
    return domains


@dataclass
class ValidationResult:
    """Comprehensive validation result"""

    is_valid: bool
    score: int
    verdict: str
    breakdown: Dict[str, Any]
    suggestions: List[str]
    warnings: List[str]
    metadata: Dict[str, Any]


class AdvancedEmailValidator:
    """Production-grade email validation with comprehensive checks"""

    def __init__(self):
        # RFC 5322 + 6531 compliant regex (run against the punycode/ASCII form)
        self.rfc_regex = re.compile(
            r"""^(?=.{1,254}$)(?=.{1,64}@)[A-Za-z0-9!#$%&'*+/=?^_`{|}~-]+(?:\.[A-Za-z0-9!#$%&'*+/=?^_`{|}~-]+)*@(?:[A-Za-z0-9](?:[A-Za-z0-9-]{0,61}[A-Za-z0-9])?\.)+[A-Za-z]{2,}$"""
        )

        # Role-based patterns
        self.role_patterns = {
            "admin": r"^(admin|administrator|root|webmaster|postmaster|hostmaster)$",
            "info": r"^(info|information|general|contact|hello|hi)$",
            "support": r"^(support|help|assist|service|customer|client|care)$",
            "sales": r"^(sales|sell|business|commercial|marketing|promo)$",
            "billing": r"^(billing|bill|payment|pay|finance|accounting)$",
            "abuse": r"^(abuse|spam|report|complaint|block|ban)$",
            "noreply": r"^(noreply|no-reply|donotreply|do-not-reply)$",
            "test": r"^(test|testing|demo|example|sample|fake|dummy)$",
        }

        # Disposable domains (loaded from data file + optional external feed)
        self.disposable_domains = load_disposable_domains()

        # High-risk TLDs
        self.risky_tlds = {".tk", ".ml", ".ga", ".cf", ".gq", ".xyz", ".top"}

        # Major mailbox providers (free consumer providers). These are
        # legitimate, high-deliverability domains — not "corporate", but we
        # keep the `is_corporate` output key for backward compatibility.
        self.free_providers = {
            "google.com",
            "gmail.com",
            "googlemail.com",
            "outlook.com",
            "hotmail.com",
            "yahoo.com",
            "ymail.com",
            "protonmail.com",
            "proton.me",
            "icloud.com",
            "me.com",
            "aol.com",
            "live.com",
            "gmx.com",
            "zoho.com",
        }

        # Spam-trap keyword indicators. Matched as whole words (\b...\b) against
        # the domain. NOTE: this is only a WEAK risk-score signal now — it never
        # classifies an address (real traps don't name themselves, and keyword
        # matching flags legitimate services like mailtrap.io). Classification as
        # a trap is data-driven only (self.spam_trap_domains below).
        self.spam_trap_patterns = [
            "spam",
            "trap",
            "spamtrap",
            "honeypot",
            "mailtrap",
        ]
        self._spam_trap_regex = re.compile(
            r"\b(" + "|".join(self.spam_trap_patterns) + r")\b"
        )
        # Extension point for a future data-driven trap list: an optional file of
        # known spam-trap domains (one per line). Empty by default. A domain
        # here classifies as do_not_mail/spamtrap_detected.
        _trap_file = _conf("VALIDATION_SPAMTRAP_DOMAINS_FILE", None)
        self.spam_trap_domains = _load_domain_file(_trap_file) if _trap_file else set()

        # SMTP probe configuration (override in settings for production).
        self.smtp_enabled = bool(_conf("VALIDATION_SMTP_ENABLED", True))
        self.smtp_timeout = int(_conf("VALIDATION_SMTP_TIMEOUT", 3))
        self.smtp_helo_host = _conf("VALIDATION_SMTP_HELO_HOST", "scrubimail.com")
        self.smtp_mail_from = _conf(
            "VALIDATION_SMTP_MAIL_FROM", "verify@scrubimail.com"
        )
        self.smtp_use_starttls = bool(_conf("VALIDATION_SMTP_STARTTLS", True))
        # Circuit breaker: trip after this many consecutive total failures,
        # then skip SMTP for this many seconds. Set threshold high (or TTL to 0)
        # on a host with reliable port-25 egress.
        self.smtp_failure_threshold = int(_conf("VALIDATION_SMTP_FAILURE_THRESHOLD", 3))
        self.smtp_block_ttl = int(_conf("VALIDATION_SMTP_BLOCK_TTL", 600))
        # Catch-all status is cached per domain (Redis) so we probe a garbage
        # address at most once per domain per this TTL, never once per address.
        self.catchall_ttl = int(_conf("VALIDATION_CATCHALL_TTL", 86400))
        # Per-kind cache TTLs (replaces the old single 5-minute TTL).
        self.dns_ttl = int(_conf("VALIDATION_CACHE_TTL_DNS", 21600))
        self.reputation_ttl = int(_conf("VALIDATION_CACHE_TTL_REPUTATION", 86400))
        self.negative_dns_ttl = int(_conf("VALIDATION_CACHE_TTL_NEGATIVE_DNS", 3600))
        # Try up to this many MX hosts (only on connection failure — see
        # smtp_handshake).
        self.max_mx_hosts = int(_conf("VALIDATION_SMTP_MAX_MX_HOSTS", 3))
        # Per-provider probe rate limiter (concurrency + probes/min + cooldown).
        self.rate_limiter = ProviderRateLimiter()
        # Top consumer-mail domains for typo suggestions (Damerau-Levenshtein).
        self.top_domains = _load_domain_file(_TOP_DOMAINS_FILE)
        # Realtime endpoint: deep verification within a hard time budget, with a
        # shared result cache (see validate_email_realtime).
        self.realtime_budget = int(_conf("VALIDATION_REALTIME_BUDGET_SECONDS", 8))
        self.result_cache_ttl = int(_conf("VALIDATION_RESULT_CACHE_TTL", 604800))
        self.result_cache_ttl_unknown = int(
            _conf("VALIDATION_RESULT_CACHE_TTL_UNKNOWN", 86400)
        )

    # ------------------------------------------------------------------ cache
    def _get_cached(self, key: str) -> Optional[Any]:
        """Read from the shared Django cache (Redis), falling back to the
        in-process dict if the cache backend is unavailable.

        Note a cached value of ``False`` (e.g. "not catch-all") is a real hit,
        not a miss — only ``None`` means "not cached".
        """
        if _django_cache is not None:
            try:
                val = _django_cache.get(f"emailval:{key}")
                if val is not None:
                    return val
            except Exception:
                pass  # Redis down / misconfigured -> fall through to dict
        entry = _domain_cache.get(key)
        if entry and time.time() - entry["ts"] < entry.get("ttl", _cache_ttl):
            return entry["val"]
        return None

    def _set_cached(self, key: str, value: Any, ttl: Optional[int] = None) -> None:
        """Write to the shared cache with an explicit per-kind TTL.

        `ttl` defaults to the legacy 5-minute value; callers pass longer,
        per-kind TTLs (DNS, reputation, catch-all — see settings)."""
        ttl = _cache_ttl if ttl is None else ttl
        if _django_cache is not None:
            try:
                _django_cache.set(f"emailval:{key}", value, timeout=ttl)
            except Exception:
                pass  # degrade to the in-process dict below
        _domain_cache[key] = {"val": value, "ts": time.time(), "ttl": ttl}

    # ----------------------------------------------------------------- syntax
    def _to_ascii_domain(self, domain: str) -> str:
        """Convert an internationalized (Unicode) domain to ASCII punycode.

        Returns the original string if it is already ASCII or cannot be
        encoded, so the regex check can reject genuinely invalid input.
        """
        try:
            domain.encode("ascii")
            return domain  # already ASCII, nothing to do
        except UnicodeEncodeError:
            pass

        if idna is not None:
            try:
                return idna.encode(domain, uts46=True).decode("ascii")
            except Exception:
                pass
        try:
            return domain.encode("idna").decode("ascii")
        except Exception:
            return domain

    def validate_syntax(self, email: str) -> Dict[str, Any]:
        """RFC 5322 + 6531 syntax validation with IDN/punycode support."""
        try:
            email = email.strip()
            if email.count("@") < 1:
                return {
                    "valid": False,
                    "error": "Invalid email format",
                    "suggestions": [],
                }

            local, domain = email.rsplit("@", 1)

            # Internationalized domain -> punycode before regex/DNS checks.
            ascii_domain = self._to_ascii_domain(domain)
            normalized = f"{local}@{ascii_domain}"

            if not self.rfc_regex.match(normalized):
                return {
                    "valid": False,
                    "error": "Invalid email format",
                    "suggestions": self._generate_suggestions(email),
                }

            # Length checks
            if len(local) > 64:
                return {
                    "valid": False,
                    "error": "Local part exceeds 64 characters",
                    "suggestions": [],
                }

            if len(ascii_domain) > 253:
                return {
                    "valid": False,
                    "error": "Domain exceeds 253 characters",
                    "suggestions": [],
                }

            return {
                "valid": True,
                "local_part": local,
                "domain": ascii_domain,
                "unicode_domain": domain if ascii_domain != domain else None,
                "suggestions": self._generate_suggestions(email),
            }

        except Exception as e:
            return {
                "valid": False,
                "error": f"Syntax validation error: {str(e)}",
                "suggestions": [],
            }

    def _generate_suggestions(self, email: str) -> List[str]:
        """Suggest a likely-intended address for common typos.

        NEVER auto-corrects — only suggests. Uses Damerau-Levenshtein distance
        (<= 2) against the bundled top consumer-domain list, plus explicit TLD
        fixes (.con/.cmo -> .com, and .co -> .com only for known mail domains)."""
        suggestions: List[str] = []
        if "@" not in email:
            return suggestions
        local, domain = email.rsplit("@", 1)
        domain = domain.strip().lower()
        if not local or not domain:
            return suggestions

        def _add(candidate: str) -> None:
            fixed = f"{local}@{candidate}"
            if candidate != domain and fixed not in suggestions:
                suggestions.append(fixed)

        # Explicit TLD typo fixes (adjacent-key / transposition slips of .com).
        for bad in (".con", ".cmo", ".vom", ".xom", ".ocm", ".comm", ".cim"):
            if domain.endswith(bad):
                _add(domain[: -len(bad)] + ".com")
                break
        # ".co" is a real TLD, so only suggest ".com" when the fixed form is a
        # known mail domain (e.g. gmail.co -> gmail.com).
        if domain.endswith(".co"):
            candidate = domain[:-3] + ".com"
            if candidate in self.top_domains:
                _add(candidate)

        # Nearest known consumer domain within Damerau-Levenshtein distance <= 2.
        # Iterate deterministically so ties resolve the same way every time.
        if domain not in self.top_domains:
            best, best_dist = None, 3
            for known in sorted(self.top_domains):
                d = _damerau_levenshtein(domain, known, max_distance=2)
                if d < best_dist:
                    best, best_dist = known, d
            if best is not None:
                _add(best)

        return suggestions

    # -------------------------------------------------------------- DNS / MX
    def check_dns_mx(self, domain: str) -> Dict[str, Any]:
        """DNS and MX validation with parallel lookups and caching."""
        cache_key = f"dns:{domain}"
        cached = self._get_cached(cache_key)
        if cached is not None:
            return cached

        try:
            resolver = _dns_resolver

            def resolve_a():
                try:
                    return [str(r) for r in resolver.resolve(domain, "A")]
                except Exception:
                    return []

            def resolve_aaaa():
                try:
                    return [str(r) for r in resolver.resolve(domain, "AAAA")]
                except Exception:
                    return []

            def resolve_mx():
                try:
                    mx_response = resolver.resolve(domain, "MX")
                    records = [
                        {
                            "host": str(mx.exchange).rstrip("."),
                            "preference": mx.preference,
                            "score": self._calculate_mx_score(str(mx.exchange)),
                        }
                        for mx in mx_response
                    ]
                    records.sort(key=lambda x: x["preference"])
                    return records
                except Exception:
                    return []

            def resolve_cname():
                try:
                    cname_response = resolver.resolve(domain, "CNAME")
                    return str(cname_response[0])
                except Exception:
                    return None

            def resolve_dnssec():
                # Presence of RRSIG records indicates the zone is DNSSEC-signed.
                try:
                    resolver.resolve(domain, "RRSIG")
                    return True
                except Exception:
                    return False

            with ThreadPoolExecutor(max_workers=5) as executor:
                fut_a = executor.submit(resolve_a)
                fut_aaaa = executor.submit(resolve_aaaa)
                fut_mx = executor.submit(resolve_mx)
                fut_cname = executor.submit(resolve_cname)
                fut_dnssec = executor.submit(resolve_dnssec)

                a_records = fut_a.result()
                aaaa_records = fut_aaaa.result()
                mx_records = fut_mx.result()
                cname_record = fut_cname.result()
                dnssec_valid = fut_dnssec.result()

            dns_score = self._calculate_dns_score(mx_records, a_records, dnssec_valid)

            # Null MX (RFC 7505): a single MX of "." with preference 0 means the
            # domain explicitly does NOT accept mail. Definitive — no SMTP needed.
            null_mx = (
                len(mx_records) == 1
                and mx_records[0]["host"] in ("", ".")
                and mx_records[0]["preference"] == 0
            )

            result = {
                "valid": len(mx_records) > 0 or len(a_records) > 0,
                "a_records": a_records,
                "aaaa_records": aaaa_records,
                "mx_records": mx_records,
                "cname_record": cname_record,
                "dnssec_valid": dnssec_valid,
                "null_mx": null_mx,
                "score": dns_score,
            }

            # Per-kind TTL: real DNS is stable (6h); a negative answer (no MX and
            # no A — e.g. a freshly registered / non-existent domain) is cached
            # only briefly (1h) so it corrects itself quickly.
            ttl = self.dns_ttl if (mx_records or a_records) else self.negative_dns_ttl
            self._set_cached(cache_key, result, ttl=ttl)
            return result

        except Exception as e:
            logger.error(f"DNS check error for {domain}: {str(e)}")
            return {"valid": False, "error": str(e), "score": 0}

    def _calculate_mx_score(self, mx_host: str) -> int:
        mx_lower = mx_host.lower()
        if any(p in mx_lower for p in ["google", "outlook", "yahoo", "protonmail"]):
            return 100
        elif any(p in mx_lower for p in ["amazon", "microsoft", "cloudflare"]):
            return 90
        elif any(p in mx_lower for p in ["godaddy", "namecheap", "hostgator"]):
            return 70
        else:
            return 50

    def _calculate_dns_score(
        self, mx_records: List[Dict], a_records: List[str], dnssec_valid: bool
    ) -> int:
        score = 0
        if mx_records:
            score += 40
            avg_mx_score = sum(mx["score"] for mx in mx_records) / len(mx_records)
            score += int(avg_mx_score * 0.3)
        if a_records:
            score += 20
        if dnssec_valid:
            score += 10
        return min(score, 100)

    # --------------------------------------------------------- circuit breaker
    def _breaker_is_open(self) -> bool:
        """True if the SMTP egress breaker is tripped.

        Redis is the source of truth when reachable (all workers see the same
        block); only when Redis is down do we consult the in-process timestamp.
        """
        if _django_cache is not None:
            try:
                is_open = bool(_django_cache.get(f"emailval:{_SMTP_BREAKER_BLOCK_KEY}"))
                logger.debug("SMTP breaker check (redis): open=%s", is_open)
                return is_open
            except Exception as e:
                logger.warning(
                    "SMTP breaker check: redis unavailable (%s), falling back to "
                    "in-process state",
                    e,
                )
        is_open = time.time() < _smtp_egress_blocked_until
        logger.debug(
            "SMTP breaker check (in-process): open=%s blocked_until=%s now=%s",
            is_open,
            _smtp_egress_blocked_until,
            time.time(),
        )
        return is_open

    def _breaker_record_success(self) -> None:
        """Any successful connection resets the shared (and local) failure state."""
        global _smtp_consecutive_failures, _smtp_egress_blocked_until
        _smtp_consecutive_failures = 0
        _smtp_egress_blocked_until = 0.0
        if _django_cache is not None:
            try:
                _django_cache.delete(f"emailval:{_SMTP_BREAKER_FAIL_KEY}")
                _django_cache.delete(f"emailval:{_SMTP_BREAKER_BLOCK_KEY}")
            except Exception as e:
                logger.warning("SMTP breaker: failed to clear redis state: %s", e)
        logger.info("SMTP breaker: reset after successful connection")

    def _breaker_record_failure(self) -> None:
        """Count a total-egress failure across all workers; trip the breaker
        once the COMBINED count reaches the threshold."""
        global _smtp_consecutive_failures, _smtp_egress_blocked_until
        _smtp_consecutive_failures += 1
        count = _smtp_consecutive_failures  # in-process fallback count
        if _django_cache is not None:
            try:
                key = f"emailval:{_SMTP_BREAKER_FAIL_KEY}"
                if _django_cache.add(key, 1, timeout=self.smtp_block_ttl):
                    count = 1
                else:
                    count = int(_django_cache.incr(key))
            except Exception as e:
                logger.warning(
                    "SMTP breaker: redis incr failed (%s), using in-process count", e
                )
                count = _smtp_consecutive_failures
        logger.warning(
            "SMTP breaker: egress failure recorded (count=%s/%s)",
            count,
            self.smtp_failure_threshold,
        )
        if count >= self.smtp_failure_threshold:
            _smtp_egress_blocked_until = time.time() + self.smtp_block_ttl
            logger.error(
                "SMTP breaker: TRIPPED after %s consecutive failures — "
                "blocking SMTP probes for %ss (until %s)",
                count,
                self.smtp_block_ttl,
                _smtp_egress_blocked_until,
            )
            if _django_cache is not None:
                try:
                    _django_cache.set(
                        f"emailval:{_SMTP_BREAKER_BLOCK_KEY}",
                        1,
                        timeout=self.smtp_block_ttl,
                    )
                except Exception as e:
                    logger.warning(
                        "SMTP breaker: failed to write block flag to redis: %s", e
                    )

    # ------------------------------------------------------------------ SMTP
    def smtp_handshake(
        self,
        email: str,
        domain: str,
        mx_records: List[Dict],
        timeout: Optional[int] = None,
    ) -> Dict[str, Any]:
        """SMTP RCPT-TO probe.

        Crucially distinguishes a *definitive* mailbox rejection (the server
        said "user unknown") from an *indeterminate* result (port 25 blocked,
        timeout, greylisting, ambiguous code). Only definitive rejections
        should count against the address — an unreachable probe is an infra
        signal about us, not about the email.

        `status` is one of: deliverable | undeliverable | unknown | skipped
        """
        results = {
            "valid": False,
            "status": "unknown",
            "catch_all": False,
            "greylisting": False,
            "ndr_patterns": [],
            "response_codes": [],
            "errors": [],
        }

        logger.debug(
            "smtp_handshake: starting for email=%s domain=%s mx_count=%s timeout=%s",
            email,
            domain,
            len(mx_records or []),
            timeout,
        )

        if not self.smtp_enabled:
            logger.info(
                "smtp_handshake: skipped for %s — VALIDATION_SMTP_ENABLED is False",
                email,
            )
            results["status"] = "skipped"
            results["sub_status"] = "no_smtp_check"
            return results

        if not mx_records:
            logger.info(
                "smtp_handshake: skipped for %s — no MX records for domain %s",
                email,
                domain,
            )
            results["status"] = "unknown"
            results["sub_status"] = "no_mx_record"
            results["error"] = "No MX records available"
            return results

        # Circuit breaker: if we recently found port 25 unreachable from this
        # host (shared across workers via Redis), don't waste seconds
        # re-timing-out — return unknown immediately.
        if self._breaker_is_open():
            logger.info(
                "smtp_handshake: skipped for %s — SMTP egress circuit breaker is "
                "OPEN (recent egress failures on port 25)",
                email,
            )
            results["status"] = "unknown"
            results["sub_status"] = "smtp_egress_blocked"
            results["error"] = "SMTP egress recently unreachable (circuit open)"
            return results

        # Per-provider rate limit: reserve a probe slot before touching the
        # network. If the bucket is empty or the provider is in cooldown, do NOT
        # probe — return a rate-limited result the Celery task reschedules
        # (self.retry) instead of blocking the worker or burning IP reputation.
        provider = provider_for_mx(mx_records[0]["host"])
        allowed, retry_after, reason = self.rate_limiter.try_acquire(provider)
        if not allowed:
            logger.info(
                "smtp_handshake: skipped for %s — provider %s rate-limited "
                "(reason=%s, retry_after=%s)",
                email,
                provider,
                reason,
                retry_after,
            )
            results["status"] = "unknown"
            results["sub_status"] = "rate_limited"
            results["rate_limited"] = True
            results["retry_after"] = retry_after
            results["provider"] = provider
            results["error"] = f"Provider {provider} rate-limited ({reason})"
            return results

        connection_succeeded = False
        try:
            # Try up to max_mx_hosts, but we only ADVANCE to the next host on a
            # connection failure (handled in the except clauses). Any SMTP answer
            # ends the loop — re-probing another MX would add volume for no gain.
            for mx in mx_records[: self.max_mx_hosts]:
                mx_host = mx["host"]
                server = None
                logger.debug(
                    "smtp_handshake: connecting to MX %s:25 for %s (timeout=%s)",
                    mx_host,
                    email,
                    timeout or self.smtp_timeout,
                )
                try:
                    server = smtplib.SMTP(timeout=timeout or self.smtp_timeout)
                    server.connect(mx_host, 25)
                    connection_succeeded = True
                    logger.debug(
                        "smtp_handshake: connected to MX %s for %s", mx_host, email
                    )
                    server.helo(self.smtp_helo_host)

                    if self.smtp_use_starttls and server.has_extn("starttls"):
                        try:
                            server.starttls()
                            server.helo(self.smtp_helo_host)
                        except Exception:
                            pass  # fall back to plaintext probe

                    server.mail(self.smtp_mail_from)
                    code, message = server.rcpt(email)
                    message_str = message.decode("utf-8", errors="ignore")
                    results["response_codes"].append(
                        {"mx": mx_host, "code": code, "message": message_str}
                    )
                    logger.debug(
                        "smtp_handshake: RCPT TO response for %s from %s -> "
                        "code=%s message=%s",
                        email,
                        mx_host,
                        code,
                        message_str,
                    )

                    if code in (250, 251):
                        results["valid"] = True
                        results["status"] = "deliverable"
                        results["sub_status"] = "mailbox_exists"
                    elif code in (450, 451, 452, 421):
                        # Temporary failure / greylisting — indeterminate. A 421
                        # (or repeated 4xx) is a reputation signal: pause probes
                        # to this provider so we don't dig the hole deeper.
                        results["greylisting"] = code == 450
                        results["status"] = "unknown"
                        results["sub_status"] = (
                            "greylisted" if code == 450 else "antispam_block"
                        )
                        if code == 421:
                            self.rate_limiter.trip_cooldown(provider)
                        else:
                            self.rate_limiter.note_soft_failure(provider)
                    elif code in (550, 551, 553, 554):
                        lowered = message_str.lower()
                        if any(
                            p in lowered
                            for p in [
                                "user unknown",
                                "no such user",
                                "mailbox not found",
                                "mailbox unavailable",
                                "does not exist",
                                "recipient rejected",
                                "invalid recipient",
                                "address rejected",
                            ]
                        ):
                            results["ndr_patterns"].append(lowered)
                            results["status"] = "undeliverable"
                            results["sub_status"] = "mailbox_not_found"
                        else:
                            # Policy block / anti-spam refusal — not proof the
                            # mailbox is missing.
                            results["status"] = "unknown"
                            results["sub_status"] = "antispam_block"
                    else:
                        results["status"] = "unknown"
                        results["sub_status"] = "unexpected_response"

                    # Catch-all detection reuses THIS already-open session (RSET
                    # + a second RCPT) so we never open a second connection per
                    # address, and the result is cached per domain — see
                    # _get_or_detect_catch_all. Do it before quitting.
                    if results["status"] == "deliverable":
                        results["catch_all"] = self._get_or_detect_catch_all(
                            domain, mx_records, server=server
                        )

                    try:
                        server.quit()
                    except Exception:
                        pass

                    # This MX answered (any SMTP code) — we have our result for
                    # this address. Never re-probe another MX for it.
                    break

                except (socket.timeout, ConnectionRefusedError, OSError) as e:
                    logger.warning(
                        "smtp_handshake: connection failed to MX %s for %s — %s: %s",
                        mx_host,
                        email,
                        type(e).__name__,
                        e,
                    )
                    results["errors"].append(f"MX {mx_host}: {str(e)}")
                    if server is not None:
                        try:
                            server.close()
                        except Exception:
                            pass
                    continue
                except Exception as e:
                    logger.warning(
                        "smtp_handshake: unexpected error on MX %s for %s — %s: %s",
                        mx_host,
                        email,
                        type(e).__name__,
                        e,
                    )
                    results["errors"].append(f"MX {mx_host}: {str(e)}")
                    continue

            if connection_succeeded:
                # Egress works — reset the shared failure streak.
                self._breaker_record_success()
            else:
                # Couldn't reach any MX on port 25 (commonly blocked on cloud
                # hosts). Report unknown rather than penalizing the address. The
                # breaker trips only after the COMBINED (cross-worker) failure
                # count reaches the threshold, so one slow MX on a healthy host
                # doesn't disable SMTP for everything.
                logger.warning(
                    "smtp_handshake: FAILED to reach any of %s MX host(s) for %s "
                    "on port 25 — errors: %s",
                    min(len(mx_records), self.max_mx_hosts),
                    email,
                    results["errors"],
                )
                self._breaker_record_failure()
                results["status"] = "unknown"
                results["sub_status"] = "failed_smtp_connection"
                results["error"] = "SMTP port 25 unreachable from this host"
        finally:
            # Always release the concurrency slot we reserved above.
            self.rate_limiter.release(provider)

        logger.debug(
            "smtp_handshake: final result for %s -> status=%s sub_status=%s",
            email,
            results.get("status"),
            results.get("sub_status"),
        )
        return results

    def _get_or_detect_catch_all(
        self, domain: str, mx_records: List[Dict], server: Any = None
    ) -> bool:
        """Return whether `domain` is catch-all, using a cached result when
        available and otherwise a SINGLE probe.

        Caching (Redis, 24h by default) means we probe a given domain's
        catch-all status at most once per TTL no matter how many addresses we
        validate there — the old code fired one garbage-address probe per
        deliverable address, a textbook verifier-abuse pattern that gets the
        egress IP tempfailed/blocklisted. Both true and false results are
        cached. When a live SMTP session is supplied we reuse it (RSET + a
        second RCPT) so no extra connection is opened; we only fall back to a
        fresh connection if that session cannot be reused.
        """
        cache_key = f"catchall:{domain}"
        cached = self._get_cached(cache_key)
        if cached is not None:
            return bool(cached)

        result: Optional[bool] = None
        if server is not None:
            result = self._probe_catch_all_on_session(server, domain)
        if result is None:
            result = self._detect_catch_all(domain, mx_records)

        self._set_cached(cache_key, bool(result), ttl=self.catchall_ttl)
        return bool(result)

    def _probe_catch_all_on_session(self, server: Any, domain: str) -> Optional[bool]:
        """Probe catch-all on an already-open SMTP session via RSET + RCPT.

        Returns True/False on a clean result, or None if the session could not
        be reused (the caller then falls back to a new connection). RSET aborts
        the current mail transaction, so we must re-issue MAIL FROM before the
        second RCPT (RFC 5321).
        """
        test_email = f"xq7z9k-{int(time.time())}@{domain}"
        try:
            server.rset()
            server.mail(self.smtp_mail_from)
            code, _ = server.rcpt(test_email)
            return code in (250, 251)
        except Exception:
            return None

    def _detect_catch_all(self, domain: str, mx_records: List[Dict]) -> bool:
        """Detect catch-all with a single random-address probe on a NEW
        connection. Fallback path only — the common case reuses the existing
        session via _probe_catch_all_on_session. Caching is handled by the
        caller (_get_or_detect_catch_all), so this must not cache."""
        if not mx_records:
            return False

        test_email = f"xq7z9k-{int(time.time())}@{domain}"
        server = None
        try:
            mx_host = mx_records[0]["host"]
            server = smtplib.SMTP(timeout=self.smtp_timeout)
            server.connect(mx_host, 25)
            server.helo(self.smtp_helo_host)
            if self.smtp_use_starttls and server.has_extn("starttls"):
                try:
                    server.starttls()
                    server.helo(self.smtp_helo_host)
                except Exception:
                    pass
            server.mail(self.smtp_mail_from)
            code, _ = server.rcpt(test_email)
            return code in (250, 251)
        except Exception:
            return False
        finally:
            if server is not None:
                try:
                    server.quit()
                except Exception:
                    try:
                        server.close()
                    except Exception:
                        pass

    # ------------------------------------------------------------ reputation
    def check_domain_reputation(self, domain: str) -> Dict[str, Any]:
        """Domain reputation analysis with caching."""
        cache_key = f"rep:{domain}"
        cached = self._get_cached(cache_key)
        if cached is not None:
            return cached

        try:
            domain_lower = domain.lower()
            # Use the live set (reloads on feed refresh via mtime) rather than
            # the snapshot captured at __init__, so long-lived workers see the
            # weekly disposable-domain update without a restart.
            is_disposable = domain_lower in load_disposable_domains()
            tld_risk = any(domain_lower.endswith(tld) for tld in self.risky_tlds)
            is_free_provider = domain_lower in self.free_providers
            # Weak keyword signal (risk score only), plus the data-driven trap
            # list (the only thing that classifies as a trap).
            spam_trap_risk = self._detect_spam_trap_patterns(domain_lower)
            is_spam_trap = domain_lower in self.spam_trap_domains

            reputation_score = self._calculate_reputation_score(
                is_disposable, tld_risk, is_free_provider, spam_trap_risk, is_spam_trap
            )

            result = {
                "is_disposable": is_disposable,
                "tld_risk": tld_risk,
                # Backward-compatible key; now means "known major provider".
                "is_corporate": is_free_provider,
                "is_free_provider": is_free_provider,
                "spam_trap_risk": spam_trap_risk,
                "is_spam_trap": is_spam_trap,
                "reputation_score": reputation_score,
                "risk_level": self._get_risk_level(reputation_score),
            }
            self._set_cached(cache_key, result, ttl=self.reputation_ttl)
            return result

        except Exception as e:
            logger.error(f"Domain reputation check error for {domain}: {str(e)}")
            return {"error": str(e), "reputation_score": 0, "risk_level": "unknown"}

    def _detect_spam_trap_patterns(self, domain: str) -> float:
        """Whole-word spam-trap indicator detection (no substring false hits)."""
        matches = set(self._spam_trap_regex.findall(domain))
        return min(len(matches) * 0.3, 1.0)

    def _calculate_reputation_score(
        self,
        is_disposable: bool,
        tld_risk: bool,
        is_free_provider: bool,
        spam_trap_risk: float,
        is_spam_trap: bool = False,
    ) -> int:
        score = 100
        if is_disposable:
            score -= 80
        if tld_risk:
            score -= 30
        if is_free_provider:
            score += 20
        if is_spam_trap:
            score -= 90  # data-driven trap: decisive
        elif spam_trap_risk > 0.5:
            score -= 5  # keyword heuristic: weak signal only
        return max(0, min(100, score))

    def _get_risk_level(self, score: int) -> str:
        if score >= 80:
            return "low"
        elif score >= 50:
            return "medium"
        else:
            return "high"

    # ------------------------------------------------------------------ role
    def detect_role_based(self, local_part: str) -> Dict[str, Any]:
        local_lower = local_part.lower()
        detected_roles = []
        role_score = 0
        for role_name, pattern in self.role_patterns.items():
            if re.match(pattern, local_lower):
                detected_roles.append(role_name)
                role_score += 1
        has_plus_alias = "+" in local_part
        return {
            "is_role_based": len(detected_roles) > 0,
            "detected_roles": detected_roles,
            "has_plus_alias": has_plus_alias,
            "role_score": role_score,
            "risk_level": (
                "high" if role_score > 2 else "medium" if role_score > 0 else "low"
            ),
        }

    # ------------------------------------------------------------ risk score
    def calculate_risk_score(
        self, validation_results: Dict[str, Any]
    ) -> Dict[str, Any]:
        score = 100
        deductions = []
        explanations = []

        # Syntax validation
        if not validation_results.get("syntax", {}).get("valid", False):
            score -= 50
            deductions.append("Invalid email syntax")
            explanations.append("Email format does not comply with RFC 5322/6531")

        # DNS/MX validation
        dns_result = validation_results.get("dns", {})
        mx_records = dns_result.get("mx_records", [])
        if not dns_result.get("valid", False):
            score -= 50
            deductions.append("No valid DNS records")
            explanations.append("Domain does not exist")
        elif len(mx_records) == 0:
            score -= 40
            deductions.append("No MX records")
            explanations.append("Domain has no mail exchange records")
        else:
            dns_score = dns_result.get("score", 0)
            if dns_score < 50:
                score -= 15
                deductions.append("Low DNS reputation")
                explanations.append("Domain has poor mail server reputation")

        # SMTP validation — only penalize a *definitive* rejection. An
        # unknown/skipped probe (port 25 blocked, greylisting, timeout) must
        # not drag the score down for an infra reason.
        smtp_result = validation_results.get("smtp", {})
        smtp_status = smtp_result.get("status", "unknown")
        if smtp_status == "undeliverable":
            # A confirmed mailbox rejection is the strongest negative signal
            # short of invalid syntax — make it decisively "Invalid".
            score -= 55
            deductions.append("Mailbox does not exist")
            explanations.append("Mail server rejected the recipient (user unknown)")
        elif smtp_status == "deliverable":
            # Confirmed mailbox — small confidence bump.
            score = min(100, score + 5)

        # Domain reputation
        reputation = validation_results.get("reputation", {})
        if reputation.get("is_disposable", False):
            score -= 40
            deductions.append("Disposable email domain")
            explanations.append("Domain is known for temporary/disposable emails")
        if reputation.get("tld_risk", False):
            score -= 20
            deductions.append("High-risk TLD")
            explanations.append("Top-level domain has poor reputation")
        if reputation.get("is_spam_trap", False):
            score -= 40
            deductions.append("Known spam trap")
            explanations.append("Domain is on the configured spam-trap list")
        elif reputation.get("spam_trap_risk", 0) > 0.5:
            # Weak keyword heuristic only — small deduction, never decisive.
            score -= 5
            deductions.append("Spam-trap keyword signal")
            explanations.append(
                "Domain name contains spam-trap-like keywords (low confidence)"
            )

        # Role-based detection
        role_result = validation_results.get("role_based", {})
        if role_result.get("is_role_based", False):
            role_score = role_result.get("role_score", 0)
            if role_score > 2:
                score -= 25
                deductions.append("Multiple role indicators")
                explanations.append("Email contains multiple role-based patterns")
            else:
                score -= 10
                deductions.append("Role-based email")
                explanations.append("Email appears to be role-based")

        # Catch-all detection
        if smtp_result.get("catch_all", False):
            score -= 15
            deductions.append("Catch-all domain")
            explanations.append("Domain accepts all email addresses")

        score = max(0, min(100, score))

        # ZeroBounce-style classification. The status — not the raw score — is
        # the source of truth, and `is_valid` is true ONLY when SMTP actually
        # confirmed the mailbox. "We couldn't verify it" is never "Valid".
        status, sub_status = self._classify(validation_results)

        # Keep the numeric score coherent with the status so we never report a
        # confident 100 next to an unverified/unknown address.
        # Exactly five statuses, one naming convention (all snake_case). Spam
        # traps are folded into do_not_mail (see _classify), so there is no
        # sixth top-level status.
        ceilings = {
            "valid": (90, 100),
            "catch_all": (40, 70),
            "unknown": (0, 70),
            "do_not_mail": (0, 50),
            "invalid": (0, 20),
        }
        lo, hi = ceilings.get(status, (0, 100))
        score = max(lo, min(score, hi))

        verdict = {
            "valid": "Valid",
            "invalid": "Invalid",
            "catch_all": "Catch-All",
            "unknown": "Unknown",
            "do_not_mail": "Do Not Mail",
        }.get(status, "Unknown")

        return {
            "score": score,
            "verdict": verdict,
            "status": status,
            "sub_status": sub_status,
            "is_valid": status == "valid",
            "deductions": deductions,
            "explanations": explanations,
        }

    def _classify(self, vr: Dict[str, Any]) -> tuple:
        """Map raw signals to a ZeroBounce-style (status, sub_status).

        Priority is deliberate: hard "invalid" beats everything, a confirmed
        mailbox is "valid", and anything we could not actually verify resolves
        to "unknown" — never to "valid".
        """
        syntax = vr.get("syntax", {})
        dns = vr.get("dns", {})
        smtp = vr.get("smtp", {})
        rep = vr.get("reputation", {})
        role = vr.get("role_based", {})
        smtp_status = smtp.get("status", "unknown")

        # 1. Hard-invalid: syntax, then DNS.
        if not syntax.get("valid", False):
            return "invalid", (
                "possible_typo" if syntax.get("suggestions") else "bad_syntax"
            )
        if not dns.get("valid", False):
            return "invalid", "no_dns_entries"

        # 1b. Null MX (RFC 7505): domain explicitly refuses mail.
        if dns.get("null_mx", False):
            return "invalid", "does_not_accept_mail"

        # 2. Confirmed non-existent mailbox.
        if smtp_status == "undeliverable":
            return "invalid", "mailbox_not_found"

        # 3. Toxic / do-not-mail signals. Spam-trap is folded into do_not_mail
        # (ZeroBounce convention: sub_status=spamtrap_detected) and is DATA-DRIVEN
        # only — a domain on the configured trap list. The keyword heuristic is a
        # weak risk-score signal, never a classification trigger, so legitimate
        # services like mailtrap.io are not mislabelled.
        if rep.get("is_spam_trap", False):
            return "do_not_mail", "spamtrap_detected"
        if rep.get("is_disposable", False):
            return "do_not_mail", "disposable"
        if role.get("is_role_based", False):
            return "do_not_mail", "role_based"

        # 4. Confirmed deliverable.
        if smtp_status == "deliverable":
            if smtp.get("catch_all", False):
                return "catch_all", "accept_all"
            return "valid", "mailbox_exists"

        # 5. Everything else = we could not verify the mailbox.
        return "unknown", smtp.get("sub_status") or "no_smtp_check"

    # ------------------------------------------------------------- realtime
    def _probe_timeout(self, start_time: float, budget: Optional[float]) -> int:
        """SMTP connect timeout for this probe, capped to the budget remaining so
        one tarpit can't consume the whole realtime budget."""
        if budget is None:
            return self.smtp_timeout
        remaining = budget - (time.time() - start_time)
        return max(1, min(self.smtp_timeout, int(remaining)))

    @staticmethod
    def _result_key(email: str) -> str:
        digest = hashlib.sha256(email.strip().lower().encode("utf-8")).hexdigest()
        return f"result:{digest}"

    def get_cached_result(self, email: str) -> Optional[ValidationResult]:
        """Return a previously-completed verification for `email` from the shared
        result cache, or None. Checked before any network work."""
        payload = self._get_cached(self._result_key(email))
        if not payload:
            return None
        return ValidationResult(
            is_valid=payload["is_valid"],
            score=payload["score"],
            verdict=payload["verdict"],
            breakdown=payload.get("breakdown", {}),
            suggestions=payload.get("suggestions", []),
            warnings=payload.get("warnings", []),
            metadata=payload.get("metadata", {}),
        )

    def store_result(self, email: str, result: ValidationResult) -> None:
        """Persist a COMPLETED verification to the shared result cache so both the
        realtime endpoint and bulk/deep Celery work benefit. Transient failures
        (rate-limited, timeout, egress unavailable) are not cached — the next
        request should retry them."""
        status = result.metadata.get("status")
        sub_status = result.metadata.get("sub_status")
        ttl = self._result_ttl(status, sub_status)
        if ttl is None:
            return
        payload = {
            "is_valid": result.is_valid,
            "score": result.score,
            "verdict": result.verdict,
            "breakdown": result.breakdown,
            "suggestions": result.suggestions,
            "warnings": result.warnings,
            "metadata": {
                **result.metadata,
                "verified_at": result.metadata.get("verified_at") or _now_iso(),
            },
        }
        self._set_cached(self._result_key(email), payload, ttl=ttl)

    _TRANSIENT_SUBSTATUSES = {
        "rate_limited",
        "timeout",
        "smtp_unavailable",
        "smtp_egress_blocked",
        "failed_smtp_connection",
        "exception_occurred",
    }

    def _result_ttl(
        self, status: Optional[str], sub_status: Optional[str]
    ) -> Optional[int]:
        if status in ("valid", "invalid", "catch_all", "do_not_mail"):
            return self.result_cache_ttl
        if status == "unknown" and sub_status not in self._TRANSIENT_SUBSTATUSES:
            return self.result_cache_ttl_unknown
        return None  # transient / non-terminal -> do not cache

    def validate_email_realtime(
        self, email: str, fast: bool = False, budget: Optional[float] = None
    ):
        """Customer-facing realtime verification. Deep by default within a hard
        time budget; `fast=True` runs the syntax/DNS/list-only path.

        Returns (ValidationResult, from_cache: bool). The result is honest —
        `unknown` with sub_status timeout/rate_limited/smtp_unavailable when the
        mailbox could not be confirmed within budget — never a fabricated valid.
        """
        budget = budget or self.realtime_budget

        # 1. Result cache — before any network work.
        cached = self.get_cached_result(email)
        if cached is not None:
            return cached, True

        # 2. Only attempt SMTP from a worker with confirmed port-25 egress. The
        # shared circuit breaker (Issue 6) is the signal: if it's open (or this
        # isn't an egress worker), fall back to the fast path and report
        # smtp_unavailable rather than burning the budget on timeouts.
        breaker_open = self._breaker_is_open()
        egress_ok = self.smtp_enabled and not breaker_open
        logger.debug(
            "validate_email_realtime: email=%s fast=%s smtp_enabled=%s "
            "breaker_open=%s egress_ok=%s",
            email,
            fast,
            self.smtp_enabled,
            breaker_open,
            egress_ok,
        )
        if fast or not egress_ok:
            if not fast:
                logger.info(
                    "validate_email_realtime: falling back to fast path for %s — "
                    "smtp_enabled=%s breaker_open=%s",
                    email,
                    self.smtp_enabled,
                    breaker_open,
                )
            result = self.validate_email(email, deep=False)
            if not fast:
                self._mark_smtp_unavailable(result)
        else:
            result = self.validate_email(email, deep=True, budget=budget)

        # 3. Stamp the verification time and cache terminal results. Fast-mode
        # results are never cached — they are not full verifications, so caching
        # an unknown/no_smtp_check would poison a later deep lookup.
        result.metadata["verified_at"] = _now_iso()
        if not fast:
            self.store_result(email, result)
        return result, False

    def _mark_smtp_unavailable(self, result: ValidationResult) -> None:
        """Relabel a fast-path result whose SMTP stage was skipped because egress
        is unavailable (breaker open / not an egress worker)."""
        logger.warning(
            "SMTP unavailable: relabeling result as smtp_unavailable "
            "(previous sub_status=%s)",
            result.metadata.get("sub_status"),
        )
        result.metadata["sub_status"] = "smtp_unavailable"
        msg = "SMTP verification unavailable (egress down) — mailbox not confirmed"
        if msg not in result.warnings:
            result.warnings.append(msg)

    # -------------------------------------------------------------- pipeline
    def validate_email(
        self,
        email: str,
        deep: Optional[bool] = None,
        budget: Optional[float] = None,
    ) -> ValidationResult:
        """Complete email validation pipeline.

        `deep` controls SMTP mailbox probing — the only slow (multi-second),
        network-bound stage:
          * deep=False  -> never probe SMTP. Realtime path: ~20-50ms cold,
            sub-ms cached. Use this for interactive/realtime validation.
          * deep=True   -> probe SMTP (subject to VALIDATION_SMTP_ENABLED).
            Use for async/bulk jobs where multi-second latency is acceptable.
          * deep=None   -> fall back to the VALIDATION_SMTP_ENABLED setting.

        `budget` (seconds) bounds the realtime deep path: if the SMTP stage
        would start after the budget is spent, it is skipped and reported as
        unknown/timeout, and the probe's own connect timeout is capped to the
        time remaining so a single tarpit can't consume the whole budget.
        """
        start_time = time.time()
        do_smtp = self.smtp_enabled if deep is None else (deep and self.smtp_enabled)

        try:
            # Step 1: Syntax validation
            syntax_result = self.validate_syntax(email)
            if not syntax_result["valid"]:
                return ValidationResult(
                    is_valid=False,
                    score=0,
                    verdict="Invalid",
                    breakdown={"syntax": syntax_result},
                    suggestions=syntax_result.get("suggestions", []),
                    warnings=[],
                    metadata={
                        "validation_time": time.time() - start_time,
                        "status": "invalid",
                        "sub_status": (
                            "possible_typo"
                            if syntax_result.get("suggestions")
                            else "bad_syntax"
                        ),
                    },
                )

            local_part = syntax_result["local_part"]
            domain = syntax_result["domain"]

            # Step 2: DNS/MX validation
            dns_result = self.check_dns_mx(domain)

            # Step 3: SMTP handshake (skipped on the realtime path — it is the
            # only multi-second, network-bound stage and yields no signal on
            # cloud hosts where port 25 is blocked).
            mx_records = dns_result.get("mx_records", [])
            a_records = dns_result.get("a_records", [])
            if dns_result.get("null_mx", False):
                # RFC 7505: the domain declared it accepts no mail. Definitive —
                # skip SMTP entirely (an easy, certain "invalid").
                smtp_result = {
                    "valid": False,
                    "status": "skipped",
                    "sub_status": "null_mx",
                    "catch_all": False,
                    "greylisting": False,
                }
            elif not do_smtp:
                smtp_result = {
                    "valid": False,
                    "status": "skipped",
                    "catch_all": False,
                    "greylisting": False,
                }
            elif budget is not None and (budget - (time.time() - start_time)) <= 0.5:
                # Realtime budget spent before we could probe — honest timeout.
                smtp_result = {
                    "valid": False,
                    "status": "unknown",
                    "sub_status": "timeout",
                    "catch_all": False,
                    "greylisting": False,
                }
            elif mx_records:
                smtp_result = self.smtp_handshake(
                    email,
                    domain,
                    mx_records,
                    timeout=self._probe_timeout(start_time, budget),
                )
            elif a_records:
                # Fallback to A record as implicit MX (RFC 5321 §5.1).
                smtp_result = self.smtp_handshake(
                    email,
                    domain,
                    [{"host": domain, "preference": 0, "score": 30}],
                    timeout=self._probe_timeout(start_time, budget),
                )
            else:
                smtp_result = {
                    "valid": False,
                    "status": "unknown",
                    "error": "No DNS or MX records available",
                    "catch_all": False,
                    "greylisting": False,
                }

            # Step 4: Domain reputation
            reputation_result = self.check_domain_reputation(domain)

            # Step 5: Role-based detection
            role_result = self.detect_role_based(local_part)

            # Step 6: Calculate risk score
            validation_results = {
                "syntax": syntax_result,
                "dns": dns_result,
                "smtp": smtp_result,
                "reputation": reputation_result,
                "role_based": role_result,
            }
            risk_result = self.calculate_risk_score(validation_results)

            # Warnings
            warnings = []
            if reputation_result.get("is_disposable", False):
                warnings.append("Disposable email domain detected")
            if role_result.get("is_role_based", False):
                warnings.append("Role-based email detected")
            if smtp_result.get("catch_all", False):
                warnings.append("Catch-all domain detected")
            if reputation_result.get("is_spam_trap", False):
                warnings.append("Known spam trap — do not mail")
            if risk_result["status"] == "unknown":
                warnings.append(
                    "Mailbox not confirmed — SMTP verification was inconclusive "
                    "or not performed (status: unknown, not 'valid')"
                )
            elif risk_result["status"] == "catch_all":
                warnings.append(
                    "Catch-all domain — accepts all addresses, so the specific "
                    "mailbox cannot be confirmed"
                )

            metadata = {
                "validation_time": time.time() - start_time,
                "status": risk_result["status"],
                "sub_status": risk_result["sub_status"],
            }
            # Surface a rate-limit signal so the async task can reschedule this
            # address (self.retry) rather than finalize it — see tasks.py.
            if smtp_result.get("rate_limited"):
                metadata["rate_limited"] = True
                metadata["retry_after"] = smtp_result.get("retry_after")

            return ValidationResult(
                # Strict, ZeroBounce-style: only a SMTP-confirmed mailbox is valid.
                is_valid=risk_result["is_valid"],
                score=risk_result["score"],
                verdict=risk_result["verdict"],
                breakdown=validation_results,
                suggestions=syntax_result.get("suggestions", []),
                warnings=warnings,
                metadata=metadata,
            )

        except Exception as e:
            logger.error(f"Email validation error for {email}: {str(e)}")
            return ValidationResult(
                is_valid=False,
                score=0,
                verdict="Error",
                breakdown={"error": str(e)},
                suggestions=[],
                warnings=[f"Validation error: {str(e)}"],
                metadata={
                    "validation_time": time.time() - start_time,
                    "status": "unknown",
                    "sub_status": "exception_occurred",
                },
            )
