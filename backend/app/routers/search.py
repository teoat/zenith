from typing import Any, Dict, Optional

from fastapi import APIRouter, Depends, HTTPException

from app.services.ai.ai_service import ai_service
from app.services.search_service import evidence_search_index

vector_store = ai_service.vector_store

router = APIRouter()

# ===== EVIDENCE SEARCH ENDPOINTS =====


@router.post("")
async def search_evidence(
    query: str, limit: int = 20, filters: Optional[Dict[str, Any]] = None
):
    """Search processed evidence content"""
    try:
        results = await evidence_search_index.search_evidence(query, limit, filters)
        return {"query": query, "total_results": len(results), "results": results}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Search failed: {str(e)}")


@router.get("/stats")
async def get_evidence_search_stats():
    """Get statistics about indexed evidence"""
    try:
        stats = evidence_search_index.get_evidence_stats()
        return {"evidence_index_stats": stats}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


from pydantic import BaseModel

class SemanticSearchRequest(BaseModel):
    query: str
    limit: int = 10
    threshold: float = 0.0

@router.post("/semantic")
async def semantic_search_evidence(request: SemanticSearchRequest):
    """Perform semantic search on evidence content"""
    try:
        results = await ai_service.semantic_search(request.query, request.limit)
        return {"query": request.query, "total_results": len(results), "results": results}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Semantic search failed: {str(e)}")


@router.get("/semantic/stats")
async def get_semantic_search_stats():
    """Get statistics about the semantic search vector store"""
    try:
        # ai_service.vector_store is a dict
        stats = {
            "total_documents": len(ai_service.vector_store),
            "initialized": ai_service.initialized
        }
        return {"semantic_search_stats": stats}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
