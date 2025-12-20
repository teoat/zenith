# Error Codes and API Responses

Comprehensive error documentation for Zenith Fraud Detection Platform API.

## 🚨 Error Response Format

All API errors follow a consistent format:

```json
{
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Request validation failed",
    "details": {
      "field": "amount",
      "issue": "Amount must be greater than 0"
    },
    "timestamp": "2025-12-20T18:30:00Z",
    "request_id": "req_123456789"
  }
}
```

### Response Structure
- **code**: Unique error identifier
- **message**: Human-readable error description
- **details**: Additional context about the error
- **timestamp**: When the error occurred
- **request_id**: Unique request identifier for debugging

## 📊 HTTP Status Codes

### Success Codes
- **200 OK**: Request successful
- **201 Created**: Resource created successfully
- **202 Accepted**: Request accepted for processing
- **204 No Content**: Request successful, no content returned

### Client Error Codes (4xx)
- **400 Bad Request**: Invalid request format or data
- **401 Unauthorized**: Authentication required or failed
- **403 Forbidden**: Insufficient permissions
- **404 Not Found**: Resource not found
- **409 Conflict**: Resource conflict or duplicate
- **422 Unprocessable Entity**: Validation errors
- **429 Too Many Requests**: Rate limit exceeded

### Server Error Codes (5xx)
- **500 Internal Server Error**: Unexpected server error
- **502 Bad Gateway**: Upstream service error
- **503 Service Unavailable**: Service temporarily unavailable
- **504 Gateway Timeout**: Upstream service timeout

## 🔐 Authentication Errors

### AUTH_001 - Invalid Credentials
```json
{
  "error": {
    "code": "AUTH_001",
    "message": "Invalid email or password",
    "details": {
      "attempt": 3,
      "next_allowed": "2025-12-20T18:35:00Z"
    }
  }
}
```

**Causes**: Incorrect email/password combination  
**Solution**: Verify credentials, check for typos

### AUTH_002 - Account Locked
```json
{
  "error": {
    "code": "AUTH_002", 
    "message": "Account locked due to multiple failed attempts",
    "details": {
      "lock_duration": "30 minutes",
      "unlock_method": "email_verification"
    }
  }
}
```

**Causes**: Too many failed login attempts  
**Solution**: Wait for lock period or use email verification

### AUTH_003 - Token Expired
```json
{
  "error": {
    "code": "AUTH_003",
    "message": "Authentication token has expired",
    "details": {
      "expired_at": "2025-12-20T17:30:00Z",
      "refresh_available": true
    }
  }
}
```

**Causes**: JWT token expired  
**Solution**: Use refresh token or re-authenticate

### AUTH_004 - Invalid Token
```json
{
  "error": {
    "code": "AUTH_004",
    "message": "Invalid authentication token",
    "details": {
      "token_type": "access_token",
      "issue": "malformed_or_tampered"
    }
  }
}
```

**Causes**: Token malformed or tampered  
**Solution**: Re-authenticate to get new token

## 📝 Validation Errors

### VALIDATION_001 - Missing Required Field
```json
{
  "error": {
    "code": "VALIDATION_001",
    "message": "Required field is missing",
    "details": {
      "field": "email",
      "required": true,
      "received": null
    }
  }
}
```

**Causes**: Required field not provided in request  
**Solution**: Include all required fields in request

### VALIDATION_002 - Invalid Email Format
```json
{
  "error": {
    "code": "VALIDATION_002",
    "message": "Invalid email format",
    "details": {
      "field": "email",
      "provided": "user@example",
      "expected_format": "user@domain.com"
    }
  }
}
```

**Causes**: Email doesn't match required format  
**Solution**: Use valid email address format

### VALIDATION_003 - Invalid Amount
```json
{
  "error": {
    "code": "VALIDATION_003",
    "message": "Invalid transaction amount",
    "details": {
      "field": "amount",
      "provided": "-50.00",
      "constraints": {
        "min": 0.01,
        "max": 999999.99,
        "type": "decimal"
      }
    }
  }
}
```

**Causes**: Amount outside valid range or wrong type  
**Solution**: Use positive decimal within limits

### VALIDATION_004 - Invalid Date Format
```json
{
  "error": {
    "code": "VALIDATION_004",
    "message": "Invalid date format",
    "details": {
      "field": "transaction_date",
      "provided": "20/12/2025",
      "expected_format": "YYYY-MM-DD"
    }
  }
}
```

**Causes**: Date doesn't match ISO 8601 format  
**Solution**: Use YYYY-MM-DD format

## 🔒 Authorization Errors

### AUTHZ_001 - Insufficient Permissions
```json
{
  "error": {
    "code": "AUTHZ_001",
    "message": "Insufficient permissions for this action",
    "details": {
      "required_permission": "cases:write",
      "user_permissions": ["cases:read"],
      "resource": "case_12345"
    }
  }
}
```

**Causes**: User lacks required permission  
**Solution**: Contact administrator for required permissions

### AUTHZ_002 - Resource Access Denied
```json
{
  "error": {
    "code": "AUTHZ_002",
    "message": "Access to resource denied",
    "details": {
      "resource": "case_67890",
      "resource_type": "fraud_case",
      "owner": "user_456",
      "reason": "not_assigned_to_case"
    }
  }
}
```

**Causes**: User not assigned to resource  
**Solution**: Get proper assignment or permissions

## 🚫 Rate Limiting Errors

### RATE_001 - Rate Limit Exceeded
```json
{
  "error": {
    "code": "RATE_001",
    "message": "API rate limit exceeded",
    "details": {
      "limit": 1000,
      "window": "1 hour",
      "current_usage": 1001,
      "reset_time": "2025-12-20T19:30:00Z"
    }
  }
}
```

**Causes**: Too many requests in time window  
**Solution**: Wait for reset or reduce request frequency

### RATE_002 - Concurrent Request Limit
```json
{
  "error": {
    "code": "RATE_002",
    "message": "Too many concurrent requests",
    "details": {
      "max_concurrent": 10,
      "current_requests": 11,
      "retry_after": "5 seconds"
    }
  }
}
```

**Causes**: Exceeded concurrent request limit  
**Solution**: Implement request queuing or throttling

## 🏢 Business Logic Errors

### BUSINESS_001 - Case Already Closed
```json
{
  "error": {
    "code": "BUSINESS_001",
    "message": "Cannot modify closed case",
    "details": {
      "case_id": "case_12345",
      "status": "closed",
      "closed_at": "2025-12-19T15:30:00Z",
      "allowed_actions": ["view", "reopen"]
    }
  }
}
```

**Causes**: Attempting to modify closed case  
**Solution**: Reopen case or create new case

### BUSINESS_002 - Duplicate Transaction
```json
{
  "error": {
    "code": "BUSINESS_002",
    "message": "Transaction already processed",
    "details": {
      "transaction_id": "txn_67890",
      "original_timestamp": "2025-12-20T10:15:00Z",
      "current_timestamp": "2025-12-20T10:16:00Z"
    }
  }
}
```

**Causes**: Attempting to process duplicate transaction  
**Solution**: Use existing transaction ID or create new transaction

### BUSINESS_003 - Insufficient Evidence
```json
{
  "error": {
    "code": "BUSINESS_003",
    "message": "Insufficient evidence for analysis",
    "details": {
      "required_evidence": ["transaction_data", "user_history"],
      "provided_evidence": ["transaction_data"],
      "missing_evidence": ["user_history"]
    }
  }
}
```

**Causes**: Required evidence not available  
**Solution**: Collect and provide required evidence

## 🔍 Data Not Found Errors

### NOT_FOUND_001 - Case Not Found
```json
{
  "error": {
    "code": "NOT_FOUND_001",
    "message": "Case not found",
    "details": {
      "case_id": "case_99999",
      "search_criteria": {
        "id": "case_99999",
        "status": "any"
      }
    }
  }
}
```

**Causes**: Case ID doesn't exist  
**Solution**: Verify case ID or search for correct case

### NOT_FOUND_002 - Evidence Not Found
```json
{
  "error": {
    "code": "NOT_FOUND_002",
    "message": "Evidence file not found",
    "details": {
      "evidence_id": "evid_12345",
      "file_name": "transaction_receipt.pdf",
      "upload_date": "2025-12-19T14:20:00Z"
    }
  }
}
```

**Causes**: Evidence file deleted or moved  
**Solution**: Re-upload evidence or verify file path

### NOT_FOUND_003 - User Not Found
```json
{
  "error": {
    "code": "NOT_FOUND_003",
    "message": "User not found",
    "details": {
      "user_id": "user_99999",
      "search_field": "user_id",
      "last_seen": "2025-12-15T09:30:00Z"
    }
  }
}
```

**Causes**: User ID doesn't exist or user deleted  
**Solution**: Verify user ID or check active users

## 🛡️ Security Errors

### SECURITY_001 - Suspicious Activity Detected
```json
{
  "error": {
    "code": "SECURITY_001",
    "message": "Suspicious activity detected",
    "details": {
      "activity_type": "unusual_login_pattern",
      "risk_score": 0.85,
      "actions_taken": ["temporary_account_lock"],
      "verification_required": true
    }
  }
}
```

**Causes**: Unusual user activity pattern detected  
**Solution**: Complete identity verification process

### SECURITY_002 - IP Address Blocked
```json
{
  "error": {
    "code": "SECURITY_002",
    "message": "IP address blocked",
    "details": {
      "ip_address": "192.168.1.100",
      "block_reason": "malicious_activity_detected",
      "block_duration": "24 hours",
      "appeal_url": "https://Zenith.com/appeal"
    }
  }
}
```

**Causes**: IP address flagged for suspicious activity  
**Solution**: Contact support or use different IP address

## 🔧 System Errors

### SYSTEM_001 - Database Connection Error
```json
{
  "error": {
    "code": "SYSTEM_001",
    "message": "Database connection temporarily unavailable",
    "details": {
      "service": "user_database",
      "retry_after": "30 seconds",
      "outage_id": "outage_12345"
    }
  }
}
```

**Causes**: Database maintenance or connectivity issues  
**Solution**: Wait and retry request

### SYSTEM_002 - External Service Unavailable
```json
{
  "error": {
    "code": "SYSTEM_002",
    "message": "External payment processor unavailable",
    "details": {
      "service": "stripe_api",
      "service_status": "down",
      "estimated_recovery": "2025-12-20T19:00:00Z",
      "alternative_services": ["paypal", "square"]
    }
  }
}
```

**Causes**: Third-party service outage  
**Solution**: Use alternative service or wait for recovery

### SYSTEM_003 - File Upload Failed
```json
{
  "error": {
    "code": "SYSTEM_003",
    "message": "File upload processing failed",
    "details": {
      "file_name": "evidence.pdf",
      "file_size": "15.2MB",
      "max_allowed_size": "10MB",
      "supported_formats": ["pdf", "jpg", "png", "docx"]
    }
  }
}
```

**Causes**: File too large or unsupported format  
**Solution**: Compress file or use supported format

## 📋 Error Handling Best Practices

### Client-Side Error Handling
```javascript
try {
  const response = await fetch('/api/cases', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(caseData)
  });
  
  if (!response.ok) {
    const errorData = await response.json();
    
    // Handle specific error types
    switch (errorData.error.code) {
      case 'VALIDATION_001':
        showFieldError(errorData.error.details.field, errorData.error.message);
        break;
      case 'AUTH_003':
        refreshToken();
        break;
      case 'RATE_001':
        showRateLimitError(errorData.error.details.reset_time);
        break;
      default:
        showGenericError(errorData.error.message);
    }
  }
  
  const data = await response.json();
  updateUI(data);
  
} catch (error) {
  if (error.name === 'TypeError') {
    showNetworkError();
  } else {
    showUnexpectedError(error.message);
  }
}
```

### Server-Side Error Logging
```python
import logging
from fastapi import HTTPException
from app.models.error_response import ErrorResponse

logger = logging.getLogger(__name__)

def handle_error(error: Exception, request_id: str) -> ErrorResponse:
    """Handle and log errors consistently"""
    
    # Log error with context
    logger.error(
        f"Request {request_id} failed: {type(error).__name__}",
        extra={
            "request_id": request_id,
            "error_type": type(error).__name__,
            "error_message": str(error),
            "user_id": getattr(error, 'user_id', None)
        }
    )
    
    # Create standardized error response
    if isinstance(error, HTTPException):
        return ErrorResponse(
            code=error.detail.get('code', 'HTTP_ERROR'),
            message=error.detail.get('message', str(error)),
            details=error.detail.get('details', {}),
            request_id=request_id
        )
    else:
        return ErrorResponse(
            code="INTERNAL_ERROR",
            message="An unexpected error occurred",
            details={"error_id": request_id},
            request_id=request_id
        )
```

### Retry Logic Implementation
```python
import time
import random
from typing import Callable, Any

def retry_with_backoff(
    func: Callable,
    max_retries: int = 3,
    base_delay: float = 1.0,
    max_delay: float = 60.0
) -> Any:
    """Retry function with exponential backoff"""
    
    for attempt in range(max_retries + 1):
        try:
            return func()
        except Exception as e:
            if attempt == max_retries:
                raise e
            
            # Calculate delay with jitter
            delay = min(base_delay * (2 ** attempt) + random.uniform(0, 1), max_delay)
            
            logger.warning(
                f"Attempt {attempt + 1} failed, retrying in {delay:.2f}s",
                extra={"error": str(e), "attempt": attempt + 1}
            )
            
            time.sleep(delay)
```

## 🎯 Troubleshooting Guide

### Common Error Scenarios

#### 1. Authentication Failures
**Symptoms**: 401 errors on all requests  
**Solutions**:
- Check token expiration and refresh if needed
- Verify API token is correctly formatted
- Check token scopes match required permissions

#### 2. Validation Errors
**Symptoms**: 422 errors with field details  
**Solutions**:
- Review error details for specific field issues
- Check request format against API documentation
- Validate data types and constraints

#### 3. Rate Limiting
**Symptoms**: 429 errors after many requests  
**Solutions**:
- Implement request throttling in client
- Use exponential backoff for retries
- Consider higher tier API plan

#### 4. Network Issues
**Symptoms**: Connection timeouts or 5xx errors  
**Solutions**:
- Check network connectivity
- Verify DNS resolution for api.Zenith.com
- Try alternative network or VPN

### Debug Information
Include this information when reporting issues:

```json
{
  "request_id": "req_123456789",
  "timestamp": "2025-12-20T18:30:00Z",
  "endpoint": "/api/cases",
  "method": "POST",
  "error_code": "VALIDATION_002",
  "error_details": {...},
  "client_version": "1.2.3",
  "user_agent": "YourApp/1.0"
}
```

---

For additional support with error handling, see [API Examples](../examples/) or contact our [Technical Support](mailto:support@Zenith.com).