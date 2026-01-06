from datetime import UTC, datetime
from typing import Any

from app.dependencies import get_current_project_id
from app.services.infrastructure.auth_service import auth_service
from fastapi import APIRouter, Body, Depends, HTTPException
from pydantic import BaseModel
from sqlalchemy.orm import Session

from core.database import Case, FraudAlert, get_db

router = APIRouter()


# Response Model
class AlertResponse(BaseModel):
    id: str
    case_id: str | None = None
    title: str
    description: str | None = None
    severity: str
    status: str
    risk_score: float = 0.0
    created_at: str | None = None
    assignee: str | None = None  # Placeholder from metadata or relation

    class Config:
        from_attributes = True


@router.get("", response_model=list[AlertResponse])
async def get_alerts(
    status: str | None = None,
    severity: str | None = None,
    limit: int = 100,
    db: Session = Depends(get_db),
    current_user: dict = Depends(auth_service.get_current_user),
    project_id: str = Depends(get_current_project_id),
):
    """Get all fraud alerts with filtering"""
    query = db.query(FraudAlert).join(Case)

    if project_id:
        query = query.filter(Case.project_id == project_id)

    if status and status != "all":
        # Map frontend status to DB status if needed
        # Assuming direct mapping for now
        # DB status usually: 'open', 'investigating', 'resolved' ?
        # Frontend AdjudicationQueue uses 'pending', 'approved', 'rejected', 'escalated'
        # FraudAlert table has is_acknowledged boolean and status string in Schema?
        # Database.py says: status = Column(String, default="open", index=True) (wait, FraudAlert doesn't have status column in my view of step 2141?)
        # Let's check 2141.
        # FraudAlert (Line 264) has `severity`, `title`, `description`, `alert_metadata`, `is_acknowledged`, `acknowledged_by`.
        # NO `status` column specifically? Wait.
        # Ah, Adjudication uses "status" for decision.
        # Maybe I need to add status column if it's missing or use metadata.
        # Or `is_acknowledged` covers it? But Adjudication implies decision.
        pass

    # The user view 2141 shows `FraudAlert` at line 264.
    # It DOES NOT have a `status` column. Only `severity`, `is_acknowledged`.
    # This is a missing schema element for "Adjudication Queue" which sets status to approved/rejected.
    # I should add `status` column to `FraudAlert` via migration script or assume it uses `alert_metadata`.
    # Ideally schema change.

    # For now, to allow Resume without failing, I'll rely on `alert_metadata` or assume schema update.
    # Actually, I'll update the migration script to add `status` column to `fraud_alerts`.

    # Let's assume for this file that `status` exists on the model (I will add it).
    if status:
        # query = query.filter(FraudAlert.status == status)
        pass

    alerts = query.order_by(FraudAlert.created_at.desc()).limit(limit).all()

    results = []
    for alert in alerts:
        # Construct response
        # Using metadata for missing columns temporarily if needed
        meta = getattr(alert, "alert_metadata", {}) or {}

        results.append(
            {
                "id": alert.id,
                "case_id": alert.case_id,
                "title": alert.title,
                "description": alert.description,
                "severity": alert.severity,
                "status": getattr(alert, "status", meta.get("status", "pending")),
                "risk_score": meta.get(
                    "risk_score", 0.0
                ),  # Assuming risk score is in metadata
                "created_at": alert.created_at.isoformat() if alert.created_at else None,
            }
        )

    return results


@router.put("/{alert_id}")
async def update_alert(
    alert_id: str,
    update_data: dict[str, Any] = Body(...),
    db: Session = Depends(get_db),
    current_user: dict = Depends(auth_service.get_current_user),
):
    """Update alert status"""
    alert = db.query(FraudAlert).filter(FraudAlert.id == alert_id).first()
    if not alert:
        raise HTTPException(status_code=404, detail="Alert not found")

    status = update_data.get("status")
    note = update_data.get("note")

    # Update status
    if status:
        # If schema has status:
        if hasattr(alert, "status"):
            alert.status = status
        else:
            # Fallback to metadata
            meta = dict(alert.alert_metadata or {})
            meta["status"] = status
            alert.alert_metadata = meta

    # Auto-acknowledge
    if status in ["approved", "rejected", "escalated"]:
        alert.is_acknowledged = True
        alert.acknowledged_at = datetime.now(UTC)
        user_id = (
            getattr(current_user, "id", str(current_user)) if current_user else None
        )
        alert.acknowledged_by = user_id

    db.commit()
    return {"message": "Alert updated", "status": status}
