"""
ScrubiMail Python SDK
Official SDK for the ScrubiMail Email Validation API

Version: 1.0.0
Author: ScrubiMail Team
"""

import json
import time
import urllib.request
import urllib.parse
import urllib.error
from typing import Dict, List, Optional, Callable, Any


class ScrubiMailError(Exception):
    """Custom exception for ScrubiMail API errors"""
    pass


class ScrubiMailSDK:
    """
    ScrubiMail Python SDK for email validation
    
    Args:
        api_key (str): Your ScrubiMail API key
        base_url (str): API base URL (default: https://api.scrubimail.com/scrubimail/api/v1)
    """
    
    def __init__(self, api_key: str, base_url: str = "https://api.scrubimail.com/scrubimail/api/v1"):
        if not api_key:
            raise ValueError("API key is required")
        
        self.api_key = api_key
        self.base_url = base_url.rstrip('/')
        self.headers = {
            'Authorization': f'Bearer {api_key}',
            'Content-Type': 'application/json',
            'User-Agent': 'ScrubiMail-Python-SDK/1.0.0'
        }
    
    def _request(self, endpoint: str, method: str = 'GET', data: Optional[Dict] = None) -> Dict[str, Any]:
        """
        Make HTTP request to API
        
        Args:
            endpoint (str): API endpoint
            method (str): HTTP method
            data (dict): Request data
            
        Returns:
            dict: API response
            
        Raises:
            ScrubiMailError: If API request fails
        """
        url = f"{self.base_url}{endpoint}"
        
        # Prepare request
        req_data = None
        if data:
            req_data = json.dumps(data).encode('utf-8')
        
        request = urllib.request.Request(
            url,
            data=req_data,
            headers=self.headers,
            method=method
        )
        
        try:
            with urllib.request.urlopen(request) as response:
                response_data = response.read().decode('utf-8')
                return json.loads(response_data)
                
        except urllib.error.HTTPError as e:
            try:
                error_data = json.loads(e.read().decode('utf-8'))
                error_message = error_data.get('message', f'HTTP {e.code}: {e.reason}')
            except (json.JSONDecodeError, AttributeError):
                error_message = f'HTTP {e.code}: {e.reason}'
            
            raise ScrubiMailError(error_message)
            
        except urllib.error.URLError as e:
            raise ScrubiMailError(f'Network error: {e.reason}')
        
        except json.JSONDecodeError as e:
            raise ScrubiMailError(f'Invalid JSON response: {e}')
    
    def validate_email(self, email: str, real_time: bool = True) -> Dict[str, Any]:
        """
        Validate a single email address
        
        Args:
            email (str): Email address to validate
            real_time (bool): Whether to perform real-time validation
            
        Returns:
            dict: Validation result
            
        Raises:
            ScrubiMailError: If validation fails
        """
        if not email or not isinstance(email, str):
            raise ValueError("Valid email address is required")
        
        data = {
            'email': email.strip(),
            'real_time': real_time
        }
        
        return self._request('/validate/', 'POST', data)
    
    def validate_bulk(self, emails: List[str]) -> Dict[str, Any]:
        """
        Submit bulk email validation job
        
        Args:
            emails (list): List of email addresses to validate
            
        Returns:
            dict: Bulk job response
            
        Raises:
            ScrubiMailError: If submission fails
        """
        if not isinstance(emails, list) or len(emails) == 0:
            raise ValueError("List of emails is required")
        
        if len(emails) > 10000:
            raise ValueError("Maximum 10,000 emails allowed per batch")
        
        data = {
            'emails': [email.strip() for email in emails]
        }
        
        return self._request('/validate-bulk/', 'POST', data)
    
    def get_bulk_job_status(self, job_id: int) -> Dict[str, Any]:
        """
        Get bulk job status
        
        Args:
            job_id (int): Bulk job ID
            
        Returns:
            dict: Job status and progress
            
        Raises:
            ScrubiMailError: If request fails
        """
        if not isinstance(job_id, int) or job_id <= 0:
            raise ValueError("Valid job ID is required")
        
        return self._request(f'/bulk-status/{job_id}/')
    
    def get_validation_status(self, validation_id: int) -> Dict[str, Any]:
        """
        Get validation status
        
        Args:
            validation_id (int): Validation ID
            
        Returns:
            dict: Validation result
            
        Raises:
            ScrubiMailError: If request fails
        """
        if not isinstance(validation_id, int) or validation_id <= 0:
            raise ValueError("Valid validation ID is required")
        
        return self._request(f'/status/{validation_id}/')
    
    def get_validation_history(self, **params) -> Dict[str, Any]:
        """
        Get validation history
        
        Args:
            **params: Query parameters (page, page_size, start_date, end_date, status)
            
        Returns:
            dict: Validation history
            
        Raises:
            ScrubiMailError: If request fails
        """
        if params:
            query_string = urllib.parse.urlencode(params)
            endpoint = f'/history/?{query_string}'
        else:
            endpoint = '/history/'
        
        return self._request(endpoint)
    
    def get_validation_analytics(self, **params) -> Dict[str, Any]:
        """
        Get validation analytics
        
        Args:
            **params: Query parameters (start_date, end_date)
            
        Returns:
            dict: Analytics data
            
        Raises:
            ScrubiMailError: If request fails
        """
        if params:
            query_string = urllib.parse.urlencode(params)
            endpoint = f'/analytics/?{query_string}'
        else:
            endpoint = '/analytics/'
        
        return self._request(endpoint)
    
    def get_domain_reputation(self, domain: str) -> Dict[str, Any]:
        """
        Get domain reputation
        
        Args:
            domain (str): Domain to check
            
        Returns:
            dict: Domain reputation data
            
        Raises:
            ScrubiMailError: If request fails
        """
        if not domain or not isinstance(domain, str):
            raise ValueError("Valid domain is required")
        
        encoded_domain = urllib.parse.quote(domain, safe='')
        return self._request(f'/domain-reputation/{encoded_domain}/')
    
    def validate_bulk_with_progress(self, 
                                   emails: List[str], 
                                   progress_callback: Optional[Callable] = None,
                                   poll_interval: int = 2) -> Dict[str, Any]:
        """
        Batch validate emails with progress callback
        
        Args:
            emails (list): List of email addresses
            progress_callback (callable): Callback for progress updates
            poll_interval (int): Polling interval in seconds
            
        Returns:
            dict: Final validation results
            
        Raises:
            ScrubiMailError: If validation fails
        """
        # Submit bulk job
        job_response = self.validate_bulk(emails)
        job_id = job_response['job_id']
        
        # Poll for completion
        while True:
            status = self.get_bulk_job_status(job_id)
            
            if progress_callback and callable(progress_callback):
                progress_callback(status)
            
            if status['status'] in ['completed', 'failed']:
                return status
            
            # Wait before next poll
            time.sleep(poll_interval)


# Usage examples:
if __name__ == "__main__":
    # Initialize SDK
    sdk = ScrubiMailSDK('your-api-key')
    
    try:
        # Validate single email
        result = sdk.validate_email('user@example.com')
        print("Single validation result:", result)
        
        # Validate bulk emails with progress
        emails = ['user1@example.com', 'user2@example.com']
        
        def progress_callback(status):
            print(f"Progress: {status.get('progress', 0)}%")
        
        bulk_result = sdk.validate_bulk_with_progress(emails, progress_callback)
        print("Bulk validation result:", bulk_result)
        
        # Get analytics
        analytics = sdk.get_validation_analytics(
            start_date='2024-01-01',
            end_date='2024-01-31'
        )
        print("Analytics:", analytics)
        
    except ScrubiMailError as e:
        print(f"ScrubiMail API Error: {e}")
    except ValueError as e:
        print(f"Validation Error: {e}")
    except Exception as e:
        print(f"Unexpected Error: {e}")