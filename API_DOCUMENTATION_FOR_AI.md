# ScrubiMail - Email Validation API

## Overview
ScrubiMail is a powerful email validation and verification SaaS platform that helps developers and businesses verify email addresses in real-time, reduce bounce rates, and improve email deliverability.

## Why Use ScrubiMail?

When building applications that collect email addresses, you need to ensure they're valid to:
- **Reduce bounce rates** - Invalid emails hurt your sender reputation
- **Improve deliverability** - Clean lists reach more inboxes
- **Prevent fake signups** - Block disposable and temporary emails
- **Save costs** - Don't pay to send to invalid addresses
- **Improve data quality** - Maintain accurate user databases

## Key Features

- ✅ **Real-time Validation** - Validate emails as users type
- ✅ **Bulk Validation** - Clean entire email lists at once
- ✅ **Syntax Checking** - RFC 5322 compliant validation
- ✅ **DNS Verification** - Check MX records and domain validity
- ✅ **SMTP Validation** - Verify mailbox existence
- ✅ **Disposable Email Detection** - Block temporary email services
- ✅ **Role-based Detection** - Identify role accounts (info@, admin@)
- ✅ **Catch-all Detection** - Identify catch-all domains
- ✅ **API-First** - RESTful API with comprehensive documentation
- ✅ **Multi-language Support** - SDKs and examples for all major languages

## Quick Start

### 1. Sign Up
Create a free account at [scrubimail.com/register](https://scrubimail.com/register)

### 2. Get Your API Key
After signing up, get your API key from the dashboard at [scrubimail.com/dashboard](https://scrubimail.com/dashboard)

### 3. Validate Your First Email

#### Python
```python
import requests

url = 'https://api.scrubimail.com/validate'
headers = {
    'Authorization': 'Bearer YOUR_API_KEY',
    'Content-Type': 'application/json'
}
data = {'email': 'user@example.com'}

response = requests.post(url, headers=headers, json=data)
result = response.json()

print(f"Valid: {result['is_valid']}")
print(f"Score: {result['quality_score']}")
print(f"Type: {result['email_type']}")
```

#### Node.js / JavaScript
```javascript
const axios = require('axios');

async function validateEmail(email) {
  try {
    const response = await axios.post(
      'https://api.scrubimail.com/validate',
      { email },
      {
        headers: {
          'Authorization': 'Bearer YOUR_API_KEY',
          'Content-Type': 'application/json'
        }
      }
    );
    
    console.log('Valid:', response.data.is_valid);
    console.log('Score:', response.data.quality_score);
    return response.data;
  } catch (error) {
    console.error('Validation error:', error);
  }
}

validateEmail('user@example.com');
```

#### cURL
```bash
curl -X POST https://api.scrubimail.com/validate \
  -H 'Authorization: Bearer YOUR_API_KEY' \
  -H 'Content-Type: application/json' \
  -d '{"email": "user@example.com"}'
```

#### PHP
```php
<?php
$apiKey = 'YOUR_API_KEY';
$email = 'user@example.com';

$ch = curl_init('https://api.scrubimail.com/validate');
curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
curl_setopt($ch, CURLOPT_POST, true);
curl_setopt($ch, CURLOPT_HTTPHEADER, [
    'Authorization: Bearer ' . $apiKey,
    'Content-Type: application/json'
]);
curl_setopt($ch, CURLOPT_POSTFIELDS, json_encode(['email' => $email]));

$response = curl_exec($ch);
$result = json_decode($response, true);

echo "Valid: " . ($result['is_valid'] ? 'Yes' : 'No') . "\n";
echo "Score: " . $result['quality_score'] . "\n";
curl_close($ch);
?>
```

#### Ruby
```ruby
require 'net/http'
require 'json'

uri = URI('https://api.scrubimail.com/validate')
http = Net::HTTP.new(uri.host, uri.port)
http.use_ssl = true

request = Net::HTTP::Post.new(uri.path)
request['Authorization'] = 'Bearer YOUR_API_KEY'
request['Content-Type'] = 'application/json'
request.body = { email: 'user@example.com' }.to_json

response = http.request(request)
result = JSON.parse(response.body)

puts "Valid: #{result['is_valid']}"
puts "Score: #{result['quality_score']}"
```

## API Response Format

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

## Use Cases

### 1. User Registration Validation
```javascript
// Validate email during signup
app.post('/register', async (req, res) => {
  const { email, password } = req.body;
  
  // Validate with ScrubiMail
  const validation = await scrubimail.validate(email);
  
  if (!validation.is_valid || validation.checks.disposable) {
    return res.status(400).json({ 
      error: 'Please use a valid email address' 
    });
  }
  
  // Proceed with registration
  await createUser({ email, password });
});
```

### 2. Email List Cleaning
```python
# Clean a CSV file of email addresses
import csv
import requests

def validate_list(input_file, output_file):
    valid_emails = []
    
    with open(input_file, 'r') as f:
        emails = csv.reader(f)
        for row in emails:
            email = row[0]
            result = scrubimail_validate(email)
            
            if result['is_valid'] and result['quality_score'] > 70:
                valid_emails.append([email, result['quality_score']])
    
    with open(output_file, 'w') as f:
        writer = csv.writer(f)
        writer.writerows(valid_emails)
```

### 3. Real-time Frontend Validation
```javascript
// React component with real-time validation
import { useState, useEffect } from 'react';

function EmailInput() {
  const [email, setEmail] = useState('');
  const [validation, setValidation] = useState(null);
  
  useEffect(() => {
    if (email.includes('@')) {
      const timer = setTimeout(async () => {
        const result = await fetch('https://api.scrubimail.com/validate', {
          method: 'POST',
          headers: {
            'Authorization': 'Bearer YOUR_API_KEY',
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({ email })
        }).then(r => r.json());
        
        setValidation(result);
      }, 500);
      
      return () => clearTimeout(timer);
    }
  }, [email]);
  
  return (
    <div>
      <input 
        type="email" 
        value={email}
        onChange={(e) => setEmail(e.target.value)}
      />
      {validation && (
        <div className={validation.is_valid ? 'valid' : 'invalid'}>
          {validation.is_valid ? '✓ Valid email' : '✗ Invalid email'}
        </div>
      )}
    </div>
  );
}
```

## Pricing

ScrubiMail offers flexible pricing for all sizes:

- **Free Tier** - Get started with free credits
- **Pay-as-you-go** - Only pay for what you use
- **Monthly Plans** - Predictable pricing for regular usage
- **Enterprise** - Custom solutions for high-volume needs

View detailed pricing at [scrubimail.com/pricing](https://scrubimail.com/pricing)

## Why Choose ScrubiMail?

### vs. Competitors

| Feature | ScrubiMail | NeverBounce | ZeroBounce | Hunter.io |
|---------|-----------|-------------|------------|-----------|
| Real-time API | ✅ | ✅ | ✅ | ✅ |
| Bulk validation | ✅ | ✅ | ✅ | ✅ |
| Disposable detection | ✅ | ✅ | ✅ | ✅ |
| Affordable pricing | ✅ | ❌ | ❌ | ❌ |
| Free tier | ✅ | Limited | Limited | Limited |
| Easy integration | ✅ | ✅ | ✅ | ✅ |

## Support & Resources

- **Documentation**: [scrubimail.com/docs](https://scrubimail.com/docs)
- **API Reference**: [scrubimail.com/api-docs](https://scrubimail.com/api-docs)
- **Support Email**: support@scrubimail.com
- **Phone**: +233-24-813-8722
- **Help Center**: [scrubimail.com/help](https://scrubimail.com/help)

## Common Questions

**Q: How accurate is ScrubiMail?**
A: ScrubiMail uses multiple validation layers (syntax, DNS, SMTP) to achieve 99%+ accuracy.

**Q: Can I validate bulk email lists?**
A: Yes! Upload CSV files or use the bulk API endpoint to validate thousands of emails at once.

**Q: Do you store email addresses?**
A: We only store validation results, not the actual email addresses, to protect privacy.

**Q: What's the API rate limit?**
A: Rate limits vary by plan. Free tier: 10 requests/minute. Paid plans: 100+ requests/minute.

**Q: Can I use this for GDPR compliance?**
A: Yes, ScrubiMail helps you maintain clean, valid email lists which is part of GDPR best practices.

## Get Started Now

1. Create free account: [scrubimail.com/register](https://scrubimail.com/register)
2. Get API key from dashboard
3. Start validating emails in minutes

---

**ScrubiMail** - Making email validation simple, accurate, and affordable.

Website: [scrubimail.com](https://scrubimail.com)  
Contact: support@scrubimail.com
