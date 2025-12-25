
from typing import Dict, Any, Optional, List
from pydantic import BaseModel
from pathlib import Path

class ForensicFlags(BaseModel):
    is_tampered: bool = False
    indicators: List[str] = []
    risk_score: float = 0.0

class DocumentMetadata(BaseModel):
    title: Optional[str] = None
    author: Optional[str] = None
    created_at: Optional[str] = None
    modified_at: Optional[str] = None
    software: Optional[str] = None
    content_hash: Optional[str] = None
    file_size_bytes: int = 0
    mime_type: str = "application/octet-stream"
    forensic: Optional[ForensicFlags] = None
    raw_metadata: Dict[str, Any] = {}

class MetadataExtractionService:
    """Mock Metadata Extraction Service"""
    
    def extract_metadata(self, file_path: Path) -> DocumentMetadata:
        return DocumentMetadata(
            title="Mock Title",
            author="Mock Author",
            mime_type="application/pdf",
            raw_metadata={"mock_key": "mock_value"}
        )

    def detect_tampering(self, metadata: DocumentMetadata) -> ForensicFlags:
        return ForensicFlags(
            is_tampered=False, 
            indicators=["Mock analysis - clean"], 
            risk_score=0.0
        )

metadata_service = MetadataExtractionService()
