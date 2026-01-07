"""
Fraud Rules Engine API Router
Provides endpoints for managing and using fraud detection rules
"""

import logging
from datetime import datetime
from typing import Any

from fastapi import APIRouter, Body, HTTPException
from pydantic import BaseModel, Field

from app.services.fraud.engine import RuleEngine

logger = logging.getLogger(__name__)

router = APIRouter(
    prefix="",
    tags=["Fraud Rules Engine"],
    responses={404: {"description": "Not found"}},
)

from app.services.fraud.engine import rule_engine


def get_fraud_engine() -> RuleEngine:
    return rule_engine


# Request/Response Models
class RuleResponse(BaseModel):
    name: str
    severity: str
    enabled: bool
    config: dict[str, Any] | None = None


class EvaluateTransactionRequest(BaseModel):
    transaction_data: dict[str, Any] = Field(..., description="Transaction data")


@router.get("/", response_model=list[RuleResponse])
async def list_rules():
    """List all loaded fraud detection rules"""
    engine = get_fraud_engine()
    rules = []
    for rule in engine.rules.values():
        rules.append(
            RuleResponse(
                name=rule.name,
                severity=rule.severity.value,
                enabled=rule.enabled,
                config=rule.get_config_schema(),
            )
        )
    return rules


@router.get("/{rule_name}", response_model=RuleResponse)
async def get_rule(rule_name: str):
    """Get details of a specific rule"""
    engine = get_fraud_engine()
    if rule_name not in engine.rules:
        raise HTTPException(status_code=404, detail="Rule not found")
    rule = engine.rules[rule_name]
    return RuleResponse(
        name=rule.name,
        severity=rule.severity.value,
        enabled=rule.enabled,
        config=rule.get_config_schema(),
    )


@router.post("/evaluate")
async def evaluate_transaction(
    request: EvaluateTransactionRequest, context: dict[str, Any] = Body(None)
):
    """Evaluate a transaction against all active rules"""
    try:
        engine = get_fraud_engine()
        # Initialize plugins if not already loaded (simple check)
        # Note: In a real prod app, use a startup event `on_event("startup")` to init engine
        if not engine.rules:
            await engine.initialize()

        # engine.execute_rules expects a LIST of transactions
        alerts = await engine.execute_rules([request.transaction_data], context or {})

        # Convert Alerts to dicts
        results = []
        for alert in alerts:
            results.append(
                {
                    "rule_name": alert.rule_name,
                    "severity": alert.severity.value,
                    "risk_score": alert.risk_score,
                    "description": alert.description,
                }
            )

        return {
            "transaction_id": request.transaction_data.get("id"),
            "risk_score": sum(a["risk_score"] for a in results),
            "triggered_rules": results,
            "timestamp": datetime.now().isoformat(),
        }
    except Exception as e:
        logger.error(f"Error evaluating transaction: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/config/status")
async def get_engine_status():
    """Get status of all rules"""
    engine = get_fraud_engine()
    return engine.get_rule_status()


# Stubbed endpoints for frontend compatibility (if needed)
@router.post("/")
async def create_rule():
    raise HTTPException(
        status_code=501, detail="Rule creation is managed via Plugins registry"
    )


@router.delete("/{rule_id}")
async def delete_rule(rule_id: str):
    raise HTTPException(
        status_code=501, detail="Rule deletion is managed via Plugins registry"
    )
