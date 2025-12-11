# Credit Package Management Commands

## Overview

Django management commands for setting up and managing credit packages in ScrubiMail.

---

## 📦 Command: `setup_credit_packages`

Creates/updates predefined credit packages from free to enterprise tiers.

### Package Tiers

| Package | Credits | Price | Price/Credit | Expiry | Best For |
|---------|---------|-------|--------------|---------|----------|
| **Free Bonus Pack** | 50 | $0.00 | $0.00 | 30 days | Promotions, welcome credits |
| **Micro Pack** | 100 | $1.00 | $0.01 | 30 days | Testing, one-time use |
| **Starter Pack** | 1,000 | $7.50 | $0.0075 | 90 days | Small businesses |
| **Growth Pack** ⭐ | 5,000 | $30.00 | $0.006 | 120 days | Growing businesses |
| **Business Pack** 🏆 | 10,000 | $50.00 | $0.005 | 180 days | Established businesses |
| **Pro Pack** | 25,000 | $100.00 | $0.004 | 240 days | High volume |
| **Enterprise Pack** | 50,000 | $175.00 | $0.0035 | 365 days | Large enterprises |
| **Mega Pack** | 100,000 | $300.00 | $0.003 | 365 days | Massive scale |
| **Custom Pack** | Variable | Variable | Negotiable | 365 days | VIP clients |

⭐ = Most Popular | 🏆 = Best Value

### Usage

```bash
# Create/update all packages
python manage.py setup_credit_packages

# Clear existing packages first, then create
python manage.py setup_credit_packages --clear
```

### Features

- ✅ **9 tiers** from free to enterprise
- ✅ **Volume discounts** up to 70% off
- ✅ **Flexible expiry** (30-365 days)
- ✅ **Purchase limits** to prevent abuse
- ✅ **Metadata** for frontend display
- ✅ **Featured** flags for marketing

### Output Example

```
Setting up credit packages...

✓ Created: Free Bonus Pack       | 50 credits      | $   0.00 | $0.0000/credit | 30 days
✓ Created: Micro Pack             | 100 credits     | $   1.00 | $0.0100/credit | 30 days
✓ Created: Starter Pack           | 1,000 credits   | $   7.50 | $0.0075/credit | 90 days
✓ Created: Growth Pack            | 5,000 credits   | $  30.00 | $0.0060/credit | 120 days
✓ Created: Business Pack          | 10,000 credits  | $  50.00 | $0.0050/credit | 180 days
✓ Created: Pro Pack               | 25,000 credits  | $ 100.00 | $0.0040/credit | 240 days
✓ Created: Enterprise Pack        | 50,000 credits  | $ 175.00 | $0.0035/credit | 365 days
✓ Created: Mega Pack              | 100,000 credits | $ 300.00 | $0.0030/credit | 365 days
✓ Created: Custom Pack            | 500 credits     | $   5.00 | $0.0100/credit | 365 days

================================================================================

✓ Setup complete! Created 9 | Updated 0

Package Summary:
  Total active: 8
  Featured: 5
  Cheapest: $1.00 (Micro Pack - 100 credits)
  Best value: $0.003/credit (Mega Pack - 100,000 credits)
```

---

## 🎁 Command: `grant_credits`

Grant bonus credits to users for promotions, referrals, support, etc.

### Usage

#### Grant to Single User

```bash
# Grant 50 credits (default)
python manage.py grant_credits user@example.com

# Grant custom amount
python manage.py grant_credits user@example.com --credits 500

# Grant with custom reason
python manage.py grant_credits user@example.com \
    --credits 100 \
    --reason "Referral bonus"

# Grant without expiry (permanent)
python manage.py grant_credits user@example.com \
    --credits 200 \
    --expiry-days 0
```

#### Grant to Multiple Users

```bash
# Grant to ALL active users
python manage.py grant_credits --all \
    --credits 50 \
    --reason "Holiday promotion"

# Grant only to new users (last 7 days)
python manage.py grant_credits --new-users \
    --credits 100 \
    --reason "Welcome bonus" \
    --expiry-days 60
```

### Options

| Option | Type | Default | Description |
|--------|------|---------|-------------|
| `email` | string | - | User email address |
| `--credits` | int | 50 | Number of credits to grant |
| `--reason` | string | "Promotional bonus" | Reason for granting |
| `--expiry-days` | int | 30 | Days until expiry (0 = no expiry) |
| `--all` | flag | - | Grant to ALL active users |
| `--new-users` | flag | - | Grant only to users from last 7 days |

### Safety Features

- ✅ **Confirmation prompts** for bulk operations
- ✅ **Value estimation** before granting
- ✅ **Error handling** with detailed logs
- ✅ **Validation** for credit amounts

### Output Example

```bash
$ python manage.py grant_credits user@example.com --credits 100 --reason "Support compensation"

Granting credits...

✓ user@example.com | +100 credits (expires in 30 days)

================================================================================

✓ Successfully granted credits to 1 users

Total credits granted: 100
Estimated value: $1.00
Reason: Support compensation
Expiry: 30 days
```

### Bulk Operation Example

```bash
$ python manage.py grant_credits --new-users --credits 50

Targeting 45 new users (last 7 days)...

⚠️  About to grant 50 credits to 45 users (~$22.50 value). Continue? (yes/no): yes

Granting credits...

✓ user1@example.com | +50 credits (expires in 30 days)
✓ user2@example.com | +50 credits (expires in 30 days)
✓ user3@example.com | +50 credits (expires in 30 days)
... (42 more)

================================================================================

✓ Successfully granted credits to 45 users

Total credits granted: 2,250
Estimated value: $22.50
Reason: Promotional bonus
Expiry: 30 days
```

---

## 📊 Use Cases

### 1. Welcome Bonus (Onboarding)

```bash
# Grant 100 credits to new users automatically
python manage.py grant_credits --new-users \
    --credits 100 \
    --reason "Welcome bonus - Thanks for signing up!" \
    --expiry-days 60
```

### 2. Referral Program

```bash
# When user refers someone
python manage.py grant_credits referrer@example.com \
    --credits 500 \
    --reason "Referral reward - Thanks for spreading the word!"
```

### 3. Support Compensation

```bash
# Compensate for downtime or issues
python manage.py grant_credits affected-user@example.com \
    --credits 1000 \
    --reason "Service interruption compensation" \
    --expiry-days 0  # No expiry
```

### 4. Holiday Promotion

```bash
# Black Friday - all users get bonus
python manage.py grant_credits --all \
    --credits 200 \
    --reason "Black Friday Bonus! 🎉" \
    --expiry-days 14
```

### 5. Beta Tester Reward

```bash
# Thank early adopters
python manage.py grant_credits beta-tester@example.com \
    --credits 5000 \
    --reason "Beta testing reward - Thank you!" \
    --expiry-days 365
```

---

## 🔄 Integration with Other Systems

### Celery Tasks (Automated)

```python
# apps/billing/tasks.py
from celery import shared_task
from django.core.management import call_command

@shared_task
def grant_welcome_credits():
    """Grant welcome credits to new users daily"""
    call_command('grant_credits', '--new-users', credits=50)

@shared_task
def grant_referral_credits(user_email, referred_email):
    """Grant credits for successful referral"""
    call_command(
        'grant_credits',
        user_email,
        credits=500,
        reason=f'Referral reward: {referred_email}'
    )
```

### API Endpoint (Manual)

```python
# apps/billing/views.py
from django.core.management import call_command
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAdminUser

@api_view(['POST'])
@permission_classes([IsAdminUser])
def admin_grant_credits(request):
    email = request.data.get('email')
    credits = request.data.get('credits', 50)
    reason = request.data.get('reason', 'Admin grant')
    
    call_command('grant_credits', email, credits=credits, reason=reason)
    return Response({'success': True})
```

---

## 📋 Best Practices

### 1. **Always Provide Reason**
```bash
# Good
--reason "Q4 promotion - 20% bonus"

# Bad
--reason "bonus"
```

### 2. **Set Appropriate Expiry**
- Welcome/Promotion: 30-60 days
- Referral rewards: 90-180 days
- Compensation: No expiry (0 days)

### 3. **Test First**
```bash
# Test with single user
python manage.py grant_credits test@example.com --credits 10

# Then scale up
python manage.py grant_credits --all --credits 10
```

### 4. **Track Bulk Operations**
Log all bulk operations for auditing:
```bash
python manage.py grant_credits --all --credits 100 | tee grants-$(date +%Y%m%d).log
```

---

## 🛡️ Security & Limits

- ✅ Only admin/superuser can run these commands
- ✅ Confirmation required for >10,000 credits
- ✅ Confirmation required for bulk operations
- ✅ All grants logged in `CreditTransaction` table
- ✅ Email notifications sent to users (if configured)

---

## 📈 Monitoring

Check granted credits:

```sql
-- Total bonus credits granted
SELECT COUNT(*), SUM(amount)
FROM credit_transactions
WHERE transaction_type = 'bonus';

-- By reason
SELECT description, COUNT(*), SUM(amount)
FROM credit_transactions
WHERE transaction_type = 'bonus'
GROUP BY description;
```

---

## 🚀 Quick Start Guide

1. **Set up packages** (run once):
```bash
python manage.py setup_credit_packages
```

2. **Grant welcome credits** (run daily or on signup):
```bash
python manage.py grant_credits --new-users --credits 50
```

3. **Manual grant** (as needed):
```bash
python manage.py grant_credits user@example.com --credits 100
```

---

**Need help?** Contact: support@scrubimail.com
