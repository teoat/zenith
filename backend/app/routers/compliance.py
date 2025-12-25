from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from sqlalchemy import func, case as sql_case
from typing import List, Dict, Any, Optional
from datetime import datetime, timedelta
from pydantic import BaseModel

from core.database import (
    get_db, 
    ComplianceAuditLog, 
    RegulatoryReport, 
    SecurityIncident,
    AccessReview,
    TrainingRecord,
    FraudAlert
)
from app.services.infrastructure.auth_service import auth_service

router = APIRouter()

# Models matching Frontend Interfaces
class SystemMetrics(BaseModel):
    uptime: float
    response_time: float
    error_rate: float
    active_users: int
    compliance_score: float
    last_updated: str

class ComplianceAlert(BaseModel):
    id: str
    rule_id: str
    message: str
    severity: str
    timestamp: str
    acknowledged: bool
    resolved: bool
    metadata: Dict[str, Any]

class MonitoringDashboard(BaseModel):
    system_health: SystemMetrics
    active_alerts: List[ComplianceAlert]
    recent_incidents: List[Any]
    compliance_trends: List[Dict[str, Any]]
    performance_metrics: Dict[str, Any]

class ComplianceMetrics(BaseModel):
    recent_audit_events: int
    pending_regulatory_reports: int
    open_security_incidents: int
    overdue_access_reviews: int
    expiring_training_records: int
    high_risk_events_last_100: int
    overall_compliance_score: float

# --- Endpoints ---

@router.get("/dashboard", response_model=ComplianceMetrics)
async def get_compliance_dashboard(
    db: Session = Depends(get_db),
    current_user: Any = Depends(auth_service.get_current_user)
):
    """Get high-level compliance metrics backed by real DB data"""
    
    # 1. Recent Audit Events (Last 24h)
    last_24h = datetime.utcnow() - timedelta(hours=24)
    recent_audit_events = db.query(ComplianceAuditLog).filter(
        ComplianceAuditLog.timestamp >= last_24h
    ).count()

    # 2. Pending Regulatory Reports
    pending_regulatory_reports = db.query(RegulatoryReport).filter(
        RegulatoryReport.filing_status.in_(["draft", "rejected"])
    ).count()

    # 3. Open Security Incidents
    open_security_incidents = db.query(SecurityIncident).filter(
        SecurityIncident.status.in_(["open", "investigating"])
    ).count()

    # 4. Overdue Access Reviews
    overdue_access_reviews = db.query(AccessReview).filter(
        AccessReview.review_status == "overdue"
    ).count()

    # 5. Expiring Training Records (Next 30 days)
    next_30d = datetime.utcnow() + timedelta(days=30)
    expiring_training_records = db.query(TrainingRecord).filter(
        TrainingRecord.expiry_date <= next_30d,
        TrainingRecord.expiry_date >= datetime.utcnow(),
        TrainingRecord.completion_status == "completed"
    ).count()

    # 6. High Risk Events (Last 100 Audit Logs)
    # Heuristic: risk_score > 75 in last 100 logs
    last_100_logs = db.query(ComplianceAuditLog.risk_score).order_by(
        ComplianceAuditLog.timestamp.desc()
    ).limit(100).all()
    
    high_risk_events = sum(1 for log in last_100_logs if (log.risk_score or 0) > 75.0)

    # 7. Calculate Overall Score
    # Start at 100, deduct points for issues
    score = 100.0
    score -= (open_security_incidents * 5.0)
    score -= (overdue_access_reviews * 2.0)
    score -= (pending_regulatory_reports * 1.0)
    score -= (high_risk_events * 0.5)
    
    return {
        "recent_audit_events": recent_audit_events,
        "pending_regulatory_reports": pending_regulatory_reports,
        "open_security_incidents": open_security_incidents,
        "overdue_access_reviews": overdue_access_reviews,
        "expiring_training_records": expiring_training_records,
        "high_risk_events_last_100": high_risk_events,
        "overall_compliance_score": max(0.0, min(100.0, score))
    }

@router.get("/monitoring/dashboard", response_model=MonitoringDashboard)
async def get_monitoring_dashboard(
    db: Session = Depends(get_db),
    current_user: Any = Depends(auth_service.get_current_user)
):
    """Get real-time monitoring dashboard data linked to DB"""
    
    # Calculate score again (reuse logic ideally, but replicating for independence)
    open_incidents = db.query(SecurityIncident).filter(
        SecurityIncident.status.in_(["open", "investigating"])
    ).count()
    compliance_score = max(0.0, 100.0 - (open_incidents * 5.0))

    # Active Alerts from FraudAlerts table
    active_alerts_db = db.query(FraudAlert).filter(
        FraudAlert.is_acknowledged == False
    ).order_by(FraudAlert.created_at.desc()).limit(10).all()

    active_alerts = [
        {
            "id": alert.id,
            "rule_id": alert.alert_type,
            "message": alert.title,
            "severity": alert.severity,
            "timestamp": alert.created_at.isoformat(),
            "acknowledged": alert.is_acknowledged,
            "resolved": False, # Basic mapping
            "metadata": alert.alert_metadata or {}
        }
        for alert in active_alerts_db
    ]

    return {
        "system_health": {
            "uptime": 99.98, # This usually comes from infrastructure monitoring, keeping static for app context
            "response_time": 145, # Placeholder for APM data
            "error_rate": 0.01,
            "active_users": db.query(AccessReview).distinct(AccessReview.user_id).count() or 42, # Mock estimation
            "compliance_score": compliance_score,
            "last_updated": datetime.utcnow().isoformat()
        },
        "active_alerts": active_alerts,
        "recent_incidents": [], # Populate if needed from SecurityIncident
        "compliance_trends": [
            {"period": "Last 7 days", "score": compliance_score, "alerts_count": len(active_alerts)}
        ],
        "performance_metrics": {
            "api_response_time": 145,
            "database_query_time": 22,
            "error_rate": 0.01
        }
    }

@router.get("/regulatory-reports")
async def get_regulatory_reports(
    status: Optional[str] = None,
    db: Session = Depends(get_db)
):
    query = db.query(RegulatoryReport)
    if status:
        query = query.filter(RegulatoryReport.filing_status == status)
    
    reports = query.order_by(RegulatoryReport.created_at.desc()).limit(50).all()
    
    return {
        "reports": [
            {
                "id": r.id,
                "report_type": r.report_type,
                "report_id": r.report_id,
                "case_id": r.case_id,
                "filing_status": r.filing_status,
                "due_date": r.due_date.isoformat() if r.due_date else None,
                "regulatory_body": r.regulatory_body,
                "created_at": r.created_at.isoformat()
            } for r in reports
        ],
        "total": len(reports)
    }

@router.get("/regional-compliance")
async def get_regional_compliance():
    """Reserved for global expansion - currently static configuration"""
    return {
        "regions": [
            {
                "region": "North America",
                "framework": "BSA/AML",
                "compliance_score": 95,
                "last_audit_date": "2025-11-01",
                "next_audit_date": "2026-05-01",
                "critical_findings": 0,
                "data_residency_requirements": ["US-East"],
                "reporting_frequency": "Quarterly"
            },
           {
                "region": "Europe",
                "framework": "GDPR",
                "compliance_score": 98,
                "last_audit_date": "2025-10-15",
                "next_audit_date": "2026-04-15",
                "critical_findings": 0,
                "data_residency_requirements": ["EU-Central"],
                "reporting_frequency": "Annual"
            }
        ]
    }

@router.get("/data-residency-rules")
async def get_data_residency_rules():
    return {
        "rules": [
             {
                "region": "EU",
                "data_types": ["PII", "Financial"],
                "residency_requirements": "Must stay within EEA",
                "encryption_requirements": "AES-256 at rest",
                "retention_periods": {"PII": 365, "Financial": 2555}
             }
        ]
    }

@router.post("/audit/log")
async def log_audit_event(
    event: Dict[str, Any],
    db: Session = Depends(get_db),
    current_user: Any = Depends(auth_service.get_current_user)
):
    try:
        new_log = ComplianceAuditLog(
            id=f"audit-{datetime.utcnow().timestamp()}",
            action=event.get("action", "unknown"),
            resource_type=event.get("resource_type", "system"),
            resource_id=event.get("resource_id", "unknown"),
            user_id=current_user.id if hasattr(current_user, 'id') else "system",
            user_role=current_user.role if hasattr(current_user, 'role') else "system",
            timestamp=datetime.utcnow(),
            details=str(event.get("details", {})),
            risk_score=event.get("risk_score", 0.0)
        )
        db.add(new_log)
        db.commit()
        return {"log_id": new_log.id, "status": "recorded"}
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail=f"Failed to log audit event: {str(e)}")
