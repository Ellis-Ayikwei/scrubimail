# ScrubiMail Backend - Critical Setup Issues & Fixes

## 🚨 CURRENT STATUS: System Will NOT Work - Critical Issues Found

After thorough analysis, the billing system has **5 critical blocking issues** that will prevent it from running.

---

## ❌ Critical Issues Identified

### 1. **Missing Environment Variables** ⛔ BLOCKING
**Issue**: Required environment variables are not configured
- `SECRET_KEY` is empty → Django refuses to start
- Email settings are `None` → Notification system crashes
- Paystack keys missing → Payment processing fails

**Impact**: Application won't start at all

**Fix**: Create `.env` file with required values (see below)

---

### 2. **Missing Import Statement** ⛔ BLOCKING  
**Issue**: `apps/billing/models.py` uses `timedelta` without importing it
- Line 219: `future_date = now + timezone.timedelta(days=days)`
- Should be: `future_date = now + timedelta(days=days)`

**Impact**: Runtime error when calling `get_expiring_credits()`

**Status**: ✅ FIXED (added `from datetime import timedelta`)

---

### 3. **Missing Database Migrations** ⛔ BLOCKING
**Issue**: 9 new models added but database tables don't exist
- CreditPackage
- CreditPackagePurchase  
- PromoCode
- PromoCodeRedemption
- Invoice
- InvoiceLineItem
- Plus new fields on BillingProfile and CreditTransaction

**Impact**: All new endpoints return database errors

**Fix**: Run migrations (see below)

---

### 4. **Missing Metadata Field** ⛔ BLOCKING
**Issue**: Usage alerts store state in `billing_profile.metadata` but field doesn't exist
- `notifications.py` tries to read/write `metadata` JSON field
- BillingProfile model missing `metadata = models.JSONField(default=dict, blank=True)`

**Impact**: Usage alerts crash when trying to track sent notifications

**Status**: ✅ FIXED (added metadata field to BillingProfile)

---

### 5. **Missing Email Templates** ⚠️ RUNTIME ERROR
**Issue**: Email notifications reference 6 templates that don't exist
- `templates/emails/usage_alert_50.html`
- `templates/emails/usage_alert_75.html`
- `templates/emails/usage_alert_90.html`
- `templates/emails/usage_alert_100.html`
- `templates/emails/low_credits_warning.html`
- `templates/emails/expiring_credits_notification.html`

**Impact**: Email sending crashes with "TemplateDoesNotExist" error

**Fix**: Create email templates (see below)

---

## ✅ Required Setup Steps (IN ORDER)

### Step 1: Create Environment File

```bash
cd /workspaces/scrubimail/ScrubiMail-BE
cp .env.example .env
```

**Edit `.env` and set these REQUIRED values**:
```bash
# Minimum required for Django to start
DJANGO_SECRET_KEY="your-long-random-secret-key-at-least-50-chars"

# Required for email notifications
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_HOST_USER=your-email@gmail.com
EMAIL_HOST_PASSWORD=your-app-password  # Get from Gmail App Passwords
DEFAULT_FROM_EMAIL=noreply@scrubimail.com

# Required for payments
PAYSTACK_SECRET_KEY=sk_test_xxxxxxxxxxxxx
PAYSTACK_PUBLIC_KEY=pk_test_xxxxxxxxxxxxx
PAYSTACK_WEBHOOK_SECRET=your_webhook_secret

# Frontend URL for email links
FRONTEND_URL=http://localhost:5173
```

**Quick SECRET_KEY generation**:
```bash
python -c 'from django.core.management.utils import get_random_secret_key; print(get_random_secret_key())'
```

---

### Step 2: Run Database Migrations

```bash
cd /workspaces/scrubimail/ScrubiMail-BE

# Create migrations for new models
python manage.py makemigrations billing

# Review what will be migrated
python manage.py showmigrations billing

# Apply migrations
python manage.py migrate

# Verify tables were created
python manage.py dbshell
\dt billing*  # PostgreSQL
.tables       # SQLite
```

**Expected Output**: 9 new tables created
- billing_creditpackage
- billing_creditpackagepurchase
- billing_promocode
- billing_promocoderedemption
- billing_invoice
- billing_invoicelineitem
- Plus schema updates to billing_billingprofile and billing_credittransaction

---

### Step 3: Initialize Default Data

```bash
# Create default pricing plans (Free, Starter, Pro, Enterprise)
python manage.py setup_plans

# Create default credit packages (5 packages)
python manage.py setup_credit_packages

# Create default promo codes (6 codes)
python manage.py setup_promo_codes
```

**Verify**:
```bash
python manage.py shell
>>> from apps.plan.models import Plan
>>> Plan.objects.count()  # Should be 4
>>> from apps.billing.models import CreditPackage
>>> CreditPackage.objects.count()  # Should be 5
```

---

### Step 4: Create Email Templates Directory

```bash
mkdir -p /workspaces/scrubimail/ScrubiMail-BE/templates/emails
cd /workspaces/scrubimail/ScrubiMail-BE/templates/emails
```

**Create minimal templates** (or I can generate full HTML versions):

`usage_alert_50.html`:
```html
<h2>📈 You're halfway through your credits</h2>
<p>Hi {{ user_name }},</p>
<p>You've used {{ usage_percentage }}% of your {{ plan_name }} plan credits.</p>
<p>Credits remaining: <strong>{{ credits_remaining }}</strong></p>
<p><a href="{{ frontend_url }}/billing">Manage Credits</a></p>
```

Similar templates needed for: 75%, 90%, 100%, low_credits_warning, expiring_credits_notification.

---

### Step 5: Update Django Settings

**Add to `backend/settings.py`**:

```python
# Email Configuration
EMAIL_BACKEND = os.getenv('EMAIL_BACKEND', 'django.core.mail.backends.smtp.EmailBackend')
EMAIL_HOST = os.getenv('EMAIL_HOST')
EMAIL_PORT = int(os.getenv('EMAIL_PORT', 587))
EMAIL_USE_TLS = os.getenv('EMAIL_USE_TLS', 'True') == 'True'
EMAIL_HOST_USER = os.getenv('EMAIL_HOST_USER')
EMAIL_HOST_PASSWORD = os.getenv('EMAIL_HOST_PASSWORD')
DEFAULT_FROM_EMAIL = os.getenv('DEFAULT_FROM_EMAIL', 'noreply@scrubimail.com')

# Paystack Configuration
PAYSTACK_SECRET_KEY = os.getenv('PAYSTACK_SECRET_KEY')
PAYSTACK_PUBLIC_KEY = os.getenv('PAYSTACK_PUBLIC_KEY')
PAYSTACK_WEBHOOK_SECRET = os.getenv('PAYSTACK_WEBHOOK_SECRET')

# Frontend URL
FRONTEND_URL = os.getenv('FRONTEND_URL', 'http://localhost:5173')

# Media files for invoices
MEDIA_ROOT = os.path.join(BASE_DIR, 'media')
MEDIA_URL = '/media/'

# Templates
TEMPLATES = [
    {
        'BACKEND': 'django.template.backends.django.DjangoTemplates',
        'DIRS': [os.path.join(BASE_DIR, 'templates')],  # Add this
        # ... rest of config
    },
]
```

---

### Step 6: Setup Cron Jobs (Production)

```bash
# Edit crontab
crontab -e

# Add these lines
# Check usage alerts hourly
0 * * * * cd /workspaces/scrubimail/ScrubiMail-BE && /usr/bin/python manage.py check_usage_alerts >> /var/log/scrubimail/alerts.log 2>&1

# Expire old credits daily at 2 AM
0 2 * * * cd /workspaces/scrubimail/ScrubiMail-BE && /usr/bin/python manage.py expire_credits >> /var/log/scrubimail/expire.log 2>&1

# End expired trials daily at 3 AM
0 3 * * * cd /workspaces/scrubimail/ScrubiMail-BE && /usr/bin/python manage.py end_expired_trials >> /var/log/scrubimail/trials.log 2>&1
```

---

## 🧪 Testing Checklist

### Test 1: Environment Variables
```bash
python manage.py check
# Should show no errors
```

### Test 2: Database
```bash
python manage.py migrate --plan
# Should show all migrations
```

### Test 3: Management Commands
```bash
python manage.py setup_plans
python manage.py setup_credit_packages --dry-run
python manage.py check_usage_alerts --dry-run
```

### Test 4: API Endpoints
```bash
# Get plans
curl http://localhost:8000/api/plans/

# Get credit packages
curl http://localhost:8000/api/billing/credit-packages/
```

### Test 5: Email Sending
```bash
python manage.py shell
>>> from django.core.mail import send_mail
>>> send_mail('Test', 'Body', 'from@example.com', ['to@example.com'])
# Should return 1 (success)
```

---

## ⚠️ Additional Issues to Address

### Non-Critical But Important:

1. **No error handling for missing Paystack credentials**
   - `services.py` will crash if keys are None
   - Should validate in `__init__` or settings

2. **Invoice number collisions possible**
   - Format: `INV-YYYYMMDD-XXXX` (last 4 digits of timestamp)
   - Low probability but possible with concurrent requests
   - Consider using UUID or database sequence

3. **No database indexes on frequently queried fields**
   - `CreditTransaction.expiry_date` (queried often)
   - `PromoCode.code` (searched frequently)
   - `Invoice.invoice_number` (looked up often)
   - Add indexes in migrations

4. **No rate limiting on expensive operations**
   - Invoice PDF generation (CPU intensive)
   - Bulk promo code validation
   - Should add throttling

5. **Email sending is synchronous**
   - Will block API responses
   - Should use Celery for async email sending
   - Already have Celery configured, just need to create tasks

6. **No webhook replay attack prevention**
   - Current implementation verifies signature but doesn't check timestamp
   - Paystack webhooks can be replayed
   - Should store processed webhook IDs

7. **Credit expiration grace period hardcoded**
   - 7 days warning in multiple places
   - Should be a setting or per-package configuration

---

## 🎯 Summary

**To make system work NOW:**
1. ✅ Fix imports (DONE)
2. ✅ Add metadata field (DONE)
3. ⏳ Create `.env` file with required variables
4. ⏳ Run database migrations
5. ⏳ Create email templates (or disable email for testing)
6. ⏳ Run setup commands

**After that:**
- System will work but emails might fail if templates incomplete
- Payment webhooks will work if Paystack credentials valid
- API endpoints will be functional
- Credit system operational

**Recommended before production:**
- Add database indexes
- Move email sending to Celery
- Add webhook replay prevention
- Create proper HTML email templates
- Add comprehensive logging
- Setup monitoring (Sentry already configured)

---

## 📝 Quick Start Script

```bash
#!/bin/bash
# Quick setup script - run this after creating .env file

cd /workspaces/scrubimail/ScrubiMail-BE

# Install dependencies
pip install -r requirements.txt

# Run migrations
python manage.py migrate

# Create default data
python manage.py setup_plans
python manage.py setup_credit_packages
python manage.py setup_promo_codes

# Create superuser
python manage.py createsuperuser

# Run development server
python manage.py runserver 0.0.0.0:8000
```

---

**Status After Fixes Applied**:
- ✅ Import errors fixed
- ✅ Missing model field added  
- ✅ Environment template created
- ⏳ Database migrations pending
- ⏳ Email templates pending
- ⏳ Environment variables need configuration

**Will it work?** Not yet - needs environment variables and migrations. After those: **95% functional** (email templates can be added incrementally).
