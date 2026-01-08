"""
Fraud detection router
"""

from fastapi import APIRouter

router = APIRouter()


@router.post("/patterns/detect")
async def detect_patterns():
    """Detect fraud patterns in transaction data"""
    return {"message": "Pattern detection endpoint - to be implemented"}


@router.post("/scoring/calculate")
async def calculate_risk_score():
    """Calculate risk scores for entities"""
    return {"message": "Risk scoring endpoint - to be implemented"}
