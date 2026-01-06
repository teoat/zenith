# Intelligence Services Package
# Phase 4: Advanced Intelligence Components

# Import from the active evidence_service, not the deprecated evidence_processor
from .evidence_service import EvidenceProcessor, ProcessingResult, evidence_processor

__all__ = [
    "EvidenceProcessor",
    "ProcessingResult",
    "evidence_processor",
]
