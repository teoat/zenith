"""
Metadata Extraction API Endpoints

Exposes EXIF-like metadata extraction for documents.
"""

from pathlib import Path

from fastapi import APIRouter, File, HTTPException, UploadFile
from pydantic import BaseModel

from app.services.metadata_extraction_service import (
    DocumentMetadata,
    ForensicFlags,
    metadata_service,
)

router = APIRouter(prefix="/metadata", tags=["metadata"])


class ComparisonRequest(BaseModel):
    """Request to compare two document metadata sets."""

    doc_a_id: str
    doc_b_id: str


class ComparisonResponse(BaseModel):
    """Document comparison result."""

    hash_match: bool
    discrepancies: list
    tamper_indicators: list
    risk_score: float


@router.post("/extract", response_model=DocumentMetadata)
async def extract_metadata(file: UploadFile = File(...)):
    """
    Extract EXIF-like metadata from an uploaded document.

    Supports:
    - PDF files
    - Images (JPEG, PNG, TIFF)
    - Office documents (DOCX)

    Returns complete metadata including forensic flags.
    """
    # Save uploaded file temporarily
    temp_path = Path(f"/tmp/{file.filename}")
    try:
        contents = await file.read()
        with open(temp_path, "wb") as f:
            f.write(contents)

        # Extract metadata
        metadata = metadata_service.extract_metadata(temp_path)

        # Run forensic analysis
        forensic_flags = metadata_service.detect_tampering(metadata)
        metadata.forensic = forensic_flags

        return metadata

    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
    finally:
        # Cleanup temp file
        if temp_path.exists():
            temp_path.unlink()


@router.get("/hash/{file_id}")
async def get_file_hash(file_id: str):
    """
    Get hash values for a previously processed file.

    Used for chain of custody verification.
    """
    # In production, lookup from database
    return {
        "file_id": file_id,
        "md5": "mocked_md5_hash",
        "sha256": "mocked_sha256_hash",
        "verified_at": "2024-12-10T12:00:00Z",
    }


@router.post("/compare", response_model=ComparisonResponse)
async def compare_documents(request: ComparisonRequest):
    """
    Compare two documents and detect discrepancies.

    Returns:
    - hash_match: Whether content is identical
    - discrepancies: List of differing fields
    - tamper_indicators: Signs of potential tampering
    - risk_score: 0-100 risk assessment
    """
    # In production, fetch metadata from database by ID
    # This is a mock response
    return ComparisonResponse(
        hash_match=False,
        discrepancies=[
            {
                "field": "content_hash",
                "doc_a": "a3f9b2...",
                "doc_b": "c7d2e1...",
                "severity": "high",
            },
            {
                "field": "author",
                "doc_a": "John Smith",
                "doc_b": "J. Smith",
                "severity": "medium",
            },
        ],
        tamper_indicators=[
            "Content modified between versions",
            "Author name shortened",
            "Different software used",
        ],
        risk_score=75.0,
    )


@router.post("/forensic-scan", response_model=ForensicFlags)
async def forensic_scan(file: UploadFile = File(...)):
    """
    Perform deep forensic analysis on a document.

    Checks for:
    - Metadata inconsistencies
    - Editing software signatures
    - Modification patterns
    - Missing expected data
    """
    temp_path = Path(f"/tmp/{file.filename}")
    try:
        contents = await file.read()
        with open(temp_path, "wb") as f:
            f.write(contents)

        # Extract and analyze
        metadata = metadata_service.extract_metadata(temp_path)
        forensic_flags = metadata_service.detect_tampering(metadata)

        return forensic_flags

    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
    finally:
        if temp_path.exists():
            temp_path.unlink()


@router.get("/supported-types")
async def get_supported_types():
    """List all supported document types for metadata extraction."""
    return {
        "supported_types": [
            {"mime": "application/pdf", "extensions": [".pdf"]},
            {"mime": "image/jpeg", "extensions": [".jpg", ".jpeg"]},
            {"mime": "image/png", "extensions": [".png"]},
            {"mime": "image/tiff", "extensions": [".tif", ".tiff"]},
            {
                "mime": "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
                "extensions": [".docx"],
            },
        ]
    }
