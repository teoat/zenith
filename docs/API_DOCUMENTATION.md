# API Documentation

## Overview

This document provides comprehensive API documentation for the Meta Agent Fraud Detection System.

**Base URL:** `http://localhost:8000/api/v1`  
**API Version:** v1  
**Protocol:** REST + WebSocket

---

## Authentication

All API endpoints require authentication via JWT tokens.

### Login
```http
POST /auth/login
Content-Type: application/json

{
  "email": "user@example.com",
  "password": "securepassword"
}
```

**Response:**
```json
{
  "access_token": "eyJhbGc...",
  "token_type": "bearer",
  "user": {
    "id": "user123",
    "email": "user@example.com",
    "role": "analyst"
  }
}
```

### Using Tokens
```http
GET /cases
Authorization: Bearer eyJhbGc...
```

---

## Core Resources

### Cases

#### List Cases
```http
GET /cases?status=open&priority=high&page=1&limit=50
```

**Query Parameters:**
- `status` (optional): Filter by status (open, in_progress, closed)
- `priority` (optional): Filter by priority (low, medium, high)
- `assignee` (optional): Filter by assigned user ID
- `page` (default: 1): Page number
- `limit` (default: 50): Items per page

**Response:**
```json
{
  "cases": [
    {
      "id": "case123",
      "title": "Suspicious Transaction Pattern",
      "status": "open",
      "priority": "high",
      "riskScore": 87,
      "createdAt": "2024-01-15T10:30:00Z",
      "assignee": {
        "id": "user456",
        "name": "John Analyst"
      }
    }
  ],
  "total": 150,
  "page": 1,
  "pages": 3
}
```

#### Create Case
```http
POST /cases
Content-Type: application/json

{
  "title": "Suspected Money Laundering",
  "description": "Multiple round-trip transactions detected",
  "type": "FRAUD",
  "priority": "HIGH",
  "entities": ["entity1", "entity2"]
}
```

---

## Intelligence APIs

### Fraud Detection

#### Analyze Transactions
```http
POST /intelligence/fraud/analyze
Content-Type: application/json

{
  "transactions": [
    {
      "id": "tx1",
      "amount": 9900,
      "timestamp": "2024-01-15T10:00:00Z",
      "source_account": "ACC001",
      "destination_account": "ACC002",
      "description": "Cash deposit"
    }
  ]
}
```

**Response:**
```json
{
  "alerts": [
    {
      "alert_id": "STRUCT_tx1_3",
      "fraud_type": "structuring",
      "risk_score": 87,
      "confidence": 0.85,
      "transactions": ["tx1", "tx2", "tx3"],
      "description": "Possible structuring: 3 transactions totaling $29,400...",
      "detected_at": "2024-01-15T10:05:00Z",
      "details": {
        "total_amount": 29400,
        "transaction_count": 3,
        "avg_amount": 9800
      }
    }
  ]
}
```

#### Calculate Risk Score
```http
POST /intelligence/fraud/risk-score/ACC001
Content-Type: application/json

{
  "transactions": [...]
}
```

**Response:**
```json
{
  "account": "ACC001",
  "risk_score": 75,
  "alert_count": 3,
  "fraud_types_detected": ["structuring", "velocity"]
}
```

---

### Evidence Processing

#### Process File
```http
POST /intelligence/evidence/process
Content-Type: multipart/form-data

file: (binary data)
```

**Response:**
```json
{
  "file_id": "receipt_001.jpg",
  "filename": "receipt_001.jpg",
  "file_type": "image",
  "file_size": 245678,
  "extracted_text": "Purchase of $15,000...",
  "ocr_confidence": 0.92,
  "metadata": {
    "Make": "Apple",
    "Model": "iPhone 13"
  },
  "processed_at": "2024-01-15T10:10:00Z",
  "has_suspicious_indicators": false
}
```

#### Search Evidence
```http
GET /intelligence/evidence/search?query=wire+transfer
```

**Response:**
```json
[
  {
    "file_id": "doc1.pdf",
    "filename": "wire_transfer_receipt.pdf",
    "file_type": "pdf",
    "snippet": "Wire transfer of $50,000 to offshore account...",
    "ocr_confidence": 1.0,
    "processed_at": "2024-01-15T09:00:00Z"
  }
]
```

---

## Monitoring & Health

### System Health
```http
GET /monitoring/health
```

**Response:**
```json
{
  "status": "healthy",
  "checks": {
    "database": {
      "status": "healthy",
      "timestamp": "2024-01-15T10:15:00Z"
    },
    "redis": {
      "status": "healthy",
      "timestamp": "2024-01-15T10:15:00Z"
    }
  },
  "timestamp": "2024-01-15T10:15:00Z"
}
```

### Metrics
```http
GET /monitoring/metrics
```

**Response:**
```json
{
  "total_requests": 15234,
  "total_errors": 45,
  "error_rate": 0.29,
  "avg_response_time_ms": 125.4,
  "endpoints": [
    {
      "endpoint": "GET /cases",
      "requests": 5432,
      "avg_response_time_ms": 89.2,
      "error_rate": 0.12
    }
  ]
}
```

---

## WebSocket API

### Real-time Updates

**Connection:**
```javascript
const ws = new WebSocket('ws://localhost:8000/ws/updates');
```

**Subscribe to Case Updates:**
```json
{
  "type": "subscribe",
  "channel": "cases",
  "caseId": "case123"
}
```

**Receive Updates:**
```json
{
  "type": "update",
  "channel": "cases",
  "data": {
    "caseId": "case123",
    "field": "status",
    "oldValue": "open",
    "newValue": "in_progress",
    "timestamp": "2024-01-15T10:20:00Z"
  }
}
```

---

## Error Handling

### Standard Error Response
```json
{
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Invalid input parameters",
    "details": {
      "field": "amount",
      "issue": "Must be a positive number"
    }
  }
}
```

### HTTP Status Codes
- `200 OK`: Success
- `201 Created`: Resource created
- `400 Bad Request`: Invalid input
- `401 Unauthorized`: Authentication required
- `403 Forbidden`: Insufficient permissions
- `404 Not Found`: Resource not found
- `429 Too Many Requests`: Rate limit exceeded
- `500 Internal Server Error`: Server error

---

## Rate Limiting

**Limits:**
- Authenticated users: 1000 requests/hour
- Anonymous users: 100 requests/hour

**Headers:**
```http
X-RateLimit-Limit: 1000
X-RateLimit-Remaining: 945
X-RateLimit-Reset: 1642247400
```

---

## Pagination

All list endpoints support pagination:

**Request:**
```http
GET /cases?page=2&limit=25
```

**Response Headers:**
```http
X-Total-Count: 150
X-Page: 2
X-Per-Page: 25
X-Total-Pages: 6
Link: </cases?page=1>; rel="first", </cases?page=3>; rel="next"
```

---

## Filtering & Sorting

**Filter operators:**
- `eq`: Equal
- `ne`: Not equal
- `gt`: Greater than
- `gte`: Greater than or equal
- `lt`: Less than
- `lte`: Less than or equal
- `contains`: Contains text

**Example:**
```http
GET /cases?riskScore[gte]=70&status[eq]=open&sort=-createdAt
```

---

## Best Practices

### 1. Always Use HTTPS in Production
```
https://api.your-domain.com/api/v1/...
```

### 2. Cache Responses When Appropriate
```http
Cache-Control: public, max-age=300
ETag: "abc123"
```

### 3. Handle Rate Limits
```javascript
if (response.status === 429) {
  const retryAfter = response.headers['Retry-After'];
  await sleep(retryAfter * 1000);
  // Retry request
}
```

### 4. Use Batch Endpoints for Multiple Operations
```http
POST /cases/batch
Content-Type: application/json

{
  "operations": [
    {"action": "create", "data": {...}},
    {"action": "update", "id": "case123", "data": {...}}
  ]
}
```

---

## SDK Examples

### Python
```python
from metaagent_sdk import MetaAgentClient

client = MetaAgentClient(
    base_url='https://api.your-domain.com',
    api_key='your_api_key'
)

# Analyze transactions for fraud
alerts = client.fraud.analyze(transactions=[
    {
        'id': 'tx1',
        'amount': 9900,
        'source_account': 'ACC001',
        'destination_account': 'ACC002'
    }
])

for alert in alerts:
    print(f"Alert: {alert.fraud_type} - Risk: {alert.risk_score}")
```

### JavaScript/TypeScript
```typescript
import { MetaAgentClient } from '@metaagent/sdk';

const client = new MetaAgentClient({
  baseUrl: 'https://api.your-domain.com',
  apiKey: 'your_api_key'
});

// Process evidence file
const evidence = await client.evidence.process(fileBlob);
console.log(`Extracted: ${evidence.extracted_text}`);
console.log(`Confidence: ${evidence.ocr_confidence}`);
```

---

## Support

- **Documentation:** https://docs.your-domain.com
- **API Status:** https://status.your-domain.com
- **Support Email:** support@your-domain.com
- **GitHub Issues:** https://github.com/your-org/meta-agent/issues

---

**Version:** 1.0.0  
**Last Updated:** 2024-01-15  
**License:** MIT
