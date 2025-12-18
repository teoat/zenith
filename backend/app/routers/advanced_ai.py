from typing import Any, Dict, List

from fastapi import APIRouter, Depends, File, Form, HTTPException, UploadFile
from pydantic import BaseModel

# Import from the new standard service locations
from app.services.ai.local_rag_engine import rag_engine
# from app.services.ai.multimodal.multimodal_analyzer import multimodal_analyzer
from app.services.workflow.red_team_persona import red_team_service
from core.database import get_db

router = APIRouter()


class RAGQuery(BaseModel):
    query: str
    k: int = 3


class RedTeamRequest(BaseModel):
    feature: str
    n: int = 5


@router.post("/advanced-ai/rag/query")
def local_rag_query(req: RAGQuery):
    """Retrieve documents using Local RAG (TF-IDF/Cosine Similarity)."""
    results = rag_engine.retrieve(req.query, k=req.k)
    return {"query": req.query, "results": results}


@router.post("/advanced-ai/rag/add")
def local_rag_add(doc_id: str = Form(...), text: str = Form(...)):
    """Add a document to the local vector store."""
    rag_engine.add_document(doc_id, text)
    return {"success": True, "doc_id": doc_id, "stats": rag_engine.get_stats()}


@router.post("/advanced-ai/multimodal/image")
async def analyze_image(file: UploadFile = File(...)):
    """Analyze an image for metadata and text (OCR)."""
    import tempfile
    import os
    from app.services.intelligence.evidence_service import EvidenceProcessor

    processor = EvidenceProcessor()

    try:
        # Save uploaded file temporarily (EvidenceProcessor expects file path)
        suffix = os.path.splitext(file.filename)[1] if file.filename else ""
        with tempfile.NamedTemporaryFile(delete=False, suffix=suffix) as temp_file:
            content = await file.read()
            temp_file.write(content)
            temp_file_path = temp_file.name

        try:
             results = await processor.process_files_batch(
                 [temp_file_path], 
                 options={"enable_ocr": True, "enable_forensics": True}
             )
             if not results:
                 raise HTTPException(status_code=500, detail="Analysis failed")
             
             result = results[0]
             # Map back to simple response format expected by this endpoint consumers
             return {
                 "metadata": result.metadata,
                 "text": result.extracted_text,
                 "quality_score": result.quality_score
             }
        finally:
            if os.path.exists(temp_file_path):
                os.unlink(temp_file_path)

    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/advanced-ai/multimodal/text")
async def analyze_text(text: str = Form(...)):
    """Analyze text for fraud indicators."""
    # Since EvidenceProcessor is file-based, we can use a simpler direct analysis here 
    # or wrap text in a temp file. For now, let's use the sentiment analysis 
    # part of the processor if exposed, or keep it simple.
    # Actually, EvidenceProcessor has _analyze_sentiment but it's internal.
    # Let's use a quick temp file approach to leverage the exact same pipeline.
    
    import tempfile
    import os
    from app.services.intelligence.evidence_service import EvidenceProcessor

    processor = EvidenceProcessor()

    try:
        with tempfile.NamedTemporaryFile(delete=False, mode="w", suffix=".txt") as temp_file:
            temp_file.write(text)
            temp_file_path = temp_file.name
        
        try:
            results = await processor.process_files_batch([temp_file_path])
            if not results:
                 raise HTTPException(status_code=500, detail="Analysis failed")
            
            result = results[0]
            return {
                "sentiment_score": result.sentiment_score,
                "entities": result.key_entities,
                "meta": result.metadata
            }
        finally:
            if os.path.exists(temp_file_path):
                os.unlink(temp_file_path)
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/advanced-ai/red-team/generate")
def generate_red_team_prompts(req: RedTeamRequest):
    """Generate adversarial prompts to test a feature."""
    prompts = red_team_service.generate_prompts(req.feature, n=req.n)
    return {"feature": req.feature, "adversarial_prompts": prompts}


@router.get("/advanced-ai/stats")
def ai_stats():
    """Get statistics about the advanced AI services."""
    return {
        "rag": rag_engine.get_stats(),
        "red_team_vectors": red_team_service.get_attack_types(),
    }