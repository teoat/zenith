# api/semantic_search.py
from fastapi import APIRouter, Depends, HTTPException, Query, Body
from sqlalchemy.orm import Session
from typing import List, Optional, Dict, Any
import logging
from datetime import datetime, timezone

from core.database import get_db
from app.services.semantic_search_service import SemanticSearchEngine

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/semantic-search", tags=["semantic-search"])

# Global semantic search engine
semantic_engine = None

def get_semantic_engine():
    """Get or initialize semantic search engine"""
    global semantic_engine
    if semantic_engine is None:
        # Initialize with SQLite backend by default
        semantic_engine = SemanticSearchEngine(
            backend="sqlite",
            config={'db_path': 'data/vector_store.db'}
        )
    return semantic_engine

@router.post("/index")
async def index_document(
    document_id: str = Body(...),
    content: str = Body(...),
    metadata: Optional[Dict[str, Any]] = Body(None),
    backend: Optional[str] = Query("sqlite", description="Vector store backend"),
    db: Session = Depends(get_db)
):
    """
    Index a document for semantic search
    
    Args:
        document_id: Unique document identifier
        content: Document content to index
        metadata: Additional metadata
        backend: Vector store backend to use
        
    Returns:
        Indexing result
    """
    try:
        # Get appropriate engine
        if backend != "sqlite":
            engine = SemanticSearchEngine(backend=backend)
        else:
            engine = get_semantic_engine()
        
        # Index document
        result = engine.index_document(document_id, content, metadata)
        
        return {
            "success": result.success,
            "document_id": result.document_id,
            "indexing_time": result.indexing_time,
            "embedding_dimension": result.embedding_dimension,
            "error": result.error,
            "backend": backend,
            "timestamp": datetime.now(timezone.utc).isoformat()
        }
        
    except Exception as e:
        logger.error(f"Document indexing failed: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Indexing failed: {str(e)}")

@router.post("/index/batch")
async def index_batch_documents(
    documents: List[Dict[str, Any]] = Body(...),
    backend: Optional[str] = Query("sqlite", description="Vector store backend"),
    db: Session = Depends(get_db)
):
    """
    Index multiple documents for semantic search
    
    Args:
        documents: List of documents to index
        backend: Vector store backend to use
        
    Returns:
        Batch indexing results
    """
    try:
        if not documents:
            raise HTTPException(status_code=400, detail="No documents provided")
        
        # Get appropriate engine
        if backend != "sqlite":
            engine = SemanticSearchEngine(backend=backend)
        else:
            engine = get_semantic_engine()
        
        # Index documents
        results = []
        for doc in documents:
            document_id = doc.get('document_id') or doc.get('id')
            content = doc.get('content') or doc.get('text', '')
            metadata = doc.get('metadata', {})
            
            if not document_id or not content:
                results.append({
                    'document_id': document_id,
                    'success': False,
                    'error': 'Missing document_id or content'
                })
                continue
            
            result = engine.index_document(document_id, content, metadata)
            results.append({
                'document_id': result.document_id,
                'success': result.success,
                'indexing_time': result.indexing_time,
                'embedding_dimension': result.embedding_dimension,
                'error': result.error
            })
        
        successful_count = sum(1 for r in results if r['success'])
        
        return {
            "success": True,
            "total_documents": len(documents),
            "successful_indexings": successful_count,
            "failed_indexings": len(documents) - successful_count,
            "results": results,
            "backend": backend,
            "timestamp": datetime.now(timezone.utc).isoformat()
        }
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Batch indexing failed: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Batch indexing failed: {str(e)}")

@router.get("/search")
async def search_documents(
    query: str = Query(..., description="Search query"),
    limit: int = Query(10, description="Maximum number of results"),
    threshold: float = Query(0.0, description="Minimum similarity threshold"),
    backend: Optional[str] = Query("sqlite", description="Vector store backend"),
    filters: Optional[str] = Query(None, description="JSON metadata filters"),
    db: Session = Depends(get_db)
):
    """
    Perform semantic search on indexed documents
    
    Args:
        query: Search query
        limit: Maximum number of results
        threshold: Minimum similarity threshold
        backend: Vector store backend to use
        filters: JSON metadata filters
        
    Returns:
        Search results
    """
    try:
        if not query.strip():
            raise HTTPException(status_code=400, detail="Query cannot be empty")
        
        # Parse filters
        metadata_filters = None
        if filters:
            try:
                import json
                metadata_filters = json.loads(filters)
            except json.JSONDecodeError:
                raise HTTPException(status_code=400, detail="Invalid JSON in filters")
        
        # Get appropriate engine
        if backend != "sqlite":
            engine = SemanticSearchEngine(backend=backend)
        else:
            engine = get_semantic_engine()
        
        # Perform search
        search_results = engine.search(query, limit, threshold, metadata_filters)
        
        # Convert results to dict
        results = []
        for result in search_results:
            results.append({
                'document_id': result.document_id,
                'content': result.content,
                'similarity_score': result.similarity_score,
                'metadata': result.metadata,
                'highlights': result.highlights,
                'relevance_explanation': result.relevance_explanation
            })
        
        return {
            "success": True,
            "query": query,
            "total_results": len(results),
            "results": results,
            "backend": backend,
            "threshold": threshold,
            "timestamp": datetime.now(timezone.utc).isoformat()
        }
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Semantic search failed: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Search failed: {str(e)}")

@router.delete("/index/{document_id}")
async def delete_document(
    document_id: str,
    backend: Optional[str] = Query("sqlite", description="Vector store backend"),
    db: Session = Depends(get_db)
):
    """
    Delete a document from the semantic index
    
    Args:
        document_id: Document ID to delete
        backend: Vector store backend to use
        
    Returns:
        Deletion result
    """
    try:
        # Get appropriate engine
        if backend != "sqlite":
            engine = SemanticSearchEngine(backend=backend)
        else:
            engine = get_semantic_engine()
        
        # Delete document
        success = engine.delete_document(document_id)
        
        return {
            "success": success,
            "document_id": document_id,
            "backend": backend,
            "timestamp": datetime.now(timezone.utc).isoformat()
        }
        
    except Exception as e:
        logger.error(f"Document deletion failed: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Deletion failed: {str(e)}")

@router.get("/stats")
async def get_search_stats(
    backend: Optional[str] = Query("sqlite", description="Vector store backend"),
    db: Session = Depends(get_db)
):
    """
    Get statistics about the semantic search engine
    
    Args:
        backend: Vector store backend to query
        
    Returns:
        Search engine statistics
    """
    try:
        # Get appropriate engine
        if backend != "sqlite":
            engine = SemanticSearchEngine(backend=backend)
        else:
            engine = get_semantic_engine()
        
        # Get stats
        stats = engine.get_stats()
        
        return {
            "success": True,
            "backend": backend,
            "stats": stats,
            "timestamp": datetime.now(timezone.utc).isoformat()
        }
        
    except Exception as e:
        logger.error(f"Failed to get stats: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Failed to get stats: {str(e)}")

@router.post("/rebuild")
async def rebuild_index(
    backend: Optional[str] = Query("sqlite", description="Vector store backend"),
    db: Session = Depends(get_db)
):
    """
    Rebuild the semantic search index
    
    Args:
        backend: Vector store backend to rebuild
        
    Returns:
        Rebuild result
    """
    try:
        # Get appropriate engine
        if backend != "sqlite":
            engine = SemanticSearchEngine(backend=backend)
        else:
            engine = get_semantic_engine()
        
        # Rebuild index
        success = engine.rebuild_index()
        
        return {
            "success": success,
            "backend": backend,
            "timestamp": datetime.now(timezone.utc).isoformat()
        }
        
    except Exception as e:
        logger.error(f"Index rebuild failed: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Rebuild failed: {str(e)}")

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
                "recommended_for": "small_to_medium_datasets"
            },
            "chroma": {
                "name": "ChromaDB",
                "description": "Vector database optimized for AI applications",
                "features": ["advanced_search", "metadata_filtering", "persistence", "scalability"],
                "dependencies": ["chromadb", "sentence-transformers"],
                "recommended_for": "medium_to_large_datasets"
            },
            "faiss": {
                "name": "FAISS",
                "description": "Facebook AI Similarity Search for high-performance vector search",
                "features": ["high_performance_search", "memory_efficient", "scalability"],
                "dependencies": ["faiss-cpu", "sentence-transformers"],
                "recommended_for": "large_datasets",
                "limitations": ["no_individual_deletion", "requires_rebuild_for_deletions"]
            }
        }
        
        # Check availability
        availability = {}
        for backend_name, backend_info in backends.items():
            try:
                if backend_name == "sqlite":
                    from app.services.ai_service import AIService
                    VectorStore = AIService
                    availability[backend_name] = True
                elif backend_name == "chroma":
                    import chromadb
                    availability[backend_name] = True
                elif backend_name == "faiss":
                    import faiss
                    availability[backend_name] = True
                else:
                    availability[backend_name] = False
            except ImportError:
                availability[backend_name] = False
        
        return {
            "success": True,
            "backends": backends,
            "availability": availability,
            "timestamp": datetime.now(timezone.utc).isoformat()
        }
        
    except Exception as e:
        logger.error(f"Failed to get backends: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Failed to get backends: {str(e)}")

@router.post("/switch-backend")
async def switch_backend(
    backend: str = Body(..., description="New backend to switch to"),
    config: Optional[Dict[str, Any]] = Body(None, description="Backend configuration"),
    db: Session = Depends(get_db)
):
    """
    Switch to a different vector store backend
    
    Args:
        backend: New backend to use
        config: Backend configuration
        
    Returns:
        Switch result
    """
    try:
        global semantic_engine
        
        # Validate backend
        valid_backends = ["sqlite", "chroma", "faiss"]
        if backend not in valid_backends:
            raise HTTPException(status_code=400, detail=f"Invalid backend. Must be one of: {valid_backends}")
        
        # Initialize new engine
        semantic_engine = SemanticSearchEngine(backend, config)
        
        return {
            "success": True,
            "backend": backend,
            "config": config,
            "timestamp": datetime.now(timezone.utc).isoformat()
        }
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Backend switch failed: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Backend switch failed: {str(e)}")