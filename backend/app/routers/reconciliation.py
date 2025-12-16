from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from typing import List, Dict, Any, Optional
from datetime import datetime, timezone
from pydantic import BaseModel

from core.database import get_db, UserRole, Transaction, User
from app.services.reconciliation_service import ReconciliationService
from app.services.fraud_rules_engine import get_fraud_engine
from app.services.auth_service import auth_service

router = APIRouter(
    tags=["reconciliation"],
    responses={404: {"description": "Not found"}},
)

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

for _svc in ('reconciliation_service', 'fraud_engine', 'db_service'):
    if _svc not in globals():
        globals()[_svc] = None

# --- Schemas ---

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

# --- Endpoints ---

@router.get("/items", response_model=List[Dict[str, Any]])
async def get_reconciliation_items(
    status: Optional[str] = None,
    limit: int = 100,
    db: Session = Depends(get_db),
    current_user: User = Depends(auth_service.get_current_user)
):
    """
    Get list of items for reconciliation view.
    """
    query = db.query(Transaction)
    
    # Filter logic could be more complex, but for now:
    # If status is provided, filter by metadata json
    # Note: JSON filtering in SQLite can be tricky with SQLAlchemy generic operators,
    # but basic text match or logic in python for small sets works.
    # For robust production, use database specific JSON operators.
    
    # For MVP, we'll fetch recent transactions and filter/map them.
    transactions = query.order_by(Transaction.date.desc()).limit(limit).all()
    
    items = []
    for t in transactions:
        meta = t.transaction_metadata or {}
        recon_status = meta.get('reconciliation_status', 'pending')
        
        if status and status != 'all' and recon_status != status:
            continue
            
        items.append({
            "id": t.id,
            "transactionId": t.id,
            "source": t.merchant_name or "Unknown", # Simplified
            "amount": t.amount,
            "currency": t.currency,
            "date": t.date.isoformat() if t.date else None,
            "status": recon_status,
            "discrepancyAmount": meta.get('discrepancy_amount'),
            "notes": meta.get('reconciliation_notes') or meta.get('discrepancy_reason')
        })
    
    return items

@router.post("/cash-float", response_model=Dict[str, Any])
async def analyze_cash_float(
    request: CashFloatRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(auth_service.get_current_user)
):
    """
    Reconcile a cash float for a specific entity over a time period.
    """
    service = ReconciliationService(db)
    result = service.reconcile_cash_float(
        request.entity_name,
        request.start_date,
        request.end_date
    )
    return result

@router.post("/batch-match", response_model=Dict[str, Any])
async def find_batch_matches(
    request: BatchMatchRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(auth_service.get_current_user)
):
    """
    Find expenses that match a specific withdrawal amount.
    """
    service = ReconciliationService(db)
    result = service.find_batch_matches(request.withdrawal_id, request.tolerance)
    
    if "error" in result:
        raise HTTPException(status_code=404, detail=result["error"])
        
    return result

@router.post("/temporal-analysis", response_model=Dict[str, Any])
async def analyze_temporal_anomalies(
    request: TemporalAnalysisRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(auth_service.get_current_user)
):
    """
    Check for temporal anomalies in a specific set of transactions.
    """
    # Verify transactions exist first? 
    # For now, we fetch them to pass to the rule engine logic if needed,
    # or just use the rule engine directly if extended.
    
    # In this specific architecture, the FraudRulesEngine usually takes dicts.
    # We will fetch the transactions from DB first.
    
    transactions = db.query(Transaction).filter(
        Transaction.id.in_(request.transaction_ids)
    ).all()
    
    # Convert to dicts for the Rule Engine
    txn_dicts = []
    for t in transactions:
        txn_dict = {c.name: getattr(t, c.name) for c in t.__table__.columns}
        # specific handling for datetimes if needed by engine, usually handled inside
        txn_dicts.append(txn_dict)

    engine = await get_fraud_engine()
    anomalies = engine.check_temporal_anomalies(txn_dicts)
    
    return {
        "analyzed_count": len(transactions),
        "anomalies_found": len(anomalies),
        "anomalies": anomalies
    }

class BatchSaveRequest(BaseModel):
    withdrawal_id: str
    expense_ids: List[str]

@router.post("/batch/save", response_model=Dict[str, Any])
async def save_batch_match(
    request: BatchSaveRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(auth_service.get_current_user)
):
    """
    Persist a batch match by linking expenses to a withdrawal.
    """
    service = ReconciliationService(db)
    return service.save_batch_match(request.withdrawal_id, request.expense_ids)

@router.post("/batch/analyze-sequence", response_model=Dict[str, Any])
async def analyze_sequence_anomalies(
    request: SequenceAnalysisRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(auth_service.get_current_user)
):
    """
    Check for sequence anomalies (backdating) in a batch.
    """
    transactions = db.query(Transaction).filter(
        Transaction.id.in_(request.transaction_ids)
    ).all()
    
    if not transactions:
        raise HTTPException(status_code=404, detail="No transactions found")
        
    txn_dicts = []
    for txn in transactions:
        d = {c.name: getattr(txn, c.name) for c in txn.__table__.columns}
        txn_dicts.append(d)
        
    engine = await get_fraud_engine()
    anomalies = engine.check_sequence_anomalies(txn_dicts, request.funding_source_id, db) # Pass DB
    
    return {
        "analyzed_count": len(transactions),
        "anomalies_found": len(anomalies),
        "anomalies": anomalies
    }

@router.post("/reconcile/{transaction_id}")
async def mark_reconciled(
    transaction_id: str,
    notes: Optional[str] = None,
    db: Session = Depends(get_db),
    current_user: User = Depends(auth_service.get_current_user)
):
    """Mark a transaction as reconciled"""
    try:
        
        tx = db.query(Transaction).filter(Transaction.id == transaction_id).first()
        if not tx:
            raise HTTPException(status_code=404, detail="Transaction not found")
            
        # Update metadata
        meta = dict(tx.transaction_metadata or {})
        meta['reconciliation_status'] = 'reconciled'
        if notes:
            meta['reconciliation_notes'] = notes
        meta['reconciled_at'] = datetime.now(timezone.utc).isoformat()
        
        tx.transaction_metadata = meta
        db.commit()
        
        return {"success": True, "id": tx.id, "status": "reconciled"}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/flag/{transaction_id}")
async def flag_discrepancy(
    transaction_id: str,
    reason: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(auth_service.get_current_user)
):
    """Flag a transaction discrepancy"""
    try:
        
        tx = db.query(Transaction).filter(Transaction.id == transaction_id).first()
        if not tx:
            raise HTTPException(status_code=404, detail="Transaction not found")
            
        # Update metadata
        meta = dict(tx.transaction_metadata or {})
        meta['reconciliation_status'] = 'discrepancy'
        meta['discrepancy_reason'] = reason
        meta['flagged_at'] = datetime.now(timezone.utc).isoformat()
        
        tx.transaction_metadata = meta
        # efficient flagging
        tx.is_flagged = True
        
        db.commit()
        
        return {"success": True, "id": tx.id, "status": "discrepancy"}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))