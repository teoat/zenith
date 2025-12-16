# ARCHIVE: docs/api/README.md

(Archived original file - preserved verbatim)

# API Documentation

This document provides comprehensive API documentation for the Simple378 Fraud Detection backend.

## 📋 Overview

The Simple378 API is built with FastAPI and provides RESTful endpoints for fraud detection, case management, evidence processing, and system monitoring.

**Base URL:** `http://localhost:8000/api/v1`

**Authentication:** HMAC request signing (handled automatically by the desktop client)

**Response Format:** JSON

## 🔍 Case Management

### List Cases
```http
GET /api/v1/cases
```

**Query Parameters:**
- `page` (int): Page number (default: 1)
- `per_page` (int): Items per page (default: 20)
- `status` (str): Filter by case status
- `priority` (str): Filter by priority
- `assignee_id` (str): Filter by assignee
- `risk_level` (str): Filter by risk level
- `search` (str): Search term

**Response:**
```json
{
  "cases": [
    {
      "id": "case-123",
      "title": "Credit Card Fraud Investigation",
      "description": "Investigation of suspicious credit card transactions",
      "status": "open",
      "priority": "high",
      "case_type": "financial_fraud",
      "assignee_id": "user-456",
      "risk_score": 85.5,
      "risk_level": "high",
      "created_at": "2025-12-08T10:00:00Z",
      "updated_at": "2025-12-08T14:30:00Z"
    }
  ],
  "total": 150,
  "page": 1,
  "per_page": 20,
  "total_pages": 8
}
```

(Full original file archived.)
