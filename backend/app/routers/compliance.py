from datetime import datetime, timezone
from typing import Any, Dict, List, Optional
import logging

from fastapi import APIRouter, Body, Depends, HTTPException
from sqlalchemy.orm import Session

from app.services.infrastructure.auth_service import auth_service
from core.database import get_db

logger = logging.getLogger(__name__)

router = APIRouter(
    prefix="/compliance",
    tags=["Compliance"],
)

from app.services.infrastructure.storage.database_service import db_service
import json

@router.post("/sar/create")
async def create_sar(
    payload: Dict[str, Any] = Body(...),
    db: Session = Depends(get_db),
    current_user: dict = Depends(auth_service.get_current_user),
):
    """Create a Suspicious Activity Report (SAR)"""
    try:
        case_id = payload.get("case_id")
        if not case_id:
            raise HTTPException(status_code=400, detail="case_id is required")

        # Create external tracking ID
        sar_external_id = f"SAR-2025-{datetime.now().strftime('%m%d')}-{case_id[:4].upper()}"
        
        # Prepare data for DB
        sar_data = {
            "case_id": case_id,
            "sar_id": sar_external_id,
            "status": "pending",
            "priority": payload.get("priority", "medium"),
            "report_data": json.dumps(payload.get("report_content", {})),
            "metadata_json": json.dumps(payload.get("metadata", {}))
        }
        
        # Persist to DB
        new_sar = db_service.create_sar(sar_data, created_by=current_user.get("id"))
        
        logger.info(f"SAR CREATED: {new_sar.sar_id} for case {case_id} by user {current_user.get('id')}")
        
        return {
            "status": "success",
            "id": new_sar.id,
            "sar_id": new_sar.sar_id,
            "case_id": case_id,
            "message": "Suspicious Activity Report has been saved and queued for regulatory submission",
            "timestamp": datetime.now(timezone.utc).isoformat()
        }
    except Exception as e:
        logger.error(f"Failed to create SAR for case {payload.get('case_id')}: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/sar/{case_id}")
async def get_case_sars(
    case_id: str,
    db: Session = Depends(get_db),
    current_user: dict = Depends(auth_service.get_current_user),
):
    """Get all SAR reports for a specific case"""
    try:
        sars = db_service.get_sars(case_id=case_id)
        return {"sars": sars}
    except Exception as e:
        logger.error(f"Failed to get SARs for case {case_id}: {e}")
        raise HTTPException(status_code=500, detail=str(e))
@router.post("/sar/{sar_id}/submit")
async def submit_sar(
    sar_id: str,
    current_user: dict = Depends(auth_service.get_current_user),
):
    """Officially submit a SAR report to regulatory authorities (simulated)"""
    try:
        success = db_service.submit_sar(sar_id)
        if not success:
            raise HTTPException(status_code=404, detail="SAR report not found")
        
        # In a real system, we would transmit to FinCEN/Regulatory body here
        # Generate a "Submission Receipt"
        receipt_id = f"REC-{datetime.now().strftime('%Y%m%d')}-{hash(sar_id) % 10000}"
        
        logger.info(f"SAR SUBMITTED: {sar_id} by {current_user.get('id')}. Receipt: {receipt_id}")
        
        return {
            "status": "success",
            "message": "SAR report has been successfully submitted to regulatory authorities",
            "receipt_id": receipt_id,
            "submitted_at": datetime.now(timezone.utc).isoformat()
        }
    except Exception as e:
        logger.error(f"Failed to submit SAR {sar_id}: {e}")
        raise HTTPException(status_code=500, detail=str(e))
