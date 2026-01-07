"""
Local RAG Engine (Robust Implementation)

Provides vector-based retrieval using Scikit-Learn's TfidfVectorizer.
This avoids heavy dependencies like Torch/Transformers while offering
significantly better performance than simple keyword matching.
"""

import logging
from typing import Any

from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.metrics.pairwise import cosine_similarity

logger = logging.getLogger(__name__)


class LocalRAGEngine:
    def __init__(self):
        self.documents: dict[str, str] = {}
        self.doc_ids: list[str] = []
        self.vectorizer = TfidfVectorizer(stop_words="english")
        self.tfidf_matrix = None
        self._is_dirty = False

    def add_document(self, doc_id: str, text: str):
        """Add or update a document in the knowledge base."""
        self.documents[doc_id] = text
        if doc_id not in self.doc_ids:
            self.doc_ids.append(doc_id)
        self._is_dirty = True

    def _update_index(self):
        """Recompute TF-IDF matrix if documents have changed."""
        if not self.documents:
            self.tfidf_matrix = None
            return

        corpus = [self.documents[did] for did in self.doc_ids]
        try:
            self.tfidf_matrix = self.vectorizer.fit_transform(corpus)
            self._is_dirty = False
        except ValueError:
            # Handle empty vocabulary or other edge cases
            self.tfidf_matrix = None

    def retrieve(self, query: str, k: int = 3) -> list[dict[str, Any]]:
        """Retrieve top-k relevant documents for the query."""
        if not self.documents:
            return []

        if self._is_dirty:
            self._update_index()

        if self.tfidf_matrix is None:
            return []

        # Transform query to vector
        query_vec = self.vectorizer.transform([query])

        # Compute cosine similarity
        cosine_similarities = cosine_similarity(query_vec, self.tfidf_matrix).flatten()

        # Get top-k indices
        # If fewer than k docs, return all sorted
        k = min(k, len(self.doc_ids))
        if k == 0:
            return []

        # argsort returns indices of elements from low to high, so we take last k and reverse
        related_docs_indices = cosine_similarities.argsort()[: -k - 1 : -1]

        results = []
        for idx in related_docs_indices:
            score = float(cosine_similarities[idx])
            if score > 0.05:  # Filter out totally irrelevant results
                doc_id = self.doc_ids[idx]
                results.append(
                    {
                        "id": doc_id,
                        "text": self.documents[doc_id],
                        "score": round(score, 4),
                    }
                )

        return results

    def get_stats(self):
        return {
            "total_documents": len(self.doc_ids),
            "vocabulary_size": (len(self.vectorizer.vocabulary_) if hasattr(self.vectorizer, "vocabulary_") else 0),
        }


# Global instance
rag_engine = LocalRAGEngine()
