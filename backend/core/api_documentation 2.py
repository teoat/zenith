"""
API Documentation Configuration using FastAPI/OpenAPI
Provides comprehensive API documentation with examples and schemas
"""
from fastapi import FastAPI
from fastapi.openapi.utils import get_openapi

def custom_openapi_schema(app: FastAPI):
    """Generate custom OpenAPI schema with comprehensive documentation"""
    if app.openapi_schema:
        return app.openapi_schema

    openapi_schema = get_openapi(
        title="378x492 Fraud Detection Platform API",
        version="2.0.0",
        description="""
## 378x492 Fraud Detection Platform

### Overview
Comprehensive fraud detection and investigation platform with AI-powered analysis, 
multi-modal evidence processing, and advanced network visualization capabilities.

### Key Features
- 🔐 **Secure Authentication**: JWT-based authentication with MFA support
- 🕵️ **Fraud Detection**: Advanced ML algorithms for transaction analysis
- 📊 **Case Management**: Complete investigation workflow management
- 🌐 **Network Analysis**: Entity relationship mapping and visualization
- 📁 **Evidence Processing**: Multi-modal file analysis (images, documents, videos)
- 📈 **Analytics & Reporting**: Real-time dashboards and custom reports

### Authentication
All endpoints (except `/auth/login` and `/auth/register`) require Bearer token authentication:

```
Authorization: Bearer <your_access_token>
```

### Rate Limiting
- **Per Minute**: 60 requests
- **Per Hour**: 1000 requests

### Error Responses
All errors follow this format:
```json
{
    "detail": "Error message",
    "status_code": 400
}
```

### Support
- Documentation: https://docs.378x492.com
- Support Email: support@378x492.com
- GitHub: https://github.com/378x492/fraud-detection
        """,
        routes=app.routes,
        servers=[
            {
                "url": "https://api.378x492.com",
                "description": "Production server"
            },
            {
                "url": "https://staging.378x492.com",
                "description": "Staging server"
            },
            {
                "url": "http://localhost:8000",
                "description": "Development server"
            }
        ],
        tags=[
            {
                "name": "Authentication",
                "description": "User authentication and authorization endpoints. "
                              "Includes login, registration, MFA setup, and token management."
            },
            {
                "name": "Fraud Detection",
                "description": "Fraud detection and analysis endpoints. "
                              "Real-time transaction analysis, risk scoring, and alert generation."
            },
            {
                "name": "Case Management",
                "description": "Investigation case management. "
                              "Create, update, assign, and close fraud investigation cases."
            },
            {
                "name": "Evidence",
                "description": "Evidence upload and management. "
                              "Multi-modal file analysis including OCR, image analysis, and metadata extraction."
            },
            {
                "name": "Network Analysis",
                "description": "Entity and relationship network analysis. "
                              "Graph-based fraud detection and pattern recognition."
            },
            {
                "name": "Analytics",
                "description": "Analytics and reporting endpoints. "
                              "Statistics, metrics, and custom report generation."
            },
            {
                "name": "Admin",
                "description": "Administrative functions. "
                              "User management, system configuration, and audit logs. "
                              "**Requires ADMIN role**."
            },
            {
                "name": "Health",
                "description": "System health and monitoring. "
                              "Health checks, metrics, and system status."
            }
        ]
    )

    # Add security schemes
    openapi_schema["components"]["securitySchemes"] = {
        "BearerAuth": {
            "type": "http",
            "scheme": "bearer",
            "bearerFormat": "JWT",
            "description": "JWT token obtained from /auth/login endpoint"
        }
    }

    # Add example responses
    openapi_schema["components"]["examples"] = {
        "SuccessfulLogin": {
            "summary": "Successful login response",
            "value": {
                "access_token": "eyJ0eXAiOiJKV1QiLCJhbGc...",
                "refresh_token": "eyJ0eXAiOiJKV1QiLCJhbGc...",
                "token_type": "bearer",
                "expires_in": 1800
            }
        },
        "FraudAnalysis": {
            "summary": "Fraud analysis result",
            "value": {
                "transaction_id": "TXN001",
                "fraud_score": 0.85,
                "risk_level": "HIGH",
                "risk_factors": [
                    "large_amount",
                    "unusual_location",
                    "rapid_transactions"
                ],
                "recommendation": "REVIEW_REQUIRED"
            }
        },
        "CaseCreated": {
            "summary": "Newly created case",
            "value": {
                "case_id": "CASE-2025-001",
                "title": "Suspicious Transaction Investigation",
                "status": "OPEN",
                "priority": "HIGH",
                "created_at": "2025-12-17T05:00:00Z",
                "assigned_to": "investigator@example.com"
            }
        }
    }

    # Add common schemas
    openapi_schema["components"]["schemas"]["Error"] = {
        "type": "object",
        "properties": {
            "detail": {
                "type": "string",
                "description": "Error message"
            },
            "status_code": {
                "type": "integer",
                "description": "HTTP status code"
            }
        }
    }

    app.openapi_schema = openapi_schema
    return app.openapi_schema


def setup_api_documentation(app: FastAPI):
    """Setup comprehensive API documentation"""
    
    # Override default OpenAPI schema
    app.openapi = lambda: custom_openapi_schema(app)
    
    # Configure Swagger UI
    app.swagger_ui_parameters = {
        "deepLinking": True,
        "displayRequestDuration": True,
        "filter": True,
        "showExtensions": True,
        "showCommonExtensions": True,
        "syntaxHighlight.theme": "monokai",
    }
    
    return app


# Example endpoint documentation
"""
@router.post(
    "/fraud/analyze",
    tags=["Fraud Detection"],
    summary="Analyze transaction for fraud",
    description=\"\"\"
    Analyzes a transaction using machine learning models to detect potential fraud.
    
    Returns a fraud score (0-1) and risk level classification.
    Scores above 0.75 are considered high risk and should be reviewed.
    \"\"\",
    response_description="Fraud analysis result with score and risk factors",
    responses={
        200: {
            "description": "Successful analysis",
            "content": {
                "application/json": {
                    "example": {
                        "transaction_id": "TXN001",
                        "fraud_score": 0.85,
                        "risk_level": "HIGH",
                        "risk_factors": ["large_amount", "unusual_location"]
                    }
                }
            }
        },
        401: {"description": "Unauthorized - Invalid or missing token"},
        422: {"description": "Validation Error - Invalid transaction data"}
    }
)
async def analyze_transaction(transaction: TransactionData):
    pass
"""
