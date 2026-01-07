# Zenith Fraud Detection Platform API Documentation

## Overview

The Zenith Fraud Detection Platform provides comprehensive fraud detection and investigation capabilities through a secure REST API. This documentation covers all endpoints, security measures, and integration guidelines.

## Security Features

### 🔒 Authentication & Authorization
- **JWT-based authentication** with configurable expiration
- **Role-based access control** (RBAC) with granular permissions
- **Multi-factor authentication** (MFA) support
- **Session management** with secure token handling

### 🛡️ Security Headers
All API responses include comprehensive security headers:
```
X-Content-Type-Options: nosniff
X-Frame-Options: DENY
X-XSS-Protection: 1; mode=block
Content-Security-Policy: default-src 'self'; ...
Strict-Transport-Security: max-age=31536000; includeSubDomains; preload
```

### 🔐 Data Encryption
- **Database field encryption** using Fernet (AES 128)
- **Secure key rotation** support
- **Encrypted sensitive data** storage
- **Cryptographic signatures** for data integrity

## API Endpoints

### Authentication Endpoints

#### POST /auth/login
Authenticate user and receive JWT tokens.

**Request Body:**
```json
{
  "username": "string",
  "password": "string",
  "mfa_code": "string (optional)"
}
```

**Response:**
```json
{
  "access_token": "eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9...",
  "refresh_token": "eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9...",
  "token_type": "bearer",
  "expires_in": 3600,
  "user": {
    "id": "string",
    "username": "string",
    "role": "string",
    "mfa_enabled": true
  }
}
```

**Security Notes:**
- Passwords are hashed using bcrypt
- Failed login attempts are rate-limited
- MFA codes are validated server-side
- Tokens include user permissions

#### POST /auth/register
Register new user account.

**Request Body:**
```json
{
  "username": "string",
  "email": "string",
  "password": "string",
  "role": "analyst | investigator | admin"
}
```

**Security Notes:**
- Password strength validation enforced
- Email verification required
- Account approval workflow for sensitive roles

#### POST /auth/refresh
Refresh access token using refresh token.

**Request Body:**
```json
{
  "refresh_token": "string"
}
```

### Case Management Endpoints

#### GET /cases
Retrieve paginated list of cases.

**Query Parameters:**
- `page`: Page number (default: 1)
- `per_page`: Items per page (default: 20, max: 100)
- `status`: Filter by status
- `priority`: Filter by priority
- `assignee_id`: Filter by assignee

**Response:**
```json
{
  "cases": [
    {
      "id": "string",
      "title": "string",
      "description": "string (encrypted)",
      "status": "open | investigating | closed",
      "priority": "low | medium | high | critical",
      "assignee_id": "string",
      "created_at": "2024-01-01T00:00:00Z",
      "updated_at": "2024-01-01T00:00:00Z"
    }
  ],
  "pagination": {
    "page": 1,
    "per_page": 20,
    "total": 150,
    "pages": 8
  }
}
```

#### POST /cases
Create new investigation case.

**Request Body:**
```json
{
  "title": "Suspicious Transaction Pattern",
  "description": "Multiple high-value transactions from new account",
  "priority": "high",
  "tags": ["fraud", "transaction"],
  "initial_evidence": [
    {
      "type": "transaction_log",
      "data": {...}
    }
  ]
}
```

### Fraud Detection Endpoints

#### POST /fraud/analyze
Analyze transaction or activity for fraud indicators.

**Request Body:**
```json
{
  "transaction": {
    "id": "string",
    "amount": 15000.00,
    "user_id": "string",
    "timestamp": "2024-01-01T10:00:00Z",
    "metadata": {
      "ip_address": "192.168.1.1",
      "user_agent": "Mozilla/5.0...",
      "location": "New York, NY"
    }
  },
  "analysis_type": "realtime | batch",
  "rules_to_check": ["velocity_check", "location_anomaly", "amount_spike"]
}
```

**Response:**
```json
{
  "transaction_id": "string",
  "risk_score": 0.85,
  "risk_level": "high",
  "alerts": [
    {
      "rule": "velocity_check",
      "severity": "high",
      "description": "Unusual transaction velocity detected",
      "confidence": 0.92
    }
  ],
  "recommendations": [
    "Flag for manual review",
    "Temporarily freeze account",
    "Send verification email"
  ]
}
```

### File Upload Endpoints

#### POST /metadata/extract
Extract metadata from uploaded files for forensic analysis.

**Request:**
- Content-Type: `multipart/form-data`
- File: Document or image file

**Security Measures:**
- File type validation
- Size limits (max 10MB)
- Virus scanning (if configured)
- Secure temporary file handling
- No execution of uploaded content

**Response:**
```json
{
  "file_info": {
    "filename": "document.pdf",
    "size": 2048576,
    "mime_type": "application/pdf",
    "hash": "sha256:..."
  },
  "metadata": {
    "creation_date": "2024-01-01T00:00:00Z",
    "author": "John Doe",
    "last_modified": "2024-01-01T00:00:00Z",
    "software": "Microsoft Word"
  },
  "forensic_flags": [
    {
      "type": "metadata_manipulation",
      "severity": "medium",
      "description": "Creation date appears modified"
    }
  ]
}
```

## Rate Limiting

API endpoints implement rate limiting to prevent abuse:

- **Authentication endpoints**: 5 requests per minute per IP
- **Data retrieval endpoints**: 100 requests per minute per user
- **Analysis endpoints**: 50 requests per minute per user
- **File upload endpoints**: 10 requests per hour per user

Rate limit headers are included in all responses:
```
X-RateLimit-Limit: 100
X-RateLimit-Remaining: 95
X-RateLimit-Reset: 1638360000
```

## Error Handling

### Standard Error Response Format
```json
{
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Input validation failed",
    "details": {
      "field": "username",
      "reason": "required"
    }
  },
  "request_id": "req_123456789",
  "timestamp": "2024-01-01T00:00:00Z"
}
```

### Common Error Codes
- `VALIDATION_ERROR`: Invalid input data
- `AUTHENTICATION_ERROR`: Invalid credentials
- `AUTHORIZATION_ERROR`: Insufficient permissions
- `RATE_LIMIT_EXCEEDED`: Too many requests
- `RESOURCE_NOT_FOUND`: Entity not found
- `INTERNAL_ERROR`: Server error (generic)

## Data Privacy & Compliance

### GDPR Compliance
- **Data minimization**: Only collect necessary data
- **Purpose limitation**: Data used only for stated purposes
- **Storage limitation**: Data retained only as long as needed
- **Right to erasure**: User data deletion capabilities
- **Data portability**: Export user data in standard formats

### Encryption Standards
- **AES-128 encryption** for sensitive data
- **Fernet tokens** for secure data exchange
- **bcrypt hashing** for passwords
- **HMAC signatures** for data integrity

## Monitoring & Logging

### Application Metrics
- Request/response times
- Error rates by endpoint
- Database query performance
- Cache hit/miss ratios
- Security event counts

### Security Event Logging
All security events are logged with structured data:
```json
{
  "timestamp": "2024-01-01T00:00:00Z",
  "event_type": "login_attempt",
  "user_id": "user123",
  "ip_address": "192.168.1.1",
  "user_agent": "Mozilla/5.0...",
  "success": false,
  "failure_reason": "invalid_password"
}
```

## Integration Guidelines

### Client Implementation
```javascript
// Authentication
const login = async (username, password) => {
  const response = await fetch('/auth/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ username, password })
  });

  const data = await response.json();
  localStorage.setItem('access_token', data.access_token);
  return data;
};

// API Requests with Token
const apiRequest = async (endpoint, options = {}) => {
  const token = localStorage.getItem('access_token');
  return fetch(endpoint, {
    ...options,
    headers: {
      ...options.headers,
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    }
  });
};
```

### Error Handling
```javascript
try {
  const response = await apiRequest('/cases');
  if (!response.ok) {
    const error = await response.json();
    handleApiError(error);
  }
  const data = await response.json();
  return data;
} catch (error) {
  console.error('Network error:', error);
  showNetworkError();
}
```

## Deployment Considerations

### Environment Variables
See `ENVIRONMENT_CONFIGURATION.md` for complete setup guide.

### Health Checks
- `GET /health`: Application health status
- `GET /health/database`: Database connectivity
- `GET /health/redis`: Cache connectivity

### Monitoring Endpoints
- `GET /metrics`: Prometheus metrics
- `GET /monitoring/dashboard`: System dashboard

## Security Best Practices

1. **Always use HTTPS** in production
2. **Validate all inputs** on server-side
3. **Implement proper CORS** policies
4. **Use secure session management**
5. **Monitor for suspicious activity**
6. **Regular security updates**
7. **Log security events** appropriately
8. **Implement proper error handling**

## Support

For API integration support or security concerns:
- **Documentation**: This document and inline API docs
- **Security Issues**: Report immediately to security team
- **General Support**: API status and integration guides

---

*Last updated: January 2026*
*Security review: All endpoints implement OWASP security guidelines*