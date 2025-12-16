# api/fraud.py
from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from sqlalchemy import and_
from typing import List, Optional
from datetime import datetime, timezone, timedelta
import logging

from core.database import get_db, Case, User
from app.services.fraud_service import FraudDetectionService
from app.services.fraud import AlertSeverity
from app.services.fraud.rules.ai_detection import batch_train_ai_model, get_ai_model_status
from app.services.auth_service import auth_service

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/fraud", tags=["fraud-detection"])
# Module-level alias so tests can patch `fraud_service`
fraud_service = None
# ---- Test placeholders (allow tests to patch module-level dependencies) ----
if 'get_current_user' not in globals():
    try:
        get_current_user = auth_service.get_current_user
    except Exception:
        def get_current_user(*args, **kwargs):
            return None

if 'require_permission' not in globals():
    def require_permission(*args, **kwargs):
        def _dep(*a, **k):
            return None
        return _dep

for _svc in ('fraud_service', 'fraud_rules_engine', 'case_service'):
    if _svc not in globals():
        globals()[_svc] = None
@router.post("/analyze/{case_id}")
async def analyze_case(
    case_id: str,
    include_historical: bool = Query(True, description="Include historical transactions for context"),
    time_window_days: int = Query(90, description="Time window for transaction analysis"),
    db: Session = Depends(get_db)
):
    """
    Analyze a specific case for fraud patterns
    
    Args:
        case_id: Case ID to analyze
        include_historical: Include historical transactions for context
        time_window_days: Time window for transaction analysis
        
    Returns:
        Fraud analysis results with alerts
    """
    try:
        fraud_service = FraudDetectionService(db)
        alerts = fraud_service.analyze_case(case_id, include_historical, time_window_days)
        
        # Update case risk score
        risk_score = fraud_service.update_case_risk_score(case_id)
        
        return {
            "success": True,
            "case_id": case_id,
            "alerts_generated": len(alerts),
            "updated_risk_score": risk_score,
            "alerts": alerts,
            "analysis_timestamp": datetime.now(timezone.utc).isoformat()
        }
        
    except Exception as e:
        logger.error(f"Error analyzing case {case_id}: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Fraud analysis failed: {str(e)}")

@router.post("/analyze/transactions")
async def analyze_transactions(
    transaction_ids: List[str],
    context: Optional[dict] = None,
    db: Session = Depends(get_db)
):
    """
    Analyze specific transactions for fraud patterns
    
    Args:
        transaction_ids: List of transaction IDs to analyze
        context: Additional context for analysis
        
    Returns:
        Fraud analysis results
    """
    try:
        if not transaction_ids:
            raise HTTPException(status_code=400, detail="No transaction IDs provided")
            
        fraud_service = FraudDetectionService(db)
        alerts = fraud_service.analyze_transactions(transaction_ids, context)
        
        return {
            "success": True,
            "transactions_analyzed": len(transaction_ids),
            "alerts_generated": len(alerts),
            "alerts": alerts,
            "analysis_timestamp": datetime.now(timezone.utc).isoformat()
        }
        
    except Exception as e:
        logger.error(f"Error analyzing transactions: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Transaction analysis failed: {str(e)}")

@router.get("/alerts/{case_id}")
async def get_case_alerts(
    case_id: str,
    severity: Optional[str] = Query(None, description="Filter by alert severity"),
    limit: int = Query(100, description="Maximum number of alerts to return"),
    db: Session = Depends(get_db)
):
    """
    Get fraud alerts for a specific case
    
    Args:
        case_id: Case ID
        severity: Filter by alert severity (low, medium, high, critical)
        limit: Maximum number of alerts to return
        
    Returns:
        List of fraud alerts
    """
    try:
        fraud_service = FraudDetectionService(db)
        
        # Convert severity string to enum if provided
        severity_enum = None
        if severity:
            try:
                severity_enum = AlertSeverity(severity.lower())
            except ValueError:
                raise HTTPException(status_code=400, detail=f"Invalid severity: {severity}")
        
        alerts = fraud_service.get_case_alerts(case_id, severity_enum, limit)
        
        return {
            "success": True,
            "case_id": case_id,
            "alerts": alerts,
            "total_count": len(alerts)
        }
        
    except Exception as e:
        logger.error(f"Error getting alerts for case {case_id}: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Failed to retrieve alerts: {str(e)}")

@router.put("/alerts/{alert_id}")
async def update_alert_status(
    alert_id: str,
    status: str = Query(..., description="New status: pending, approved, rejected, escalated"),
    db: Session = Depends(get_db)
):
    """
    Update the status of a fraud alert
    """
    try:
        from core.database import FraudAlert
        
        alert = db.query(FraudAlert).filter(FraudAlert.id == alert_id).first()
        if not alert:
            raise HTTPException(status_code=404, detail="Alert not found")
            
        alert.status = status
        alert.updated_at = datetime.now(timezone.utc)
        db.commit()
        
        return {
            "success": True,
            "id": alert.id,
            "status": alert.status,
            "updated_at": alert.updated_at.isoformat()
        }
    except Exception as e:
        logger.error(f"Error updating alert {alert_id}: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Failed to update alert: {str(e)}")


@router.get("/explain/{alert_id}")
async def explain_alert_with_typology(
    alert_id: str,
    db: Session = Depends(get_db)
):
    """
    Get AI-powered explanation for an alert with RAG typology context.
    Uses the Knowledge Base to provide typology-matched insights.
    """
    try:
        from core.database import FraudAlert
        from app.services.ai_service import AIService
        
        # Get the alert
        alert = db.query(FraudAlert).filter(FraudAlert.id == alert_id).first()
        if not alert:
            raise HTTPException(status_code=404, detail="Alert not found")
        
        # Get case info for context
        case = db.query(Case).filter(Case.id == alert.case_id).first()
        
        # Build case data for typology analysis
        case_data = {
            "alert_type": alert.alert_type,
            "severity": alert.severity,
            "risk_score": alert.risk_score,
            "indicators": alert.alert_metadata.get("indicators", []) if alert.alert_metadata else [],
            "case_title": case.title if case else "Unknown",
            "case_type": case.type if case else "unknown",
            "description": case.description if case else ""
        }
        
        # Use AI service for typology context
        ai_service = AIService()
        typology_analysis = await ai_service.analyze_case(
            case_data,
            analysis_type='typology_context'
        )
        
        return {
            "success": True,
            "alert_id": alert_id,
            "alert_type": alert.alert_type,
            "severity": alert.severity,
            "risk_score": alert.risk_score,
            "typology_insights": typology_analysis.get("insights", []),
            "recommendations": typology_analysis.get("recommendations", []),
            "typology_matches": typology_analysis.get("typology_matches", []),
            "confidence": typology_analysis.get("confidence", 0),
            "timestamp": datetime.now(timezone.utc).isoformat()
        }
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error explaining alert {alert_id}: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Failed to explain alert: {str(e)}")


@router.get("/cases/high-risk")
async def get_high_risk_cases(
    min_risk_score: float = Query(70.0, description="Minimum risk score threshold"),
    limit: int = Query(50, description="Maximum number of cases to return"),
    db: Session = Depends(get_db)
):
    """
    Get cases with high fraud risk scores
    
    Args:
        min_risk_score: Minimum risk score threshold
        limit: Maximum number of cases to return
        
    Returns:
        List of high-risk cases
    """
    try:
        fraud_service = FraudDetectionService(db)
        cases = fraud_service.get_high_risk_cases(min_risk_score, limit)
        
        return {
            "success": True,
            "min_risk_score": min_risk_score,
            "cases": cases,
            "total_count": len(cases)
        }
        
    except Exception as e:
        logger.error(f"Error getting high-risk cases: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Failed to retrieve high-risk cases: {str(e)}")

@router.put("/risk-score/{case_id}")
async def update_case_risk_score(
    case_id: str,
    db: Session = Depends(get_db)
):
    """
    Update case risk score based on fraud alerts
    
    Args:
        case_id: Case ID to update
        
    Returns:
        Updated risk score
    """
    try:
        fraud_service = FraudDetectionService(db)
        risk_score = fraud_service.update_case_risk_score(case_id)
        
        return {
            "success": True,
            "case_id": case_id,
            "updated_risk_score": risk_score,
            "updated_at": datetime.now(timezone.utc).isoformat()
        }
        
    except Exception as e:
        logger.error(f"Error updating risk score for case {case_id}: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Failed to update risk score: {str(e)}")

@router.get("/engine/status")
async def get_engine_status(db: Session = Depends(get_db)):
    """
    Get status of the fraud rule engine
    
    Returns:
        Rule engine status and statistics
    """
    try:
        fraud_service = FraudDetectionService(db)
        status = fraud_service.get_rule_engine_status()
        
        return {
            "success": True,
            "engine_status": status,
            "timestamp": datetime.now(timezone.utc).isoformat()
        }
        
    except Exception as e:
        logger.error(f"Error getting engine status: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Failed to get engine status: {str(e)}")

@router.get("/rules")
async def get_rules(db: Session = Depends(get_db)):
    """
    Get available fraud detection rules
    
    Returns:
        List of available rules and their configurations
    """
    try:
        fraud_service = FraudDetectionService(db)
        status = fraud_service.get_rule_engine_status()
        
        return {
            "success": True,
            "rules": status.get('rules', {}),
            "timestamp": datetime.now(timezone.utc).isoformat()
        }
        
    except Exception as e:
        logger.error(f"Error getting rules: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Failed to retrieve rules: {str(e)}")

@router.get("/stats")
async def get_fraud_statistics(
    days: int = Query(30, description="Number of days to analyze"),
    db: Session = Depends(get_db)
):
    """
    Get fraud detection statistics
    
    Args:
        days: Number of days to analyze
        
    Returns:
        Fraud detection statistics
    """
    try:
        from core.database import FraudAlert
        
        cutoff_date = datetime.now(timezone.utc) - timedelta(days=days)
        
        # Get alert statistics
        total_alerts = db.query(FraudAlert).filter(
            FraudAlert.created_at >= cutoff_date
        ).count()
        
        alerts_by_severity = {}
        for severity in ['low', 'medium', 'high', 'critical']:
            count = db.query(FraudAlert).filter(
                and_(
                    FraudAlert.created_at >= cutoff_date,
                    FraudAlert.severity == severity
                )
            ).count()
            alerts_by_severity[severity] = count
        
        # Get top rules
        top_rules = db.query(
            FraudAlert.rule_name,
            db.func.count(FraudAlert.id).label('count')
        ).filter(
            FraudAlert.created_at >= cutoff_date
        ).group_by(FraudAlert.rule_name).order_by(
            db.desc('count')
        ).limit(10).all()
        
        return {
            "success": True,
            "period_days": days,
            "total_alerts": total_alerts,
            "alerts_by_severity": alerts_by_severity,
            "top_rules": [{"rule": row.rule_name, "count": row.count} for row in top_rules],
            "generated_at": datetime.now(timezone.utc).isoformat()
        }
        
    except Exception as e:
        logger.error(f"Error getting fraud statistics: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Failed to get statistics: {str(e)}")

# ===== AI MODEL MANAGEMENT ENDPOINTS =====

@router.post("/ai/train")
async def train_ai_model(
    training_data: List[dict],
    contamination: float = Query(0.1, description="Expected proportion of anomalies"),
    model_path: Optional[str] = Query(None, description="Path to save model")
):
    """
    Train AI fraud detection model
    
    Args:
        training_data: Transaction data for training
        contamination: Expected proportion of anomalies
        model_path: Path to save model
        
    Returns:
        Training results
    """
    try:
        if not training_data:
            raise HTTPException(status_code=400, detail="No training data provided")
            
        result = batch_train_ai_model(training_data, contamination, model_path)
        
        return {
            "success": True,
            "training_result": result,
            "timestamp": datetime.now(timezone.utc).isoformat()
        }
        
    except Exception as e:
        logger.error(f"Error training AI model: {str(e)}")
        raise HTTPException(status_code=500, detail=f"AI model training failed: {str(e)}")

@router.get("/ai/status")
async def get_ai_status(model_path: Optional[str] = Query(None, description="Path to model file")):
    """
    Get AI model status
    
    Args:
        model_path: Path to model file
        
    Returns:
        AI model status
    """
    try:
        status = get_ai_model_status(model_path)
        
        return {
            "success": True,
            "ai_model_status": status,
            "timestamp": datetime.now(timezone.utc).isoformat()
        }
        
    except Exception as e:
        logger.error(f"Error getting AI model status: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Failed to get AI model status: {str(e)}")

@router.post("/ai/train/case/{case_id}")
async def train_ai_model_from_case(
    case_id: str,
    contamination: float = Query(0.1, description="Expected proportion of anomalies"),
    include_historical: bool = Query(True, description="Include historical transactions"),
    db: Session = Depends(get_db)
):
    """
    Train AI model using transactions from a specific case
    
    Args:
        case_id: Case ID to use for training
        contamination: Expected proportion of anomalies
        include_historical: Include historical transactions
        
    Returns:
        Training results
    """
    try:
        from core.database import Transaction
        
        # Get transactions for the case
        transactions_query = db.query(Transaction).filter(Transaction.case_id == case_id)
        
        if include_historical:
            # Also get historical transactions for the customer
            case = db.query(Case).filter(Case.id == case_id).first()
            if case and case.customer_id:
                historical_txs = db.query(Transaction).filter(
                    and_(
                        Transaction.customer_id == case.customer_id,
                        Transaction.case_id != case_id
                    )
                ).all()
                transactions_query = transactions_query.union(historical_txs)
        
        transactions = transactions_query.all()
        
        if not transactions:
            raise HTTPException(status_code=404, detail="No transactions found for case")
        
        # Convert to dict format
        training_data = []
        for tx in transactions:
            training_data.append({
                'id': tx.id,
                'amount': float(tx.amount) if tx.amount else 0.0,
                'date': tx.date.isoformat() if tx.date else None,
                'merchant_name': tx.merchant_name,
                'category': tx.merchant_category,
                'country': tx.country,
                'transaction_type': tx.transaction_type,
                'customer_id': tx.case.customer_id if tx.case else None
            })
        
        # Train model
        result = batch_train_ai_model(training_data, contamination)
        
        return {
            "success": True,
            "case_id": case_id,
            "training_samples": len(training_data),
            "training_result": result,
            "timestamp": datetime.now(timezone.utc).isoformat()
        }
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error training AI model from case {case_id}: {str(e)}")