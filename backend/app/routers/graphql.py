"""
GraphQL API for complex fraud detection queries
Provides flexible querying capabilities for advanced analytics and investigations
"""
import logging
from datetime import datetime
from typing import Any, Dict, List, Optional
from fastapi import APIRouter, Depends, HTTPException
from graphql import GraphQLSchema, GraphQLObjectType, GraphQLField, GraphQLString, GraphQLList, GraphQLInt, GraphQLFloat, GraphQLBoolean, GraphQLNonNull
from graphql.execution.executors.asyncio import AsyncioExecutor
from starlette.graphql import GraphQLApp
from pydantic import BaseModel

from app.services.infrastructure.auth_service import auth_service
from core.database import User, get_db
from sqlalchemy.orm import Session

logger = logging.getLogger(__name__)

router = APIRouter()


class GraphQLQueryRequest(BaseModel):
    query: str
    variables: Optional[Dict[str, Any]] = None
    operation_name: Optional[str] = None


# GraphQL Types
CaseType = GraphQLObjectType(
    name='Case',
    fields={
        'id': GraphQLField(GraphQLNonNull(GraphQLString)),
        'title': GraphQLField(GraphQLString),
        'description': GraphQLField(GraphQLString),
        'status': GraphQLField(GraphQLString),
        'priority': GraphQLField(GraphQLString),
        'riskScore': GraphQLField(GraphQLFloat),
        'riskLevel': GraphQLField(GraphQLString),
        'fraudAmount': GraphQLField(GraphQLFloat),
        'createdAt': GraphQLField(GraphQLString),
        'updatedAt': GraphQLField(GraphQLString),
    }
)

TransactionType = GraphQLObjectType(
    name='Transaction',
    fields={
        'id': GraphQLField(GraphQLNonNull(GraphQLString)),
        'caseId': GraphQLField(GraphQLString),
        'amount': GraphQLField(GraphQLFloat),
        'currency': GraphQLField(GraphQLString),
        'date': GraphQLField(GraphQLString),
        'description': GraphQLField(GraphQLString),
        'merchantName': GraphQLField(GraphQLString),
        'category': GraphQLField(GraphQLString),
        'ipAddress': GraphQLField(GraphQLString),
        'deviceFingerprint': GraphQLField(GraphQLString),
    }
)

EvidenceType = GraphQLObjectType(
    name='Evidence',
    fields={
        'id': GraphQLField(GraphQLNonNull(GraphQLString)),
        'caseId': GraphQLField(GraphQLString),
        'filename': GraphQLField(GraphQLString),
        'fileType': GraphQLField(GraphQLString),
        'sizeBytes': GraphQLField(GraphQLInt),
        'uploadedAt': GraphQLField(GraphQLString),
        'processed': GraphQLField(GraphQLBoolean),
    }
)

AlertType = GraphQLObjectType(
    name='Alert',
    fields={
        'id': GraphQLField(GraphQLNonNull(GraphQLString)),
        'type': GraphQLField(GraphQLString),
        'severity': GraphQLField(GraphQLString),
        'message': GraphQLField(GraphQLString),
        'caseId': GraphQLField(GraphQLString),
        'createdAt': GraphQLField(GraphQLString),
        'resolved': GraphQLField(GraphQLBoolean),
    }
)

# Root Query Type
QueryType = GraphQLObjectType(
    name='Query',
    fields={
        'cases': GraphQLField(
            GraphQLList(CaseType),
            args={
                'limit': GraphQLInt(default_value=10),
                'offset': GraphQLInt(default_value=0),
                'status': GraphQLString(),
                'priority': GraphQLString(),
                'riskLevel': GraphQLString(),
            },
            resolve=lambda obj, info, **kwargs: resolve_cases(info, **kwargs)
        ),
        'case': GraphQLField(
            CaseType,
            args={
                'id': GraphQLNonNull(GraphQLString),
            },
            resolve=lambda obj, info, **kwargs: resolve_case(info, **kwargs)
        ),
        'transactions': GraphQLField(
            GraphQLList(TransactionType),
            args={
                'caseId': GraphQLString(),
                'limit': GraphQLInt(default_value=50),
                'offset': GraphQLInt(default_value=0),
                'startDate': GraphQLString(),
                'endDate': GraphQLString(),
            },
            resolve=lambda obj, info, **kwargs: resolve_transactions(info, **kwargs)
        ),
        'evidence': GraphQLField(
            GraphQLList(EvidenceType),
            args={
                'caseId': GraphQLString(),
                'limit': GraphQLInt(default_value=20),
                'offset': GraphQLInt(default_value=0),
            },
            resolve=lambda obj, info, **kwargs: resolve_evidence(info, **kwargs)
        ),
        'alerts': GraphQLField(
            GraphQLList(AlertType),
            args={
                'caseId': GraphQLString(),
                'resolved': GraphQLBoolean(),
                'limit': GraphQLInt(default_value=20),
                'offset': GraphQLInt(default_value=0),
            },
            resolve=lambda obj, info, **kwargs: resolve_alerts(info, **kwargs)
        ),
        'caseAnalytics': GraphQLField(
            GraphQLObjectType(
                name='CaseAnalytics',
                fields={
                    'totalCases': GraphQLField(GraphQLInt),
                    'openCases': GraphQLField(GraphQLInt),
                    'highRiskCases': GraphQLField(GraphQLInt),
                    'totalFraudAmount': GraphQLField(GraphQLFloat),
                    'avgResolutionTime': GraphQLField(GraphQLFloat),
                }
            ),
            resolve=lambda obj, info: resolve_case_analytics(info)
        ),
    }
)

# Create Schema
schema = GraphQLSchema(query=QueryType)


# Resolver functions
async def resolve_cases(info, limit=10, offset=0, status=None, priority=None, risk_level=None):
    """Resolve cases query"""
    try:
        db = info.context.get('db')
        if not db:
            raise Exception("Database not available")

        from app.services.infrastructure.storage.database_service import db_service
        filters = {}

        if status:
            filters['status'] = status
        if priority:
            filters['priority'] = priority
        if risk_level:
            filters['risk_level'] = risk_level

        result = db_service.get_cases_paginated(
            page=(offset // limit) + 1,
            per_page=limit,
            filters=filters
        )

        return result.get('cases', [])

    except Exception as e:
        logger.error(f"GraphQL cases resolver error: {e}")
        return []


async def resolve_case(info, id):
    """Resolve single case query"""
    try:
        db = info.context.get('db')
        if not db:
            raise Exception("Database not available")

        from app.services.infrastructure.storage.database_service import db_service
        result = db_service.get_case_with_details(id)

        if result and result.get('case'):
            case = result['case']
            return {
                'id': case.id,
                'title': case.title,
                'description': case.description,
                'status': case.status,
                'priority': case.priority,
                'riskScore': case.risk_score,
                'riskLevel': case.risk_level,
                'fraudAmount': case.fraud_amount,
                'createdAt': case.created_at.isoformat() if case.created_at else None,
                'updatedAt': case.updated_at.isoformat() if case.updated_at else None,
            }
        return None

    except Exception as e:
        logger.error(f"GraphQL case resolver error: {e}")
        return None


async def resolve_transactions(info, case_id=None, limit=50, offset=0, start_date=None, end_date=None):
    """Resolve transactions query"""
    try:
        db = info.context.get('db')
        if not db:
            raise Exception("Database not available")

        # Simple transaction query (in real implementation, use proper service)
        from core.database import Transaction
        query = db.query(Transaction)

        if case_id:
            query = query.filter(Transaction.case_id == case_id)

        if start_date:
            query = query.filter(Transaction.date >= start_date)
        if end_date:
            query = query.filter(Transaction.date <= end_date)

        transactions = query.offset(offset).limit(limit).all()

        return [{
            'id': t.id,
            'caseId': t.case_id,
            'amount': t.amount,
            'currency': t.currency,
            'date': t.date.isoformat() if t.date else None,
            'description': t.description,
            'merchantName': t.merchant_name,
            'category': t.category,
            'ipAddress': t.ip_address,
            'deviceFingerprint': t.device_fingerprint,
        } for t in transactions]

    except Exception as e:
        logger.error(f"GraphQL transactions resolver error: {e}")
        return []


async def resolve_evidence(info, case_id=None, limit=20, offset=0):
    """Resolve evidence query"""
    try:
        db = info.context.get('db')
        if not db:
            raise Exception("Database not available")

        from core.database import Evidence
        query = db.query(Evidence)

        if case_id:
            query = query.filter(Evidence.case_id == case_id)

        evidence = query.offset(offset).limit(limit).all()

        return [{
            'id': e.id,
            'caseId': e.case_id,
            'filename': e.filename,
            'fileType': e.file_type,
            'sizeBytes': e.size_bytes,
            'uploadedAt': e.uploaded_at.isoformat() if e.uploaded_at else None,
            'processed': bool(e.processed_at),  # Simple check
        } for e in evidence]

    except Exception as e:
        logger.error(f"GraphQL evidence resolver error: {e}")
        return []


async def resolve_alerts(info, case_id=None, resolved=None, limit=20, offset=0):
    """Resolve alerts query"""
    try:
        # Mock alerts data (in real implementation, use proper alert service)
        alerts = [
            {
                'id': 'alert_1',
                'type': 'fraud_pattern',
                'severity': 'high',
                'message': 'Unusual transaction pattern detected',
                'caseId': case_id or 'case_123',
                'createdAt': datetime.now().isoformat(),
                'resolved': False,
            },
            {
                'id': 'alert_2',
                'type': 'risk_score',
                'severity': 'medium',
                'message': 'High risk score for transaction',
                'caseId': case_id or 'case_456',
                'createdAt': datetime.now().isoformat(),
                'resolved': True,
            }
        ]

        # Filter by case_id if provided
        if case_id:
            alerts = [a for a in alerts if a['caseId'] == case_id]

        # Filter by resolved status if provided
        if resolved is not None:
            alerts = [a for a in alerts if a['resolved'] == resolved]

        return alerts[offset:offset + limit]

    except Exception as e:
        logger.error(f"GraphQL alerts resolver error: {e}")
        return []


async def resolve_case_analytics(info):
    """Resolve case analytics query"""
    try:
        db = info.context.get('db')
        if not db:
            raise Exception("Database not available")

        # Mock analytics (in real implementation, use proper analytics service)
        return {
            'totalCases': 150,
            'openCases': 45,
            'highRiskCases': 23,
            'totalFraudAmount': 2500000.0,
            'avgResolutionTime': 8.5,
        }

    except Exception as e:
        logger.error(f"GraphQL analytics resolver error: {e}")
        return {
            'totalCases': 0,
            'openCases': 0,
            'highRiskCases': 0,
            'totalFraudAmount': 0.0,
            'avgResolutionTime': 0.0,
        }


# GraphQL App
graphql_app = GraphQLApp(schema=schema, executor_class=AsyncioExecutor)


@router.post("/graphql", include_in_schema=False)
async def graphql_endpoint(
    request: GraphQLQueryRequest,
    current_user: User = Depends(auth_service.get_current_user),
    db: Session = Depends(get_db),
):
    """
    GraphQL endpoint for complex fraud detection queries
    Allows flexible querying of cases, transactions, evidence, and alerts
    """
    try:
        # Add context for resolvers
        context = {
            'user': current_user,
            'db': db,
            'request': request,
        }

        # Execute GraphQL query
        result = await graphql_app.execute(
            request.query,
            variables=request.variables,
            operation_name=request.operation_name,
            context_value=context,
        )

        if result.errors:
            logger.error(f"GraphQL query errors: {result.errors}")
            return {
                "data": result.data,
                "errors": [{"message": str(error)} for error in result.errors]
            }

        return {"data": result.data}

    except Exception as e:
        logger.error(f"GraphQL endpoint error: {e}")
        raise HTTPException(status_code=500, detail=f"GraphQL query failed: {str(e)}")


@router.get("/graphql/playground", include_in_schema=False)
async def graphql_playground():
    """
    GraphQL Playground for testing queries
    """
    return {
        "message": "GraphQL Playground",
        "endpoint": "/api/v1/graphql",
        "docs": """
        Use this endpoint to explore the GraphQL API for fraud detection.

        Example queries:

        # Get all high-priority cases
        query {
          cases(priority: "High", limit: 10) {
            id
            title
            status
            riskScore
            fraudAmount
          }
        }

        # Get case with related transactions and evidence
        query {
          case(id: "case_123") {
            id
            title
            status
            riskScore
          }
          transactions(caseId: "case_123", limit: 5) {
            id
            amount
            date
            merchantName
          }
          evidence(caseId: "case_123") {
            id
            filename
            fileType
            uploadedAt
          }
        }

        # Get analytics summary
        query {
          caseAnalytics {
            totalCases
            openCases
            highRiskCases
            totalFraudAmount
          }
        }
        """
    }