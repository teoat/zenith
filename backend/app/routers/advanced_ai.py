from fastapi import APIRouter, UploadFile, File, Form, Depends, HTTPException
from typing import List, Dict, Any
from pydantic import BaseModel

# Import from the new standard service locations
from app.services.local_rag_engine import rag_engine
from app.services.multimodal_analyzer import multimodal_analyzer
from app.services.red_team_persona import red_team_service
from core.database import get_db

router = APIRouter()

class RAGQuery(BaseModel):
    query: str
    k: int = 3

class RedTeamRequest(BaseModel):
    feature: str
    n: int = 5

@router.post('/advanced-ai/rag/query')
def local_rag_query(req: RAGQuery):
    """Retrieve documents using Local RAG (TF-IDF/Cosine Similarity)."""
    results = rag_engine.retrieve(req.query, k=req.k)
    return {"query": req.query, "results": results}

@router.post('/advanced-ai/rag/add')
def local_rag_add(doc_id: str = Form(...), text: str = Form(...)):
    """Add a document to the local vector store."""
    rag_engine.add_document(doc_id, text)
    return {"success": True, "doc_id": doc_id, "stats": rag_engine.get_stats()}

@router.post('/advanced-ai/multimodal/image')
def analyze_image(file: UploadFile = File(...)):
    """Analyze an image for metadata and text (OCR)."""
    try:
        data = file.file.read()
        res = multimodal_analyzer.analyze_image(data)
        return res
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.post('/advanced-ai/multimodal/text')
def analyze_text(text: str = Form(...)):
    """Analyze text for fraud indicators."""
    return multimodal_analyzer.analyze_text(text)

@router.post('/advanced-ai/red-team/generate')
def generate_red_team_prompts(req: RedTeamRequest):
    """Generate adversarial prompts to test a feature."""
    prompts = red_team_service.generate_prompts(req.feature, n=req.n)
    return {"feature": req.feature, "adversarial_prompts": prompts}

@router.get('/advanced-ai/stats')
def ai_stats():
    """Get statistics about the advanced AI services."""
    return {
        "rag": rag_engine.get_stats(),
        "red_team_vectors": red_team_service.get_attack_types()
    }