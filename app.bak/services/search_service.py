from typing import List, Dict, Any, Optional
from dataclasses import dataclass


@dataclass
class EvidenceSearchIndex:
    """Lightweight evidence search shim used by routers and tests."""

    def search_evidence(self, query: str, limit: int = 20, filters: Optional[Dict[str, Any]] = None) -> List[Dict[str, Any]]:
        # Simple placeholder: return no results
        return []

    def get_evidence_stats(self) -> Dict[str, Any]:
        return {
            'total_indexed': 0,
            'last_indexed_at': None
        }


evidence_search_index = EvidenceSearchIndex()
