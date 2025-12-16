"""
<<<<<<< Updated upstream
Fraud Rules Engine API Router
Provides endpoints for managing and using fraud detection rules
"""

from fastapi import APIRouter, HTTPException, BackgroundTasks, Depends
from pydantic import BaseModel, Field
from typing import List, Dict, Any, Optional
from datetime import datetime, timezone
import logging
from sqlalchemy.orm import Session

from core.database import get_db
from app.services.fraud_rules_engine import get_fraud_engine

logger = logging.getLogger(__name__)

router = APIRouter(
    prefix="",
    tags=["Fraud Rules Engine"],
    responses={404: {"description": "Not found"}},
)

# Request/Response Models

class RuleConditionModel(BaseModel):
    field: str = Field(..., description="Field to evaluate")
    operator: str = Field(..., description="Comparison operator")
    value: Any = Field(..., description="Value to compare against")
    case_sensitive: bool = Field(False, description="Case sensitivity for string comparisons")
    description: str = Field("", description="Human-readable description")

class AlertUpdate(BaseModel):
    status: str = Field(..., description="New status (approved, rejected, escalated)")
    note: Optional[str] = Field(None, description="Optional reasoning note")

class CreateRuleRequest(BaseModel):
    name: str = Field(..., description="Rule name")
    description: str = Field("", description="Rule description")
    type: str = Field(..., description="Rule type")
    conditions: List[RuleConditionModel] = Field(..., description="Rule conditions")
    logical_operator: str = Field("and", description="Logical operator for conditions")
    severity: str = Field("medium", description="Rule severity level")
    enabled: bool = Field(True, description="Whether rule is enabled")
    tags: List[str] = Field([], description="Rule tags")
    confidence_threshold: float = Field(0.8, description="Confidence threshold for triggering")
    action: str = Field("flag", description="Action to take when rule triggers")

class UpdateRuleRequest(BaseModel):
    name: Optional[str] = None
    description: Optional[str] = None
    conditions: Optional[List[RuleConditionModel]] = None
    logical_operator: Optional[str] = None
    severity: Optional[str] = None
    enabled: Optional[bool] = None
    tags: Optional[List[str]] = None
    confidence_threshold: Optional[float] = None
    action: Optional[str] = None

class RuleResponse(BaseModel):
    id: str
    name: str
    description: str
    type: str
    conditions: List[Dict[str, Any]]
    logical_operator: str
    severity: str
    enabled: bool
    tags: List[str]
    created_at: str
    updated_at: str
    trigger_count: int
    last_triggered: Optional[str]
    confidence_threshold: float
    action: str

class EvaluateTransactionRequest(BaseModel):
    transaction_data: Dict[str, Any] = Field(..., description="Transaction data to evaluate")

class EvaluateCaseRequest(BaseModel):
    case_data: Dict[str, Any] = Field(..., description="Case data to evaluate")

class EvaluationResult(BaseModel):
    triggered: bool
    confidence: float
    severity: Optional[str] = None
    action: Optional[str] = None
    rule_id: Optional[str] = None
    rule_name: Optional[str] = None
    matched_conditions: Optional[int] = None
    total_conditions: Optional[int] = None

class CaseEvaluationResult(BaseModel):
    case_id: Optional[str] = None
    total_transactions: int
    total_entities: int
    triggered_rules: List[Dict[str, Any]]
    risk_score: int
    severity: str
    recommendations: List[str]
    error: Optional[str] = None

class ImportRulesRequest(BaseModel):
    rules: List[Dict[str, Any]] = Field(..., description="Rules to import")

class ExportRulesRequest(BaseModel):
    rule_ids: Optional[List[str]] = Field(None, description="Specific rule IDs to export")

class EngineStats(BaseModel):
    total_evaluations: int
    rules_triggered: int
    false_positives: int
    true_positives: int
    processing_time_ms: float
    active_rules: int
    total_rules: int
    avg_processing_time_ms: float
    rules_by_severity: Dict[str, int]
    rules_by_type: Dict[str, int]

# API Endpoints

@router.get("/alerts", response_model=List[Dict[str, Any]])
async def get_fraud_alerts(
    status: Optional[str] = None,
    severity: Optional[str] = None,
    limit: int = 50,
    db: Session = Depends(get_db)
):
    """
    Get list of fraud alerts.
    """
    from core.database import FraudAlert
    
    query = db.query(FraudAlert)
    
    if status and status != 'all':
        query = query.filter(FraudAlert.status == status)
    
    if severity and severity != 'all':
        query = query.filter(FraudAlert.severity == severity)
        
    alerts = query.order_by(FraudAlert.created_at.desc()).limit(limit).all()
    
    return [
        {
            "id": alert.id,
            "caseId": alert.case_id,
            "title": alert.rule_name, # Mapping rule name to title
            "riskScore": int(alert.risk_score),
            "priority": alert.severity, # Critical/High etc
            "status": alert.status,
            "createdAt": alert.created_at.isoformat() if alert.created_at else None,
            "description": alert.description,
            "assignee": alert.assigned_to
        }
        for alert in alerts
    ]

@router.get("/templates", response_model=Dict[str, Dict[str, Any]])
async def get_rule_templates():
    """
    Get available rule templates for common fraud patterns.

    Returns predefined templates that can be used as starting points
    for creating custom fraud detection rules.
    """
    try:
        engine = await get_fraud_engine()
        return engine.get_rule_templates()
    except Exception as e:
        logger.error(f"Failed to get rule templates: {e}")
        raise HTTPException(status_code=500, detail=f"Failed to get templates: {str(e)}")

@router.get("/", response_model=List[RuleResponse])
async def list_rules():
    """
    List all fraud detection rules.

    Returns all configured rules with their current status and statistics.
    """
    try:
        engine = await get_fraud_engine()
        rules = engine.get_rules()

        # Convert to response format
        return [
            RuleResponse(
                id=rule['id'],
                name=rule['name'],
                description=rule['description'],
                type=rule['type'],
                conditions=rule['conditions'],
                logical_operator=rule['logical_operator'],
                severity=rule['severity'],
                enabled=rule['enabled'],
                tags=rule['tags'],
                created_at=rule['created_at'],
                updated_at=rule['updated_at'],
                trigger_count=rule['trigger_count'],
                last_triggered=rule['last_triggered'],
                confidence_threshold=rule['confidence_threshold'],
                action=rule['action']
            )
            for rule in rules
        ]
    except Exception as e:
        logger.error(f"Failed to list rules: {e}")
        raise HTTPException(status_code=500, detail=f"Failed to list rules: {str(e)}")

@router.get("/{rule_id}", response_model=RuleResponse)
async def get_rule(rule_id: str):
    """
    Get a specific fraud detection rule.

    Returns detailed information about a single rule including
    its conditions, statistics, and configuration.
    """
    try:
        engine = await get_fraud_engine()
        rule = engine.get_rule(rule_id)

        if not rule:
            raise HTTPException(status_code=404, detail="Rule not found")

        return RuleResponse(**rule)
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Failed to get rule {rule_id}: {e}")
        raise HTTPException(status_code=500, detail=f"Failed to get rule: {str(e)}")

@router.post("/", response_model=RuleResponse)
async def create_rule(request: CreateRuleRequest):
    """
    Create a new fraud detection rule.

    Creates a custom rule with specified conditions and actions.
    Rules can be simple (single condition) or complex (multiple conditions
    with logical operators).
    """
    try:
        engine = await get_fraud_engine()

        # Convert request to dict
        rule_data = request.model_dump()

        # Convert conditions to dict format
        rule_data['conditions'] = [cond.model_dump() for cond in request.conditions]

        rule = await engine.create_rule(rule_data)

        return RuleResponse(
            id=rule.id,
            name=rule.name,
            description=rule.description,
            type=rule.type.value,
            conditions=[cond.__dict__ for cond in rule.conditions],
            logical_operator=rule.logical_operator.value,
            severity=rule.severity,
            enabled=rule.enabled,
            tags=rule.tags,
            created_at=rule.created_at.isoformat(),
            updated_at=rule.updated_at.isoformat(),
            trigger_count=rule.trigger_count,
            last_triggered=rule.last_triggered.isoformat() if rule.last_triggered else None,
            confidence_threshold=rule.confidence_threshold,
            action=rule.action
        )
    except Exception as e:
        logger.error(f"Failed to create rule: {e}")
        raise HTTPException(status_code=500, detail=f"Failed to create rule: {str(e)}")

@router.put("/{rule_id}", response_model=RuleResponse)
async def update_rule(rule_id: str, request: UpdateRuleRequest):
    """
    Update an existing fraud detection rule.

    Allows modification of rule conditions, severity, actions, and other properties.
    Note: Default rules cannot be modified.
    """
    try:
        engine = await get_fraud_engine()

        # Convert request to dict, excluding None values
        updates = request.model_dump(exclude_unset=True)

        # Convert conditions if provided
        if 'conditions' in updates and updates['conditions']:
            updates['conditions'] = [cond.model_dump() for cond in updates['conditions']]

        rule = await engine.update_rule(rule_id, updates)

        if not rule:
            raise HTTPException(status_code=404, detail="Rule not found")

        return RuleResponse(
            id=rule.id,
            name=rule.name,
            description=rule.description,
            type=rule.type.value,
            conditions=[cond.__dict__ for cond in rule.conditions],
            logical_operator=rule.logical_operator.value,
            severity=rule.severity,
            enabled=rule.enabled,
            tags=rule.tags,
            created_at=rule.created_at.isoformat(),
            updated_at=rule.updated_at.isoformat(),
            trigger_count=rule.trigger_count,
            last_triggered=rule.last_triggered.isoformat() if rule.last_triggered else None,
            confidence_threshold=rule.confidence_threshold,
            action=rule.action
        )
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Failed to update rule {rule_id}: {e}")
        raise HTTPException(status_code=500, detail=f"Failed to update rule: {str(e)}")

@router.delete("/{rule_id}")
async def delete_rule(rule_id: str):
    """
    Delete a fraud detection rule.

    Permanently removes a rule from the system.
    Default rules cannot be deleted.
    """
    try:
        engine = await get_fraud_engine()

        success = await engine.delete_rule(rule_id)

        if not success:
            raise HTTPException(status_code=404, detail="Rule not found or cannot be deleted")

        return {"success": True, "message": f"Rule {rule_id} deleted successfully"}
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Failed to delete rule {rule_id}: {e}")
        raise HTTPException(status_code=500, detail=f"Failed to delete rule: {str(e)}")

class EvaluationResponse(BaseModel):
    transaction_id: Optional[str]
    risk_score: float
    triggered_rules: List[Dict[str, Any]]
    timestamp: datetime

@router.post("/evaluate", response_model=EvaluationResponse)
async def evaluate_transaction(
    request: EvaluateTransactionRequest,
    db: Session = Depends(get_db)
):
    """Evaluate a transaction against all active rules"""
    try:
        engine = await get_fraud_engine()
        results = await engine.evaluate_transaction(request.transaction_data, db) # Pass DB for persistence
        
        triggered_rules = [r for r in results if r.get('triggered', False)]
        risk_score = sum(r.get('risk_score', 0) for r in triggered_rules)
        
        return {
            "transaction_id": request.transaction_data.get('id'),
            "risk_score": risk_score,
            "triggered_rules": triggered_rules,
            "timestamp": datetime.now()
        }
    except Exception as e:
        logger.error(f"Error evaluating transaction: {e}")
        raise HTTPException(status_code=500, detail=f"Error evaluating transaction: {str(e)}")

@router.post("/evaluate/case", response_model=CaseEvaluationResult)
async def evaluate_case(
    request: EvaluateCaseRequest,
    db: Session = Depends(get_db)
):
    """
    Evaluate an entire case for fraud patterns.

    Performs comprehensive analysis of a case including all transactions,
    entities, and relationships to identify fraud patterns and calculate
    overall risk scores.
    """
    try:
        engine = await get_fraud_engine()

        result = await engine.evaluate_case(request.case_data, db)

        return CaseEvaluationResult(**result)
    except Exception as e:
        logger.error(f"Case evaluation failed: {e}")
        raise HTTPException(status_code=500, detail=f"Case evaluation failed: {str(e)}")

@router.post("/import")
async def import_rules(request: ImportRulesRequest):
    """
    Import rules from external source.

    Allows bulk import of rules from JSON format.
    Useful for sharing rule sets between environments.
    """
    try:
        engine = await get_fraud_engine()

        imported_count = await engine.import_rules(request.rules)

        return {
            "success": True,
            "message": f"Successfully imported {imported_count} rules",
            "imported_count": imported_count
        }
    except Exception as e:
        logger.error(f"Rule import failed: {e}")
        raise HTTPException(status_code=500, detail=f"Import failed: {str(e)}")

@router.post("/export", response_model=List[Dict[str, Any]])
async def export_rules(request: ExportRulesRequest = None):
    """
    Export rules to external format.

    Exports rules in JSON format for backup, sharing, or migration.
    Can export all rules or specific rule IDs.
    """
    try:
        if request is None:
            request = ExportRulesRequest()

        engine = await get_fraud_engine()

        rules = await engine.export_rules(request.rule_ids)

        return rules
    except Exception as e:
        logger.error(f"Rule export failed: {e}")
        raise HTTPException(status_code=500, detail=f"Export failed: {str(e)}")

@router.get("/stats", response_model=EngineStats)
async def get_engine_stats():
    """
    Get fraud rules engine statistics.

    Returns comprehensive statistics about rule performance,
    evaluation metrics, and system health.
    """
    try:
        engine = await get_fraud_engine()
        stats = engine.get_stats()

        return EngineStats(**stats)
    except Exception as e:
        logger.error(f"Failed to get engine stats: {e}")
        raise HTTPException(status_code=500, detail=f"Stats retrieval failed: {str(e)}")

@router.post("/test-rule")
async def test_rule(
    rule_id: str,
    test_data: Dict[str, Any]
):
    """
    Test a specific rule against sample data.

    Allows testing rule logic without affecting production evaluations.
    Useful for rule development and validation.
    """
    try:
        engine = await get_fraud_engine()

        rule = engine.get_rule(rule_id)
        if not rule:
            raise HTTPException(status_code=404, detail="Rule not found")

        # Create a temporary rule instance for testing
        from app.services.fraud_rules_engine import FraudRule, RuleCondition

        test_rule = FraudRule(
            id="test_rule",
            name=rule['name'],
            description=rule['description'],
            type=rule['type'],
            conditions=[RuleCondition(**cond) for cond in rule['conditions']],
            logical_operator=rule['logical_operator'],
            severity=rule['severity'],
            enabled=True,
            confidence_threshold=rule['confidence_threshold'],
            action=rule['action']
        )

        result = test_rule.evaluate(test_data)

        return {
            "success": True,
            "rule_id": rule_id,
            "test_data": test_data,
            "result": result
        }
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Rule testing failed: {e}")
        raise HTTPException(status_code=500, detail=f"Rule testing failed: {str(e)}")

# Health check endpoint for fraud rules engine
@router.get("/health")
async def fraud_engine_health_check():
    """
    Health check for fraud rules engine components
    """
    try:
        engine = await get_fraud_engine()

        health_status = {
            "service": "fraud-rules-engine",
            "status": "healthy",
            "timestamp": datetime.now().isoformat(),
            "components": {
                "rules_storage": {
                    "status": "healthy",
                    "rules_count": len(engine.rules)
                },
                "rule_evaluation": {
                    "status": "healthy",
                    "total_evaluations": engine.stats['total_evaluations']
                },
                "rule_templates": {
                    "status": "healthy",
                    "templates_count": len(engine.rule_templates)
                }
            },
            "stats": engine.get_stats()
        }

        return health_status

    except Exception as e:
        return {
            "service": "fraud-rules-engine",
            "status": "unhealthy",
            "error": str(e),
            "timestamp": datetime.now().isoformat()
        }

@router.put("/alerts/{alert_id}", response_model=Dict[str, Any])
async def update_alert_status(alert_id: str, update: AlertUpdate, db: Session = Depends(get_db)):
    """
    Update the status of a fraud alert.
    """
    from core.database import FraudAlert
    
    alert = db.query(FraudAlert).filter(FraudAlert.id == alert_id).first()
    if not alert:
        raise HTTPException(status_code=404, detail="Alert not found")
        
    alert.status = update.status
    # In a real app, we would log the note and the user who made the change
    # alert.notes.append(update.note) 
    
    db.commit()
    db.refresh(alert)
    
    return {
        "id": alert.id,
        "status": alert.status,
        "updatedAt": alert.updated_at.isoformat() if alert.updated_at else datetime.now(timezone.utc).isoformat()
=======
Fraud Detection API Router
Endpoints for rule management and transaction evaluation
"""
from fastapi import APIRouter, HTTPException, Depends
from pydantic import BaseModel, Field
from typing import List, Dict, Any, Optional
from datetime import datetime

from app.services.fraud.rule_engine import (
    RuleEngine, FraudRule, VelocityRule, AmountThresholdRule, 
    GeographicAnomalyRule, RuleType, RiskLevel, create_default_rules
)

router = APIRouter()

# Global rule engine instance
fraud_engine = create_default_rules()

# Request/Response Models
class TransactionEvaluationRequest(BaseModel):
    transaction_id: str
    account_id: str
    amount: float
    currency: str = "USD"
    timestamp: str
    location: Optional[Dict[str, float]] = None
    merchant: Optional[str] = None
    category: Optional[str] = None

class ContextData(BaseModel):
    recent_transactions: List[Dict[str, Any]] = []
    last_transaction: Optional[Dict[str, Any]] = None
    account_history: Optional[Dict[str, Any]] = None

class EvaluationRequest(BaseModel):
    transaction: TransactionEvaluationRequest
    context: Optional[ContextData] = None

class RuleCreateRequest(BaseModel):
    rule_type: str
    name: str
    description: str
    risk_level: str
    parameters: Dict[str, Any]

@router.post('/evaluate')
async def evaluate_transaction(request: EvaluationRequest):
    """
    Evaluate a transaction for fraud
    
    Returns fraud risk assessment and recommendations
    """
    try:
        transaction_dict = request.transaction.dict()
        context_dict = request.context.dict() if request.context else {}
        
        result = fraud_engine.evaluate_transaction(transaction_dict, context_dict)
        
        return {
            "transaction_id": request.transaction.transaction_id,
            **result,
            "evaluated_at": datetime.utcnow().isoformat()
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Evaluation failed: {str(e)}")

@router.get('/rules')
async def list_rules():
    """Get all fraud detection rules"""
    return {
        "rules": [
            {
                "rule_id": rule.rule_id,
                "name": rule.name,
                "description": rule.description,
                "rule_type": rule.rule_type.value,
                "risk_level": rule.risk_level.value,
                "enabled": rule.enabled,
                "triggered_count": rule.triggered_count,
                "created_at": rule.created_at.isoformat()
            }
            for rule in fraud_engine.rules
        ],
        "total_count": len(fraud_engine.rules)
    }

@router.get('/rules/{rule_id}')
async def get_rule(rule_id: str):
    """Get specific rule details"""
    rule = fraud_engine.get_rule(rule_id)
    if not rule:
        raise HTTPException(status_code=404, detail=f"Rule {rule_id} not found")
    
    return {
        "rule_id": rule.rule_id,
        "name": rule.name,
        "description": rule.description,
        "rule_type": rule.rule_type.value,
        "risk_level": rule.risk_level.value,
        "enabled": rule.enabled,
        "triggered_count": rule.triggered_count,
        "created_at": rule.created_at.isoformat()
    }

@router.patch('/rules/{rule_id}/toggle')
async def toggle_rule(rule_id: str):
    """Enable or disable a rule"""
    rule = fraud_engine.get_rule(rule_id)
    if not rule:
        raise HTTPException(status_code=404, detail=f"Rule {rule_id} not found")
    
    rule.enabled = not rule.enabled
    
    return {
        "rule_id": rule_id,
        "enabled": rule.enabled,
        "message": f"Rule {'enabled' if rule.enabled else 'disabled'}"
    }

@router.post('/rules')
async def create_rule(request: RuleCreateRequest):
    """Create a new fraud detection rule"""
    try:
        rule_type = RuleType(request.rule_type)
        risk_level = RiskLevel(request.risk_level)
        
        # Create rule based on type
        if rule_type == RuleType.VELOCITY:
            rule = VelocityRule(
                rule_id=f"VEL{len([r for r in fraud_engine.rules if r.rule_type == RuleType.VELOCITY]) + 1:03d}",
                max_transactions=request.parameters.get('max_transactions', 5),
                time_window_minutes=request.parameters.get('time_window_minutes', 5),
                risk_level=risk_level
            )
        elif rule_type == RuleType.AMOUNT:
            rule = AmountThresholdRule(
                rule_id=f"AMT{len([r for r in fraud_engine.rules if r.rule_type == RuleType.AMOUNT]) + 1:03d}",
                threshold_amount=request.parameters.get('threshold_amount', 10000.0),
                currency=request.parameters.get('currency', 'USD'),
                risk_level=risk_level
            )
        elif rule_type == RuleType.GEOGRAPHIC:
            rule = GeographicAnomalyRule(
                rule_id=f"GEO{len([r for r in fraud_engine.rules if r.rule_type == RuleType.GEOGRAPHIC]) + 1:03d}",
                max_distance_km=request.parameters.get('max_distance_km', 500),
                min_time_hours=request.parameters.get('min_time_hours', 1),
                risk_level=risk_level
            )
        else:
            raise HTTPException(status_code=400, detail=f"Unsupported rule type: {rule_type}")
        
        fraud_engine.add_rule(rule)
        
        return {
            "rule_id": rule.rule_id,
            "message": "Rule created successfully",
            "rule": {
                "rule_id": rule.rule_id,
                "name": rule.name,
                "rule_type": rule.rule_type.value,
                "risk_level": rule.risk_level.value
            }
        }
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to create rule: {str(e)}")

@router.delete('/rules/{rule_id}')
async def delete_rule(rule_id: str):
    """Delete a fraud detection rule"""
    rule = fraud_engine.get_rule(rule_id)
    if not rule:
        raise HTTPException(status_code=404, detail=f"Rule {rule_id} not found")
    
    fraud_engine.remove_rule(rule_id)
    
    return {
        "rule_id": rule_id,
        "message": "Rule deleted successfully"
    }

@router.get('/stats')
async def get_engine_stats():
    """Get fraud detection engine statistics"""
    return fraud_engine.get_stats()

@router.post('/batch-evaluate')
async def batch_evaluate_transactions(transactions: List[EvaluationRequest]):
    """
    Evaluate multiple transactions in batch
    
    Useful for bulk processing or historical analysis
    """
    results = []
    
    for request in transactions:
        try:
            transaction_dict = request.transaction.dict()
            context_dict = request.context.dict() if request.context else {}
            
            result = fraud_engine.evaluate_transaction(transaction_dict, context_dict)
            
            results.append({
                "transaction_id": request.transaction.transaction_id,
                "success": True,
                **result
            })
        except Exception as e:
            results.append({
                "transaction_id": request.transaction.transaction_id,
                "success": False,
                "error": str(e)
            })
    
    return {
        "total_evaluated": len(results),
        "successful": sum(1 for r in results if r["success"]),
        "failed": sum(1 for r in results if not r["success"]),
        "results": results
>>>>>>> Stashed changes
    }
