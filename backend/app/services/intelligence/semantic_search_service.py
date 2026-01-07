# services/semantic_search.py
import json
import logging
import os
from dataclasses import dataclass
from datetime import UTC, datetime
from typing import Any

import numpy as np

try:
    import faiss

    HAS_FAISS = True
except ImportError:
    faiss = None
    HAS_FAISS = False

logger = logging.getLogger(__name__)


@dataclass
class SearchResult:
    """Semantic search result"""

    document_id: str
    content: str
    similarity_score: float
    metadata: dict[str, Any]
    highlights: list[str]
    relevance_explanation: str


@dataclass
class IndexingResult:
    """Document indexing result"""

    document_id: str
    success: bool
    error: str | None = None
    indexing_time: float = 0.0
    embedding_dimension: int = 0


class SemanticSearchEngine:
    """Advanced semantic search with multiple vector store backends"""

    def __init__(self, backend: str = "sqlite", config: dict[str, Any] | None = None):
        self.backend = backend
        self.config = config or {}

        # Initialize the appropriate backend
        if backend == "chroma":
            self._init_chroma_backend()
        elif backend == "faiss":
            self._init_faiss_backend()
        else:
            self._init_sqlite_backend()

        logger.info(f"Initialized semantic search with {backend} backend")

    def _init_sqlite_backend(self):
        """Initialize SQLite vector store backend"""
        try:
            from app.services.ai.ai_service import AIService

            self.vector_store = AIService(self.config.get("db_path", "data/vector_store.db"))
            self.backend_type = "sqlite"
        except ImportError:
            logger.error("SQLite vector store not available")
            raise

    def _init_chroma_backend(self):
        """Initialize ChromaDB backend"""
        try:
            import chromadb
            from chromadb.config import Settings

            # Configure ChromaDB
            persist_directory = self.config.get("persist_directory", "./data/chroma")
            os.makedirs(persist_directory, exist_ok=True)

            self.chroma_client = chromadb.PersistentClient(
                path=persist_directory,
                settings=Settings(anonymized_telemetry=False, allow_reset=True),
            )

            # Get or create collection
            collection_name = self.config.get("collection_name", "fraud_evidence")
            self.collection = self.chroma_client.get_or_create_collection(
                name=collection_name,
                metadata={"description": "Fraud detection evidence collection"},
            )

            self.backend_type = "chroma"
            logger.info("ChromaDB backend initialized")

        except ImportError:
            logger.error("ChromaDB not available - install chromadb")
            raise
        except Exception as e:
            logger.error(f"Failed to initialize ChromaDB: {e}")
            raise

    def _init_faiss_backend(self):
        """Initialize FAISS backend"""
        try:
            import faiss

            self.faiss_index_path = self.config.get("index_path", "./data/faiss_index")
            self.faiss_metadata_path = self.config.get("metadata_path", "./data/faiss_metadata.json")

            os.makedirs(os.path.dirname(self.faiss_index_path), exist_ok=True)

            # Load or create FAISS index
            if os.path.exists(self.faiss_index_path):
                self.faiss_index = faiss.read_index(self.faiss_index_path)
                with open(self.faiss_metadata_path) as f:
                    self.faiss_metadata = json.load(f)
            else:
                # Initialize with dimension 384 (for MiniLM model)
                self.faiss_index = faiss.IndexFlatIP(384)  # Inner product for cosine similarity
                self.faiss_metadata = {"documents": [], "next_id": 0}

            self.backend_type = "faiss"
            logger.info("FAISS backend initialized")

        except ImportError:
            logger.error("FAISS not available - install faiss-cpu")
            raise
        except Exception as e:
            logger.error(f"Failed to initialize FAISS: {e}")
            raise

    def index_document(self, document_id: str, content: str, metadata: dict[str, Any] | None = None) -> IndexingResult:
        """
        Index a document for semantic search

        Args:
            document_id: Unique document identifier
            content: Document content to index
            metadata: Additional metadata

        Returns:
            Indexing result
        """
        start_time = datetime.now(UTC)

        try:
            if self.backend_type == "sqlite":
                success = self.vector_store.add_document(document_id, content, metadata)
                return IndexingResult(
                    document_id=document_id,
                    success=success,
                    indexing_time=(datetime.now(UTC) - start_time).total_seconds(),
                    embedding_dimension=384,
                )

            elif self.backend_type == "chroma":
                return self._index_document_chroma(document_id, content, metadata, start_time)

            elif self.backend_type == "faiss":
                return self._index_document_faiss(document_id, content, metadata, start_time)

        except Exception as e:
            logger.error(f"Failed to index document {document_id}: {e!s}")
            return IndexingResult(
                document_id=document_id,
                success=False,
                error=str(e),
                indexing_time=(datetime.now(UTC) - start_time).total_seconds(),
            )

    def _index_document_chroma(
        self,
        document_id: str,
        content: str,
        metadata: dict[str, Any],
        start_time: datetime,
    ) -> IndexingResult:
        """Index document using ChromaDB"""
        try:
            # Generate embedding
            embedding = self._generate_embedding(content)

            # Prepare document for ChromaDB
            chroma_metadata = metadata or {}
            chroma_metadata["document_id"] = document_id
            chroma_metadata["indexed_at"] = datetime.now(UTC).isoformat()

            # Add to collection
            self.collection.add(
                embeddings=[embedding],
                documents=[content],
                metadatas=[chroma_metadata],
                ids=[document_id],
            )

            return IndexingResult(
                document_id=document_id,
                success=True,
                indexing_time=(datetime.now(UTC) - start_time).total_seconds(),
                embedding_dimension=len(embedding),
            )

        except Exception as e:
            return IndexingResult(
                document_id=document_id,
                success=False,
                error=str(e),
                indexing_time=(datetime.now(UTC) - start_time).total_seconds(),
            )

    def _index_document_faiss(
        self,
        document_id: str,
        content: str,
        metadata: dict[str, Any],
        start_time: datetime,
    ) -> IndexingResult:
        """Index document using FAISS"""
        try:
            # Generate embedding
            embedding = self._generate_embedding(content)
            embedding_np = np.array([embedding], dtype=np.float32)

            # Normalize for cosine similarity
            faiss.normalize_L2(embedding_np)

            # Add to index
            self.faiss_index.add(embedding_np)

            # Store metadata
            doc_metadata = {
                "id": self.faiss_metadata["next_id"],
                "document_id": document_id,
                "content": content,
                "metadata": metadata or {},
                "indexed_at": datetime.now(UTC).isoformat(),
            }
            self.faiss_metadata["documents"].append(doc_metadata)
            self.faiss_metadata["next_id"] += 1

            # Save index and metadata
            faiss.write_index(self.faiss_index, self.faiss_index_path)
            with open(self.faiss_metadata_path, "w") as f:
                json.dump(self.faiss_metadata, f)

            return IndexingResult(
                document_id=document_id,
                success=True,
                indexing_time=(datetime.now(UTC) - start_time).total_seconds(),
                embedding_dimension=len(embedding),
            )

        except Exception as e:
            return IndexingResult(
                document_id=document_id,
                success=False,
                error=str(e),
                indexing_time=(datetime.now(UTC) - start_time).total_seconds(),
            )

    def search(
        self,
        query: str,
        limit: int = 10,
        threshold: float = 0.0,
        filters: dict[str, Any] | None = None,
    ) -> list[SearchResult]:
        """
        Perform semantic search

        Args:
            query: Search query
            limit: Maximum number of results
            threshold: Minimum similarity threshold
            filters: Metadata filters

        Returns:
            List of search results
        """
        try:
            if self.backend_type == "sqlite":
                return self._search_sqlite(query, limit, threshold)

            elif self.backend_type == "chroma":
                return self._search_chroma(query, limit, threshold, filters)

            elif self.backend_type == "faiss":
                return self._search_faiss(query, limit, threshold)

        except Exception as e:
            logger.error(f"Semantic search failed: {e!s}")
            return []

    def _search_sqlite(self, query: str, limit: int, threshold: float) -> list[SearchResult]:
        """Search using SQLite backend"""
        try:
            results = self.vector_store.search_similar_documents(query, limit, threshold)

            search_results = []
            for result in results:
                search_result = SearchResult(
                    document_id=result["document_id"],
                    content=result["content"],
                    similarity_score=result["similarity"],
                    metadata=result.get("metadata", {}),
                    highlights=self._generate_highlights(result["content"], query),
                    relevance_explanation=self._generate_relevance_explanation(result["similarity"]),
                )
                search_results.append(search_result)

            return search_results

        except Exception as e:
            logger.error(f"SQLite search failed: {e!s}")
            return []

    def _search_chroma(
        self,
        query: str,
        limit: int,
        threshold: float,
        filters: dict[str, Any] | None = None,
    ) -> list[SearchResult]:
        """Search using ChromaDB backend"""
        try:
            # Generate query embedding
            query_embedding = self._generate_embedding(query)

            # Prepare where filter if provided
            where_clause = None
            if filters:
                where_clause = filters

            # Search ChromaDB
            chroma_results = self.collection.query(query_embeddings=[query_embedding], n_results=limit, where=where_clause)

            search_results = []
            if chroma_results["ids"] and chroma_results["ids"][0]:
                for i, doc_id in enumerate(chroma_results["ids"][0]):
                    distance = chroma_results["distances"][0][i]
                    similarity = 1 - distance  # Convert distance to similarity

                    if similarity >= threshold:
                        search_result = SearchResult(
                            document_id=doc_id,
                            content=chroma_results["documents"][0][i],
                            similarity_score=similarity,
                            metadata=chroma_results["metadatas"][0][i],
                            highlights=self._generate_highlights(chroma_results["documents"][0][i], query),
                            relevance_explanation=self._generate_relevance_explanation(similarity),
                        )
                        search_results.append(search_result)

            return search_results

        except Exception as e:
            logger.error(f"ChromaDB search failed: {e!s}")
            return []

    def _search_faiss(self, query: str, limit: int, threshold: float) -> list[SearchResult]:
        """Search using FAISS backend"""
        try:
            # Generate query embedding
            query_embedding = self._generate_embedding(query)
            query_np = np.array([query_embedding], dtype=np.float32)

            # Normalize for cosine similarity
            faiss.normalize_L2(query_np)

            # Search FAISS index
            similarities, indices = self.faiss_index.search(query_np, min(limit, self.faiss_index.ntotal))

            search_results = []
            for i, (similarity, idx) in enumerate(zip(similarities[0], indices[0])):
                if similarity >= threshold and idx != -1:  # -1 indicates no result
                    # Get document metadata
                    doc_metadata = self.faiss_metadata["documents"][idx]

                    search_result = SearchResult(
                        document_id=doc_metadata["document_id"],
                        content=doc_metadata["content"],
                        similarity_score=float(similarity),
                        metadata=doc_metadata["metadata"],
                        highlights=self._generate_highlights(doc_metadata["content"], query),
                        relevance_explanation=self._generate_relevance_explanation(float(similarity)),
                    )
                    search_results.append(search_result)

            return search_results

        except Exception as e:
            logger.error(f"FAISS search failed: {e!s}")
            return []

    def _generate_embedding(self, text: str) -> list[float]:
        """Generate embedding for text"""
        try:
            if self.backend_type == "sqlite":
                return self.vector_store.embed_text(text)

            else:
                # Use sentence-transformers for other backends
                from sentence_transformers import SentenceTransformer

                model = SentenceTransformer("all-MiniLM-L6-v2")
                embedding = model.encode(text)
                return embedding.tolist()

        except Exception as e:
            logger.error(f"Embedding generation failed: {e!s}")
            # Return zero embedding as fallback
            return [0.0] * 384

    def _generate_highlights(self, content: str, query: str) -> list[str]:
        """Generate search highlights in content"""
        try:
            # Simple keyword highlighting
            query_words = query.lower().split()
            content_lower = content.lower()

            highlights = []
            for word in query_words:
                if word in content_lower:
                    # Find context around the match
                    start = content_lower.find(word)
                    if start != -1:
                        context_start = max(0, start - 50)
                        context_end = min(len(content), start + len(word) + 50)
                        context = content[context_start:context_end]
                        highlights.append(f"...{context}...")

            return highlights[:3]  # Limit to 3 highlights

        except Exception as e:
            logger.error(f"Highlight generation failed: {e!s}")
            return []

    def _generate_relevance_explanation(self, similarity_score: float) -> str:
        """Generate explanation for relevance score"""
        if similarity_score >= 0.9:
            return "Very high relevance - content closely matches query"
        elif similarity_score >= 0.7:
            return "High relevance - content strongly relates to query"
        elif similarity_score >= 0.5:
            return "Moderate relevance - content partially matches query"
        elif similarity_score >= 0.3:
            return "Low relevance - content loosely relates to query"
        else:
            return "Very low relevance - content has minimal relation to query"

    def delete_document(self, document_id: str) -> bool:
        """Delete a document from the index"""
        try:
            if self.backend_type == "sqlite":
                return self.vector_store.delete_document(document_id)

            elif self.backend_type == "chroma":
                self.collection.delete(ids=[document_id])
                return True

            elif self.backend_type == "faiss":
                # FAISS doesn't support easy deletion, would need rebuilding
                logger.warning("FAISS backend doesn't support individual document deletion")
                return False

        except Exception as e:
            logger.error(f"Failed to delete document {document_id}: {e!s}")
            return False

    def get_stats(self) -> dict[str, Any]:
        """Get statistics about the semantic search engine"""
        try:
            if self.backend_type == "sqlite":
                return self.vector_store.get_stats()

            elif self.backend_type == "chroma":
                collection_stats = self.collection.count()
                return {
                    "backend": "chroma",
                    "total_documents": collection_stats,
                    "collection_name": self.collection.name,
                    "embedding_dimension": 384,
                }

            elif self.backend_type == "faiss":
                return {
                    "backend": "faiss",
                    "total_documents": self.faiss_index.ntotal,
                    "embedding_dimension": self.faiss_index.d,
                    "index_type": type(self.faiss_index).__name__,
                }

        except Exception as e:
            logger.error(f"Failed to get stats: {e!s}")
            return {"backend": self.backend_type, "error": str(e)}

    def rebuild_index(self) -> bool:
        """Rebuild the entire index (useful for FAISS)"""
        try:
            if self.backend_type == "faiss":
                # Rebuild FAISS index from metadata
                logger.info("Rebuilding FAISS index...")

                # Create new index
                import faiss

                new_index = faiss.IndexFlatIP(384)

                # Re-add all documents
                for doc in self.faiss_metadata["documents"]:
                    embedding = self._generate_embedding(doc["content"])
                    embedding_np = np.array([embedding], dtype=np.float32)
                    faiss.normalize_L2(embedding_np)
                    new_index.add(embedding_np)

                # Replace old index
                self.faiss_index = new_index
                faiss.write_index(self.faiss_index, self.faiss_index_path)

                logger.info("FAISS index rebuilt successfully")
                return True

            else:
                logger.info(f"Index rebuild not needed for {self.backend_type} backend")
                return True

        except Exception as e:
            logger.error(f"Index rebuild failed: {e!s}")
            return False
