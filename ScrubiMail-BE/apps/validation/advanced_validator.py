import os
import re
import dns.resolver
import smtplib
import socket
import time
import logging
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

logger = logging.getLogger(__name__)


def _conf(name: str, default: Any) -> Any:
    """Read a validation setting from Django settings with a safe fallback."""
    if _django_settings is not None:
        return getattr(_django_settings, name, default)
    return default


# Module-level DNS resolver with short timeouts
_dns_resolver = dns.resolver.Resolver()
_dns_resolver.timeout = 3        # per-query timeout
_dns_resolver.lifetime = 5       # total resolution lifetime

# Simple TTL cache for domain DNS/reputation results
_domain_cache: Dict[str, Dict[str, Any]] = {}
_cache_ttl = 300  # 5 minutes

# Disposable-domain blocklist, loaded once from the bundled baseline plus an
# optional external feed (VALIDATION_DISPOSABLE_DOMAINS_FILE).
_DISPOSABLE_BASELINE = os.path.join(
    os.path.dirname(__file__), "data", "disposable_domains.txt"
)
_disposable_domains: Optional[set] = None


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


def load_disposable_domains(force: bool = False) -> set:
    """Load and cache the disposable-domain set (baseline + optional feed)."""
    global _disposable_domains
    if _disposable_domains is not None and not force:
        return _disposable_domains

    domains = _load_domain_file(_DISPOSABLE_BASELINE)

    external = _conf("VALIDATION_DISPOSABLE_DOMAINS_FILE", None)
    if external:
        domains |= _load_domain_file(external)

    _disposable_domains = domains
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

        # Spam-trap indicators. Matched as whole words (\b...\b) against the
        # domain so substrings like "test" inside "greatest" do NOT match.
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

        # SMTP probe configuration (override in settings for production).
        self.smtp_enabled = bool(_conf("VALIDATION_SMTP_ENABLED", True))
        self.smtp_timeout = int(_conf("VALIDATION_SMTP_TIMEOUT", 3))
        self.smtp_helo_host = _conf("VALIDATION_SMTP_HELO_HOST", "scrubimail.com")
        self.smtp_mail_from = _conf(
            "VALIDATION_SMTP_MAIL_FROM", "verify@scrubimail.com"
        )
        self.smtp_use_starttls = bool(_conf("VALIDATION_SMTP_STARTTLS", True))

    # ------------------------------------------------------------------ cache
    def _get_cached(self, key: str) -> Optional[Any]:
        entry = _domain_cache.get(key)
        if entry and time.time() - entry["ts"] < _cache_ttl:
            return entry["val"]
        return None

    def _set_cached(self, key: str, value: Any) -> None:
        _domain_cache[key] = {"val": value, "ts": time.time()}

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
        """Generate email suggestions for common typos"""
        suggestions = []
        if "@" not in email:
            return suggestions
        local, domain = email.rsplit("@", 1)

        domain_suggestions = {
            "gmai.com": "gmail.com",
            "gmal.com": "gmail.com",
            "gamil.com": "gmail.com",
            "gmial.com": "gmail.com",
            "hotmai.com": "hotmail.com",
            "hotmal.com": "hotmail.com",
            "outlok.com": "outlook.com",
            "yaho.com": "yahoo.com",
            "yhoo.com": "yahoo.com",
        }

        if domain in domain_suggestions:
            suggestions.append(f"{local}@{domain_suggestions[domain]}")

        if domain.endswith(".con") or domain.endswith(".cmo"):
            suggestions.append(f"{local}@{domain[:-4]}.com")

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

            result = {
                "valid": len(mx_records) > 0 or len(a_records) > 0,
                "a_records": a_records,
                "aaaa_records": aaaa_records,
                "mx_records": mx_records,
                "cname_record": cname_record,
                "dnssec_valid": dnssec_valid,
                "score": dns_score,
            }

            self._set_cached(cache_key, result)
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

    # ------------------------------------------------------------------ SMTP
    def smtp_handshake(
        self, email: str, domain: str, mx_records: List[Dict]
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

        if not self.smtp_enabled:
            results["status"] = "skipped"
            return results

        if not mx_records:
            results["status"] = "unknown"
            results["error"] = "No MX records available"
            return results

        connection_succeeded = False

        for mx in mx_records[:2]:
            mx_host = mx["host"]
            server = None
            try:
                server = smtplib.SMTP(timeout=self.smtp_timeout)
                server.connect(mx_host, 25)
                connection_succeeded = True
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

                if code in (250, 251):
                    results["valid"] = True
                    results["status"] = "deliverable"
                elif code in (450, 451, 452, 421):
                    # Temporary failure / greylisting — indeterminate.
                    results["greylisting"] = code == 450
                    results["status"] = "unknown"
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
                    else:
                        # Policy block / anti-spam refusal — not proof the
                        # mailbox is missing.
                        results["status"] = "unknown"
                else:
                    results["status"] = "unknown"

                try:
                    server.quit()
                except Exception:
                    pass

                # Stop after the first server that gave us a definitive answer.
                if results["status"] in ("deliverable", "undeliverable"):
                    break

            except (socket.timeout, ConnectionRefusedError, OSError) as e:
                results["errors"].append(f"MX {mx_host}: {str(e)}")
                if server is not None:
                    try:
                        server.close()
                    except Exception:
                        pass
                continue
            except Exception as e:
                results["errors"].append(f"MX {mx_host}: {str(e)}")
                continue

        if not connection_succeeded:
            # Couldn't reach any MX on port 25 (commonly blocked on cloud
            # hosts). Report unknown rather than penalizing the address.
            results["status"] = "unknown"
            results["error"] = "SMTP port 25 unreachable from this host"

        # Catch-all detection only when the mailbox itself looked deliverable.
        if results["status"] == "deliverable":
            results["catch_all"] = self._detect_catch_all(domain, mx_records)

        return results

    def _detect_catch_all(self, domain: str, mx_records: List[Dict]) -> bool:
        """Detect catch-all domains with a single random-address probe."""
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
            is_disposable = domain_lower in self.disposable_domains
            tld_risk = any(domain_lower.endswith(tld) for tld in self.risky_tlds)
            is_free_provider = domain_lower in self.free_providers
            spam_trap_risk = self._detect_spam_trap_patterns(domain_lower)

            reputation_score = self._calculate_reputation_score(
                is_disposable, tld_risk, is_free_provider, spam_trap_risk
            )

            result = {
                "is_disposable": is_disposable,
                "tld_risk": tld_risk,
                # Backward-compatible key; now means "known major provider".
                "is_corporate": is_free_provider,
                "is_free_provider": is_free_provider,
                "spam_trap_risk": spam_trap_risk,
                "reputation_score": reputation_score,
                "risk_level": self._get_risk_level(reputation_score),
            }
            self._set_cached(cache_key, result)
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
    ) -> int:
        score = 100
        if is_disposable:
            score -= 80
        if tld_risk:
            score -= 30
        if is_free_provider:
            score += 20
        if spam_trap_risk > 0.5:
            score -= 40
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
            score -= 40
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
        if reputation.get("spam_trap_risk", 0) > 0.5:
            score -= 30
            deductions.append("Potential spam trap")
            explanations.append("Email pattern matches known spam trap indicators")

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

        if score >= 80:
            verdict = "Valid"
        elif score >= 50:
            verdict = "Risky"
        elif score >= 20:
            verdict = "Invalid"
        else:
            verdict = "High Risk"

        return {
            "score": score,
            "verdict": verdict,
            "deductions": deductions,
            "explanations": explanations,
        }

    # -------------------------------------------------------------- pipeline
    def validate_email(self, email: str) -> ValidationResult:
        """Complete email validation pipeline"""
        start_time = time.time()

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
                    metadata={"validation_time": time.time() - start_time},
                )

            local_part = syntax_result["local_part"]
            domain = syntax_result["domain"]

            # Step 2: DNS/MX validation
            dns_result = self.check_dns_mx(domain)

            # Step 3: SMTP handshake
            mx_records = dns_result.get("mx_records", [])
            a_records = dns_result.get("a_records", [])
            if mx_records:
                smtp_result = self.smtp_handshake(email, domain, mx_records)
            elif a_records:
                # Fallback to A record as implicit MX (RFC 5321 §5.1).
                smtp_result = self.smtp_handshake(
                    email,
                    domain,
                    [{"host": domain, "preference": 0, "score": 30}],
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
            if reputation_result.get("spam_trap_risk", 0) > 0.5:
                warnings.append("Potential spam trap detected")
            if smtp_result.get("status") == "unknown":
                warnings.append(
                    "Mailbox could not be verified via SMTP (probe inconclusive)"
                )

            return ValidationResult(
                is_valid=risk_result["score"] >= 50,
                score=risk_result["score"],
                verdict=risk_result["verdict"],
                breakdown=validation_results,
                suggestions=syntax_result.get("suggestions", []),
                warnings=warnings,
                metadata={"validation_time": time.time() - start_time},
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
                metadata={"validation_time": time.time() - start_time},
            )
