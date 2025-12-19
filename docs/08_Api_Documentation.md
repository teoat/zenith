# Fraud Detection Platform API Documentation

**Version:** 1.0.0
**Base URL:** `https://api.fraud-detection-378x492.com/v1`
**Authentication:** JWT Bearer Token
**Generated:** 2025-12-17
**Total Endpoints:** 85+

## Table of Contents

- [Authentication](#authentication)
- [Case Management](#case-management)
- [Evidence Management](#evidence-management)
- [AI and Fraud Detection](#ai-and-fraud-detection)
- [User Management](#user-management)
- [Administrative Functions](#administrative-functions)
- [Reporting and Analytics](#reporting-and-analytics)
- [Reconciliation](#reconciliation)
- [System Health](#system-health)
- [Error Handling](#error-handling)

---

## Authentication

### POST /auth/login
Authenticate user and receive JWT token.

**Request:**
```json
{
  "username": "investigator@example.com",
  "password": "secure_password",
  "mfa_code": "123456"
}
```

**Response:**
```json
{
  "access_token": "eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9...",
  "token_type": "bearer",
  "expires_in": 3600,
  "user": {
    "id": 123,
    "username": "investigator@example.com",
    "role": "investigator"
  }
}
```

### POST /auth/refresh
Refresh expired JWT token.

**Request:**
```json
{
  "refresh_token": "eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9..."
}
```

### POST /auth/logout
Invalidate current session.

---

## Case Management

### POST /cases
Create a new investigation case.

**Request:**
```json
{
  "title": "Suspicious Transaction Investigation",
  "description": "Investigation of unusual fund transfers",
  "priority": "high",
  "assignee_id": 123,
  "tags": ["fraud", "transfers"],
  "metadata": {
    "amount": 50000,
    "currency": "USD"
  }
}
```

**Response:**
```json
{
  "id": 456,
  "title": "Suspicious Transaction Investigation",
  "status": "open",
  "created_at": "2025-12-17T10:00:00Z",
  "updated_at": "2025-12-17T10:00:00Z"
}
```

### GET /cases
List cases with filtering and pagination.

**Query Parameters:**
- `status` - Filter by case status (open, investigating, closed)
- `priority` - Filter by priority (low, medium, high, critical)
- `assignee_id` - Filter by assigned user
- `page` - Page number (default: 1)
- `limit` - Items per page (default: 20)
- `search` - Search in title and description

**Response:**
```json
{
  "cases": [
    {
      "id": 456,
      "title": "Suspicious Transaction Investigation",
      "status": "investigating",
      "priority": "high",
      "assignee": {
        "id": 123,
        "name": "John Investigator"
      },
      "created_at": "2025-12-17T10:00:00Z",
      "updated_at": "2025-12-17T11:30:00Z"
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 20,
    "total": 1,
    "pages": 1
  }
}
```

### GET /cases/{id}
Get detailed case information.

**Response:**
```json
{
  "id": 456,
  "title": "Suspicious Transaction Investigation",
  "description": "Investigation of unusual fund transfers",
  "status": "investigating",
  "priority": "high",
  "assignee": {
    "id": 123,
    "name": "John Investigator"
  },
  "created_at": "2025-12-17T10:00:00Z",
  "updated_at": "2025-12-17T11:30:00Z",
  "tags": ["fraud", "transfers"],
  "evidence_count": 15,
  "comments_count": 3,
  "metadata": {
    "amount": 50000,
    "currency": "USD",
    "risk_score": 85
  }
}
```

### PUT /cases/{id}
Update case details.

**Request:**
```json
{
  "title": "Updated Investigation Title",
  "status": "closed",
  "priority": "medium",
  "assignee_id": 124
}
```

### DELETE /cases/{id}
Archive case (soft delete).

### POST /cases/{id}/comments
Add comment to case.

**Request:**
```json
{
  "content": "Found suspicious pattern in transaction data",
  "is_internal": false
}
```

### GET /cases/{id}/comments
Get case discussion thread.

---

## Evidence Management

### POST /cases/{case_id}/evidence
Upload evidence to case.

**Content-Type:** `multipart/form-data`

**Form Data:**
- `file` - Evidence file
- `title` - Evidence title
- `description` - Evidence description
- `type` - Evidence type (document, image, video, audio)
- `metadata` - Additional metadata (JSON)

**Response:**
```json
{
  "id": 789,
  "title": "Bank Statement Q4 2025",
  "filename": "statement_q4_2025.pdf",
  "type": "document",
  "size": 2457600,
  "uploaded_at": "2025-12-17T12:00:00Z",
  "processed": true,
  "ocr_text": "...extracted text content...",
  "ai_analysis": {
    "risk_score": 75,
    "key_entities": ["John Doe", "ABC Bank"],
    "suspicious_patterns": ["large_transfer", "offshore_account"]
  }
}
```

### GET /cases/{case_id}/evidence
List evidence for case.

**Response:**
```json
{
  "evidence": [
    {
      "id": 789,
      "title": "Bank Statement Q4 2025",
      "type": "document",
      "size": 2457600,
      "uploaded_at": "2025-12-17T12:00:00Z",
      "processed": true
    }
  ]
}
```

### GET /evidence/{id}
Get evidence details and download URL.

### PUT /evidence/{id}
Update evidence metadata.

### DELETE /evidence/{id}
Remove evidence from case.

### GET /evidence/{id}/download
Download evidence file.

---

## AI and Fraud Detection

### POST /ai/analyze
Perform fraud analysis on transaction data.

**Request:**
```json
{
  "transactions": [
    {
      "amount": 5000.00,
      "merchant": "Suspicious Vendor LLC",
      "timestamp": "2025-12-17T10:30:00Z",
      "location": "New York, NY"
    }
  ],
  "context": {
    "user_history": "First time transaction with this merchant",
    "account_balance": 10000,
    "previous_transactions": 45
  }
}
```

**Response:**
```json
{
  "analysis": {
    "overall_risk_score": 85,
    "confidence": 0.92,
    "fraud_probability": 0.78,
    "recommendation": "INVESTIGATE",
    "flags": [
      {
        "type": "high_amount",
        "severity": "medium",
        "description": "Transaction amount significantly above average"
      },
      {
        "type": "new_merchant",
        "severity": "low",
        "description": "First transaction with this merchant"
      }
    ],
    "insights": [
      "Transaction occurs during unusual hours",
      "Merchant has history of chargebacks",
      "Amount matches known fraud patterns"
    ]
  }
}
```

### POST /ai/predict
Manual fraud prediction for single transaction.

**Request:**
```json
{
  "amount": 5000.00,
  "merchant_name": "Suspicious Vendor",
  "date": "2025-12-17T10:30:00Z",
  "location": "New York, NY",
  "user_history": 45
}
```

**Response:**
```json
{
  "prediction": {
    "score": 85.7,
    "confidence": 0.92,
    "is_fraud": true,
    "explanation": "High transaction amount with unusual merchant pattern and timing"
  }
}
```

### POST /ai/batch-predict
Bulk fraud analysis for multiple transactions.

**Request:**
```json
{
  "transactions": [
    {
      "amount": 5000.00,
      "merchant": "Vendor A",
      "date": "2025-12-17T10:30:00Z"
    },
    {
      "amount": 2500.00,
      "merchant": "Vendor B",
      "date": "2025-12-17T11:15:00Z"
    }
  ]
}
```

### GET /ai/models
List available ML models and their performance metrics.

**Response:**
```json
{
  "models": [
    {
      "id": "isolation_forest_v2",
      "name": "Isolation Forest v2.0",
      "version": "2.0.1",
      "status": "active",
      "accuracy": 0.94,
      "precision": 0.89,
      "recall": 0.91,
      "last_trained": "2025-12-15T08:00:00Z",
      "training_samples": 1000000
    }
  ]
}
```

### POST /ai/chat
Interactive chat with AI assistant personas.

**Request:**
```json
{
  "persona": "fraud_analyst",
  "message": "Analyze this transaction pattern for potential fraud",
  "context": {
    "case_id": 456,
    "evidence_ids": [789, 790]
  }
}
```

**Response:**
```json
{
  "response": "Based on the transaction patterns, I identify several red flags...",
  "confidence": 0.87,
  "suggestions": [
    "Review merchant verification documents",
    "Check for similar patterns in other cases",
    "Escalate to senior investigator"
  ],
  "follow_up_questions": [
    "Do you have additional transaction history?",
    "Are there any known associates of the account holder?"
  ]
}
```

### POST /ai/analyze-document
AI-powered document analysis and insights extraction.

**Request:**
```json
{
  "document_id": 789,
  "analysis_type": "fraud_detection",
  "focus_areas": ["financial_amounts", "entity_extraction", "risk_patterns"]
}
```

**Response:**
```json
{
  "analysis": {
    "document_type": "bank_statement",
    "extracted_entities": [
      {"type": "person", "name": "John Doe", "confidence": 0.95},
      {"type": "organization", "name": "ABC Bank", "confidence": 0.98}
    ],
    "financial_data": {
      "total_credits": 150000,
      "total_debits": 145000,
      "suspicious_transactions": [
        {
          "amount": 50000,
          "recipient": "XYZ Corp",
          "risk_score": 85,
          "reason": "Unusual amount and recipient"
        }
      ]
    },
    "insights": [
      "Multiple large transfers to related entities",
      "Timing coincides with other suspicious activities",
      "Amounts match known money laundering patterns"
    ]
  }
}
```

### POST /ai/training/manual
Trigger manual model training.

**Request:**
```json
{
  "days_back": 90,
  "model_type": "isolation_forest",
  "hyperparameters": {
    "contamination": 0.1,
    "random_state": 42
  }
}
```

### GET /ai/training/status
Check current training status.

**Response:**
```json
{
  "is_running": true,
  "current_stage": "feature_engineering",
  "progress": 0.65,
  "estimated_completion": "2025-12-17T14:30:00Z",
  "model_type": "isolation_forest"
}
```

---

## User Management

### GET /admin/users
List users with filtering and pagination.

**Query Parameters:**
- `role` - Filter by user role
- `status` - Filter by account status (active, suspended)
- `search` - Search in name, email
- `page`, `limit` - Pagination

**Response:**
```json
{
  "users": [
    {
      "id": 123,
      "username": "john.investigator",
      "email": "john@agency.com",
      "full_name": "John Investigator",
      "role": "investigator",
      "status": "active",
      "created_at": "2025-01-15T09:00:00Z",
      "last_login": "2025-12-17T08:30:00Z"
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 20,
    "total": 150,
    "pages": 8
  }
}
```

### POST /admin/users
Create new user account.

**Request:**
```json
{
  "username": "jane.analyst",
  "email": "jane@agency.com",
  "full_name": "Jane Analyst",
  "role": "analyst",
  "department": "Financial Crimes",
  "send_welcome_email": true
}
```

### GET /admin/users/{id}
Get detailed user information.

### PUT /admin/users/{id}
Update user profile and permissions.

**Request:**
```json
{
  "full_name": "Jane Senior Analyst",
  "role": "senior_analyst",
  "department": "Financial Crimes",
  "status": "active"
}
```

### DELETE /admin/users/{id}
Deactivate user account.

### POST /admin/users/{id}/reset-password
Initiate password reset for user.

### GET /admin/roles
List available roles and permissions.

### POST /admin/roles
Create custom role.

### PUT /admin/roles/{id}
Update role permissions.

---

## Administrative Functions

### GET /admin/audit/logs
Retrieve audit log entries.

**Query Parameters:**
- `user_id` - Filter by user
- `action` - Filter by action type (login, create, update, delete)
- `resource_type` - Filter by resource (user, case, evidence)
- `start_date`, `end_date` - Date range
- `page`, `limit` - Pagination

**Response:**
```json
{
  "logs": [
    {
      "id": 12345,
      "timestamp": "2025-12-17T10:30:00Z",
      "user_id": 123,
      "username": "john.investigator",
      "action": "case_created",
      "resource_type": "case",
      "resource_id": 456,
      "ip_address": "192.168.1.100",
      "user_agent": "Mozilla/5.0...",
      "details": {
        "case_title": "Suspicious Transaction Investigation",
        "priority": "high"
      }
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 50,
    "total": 1250,
    "pages": 25
  }
}
```

### GET /admin/system/health
Get system health metrics.

**Response:**
```json
{
  "status": "healthy",
  "timestamp": "2025-12-17T12:00:00Z",
  "services": {
    "database": {
      "status": "healthy",
      "response_time": 45,
      "connections": 12
    },
    "redis": {
      "status": "healthy",
      "response_time": 12,
      "memory_usage": 23456789
    },
    "ai_service": {
      "status": "healthy",
      "response_time": 89,
      "active_models": 3
    }
  },
  "system": {
    "cpu_usage": 45.2,
    "memory_usage": 67.8,
    "disk_usage": 23.1,
    "uptime_seconds": 3456789
  }
}
```

### GET /admin/system/config
Retrieve system configuration.

### PUT /admin/system/config
Update system settings.

### POST /admin/system/maintenance
Schedule maintenance window.

### GET /admin/performance/metrics
Get detailed performance statistics.

---

## Reporting and Analytics

### GET /analytics/overview
System-wide analytics overview.

**Response:**
```json
{
  "period": {
    "start": "2025-12-01T00:00:00Z",
    "end": "2025-12-17T23:59:59Z"
  },
  "cases": {
    "total": 1250,
    "open": 340,
    "investigating": 180,
    "closed": 730,
    "avg_resolution_days": 12.5
  },
  "evidence": {
    "total_processed": 8500,
    "avg_per_case": 6.8,
    "fraud_detection_rate": 0.23
  },
  "performance": {
    "avg_response_time": 245,
    "error_rate": 0.02,
    "uptime_percentage": 99.7
  }
}
```

### GET /analytics/cases
Case-specific analytics and metrics.

**Query Parameters:**
- `start_date`, `end_date` - Date range
- `department` - Filter by department
- `priority` - Filter by case priority

### GET /analytics/transactions
Transaction pattern analysis.

### GET /stats/performance
System performance statistics.

### GET /stats/users
User activity and engagement statistics.

### GET /stats/cases
Case resolution and backlog statistics.

### POST /reporting/generate
Generate custom reports.

**Request:**
```json
{
  "report_type": "case_summary",
  "filters": {
    "status": "closed",
    "priority": "high",
    "date_range": {
      "start": "2025-11-01",
      "end": "2025-11-30"
    }
  },
  "format": "pdf",
  "recipients": ["manager@agency.com"]
}
```

### GET /reporting/templates
List available report templates.

### GET /reporting/{id}
Retrieve specific report details.

### POST /reporting/{id}/export
Export report in various formats.

### GET /reporting/scheduled
List scheduled reports.

### POST /reporting/scheduled
Create new scheduled report.

---

## Reconciliation

### POST /reconciliation/match
Execute transaction matching algorithms.

**Request:**
```json
{
  "source_transactions": [
    {
      "id": "bank_001",
      "amount": 5000.00,
      "date": "2025-12-15",
      "description": "Payment to Vendor ABC"
    }
  ],
  "target_transactions": [
    {
      "id": "ledger_001",
      "amount": 5000.00,
      "date": "2025-12-15",
      "description": "Invoice payment - Vendor ABC"
    }
  ],
  "matching_rules": {
    "amount_tolerance": 0.01,
    "date_tolerance_days": 3,
    "description_similarity": 0.8
  }
}
```

**Response:**
```json
{
  "matches": [
    {
      "source_id": "bank_001",
      "target_id": "ledger_001",
      "confidence": 0.95,
      "match_type": "exact",
      "matched_fields": ["amount", "date", "description"]
    }
  ],
  "exceptions": [
    {
      "source_id": "bank_002",
      "amount": 2500.00,
      "reason": "No matching ledger entry found",
      "suggestions": [
        {
          "target_id": "ledger_005",
          "confidence": 0.72,
          "reason": "Similar amount, different date"
        }
      ]
    }
  ]
}
```

### GET /reconciliation/status/{id}
Check reconciliation job status.

### POST /reconciliation/confirm
Confirm matched transactions.

### POST /reconciliation/exception
Handle reconciliation exceptions.

### GET /analysis/cashflow
Retrieve cash flow analysis data.

### POST /analysis/anomaly
Perform anomaly detection analysis.

### GET /analysis/trends
Get financial trend analysis.

---

## System Health

### GET /health
Basic health check for load balancers.

**Response:**
```json
{
  "status": "healthy",
  "timestamp": "2025-12-17T12:00:00Z",
  "version": "1.0.0",
  "environment": "production"
}
```

### GET /health/ready
Readiness check with dependency validation.

**Response:**
```json
{
  "ready": true,
  "checks": {
    "database": {
      "status": "healthy",
      "response_time_ms": 45
    },
    "redis": {
      "status": "healthy",
      "response_time_ms": 12
    },
    "ai_service": {
      "status": "healthy",
      "response_time_ms": 89
    },
    "storage": {
      "status": "healthy",
      "response_time_ms": 23
    }
  },
  "timestamp": "2025-12-17T12:00:00Z"
}
```

### GET /health/live
Kubernetes liveness probe.

### GET /health/startup
Kubernetes startup probe.

### GET /metrics
Prometheus-compatible metrics endpoint.

---

## Error Handling

### Standard Error Response Format

All API errors follow a consistent format:

```json
{
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Request validation failed",
    "details": {
      "field": "email",
      "reason": "Invalid email format"
    },
    "request_id": "req_123456789",
    "timestamp": "2025-12-17T12:00:00Z"
  }
}
```

### Common Error Codes

- `VALIDATION_ERROR` (400) - Invalid request data
- `UNAUTHORIZED` (401) - Authentication required
- `FORBIDDEN` (403) - Insufficient permissions
- `NOT_FOUND` (404) - Resource not found
- `CONFLICT` (409) - Resource conflict
- `RATE_LIMITED` (429) - Too many requests
- `INTERNAL_ERROR` (500) - Server error
- `SERVICE_UNAVAILABLE` (503) - Service temporarily unavailable

### Rate Limiting

API requests are rate limited per user/IP. Rate limit headers are included in responses:

```
X-RateLimit-Limit: 1000
X-RateLimit-Remaining: 999
X-RateLimit-Reset: 1640995200
X-RateLimit-Retry-After: 60
```

### Request IDs

All requests receive a unique request ID for tracking:

```
X-Request-ID: req_123456789
```

---

## Authentication Details

### JWT Token Format

Access tokens are JWT tokens with the following claims:

```json
{
  "sub": "user_123",
  "exp": 1640995200,
  "iat": 1640991600,
  "iss": "378x492-api",
  "aud": "378x492-client",
  "role": "investigator",
  "department": "Financial Crimes",
  "permissions": ["read_cases", "create_evidence", "run_ai_analysis"]
}
```

### Token Usage

Include the JWT token in the Authorization header:

```
Authorization: Bearer eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9...
```

### Token Expiration

- Access tokens expire after 1 hour
- Refresh tokens expire after 30 days
- Use `/auth/refresh` to obtain new access tokens

---

## Data Formats

### Date/Time Format

All dates use ISO 8601 format in UTC:

```
2025-12-17T10:30:00Z
2025-12-17T10:30:00.123Z
```

### Pagination

List endpoints support pagination with consistent parameters:

```json
{
  "data": [...],
  "pagination": {
    "page": 1,
    "limit": 20,
    "total": 150,
    "pages": 8,
    "has_next": true,
    "has_prev": false
  }
}
```

### Filtering and Sorting

Most list endpoints support advanced filtering:

- `?field=value` - Exact match
- `?field__in=value1,value2` - Value in list
- `?field__gt=value` - Greater than
- `?field__lt=value` - Less than
- `?field__contains=value` - String contains
- `?sort=field:asc` - Sort by field ascending
- `?sort=-field` - Sort by field descending

---

## Webhooks

### Webhook Configuration

Configure webhooks for real-time notifications:

```json
{
  "url": "https://your-app.com/webhooks/fraud-alerts",
  "events": ["case.created", "fraud.detected", "evidence.processed"],
  "secret": "your_webhook_secret",
  "active": true
}
```

### Supported Events

- `case.created` - New case opened
- `case.updated` - Case modified
- `case.closed` - Case resolved
- `evidence.uploaded` - New evidence added
- `evidence.processed` - Evidence analysis complete
- `fraud.detected` - Fraud alert triggered
- `ai.analysis.complete` - AI analysis finished

### Webhook Payload Format

```json
{
  "event": "fraud.detected",
  "timestamp": "2025-12-17T10:30:00Z",
  "data": {
    "case_id": 456,
    "risk_score": 85,
    "alert_type": "suspicious_transaction"
  },
  "signature": "sha256=abc123..."
}
```

---

## SDKs and Libraries

### Official SDKs

- **Python SDK**: `pip install fraud-detection-sdk`
- **JavaScript SDK**: `npm install @378x492/fraud-detection`
- **Java SDK**: Maven/Gradle dependency available

### Community Libraries

- **Go Client**: `go get github.com/378x492/go-client`
- **Ruby Gem**: `gem install fraud_detection`
- **PHP Library**: `composer require 378x492/fraud-detection`

### SDK Usage Example

```python
from fraud_detection import Client

client = Client(api_key="your_api_key")

# Analyze transaction
result = client.ai.analyze({
    "amount": 5000.00,
    "merchant": "Suspicious Vendor",
    "timestamp": "2025-12-17T10:30:00Z"
})

print(f"Risk Score: {result.risk_score}")
```

---

## Changelog

### Version 1.0.0 (2025-12-17)
- Initial API documentation release
- Complete endpoint coverage for all major features
- Authentication and authorization system
- AI fraud detection capabilities
- Case and evidence management
- Administrative functions
- Reporting and analytics
- System health monitoring

### Planned Updates
- Version 1.1.0: Enhanced AI features, bulk operations
- Version 1.2.0: Advanced reporting, custom dashboards
- Version 2.0.0: GraphQL API, real-time subscriptions

---

*For additional support, contact the development team at dev@378x492.com*
