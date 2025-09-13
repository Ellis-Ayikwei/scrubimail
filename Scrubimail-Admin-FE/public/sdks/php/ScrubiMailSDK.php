<?php
/**
 * ScrubiMail PHP SDK
 * Official SDK for the ScrubiMail Email Validation API
 * 
 * @version 1.0.0
 * @author ScrubiMail Team
 * @license MIT
 */

namespace ScrubiMail;

/**
 * Custom exception for ScrubiMail API errors
 */
class ScrubiMailException extends \Exception {}

/**
 * ScrubiMail PHP SDK for email validation
 */
class ScrubiMailSDK
{
    private $apiKey;
    private $baseUrl;
    private $headers;

    /**
     * Constructor
     * 
     * @param string $apiKey Your ScrubiMail API key
     * @param string $baseUrl API base URL
     * @throws \InvalidArgumentException If API key is empty
     */
    public function __construct($apiKey, $baseUrl = 'https://api.scrubimail.com/scrubimail/api/v1')
    {
        if (empty($apiKey)) {
            throw new \InvalidArgumentException('API key is required');
        }

        $this->apiKey = $apiKey;
        $this->baseUrl = rtrim($baseUrl, '/');
        $this->headers = [
            'Authorization: Bearer ' . $apiKey,
            'Content-Type: application/json',
            'User-Agent: ScrubiMail-PHP-SDK/1.0.0'
        ];
    }

    /**
     * Make HTTP request to API
     * 
     * @param string $endpoint API endpoint
     * @param string $method HTTP method
     * @param array|null $data Request data
     * @return array API response
     * @throws ScrubiMailException If request fails
     */
    private function request($endpoint, $method = 'GET', $data = null)
    {
        $url = $this->baseUrl . $endpoint;
        
        $ch = curl_init();
        curl_setopt_array($ch, [
            CURLOPT_URL => $url,
            CURLOPT_RETURNTRANSFER => true,
            CURLOPT_HTTPHEADER => $this->headers,
            CURLOPT_CUSTOMREQUEST => $method,
            CURLOPT_TIMEOUT => 30,
            CURLOPT_CONNECTTIMEOUT => 10,
            CURLOPT_SSL_VERIFYPEER => true,
            CURLOPT_USERAGENT => 'ScrubiMail-PHP-SDK/1.0.0'
        ]);

        if ($data !== null) {
            curl_setopt($ch, CURLOPT_POSTFIELDS, json_encode($data));
        }

        $response = curl_exec($ch);
        $httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
        $error = curl_error($ch);
        curl_close($ch);

        if ($error) {
            throw new ScrubiMailException('cURL Error: ' . $error);
        }

        $decodedResponse = json_decode($response, true);

        if ($httpCode >= 400) {
            $errorMessage = isset($decodedResponse['message']) 
                ? $decodedResponse['message'] 
                : 'HTTP ' . $httpCode . ': Request failed';
            throw new ScrubiMailException($errorMessage);
        }

        if (json_last_error() !== JSON_ERROR_NONE) {
            throw new ScrubiMailException('Invalid JSON response: ' . json_last_error_msg());
        }

        return $decodedResponse;
    }

    /**
     * Validate a single email address
     * 
     * @param string $email Email address to validate
     * @param bool $realTime Whether to perform real-time validation
     * @return array Validation result
     * @throws ScrubiMailException If validation fails
     */
    public function validateEmail($email, $realTime = true)
    {
        if (empty($email) || !is_string($email)) {
            throw new \InvalidArgumentException('Valid email address is required');
        }

        $data = [
            'email' => trim($email),
            'real_time' => $realTime
        ];

        return $this->request('/validate/', 'POST', $data);
    }

    /**
     * Submit bulk email validation job
     * 
     * @param array $emails Array of email addresses to validate
     * @return array Bulk job response
     * @throws ScrubiMailException If submission fails
     */
    public function validateBulk(array $emails)
    {
        if (empty($emails)) {
            throw new \InvalidArgumentException('Array of emails is required');
        }

        if (count($emails) > 10000) {
            throw new \InvalidArgumentException('Maximum 10,000 emails allowed per batch');
        }

        $data = [
            'emails' => array_map('trim', $emails)
        ];

        return $this->request('/validate-bulk/', 'POST', $data);
    }

    /**
     * Get bulk job status
     * 
     * @param int $jobId Bulk job ID
     * @return array Job status and progress
     * @throws ScrubiMailException If request fails
     */
    public function getBulkJobStatus($jobId)
    {
        if (!is_numeric($jobId) || $jobId <= 0) {
            throw new \InvalidArgumentException('Valid job ID is required');
        }

        return $this->request("/bulk-status/{$jobId}/");
    }

    /**
     * Get validation status
     * 
     * @param int $validationId Validation ID
     * @return array Validation result
     * @throws ScrubiMailException If request fails
     */
    public function getValidationStatus($validationId)
    {
        if (!is_numeric($validationId) || $validationId <= 0) {
            throw new \InvalidArgumentException('Valid validation ID is required');
        }

        return $this->request("/status/{$validationId}/");
    }

    /**
     * Get validation history
     * 
     * @param array $params Query parameters
     * @return array Validation history
     * @throws ScrubiMailException If request fails
     */
    public function getValidationHistory(array $params = [])
    {
        $endpoint = '/history/';
        if (!empty($params)) {
            $endpoint .= '?' . http_build_query($params);
        }

        return $this->request($endpoint);
    }

    /**
     * Get validation analytics
     * 
     * @param array $params Query parameters
     * @return array Analytics data
     * @throws ScrubiMailException If request fails
     */
    public function getValidationAnalytics(array $params = [])
    {
        $endpoint = '/analytics/';
        if (!empty($params)) {
            $endpoint .= '?' . http_build_query($params);
        }

        return $this->request($endpoint);
    }

    /**
     * Get domain reputation
     * 
     * @param string $domain Domain to check
     * @return array Domain reputation data
     * @throws ScrubiMailException If request fails
     */
    public function getDomainReputation($domain)
    {
        if (empty($domain) || !is_string($domain)) {
            throw new \InvalidArgumentException('Valid domain is required');
        }

        $encodedDomain = urlencode($domain);
        return $this->request("/domain-reputation/{$encodedDomain}/");
    }

    /**
     * Batch validate emails with progress callback
     * 
     * @param array $emails Array of email addresses
     * @param callable|null $progressCallback Callback for progress updates
     * @param int $pollInterval Polling interval in seconds
     * @return array Final validation results
     * @throws ScrubiMailException If validation fails
     */
    public function validateBulkWithProgress(array $emails, callable $progressCallback = null, $pollInterval = 2)
    {
        // Submit bulk job
        $jobResponse = $this->validateBulk($emails);
        $jobId = $jobResponse['job_id'];

        // Poll for completion
        while (true) {
            $status = $this->getBulkJobStatus($jobId);

            if ($progressCallback !== null && is_callable($progressCallback)) {
                call_user_func($progressCallback, $status);
            }

            if (in_array($status['status'], ['completed', 'failed'])) {
                return $status;
            }

            // Wait before next poll
            sleep($pollInterval);
        }
    }
}

// Usage examples:
/*
try {
    // Initialize SDK
    $sdk = new ScrubiMail\ScrubiMailSDK('your-api-key');
    
    // Validate single email
    $result = $sdk->validateEmail('user@example.com');
    echo "Single validation result: " . json_encode($result) . "\n";
    
    // Validate bulk emails with progress
    $emails = ['user1@example.com', 'user2@example.com'];
    
    $progressCallback = function($status) {
        $progress = isset($status['progress']) ? $status['progress'] : 0;
        echo "Progress: {$progress}%\n";
    };
    
    $bulkResult = $sdk->validateBulkWithProgress($emails, $progressCallback);
    echo "Bulk validation result: " . json_encode($bulkResult) . "\n";
    
    // Get analytics
    $analytics = $sdk->getValidationAnalytics([
        'start_date' => '2024-01-01',
        'end_date' => '2024-01-31'
    ]);
    echo "Analytics: " . json_encode($analytics) . "\n";
    
} catch (ScrubiMail\ScrubiMailException $e) {
    echo "ScrubiMail API Error: " . $e->getMessage() . "\n";
} catch (InvalidArgumentException $e) {
    echo "Validation Error: " . $e->getMessage() . "\n";
} catch (Exception $e) {
    echo "Unexpected Error: " . $e->getMessage() . "\n";
}
*/