# ScrubiMail — System Analysis

## What Is ScrubiMail?

ScrubiMail is a **B2B email validation SaaS platform**. Its core job is to tell users whether an email address is real, deliverable, and safe to send to — before they send anything. It does this by running multi-layer checks: syntax, DNS, live SMTP handshake, domain reputation, and role-account detection. Results come back with a 0–100 confidence score, a pass/fail verdict, and human-readable suggestions.

The platform has three separately deployable components:

| Component | Location | Purpose |
|---|---|---|
| **Backend API** | `ScrubiMail-BE/` | Django + DRF, validation engine, billing, auth |
| **Customer Portal** | `Scrubimail-FE/` | React app for end users |
| **Admin Dashboard** | `Scrubimail-Admin-FE/` | React app for operators/superadmins |

---

## Tech Stack

### Backend
- **Python 3 / Django 5.1 / Django REST Framework**
- **PostgreSQL** (primary database)
- **Redis + Celery** (async task queue — bulk validation, background jobs)
- **JWT authentication** via custom middleware, plus optional **API Key** auth
- **Paystack** for subscription billing and one-time credit purchases
- **OAuth 2.0** (GitHub, GitLab, Google) for SSO login

### Frontends (both)
- **React 18 + TypeScript + Vite**
- **Redux Toolkit** for state management
- **Ant Design** (admin FE) + **Chakra UI / Mantine** (customer FE)
- **Axios** with request/response interceptors for token injection and error normalization
- **react-auth-kit** for cookie-based JWT session management

---

## System Architecture

```
                       ┌─────────────────────────────────────┐
                       │          ScrubiMail Backend           │
                       │  (Django REST Framework + PostgreSQL) │
                       │                                       │
  Customer Portal ────▶│  /auth/  /validation/  /billing/     │
  Admin Dashboard ────▶│  /admin/ /apikey/  /plans/            │
  External API  ──────▶│  (API Key auth header)                │
                       └───────────────┬─────────────────────┘
                                       │
                            ┌──────────▼──────────┐
                            │  Celery + Redis      │
                            │  (Async job queue)   │
                            │  Bulk validation     │
                            │  Credit resets       │
                            └─────────────────────┘
```

---

## Core Features

### 1. Email Validation Engine

The heart of the product. Every validation runs through a pipeline of checks:

| Check | What it does | Weight |
|---|---|---|
| **Syntax** | RFC 5322 + IDN compliance | Low |
| **DNS** | Checks for MX/A records on the domain | Medium |
| **SMTP Handshake** | Opens a real connection to the mail server (`EHLO` → `MAIL FROM` → `RCPT TO`) | High |
| **Domain Reputation** | Disposable domain detection, spam trap risk, corporate vs consumer | Medium |
| **Role-Based Detection** | Flags `admin@`, `info@`, `support@`, `noreply@` accounts | Low |

**Result object** contains:
- `score` (0–100)
- `verdict`: Valid / Risky / Invalid / HighRisk
- `breakdown`: per-check pass/fail
- `suggestions`: e.g., "Did you mean gmail.com?"
- `warnings`: e.g., "Disposable domain", "Role-based address"

**Two modes:**
- **Real-time** — synchronous, result in ~300ms, uses 1 credit
- **Async** — fires a Celery task, returns a `job_id`, client polls for progress

### 2. Bulk Validation

Users can upload a CSV or paste a list of emails. A `BulkValidationJob` is created, processed asynchronously via Celery workers, and tracked with a progress percentage. Results are downloadable when complete.

### 3. Credit System

ScrubiMail is credit-based. Each validation costs 1 credit.

- Plans include a monthly credit allocation (resets on billing cycle)
- Users can buy extra credit packages (one-time purchases via Paystack)
- Credits have optional expiry dates
- `BillingProfile` is the single source of truth: `credits_remaining`, `credits_used_this_month`, `billing_status`

### 4. Subscription Plans

Defined in the `Plan` model:

| Field | Meaning |
|---|---|
| `price` / `yearly_price` | Monthly and annual pricing |
| `credits_per_month` | Included credits |
| `max_api_calls_per_hour` | Rate limit |
| `supports_api` / `supports_bulk` | Feature flags per tier |
| `trial_days` | Free trial length |
| `paystack_plan_code` | Links to Paystack recurring subscription |

Subscription states: `active`, `trialing`, `past_due`, `canceled`, `unpaid`, `suspended`

### 5. Authentication & Security

- **JWT**: Short-lived access token + longer-lived refresh token, both stored in `HttpOnly` cookies
- **API Keys**: Alternative auth method for programmatic access. Generated per user, tracked with usage stats and rate limits. Keys show as masked in the UI (`****...****`)
- **TOTP 2FA**: Time-based OTP via authenticator apps (Google Authenticator, Authy). Backup codes are generated on setup
- **Trusted Devices**: "Remember this device" functionality — stores device fingerprints to skip 2FA on known devices
- **OAuth SSO**: GitHub, GitLab, Google sign-in flows via backend redirects

### 6. Admin Operations

The admin backend app exposes:
- **User management**: list, create, update, delete, suspend users
- **Billing oversight**: revenue dashboard, transaction logs, invoice generation
- **Plan management**: create/edit/delete subscription plans
- **Credit packages**: define purchasable credit bundles with pricing
- **Promo codes**: create discount codes redeemable at checkout
- **Validation monitoring**: system-wide validation statistics
- **API key oversight**: view/revoke any user's API keys
- **Usage alerts**: configure thresholds that notify users when credits are low

---

## Data Models (Key Relationships)

```
User (UUID PK)
  │
  ├── BillingProfile (OneToOne)
  │     ├── current_plan → Plan
  │     ├── credits_remaining
  │     ├── billing_status
  │     └── paystack_* fields
  │
  ├── APIKey (ForeignKey, many)
  │
  ├── TOTPDevice (OneToOne)
  │     └── backup_codes[]
  │
  ├── TrustedDevice (ForeignKey, many)
  │
  └── EmailValidation (ForeignKey, many)
        ├── score (0–100)
        ├── status (pending → processing → completed)
        ├── breakdown (JSON)
        └── job_type (single | bulk | api)

BulkValidationJob
  ├── user → User
  ├── status / progress
  └── results_summary (JSON)

CreditTransaction
  ├── billing_profile → BillingProfile
  ├── transaction_type (purchase | usage | refund)
  └── amount / expiry_date

DomainReputation (cache table)
  ├── domain (unique)
  ├── reputation_score
  ├── is_disposable / spam_trap_risk
  └── last_checked (TTL: 24h)
```

---

## API Surface

### Auth
```
POST  /auth/register/
POST  /auth/login/
POST  /auth/logout/
POST  /auth/refresh_token/
GET   /auth/me/
POST  /auth/change_password/
GET   /auth/oauth/{provider}/login/
GET   /auth/oauth/{provider}/callback/
POST  /auth/totp/setup/
POST  /auth/totp/enable/
POST  /auth/totp/disable/
POST  /auth/totp/verify-backup-code/
```

### Validation
```
POST  /validation/validate/                  # single email
POST  /validation/validate-bulk/             # bulk job
GET   /validation/bulk-status/{job_id}/      # poll bulk progress
GET   /validation/status/{id}/               # single result
GET   /validation/history/                   # paginated history
GET   /validation/analytics/                 # 30-day stats
GET   /validation/domain-reputation/{domain}/
```

### Billing
```
GET   /billing/profile/
POST  /billing/purchase-credits/
GET   /billing/transactions/
GET   /billing/analytics/
GET   /billing/credit-packages/
POST  /billing/subscribe/
GET   /billing/invoices/
GET   /billing/invoices/{id}/pdf/
```

### API Keys
```
GET   /apikey/
POST  /apikey/
GET   /apikey/{id}/
PUT   /apikey/{id}/
DELETE /apikey/{id}/
```

### Admin (restricted to superadmin role)
```
GET/POST        /admin/users/
GET/PUT/DELETE  /admin/users/{id}/
GET             /admin/users/stats/
GET/POST        /admin/plans/
GET/PUT/DELETE  /admin/plans/{id}/
GET             /admin/plans/stats/
GET             /admin/billing/stats/
GET             /admin/validations/stats/
GET/POST        /admin/credit-packages/
GET/POST        /admin/promo-codes/
```

---

## User Journey

```
1. Register → email/password or OAuth SSO
2. Choose Plan → free trial or paid tier
3. Dashboard → see credits remaining, recent validations
4. Validate Email
      a. Paste single email → real-time result in ~300ms
      b. Upload CSV → async bulk job, poll for progress, download results
5. Run out of credits → buy a credit package via Paystack checkout
6. Integrate via API
      a. Generate API key in portal
      b. Send Authorization: Bearer <api_key> header
      c. Same validation endpoints, rate-limited by plan
7. Admin (operators only)
      a. Monitor users, revenue, validation volume
      b. Create/edit plans and credit packages
      c. Generate invoices, handle support
```

---

## Background Jobs (Celery)

| Task | Trigger | What it does |
|---|---|---|
| `validate_email_task` | Async validation request | Runs the full validation pipeline |
| `bulk_validate_emails_task` | Bulk job submission | Processes each email, updates progress% |
| `reset_monthly_credits` | Cron — billing cycle | Resets `credits_used_this_month`, adds new monthly credits |
| `update_domain_reputation` | Periodic | Refreshes domain reputation cache |
| `cleanup_old_validations` | Periodic | Purges old validation records past retention window |

---

## Permissions Model

| Role | Access |
|---|---|
| **Anonymous** | Public marketing pages only |
| **Authenticated User** | Validation, billing, API keys, profile |
| **Admin User** (`user_type = admin`) | All of the above + admin panel (users, plans, revenue, system settings) |

Two authentication methods accepted on protected routes:
- `Authorization: Bearer <jwt_token>` — standard session
- `Authorization: Api-Key <api_key>` — programmatic/integration access

---

## Changelog

All significant changes to the system, newest first.

---

### [2026-04-03] — Admin Theming, Plan Form, Error Handling

#### Fixed
- **Admin dark mode broken** (`Scrubimail-Admin-FE/src/main.tsx`)
  - `App.tsx` was never mounted — its `useEffect` that applies/removes the `dark` class on `document.documentElement` never ran
  - Fix: wrapped `<RouterProvider>` with `<App>` in `main.tsx`

- **Ant Design components ignored dark mode** (`Scrubimail-Admin-FE/src/App.tsx`)
  - Ant Design does not respond to CSS class-based dark mode; requires `ConfigProvider` with `theme.darkAlgorithm`
  - Fix: added `<ConfigProvider theme={{ algorithm: themeConfig.theme === 'dark' ? antTheme.darkAlgorithm : antTheme.defaultAlgorithm }}>` wrapping all children in `App.tsx`

- **Create/Edit Plan silently submitted wrong data** (`Scrubimail-Admin-FE/src/pages/admin/PlansManagement.tsx`)
  - `features` field is a textarea (newline-separated string) but the backend expects a `string[]` array — submitted raw string, backend rejected it
  - Fix: added `toFeaturesArray()` helper that splits on `\n`, trims, and filters blank lines before every POST/PUT

- **Plan form errors showed hardcoded strings** (`PlansManagement.tsx`)
  - `catch` blocks showed `'Failed to create plan'` regardless of what the server actually returned
  - Fix: changed all error handlers to `message.error(err.message || 'Failed to ...')` so actual server error propagates

---

### [2026-04-02] — Auth Error Handling, Admin UI Polish

#### Fixed
- **Login always showed "Network error. Please try again."** (`Scrubimail-FE/src/pages/auth/MultiStepLogin.tsx`)
  - Catch block had the string hardcoded regardless of server response
  - Fix: extract `err.response?.data?.detail || message || error` chain before falling back to generic string

- **`axiosInstance` crashed on network failure** (both FEs, `services/axiosInstance.tsx`)
  - `error.response.status` threw `TypeError` when server was unreachable (no response object)
  - Fix: added null guard `error.response?.status`

- **Redux auth reducer never showed real server errors** (both FEs, `store/authSlice.ts`)
  - `rejectWithValue(message)` stores the value in `action.payload`, but reducers were reading `action.error.message` (always `"Rejected"`)
  - Fix: changed reducer to `(action.payload as string) ?? action.error.message`

- **DOMParser used to extract JSON error messages** (`store/authSlice.ts`)
  - Auth error extraction was attempting to parse JSON error responses as HTML via `DOMParser` — completely wrong approach
  - Fix: removed entirely, replaced with `serverData?.detail || serverData?.message || serverData?.error` chain

- **`authAxiosInstance` errors lost the response object** (`services/authAxiosInstance.tsx`)
  - Normalized errors were thrown as plain `new Error(message)`, stripping `error.response` — callers couldn't inspect status code
  - Fix: attach `normalized.response = error.response` and `normalized.status = error.response?.status` before rejecting

- **Admin header theme toggle caused full page reload** (`Scrubimail-Admin-FE/src/components/admin/AdminHeader.tsx`)
  - `onClick` was calling `window.location.reload()` instead of dispatching Redux action
  - Fix: replaced with `dispatch(toggleTheme(newTheme))` + `localStorage.setItem`

#### Improved
- Admin header: added page title breadcrumb from current pathname, user badge with initials
- Admin sidebar: replaced generic "A" circle with actual logo image + "Scrubimail Admin" label
- Admin layout: content area background changed from `bg-white` to `bg-[#f5f6fa]`, padding normalized

---

### [2026-04-01] — Billing Service Expansion, Admin Type Fixes

#### Added
- **`billingService.ts` fully implemented** (`Scrubimail-FE/src/services/billingService.ts`)
  - Was 7 stub methods with no interfaces; expanded to 20+ methods
  - Added interfaces: `CreditPackage`, `CreditPackagePurchase`, `PromoCode`, `PromoCodeRedemption`, `Invoice`, `InvoiceLineItem`, `UsageAlert`, `ExpiringCreditsInfo`, `TrialStatus`, `RateLimitStatus`
  - Added methods: `getCreditPackages`, `purchaseCreditPackage`, `validatePromoCode`, `redeemPromoCode`, `getInvoices`, `downloadInvoicePDF`, `getTrialStatus`, `getExpiringCredits`, `getRateLimitStatus`, and more

- **`Billing.tsx` full feature set** (`Scrubimail-FE/src/pages/Billing.tsx`)
  - Was a placeholder; rebuilt with 3-tab layout: Overview, Buy Credits, Invoices
  - Trial banner (shows when `trialStatus.is_active`)
  - Expiring credits warning (shows when < 7 days remaining)
  - Credit packages grid with promo code input and Paystack redirect
  - Invoice table with per-row PDF download

#### Fixed
- **`CreditPackagesManagement.tsx` type error** (`Scrubimail-Admin-FE`)
  - `handleDelete(id: number)` — UUIDs are strings, not numbers
  - `p.id === Number(mostPopularId)` — comparison always failed for UUID PKs
  - Fix: changed to `string` type, removed `Number()` cast

- **Backend `LoginAPIView` always returned 401** (`ScrubiMail-BE/apps/Authentication/views.py`)
  - Field-level validation errors (missing email, blank password) were returned with 401 status — should be 400
  - Fix: check `serializer.errors` for field keys; return 400 for field errors, 401 only for wrong credentials

---

## What Is Missing / Known Gaps (as of analysis)

| Area | Gap |
|---|---|
| Admin theming | `App.tsx` was not mounted in `main.tsx` — dark mode class never applied. Fixed. |
| Ant Design dark mode | `ConfigProvider` with `darkAlgorithm` was missing. Fixed. |
| Plan create/edit | `features` textarea was not converted to array before POST. Fixed. |
| Auth error display | Server error messages were being swallowed, hardcoded strings shown instead. Fixed. |
| Billing analytics endpoint | `/admin/billing/stats/` — needs backend implementation confirmation |
| Validations stats endpoint | `/admin/validations/stats/` — needs backend implementation confirmation |
| Bulk download | Result file download endpoint not confirmed in backend routes |
| Email notifications | Notification preferences stored but email sending infrastructure not confirmed active |
| Paystack webhooks | Webhook handler exists but success/failure flows need end-to-end verification |
