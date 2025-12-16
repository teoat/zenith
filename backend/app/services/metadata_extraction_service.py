"""
Document Metadata Extraction Service

EXIF-like metadata extraction for fraud investigation documents.
Supports PDF, images (EXIF), and Office documents.
"""

import hashlib
import mimetypes
from datetime import datetime
from pathlib import Path
from typing import Any, Dict, List, Optional

from pydantic import BaseModel


class DocumentHash(BaseModel):
    """File hash for chain of custody."""

    md5: str
    sha256: str


class CreationContext(BaseModel):
    """Creation metadata similar to EXIF."""

    date: Optional[str] = None
    timezone: Optional[str] = None
    software: Optional[str] = None
    author: Optional[str] = None
    device: Optional[str] = None


class ModificationEvent(BaseModel):
    """Single modification event."""

    date: str
    action: str
    details: Optional[str] = None


class ModificationHistory(BaseModel):
    """Document modification history."""

    last_date: Optional[str] = None
    count: int = 0
    history: List[ModificationEvent] = []


class GeoLocation(BaseModel):
    """Geographic location if available."""

    lat: Optional[float] = None
    lng: Optional[float] = None
    accuracy: Optional[float] = None
    source: Optional[str] = None  # "GPS" | "IP" | "manual"


class PrintMetadata(BaseModel):
    """Print/scan metadata."""

    printer_name: Optional[str] = None
    print_date: Optional[str] = None
    copies: Optional[int] = None


class PDFMetadata(BaseModel):
    """PDF-specific metadata."""

    producer: Optional[str] = None
    version: Optional[str] = None
    pages: Optional[int] = None
    encrypted: bool = False
    permissions: List[str] = []


class CameraMetadata(BaseModel):
    """Camera EXIF data."""

    make: Optional[str] = None
    model: Optional[str] = None
    exposure: Optional[str] = None
    iso: Optional[int] = None


class ImageMetadata(BaseModel):
    """Image-specific EXIF metadata."""

    width: Optional[int] = None
    height: Optional[int] = None
    color_space: Optional[str] = None
    dpi: Optional[int] = None
    camera: Optional[CameraMetadata] = None


class ForensicFlags(BaseModel):
    """Forensic analysis flags."""

    tamper_likelihood: float = 0.0  # 0-100%
    anomalies: List[str] = []
    signature_valid: Optional[bool] = None
    ocr_confidence: Optional[float] = None


class DocumentMetadata(BaseModel):
    """Complete document metadata schema."""

    id: str
    filename: str
    filetype: str
    size: int
    hash: DocumentHash
    created: CreationContext
    modified: ModificationHistory
    location: Optional[GeoLocation] = None
    print_info: Optional[PrintMetadata] = None
    pdf: Optional[PDFMetadata] = None
    image: Optional[ImageMetadata] = None
    forensic: ForensicFlags


class MetadataExtractionService:
    """
    Service for extracting EXIF-like metadata from documents.
    """

    def __init__(self):
        self.supported_types = {
            "application/pdf": self._extract_pdf_metadata,
            "image/jpeg": self._extract_image_metadata,
            "image/png": self._extract_image_metadata,
            "image/tiff": self._extract_image_metadata,
            "application/vnd.openxmlformats-officedocument.wordprocessingml.document": self._extract_docx_metadata,
        }

    def calculate_hash(self, file_path: Path) -> DocumentHash:
        """Calculate MD5 and SHA-256 hashes for chain of custody."""
        md5_hash = hashlib.md5()
        sha256_hash = hashlib.sha256()

        with open(file_path, "rb") as f:
            for chunk in iter(lambda: f.read(4096), b""):
                md5_hash.update(chunk)
                sha256_hash.update(chunk)

        return DocumentHash(md5=md5_hash.hexdigest(), sha256=sha256_hash.hexdigest())

    def extract_metadata(self, file_path: Path) -> DocumentMetadata:
        """
        Extract all available metadata from a document.

        Args:
            file_path: Path to the document file

        Returns:
            DocumentMetadata with all extracted information
        """
        if not file_path.exists():
            raise FileNotFoundError(f"File not found: {file_path}")

        # Basic file info
        stat = file_path.stat()
        mime_type, _ = mimetypes.guess_type(str(file_path))
        file_hash = self.calculate_hash(file_path)

        # Base metadata
        metadata = DocumentMetadata(
            id=file_hash.sha256[:16],
            filename=file_path.name,
            filetype=mime_type or "application/octet-stream",
            size=stat.st_size,
            hash=file_hash,
            created=CreationContext(
                date=datetime.fromtimestamp(stat.st_ctime).isoformat(),
            ),
            modified=ModificationHistory(
                last_date=datetime.fromtimestamp(stat.st_mtime).isoformat(), count=1
            ),
            forensic=ForensicFlags(),
        )

        # Type-specific extraction
        if mime_type in self.supported_types:
            type_metadata = self.supported_types[mime_type](file_path)
            metadata = self._merge_metadata(metadata, type_metadata)

        return metadata

    def _extract_pdf_metadata(self, file_path: Path) -> Dict[str, Any]:
        """Extract PDF-specific metadata."""
        # In production, use PyPDF2 or pdf-lib
        # This is a placeholder implementation
        return {
            "pdf": PDFMetadata(
                producer="Extracted PDF Producer",
                version="1.7",
                pages=1,
                encrypted=False,
                permissions=["print", "copy"],
            )
        }

    def _extract_image_metadata(self, file_path: Path) -> Dict[str, Any]:
        """Extract image EXIF metadata."""
        # In production, use Pillow or exifread
        # This is a placeholder implementation
        return {
            "image": ImageMetadata(
                width=1920,
                height=1080,
                color_space="sRGB",
                dpi=72,
                camera=CameraMetadata(make="Unknown", model="Unknown"),
            )
        }

    def _extract_docx_metadata(self, file_path: Path) -> Dict[str, Any]:
        """Extract DOCX metadata."""
        # In production, use python-docx
        # This is a placeholder implementation
        return {
            "created": CreationContext(
                software="Microsoft Word", author="Document Author"
            )
        }

    def _merge_metadata(
        self, base: DocumentMetadata, additional: Dict[str, Any]
    ) -> DocumentMetadata:
        """Merge additional metadata into base."""
        data = base.model_dump()
        for key, value in additional.items():
            if value is not None:
                if isinstance(value, BaseModel):
                    data[key] = value.model_dump()
                else:
                    data[key] = value
        return DocumentMetadata(**data)

    def compare_documents(
        self, doc_a: DocumentMetadata, doc_b: DocumentMetadata
    ) -> Dict[str, Any]:
        """
        Compare two documents and detect discrepancies.

        Returns dict with:
        - matches: List of matching fields
        - discrepancies: List of different fields with details
        - tamper_indicators: List of potential tampering signs
        """
        discrepancies = []
        tamper_indicators = []

        # Compare hashes
        if doc_a.hash.sha256 != doc_b.hash.sha256:
            discrepancies.append(
                {
                    "field": "content_hash",
                    "doc_a": doc_a.hash.sha256[:16] + "...",
                    "doc_b": doc_b.hash.sha256[:16] + "...",
                    "severity": "high",
                }
            )
            tamper_indicators.append("Content modified between versions")

        # Compare authors
        if doc_a.created.author != doc_b.created.author:
            discrepancies.append(
                {
                    "field": "author",
                    "doc_a": doc_a.created.author,
                    "doc_b": doc_b.created.author,
                    "severity": "medium",
                }
            )
            tamper_indicators.append("Author name changed")

        # Compare software
        if doc_a.created.software != doc_b.created.software:
            discrepancies.append(
                {
                    "field": "software",
                    "doc_a": doc_a.created.software,
                    "doc_b": doc_b.created.software,
                    "severity": "medium",
                }
            )
            tamper_indicators.append('Different software used for "same" document')

        # Check modification timing
        if doc_a.modified.last_date and doc_b.modified.last_date:
            a_date = datetime.fromisoformat(doc_a.modified.last_date)
            b_date = datetime.fromisoformat(doc_b.modified.last_date)
            if (b_date - a_date).days > 1:
                tamper_indicators.append(
                    f"Modified {(b_date - a_date).days} days after original"
                )

        return {
            "hash_match": doc_a.hash.sha256 == doc_b.hash.sha256,
            "discrepancies": discrepancies,
            "tamper_indicators": tamper_indicators,
            "risk_score": len(tamper_indicators) * 25,  # 0-100
        }

    def detect_tampering(self, metadata: DocumentMetadata) -> ForensicFlags:
        """
        Analyze metadata for signs of tampering.

        Returns updated ForensicFlags with analysis results.
        """
        anomalies = []
        tamper_likelihood = 0.0

        # Check for metadata inconsistencies
        if metadata.created.date and metadata.modified.last_date:
            created = datetime.fromisoformat(metadata.created.date)
            modified = datetime.fromisoformat(metadata.modified.last_date)

            if modified < created:
                anomalies.append("modification_before_creation")
                tamper_likelihood += 30

        # Check for suspicious software
        if metadata.created.software:
            suspicious_editors = ["photoshop", "gimp", "acrobat pro"]
            if any(s in metadata.created.software.lower() for s in suspicious_editors):
                anomalies.append("editing_software_detected")
                tamper_likelihood += 15

        # Check for missing expected metadata
        if not metadata.created.author:
            anomalies.append("missing_author")
            tamper_likelihood += 10

        return ForensicFlags(
            tamper_likelihood=min(tamper_likelihood, 100),
            anomalies=anomalies,
            signature_valid=None,  # Requires digital signature check
            ocr_confidence=None,  # Requires OCR analysis
        )


# Create singleton instance
metadata_service = MetadataExtractionService()
