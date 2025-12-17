
from datetime import datetime, timezone
from typing import Any, Dict, List, Optional

from fastapi import APIRouter, Depends, HTTPException, Query
from pydantic import BaseModel
from sqlalchemy.orm import Session

from app.services.infrastructure.auth_service import auth_service
from app.services.reconciliation_service import ReconciliationService
from app.services.temporal_burst_detector import temporal_burst_detector
from core.database import Transaction, User, UserRole, get_db

router = APIRouter(
    tags=["reconciliation"],
    responses={404: {"description": "Not found"}},
)

# Stub deps if testing
if "get_current_user" not in globals():
    try:
        get_current_user = auth_service.get_current_user
    except Exception:
        def get_current_user(*args, **kwargs): return None

class CashFloatRequest(BaseModel):
    entity_name: str
    start_date: datetime
    end_date: datetime

class BatchMatchRequest(BaseModel):
    withdrawal_id: str
    tolerance: float = 0.05

class TemporalAnalysisRequest(BaseModel):
    transaction_ids: List[str]

class SequenceAnalysisRequest(BaseModel):
    transaction_ids: List[str]
    funding_source_id: Optional[str] = None

class BatchSaveRequest(BaseModel):
    withdrawal_id: str
    expense_ids: List[str]

@router.get("/items", response_model=List[Dict[str, Any]])
async def get_reconciliation_items(
    status: Optional[str] = None,
    limit: int = 100,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    query = db.query(Transaction)
    transactions = query.order_by(Transaction.date.desc()).limit(limit).all()
    items = []
    for t in transactions:
        meta = t.transaction_metadata or {}
        recon_status = meta.get("reconciliation_status", "pending")
        if status and status != "all" and recon_status != status:
             continue
        items.append({
            "id": t.id,
            "transactionId": t.id,
            "source": t.merchant_name or "Unknown",
            "amount": t.amount,
            "currency": t.currency,
            "date": t.date.isoformat() if t.date else None,
            "status": recon_status,
        })
    return items

@router.post("/cash-float", response_model=Dict[str, Any])
async def analyze_cash_float(
    request: CashFloatRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    service = ReconciliationService(db)
    return service.reconcile_cash_float(request.entity_name, request.start_date, request.end_date)

@router.post("/batch-match", response_model=Dict[str, Any])
async def find_batch_matches(
    request: BatchMatchRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    service = ReconciliationService(db)
    return service.find_batch_matches(request.withdrawal_id, request.tolerance)

@router.post("/temporal-analysis", response_model=Dict[str, Any])
async def analyze_temporal_anomalies(
    request: TemporalAnalysisRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    transactions = db.query(Transaction).filter(Transaction.id.in_(request.transaction_ids)).all()
    txn_dicts = []
    for t in transactions:
        txn_dicts.append({
            "id": t.id, 
            "customer_id": getattr(t, 'account_id', 'unknown'),
            "amount": t.amount,
            "date": t.date.isoformat() if t.date else None
        })
    
    # Use temporal burst detector instead of fraud engine
    results = temporal_burst_detector.analyze_transactions(txn_dicts)
    anomalies = results.get("alerts", [])

    return {
        "analyzed_count": len(transactions),
        "anomalies_found": len(anomalies),
        "anomalies": anomalies,
    }

@router.post("/batch/save", response_model=Dict[str, Any])
async def save_batch_match(
    request: BatchSaveRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    service = ReconciliationService(db)
    return service.save_batch_match(request.withdrawal_id, request.expense_ids)

@router.post("/batch/analyze-sequence", response_model=Dict[str, Any])
async def analyze_sequence_anomalies(
    request: SequenceAnalysisRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    # Mock implementation as Sequence Analysis logic was in legacy engine
    return {
        "analyzed_count": len(request.transaction_ids),
        "anomalies_found": 0,
        "anomalies": [],
        "message": "Sequence analysis not yet migrated to Plugin Architecture"
    }

@router.post("/reconcile/{transaction_id}")
async def mark_reconciled(
    transaction_id: str,
    notes: Optional[str] = None,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    tx = db.query(Transaction).filter(Transaction.id == transaction_id).first()
    if not tx:
        raise HTTPException(status_code=404, detail="Transaction not found")
    
    meta = dict(tx.transaction_metadata or {})
    meta["reconciliation_status"] = "reconciled"
    if notes: meta["reconciliation_notes"] = notes
    meta["reconciled_at"] = datetime.now(timezone.utc).isoformat()
    tx.transaction_metadata = meta
    db.commit()
    return {"success": True, "id": tx.id, "status": "reconciled"}

@router.post("/flag/{transaction_id}")
async def flag_discrepancy(
    transaction_id: str,
    reason: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    tx = db.query(Transaction).filter(Transaction.id == transaction_id).first()
    if not tx:
        raise HTTPException(status_code=404, detail="Transaction not found")
        
    meta = dict(tx.transaction_metadata or {})
    meta["reconciliation_status"] = "discrepancy"
    meta["discrepancy_reason"] = reason
    meta["flagged_at"] = datetime.now(timezone.utc).isoformat()
    tx.transaction_metadata = meta
    db.commit()
    return {"success": True, "id": tx.id, "status": "discrepancy"}
