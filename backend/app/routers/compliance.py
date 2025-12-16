import logging
from typing import Any, Dict, List, Optional

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.services.compliance_service import ComplianceService
from app.services.core.auth_service import auth_service
from core.database import User, get_db

logger = logging.getLogger(__name__)

router = APIRouter()


def get_compliance_service(db: Session = Depends(get_db)) -> ComplianceService:
    return ComplianceService(db)


@router.post("/audit/log")
async def log_compliance_event(
    action: str,
    resource_type: str,
    resource_id: str,
    details: Dict[str, Any],
    current_user: User = Depends(auth_service.get_current_user),
    compliance_service: ComplianceService = Depends(get_compliance_service),
) -> Dict[str, Any]:
    """
    Log a compliance-related event
    """
    try:
        log_id = await compliance_service.log_compliance_event(
            action=action,
            resource_type=resource_type,
            resource_id=resource_id,
            user_id=current_user.id,
            user_role=(
                current_user.role.value if hasattr(current_user, "role") else "unknown"
            ),
            details=details,
            ip_address=None,  # Would be extracted from request
            user_agent=None,  # Would be extracted from request
        )

        return {
            "log_id": log_id,
            "status": "logged",
            "timestamp": "2025-12-16T12:00:00Z",  # Would use actual timestamp
        }

    except Exception as e:
        logger.error(f"Failed to log compliance event: {str(e)}")
        raise HTTPException(status_code=500, detail="Failed to log compliance event")


@router.post("/regulatory-reports")
async def create_regulatory_report(
    report_type: str,
    case_id: str,
    report_data: Dict[str, Any],
    current_user: User = Depends(auth_service.get_current_user),
    compliance_service: ComplianceService = Depends(get_compliance_service),
) -> Dict[str, Any]:
    """
    Create a regulatory report (SAR, CTR, etc.)
    """
    try:
        result = await compliance_service.create_regulatory_report(
            report_type=report_type,
            case_id=case_id,
            report_data=report_data,
            created_by=current_user.id,
        )

        return result

    except Exception as e:
        logger.error(f"Failed to create regulatory report: {str(e)}")
        raise HTTPException(
            status_code=500, detail="Failed to create regulatory report"
        )


@router.post("/incidents")
async def submit_security_incident(
    incident_data: Dict[str, Any],
    current_user: User = Depends(auth_service.get_current_user),
    compliance_service: ComplianceService = Depends(get_compliance_service),
) -> Dict[str, Any]:
    """
    Submit a security incident report
    """
    try:
        incident_data["detected_by"] = current_user.id
        result = await compliance_service.submit_security_incident(incident_data)

        return result

    except Exception as e:
        logger.error(f"Failed to submit security incident: {str(e)}")
        raise HTTPException(
            status_code=500, detail="Failed to submit security incident"
        )


@router.post("/access-reviews")
async def initiate_access_review(
    user_id: str,
    review_period_months: int = 12,
    current_user: User = Depends(auth_service.get_current_user),
    compliance_service: ComplianceService = Depends(get_compliance_service),
) -> Dict[str, Any]:
    """
    Initiate an access review for a user
    """
    try:
        result = await compliance_service.initiate_access_review(
            user_id=user_id,
            reviewer_id=current_user.id,
            review_period_months=review_period_months,
        )

        return result

    except Exception as e:
        logger.error(f"Failed to initiate access review: {str(e)}")
        raise HTTPException(status_code=500, detail="Failed to initiate access review")


@router.post("/training/complete")
async def record_training_completion(
    training_type: str,
    training_module: str,
    score: Optional[float] = None,
    current_user: User = Depends(auth_service.get_current_user),
    compliance_service: ComplianceService = Depends(get_compliance_service),
) -> Dict[str, Any]:
    """
    Record completion of compliance training
    """
    try:
        result = await compliance_service.record_training_completion(
            user_id=current_user.id,
            training_type=training_type,
            training_module=training_module,
            score=score,
        )

        return result

    except Exception as e:
        logger.error(f"Failed to record training completion: {str(e)}")
        raise HTTPException(
            status_code=500, detail="Failed to record training completion"
        )


@router.get("/regional-compliance")
async def get_regional_compliance(
    current_user: User = Depends(auth_service.get_current_user),
    compliance_service: ComplianceService = Depends(get_compliance_service),
) -> Dict[str, Any]:
    """
    Get regional compliance status across different jurisdictions
    """
    try:
        result = await compliance_service.get_regional_compliance_status()
        return result

    except Exception as e:
        logger.error(f"Failed to get regional compliance: {str(e)}")
        raise HTTPException(status_code=500, detail="Failed to get regional compliance")


@router.get("/data-residency-rules")
async def get_data_residency_rules(
    current_user: User = Depends(auth_service.get_current_user),
    compliance_service: ComplianceService = Depends(get_compliance_service),
) -> Dict[str, Any]:
    """
    Get data residency rules for different regions
    """
    try:
        result = await compliance_service.get_data_residency_rules()
        return result

    except Exception as e:
        logger.error(f"Failed to get data residency rules: {str(e)}")
        raise HTTPException(
            status_code=500, detail="Failed to get data residency rules"
        )


@router.put("/regional-compliance/{region}")
async def update_regional_compliance(
    region: str,
    framework: str,
    compliance_data: Dict[str, Any],
    current_user: User = Depends(auth_service.get_current_user),
    compliance_service: ComplianceService = Depends(get_compliance_service),
) -> Dict[str, Any]:
    """
    Update regional compliance settings for a specific region
    """
    try:
        result = await compliance_service.update_regional_compliance(
            region=region,
            framework=framework,
            compliance_data=compliance_data,
            updated_by=current_user.id,
        )
        return result

    except Exception as e:
        logger.error(f"Failed to update regional compliance: {str(e)}")
        raise HTTPException(
            status_code=500, detail="Failed to update regional compliance"
        )


@router.get("/dashboard")
async def get_compliance_dashboard(
    current_user: User = Depends(auth_service.get_current_user),
    compliance_service: ComplianceService = Depends(get_compliance_service),
) -> Dict[str, Any]:
    """
    Get comprehensive compliance dashboard data
    """
    try:
        dashboard = await compliance_service.get_compliance_dashboard()

        return dashboard

    except Exception as e:
        logger.error(f"Failed to get compliance dashboard: {str(e)}")
        raise HTTPException(
            status_code=500, detail="Failed to get compliance dashboard"
        )


@router.get("/audit/logs")
async def get_audit_logs(
    limit: int = 100,
    offset: int = 0,
    current_user: User = Depends(auth_service.get_current_user),
    db: Session = Depends(get_db),
) -> Dict[str, Any]:
    """
    Get compliance audit logs
    """
    try:
        from core.database import ComplianceAuditLog

        logs = (
            db.query(ComplianceAuditLog)
            .order_by(ComplianceAuditLog.timestamp.desc())
            .offset(offset)
            .limit(limit)
            .all()
        )

        return {
            "logs": [
                {
                    "id": log.id,
                    "action": log.action,
                    "resource_type": log.resource_type,
                    "resource_id": log.resource_id,
                    "user_id": log.user_id,
                    "timestamp": log.timestamp.isoformat(),
                    "compliance_flags": log.compliance_flags,
                    "risk_score": log.risk_score,
                }
                for log in logs
            ],
            "total": len(logs),
            "offset": offset,
            "limit": limit,
        }

    except Exception as e:
        logger.error(f"Failed to get audit logs: {str(e)}")
        raise HTTPException(status_code=500, detail="Failed to get audit logs")


@router.get("/regulatory-reports")
async def get_regulatory_reports(
    status: Optional[str] = None,
    current_user: User = Depends(auth_service.get_current_user),
    db: Session = Depends(get_db),
) -> Dict[str, Any]:
    """
    Get regulatory reports
    """
    try:
        from core.database import RegulatoryReport

        query = db.query(RegulatoryReport)

        if status:
            query = query.filter(RegulatoryReport.filing_status == status)

        reports = query.order_by(RegulatoryReport.created_at.desc()).all()

        return {
            "reports": [
                {
                    "id": report.id,
                    "report_type": report.report_type,
                    "report_id": report.report_id,
                    "case_id": report.case_id,
                    "filing_status": report.filing_status,
                    "due_date": (
                        report.due_date.isoformat() if report.due_date else None
                    ),
                    "regulatory_body": report.regulatory_body,
                    "created_at": report.created_at.isoformat(),
                }
                for report in reports
            ],
            "total": len(reports),
        }

    except Exception as e:
        logger.error(f"Failed to get regulatory reports: {str(e)}")
        raise HTTPException(status_code=500, detail="Failed to get regulatory reports")
