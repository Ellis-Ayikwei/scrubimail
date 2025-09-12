#!/bin/bash

# ScrubiMail cURL Examples
# Official cURL examples for the ScrubiMail Email Validation API
# 
# Version: 1.0.0
# Author: ScrubiMail Team

# Set your API key here
API_KEY="your-api-key-here"
BASE_URL="https://api.scrubimail.com/scrubimail/api/v1"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Function to print colored output
print_header() {
    echo -e "${BLUE}=== $1 ===${NC}"
}

print_success() {
    echo -e "${GREEN}✓ $1${NC}"
}

print_error() {
    echo -e "${RED}✗ $1${NC}"
}

print_info() {
    echo -e "${YELLOW}ℹ $1${NC}"
}

# Check if API key is set
if [ "$API_KEY" = "your-api-key-here" ]; then
    print_error "Please set your API key in the API_KEY variable"
    exit 1
fi

# Function to make API request with error handling
make_request() {
    local method=$1
    local endpoint=$2
    local data=$3
    local description=$4
    
    print_header "$description"
    
    if [ -n "$data" ]; then
        response=$(curl -s -w "\nHTTP_STATUS:%{http_code}" \
            -X "$method" \
            -H "Authorization: Bearer $API_KEY" \
            -H "Content-Type: application/json" \
            -H "User-Agent: ScrubiMail-cURL-Examples/1.0.0" \
            -d "$data" \
            "$BASE_URL$endpoint")
    else
        response=$(curl -s -w "\nHTTP_STATUS:%{http_code}" \
            -X "$method" \
            -H "Authorization: Bearer $API_KEY" \
            -H "Content-Type: application/json" \
            -H "User-Agent: ScrubiMail-cURL-Examples/1.0.0" \
            "$BASE_URL$endpoint")
    fi
    
    # Extract HTTP status and body
    http_status=$(echo "$response" | grep "HTTP_STATUS:" | cut -d: -f2)
    body=$(echo "$response" | sed '/HTTP_STATUS:/d')
    
    if [ "$http_status" -ge 200 ] && [ "$http_status" -lt 300 ]; then
        print_success "Request successful (HTTP $http_status)"
        echo "$body" | python3 -m json.tool 2>/dev/null || echo "$body"
    else
        print_error "Request failed (HTTP $http_status)"
        echo "$body" | python3 -m json.tool 2>/dev/null || echo "$body"
    fi
    
    echo ""
}

# 1. Single Email Validation
make_request "POST" "/validate/" '{
    "email": "user@example.com",
    "real_time": true
}' "Single Email Validation"

# 2. Bulk Email Validation
bulk_response=$(curl -s \
    -X POST \
    -H "Authorization: Bearer $API_KEY" \
    -H "Content-Type: application/json" \
    -d '{
        "emails": ["user1@example.com", "user2@example.com", "invalid-email"]
    }' \
    "$BASE_URL/validate-bulk/")

print_header "Bulk Email Validation"
echo "$bulk_response" | python3 -m json.tool 2>/dev/null || echo "$bulk_response"

# Extract job ID for status check
job_id=$(echo "$bulk_response" | python3 -c "import sys, json; print(json.load(sys.stdin).get('job_id', ''))" 2>/dev/null)

if [ -n "$job_id" ] && [ "$job_id" != "" ]; then
    print_info "Bulk job submitted with ID: $job_id"
    
    # 3. Check Bulk Job Status
    sleep 2  # Wait a bit before checking status
    make_request "GET" "/bulk-status/$job_id/" "" "Bulk Job Status Check"
else
    print_error "Could not extract job ID from bulk validation response"
fi

# 4. Get Validation History
make_request "GET" "/history/?page=1&page_size=5" "" "Validation History (First 5 Results)"

# 5. Get Validation Analytics
make_request "GET" "/analytics/" "" "Validation Analytics"

# 6. Get Domain Reputation
make_request "GET" "/domain-reputation/example.com/" "" "Domain Reputation Check"

# 7. Advanced Analytics with Date Range
start_date=$(date -d '30 days ago' '+%Y-%m-%d')
end_date=$(date '+%Y-%m-%d')
make_request "GET" "/analytics/?start_date=$start_date&end_date=$end_date" "" "Analytics with Date Range"

# 8. Filtered Validation History
make_request "GET" "/history/?status=completed&page_size=3" "" "Filtered Validation History (Completed Only)"

print_header "All Examples Completed"
print_info "Check the responses above for your API integration"

# Advanced example: Bulk validation with polling
print_header "Advanced Example: Bulk Validation with Polling"

# Submit bulk job
bulk_data='{
    "emails": [
        "test1@example.com",
        "test2@example.com", 
        "test3@example.com",
        "invalid@",
        "another@test.com"
    ]
}'

print_info "Submitting bulk validation job..."
bulk_response=$(curl -s \
    -X POST \
    -H "Authorization: Bearer $API_KEY" \
    -H "Content-Type: application/json" \
    -d "$bulk_data" \
    "$BASE_URL/validate-bulk/")

job_id=$(echo "$bulk_response" | python3 -c "import sys, json; print(json.load(sys.stdin).get('job_id', ''))" 2>/dev/null)

if [ -n "$job_id" ] && [ "$job_id" != "" ]; then
    print_success "Bulk job submitted with ID: $job_id"
    
    # Poll for completion
    max_attempts=30
    attempt=0
    
    while [ $attempt -lt $max_attempts ]; do
        print_info "Checking job status (attempt $((attempt + 1))/$max_attempts)..."
        
        status_response=$(curl -s \
            -H "Authorization: Bearer $API_KEY" \
            -H "Content-Type: application/json" \
            "$BASE_URL/bulk-status/$job_id/")
        
        status=$(echo "$status_response" | python3 -c "import sys, json; print(json.load(sys.stdin).get('status', ''))" 2>/dev/null)
        progress=$(echo "$status_response" | python3 -c "import sys, json; print(json.load(sys.stdin).get('progress', 0))" 2>/dev/null)
        
        print_info "Status: $status, Progress: $progress%"
        
        if [ "$status" = "completed" ] || [ "$status" = "failed" ]; then
            print_success "Job completed with status: $status"
            echo "$status_response" | python3 -m json.tool 2>/dev/null || echo "$status_response"
            break
        fi
        
        sleep 2
        attempt=$((attempt + 1))
    done
    
    if [ $attempt -eq $max_attempts ]; then
        print_error "Job did not complete within the timeout period"
    fi
else
    print_error "Could not extract job ID from bulk validation response"
fi

print_header "Script Completed"
print_info "For more examples and documentation, visit: https://docs.scrubimail.com"