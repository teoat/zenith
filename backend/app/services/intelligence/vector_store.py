"""Vector store with ChromaDB support and TF-IDF fallback.
Provides semantic search capabilities using production vector DB or local fallback.
"""

import logging
import os
from typing import Any

import numpy as np
from sklearn.feature_extraction.text import TfidfVectorizer

logger = logging.getLogger(__name__)


class VectorStore:
    """
    Vector store with ChromaDB support and TF-IDF fallback.
    
    When CHROMA_DB_URL is configured, uses ChromaDB for production-grade
    semantic search. Falls back to TF-IDF for local development.
    """

    def __init__(self):
        self.documents: list[str] = []
        self.ids: list[str] = []
        self.vectorizer = TfidfVectorizer()
        self._matrix = None
        self._chroma_client = None
        self._collection = None
        self._use_chroma = False

        # Try to initialize ChromaDB
        chroma_url = os.getenv("CHROMA_DB_URL")
        if chroma_url:
            self._init_chromadb(chroma_url)

    def _init_chromadb(self, url: str) -> bool:
        """Initialize ChromaDB client."""
        try:
            import chromadb
            self._chroma_client = chromadb.HttpClient(host=url)
            # Try to get or create collection
            try:
                self._collection = self._chroma_client.get_collection("zenith_documents")
            except Exception:
                self._collection = self._chroma_client.create_collection("zenith_documents")
            self._use_chroma = True
            logger.info(f"ChromaDB initialized at {url}")
            return True
        except Exception as e:
            logger.warning(f"ChromaDB not available, using TF-IDF fallback: {e}")
            self._use_chroma = False
            return False

    def index(self, doc_id: str, text: str, metadata: dict[str, Any] | None = None):
        """Index a document for semantic search."""
        if self._use_chroma and self._collection:
            try:
                self._collection.add(
                    documents=[text],
                    ids=[doc_id],
                    metadatas=[metadata or {}]
                )
                return
            except Exception as e:
                logger.error(f"ChromaDB indexing failed: {e}")
                self._use_chroma = False

        # Fallback to TF-IDF
        self.ids.append(doc_id)
        self.documents.append(text)
        self._matrix = self.vectorizer.fit_transform(self.documents)

    def query(self, text: str, top_k: int = 5) -> list[tuple[str, float]]:
        """Query for similar documents."""
        if self._use_chroma and self._collection:
            try:
                results = self._collection.query(
                    query_texts=[text],
                    n_results=top_k
                )
                if results and results.get("ids"):
                    return list(zip(
                        results["ids"][0],
                        [float(s) for s in results.get("distances", [0] * len(results["ids"][0]))]
                    ))
            except Exception as e:
                logger.error(f"ChromaDB query failed: {e}")

        # Fallback to TF-IDF
        if not self._matrix or len(self.documents) == 0:
            return []

        q_vec = self.vectorizer.transform([text])
        sims = (self._matrix @ q_vec.T).toarray().ravel()
        idxs = np.argsort(-sims)[:top_k]
        return [(self.ids[i], float(sims[i])) for i in idxs if sims[i] > 0]

    def delete(self, doc_id: str) -> bool:
        """Delete a document from the index."""
        if self._use_chroma and self._collection:
            try:
                self._collection.delete(ids=[doc_id])
                return True
            except Exception as e:
                logger.error(f"ChromaDB delete failed: {e}")
                return False

        # TF-IDF fallback
        if doc_id in self.ids:
            idx = self.ids.index(doc_id)
            self.ids.pop(idx)
            self.documents.pop(idx)
            if self._matrix is not None and len(self.documents) > 0:
                self._matrix = self.vectorizer.fit_transform(self.documents)
            else:
                self._matrix = None
            return True
        return False

    def get_stats(self) -> dict[str, Any]:
        """Get vector store statistics."""
        return {
            "total_documents": len(self.ids),
            "using_chromadb": self._use_chroma,
            "matrix_shape": self._matrix.shape if self._matrix is not None else None,
        }
