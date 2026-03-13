# ScrubiMail Repository Assessment

**Date:** 2026-03-13
**Assessed by:** Claude Code

---

## Overview

ScrubiMail is an **email validation SaaS platform** with a REST API and dual dashboards (user + admin) for validating single emails in real-time and processing bulk email lists. It is structured as a monorepo with three major components:

| Component | Stack | Location |
|-----------|-------|----------|
| Backend API | Python, Django 4.2, DRF, Celery, Redis, PostgreSQL | `ScrubiMail-BE/` |
| User Dashboard | TypeScript, React 18, Vite, Chakra UI, Mantine, Redux | `Scrubimail-FE/` |
| Admin Dashboard | TypeScript, React 18, Vite, Chakra UI, Mantine, Redux | `Scrubimail-Admin-FE/` |

**Core features:** Email validation engine (DNS/SMTP/reputation scoring), bulk processing via Celery, JWT + API key auth, TOTP 2FA, Stripe/Paystack billing, rate limiting, analytics dashboard.

---

## Scorecard

| Category | Score | Summary |
|----------|-------|---------|
| Code Organization | 7/10 | Good Django app separation and React service layers; some duplication between FE and Admin-FE |
| Error Handling | 5/10 | Fragile HTML-parsing in error handlers, 100+ console.logs in FE, generic catch blocks |
| Security | 4/10 | Hardcoded DB password, DEBUG=True, ALLOWED_HOSTS=*, tokens in plain localStorage |
| Type Safety | 7/10 | TypeScript strict mode enabled, but 144+ `any` type usages across frontend |
| Linting & Formatting | 4/10 | Prettier configured; no ESLint, no Python linter config, no pre-commit hooks |
| Testing | 2/10 | pytest and @testing-library installed but virtually no test implementations |
| Documentation | 5/10 | Good setup READMEs and feature guides; minimal inline docs, no API spec (Swagger/OpenAPI) |
| Git Health | 4/10 | node_modules committed (2,187 files), no root .gitignore, no CI/CD, 10MB+ images tracked |

**Overall: 4.75 / 10** — Good foundational architecture, but significant gaps in security, testing, and repository hygiene that must be addressed before production deployment.

---

## Critical Issues (Immediate Action Required)

### 1. Hardcoded Database Password in `settings.py`
- **File:** `ScrubiMail-BE/backend/settings.py` ~line 209
- **Issue:** `"PASSWORD": "@Toshib123"` is hardcoded directly in settings
- **Fix:** Move to environment variable: `os.environ.get("DB_PASSWORD")`

### 2. DEBUG Mode Enabled
- **File:** `ScrubiMail-BE/backend/settings.py` ~line 119
- **Issue:** `DEBUG = True` should never be on in production
- **Fix:** `DEBUG = os.environ.get("DEBUG", "False").lower() == "true"`

### 3. Overly Permissive ALLOWED_HOSTS
- **File:** `ScrubiMail-BE/backend/settings.py`
- **Issue:** `ALLOWED_HOSTS = ["*"]` accepts requests from any domain
- **Fix:** Restrict to actual deployment domains

### 4. node_modules Committed to Git (2,187 files)
- **Locations:** Root `node_modules/` (1,488 files), `ScrubiMail-BE/node_modules/` (699 files)
- **Impact:** Massive repo bloat, slow clones, potential merge conflicts
- **Fix:** Add root `.gitignore`, run `git rm -r --cached node_modules/ ScrubiMail-BE/node_modules/`

### 5. No Root-Level .gitignore
- **Impact:** Dependencies and build artifacts can be accidentally committed
- **Fix:** Create a comprehensive `.gitignore` at the repo root

---

## High Priority Issues

### 6. No Test Coverage
- Backend: `apps/*/tests.py` files are mostly empty stubs
- Frontend: Testing libraries installed but no test files exist
- **Risk:** No safety net for regressions

### 7. No CI/CD Pipeline
- No `.github/workflows/`, `.gitlab-ci.yml`, or equivalent
- Only a manual `deploy-frontends.sh` script exists
- **Risk:** No automated quality gates

### 8. Fragile Error Handling in Frontend
- `authSlice.ts` parses HTML error responses with DOMParser (line ~92-96)
- 100+ `console.log` statements across the frontend without production filtering
- Generic "An error occurred" messages throughout

### 9. Sensitive Data in localStorage
- JWT tokens, device IDs, and user roles stored in plain `localStorage`
- 39+ `localStorage` accesses without any encryption
- **Risk:** XSS attacks can exfiltrate auth tokens

### 10. Missing ESLint Configuration
- No TypeScript linting rules configured
- Python linting tools (flake8, black) are in requirements but not configured
- No pre-commit hooks to enforce standards

---

## Medium Priority Issues

### 11. Oversized Source Files
- `Authentication/views.py`: 1,269 lines — too many responsibilities
- `advanced_validator.py`: 670 lines — could benefit from extraction

### 12. Excessive `any` Types (144+ instances)
- `authSlice.ts` line 8: `user: any | null` — should be properly typed
- Undermines TypeScript's strict mode benefits

### 13. Large Binary Assets in Git
- `life-insurance-concept-with-money.jpg`: 10.3 MB
- `scrubi.png`: 2.8 MB
- Should use external asset hosting or Git LFS

### 14. Service Layer Duplication
- Similar API services duplicated between `Scrubimail-FE/` and `Scrubimail-Admin-FE/`
- No shared package or library between the two frontends

### 15. Branch Name Mismatch
- Local default branch: `master`
- Remote default branch: `main`
- Can cause confusion during development

---

## Low Priority Issues

### 16. Commit Message Quality
- Conventional commit prefixes used but sometimes misclassified (`feat:` for typo fixes, `fix:` for README updates)
- Sequential small commits for the same change should be squashed

### 17. Missing API Documentation
- DRF supports Swagger/OpenAPI generation but it's not configured
- No formal API specification exists

### 18. Multiple UI Libraries
- Chakra UI, Mantine, and Ant Design all used simultaneously
- Increases bundle size and creates inconsistent UX patterns

### 19. TODO Comments in Code
- 5+ TODO comments found in production code (e.g., "TODO: Implement date filtering" in History.tsx)

---

## Recommendations Summary

| Priority | Action | Effort |
|----------|--------|--------|
| **Critical** | Remove hardcoded DB password from settings.py | 10 min |
| **Critical** | Set DEBUG=False for production | 10 min |
| **Critical** | Restrict ALLOWED_HOSTS | 10 min |
| **Critical** | Remove node_modules from git, add root .gitignore | 30 min |
| **High** | Write unit tests for core validation and auth flows | 2-3 days |
| **High** | Set up GitHub Actions CI pipeline (lint + test) | 1 day |
| **High** | Fix error handling patterns in frontend | 1 day |
| **High** | Move sensitive data from localStorage to httpOnly cookies | 1 day |
| **High** | Configure ESLint for TypeScript + flake8/black for Python | 2 hours |
| **Medium** | Refactor oversized files (views.py, advanced_validator.py) | 1-2 days |
| **Medium** | Replace `any` types with proper interfaces | 1 day |
| **Medium** | Extract shared frontend services into a common package | 1 day |
| **Low** | Standardize on one UI component library | 3-5 days |
| **Low** | Add Swagger/OpenAPI for API documentation | 1 day |
| **Low** | Set up Git LFS or external hosting for large assets | 2 hours |

---

## Architecture Diagram

```
                    ┌─────────────────────────────────────┐
                    │           Load Balancer              │
                    └──────┬──────────────┬───────────────┘
                           │              │
              ┌────────────▼──┐    ┌──────▼────────────┐
              │  Scrubimail-FE│    │ Scrubimail-Admin-FE│
              │  (React/Vite) │    │   (React/Vite)     │
              └────────┬──────┘    └──────┬─────────────┘
                       │                  │
                       └──────┬───────────┘
                              │ REST API
                    ┌─────────▼──────────┐
                    │   ScrubiMail-BE    │
                    │  (Django / DRF)    │
                    ├────────────────────┤
                    │ Apps:              │
                    │ • Authentication   │
                    │ • Validation       │
                    │ • Billing          │
                    │ • API Keys         │
                    │ • Plans            │
                    │ • Admin            │
                    └──┬──────┬──────┬───┘
                       │      │      │
              ┌────────▼┐  ┌──▼───┐ ┌▼──────────┐
              │PostgreSQL│  │Redis │ │  Celery   │
              │   (DB)   │  │(Cache│ │ (Workers) │
              └──────────┘  │Queue)│ └───────────┘
                            └──────┘
```

---

*This assessment was auto-generated. All findings should be validated by the development team before taking action.*
