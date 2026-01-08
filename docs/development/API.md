# API Reference Documentation

**Version:** 1.0.0  
**Last Updated:** 2026-01-08  
**Related Document:** [IMPLEMENTATION_PLAN.md](./IMPLEMENTATION_PLAN.md)

---

## Overview

The Zenith Platform provides a comprehensive REST API for fraud detection, case management, and intelligence analysis. This document covers all endpoints across the microservices architecture.

## Base URLs

| Environment | URL |
|-------------|-----|
| Development | `http://localhost:8000` |
| Railway (API Gateway) | `https://your-api-gateway.railway.app` |
| Vercel Edge | `https://your-vercel-edge.vercel.app` |

## Authentication

All endpoints (except `/health` and `/auth/login`) require authentication via Bearer token:

```bash
curl -H "Authorization: Bearer <token>" https://api.example.com/api/v1/...
```

### Auth Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/v1/auth/login` | User login |
| POST | `/api/v1/auth/logout` | User logout |
| POST | `/api/v1/auth/refresh` | Refresh access token |
| GET | `/api/v1/auth/me` | Get current user |
| POST | `/api/v1/auth/register` | Register new user |
| PUT | `/api/v1/auth/password` | Change password |

### Login Request
```json
{
  "email": "user@example.com",
  "password": "securepassword"
}
```

### Login Response
```json
{
  "access_token": "eyJ...",
  "refresh_token": "eyJ...",
  "token_type": "bearer",
  "expires_in": 3600,
  "user": {
    "id": "uuid",
    "email": "user@example.com",
    "role": "analyst"
  }
}
```

---

## Cases API

### Case Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/v1/cases` | List all cases |
| POST | `/api/v1/cases` | Create new case |
| GET | `/api/v1/cases/{id}` | Get case by ID |
| PUT | `/api/v1/cases/{id}` | Update case |
| DELETE | `/api/v1/cases/{id}` | Delete case |
| GET | `/api/v1/cases/{id}/evidence` | Get case evidence |
| POST | `/api/v1/cases/{id}/evidence` | Add evidence to case |
| PUT | `/api/v1/cases/{id}/status` | Update case status |
| GET | `/api/v1/cases/{id}/timeline` | Get case timeline |
| POST | `/api/v1/cases/{id}/assign` | Assign case to user |

### List Cases Query Parameters
```typescript
interface CaseQueryParams {
  page?: number;        // Default: 1
  limit?: number;       // Default: 20, Max: 100
  status?: string;      // open, in_progress, resolved, closed
  priority?: string;    // low, medium, high, critical
  assigned_to?: string; // User ID
  search?: string;      // Search in title/description
  sort_by?: string;     // created_at, updated_at, priority
  sort_order?: string;  // asc, desc
  date_from?: string;   // ISO date
  date_to?: string;     // ISO date
}
```

### Case Response
```json
{
  "id": "case-uuid",
  "title": "Suspicious Transaction Pattern",
  "description": "Multiple high-value transactions detected",
  "status": "open",
  "priority": "high",
  "assigned_to": "user-uuid",
  "created_at": "2026-01-08T10:00:00Z",
  "updated_at": "2026-01-08T10:30:00Z",
  "tags": ["fraud", "high-value", "pattern"],
  "metadata": {
    "transaction_count": 5,
    "total_amount": 50000.00,
    "risk_score": 85
  }
}
```

---

## AI/ML Endpoints

### Analysis Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/v1/ai/analyze` | Analyze transaction/data |
| POST | `/api/v1/ai/fraud-score` | Get fraud score |
| POST | `/api/v1/ai/embeddings` | Generate embeddings |
| POST | `/api/v1/ai/similarity` | Find similar cases |
| GET | `/api/v1/ai/models` | List available models |
| POST | `/api/v1/ai/batch` | Batch processing |
| GET | `/api/v1/ai/predictions/{id}` | Get prediction result |

### Fraud Score Request
```json
{
  "transaction_id": "txn-uuid",
  "amount": 1500.00,
  "currency": "USD",
  "merchant_id": "merchant-uuid",
  "merchant_category": "retail",
  "card_present": false,
  "device_id": "device-uuid",
  "location": {
    "country": "US",
    "city": "New York"
  },
  "history": {
    "account_age_days": 365,
    "transaction_count_30d": 15,
    "avg_transaction_value": 120.00
  }
}
```

### Fraud Score Response
```json
{
  "transaction_id": "txn-uuid",
  "fraud_score": 0.73,
  "risk_level": "high",
  "confidence": 0.92,
  "factors": [
    {
      "name": "unusual_amount",
      "contribution": 0.35,
      "description": "Amount significantly higher than typical"
    },
    {
      "name": "new_merchant",
      "contribution": 0.20,
      "description": "First transaction with this merchant"
    }
  ],
  "recommendations": [
    "Request additional verification",
    "Block transaction pending review"
  ],
  "model_version": "xgboost-v2.3.1",
  "processing_time_ms": 45
}
```

---

## Fraud Detection Endpoints

### Fraud Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/v1/fraud/scan` | Scan for fraud patterns |
| GET | `/api/v1/fraud/alerts` | List fraud alerts |
| POST | `/api/v1/fraud/rules` | Create detection rule |
| GET | `/api/v1/fraud/rules` | List detection rules |
| PUT | `/api/v1/fraud/rules/{id}` | Update rule |
| DELETE | `/api/v1/fraud/rules/{id}` | Delete rule |
| POST | `/api/v1/fraud/alerts/{id}/investigate` | Start investigation |
| PUT | `/api/v1/fraud/alerts/{id}/resolve` | Resolve alert |
| GET | `/api/v1/fraud/network/{entity_id}` | Get entity network |
| POST | `/api/v1/fraud/block` | Block entity |

### Scan Request
```json
{
  "entity_type": "account",
  "entity_id": "account-uuid",
  "scan_types": ["velocity", "pattern", "network"],
  "time_window_hours": 24,
  "include_related": true
}
```

### Alert Response
```json
{
  "id": "alert-uuid",
  "type": "velocity_anomaly",
  "severity": "high",
  "status": "open",
  "entity": {
    "type": "account",
    "id": "account-uuid"
  },
  "details": {
    "transaction_count": 25,
    "normal_count": 5,
    "threshold": 10
  },
  "created_at": "2026-01-08T10:00:00Z",
  "assigned_to": "analyst-uuid"
}
```

---

## Workflow Endpoints

### Workflow Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/v1/workflow/processes` | List workflows |
| POST | `/api/v1/workflow/processes` | Start new workflow |
| GET | `/api/v1/workflow/processes/{id}` | Get workflow status |
| POST | `/api/v1/workflow/processes/{id}/action` | Take action |
| GET | `/api/v1/workflow/tasks` | List tasks |
| PUT | `/api/v1/workflow/tasks/{id}` | Update task |
| GET | `/api/v1/workflow/templates` | List templates |
| POST | `/api/v1/workflow/templates` | Create template |

### Workflow Template
```json
{
  "name": "fraud-investigation",
  "description": "Standard fraud investigation workflow",
  "stages": [
    {
      "name": "initial_review",
      "actions": ["assign", "escalate", "close"],
      "timeout_hours": 4
    },
    {
      "name": "investigation",
      "actions": ["collect_evidence", "contact_customer", "resolve"],
      "timeout_hours": 48
    },
    {
      "name": "resolution",
      "actions": ["approve_action", "reject_action"],
      "timeout_hours": 24
    }
  ],
  "triggers": ["alert_generated", "manual_start"]
}
```

---

## Health & Monitoring Endpoints

### Health Check Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/health` | Basic health check |
| GET | `/health/live` | Liveness probe |
| GET | `/health/ready` | Readiness probe |
| GET | `/health/stats` | Service statistics |
| GET | `/health/metrics` | Prometheus metrics |

### Health Response
```json
{
  "status": "healthy",
  "service": "zenith-api-gateway",
  "version": "1.0.0",
  "timestamp": "2026-01-08T10:00:00Z",
  "dependencies": {
    "database": "healthy",
    "redis": "healthy",
    "ai_service": "healthy",
    "fraud_service": "healthy"
  },
  "uptime_seconds": 86400,
  "memory_usage_mb": 256,
  "active_connections": 42
}
```

### Prometheus Metrics
```
# HELP zenith_requests_total Total number of requests
# TYPE zenith_requests_total counter
zenith_requests_total{method="GET",endpoint="/cases",status="200"} 1234

# HELP zenith_request_duration_ms Request duration in milliseconds
# TYPE zenith_request_duration_ms histogram
zenith_request_duration_ms_bucket{endpoint="/cases",le="100"} 1000
```

---

## Error Codes

| Code | Meaning | Description |
|------|---------|-------------|
| 400 | Bad Request | Invalid request parameters |
| 401 | Unauthorized | Missing or invalid token |
| 403 | Forbidden | Insufficient permissions |
| 404 | Not Found | Resource not found |
| 422 | Validation Error | Request validation failed |
| 429 | Rate Limited | Too many requests |
| 500 | Internal Error | Server error |
| 503 | Unavailable | Service temporarily unavailable |

### Error Response
```json
{
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Invalid request parameters",
    "details": [
      {
        "field": "email",
        "message": "Invalid email format"
      }
    ],
    "request_id": "req-uuid",
    "timestamp": "2026-01-08T10:00:00Z"
  }
}
```

---

## Rate Limiting

| Tier | Requests/Minute | Requests/Day |
|------|-----------------|--------------|
| Free | 100 | 1,000 |
| Pro | 1,000 | 100,000 |
| Enterprise | 10,000 | Unlimited |

Rate limit headers are included in responses:
```
X-RateLimit-Limit: 1000
X-RateLimit-Remaining: 999
X-RateLimit-Reset: 1641638400
```

---

## Versioning

API versioning is handled via URL path: `/api/v1/`

When breaking changes are introduced:
1. New version released: `/api/v2/`
2. Old version maintained for 6 months
3. Deprecation warnings added to responses

---

## Webhooks

Configure webhooks for event notifications:

```json
{
  "url": "https://your-app.com/webhooks/zenith",
  "events": [
    "case.created",
    "case.updated",
    "alert.created",
    "alert.resolved",
    "workflow.completed"
  ],
  "secret": "webhook-secret-key"
}
```

### Webhook Payload
```json
{
  "event": "case.created",
  "timestamp": "2026-01-08T10:00:00Z",
  "data": {
    "case_id": "case-uuid",
    "title": "New Case"
  },
  "signature": "sha256=..."
}
```

---

**Document Version:** 1.0.0  
**Last Modified:** 2026-01-08
