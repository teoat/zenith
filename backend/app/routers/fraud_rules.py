"""
Fraud Rules Engine API Router
Provides endpoints for managing and using fraud detection rules
"""

import logging
from typing import Any, Dict, List, Optional

from fastapi import APIRouter, Depends, HTTPException, Body
from pydantic import BaseModel, Field
from sqlalchemy.orm import Session
from datetime import datetime

from app.services.fraud.engine import RuleEngine, AlertSeverity
from core.database import get_db

logger = logging.getLogger(__name__)

router = APIRouter(
    prefix="",
    tags=["Fraud Rules Engine"],
    responses={404: {"description": "Not found"}},
)

# Singleton Engine Instance
_engine_instance = None

def get_fraud_engine() -> RuleEngine:
    global _engine_instance
    if not _engine_instance:
        # Warning: Initializing this inside a request might cause asyncio loop issues 
        # if the engine init tries to run async code synchronously.
        # Ideally this should be initialized at app startup.
        try:
             _engine_instance = RuleEngine()
        except RuntimeError:
             # Fallback if loop is running (e.g. during tests or lazy load)
             # The engine init tries to create a new loop.
             logger.warning("Re-using existing engine instance logic or handling loop conflict")
             # Modifying engine to support async init would be better, but for now:
             _engine_instance = RuleEngine() 
    return _engine_instance

# Request/Response Models
class RuleResponse(BaseModel):
    name: str
    severity: str
    enabled: bool
    config: Optional[Dict[str, Any]] = None

class EvaluateTransactionRequest(BaseModel):
    transaction_data: Dict[str, Any] = Field(..., description="Transaction data")

@router.get("/", response_model=List[RuleResponse])
async def list_rules():
    """List all loaded fraud detection rules"""
    engine = get_fraud_engine()
    rules = []
    for name, rule in engine.rules.items():
        rules.append(RuleResponse(
            name=rule.name,
            severity=rule.severity.value,
            enabled=rule.enabled,
            config=rule.get_config_schema()
        ))
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
        config=rule.get_config_schema()
    )

@router.post("/evaluate")
async def evaluate_transaction(
    request: EvaluateTransactionRequest, 
    context: Dict[str, Any] = Body(None)
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
            results.append({
                "rule_name": alert.rule_name,
                "severity": alert.severity.value,
                "risk_score": alert.risk_score,
                "description": alert.description
            })
            
        return {
            "transaction_id": request.transaction_data.get("id"),
            "risk_score": sum(a['risk_score'] for a in results),
            "triggered_rules": results,
            "timestamp": datetime.now().isoformat()
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
    raise HTTPException(status_code=501, detail="Rule creation is managed via Plugins registry")

@router.delete("/{rule_id}")
async def delete_rule(rule_id: str):
    raise HTTPException(status_code=501, detail="Rule deletion is managed via Plugins registry")
