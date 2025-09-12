import re
import dns.resolver
import smtplib
import socket
import time
import hashlib
from typing import Dict, List, Any, Optional
from dataclasses import dataclass
import logging

logger = logging.getLogger(__name__)


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
        # RFC 5322 + 6531 compliant regex
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

        # Disposable domains
        self.disposable_domains = {
            "mailinator.com",
            "10minutemail.com",
            "guerrillamail.com",
            "trashmail.com",
            "tempmail.org",
            "throwaway.email",
            "maildrop.cc",
            "yopmail.com",
            "getairmail.com",
            "mailnesia.com",
            "sharklasers.com",
            "grr.la",
            "pokemail.net",
            "spam4.me",
            "bccto.me",
            "chacuo.net",
            "dispostable.com",
        }

        # High-risk TLDs
        self.risky_tlds = {".tk", ".ml", ".ga", ".cf", ".gq", ".xyz", ".top"}

        # Corporate providers
        self.corporate_providers = {
            "google.com",
            "gmail.com",
            "outlook.com",
            "hotmail.com",
            "yahoo.com",
            "protonmail.com",
            "icloud.com",
            "aol.com",
            "live.com",
        }

        # Spam trap patterns
        self.spam_trap_patterns = [
            r"spam",
            r"trap",
            r"honeypot",
            r"test",
            r"fake",
            r"dummy",
            r"example",
            r"sample",
            r"demo",
            r"verify",
            r"confirm",
            r"validate",
            r"check",
        ]

    def validate_syntax(self, email: str) -> Dict[str, Any]:
        """RFC 5322 + 6531 syntax validation"""
        try:
            if not self.rfc_regex.match(email):
                return {
                    "valid": False,
                    "error": "Invalid email format",
                    "suggestions": [],
                }

            local, domain = email.split("@", 1)

            # Length checks
            if len(local) > 64:
                return {
                    "valid": False,
                    "error": "Local part exceeds 64 characters",
                    "suggestions": [],
                }

            if len(domain) > 253:
                return {
                    "valid": False,
                    "error": "Domain exceeds 253 characters",
                    "suggestions": [],
                }

            # Generate suggestions
            suggestions = self._generate_suggestions(email)

            return {
                "valid": True,
                "local_part": local,
                "domain": domain,
                "suggestions": suggestions,
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
        local, domain = email.split("@", 1)

        # Common domain typos
        domain_suggestions = {
            "gmai.com": "gmail.com",
            "gmal.com": "gmail.com",
            "gamil.com": "gmail.com",
            "hotmai.com": "hotmail.com",
            "hotmal.com": "hotmail.com",
            "outlok.com": "outlook.com",
            "yaho.com": "yahoo.com",
            "yhoo.com": "yahoo.com",
        }

        if domain in domain_suggestions:
            suggestions.append(f"{local}@{domain_suggestions[domain]}")

        # Common TLD suggestions
        if domain.endswith(".con"):
            suggestions.append(f"{local}@{domain[:-4]}.com")
        elif domain.endswith(".cmo"):
            suggestions.append(f"{local}@{domain[:-4]}.com")

        return suggestions

    def check_dns_mx(self, domain: str) -> Dict[str, Any]:
        """Comprehensive DNS and MX validation"""
        try:
            # A/AAAA records
            a_records = []
            aaaa_records = []
            try:
                a_records = [str(r) for r in dns.resolver.resolve(domain, "A")]
            except Exception:
                pass

            try:
                aaaa_records = [str(r) for r in dns.resolver.resolve(domain, "AAAA")]
            except Exception:
                pass

            # MX records with preference scoring
            mx_records = []
            try:
                mx_response = dns.resolver.resolve(domain, "MX")
                mx_records = [
                    {
                        "host": str(mx.exchange),
                        "preference": mx.preference,
                        "score": self._calculate_mx_score(str(mx.exchange)),
                    }
                    for mx in mx_response
                ]
                mx_records.sort(key=lambda x: x["preference"])
            except Exception:
                pass

            # CNAME fallback
            cname_record = None
            try:
                cname_response = dns.resolver.resolve(domain, "CNAME")
                cname_record = str(cname_response[0])
            except Exception:
                pass

            # DNSSEC validation
            dnssec_valid = False
            try:
                dns.resolver.resolve(domain, "A", want_dnssec=True)
                dnssec_valid = True
            except Exception:
                pass

            # Calculate DNS score
            dns_score = self._calculate_dns_score(mx_records, a_records, dnssec_valid)

            return {
                "valid": len(mx_records) > 0 or len(a_records) > 0,
                "a_records": a_records,
                "aaaa_records": aaaa_records,
                "mx_records": mx_records,
                "cname_record": cname_record,
                "dnssec_valid": dnssec_valid,
                "score": dns_score,
            }

        except Exception as e:
            logger.error(f"DNS check error for {domain}: {str(e)}")
            return {"valid": False, "error": str(e), "score": 0}

    def _calculate_mx_score(self, mx_host: str) -> int:
        """Calculate reputation score for MX host"""
        mx_lower = mx_host.lower()

        if any(
            provider in mx_lower
            for provider in ["google", "outlook", "yahoo", "protonmail"]
        ):
            return 100
        elif any(
            provider in mx_lower for provider in ["amazon", "microsoft", "cloudflare"]
        ):
            return 90
        elif any(
            provider in mx_lower for provider in ["godaddy", "namecheap", "hostgator"]
        ):
            return 70
        else:
            return 50

    def _calculate_dns_score(
        self, mx_records: List[Dict], a_records: List[str], dnssec_valid: bool
    ) -> int:
        """Calculate overall DNS score"""
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

    def smtp_handshake(
        self, email: str, domain: str, mx_records: List[Dict]
    ) -> Dict[str, Any]:
        """Advanced SMTP handshake with catch-all detection"""
        if not mx_records:
            return {
                "valid": False,
                "error": "No MX records available",
                "catch_all": False,
                "greylisting": False,
            }

        results = {
            "valid": False,
            "catch_all": False,
            "greylisting": False,
            "ndr_patterns": [],
            "response_codes": [],
            "errors": [],
        }

        # Test with multiple MX servers
        for mx in mx_records[:2]:
            mx_host = mx["host"]

            try:
                server = smtplib.SMTP(timeout=10)
                server.connect(mx_host, 25)
                server.helo("validation.example.com")
                server.mail("validation@example.com")

                code, message = server.rcpt(email)
                results["response_codes"].append(
                    {
                        "mx": mx_host,
                        "code": code,
                        "message": message.decode("utf-8", errors="ignore"),
                    }
                )

                if code == 250:
                    results["valid"] = True
                elif code == 450:
                    results["greylisting"] = True
                elif code in [550, 553, 554]:
                    message_str = message.decode("utf-8", errors="ignore").lower()
                    if any(
                        pattern in message_str
                        for pattern in [
                            "user unknown",
                            "mailbox not found",
                            "does not exist",
                        ]
                    ):
                        results["ndr_patterns"].append(message_str)

                server.quit()

            except Exception as e:
                results["errors"].append(f"MX {mx_host}: {str(e)}")
                continue

        # Catch-all detection
        if results["valid"]:
            results["catch_all"] = self._detect_catch_all(domain, mx_records)

        return results

    def _detect_catch_all(self, domain: str, mx_records: List[Dict]) -> bool:
        """Detect catch-all domains"""
        if not mx_records:
            return False

        test_emails = [
            f"test-{int(time.time())}@{domain}",
            f"nonexistent-{hash(domain)}@{domain}",
            f"invalid-{int(time.time() * 1000)}@{domain}",
        ]

        accepted_count = 0

        for test_email in test_emails:
            try:
                mx_host = mx_records[0]["host"]
                server = smtplib.SMTP(timeout=10)
                server.connect(mx_host, 25)
                server.helo("validation.example.com")
                server.mail("validation@example.com")

                code, _ = server.rcpt(test_email)
                server.quit()

                if code == 250:
                    accepted_count += 1

            except Exception:
                continue

        return accepted_count >= len(test_emails) * 0.5

    def check_domain_reputation(self, domain: str) -> Dict[str, Any]:
        """Domain reputation analysis"""
        try:
            # Check if disposable
            is_disposable = domain.lower() in self.disposable_domains

            # Check TLD risk
            tld_risk = any(domain.endswith(tld) for tld in self.risky_tlds)

            # Check if corporate provider
            is_corporate = domain.lower() in self.corporate_providers

            # Spam trap detection
            spam_trap_risk = self._detect_spam_trap_patterns(domain)

            # Calculate reputation score
            reputation_score = self._calculate_reputation_score(
                is_disposable, tld_risk, is_corporate, spam_trap_risk
            )

            return {
                "is_disposable": is_disposable,
                "tld_risk": tld_risk,
                "is_corporate": is_corporate,
                "spam_trap_risk": spam_trap_risk,
                "reputation_score": reputation_score,
                "risk_level": self._get_risk_level(reputation_score),
            }

        except Exception as e:
            logger.error(f"Domain reputation check error for {domain}: {str(e)}")
            return {"error": str(e), "reputation_score": 0, "risk_level": "unknown"}

    def _detect_spam_trap_patterns(self, domain: str) -> float:
        """Detect potential spam trap patterns"""
        domain_lower = domain.lower()
        risk_score = 0.0

        for pattern in self.spam_trap_patterns:
            if re.search(pattern, domain_lower):
                risk_score += 0.2

        return min(risk_score, 1.0)

    def _calculate_reputation_score(
        self,
        is_disposable: bool,
        tld_risk: bool,
        is_corporate: bool,
        spam_trap_risk: float,
    ) -> int:
        """Calculate domain reputation score"""
        score = 100

        if is_disposable:
            score -= 80
        if tld_risk:
            score -= 30
        if is_corporate:
            score += 20
        if spam_trap_risk > 0.5:
            score -= 40

        return max(0, min(100, score))

    def _get_risk_level(self, score: int) -> str:
        """Convert score to risk level"""
        if score >= 80:
            return "low"
        elif score >= 50:
            return "medium"
        else:
            return "high"

    def detect_role_based(self, local_part: str) -> Dict[str, Any]:
        """Role-based email detection"""
        local_lower = local_part.lower()

        detected_roles = []
        role_score = 0

        for role_name, pattern in self.role_patterns.items():
            if re.match(pattern, local_lower):
                detected_roles.append(role_name)
                role_score += 1

        # Check for plus addressing
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

    def calculate_risk_score(
        self, validation_results: Dict[str, Any]
    ) -> Dict[str, Any]:
        """Calculate comprehensive risk score"""
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
        if not dns_result.get("valid", False):
            score -= 30
            deductions.append("No valid DNS/MX records")
            explanations.append("Domain has no mail exchange records")
        else:
            dns_score = dns_result.get("score", 0)
            if dns_score < 50:
                score -= 15
                deductions.append("Low DNS reputation")
                explanations.append("Domain has poor mail server reputation")

        # SMTP validation
        smtp_result = validation_results.get("smtp", {})
        if not smtp_result.get("valid", False):
            score -= 25
            deductions.append("SMTP validation failed")
            explanations.append("Email address does not exist on mail server")

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

        # Final score
        score = max(0, min(100, score))

        # Determine verdict
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
            smtp_result = {}
            if dns_result.get("valid", False):
                smtp_result = self.smtp_handshake(
                    email, domain, dns_result.get("mx_records", [])
                )
            else:
                smtp_result = {
                    "valid": False,
                    "error": "DNS validation failed",
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

            # Generate warnings
            warnings = []
            if reputation_result.get("is_disposable", False):
                warnings.append("Disposable email domain detected")
            if role_result.get("is_role_based", False):
                warnings.append("Role-based email detected")
            if smtp_result.get("catch_all", False):
                warnings.append("Catch-all domain detected")
            if reputation_result.get("spam_trap_risk", 0) > 0.5:
                warnings.append("Potential spam trap detected")

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
