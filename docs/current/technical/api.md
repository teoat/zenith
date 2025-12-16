# 🔗 API Reference
## 378x492 Fraud Detection Platform - Complete API Documentation

**Generated:** December 17, 2025
**Version:** 1.0.0
**Base URL:** `https://api.378x492.com/v1`

---

## 📋 Overview

The 378x492 Fraud Detection Platform provides a comprehensive REST API for fraud investigation, case management, and analytics. This API follows RESTful principles with JSON payloads and JWT authentication.

### Key Features
- **RESTful Design**: Standard HTTP methods and status codes
- **JWT Authentication**: Secure token-based authentication
- **Comprehensive Security**: HMAC signing, encryption, audit logging
- **Rate Limiting**: Progressive throttling to prevent abuse
- **OpenAPI Specification**: Complete API documentation

---

## 🔐 Authentication

### JWT Token Authentication
All API endpoints require authentication via JWT tokens obtained from `/auth/login`.

#### Request Headers
```
Authorization: Bearer <your-jwt-token>
Content-Type: application/json
```

#### Token Expiration
- **Access Token**: 15 minutes
- **Refresh Token**: 7 days
- **Automatic Refresh**: Use `/auth/refresh` endpoint

### Authentication Flow

#### 1. Login Request
```http
POST /auth/login
Content-Type: application/json

{
  "username": "investigator@example.com",
  "password": "SecurePass123!",
  "biometricToken": "optional-biometric-token"
}
```

#### 2. Successful Response
```json
{
  "success": true,
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "refreshToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "session": {
    "id": "session-uuid",
    "expiresAt": "2025-12-17T18:00:00Z",
    "ipAddress": "192.168.1.100"
  },
  "user": {
    "id": "user-uuid",
    "username": "investigator@example.com",
    "role": "investigator",
    "permissions": ["read_cases", "write_evidence"]
  }
}
```

#### 3. Using the Token
```bash
curl -H "Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..." \
     https://api.378x492.com/v1/cases
```

#### 4. Token Refresh
```http
POST /auth/refresh
Authorization: Bearer <refresh-token>
```

---

## 📊 Rate Limiting

### Limits
- **Unauthenticated**: 100 requests per minute per IP
- **Authenticated Users**: 1000 requests per minute
- **Admin Users**: 5000 requests per minute

### Response Headers
```http
X-RateLimit-Limit: 1000
X-RateLimit-Remaining: 999
X-RateLimit-Reset: 1640995200
Retry-After: 60
```

### Rate Limit Exceeded Response
```json
{
  "error": "rate_limit_exceeded",
  "message": "Too many requests. Please try again later.",
  "retryAfter": 60,
  "limit": 1000,
  "remaining": 0,
  "resetTime": "2025-12-17T18:01:00Z"
}
```

---

## 🔒 Security Features

### Data Protection
- **Encryption at Rest**: SQLCipher AES-256 encryption
- **Transport Security**: TLS 1.3 with perfect forward secrecy
- **Key Management**: Secure key derivation and rotation

### Communication Security
- **HMAC-SHA256 Signing**: All inter-process communication
- **Context Isolation**: Electron security best practices
- **CORS Protection**: Configurable origin restrictions

### Audit & Compliance
- **Comprehensive Logging**: All operations tracked
- **GDPR Compliance**: Data portability and deletion
- **SOC2 Compliance**: Security and availability controls

---

## 📚 Core API Endpoints

### Cases Management

#### List Cases
```http
GET /cases
Authorization: Bearer <token>
```

**Query Parameters:**
- `status`: Filter by case status (open, closed, investigating)
- `priority`: Filter by priority (low, medium, high, critical)
- `assignee`: Filter by assigned user ID
- `limit`: Number of results (default: 50, max: 100)
- `offset`: Pagination offset (default: 0)

**Response:**
```json
{
  "cases": [
    {
      "id": "case-uuid",
      "title": "Suspicious Transaction Pattern",
      "status": "investigating",
      "priority": "high",
      "assignee": {
        "id": "user-uuid",
        "name": "John Investigator"
      },
      "createdAt": "2025-12-17T10:00:00Z",
      "updatedAt": "2025-12-17T15:30:00Z",
      "riskScore": 0.85,
      "tags": ["financial", "pattern"]
    }
  ],
  "total": 150,
  "limit": 50,
  "offset": 0
}
```

#### Get Case Details
```http
GET /cases/{caseId}
Authorization: Bearer <token>
```

#### Create Case
```http
POST /cases
Authorization: Bearer <token>
Content-Type: application/json

{
  "title": "New Fraud Investigation",
  "description": "Suspicious activity detected",
  "priority": "high",
  "type": "fraud_investigation",
  "tags": ["financial", "urgent"]
}
```

#### Update Case
```http
PUT /cases/{caseId}
Authorization: Bearer <token>
Content-Type: application/json

{
  "status": "closed",
  "resolution": "Fraud confirmed and prevented",
  "notes": "Transferred funds recovered"
}
```

### Evidence Management

#### Upload Evidence
```http
POST /cases/{caseId}/evidence
Authorization: Bearer <token>
Content-Type: multipart/form-data

# File upload with metadata
evidenceFile: <binary file>
metadata: {
  "type": "document",
  "description": "Bank statement showing suspicious transactions",
  "tags": ["financial", "document"]
}
```

#### List Evidence
```http
GET /cases/{caseId}/evidence
Authorization: Bearer <token>
```

**Response:**
```json
{
  "evidence": [
    {
      "id": "evidence-uuid",
      "filename": "bank_statement.pdf",
      "type": "document",
      "size": 2048576,
      "uploadedAt": "2025-12-17T12:00:00Z",
      "uploadedBy": "user-uuid",
      "hash": "sha256-hash",
      "analysis": {
        "status": "completed",
        "sentiment": 0.2,
        "keyPhrases": ["suspicious transfer", "unusual pattern"]
      }
    }
  ]
}
```

### Fraud Detection

#### Analyze Transaction
```http
POST /fraud/analyze
Authorization: Bearer <token>
Content-Type: application/json

{
  "transaction": {
    "amount": 15000.00,
    "merchant": "Unknown Online Store",
    "location": "Unknown",
    "time": "2025-12-17T16:00:00Z",
    "userHistory": {
      "previousTransactions": 25,
      "averageAmount": 150.00,
      "locationHistory": ["New York", "Boston"]
    }
  }
}
```

**Response:**
```json
{
  "analysisId": "analysis-uuid",
  "riskScore": 0.92,
  "riskLevel": "critical",
  "flags": [
    {
      "type": "amount_anomaly",
      "severity": "high",
      "description": "Transaction amount 100x higher than average"
    },
    {
      "type": "location_anomaly",
      "severity": "medium",
      "description": "Unusual geographic location"
    }
  ],
  "recommendations": [
    "Freeze account immediately",
    "Contact cardholder",
    "Initiate investigation"
  ]
}
```

### Analytics & Reporting

#### Get Dashboard Metrics
```http
GET /analytics/dashboard
Authorization: Bearer <token>
```

**Query Parameters:**
- `period`: Time period (day, week, month, year)
- `startDate`: ISO 8601 start date
- `endDate`: ISO 8601 end date

**Response:**
```json
{
  "metrics": {
    "totalCases": 1250,
    "openCases": 89,
    "closedCases": 1161,
    "fraudDetected": 234,
    "falsePositives": 12,
    "averageResolutionTime": "3.2 days",
    "riskScoreDistribution": {
      "low": 45,
      "medium": 23,
      "high": 15,
      "critical": 6
    }
  },
  "trends": {
    "casesOverTime": [
      {"date": "2025-12-10", "count": 15},
      {"date": "2025-12-11", "count": 22}
    ],
    "fraudDetectionRate": 0.94
  }
}
```

#### Generate Report
```http
POST /reports/generate
Authorization: Bearer <token>
Content-Type: application/json

{
  "type": "case_summary",
  "format": "pdf",
  "filters": {
    "dateRange": {
      "start": "2025-11-01",
      "end": "2025-11-30"
    },
    "status": ["closed"],
    "priority": ["high", "critical"]
  },
  "includeCharts": true,
  "recipients": ["manager@company.com"]
}
```

---

## 📋 Error Handling

### Standard Error Response Format
```json
{
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Invalid input parameters",
    "details": {
      "field": "amount",
      "issue": "Must be positive number"
    },
    "timestamp": "2025-12-17T16:30:00Z",
    "requestId": "req-uuid"
  }
}
```

### Common Error Codes

| Code | HTTP Status | Description |
|------|-------------|-------------|
| `VALIDATION_ERROR` | 400 | Invalid input data |
| `AUTHENTICATION_FAILED` | 401 | Invalid credentials |
| `AUTHORIZATION_FAILED` | 403 | Insufficient permissions |
| `NOT_FOUND` | 404 | Resource not found |
| `RATE_LIMIT_EXCEEDED` | 429 | Too many requests |
| `INTERNAL_ERROR` | 500 | Server error |

---

## 🧪 Testing & Development

### API Testing Tools
- **Swagger UI**: Interactive documentation at `/docs`
- **Postman Collection**: Import from `/api/postman.json`
- **cURL Examples**: Provided for all endpoints

### Development Environment
```bash
# Start local API server
cd backend
uvicorn main:app --reload --port 8000

# Access API documentation
open http://localhost:8000/docs

# Test authentication
curl -X POST http://localhost:8000/auth/login \
  -H "Content-Type: application/json" \
  -d '{"username":"test@example.com","password":"password"}'
```

---

## 📊 Monitoring & Health Checks

### Health Endpoints

#### Basic Health Check
```http
GET /health
```
**Response:**
```json
{
  "status": "healthy",
  "timestamp": "2025-12-17T16:00:00Z",
  "version": "1.0.0"
}
```

#### Readiness Check
```http
GET /health/ready
```
**Response:**
```json
{
  "ready": true,
  "checks": {
    "database": true,
    "redis": true,
    "external_apis": true
  },
  "timestamp": "2025-12-17T16:00:00Z"
}
```

#### Detailed Health
```http
GET /health/detailed
Authorization: Bearer <admin-token>
```

### Metrics Endpoint
```http
GET /metrics
Authorization: Bearer <admin-token>
```
Returns Prometheus-compatible metrics for monitoring.

---

## 🔧 SDKs & Libraries

### Official SDKs
- **Python SDK**: `pip install fraud-detection-sdk`
- **JavaScript SDK**: `npm install @378x492/fraud-detection`
- **Go SDK**: `go get github.com/378x492/sdk-go`

### Community Libraries
- **PHP Client**: Third-party library available
- **Ruby Gem**: Community-maintained client
- **Java Library**: Enterprise integration library

---

## 📞 Support & Resources

### Documentation
- **Interactive API Docs**: `/docs` (Swagger UI)
- **OpenAPI Specification**: `/openapi.json`
- **Postman Collection**: `/api/postman.json`

### Support Channels
- **API Status**: `https://status.378x492.com`
- **Developer Forum**: `https://forum.378x492.com`
- **Support Email**: `api-support@378x492.com`

### Rate Limits & Fair Use
- **Fair Use Policy**: Documented at `/legal/fair-use`
- **Enterprise Support**: Contact `enterprise@378x492.com`
- **SLA Guarantees**: Available for enterprise customers

---

## 📝 Changelog

### Version 1.0.0 (December 2025)
- ✅ Complete API specification
- ✅ JWT authentication implementation
- ✅ Comprehensive security features
- ✅ Full case and evidence management
- ✅ Advanced fraud detection capabilities
- ✅ Analytics and reporting system

---

*This API reference consolidates OpenAPI specification details with human-readable documentation. All authentication flows, endpoint specifications, and security requirements preserved with logical organization.*