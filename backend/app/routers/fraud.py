# backend/app/routers/fraud.py
import logging
from datetime import datetime, timezone
from typing import Any, Dict, List, Optional

from fastapi import APIRouter, Body, Depends, HTTPException, Query
from sqlalchemy.orm import Session

from app.services.infrastructure.auth_service import auth_service
from app.services.fraud.fraud_service import FraudDetectionService
from core.database import get_db

logger = logging.getLogger(__name__)

router = APIRouter()


@router.post("/analyze/{case_id}")
async def analyze_case(
    case_id: str,
    transaction_ids: Optional[List[str]] = Body(None, embed=True),
    db: Session = Depends(get_db),
    current_user: dict = Depends(auth_service.get_current_user),
):
    """Analyze a case for fraud patterns"""
    try:
        service = FraudDetectionService(db)
        result = service.analyze_case(case_id, transaction_ids)
        return result
    except Exception as e:
        logger.error(f"Error analyzing case {case_id}: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/alerts/{case_id}")
async def get_case_alerts(
    case_id: str,
    db: Session = Depends(get_db),
    current_user: dict = Depends(auth_service.get_current_user),
):
    """Get all fraud alerts for a case"""
    try:
        service = FraudDetectionService(db)
        alerts = service.get_case_alerts(case_id)
        return {"alerts": alerts}
    except Exception as e:
        logger.error(f"Error getting alerts for case {case_id}: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.put("/alerts/{alert_id}/status")
async def update_alert_status(
    alert_id: str,
    status: str = Body(..., embed=True),
    db: Session = Depends(get_db),
    current_user: dict = Depends(auth_service.get_current_user),
):
    """Update the status of a fraud alert"""
    try:
        if status not in ["open", "investigating", "resolved", "false_positive"]:
            raise HTTPException(status_code=400, detail="Invalid status")

        service = FraudDetectionService(db)
        success = service.update_alert_status(alert_id, status, current_user.get("id"))

        if not success:
            raise HTTPException(status_code=404, detail="Alert not found")

        return {"message": "Alert status updated successfully"}

    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error updating alert {alert_id}: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/stats")
async def get_fraud_stats(
    db: Session = Depends(get_db),
    current_user: dict = Depends(auth_service.get_current_user),
):
    """Get fraud detection statistics"""
    try:
        # This would typically aggregate data from the database
        # For now, return basic placeholder stats
        return {
            "total_cases_analyzed": 0,
            "total_alerts_generated": 0,
            "high_risk_alerts": 0,
            "resolved_alerts": 0,
            "average_response_time": "0s",
        }
    except Exception as e:
        logger.error(f"Error getting fraud stats: {e}")
        raise HTTPException(status_code=500, detail=str(e))
