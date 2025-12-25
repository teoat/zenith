# Interactive API Documentation

Try the Zenith Fraud Detection Platform API directly in your browser.

## 🚀 Quick Start

### Authentication
First, get your API token from the [Developer Dashboard](https://dashboard.zenith.com).

```bash
export API_TOKEN="your_api_token_here"
```

### Base URL
```
https://api.zenith.com
```

## 📡 Live API Explorer

<iframe 
    src="https://api.zenith.com/docs" 
    width="100%" 
    height="600px"
    frameborder="0"
    style="border: 1px solid #ddd; border-radius: 8px;">
</iframe>

## 🔧 Try Endpoints

### Authentication Endpoints

#### Register User
```bash
curl -X POST 'https://api.zenith.com/auth/register' \
  -H 'Content-Type: application/json' \
  -d '{
    "email": "user@example.com",
    "password": "SecurePassword123!",
    "first_name": "John",
    "last_name": "Doe"
  }'
```

```python
import requests

response = requests.post('https://api.zenith.com/auth/register', json={
    "email": "user@example.com",
    "password": "SecurePassword123!",
    "first_name": "John",
    "last_name": "Doe"
})

print(response.json())
```

```javascript
fetch('https://api.zenith.com/auth/register', {
    method: 'POST',
    headers: {
        'Content-Type': 'application/json'
    },
    body: JSON.stringify({
        "email": "user@example.com",
        "password": "SecurePassword123!",
        "first_name": "John",
        "last_name": "Doe"
    })
})
.then(response => response.json())
.then(data => console.log(data));
```

#### Login
```bash
curl -X POST 'https://api.zenith.com/auth/login' \
  -H 'Content-Type: application/json' \
  -d '{
    "email": "user@example.com",
    "password": "SecurePassword123!"
  }'
```

### Fraud Analysis Endpoints

#### Analyze Transaction
```bash
curl -X POST 'https://api.zenith.com/fraud/analyze' \
  -H 'Authorization: Bearer YOUR_API_TOKEN' \
  -H 'Content-Type: application/json' \
  -d '{
    "transaction": {
        "id": "txn_123456",
        "amount": 150.00,
        "merchant": "Test Store",
        "user_id": "user_789",
        "timestamp": "2025-12-20T18:30:00Z",
        "payment_method": "credit_card",
        "ip_address": "192.168.1.1"
    },
    "analysis_options": {
        "include_user_history": true,
        "include_merchant_risk": true,
        "detailed_factors": true
    }
  }'
```

```python
import requests

headers = {
    "Authorization": "Bearer YOUR_API_TOKEN",
    "Content-Type": "application/json"
}

data = {
    "transaction": {
        "id": "txn_123456",
        "amount": 150.00,
        "merchant": "Test Store",
        "user_id": "user_789",
        "timestamp": "2025-12-20T18:30:00Z",
        "payment_method": "credit_card",
        "ip_address": "192.168.1.1"
    },
    "analysis_options": {
        "include_user_history": True,
        "include_merchant_risk": True,
        "detailed_factors": True
    }
}

response = requests.post(
    'https://api.zenith.com/fraud/analyze',
    headers=headers,
    json=data
)

result = response.json()
print(f"Risk Score: {result['risk_score']}")
print(f"Recommendation: {result['recommendation']}")
```

### Case Management Endpoints

#### Create Case
```bash
curl -X POST 'https://api.zenith.com/cases' \
  -H 'Authorization: Bearer YOUR_API_TOKEN' \
  -H 'Content-Type: application/json' \
  -d '{
    "title": "Suspicious Transaction Pattern",
    "description": "Multiple high-value transactions from new user",
    "priority": "high",
    "transaction_ids": ["txn_123456", "txn_123457", "txn_123458"],
    "assigned_to": "investigator_123",
    "tags": ["new_user", "high_value", "suspicious_pattern"]
  }'
```

#### Get Case Details
```bash
curl -X GET 'https://api.zenith.com/cases/case_123456' \
  -H 'Authorization: Bearer YOUR_API_TOKEN'
```

### Evidence Management Endpoints

#### Upload Evidence
```bash
curl -X POST 'https://api.zenith.com/evidence/upload/complete' \
  -H 'Authorization: Bearer YOUR_API_TOKEN' \
  -H 'Content-Type: application/json' \
  -d '{
    "case_id": "case_123456",
    "upload_id": "upload_789",
    "file_name": "transaction_receipt.pdf",
    "description": "Original transaction receipt",
    "evidence_type": "document"
  }'
```

## 📊 Response Examples

### Successful Analysis Response
```json
{
  "success": true,
  "data": {
    "transaction_id": "txn_123456",
    "risk_score": 0.73,
    "recommendation": "review",
    "confidence": 0.89,
    "risk_factors": [
      {
        "type": "new_user_high_value",
        "weight": 0.3,
        "description": "New user with high-value transaction"
      },
      {
        "type": "unusual_time_pattern",
        "weight": 0.25,
        "description": "Transaction at unusual hour for user"
      },
      {
        "type": "merchant_risk",
        "weight": 0.18,
        "description": "Merchant has elevated chargeback rate"
      }
    ],
    "user_profile": {
      "account_age": "2 days",
      "transaction_count": 3,
      "average_amount": 125.50,
      "historical_risk_score": 0.12
    },
    "analysis_metadata": {
      "model_version": "v2.3.1",
      "processing_time_ms": 145,
      "data_sources": ["transaction_history", "user_behavior", "merchant_risk"],
      "confidence_threshold": 0.85
    }
  },
  "request_id": "req_789456123",
  "timestamp": "2025-12-20T18:30:15Z"
}
```

### Error Response
```json
{
  "error": {
    "code": "VALIDATION_003",
    "message": "Invalid transaction amount",
    "details": {
      "field": "amount",
      "provided": -50.00,
      "constraints": {
        "min": 0.01,
        "max": 999999.99,
        "type": "positive_decimal"
      }
    },
    "request_id": "req_789456124",
    "timestamp": "2025-12-20T18:30:15Z"
  }
}
```

## 🔍 API Testing Tools

### Postman Collection
Download our complete Postman collection:
[Download Postman Collection](https://api.zenith.com/postman-collection)

### OpenAPI Specification
Access the full OpenAPI 3.0 specification:
[View OpenAPI Spec](https://api.zenith.com/openapi.json)

### SDK Downloads

#### Python SDK
```bash
pip install fraud-detection-sdk
```

```python
from fraud_detection import FraudDetectionClient

client = FraudDetectionClient(api_key="YOUR_API_KEY")
result = client.analyze_transaction(transaction_data)
```

#### JavaScript SDK
```bash
npm install fraud-detection-sdk
```

```javascript
import { FraudDetectionClient } from 'fraud-detection-sdk';

const client = new FraudDetectionClient('YOUR_API_KEY');
const result = await client.analyzeTransaction(transactionData);
```

#### Node.js SDK
```bash
npm install fraud-detection-node-sdk
```

```javascript
const { FraudDetectionClient } = require('fraud-detection-node-sdk');

const client = new FraudDetectionClient('YOUR_API_KEY');
client.analyzeTransaction(transactionData)
    .then(result => console.log(result))
    .catch(error => console.error(error));
```

## 🎛️ Request & Response Guidelines

### Authentication
- Include `Authorization: Bearer YOUR_API_TOKEN` header
- Token expires after 24 hours, use refresh token
- Handle `401 Unauthorized` by refreshing token

### Rate Limiting
- **Free Tier**: 1000 requests/hour
- **Pro Tier**: 10,000 requests/hour
- **Enterprise**: Unlimited requests
- Check `X-RateLimit-Remaining` header for remaining requests
- Retry after `Retry-After` header when rate limited

### Pagination
List endpoints support pagination:

```bash
curl -X GET 'https://api.zenith.com/cases?page=2&limit=50' \
  -H 'Authorization: Bearer YOUR_API_TOKEN'
```

Response includes pagination metadata:
```json
{
  "data": [...],
  "pagination": {
    "page": 2,
    "limit": 50,
    "total_pages": 10,
    "total_items": 487,
    "has_next": true,
    "has_prev": true
  }
}
```

### Filtering & Sorting
```bash
# Filter by status and date range
curl -X GET 'https://api.zenith.com/cases?status=open&created_after=2025-12-01&created_before=2025-12-31' \
  -H 'Authorization: Bearer YOUR_API_TOKEN'

# Sort by creation date (desc)
curl -X GET 'https://api.zenith.com/cases?sort=created_at&order=desc' \
  -H 'Authorization: Bearer YOUR_API_TOKEN'
```

## 🔧 Advanced Features

### Batch Processing
Process multiple transactions in single request:

```bash
curl -X POST 'https://api.zenith.com/fraud/analyze/batch' \
  -H 'Authorization: Bearer YOUR_API_TOKEN' \
  -H 'Content-Type: application/json' \
  -d '{
    "transactions": [
        {"id": "txn_1", "amount": 100.00, "user_id": "user_1"},
        {"id": "txn_2", "amount": 200.00, "user_id": "user_2"},
        {"id": "txn_3", "amount": 150.00, "user_id": "user_3"}
    ],
    "analysis_options": {
        "parallel_processing": true,
        "include_cross_reference": true
    }
  }'
```

### Webhook Configuration
Configure webhooks for real-time notifications:

```bash
curl -X POST 'https://api.zenith.com/webhooks' \
  -H 'Authorization: Bearer YOUR_API_TOKEN' \
  -H 'Content-Type: application/json' \
  -d '{
    "url": "https://your-app.com/webhooks/fraud-alerts",
    "events": ["fraud_detected", "case_created", "analysis_completed"],
    "secret": "your_webhook_secret",
    "active": true
  }'
```

### Custom Risk Models
Configure custom risk model parameters:

```bash
curl -X POST 'https://api.zenith.com/risk-models/custom' \
  -H 'Authorization: Bearer YOUR_API_TOKEN' \
  -H 'Content-Type: application/json' \
  -d '{
    "name": "My Business Risk Model",
    "factors": [
        {"type": "transaction_amount", "weight": 0.3},
        {"type": "user_history", "weight": 0.25},
        {"type": "merchant_risk", "weight": 0.2},
        {"type": "time_pattern", "weight": 0.15},
        {"type": "geo_location", "weight": 0.1}
    ],
    "thresholds": {
        "low_risk": 0.3,
        "medium_risk": 0.6,
        "high_risk": 0.8
    }
  }'
```

## 📞 Support & Resources

### API Documentation
- [Complete API Reference](./README.md)
- [Error Codes](./error_codes.md)
- [Rate Limiting](./rate_limiting.md)
- [Authentication Guide](./authentication.md)

### Support Channels
- **Email**: api-support@zenith.com
- **Discord**: [Developer Community](https://discord.gg/Zenith)
- **Status Page**: [API Status](https://status.zenith.com)
- **Documentation Issues**: [GitHub Issues](https://github.com/Zenith/docs/issues)

### Testing Environment
For testing and development:
- **Base URL**: https://api-staging.Zenith.com
- **Test API Key**: `test_key_123456789`
- **Features**: All production features enabled
- **Data**: Mock transaction data

---

Start exploring the API with our interactive tools above! For detailed endpoint documentation, see the [API Reference](./README.md).