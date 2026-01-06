from pathlib import Path
from typing import Any

from pydantic import BaseModel


class ForensicFlags(BaseModel):
    is_tampered: bool = False
    indicators: list[str] = []
    risk_score: float = 0.0


class DocumentMetadata(BaseModel):
    title: str | None = None
    author: str | None = None
    created_at: str | None = None
    modified_at: str | None = None
    software: str | None = None
    content_hash: str | None = None
    file_size_bytes: int = 0
    mime_type: str = "application/octet-stream"
    forensic: ForensicFlags | None = None
    raw_metadata: dict[str, Any] = {}


class MetadataExtractionService:
    """Mock Metadata Extraction Service"""

    def extract_metadata(self, file_path: Path) -> DocumentMetadata:
        return DocumentMetadata(
            title="Mock Title",
            author="Mock Author",
            mime_type="application/pdf",
            raw_metadata={"mock_key": "mock_value"},
        )

    def detect_tampering(self, metadata: DocumentMetadata) -> ForensicFlags:
        return ForensicFlags(
            is_tampered=False, indicators=["Mock analysis - clean"], risk_score=0.0
        )


metadata_service = MetadataExtractionService()
