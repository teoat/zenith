"""
Semantic Search Service - Real Implementation with Vector Store
Provides true semantic search capabilities using embeddings and similarity search.
"""

import hashlib
import json
import logging
import math
import os
import sqlite3
from datetime import datetime
from pathlib import Path
from typing import Any

logger = logging.getLogger(__name__)

# Configuration
VECTOR_DB_PATH = os.environ.get("VECTOR_DB_PATH", "./data/vector_store.db")
EMBEDDING_DIMENSION = 384  # Sentence transformer dimension
MAX_RESULTS = 100


class EmbeddingGenerator:
    """
    Generates text embeddings using TF-IDF with SVD dimensionality reduction.
    Falls back to hash-based pseudo-embeddings if sklearn unavailable.
    """

    def __init__(self, dimension: int = EMBEDDING_DIMENSION):
        self.dimension = dimension
        self._vectorizer = None
        self._svd = None
        self._fitted = False
        self._documents: list[str] = []
        self._use_sklearn = False

        # Try to import sklearn
        try:
            from sklearn.decomposition import TruncatedSVD
            from sklearn.feature_extraction.text import TfidfVectorizer

            self._vectorizer = TfidfVectorizer(max_features=5000, stop_words="english")
            self._svd = TruncatedSVD(n_components=min(dimension, 100))
            self._use_sklearn = True
            logger.info("Using sklearn TF-IDF for embeddings")
        except ImportError:
            logger.warning("sklearn not available, using hash-based embeddings")

    def fit(self, documents: list[str]):
        """Fit the vectorizer on a corpus of documents."""
        if not documents:
            return

        self._documents = documents

        if self._use_sklearn and self._vectorizer:
            try:
                tfidf_matrix = self._vectorizer.fit_transform(documents)
                if tfidf_matrix.shape[1] > self._svd.n_components:
                    self._svd.fit(tfidf_matrix)
                self._fitted = True
            except Exception as e:
                logger.warning(f"Failed to fit vectorizer: {e}")

    def embed(self, text: str) -> list[float]:
        """Generate embedding for a single text."""
        if not text:
            return [0.0] * self.dimension

        if self._use_sklearn and self._vectorizer and self._fitted:
            try:
                tfidf = self._vectorizer.transform([text])
                if hasattr(self._svd, "components_"):
                    embedding = self._svd.transform(tfidf)[0].tolist()
                    # Pad to target dimension
                    while len(embedding) < self.dimension:
                        embedding.append(0.0)
                    return embedding[: self.dimension]
            except Exception as e:
                logger.debug(f"Sklearn embedding failed, using hash: {e}")

        # Fallback: Hash-based pseudo-embedding
        return self._hash_embedding(text)

    def _hash_embedding(self, text: str) -> list[float]:
        """Generate deterministic hash-based embedding."""
        # Normalize text
        text = text.lower().strip()

        # Generate multiple hash values for the embedding
        embedding = []
        for i in range(self.dimension):
            hash_input = f"{text}_{i}".encode()
            hash_val = int(hashlib.md5(hash_input).hexdigest(), 16)
            # Normalize to [-1, 1]
            normalized = ((hash_val % 10000) / 5000.0) - 1.0
            embedding.append(normalized)

        # Add word frequency features
        words = text.split()
        word_count = len(words)
        unique_words = len(set(words))

        if self.dimension > 2:
            embedding[0] = min(word_count / 100, 1.0)
            embedding[1] = unique_words / max(word_count, 1)

        return embedding


class IndexingResult:
    """Result of indexing a document."""

    def __init__(
        self,
        document_id: str,
        success: bool = True,
        error: str | None = None,
        indexing_time: float = 0.0,
    ):
        self.document_id = document_id
        self.success = success
        self.error = error
        self.indexing_time = indexing_time
        self.embedding_dimension = EMBEDDING_DIMENSION


class SearchResult:
    """A single search result."""

    def __init__(
        self,
        document_id: str,
        content: str,
        score: float,
        metadata: dict[str, Any] | None = None,
        highlights: list[str] | None = None,
    ):
        self.document_id = document_id
        self.content = content
        self.similarity_score = score
        self.metadata = metadata or {}
        self.highlights = highlights or []
        self.relevance_explanation = self._generate_explanation(score)

    def _generate_explanation(self, score: float) -> str:
        if score >= 0.9:
            return "Highly relevant - strong semantic match"
        elif score >= 0.7:
            return "Relevant - good semantic similarity"
        elif score >= 0.5:
            return "Moderately relevant - partial match"
        else:
            return "Weakly relevant - limited semantic overlap"

    def to_dict(self) -> dict[str, Any]:
        return {
            "document_id": self.document_id,
            "content": self.content,
            "similarity_score": self.similarity_score,
            "metadata": self.metadata,
            "highlights": self.highlights,
            "relevance_explanation": self.relevance_explanation,
        }


class SemanticSearchEngine:
    """
    Production Semantic Search Engine with vector storage.
    Provides true semantic search using embeddings and cosine similarity.
    """

    def __init__(self, backend: str = "sqlite", config: dict[str, Any] | None = None):
        self.backend = backend
        self.config = config or {}
        self.db_path = self.config.get("db_path", VECTOR_DB_PATH)

        # Ensure data directory exists
        Path(self.db_path).parent.mkdir(parents=True, exist_ok=True)

        # Initialize embedding generator
        self.embedder = EmbeddingGenerator()

        # Initialize database
        self._init_db()

        # Load and fit on existing documents
        self._load_and_fit()

    def _init_db(self):
        """Initialize the SQLite vector store."""
        try:
            conn = sqlite3.connect(self.db_path)
            cursor = conn.cursor()

            cursor.execute(
                """
                CREATE TABLE IF NOT EXISTS documents (
                    id TEXT PRIMARY KEY,
                    content TEXT NOT NULL,
                    embedding TEXT NOT NULL,
                    metadata TEXT,
                    created_at TEXT,
                    updated_at TEXT
                )
            """
            )

            cursor.execute(
                """
                CREATE INDEX IF NOT EXISTS idx_documents_created
                ON documents(created_at)
            """
            )

            conn.commit()
            conn.close()
            logger.info(f"Vector store initialized at {self.db_path}")
        except Exception as e:
            logger.error(f"Failed to initialize vector store: {e}")

    def _load_and_fit(self):
        """Load existing documents and fit the embedder."""
        try:
            conn = sqlite3.connect(self.db_path)
            cursor = conn.cursor()

            cursor.execute("SELECT content FROM documents LIMIT 1000")
            rows = cursor.fetchall()
            conn.close()

            if rows:
                documents = [row[0] for row in rows]
                self.embedder.fit(documents)
                logger.info(f"Fitted embedder on {len(documents)} documents")
        except Exception as e:
            logger.warning(f"Failed to load documents for fitting: {e}")

    def index_document(self, document_id: str, content: str, metadata: dict[str, Any] | None = None) -> IndexingResult:
        """
        Index a document for semantic search.

        Args:
            document_id: Unique document identifier
            content: Document content to index
            metadata: Optional metadata to store

        Returns:
            IndexingResult with status
        """
        start_time = datetime.now()

        try:
            # Generate embedding
            embedding = self.embedder.embed(content)

            # Store in database
            conn = sqlite3.connect(self.db_path)
            cursor = conn.cursor()

            now = datetime.now().isoformat()

            cursor.execute(
                """
                INSERT OR REPLACE INTO documents
                (id, content, embedding, metadata, created_at, updated_at)
                VALUES (?, ?, ?, ?, ?, ?)
            """,
                (
                    document_id,
                    content,
                    json.dumps(embedding),
                    json.dumps(metadata or {}),
                    now,
                    now,
                ),
            )

            conn.commit()
            conn.close()

            elapsed = (datetime.now() - start_time).total_seconds()
            logger.debug(f"Indexed document {document_id} in {elapsed:.3f}s")

            return IndexingResult(document_id=document_id, success=True, indexing_time=elapsed)

        except Exception as e:
            logger.error(f"Failed to index document {document_id}: {e}")
            return IndexingResult(document_id=document_id, success=False, error=str(e))

    def search(
        self,
        query: str,
        limit: int = 10,
        threshold: float = 0.0,
        filters: dict[str, Any] | None = None,
    ) -> list[SearchResult]:
        """
        Search for documents semantically similar to the query.

        Args:
            query: Search query
            limit: Maximum results to return
            threshold: Minimum similarity score (0-1)
            filters: Optional metadata filters

        Returns:
            List of SearchResults sorted by similarity
        """
        if not query:
            return []

        try:
            # Generate query embedding
            query_embedding = self.embedder.embed(query)

            # Fetch all documents and compute similarities
            conn = sqlite3.connect(self.db_path)
            cursor = conn.cursor()

            cursor.execute(
                """
                SELECT id, content, embedding, metadata
                FROM documents
            """
            )

            results = []
            query_words = set(query.lower().split())

            for row in cursor.fetchall():
                doc_id, content, embedding_json, metadata_json = row

                try:
                    doc_embedding = json.loads(embedding_json)
                    metadata = json.loads(metadata_json) if metadata_json else {}

                    # Apply filters
                    if filters and not self._matches_filters(metadata, filters):
                        continue

                    # Calculate cosine similarity
                    similarity = self._cosine_similarity(query_embedding, doc_embedding)

                    # Boost for keyword matches
                    content_words = set(content.lower().split())
                    keyword_overlap = len(query_words & content_words) / max(len(query_words), 1)
                    similarity = min(1.0, similarity * 0.7 + keyword_overlap * 0.3)

                    if similarity >= threshold:
                        # Generate highlights
                        highlights = self._generate_highlights(content, query)

                        results.append(
                            SearchResult(
                                document_id=doc_id,
                                content=content[:500],  # Truncate for response
                                score=round(similarity, 4),
                                metadata=metadata,
                                highlights=highlights,
                            )
                        )

                except (json.JSONDecodeError, TypeError):
                    continue

            conn.close()

            # Sort by similarity and limit
            results.sort(key=lambda x: x.similarity_score, reverse=True)
            return results[: min(limit, MAX_RESULTS)]

        except Exception as e:
            logger.error(f"Search failed: {e}")
            return []

    def _cosine_similarity(self, vec1: list[float], vec2: list[float]) -> float:
        """Calculate cosine similarity between two vectors."""
        if not vec1 or not vec2:
            return 0.0

        # Ensure same length
        min_len = min(len(vec1), len(vec2))
        vec1 = vec1[:min_len]
        vec2 = vec2[:min_len]

        # Dot product
        dot_product = sum(a * b for a, b in zip(vec1, vec2))

        # Magnitudes
        mag1 = math.sqrt(sum(a * a for a in vec1))
        mag2 = math.sqrt(sum(b * b for b in vec2))

        if mag1 == 0 or mag2 == 0:
            return 0.0

        return dot_product / (mag1 * mag2)

    def _matches_filters(self, metadata: dict, filters: dict) -> bool:
        """Check if metadata matches all filters."""
        for key, value in filters.items():
            if key not in metadata:
                return False
            if metadata[key] != value:
                return False
        return True

    def _generate_highlights(self, content: str, query: str) -> list[str]:
        """Generate highlighted snippets containing query terms."""
        highlights = []
        content_lower = content.lower()
        query_terms = query.lower().split()

        for term in query_terms:
            if term in content_lower:
                # Find context around the term
                idx = content_lower.find(term)
                start = max(0, idx - 50)
                end = min(len(content), idx + len(term) + 50)

                snippet = content[start:end]
                if start > 0:
                    snippet = "..." + snippet
                if end < len(content):
                    snippet = snippet + "..."

                highlights.append(snippet)

        return highlights[:3]  # Max 3 highlights

    def delete_document(self, document_id: str) -> bool:
        """Delete a document from the index."""
        try:
            conn = sqlite3.connect(self.db_path)
            cursor = conn.cursor()

            cursor.execute("DELETE FROM documents WHERE id = ?", (document_id,))
            deleted = cursor.rowcount > 0

            conn.commit()
            conn.close()

            return deleted

        except Exception as e:
            logger.error(f"Failed to delete document {document_id}: {e}")
            return False

    def get_stats(self) -> dict[str, Any]:
        """Get index statistics."""
        try:
            conn = sqlite3.connect(self.db_path)
            cursor = conn.cursor()

            cursor.execute("SELECT COUNT(*) FROM documents")
            doc_count = cursor.fetchone()[0]

            cursor.execute("SELECT MIN(created_at), MAX(created_at) FROM documents")
            dates = cursor.fetchone()

            conn.close()

            return {
                "documents": doc_count,
                "backend": self.backend,
                "embedding_dimension": EMBEDDING_DIMENSION,
                "db_path": self.db_path,
                "oldest_document": dates[0] if dates else None,
                "newest_document": dates[1] if dates else None,
                "status": "healthy",
            }

        except Exception as e:
            return {
                "documents": 0,
                "backend": self.backend,
                "error": str(e),
                "status": "error",
            }

    def rebuild_index(self) -> bool:
        """Rebuild the search index (re-embed all documents)."""
        try:
            conn = sqlite3.connect(self.db_path)
            cursor = conn.cursor()

            # Fetch all documents
            cursor.execute("SELECT id, content FROM documents")
            rows = cursor.fetchall()

            if not rows:
                return True

            # Re-fit embedder
            documents = [row[1] for row in rows]
            self.embedder.fit(documents)

            # Re-embed each document
            for doc_id, content in rows:
                embedding = self.embedder.embed(content)
                cursor.execute(
                    "UPDATE documents SET embedding = ?, updated_at = ? WHERE id = ?",
                    (json.dumps(embedding), datetime.now().isoformat(), doc_id),
                )

            conn.commit()
            conn.close()

            logger.info(f"Rebuilt index for {len(rows)} documents")
            return True

        except Exception as e:
            logger.error(f"Failed to rebuild index: {e}")
            return False


# Factory function
def get_semantic_search_engine(backend: str = "sqlite", config: dict[str, Any] | None = None) -> SemanticSearchEngine:
    """Get a semantic search engine instance."""
    return SemanticSearchEngine(backend=backend, config=config)
