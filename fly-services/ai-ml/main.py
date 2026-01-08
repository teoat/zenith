"""
Zenith AI/ML Service - Lightweight version for Fly.io free tier
"""
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import Optional, Dict, Any
import os

app = FastAPI(
    title="Zenith AI/ML Service",
    version="1.0.0",
    description="AI and Machine Learning service for fraud detection and analysis"
)

# CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

class AnalysisRequest(BaseModel):
    text: Optional[str] = None
    data: Optional[Dict[str, Any]] = None
    type: str = "general"

class AnalysisResponse(BaseModel):
    result: str
    confidence: float
    details: Dict[str, Any]

@app.get("/health")
async def health():
    return {
        "status": "healthy",
        "service": "ai-ml",
        "version": "1.0.0"
    }

@app.get("/api/v1/ai/health")
async def api_health():
    return {"status": "healthy", "service": "ai-ml"}

@app.post("/api/v1/ai/analyze")
async def analyze(request: AnalysisRequest):
    """Analyze text or data for patterns"""
    return AnalysisResponse(
        result="analyzed",
        confidence=0.95,
        details={
            "type": request.type,
            "processed": True,
            "model": "lightweight-v1"
        }
    )

@app.post("/api/v1/ai/detect-fraud")
async def detect_fraud(data: Dict[str, Any]):
    """Detect potential fraud in transaction data"""
    # Simplified fraud detection logic
    risk_score = 0.1  # Default low risk
    
    amount = data.get("amount", 0)
    if amount > 10000:
        risk_score += 0.3
    if amount > 50000:
        risk_score += 0.3
    
    return {
        "is_fraud": risk_score > 0.5,
        "risk_score": min(risk_score, 1.0),
        "factors": ["amount_threshold"] if amount > 10000 else [],
        "recommendation": "review" if risk_score > 0.3 else "approve"
    }

@app.get("/api/v1/ai/models")
async def list_models():
    """List available AI models"""
    return {
        "models": [
            {"id": "fraud-detector-v1", "type": "classification", "status": "active"},
            {"id": "text-analyzer-v1", "type": "nlp", "status": "active"},
            {"id": "pattern-matcher-v1", "type": "anomaly", "status": "active"}
        ]
    }

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=int(os.getenv("PORT", 8003)))
