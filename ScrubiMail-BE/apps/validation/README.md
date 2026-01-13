# Advanced Email Validation System

A production-grade email validation SaaS platform with comprehensive validation features, real-time processing, and advanced analytics.

## Features

### Core Validation Features

#### 1. Syntax & RFC Compliance
- **RFC 5322 + 6531 regex validation** with full compliance
- **IDN (Internationalized Domain Names)** support with punycode handling
- **Real-time suggestions** for common typos ("did you mean gmail.com?")
- **Length validation** for local and domain parts

#### 2. DNS & MX Validation
- **A/AAAA record** existence checks
- **MX record** validation with preference scoring
- **CNAME fallback** support
- **DNSSEC awareness** and validation
- **MX preference scoring** (Google vs. corporate providers)
- **TLS/MTA-STS** policy lookup

#### 3. SMTP Handshake
- **EHLO, MAIL FROM, RCPT TO** pipeline with configurable timeouts
- **Grey-listing retry** logic
- **Catch-all detection** using multiple test emails
- **Enhanced NDR pattern recognition** for better error handling
- **Multiple MX server** testing for reliability

#### 4. Domain Reputation
- **Disposable domain** detection with extensive blocklist
- **Temporary & alias domain** identification
- **Dynamic reputation scoring** based on:
  - Spam trap hits
  - Domain age
  - Registrar reputation
  - SOA TTL analysis
- **High-risk TLD** detection
- **Corporate provider** recognition

#### 5. Role & Group Detection
- **Role-based email** detection (admin@, info@, support@)
- **Alias detection** (sales+alias@domain.com)
- **Custom regex rules** per customer
- **Risk scoring** for role-based emails

#### 6. Spam-trap & Complainer Detection
- **Known spam-trap** pattern database
- **Complainer feedback loop** integration
- **Pattern-based risk assessment**

#### 7. Risk Scoring
- **Composite 0-100 score** with human-friendly verdicts
- **ML-driven probability** with feature explanations
- **Detailed breakdown** of validation steps
- **Confidence levels** for results

### Processing Modes

#### Real-time Validation
- **≤300ms p99** response time for single validations
- **Immediate results** with comprehensive breakdown
- **Synchronous processing** for instant feedback

#### Bulk Processing
- **Async jobs** for CSV/NDJSON processing
- **Batch processing** with progress tracking
- **Job management** with status monitoring
- **Result aggregation** and analytics

### Security & Privacy

- **HTTPS enforcement** for all API calls
- **HMAC-signed requests** for API key authentication
- **Regional data residency** support
- **GDPR/SOC 2** compliance features
- **Zero-log option** for privacy-conscious users

### Analytics & Insights

- **Usage dashboard** with detailed metrics
- **Error heat-map** for validation failures
- **Domain reputation** tracking
- **Performance analytics** and monitoring
- **Webhook & Snowflake** export capabilities

## API Endpoints

### Authentication
All endpoints require either JWT token or API key authentication.

### Single Email Validation

#### POST `/scrubimail/api/v1/validate/`
Validate a single email address.

**Request:**
```json
{
  "email": "user@example.com",
  "real_time": true
}
```

**Response:**
```json
{
  "id": 123,
  "email": "user@example.com",
  "status": "completed",
  "score": 85,
  "verdict": "Valid",
  "is_valid": true,
  "breakdown": {
    "syntax": {"valid": true},
    "dns": {"valid": true, "score": 90},
    "smtp": {"valid": true, "catch_all": false},
    "reputation": {"reputation_score": 85},
    "role_based": {"is_role_based": false}
  },
  "suggestions": [],
  "warnings": [],
  "validation_time": 0.245
}
```

### Bulk Email Validation

#### POST `/scrubimail/api/v1/validate-bulk/`
Submit multiple emails for bulk validation.

**Request:**
```json
{
  "emails": ["user1@example.com", "user2@example.com"]
}
```

**Response:**
```json
{
  "job_id": 456,
  "total_emails": 2,
  "status": "pending",
  "message": "Bulk validation job queued successfully"
}
```

#### GET `/scrubimail/api/v1/bulk-status/{job_id}/`
Get bulk job status and progress.

**Response:**
```json
{
  "job_id": 456,
  "status": "processing",
  "progress": 75,
  "total_emails": 2,
  "total_processed": 1,
  "summary": {
    "total_validations": 1,
    "completed_validations": 1,
    "valid_emails": 1,
    "invalid_emails": 0,
    "risky_emails": 0,
    "avg_score": 85.0
  }
}
```

### Validation History

#### GET `/scrubimail/api/v1/history/`
Get validation history with filtering options.

**Query Parameters:**
- `status`: Filter by validation status
- `date_from`: Start date filter
- `date_to`: End date filter
- `min_score`: Minimum score filter
- `max_score`: Maximum score filter

**Response:**
```json
{
  "results": [...],
  "summary": {
    "total_validations": 100,
    "completed_validations": 95,
    "valid_emails": 80,
    "invalid_emails": 10,
    "risky_emails": 5,
    "avg_score": 82.5
  }
}
```

### Analytics

#### GET `/scrubimail/api/v1/analytics/`
Get validation analytics and statistics.

**Query Parameters:**
- `days`: Number of days to analyze (default: 30)

**Response:**
```json
{
  "period": {
    "start_date": "2024-01-01",
    "end_date": "2024-01-30",
    "days": 30
  },
  "overview": {
    "total_validations": 1000,
    "completed_validations": 950,
    "success_rate": 95.0,
    "avg_score": 82.5
  },
  "daily_stats": [...],
  "top_domains": [...]
}
```

### Domain Reputation

#### GET `/scrubimail/api/v1/domain-reputation/{domain}/`
Get domain reputation information.

**Response:**
```json
{
  "domain": "example.com",
  "reputation_score": 85,
  "is_disposable": false,
  "is_corporate": true,
  "tld_risk": false,
  "spam_trap_risk": 0.1,
  "last_checked": "2024-01-30T10:00:00Z",
  "cached": true
}
```

## Configuration

### Environment Variables

```bash
# Database
DATABASE_URL=postgresql://user:pass@localhost:5432/scrubimail

# Redis
REDIS_URL=redis://localhost:6379/0

# Celery
CELERY_BROKER_URL=redis://localhost:6379/0
CELERY_RESULT_BACKEND=redis://localhost:6379/0

# Email validation settings
VALIDATION_SMTP_TIMEOUT=10
VALIDATION_SMTP_CONNECTION_TIMEOUT=5
VALIDATION_BATCH_SIZE=100
VALIDATION_MAX_RETRIES=3

# Rate limiting
VALIDATION_RATE_LIMIT=1000  # requests per hour
BULK_RATE_LIMIT=10  # bulk jobs per hour
```

### Celery Configuration

```python
# settings.py
CELERY_BEAT_SCHEDULE = {
    'cleanup-old-validations': {
        'task': 'apps.validation.tasks.cleanup_old_validations_task',
        'schedule': crontab(hour=2, minute=0),  # Daily at 2 AM
    },
}
```

## Performance Optimization

### Caching Strategy
- **Domain reputation** cached for 24 hours
- **DNS results** cached for 1 hour
- **Validation results** cached for 1 hour

### Database Optimization
- **Indexes** on frequently queried fields
- **Partitioning** for large validation tables
- **Archiving** of old validation records

### Rate Limiting
- **Per-user rate limits** for API calls
- **Bulk job limits** to prevent abuse
- **IP-based rate limiting** for unauthenticated users

## Monitoring & Alerting

### Key Metrics
- **Validation success rate**
- **Average response time**
- **Error rates by validation step**
- **Domain reputation distribution**
- **User activity patterns**

### Health Checks
- **SMTP server availability**
- **DNS resolver health**
- **Database connection status**
- **Redis connectivity**
- **Celery worker status**

## Security Considerations

### Input Validation
- **Email format validation** before processing
- **Rate limiting** to prevent abuse
- **Input sanitization** for all user data

### Data Protection
- **Encryption at rest** for sensitive data
- **Secure transmission** via HTTPS
- **Data retention policies** for validation records

### Access Control
- **JWT token authentication**
- **API key management**
- **Role-based access control**
- **Audit logging** for all operations

## Deployment

### Docker Compose Setup

```yaml
version: '3.8'
services:
  web:
    build: .
    ports:
      - "8000:8000"
    environment:
      - DATABASE_URL=postgresql://postgres:password@db:5432/scrubimail
      - REDIS_URL=redis://redis:6379/0
    depends_on:
      - db
      - redis

  db:
    image: postgres:15
    environment:
      - POSTGRES_DB=scrubimail
      - POSTGRES_USER=postgres
      - POSTGRES_PASSWORD=password
    volumes:
      - postgres_data:/var/lib/postgresql/data

  redis:
    image: redis:7-alpine
    volumes:
      - redis_data:/data

  celery:
    build: .
    command: celery -A backend worker -l info
    environment:
      - DATABASE_URL=postgresql://postgres:password@db:5432/scrubimail
      - REDIS_URL=redis://redis:6379/0
    depends_on:
      - db
      - redis

volumes:
  postgres_data:
  redis_data:
```

### Production Checklist

- [ ] **SSL/TLS** certificates configured
- [ ] **Database backups** automated
- [ ] **Monitoring** and alerting set up
- [ ] **Rate limiting** configured
- [ ] **Logging** and audit trails enabled
- [ ] **Security headers** implemented
- [ ] **CDN** configured for static assets
- [ ] **Load balancing** set up for high availability

## Support & Maintenance

### Regular Maintenance Tasks
- **Cleanup old validation records** (daily)
- **Update disposable domain lists** (weekly)
- **Refresh domain reputation data** (daily)
- **Database optimization** (weekly)
- **Security updates** (monthly)

### Troubleshooting

#### Common Issues

1. **SMTP Timeout Errors**
   - Check network connectivity
   - Verify SMTP server configurations
   - Adjust timeout settings

2. **DNS Resolution Failures**
   - Verify DNS server configuration
   - Check for DNS propagation issues
   - Review DNS cache settings

3. **High Memory Usage**
   - Monitor Celery worker memory
   - Adjust batch processing sizes
   - Review caching strategies

4. **Database Performance**
   - Check query performance
   - Review indexing strategy
   - Monitor connection pools

### Support Channels
- **Documentation**: Comprehensive API docs
- **Email Support**: support@scrubimail.com
- **Status Page**: status.scrubimail.com
- **Community Forum**: community.scrubimail.com 