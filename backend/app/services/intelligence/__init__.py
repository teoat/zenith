# Intelligence Services Package
# Phase 4: Advanced Intelligence Components

# Import from the active evidence_service, not the deprecated evidence_processor
from .evidence_service import EvidenceProcessor, evidence_processor, ProcessingResult

__all__ = [
    "EvidenceProcessor",
    "evidence_processor",
    "ProcessingResult",
]
