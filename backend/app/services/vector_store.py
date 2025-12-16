"""Simple vector store shim: provides a local in-memory vector store with
TF-IDF fallback for environments without a production vector DB.
"""
from typing import List, Tuple
from sklearn.feature_extraction.text import TfidfVectorizer
import numpy as np


class VectorStore:
    def __init__(self):
        self.documents: List[str] = []
        self.ids: List[str] = []
        self.vectorizer = TfidfVectorizer()
        self._matrix = None

    def index(self, doc_id: str, text: str):
        self.ids.append(doc_id)
        self.documents.append(text)
        self._matrix = self.vectorizer.fit_transform(self.documents)

    def query(self, text: str, top_k: int = 5) -> List[Tuple[str, float]]:
        if not self._matrix or len(self.documents) == 0:
            return []

        q_vec = self.vectorizer.transform([text])
        sims = (self._matrix @ q_vec.T).toarray().ravel()
        idxs = np.argsort(-sims)[:top_k]
        return [(self.ids[i], float(sims[i])) for i in idxs if sims[i] > 0]
