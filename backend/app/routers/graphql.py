"""
GraphQL API for complex fraud detection queries
Provides flexible querying capabilities for advanced analytics and investigations
"""

import logging
from datetime import datetime
from typing import Any

from fastapi import APIRouter, Depends, HTTPException
from graphql import (
    GraphQLBoolean,
    GraphQLField,
    GraphQLFloat,
    GraphQLInt,
    GraphQLList,
    GraphQLNonNull,
    GraphQLObjectType,
    GraphQLSchema,
    GraphQLString,
)
from graphql.execution.executors.asyncio import AsyncioExecutor
from pydantic import BaseModel
from sqlalchemy.orm import Session
from starlette.graphql import GraphQLApp

from app.services.infrastructure.auth_service import auth_service
from core.database import User, get_db

logger = logging.getLogger(__name__)

router = APIRouter()


class GraphQLQueryRequest(BaseModel):
    query: str
    variables: dict[str, Any] | None = None
    operation_name: str | None = None


# GraphQL Types
CaseType = GraphQLObjectType(
    name="Case",
    fields={
        "id": GraphQLField(GraphQLNonNull(GraphQLString)),
        "title": GraphQLField(GraphQLString),
        "description": GraphQLField(GraphQLString),
        "status": GraphQLField(GraphQLString),
        "priority": GraphQLField(GraphQLString),
        "risk_score": GraphQLField(GraphQLFloat),
        "risk_level": GraphQLField(GraphQLString),
        "fraud_amount": GraphQLField(GraphQLFloat),
        "created_at": GraphQLField(GraphQLString),
        "updated_at": GraphQLField(GraphQLString),
    },
)

TransactionType = GraphQLObjectType(
    name="Transaction",
    fields={
        "id": GraphQLField(GraphQLNonNull(GraphQLString)),
        "case_id": GraphQLField(GraphQLString),
        "amount": GraphQLField(GraphQLFloat),
        "currency": GraphQLField(GraphQLString),
        "date": GraphQLField(GraphQLString),
        "description": GraphQLField(GraphQLString),
        "merchant_name": GraphQLField(GraphQLString),
        "category": GraphQLField(GraphQLString),
        "ip_address": GraphQLField(GraphQLString),
        "device_fingerprint": GraphQLField(GraphQLString),
    },
)

EvidenceType = GraphQLObjectType(
    name="Evidence",
    fields={
        "id": GraphQLField(GraphQLNonNull(GraphQLString)),
        "case_id": GraphQLField(GraphQLString),
        "filename": GraphQLField(GraphQLString),
        "file_type": GraphQLField(GraphQLString),
        "size_bytes": GraphQLField(GraphQLInt),
        "uploaded_at": GraphQLField(GraphQLString),
        "processed": GraphQLField(GraphQLBoolean),
    },
)

AlertType = GraphQLObjectType(
    name="Alert",
    fields={
        "id": GraphQLField(GraphQLNonNull(GraphQLString)),
        "type": GraphQLField(GraphQLString),
        "severity": GraphQLField(GraphQLString),
        "message": GraphQLField(GraphQLString),
        "case_id": GraphQLField(GraphQLString),
        "created_at": GraphQLField(GraphQLString),
        "resolved": GraphQLField(GraphQLBoolean),
    },
)

# Root Query Type
QueryType = GraphQLObjectType(
    name="Query",
    fields={
        "cases": GraphQLField(
            GraphQLList(CaseType),
            args={
                "limit": GraphQLInt(default_value=10),
                "offset": GraphQLInt(default_value=0),
                "status": GraphQLString(),
                "priority": GraphQLString(),
                "risk_level": GraphQLString(),
            },
            resolve=lambda obj, info, **kwargs: resolve_cases(info, **kwargs),
        ),
        "case": GraphQLField(
            CaseType,
            args={
                "id": GraphQLNonNull(GraphQLString),
            },
            resolve=lambda obj, info, **kwargs: resolve_case(info, **kwargs),
        ),
        "transactions": GraphQLField(
            GraphQLList(TransactionType),
            args={
                "case_id": GraphQLString(),
                "limit": GraphQLInt(default_value=50),
                "offset": GraphQLInt(default_value=0),
                "start_date": GraphQLString(),
                "end_date": GraphQLString(),
            },
            resolve=lambda obj, info, **kwargs: resolve_transactions(info, **kwargs),
        ),
        "evidence": GraphQLField(
            GraphQLList(EvidenceType),
            args={
                "case_id": GraphQLString(),
                "limit": GraphQLInt(default_value=20),
                "offset": GraphQLInt(default_value=0),
            },
            resolve=lambda obj, info, **kwargs: resolve_evidence(info, **kwargs),
        ),
        "alerts": GraphQLField(
            GraphQLList(AlertType),
            args={
                "case_id": GraphQLString(),
                "resolved": GraphQLBoolean(),
                "limit": GraphQLInt(default_value=20),
                "offset": GraphQLInt(default_value=0),
            },
            resolve=lambda obj, info, **kwargs: resolve_alerts(info, **kwargs),
        ),
        "case_analytics": GraphQLField(
            GraphQLObjectType(
                name="CaseAnalytics",
                fields={
                    "total_cases": GraphQLField(GraphQLInt),
                    "open_cases": GraphQLField(GraphQLInt),
                    "high_risk_cases": GraphQLField(GraphQLInt),
                    "total_fraud_amount": GraphQLField(GraphQLFloat),
                    "avg_resolution_time": GraphQLField(GraphQLFloat),
                },
            ),
            resolve=lambda obj, info: resolve_case_analytics(info),
        ),
    },
)

# Create Schema
schema = GraphQLSchema(query=QueryType)


# Resolver functions
async def resolve_cases(info, limit=10, offset=0, status=None, priority=None, risk_level=None):
    """Resolve cases query"""
    try:
        db = info.context.get("db")
        if not db:
            raise Exception("Database not available")

        from app.services.infrastructure.storage.database_service import db_service

        filters = {}

        if status:
            filters["status"] = status
        if priority:
            filters["priority"] = priority
        if risk_level:
            filters["risk_level"] = risk_level

        result = db_service.get_cases_paginated(page=(offset // limit) + 1, per_page=limit, filters=filters)

        return result.get("cases", [])

    except Exception as e:
        logger.error(f"GraphQL cases resolver error: {e}")
        return []


async def resolve_case(info, id):
    """Resolve single case query"""
    try:
        db = info.context.get("db")
        if not db:
            raise Exception("Database not available")

        from app.services.infrastructure.storage.database_service import db_service

        result = db_service.get_case_with_details(id)

        if result and result.get("case"):
            case = result["case"]
            return {
                "id": case.id,
                "title": case.title,
                "description": case.description,
                "status": case.status,
                "priority": case.priority,
                "risk_score": case.risk_score,
                "risk_level": case.risk_level,
                "fraud_amount": case.fraud_amount,
                "created_at": case.created_at.isoformat() if case.created_at else None,
                "updated_at": case.updated_at.isoformat() if case.updated_at else None,
            }
        return None

    except Exception as e:
        logger.error(f"GraphQL case resolver error: {e}")
        return None


async def resolve_transactions(info, case_id=None, limit=50, offset=0, start_date=None, end_date=None):
    """Resolve transactions query"""
    try:
        db = info.context.get("db")
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

        return [
            {
                "id": t.id,
                "case_id": t.case_id,
                "amount": t.amount,
                "currency": t.currency,
                "date": t.date.isoformat() if t.date else None,
                "description": t.description,
                "merchant_name": t.merchant_name,
                "category": t.category,
                "ip_address": t.ip_address,
                "device_fingerprint": t.device_fingerprint,
            }
            for t in transactions
        ]

    except Exception as e:
        logger.error(f"GraphQL transactions resolver error: {e}")
        return []


async def resolve_evidence(info, case_id=None, limit=20, offset=0):
    """Resolve evidence query"""
    try:
        db = info.context.get("db")
        if not db:
            raise Exception("Database not available")

        from core.database import Evidence

        query = db.query(Evidence)

        if case_id:
            query = query.filter(Evidence.case_id == case_id)

        evidence = query.offset(offset).limit(limit).all()

        return [
            {
                "id": e.id,
                "case_id": e.case_id,
                "filename": e.filename,
                "file_type": e.file_type,
                "size_bytes": e.size_bytes,
                "uploaded_at": e.uploaded_at.isoformat() if e.uploaded_at else None,
                "processed": bool(e.processed_at),  # Simple check
            }
            for e in evidence
        ]

    except Exception as e:
        logger.error(f"GraphQL evidence resolver error: {e}")
        return []


async def resolve_alerts(info, case_id=None, resolved=None, limit=20, offset=0):
    """Resolve alerts query"""
    try:
        # Mock alerts data (in real implementation, use proper alert service)
        alerts = [
            {
                "id": "alert_1",
                "type": "fraud_pattern",
                "severity": "high",
                "message": "Unusual transaction pattern detected",
                "case_id": case_id or "case_123",
                "created_at": datetime.now().isoformat(),
                "resolved": False,
            },
            {
                "id": "alert_2",
                "type": "risk_score",
                "severity": "medium",
                "message": "High risk score for transaction",
                "case_id": case_id or "case_456",
                "created_at": datetime.now().isoformat(),
                "resolved": True,
            },
        ]

        # Filter by case_id if provided
        if case_id:
            alerts = [a for a in alerts if a["case_id"] == case_id]

        # Filter by resolved status if provided
        if resolved is not None:
            alerts = [a for a in alerts if a["resolved"] == resolved]

        return alerts[offset : offset + limit]

    except Exception as e:
        logger.error(f"GraphQL alerts resolver error: {e}")
        return []


async def resolve_case_analytics(info):
    """Resolve case analytics query"""
    try:
        db = info.context.get("db")
        if not db:
            raise Exception("Database not available")

        # Mock analytics (in real implementation, use proper analytics service)
        return {
            "total_cases": 150,
            "open_cases": 45,
            "high_risk_cases": 23,
            "total_fraud_amount": 2500000.0,
            "avg_resolution_time": 8.5,
        }

    except Exception as e:
        logger.error(f"GraphQL analytics resolver error: {e}")
        return {
            "total_cases": 0,
            "open_cases": 0,
            "high_risk_cases": 0,
            "total_fraud_amount": 0.0,
            "avg_resolution_time": 0.0,
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
            "user": current_user,
            "db": db,
            "request": request,
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
                "errors": [{"message": str(error)} for error in result.errors],
            }

        return {"data": result.data}

    except Exception as e:
        logger.error(f"GraphQL endpoint error: {e}")
        raise HTTPException(status_code=500, detail=f"GraphQL query failed: {e!s}")


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
          transactions(case_id: "case_123", limit: 5) {
            id
            amount
            date
            merchantName
          }
          evidence(case_id: "case_123") {
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
        """,
    }
