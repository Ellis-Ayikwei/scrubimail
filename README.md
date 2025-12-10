# ScrubiMail - Email Validation SaaS Platform

![ScrubiMail](https://scrubimail.com/og-image.jpg)

**ScrubiMail** is a powerful email validation and verification SaaS platform that helps developers and businesses verify email addresses in real-time, reduce bounce rates, and improve email deliverability.

🌐 **Website**: [scrubimail.com](https://scrubimail.com)  
📧 **Contact**: support@scrubimail.com  
📱 **Phone**: +233-24-813-8722

---

## 🚀 What is ScrubiMail?

ScrubiMail provides enterprise-grade email validation through a simple REST API. Validate single emails in real-time or clean entire lists with bulk validation.

### Key Features

- ✅ **Real-time Email Validation** - Validate emails as users type
- ✅ **Bulk List Validation** - Clean thousands of emails at once
- ✅ **Syntax Verification** - RFC 5322 compliant checking
- ✅ **DNS/MX Record Validation** - Verify domain and mail server
- ✅ **SMTP Verification** - Check if mailbox actually exists
- ✅ **Disposable Email Detection** - Block temporary email services
- ✅ **Role-based Email Detection** - Identify admin@, info@, etc.
- ✅ **Catch-all Detection** - Detect catch-all mail servers
- ✅ **Free Provider Detection** - Identify Gmail, Yahoo, etc.
- ✅ **Typo Suggestions** - "Did you mean gmail.com?"

---

## 📦 Quick Start

### 1. Sign Up
Create a free account at [scrubimail.com/register](https://scrubimail.com/register)

### 2. Get Your API Key
Get your API key from the dashboard

### 3. Validate an Email

#### Python
```python
import requests

response = requests.post(
    'https://api.scrubimail.com/validate',
    headers={'Authorization': 'Bearer YOUR_API_KEY'},
    json={'email': 'user@example.com'}
)

result = response.json()
print(f"Valid: {result['is_valid']}")
print(f"Score: {result['quality_score']}")
```

#### JavaScript/Node.js
```javascript
const response = await fetch('https://api.scrubimail.com/validate', {
  method: 'POST',
  headers: {
    'Authorization': 'Bearer YOUR_API_KEY',
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({ email: 'user@example.com' })
});

const result = await response.json();
console.log('Valid:', result.is_valid);
```

#### cURL
```bash
curl -X POST https://api.scrubimail.com/validate \
  -H 'Authorization: Bearer YOUR_API_KEY' \
  -H 'Content-Type: application/json' \
  -d '{"email": "user@example.com"}'
```

---

## 🏗️ Project Structure

This is a monorepo containing:

```
/ScrubiMail-BE/          # Django/Python backend API
/Scrubimail-FE/          # React/TypeScript user frontend
/Scrubimail-Admin-FE/    # React/TypeScript admin dashboard
```

### Backend (Django REST Framework)
- Email validation engine
- User authentication & billing
- API key management
- Usage analytics
- Stripe payment integration

### Frontend (React + Vite)
- User dashboard
- Email validation interface
- Billing & subscription management
- API documentation
- Usage statistics

---

## 💡 Use Cases

### 1. User Registration
Validate emails during signup to prevent fake accounts:
```javascript
app.post('/register', async (req, res) => {
  const validation = await scrubimail.validate(req.body.email);
  
  if (!validation.is_valid || validation.checks.disposable) {
    return res.status(400).json({ error: 'Invalid email' });
  }
  
  // Create user...
});
```

### 2. Email List Cleaning
Clean your marketing lists before campaigns:
```python
import pandas as pd

emails = pd.read_csv('email_list.csv')
valid_emails = []

for email in emails['email']:
    result = scrubimail.validate(email)
    if result['is_valid'] and result['quality_score'] > 70:
        valid_emails.append(email)

pd.DataFrame(valid_emails).to_csv('cleaned_list.csv')
```

### 3. Form Validation
Real-time validation in web forms:
```javascript
const validateEmail = async (email) => {
  const result = await scrubimail.validate(email);
  if (!result.is_valid) {
    showError('Please enter a valid email');
  }
};
```

---

## 🛠️ Technology Stack

**Backend:**
- Django 4.x
- Django REST Framework
- PostgreSQL
- Celery (async tasks)
- Redis (caching)
- Stripe (payments)

**Frontend:**
- React 18
- TypeScript
- Vite
- TailwindCSS
- Redux Toolkit
- React Router

**Infrastructure:**
- Docker
- Vercel (frontend hosting)
- AWS/Heroku (backend)

---

## 📊 API Response Format

```json
{
  "email": "user@example.com",
  "is_valid": true,
  "quality_score": 95,
  "email_type": "personal",
  "checks": {
    "syntax": "valid",
    "dns": "valid",
    "smtp": "valid",
    "disposable": false,
    "role_based": false,
    "catch_all": false,
    "free_provider": false
  },
  "provider": "example.com",
  "suggestion": null,
  "processed_at": "2025-12-10T12:00:00Z"
}
```

---

## 💰 Pricing

- **Free Tier** - Get started with free credits
- **Starter** - $19/month - 10,000 validations
- **Professional** - $49/month - 50,000 validations
- **Business** - $99/month - 150,000 validations
- **Enterprise** - Custom pricing for high volume

View full pricing: [scrubimail.com/pricing](https://scrubimail.com/pricing)

---

## 🔗 Links

- **Website**: [scrubimail.com](https://scrubimail.com)
- **Documentation**: [scrubimail.com/docs](https://scrubimail.com/docs)
- **API Docs**: [scrubimail.com/api-docs](https://scrubimail.com/api-docs)
- **Pricing**: [scrubimail.com/pricing](https://scrubimail.com/pricing)
- **Support**: support@scrubimail.com

---

## 📝 License

Copyright © 2024-2025 ScrubiMail. All rights reserved.

---

## 🤝 Support

- **Email**: support@scrubimail.com
- **Phone**: +233-24-813-8722
- **Help Center**: [scrubimail.com/help](https://scrubimail.com/help)

---

**Made with ❤️ by the ScrubiMail Team**
