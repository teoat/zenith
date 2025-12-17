
from typing import List, Dict, Any, Optional

class IndexingResult:
    def __init__(self, document_id, success=True, error=None):
        self.document_id = document_id
        self.success = success
        self.indexing_time = 0.1
        self.embedding_dimension = 384
        self.error = error

class SearchResult:
    def __init__(self, document_id="doc1", content="Mock content", score=0.9):
        self.document_id = document_id
        self.content = content
        self.similarity_score = score
        self.metadata = {}
        self.highlights = []
        self.relevance_explanation = "Matched mock criteria"

class SemanticSearchEngine:
    """Mock Semantic Search Engine"""
    def __init__(self, backend="sqlite", config=None):
        self.backend = backend
        self.config = config or {}

    def index_document(self, document_id, content, metadata=None):
        return IndexingResult(document_id)

    def search(self, query, limit=10, threshold=0.0, filters=None):
        return [SearchResult()]

    def delete_document(self, document_id):
        return True

    def get_stats(self):
        return {"documents": 1, "backend": self.backend}

    def rebuild_index(self):
        return True
