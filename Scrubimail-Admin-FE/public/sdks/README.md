# ScrubiMail SDKs

Official SDKs for the ScrubiMail Email Validation API in multiple programming languages.

## Available SDKs

### JavaScript SDK
- **File**: `javascript/scrubimail.js`
- **Features**: 
  - Works in both browser and Node.js environments
  - Promise-based API
  - Progress callbacks for bulk operations
  - Automatic error handling
  - TypeScript-friendly

**Installation**:
```bash
# Browser
<script src="https://cdn.scrubimail.com/sdks/javascript/scrubimail.js"></script>

# Node.js
npm install scrubimail-sdk
```

**Usage**:
```javascript
const sdk = new ScrubiMailSDK('your-api-key');

// Validate single email
const result = await sdk.validateEmail('user@example.com');

// Bulk validation with progress
await sdk.validateBulkWithProgress(emails, (progress) => {
  console.log(`Progress: ${progress.progress}%`);
});
```

### Python SDK
- **File**: `python/scrubimail.py`
- **Features**:
  - Pure Python implementation (no external dependencies)
  - Type hints for better IDE support
  - Custom exception handling
  - Progress callbacks for bulk operations

**Installation**:
```bash
pip install scrubimail-sdk
```

**Usage**:
```python
from scrubimail import ScrubiMailSDK

sdk = ScrubiMailSDK('your-api-key')

# Validate single email
result = sdk.validate_email('user@example.com')

# Bulk validation with progress
def progress_callback(status):
    print(f"Progress: {status['progress']}%")

result = sdk.validate_bulk_with_progress(emails, progress_callback)
```

### PHP SDK
- **File**: `php/ScrubiMailSDK.php`
- **Features**:
  - PSR-4 compatible
  - Comprehensive error handling
  - cURL-based HTTP client
  - Progress callbacks for bulk operations

**Installation**:
```bash
composer require scrubimail/sdk
```

**Usage**:
```php
use ScrubiMail\ScrubiMailSDK;

$sdk = new ScrubiMailSDK('your-api-key');

// Validate single email
$result = $sdk->validateEmail('user@example.com');

// Bulk validation with progress
$result = $sdk->validateBulkWithProgress($emails, function($status) {
    echo "Progress: " . $status['progress'] . "%\n";
});
```

### cURL Examples
- **File**: `curl/examples.sh`
- **Features**:
  - Complete bash script with examples
  - Error handling and colored output
  - Bulk validation with polling
  - All API endpoints covered

**Usage**:
```bash
# Edit the script to set your API key
export API_KEY="your-api-key"

# Run examples
chmod +x curl/examples.sh
./curl/examples.sh
```

## Common Features

All SDKs support the following operations:

### Email Validation
- **Single Email**: Validate individual email addresses
- **Bulk Validation**: Submit multiple emails for batch processing
- **Real-time vs Batch**: Choose validation mode based on your needs

### Job Management
- **Job Status**: Check the progress of bulk validation jobs
- **Progress Callbacks**: Get real-time updates during processing
- **Result Retrieval**: Access validation results when complete

### Analytics & History
- **Validation History**: Retrieve past validation results
- **Analytics**: Get insights and statistics about your validations
- **Domain Reputation**: Check domain reputation scores

### Advanced Features
- **Error Handling**: Comprehensive error handling with meaningful messages
- **Rate Limiting**: Built-in respect for API rate limits
- **Timeout Management**: Configurable timeouts for all requests
- **Progress Tracking**: Real-time progress updates for long-running operations

## Authentication

All SDKs support multiple authentication methods:

1. **API Key in Authorization Header** (Recommended):
   ```
   Authorization: Bearer YOUR_API_KEY
   ```

2. **API Key Header**:
   ```
   X-API-Key: YOUR_API_KEY
   ```

3. **Custom Authorization**:
   ```
   Authorization: Api-Key YOUR_API_KEY
   ```

## Error Handling

All SDKs provide consistent error handling:

- **Network Errors**: Connection timeouts, DNS failures
- **API Errors**: Invalid requests, authentication failures, rate limiting
- **Validation Errors**: Invalid parameters, missing required fields
- **JSON Errors**: Malformed responses, parsing failures

## Rate Limiting

The ScrubiMail API implements rate limiting to ensure fair usage:

- **Free Tier**: 100 requests per day
- **Paid Tiers**: Higher limits based on your plan
- **Bulk Operations**: Count as single requests regardless of email count

All SDKs automatically handle rate limiting responses and provide appropriate error messages.

## Support

For support and questions:

- **Documentation**: https://docs.scrubimail.com
- **API Reference**: https://api.scrubimail.com/docs
- **Support Email**: support@scrubimail.com
- **GitHub Issues**: https://github.com/scrubimail/sdks

## Contributing

We welcome contributions to improve these SDKs:

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests
5. Submit a pull request

## License

All SDKs are released under the MIT License. See LICENSE file for details.

## Changelog

### Version 1.0.0
- Initial release
- Support for all API endpoints
- JavaScript, Python, PHP, and cURL implementations
- Progress callbacks for bulk operations
- Comprehensive error handling