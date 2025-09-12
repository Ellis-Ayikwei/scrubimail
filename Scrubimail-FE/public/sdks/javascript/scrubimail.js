/**
 * ScrubiMail JavaScript SDK
 * Official SDK for the ScrubiMail Email Validation API
 * 
 * @version 1.0.0
 * @author ScrubiMail Team
 */

class ScrubiMailSDK {
  constructor(apiKey, baseURL = 'https://api.scrubimail.com/scrubimail/api/v1') {
    if (!apiKey) {
      throw new Error('API key is required');
    }
    
    this.apiKey = apiKey;
    this.baseURL = baseURL;
    this.headers = {
      'Authorization': `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
      'User-Agent': 'ScrubiMail-JS-SDK/1.0.0'
    };
  }

  /**
   * Make HTTP request to API
   * @private
   */
  async _request(endpoint, options = {}) {
    const url = `${this.baseURL}${endpoint}`;
    const config = {
      headers: this.headers,
      ...options
    };

    try {
      const response = await fetch(url, config);
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || `HTTP ${response.status}: ${response.statusText}`);
      }

      return await response.json();
    } catch (error) {
      if (error.name === 'TypeError' && error.message.includes('fetch')) {
        throw new Error('Network error: Unable to connect to ScrubiMail API');
      }
      throw error;
    }
  }

  /**
   * Validate a single email address
   * @param {string} email - Email address to validate
   * @param {boolean} realTime - Whether to perform real-time validation
   * @returns {Promise<Object>} Validation result
   */
  async validateEmail(email, realTime = true) {
    if (!email || typeof email !== 'string') {
      throw new Error('Valid email address is required');
    }

    return this._request('/validate/', {
      method: 'POST',
      body: JSON.stringify({
        email: email.trim(),
        real_time: realTime
      })
    });
  }

  /**
   * Submit bulk email validation job
   * @param {string[]} emails - Array of email addresses to validate
   * @returns {Promise<Object>} Bulk job response
   */
  async validateBulk(emails) {
    if (!Array.isArray(emails) || emails.length === 0) {
      throw new Error('Array of emails is required');
    }

    if (emails.length > 10000) {
      throw new Error('Maximum 10,000 emails allowed per batch');
    }

    return this._request('/validate-bulk/', {
      method: 'POST',
      body: JSON.stringify({
        emails: emails.map(email => email.trim())
      })
    });
  }

  /**
   * Get bulk job status
   * @param {number} jobId - Bulk job ID
   * @returns {Promise<Object>} Job status and progress
   */
  async getBulkJobStatus(jobId) {
    if (!jobId || typeof jobId !== 'number') {
      throw new Error('Valid job ID is required');
    }

    return this._request(`/bulk-status/${jobId}/`);
  }

  /**
   * Get validation status
   * @param {number} validationId - Validation ID
   * @returns {Promise<Object>} Validation result
   */
  async getValidationStatus(validationId) {
    if (!validationId || typeof validationId !== 'number') {
      throw new Error('Valid validation ID is required');
    }

    return this._request(`/status/${validationId}/`);
  }

  /**
   * Get validation history
   * @param {Object} params - Query parameters
   * @returns {Promise<Object>} Validation history
   */
  async getValidationHistory(params = {}) {
    const queryString = new URLSearchParams(params).toString();
    const endpoint = queryString ? `/history/?${queryString}` : '/history/';
    
    return this._request(endpoint);
  }

  /**
   * Get validation analytics
   * @param {Object} params - Query parameters
   * @returns {Promise<Object>} Analytics data
   */
  async getValidationAnalytics(params = {}) {
    const queryString = new URLSearchParams(params).toString();
    const endpoint = queryString ? `/analytics/?${queryString}` : '/analytics/';
    
    return this._request(endpoint);
  }

  /**
   * Get domain reputation
   * @param {string} domain - Domain to check
   * @returns {Promise<Object>} Domain reputation data
   */
  async getDomainReputation(domain) {
    if (!domain || typeof domain !== 'string') {
      throw new Error('Valid domain is required');
    }

    return this._request(`/domain-reputation/${encodeURIComponent(domain)}/`);
  }

  /**
   * Batch validate emails with progress callback
   * @param {string[]} emails - Array of email addresses
   * @param {Function} progressCallback - Callback for progress updates
   * @param {number} pollInterval - Polling interval in milliseconds (default: 2000)
   * @returns {Promise<Object>} Final validation results
   */
  async validateBulkWithProgress(emails, progressCallback = null, pollInterval = 2000) {
    // Submit bulk job
    const jobResponse = await this.validateBulk(emails);
    const jobId = jobResponse.job_id;

    // Poll for completion
    while (true) {
      const status = await this.getBulkJobStatus(jobId);
      
      if (progressCallback && typeof progressCallback === 'function') {
        progressCallback(status);
      }

      if (status.status === 'completed' || status.status === 'failed') {
        return status;
      }

      // Wait before next poll
      await new Promise(resolve => setTimeout(resolve, pollInterval));
    }
  }
}

// Export for different module systems
if (typeof module !== 'undefined' && module.exports) {
  // Node.js
  module.exports = ScrubiMailSDK;
} else if (typeof define === 'function' && define.amd) {
  // AMD
  define([], function() {
    return ScrubiMailSDK;
  });
} else {
  // Browser global
  window.ScrubiMailSDK = ScrubiMailSDK;
}

// Usage examples:
/*
// Initialize SDK
const scrubimail = new ScrubiMailSDK('your-api-key');

// Validate single email
scrubimail.validateEmail('user@example.com')
  .then(result => console.log(result))
  .catch(error => console.error(error));

// Validate bulk emails with progress
const emails = ['user1@example.com', 'user2@example.com'];
scrubimail.validateBulkWithProgress(emails, (progress) => {
  console.log(`Progress: ${progress.progress}%`);
})
.then(results => console.log('Final results:', results))
.catch(error => console.error(error));

// Get analytics
scrubimail.getValidationAnalytics({
  start_date: '2024-01-01',
  end_date: '2024-01-31'
})
.then(analytics => console.log(analytics))
.catch(error => console.error(error));
*/