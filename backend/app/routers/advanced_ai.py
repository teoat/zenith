from typing import Any

# Consolidated Service Layer Imports
from app.services.ai.ai_service import ai_service
from app.services.intelligence.evidence_service import evidence_processor
from app.services.workflow.red_team_persona import red_team_service
from fastapi import APIRouter, File, Form, HTTPException, UploadFile
from pydantic import BaseModel

router = APIRouter()


class RAGQuery(BaseModel):
    query: str
    k: int = 3
    filters: dict[str, Any] | None = None


class RedTeamRequest(BaseModel):
    feature: str
    n: int = 5


@router.post("/advanced-ai/rag/query")
async def local_rag_query(req: RAGQuery):
    """Retrieve documents using consolidated AI Service (FAISS/TF-IDF)."""
    results = await ai_service.semantic_search(
        req.query, limit=req.k, filters=req.filters
    )
    return {"query": req.query, "results": results}


@router.post("/advanced-ai/rag/add")
async def local_rag_add(doc_id: str = Form(...), text: str = Form(...)):
    """Add a document to the shared vector store."""
    success = await ai_service.add_document(
        doc_id, text, metadata={"source": "user_upload"}
    )
    return {"success": success, "doc_id": doc_id}


@router.post("/advanced-ai/multimodal/image")
async def analyze_image(file: UploadFile = File(...)):
    """Analyze an image for metadata and text (OCR) using the shared EvidenceProcessor."""
    import os
    import tempfile

    try:
        # Save uploaded file temporarily
        suffix = os.path.splitext(file.filename)[1] if file.filename else ""
        with tempfile.NamedTemporaryFile(delete=False, suffix=suffix) as temp_file:
            content = await file.read()
            temp_file.write(content)
            temp_file_path = temp_file.name

        try:
            results = await evidence_processor.process_files_batch(
                [temp_file_path], options={"enable_ocr": True, "enable_forensics": True}
            )
            if not results:
                raise HTTPException(status_code=500, detail="Analysis failed")

            result = results[0]
            return {
                "metadata": result.metadata,
                "text": result.extracted_text,
                "quality_score": result.quality_score,
                "key_entities": result.key_entities,
            }
        finally:
            if os.path.exists(temp_file_path):
                os.unlink(temp_file_path)

    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/advanced-ai/multimodal/text")
async def analyze_text(text: str = Form(...)):
    """Analyze text for fraud indicators using the shared EvidenceProcessor."""
    import os
    import tempfile

    try:
        with tempfile.NamedTemporaryFile(
            delete=False, mode="w", suffix=".txt"
        ) as temp_file:
            temp_file.write(text)
            temp_file_path = temp_file.name

        try:
            results = await evidence_processor.process_files_batch([temp_file_path])
            if not results:
                raise HTTPException(status_code=500, detail="Analysis failed")

            result = results[0]
            return {
                "sentiment_score": result.sentiment_score,
                "entities": result.key_entities,
                "meta": result.metadata,
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
async def ai_stats():
    """Get statistics about the advanced AI services."""
    return {
        "vector_store_docs": len(ai_service.vector_store),
        "red_team_vectors": red_team_service.get_attack_types(),
        "evidence_processed": evidence_processor.metrics["total_processed"],
    }
