````markdown
# Simple378 Fraud Detection API Documentation

## Overview

The Simple378 Fraud Detection API provides comprehensive endpoints for fraud detection, evidence analysis, semantic search, and application monitoring. This document describes all available endpoints, authentication requirements, and usage examples.

## Base URL

### Production
```
https://api.378x492.com/api/v1
```

### Development
```
http://localhost:8000/api/v1
```

## Authentication

### API Key Authentication
All API requests must include an API key in the header:

```http
GET /api/v1/cases
Authorization: Bearer YOUR_API_KEY
Content-Type: application/json
```

### JWT Authentication
For user authentication, use JWT tokens:

```http
GET /api/v1/cases
Authorization: Bearer YOUR_JWT_TOKEN
Content-Type: application/json
```

### Getting API Keys
1. Visit the developer portal: https://portal.378x492.com
2. Create an application
3. Generate API keys
4. Assign appropriate permissions

## Rate Limiting

API requests are rate-limited:
- **Standard tier**: 1000 requests per hour
- **Premium tier**: 5000 requests per hour
- **Enterprise tier**: 10000 requests per hour

Rate limit headers are included in responses:
```http
X-RateLimit-Limit: 1000
X-RateLimit-Remaining: 999
X-RateLimit-Reset: 1640995200
```

Include token in Authorization header:
```
Authorization: Bearer <your_jwt_token>
```

## Endpoints

### Authentication

#### POST /auth/token
**Description**: Login and obtain JWT access token

**Request Body**:
```json
{
  "email": "user@example.com",
  "password": "password123"
}
```

**Response**:
```json
{
  "access_token": "eyJ0eXAiOiJKV1QiLCJhbGc...",
  "token_type": "bearer"
}
```

#### POST /auth/register
**Description**: Register new user account

**Request Body**:
```json
{
  "email": "newuser@example.com",
  "password": "securePassword123",
  "full_name": "John Doe"
}
```

### Cases

#### GET /api/v1/cases
**Description**: List all fraud cases with pagination

**Query Parameters**:
- `skip` (int): Number of records to skip (default: 0)
- `limit` (int): Maximum records to return (default: 100)
- `status` (string): Filter by status (open, closed, pending)

**Response**:
```json
{
  "items": [...],
  "total": 150,
  "skip": 0,
  "limit": 100
}
```

#### POST /api/v1/cases
**Description**: Create new fraud case

**Request Body**:
```json
{
  "title": "Suspicious Transaction Pattern",
  "description": "Multiple high-value transactions detected",
  "priority": "high",
  "assigned_to": "user_id"
}
```

### Fraud Detection

#### POST /api/v1/fraud/analyze
**Description**: Analyze transaction for fraud indicators

**Request Body**:
```json
{
  "transaction_id": "txn_12345"
}
```

**Response**:
```json
{
  "risk_score": 85.5,
  "ml_anomaly_score": 45.2,
  "rule_flags": ["POTENTIAL_SHELL_PAYMENT"],
  "is_suspicious": true
}
```

## Health & Monitoring

### GET /health
Basic health check

### GET /health/ready
Readiness check (includes DB connectivity)

### GET /health/live
Liveness check

### GET /metrics
Prometheus metrics endpoint

## Error Responses

All errors follow this format:
```json
{
  "detail": "Error message",
  "status_code": 400
}
```

Common status codes:
- 400: Bad Request
- 401: Unauthorized
- 403: Forbidden
- 404: Not Found
- 500: Internal Server Error

````
