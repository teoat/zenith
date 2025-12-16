"""
Intelligence API Router
Endpoints for Phase 4 Advanced Intelligence features

Provides:
- Fraud detection analysis
- Multi-modal evidence processing
- Risk scoring
"""

from datetime import datetime
from typing import Any, Dict, List

from fastapi import APIRouter, Depends, File, HTTPException, Request, UploadFile
from pydantic import BaseModel
from slowapi import Limiter
from slowapi.util import get_remote_address

from app.services.intelligence import (
    ExtractedEvidence,
    FraudAlert,
    FraudDetectionEngine,
    MultiModalProcessor,
    Transaction,
)

router = APIRouter(prefix="/intelligence", tags=["intelligence"])

# Initialize services
fraud_engine = FraudDetectionEngine()
evidence_processor = MultiModalProcessor()

# Initialize rate limiter
limiter = Limiter(key_func=get_remote_address)


# Request/Response Models
class TransactionInput(BaseModel):
    id: str
    amount: float
    timestamp: datetime
    source_account: str
    destination_account: str
    description: str
    merchant: str = ""
    category: str = ""


class FraudAnalysisRequest(BaseModel):
    transactions: List[TransactionInput]


class FraudAlertResponse(BaseModel):
    alert_id: str
    fraud_type: str
    risk_score: int
    confidence: float
    transactions: List[str]
    description: str
    detected_at: datetime
    details: Dict[str, Any]


class RiskScoreResponse(BaseModel):
    account: str
    risk_score: int
    alert_count: int
    fraud_types_detected: List[str]


class EvidenceResponse(BaseModel):
    file_id: str
    filename: str
    file_type: str
    file_size: int
    extracted_text: str
    ocr_confidence: float
    metadata: Dict[str, Any]
    processed_at: datetime
    has_suspicious_indicators: bool


# Endpoints


@router.post("/fraud/analyze", response_model=List[FraudAlertResponse])
@limiter.limit("10/minute")  # Limit to 10 requests per minute
async def analyze_fraud(request: Request, fraud_request: FraudAnalysisRequest):
    """
    Analyze transactions for fraud patterns

    Detects:
    - Structuring (transactions split to avoid reporting)
    - Velocity (too many transactions too fast)
    - Round trips (circular money flow)

    Rate limit: 10 requests per minute
    """
    # Convert to Transaction objects
    transactions = [
        Transaction(
            id=tx.id,
            amount=tx.amount,
            timestamp=tx.timestamp,
            source_account=tx.source_account,
            destination_account=tx.destination_account,
            description=tx.description,
            merchant=tx.merchant,
            category=tx.category,
        )
        for tx in fraud_request.transactions
    ]

    # Run fraud detection with validation
    try:
        alerts = fraud_engine.analyze_transactions(transactions)
    except (ValueError, TypeError) as e:
        raise HTTPException(status_code=400, detail=str(e))

    # Convert to response format
    return [
        FraudAlertResponse(
            alert_id=alert.alert_id,
            fraud_type=alert.fraud_type.value,
            risk_score=alert.risk_score,
            confidence=alert.confidence,
            transactions=alert.transactions,
            description=alert.description,
            detected_at=alert.detected_at,
            details=alert.details,
        )
        for alert in alerts
    ]


@router.post("/fraud/risk-score/{account}", response_model=RiskScoreResponse)
async def calculate_risk_score(account: str, request: FraudAnalysisRequest):
    """Calculate overall risk score for an account"""

    transactions = [
        Transaction(
            id=tx.id,
            amount=tx.amount,
            timestamp=tx.timestamp,
            source_account=tx.source_account,
            destination_account=tx.destination_account,
            description=tx.description,
            merchant=tx.merchant,
            category=tx.category,
        )
        for tx in request.transactions
    ]

    # Calculate risk
    risk_score = fraud_engine.calculate_overall_risk(account, transactions)

    # Get alerts for this account
    alerts = fraud_engine.analyze_transactions(transactions)
    account_alerts = [
        a for a in alerts if account in str(a.details) or account in a.transactions
    ]

    fraud_types = list(set(a.fraud_type.value for a in account_alerts))

    return RiskScoreResponse(
        account=account,
        risk_score=risk_score,
        alert_count=len(account_alerts),
        fraud_types_detected=fraud_types,
    )


@router.post("/evidence/process", response_model=EvidenceResponse)
@limiter.limit("5/minute")  # Stricter limit for file uploads (resource-intensive)
async def process_evidence(request: Request, file: UploadFile = File(...)):
    """
    Process uploaded evidence file

    Supports:
    - PDF documents (text extraction + OCR)
    - Images (OCR + metadata + forensics)
    - Text files

    Rate limit: 5 requests per minute
    """
    try:
        # Save temporarily
        import os
        import tempfile

        with tempfile.NamedTemporaryFile(
            delete=False, suffix=os.path.splitext(file.filename)[1]
        ) as tmp_file:
            content = await file.read()
            tmp_file.write(content)
            tmp_path = tmp_file.name

        try:
            # Process file
            evidence = evidence_processor.process_file(tmp_path, file_id=file.filename)

            # Check for suspicious indicators
            has_suspicious = False
            if evidence.image_analysis:
                forensics = evidence.image_analysis.get("forensics", {})
                has_suspicious = forensics.get("risk_level") in ("high", "medium")

            return EvidenceResponse(
                file_id=evidence.file_id,
                filename=evidence.filename,
                file_type=evidence.file_type,
                file_size=evidence.file_size,
                extracted_text=evidence.extracted_text[:5000],  # Limit response size
                ocr_confidence=evidence.ocr_confidence,
                metadata=evidence.metadata,
                processed_at=evidence.processed_at,
                has_suspicious_indicators=has_suspicious,
            )
        finally:
            # Clean up temp file
            os.unlink(tmp_path)

    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Processing error: {str(e)}")


@router.get("/evidence/search")
async def search_evidence(query: str) -> List[Dict[str, Any]]:
    """Search processed evidence files"""

    results = evidence_processor.search(query)

    return [
        {
            "file_id": e.file_id,
            "filename": e.filename,
            "file_type": e.file_type,
            "snippet": (
                e.extracted_text[:200] + "..."
                if len(e.extracted_text) > 200
                else e.extracted_text
            ),
            "ocr_confidence": e.ocr_confidence,
            "processed_at": e.processed_at.isoformat(),
        }
        for e in results
    ]


@router.get("/evidence/statistics")
async def get_evidence_statistics() -> Dict[str, Any]:
    """Get processing statistics"""
    return evidence_processor.get_statistics()


@router.get("/health")
async def health_check():
    """Health check for intelligence services"""
    return {
        "status": "healthy",
        "fraud_engine": "operational",
        "evidence_processor": "operational",
        "processed_files": len(evidence_processor.processed_files),
        "fraud_alerts": len(fraud_engine.alerts),
    }
