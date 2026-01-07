# api/semantic_search.py
import logging
from datetime import UTC, datetime
from typing import Any

from fastapi import APIRouter, Body, Depends, HTTPException, Query
from sqlalchemy.orm import Session

from app.services.semantic_search_service import SemanticSearchEngine
from core.database import get_db

logger = logging.getLogger(__name__)

logger.warning("The 'semantic-search' router is DEPRECATED and uses a MOCK engine. Use 'ai' router instead.")

router = APIRouter(tags=["semantic-search"], deprecated=True)

# Global semantic search engine
semantic_engine = None


def get_semantic_engine():
    """Get or initialize semantic search engine"""
    global semantic_engine
    if semantic_engine is None:
        # Initialize with SQLite backend by default
        semantic_engine = SemanticSearchEngine(backend="sqlite", config={"db_path": "data/vector_store.db"})
    return semantic_engine


@router.post("/index")
async def index_document(
    document_id: str = Body(...),
    content: str = Body(...),
    metadata: dict[str, Any] | None = Body(None),
    backend: str | None = Query("sqlite", description="Vector store backend"),
    db: Session = Depends(get_db),
):
    """
    DEPRECATED: This endpoint has been permanently removed.

    Migration Path:
    - Old: POST /api/v1/semantic_search/index
    - New: POST /api/v1/ai/embeddings

    Example migration:
    ```javascript
    // Old
    fetch('/api/v1/semantic_search/index', {
      method: 'POST',
      body: JSON.stringify({
        document_id: 'doc123',
        content: 'text content',
        metadata: { type: 'evidence' }
      })
    });

    // New
    fetch('/api/v1/ai/embeddings', {
      method: 'POST',
      body: JSON.stringify({
        text: 'text content',
        metadata: {
          document_id: 'doc123',
          type: 'evidence'
        }
      })
    });
    ```

    This endpoint returns HTTP 410 Gone to indicate permanent deprecation.
    """
    raise HTTPException(
        status_code=410,
        detail={
            "error": "Endpoint permanently deprecated",
            "message": "Use /ai/embeddings instead",
            "migration": {
                "from": "/api/v1/semantic_search/index",
                "to": "/api/v1/ai/embeddings",
                "docs": "/docs/api/SEMANTIC_SEARCH_MIGRATION_GUIDE.md",
            },
        },
    )


@router.post("/index/batch")
async def index_batch_documents(
    documents: list[dict[str, Any]] = Body(...),
    backend: str | None = Query("sqlite", description="Vector store backend"),
    db: Session = Depends(get_db),
):
    """DEPRECATED: Use /ai/embeddings for batch document indexing."""
    raise HTTPException(
        status_code=410,
        detail={"error": "Endpoint deprecated", "use_instead": "/ai/embeddings"},
    )


@router.get("/search")
async def search_documents(
    query: str = Query(..., description="Search query"),
    limit: int = Query(10, description="Maximum number of results"),
    threshold: float = Query(0.0, description="Minimum similarity threshold"),
    backend: str | None = Query("sqlite", description="Vector store backend"),
    filters: str | None = Query(None, description="JSON metadata filters"),
    db: Session = Depends(get_db),
):
    """
    DEPRECATED: This endpoint has been permanently removed.

    Migration Path:
    - Old: GET /api/v1/semantic_search/search?query=...&limit=...
    - New: POST /api/v1/ai/semantic-search

    Example migration:
    ```javascript
    // Old
    fetch('/api/v1/semantic_search/search?query=fraud&limit=10');

    // New
    fetch('/api/v1/ai/semantic-search', {
      method: 'POST',
      body: JSON.stringify({
        query: 'fraud',
        top_k: 10,
        threshold: 0.6
      })
    });
    ```

    Note: Search is now POST instead of GET to support complex filter objects.
    """
    raise HTTPException(
        status_code=410,
        detail={
            "error": "Endpoint permanently deprecated",
            "message": "Use /ai/semantic-search instead",
            "migration": {
                "from": "/api/v1/semantic_search/search",
                "to": "/api/v1/ai/semantic-search",
                "method_change": "GET → POST",
                "parameter_change": "limit → top_k",
                "docs": "/docs/api/SEMANTIC_SEARCH_MIGRATION_GUIDE.md",
            },
        },
    )


@router.delete("/index/{document_id}")
async def delete_document(
    document_id: str,
    backend: str | None = Query("sqlite", description="Vector store backend"),
    db: Session = Depends(get_db),
):
    """DEPRECATED: Endpoint removed."""
    raise HTTPException(status_code=410, detail={"error": "Endpoint deprecated"})


@router.get("/stats")
async def get_search_stats(
    backend: str | None = Query("sqlite", description="Vector store backend"),
    db: Session = Depends(get_db),
):
    """DEPRECATED: Endpoint removed."""
    raise HTTPException(status_code=410, detail={"error": "Endpoint deprecated"})


@router.post("/rebuild")
async def rebuild_index(
    backend: str | None = Query("sqlite", description="Vector store backend"),
    db: Session = Depends(get_db),
):
    """DEPRECATED: Endpoint removed."""
    raise HTTPException(status_code=410, detail={"error": "Endpoint deprecated"})


@router.get("/backends")
async def get_available_backends():
    """
    Get available vector store backends

    Returns:
        List of available backends and their capabilities
    """
    try:
        backends = {
            "sqlite": {
                "name": "SQLite",
                "description": "Local SQLite vector store with basic functionality",
                "features": ["basic_search", "metadata_filtering", "persistence"],
                "dependencies": ["sqlite3", "sentence-transformers"],
                "recommended_for": "small_to_medium_datasets",
            },
            "chroma": {
                "name": "ChromaDB",
                "description": "Vector database optimized for AI applications",
                "features": [
                    "advanced_search",
                    "metadata_filtering",
                    "persistence",
                    "scalability",
                ],
                "dependencies": ["chromadb", "sentence-transformers"],
                "recommended_for": "medium_to_large_datasets",
            },
            "faiss": {
                "name": "FAISS",
                "description": "Facebook AI Similarity Search for high-performance vector search",
                "features": [
                    "high_performance_search",
                    "memory_efficient",
                    "scalability",
                ],
                "dependencies": ["faiss-cpu", "sentence-transformers"],
                "recommended_for": "large_datasets",
                "limitations": [
                    "no_individual_deletion",
                    "requires_rebuild_for_deletions",
                ],
            },
        }

        # Check availability
        availability = {}
        for backend_name in backends:
            try:
                if backend_name == "sqlite":
                    from app.services.ai.ai_service import AIService  # noqa: F401 - Import for availability check

                    availability[backend_name] = True
                elif backend_name == "chroma":
                    import chromadb  # noqa: F401 - Import for availability check

                    availability[backend_name] = True
                elif backend_name == "faiss":
                    import faiss  # noqa: F401 - Import for availability check

                    availability[backend_name] = True
                else:
                    availability[backend_name] = False
            except ImportError:
                availability[backend_name] = False

        return {
            "success": True,
            "backends": backends,
            "availability": availability,
            "timestamp": datetime.now(UTC).isoformat(),
        }

    except Exception as e:
        logger.error(f"Failed to get backends: {e!s}")
        raise HTTPException(status_code=500, detail=f"Failed to get backends: {e!s}")


@router.post("/switch-backend")
async def switch_backend(
    backend: str = Body(..., description="New backend to switch to"),
    config: dict[str, Any] | None = Body(None, description="Backend configuration"),
    db: Session = Depends(get_db),
):
    """DEPRECATED: Endpoint removed."""
    raise HTTPException(status_code=410, detail={"error": "Endpoint deprecated"})
