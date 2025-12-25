
import logging
import asyncio
from typing import Dict, Any, Optional, List
from app.services.ai.ai_service import get_ai_service

logger = logging.getLogger(__name__)

class EvidenceSearchIndex:
    """
    Evidence Search Index service that bridges evidence processing and semantic search.
    """
    async def index_evidence(self, file_id: str, file_path: str, processing_dict: Dict[str, Any]):
        """
        Indices evidence content for semantic search.
        """
        try:
            ai_service = await get_ai_service()
            
            # Extract content to index
            content = processing_dict.get("extracted_text") or ""
            if not content and processing_dict.get("metadata"):
                 content = str(processing_dict.get("metadata"))
            
            if not content:
                 logger.warning(f"No content found to index for evidence {file_id}")
                 return False

            # Prepare metadata for indexing
            metadata = {
                "source": "evidence",
                "file_id": file_id,
                "file_path": file_path,
                "file_type": processing_dict.get("file_type"),
                "quality_score": processing_dict.get("quality_score"),
                "sentiment_score": processing_dict.get("sentiment_score"),
                "indexed_at": "auto"
            }
            
            # Add to AI vector store/index
            success = await ai_service.add_document(
                doc_id=file_id,
                content=content,
                metadata=metadata
            )
            
            if success:
                logger.info(f"Successfully indexed evidence {file_id} for semantic search")
            else:
                logger.error(f"Failed to index evidence {file_id} in AI service")
                
            return success
            
        except Exception as e:
            logger.error(f"Error indexing evidence {file_id}: {str(e)}")
            return False

    def index_evidence_sync(self, file_id: str, file_path: str, processing_dict: Dict[str, Any]):
        """Synchronous version for calls from sync contexts"""
        try:
            loop = asyncio.get_event_loop()
            if loop.is_running():
                # If loop is already running, we should use a background task
                asyncio.create_task(self.index_evidence(file_id, file_path, processing_dict))
                return True
            else:
                return loop.run_until_complete(self.index_evidence(file_id, file_path, processing_dict))
        except Exception as e:
            logger.error(f"Sync indexing failed for {file_id}: {e}")
            return False

    async def search_evidence(self, query: str, limit: int = 20, filters: Optional[Dict[str, Any]] = None) -> List[Dict[str, Any]]:
        """Search evidence using AI semantic search"""
        try:
            ai_service = await get_ai_service()
            return await ai_service.semantic_search(query, limit, filters)
        except Exception as e:
            logger.error(f"Search evidence failed: {e}")
            return []

    def get_evidence_stats(self) -> Dict[str, Any]:
        """Get stats about indexed evidence"""
        try:
            # We can't easily await here since it's sync. 
            # But we can access the ai_service global if initialized, or mock.
            # Ideally this should be async or use the global instance directly.
            from app.services.ai.ai_service import ai_service
            return {
                "total_documents": len(ai_service.vector_store),
                "initialized": ai_service.initialized
            }
        except Exception as e:
             logger.error(f"Get stats failed: {e}")
             return {}

evidence_search_index = EvidenceSearchIndex()
search_service = evidence_search_index # Alias for broad usage
