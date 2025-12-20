# Zenith API Examples & Schemas

**Generated:** 2025-12-17
**Purpose:** Practical examples for key API endpoints

## Authentication

### Login
```bash
curl -X POST "http://localhost:8000/api/v1/auth/login" \
  -H "Content-Type: application/json" \
  -d '{
    "username": "investigator@example.com",
    "password": "secure_password"
  }'
```

**Response:**
```json
{
  "access_token": "eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9...",
  "token_type": "bearer",
  "expires_in": 1800
}
```

### Register User
```bash
curl -X POST "http://localhost:8000/api/v1/auth/register" \
  -H "Content-Type: application/json" \
  -d '{
    "username": "new_investigator",
    "email": "investigator@agency.com",
    "password": "SecurePass123!",
    "full_name": "John Investigator",
    "role": "analyst"
  }'
```

## Case Management

### Create Case
```bash
curl -X POST "http://localhost:8000/api/v1/cases/" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "title": "Suspicious Transaction Pattern",
    "description": "Multiple high-value transfers to known risk locations",
    "customer_name": "ABC Corporation",
    "fraud_amount": 50000.00,
    "priority": "high"
  }'
```

### Get Cases
```bash
curl -X GET "http://localhost:8000/api/v1/cases/" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

## Evidence Processing

### Upload Evidence
```bash
curl -X POST "http://localhost:8000/api/v1/evidence/upload" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -F "file=@document.pdf" \
  -F "case_id=case-123" \
  -F "evidence_type=document"
```

### Get Evidence List
```bash
curl -X GET "http://localhost:8000/api/v1/evidence/case/case-123" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

## Fraud Detection

### Analyze Case
```bash
curl -X POST "http://localhost:8000/api/v1/fraud/analyze/case-123" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "include_historical": true,
    "risk_threshold": 0.7
  }'
```

### Get Fraud Alerts
```bash
curl -X GET "http://localhost:8000/api/v1/fraud/alerts/case-123" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

## Search & Intelligence

### Search Cases
```bash
curl -X GET "http://localhost:8000/api/v1/search/cases?q=fraud&limit=10" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

### AI Analysis
```bash
curl -X POST "http://localhost:8000/api/v1/ai/analyze" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "text": "Transaction of $50,000 to offshore account",
    "analysis_type": "fraud_detection"
  }'
```

## Data Schemas

### Case Schema
```json
{
  "id": "string",
  "title": "string",
  "description": "string",
  "status": "open|investigating|closed",
  "customer_name": "string",
  "fraud_amount": "number",
  "created_at": "datetime",
  "updated_at": "datetime",
  "assigned_to": "string",
  "priority": "low|medium|high|critical"
}
```

### Evidence Schema
```json
{
  "id": "string",
  "case_id": "string",
  "filename": "string",
  "file_type": "string",
  "file_size": "number",
  "uploaded_by": "string",
  "uploaded_at": "datetime",
  "evidence_type": "document|image|video|audio",
  "analysis_status": "pending|processing|completed|failed"
}
```

### Fraud Alert Schema
```json
{
  "id": "string",
  "case_id": "string",
  "rule_name": "string",
  "severity": "low|medium|high|critical",
  "confidence": "number (0-1)",
  "risk_score": "number",
  "description": "string",
  "detected_at": "datetime",
  "status": "open|investigating|resolved|false_positive"
}
```

## Error Responses

### Authentication Error
```json
{
  "detail": "Invalid credentials"
}
```

### Authorization Error
```json
{
  "detail": "Insufficient permissions"
}
```

### Validation Error
```json
{
  "detail": [
    {
      "loc": ["body", "title"],
      "msg": "field required",
      "type": "value_error.missing"
    }
  ]
}
```

## Rate Limiting

The API implements rate limiting. If exceeded:
```json
{
  "detail": "Too many requests"
}
```

Headers include:
```
X-RateLimit-Limit: 100
X-RateLimit-Remaining: 95
X-RateLimit-Reset: 1640995200
```