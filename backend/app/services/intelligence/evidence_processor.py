"""
Multi-Modal Evidence Processing System
DEPRECATED: Use app.services.intelligence.evidence_service instead. This file contains legacy implementations.
Task 4.5 from Orchestration Plan

Handles extraction and analysis of evidence from multiple formats:
- PDF text extraction
- OCR for images (receipts, screenshots)
- Image forensics (metadata, manipulation detection)
- Search indexing for extracted content
"""

import hashlib
import io
import os
from dataclasses import dataclass
from datetime import datetime
from pathlib import Path
from typing import Any, Dict, List, Optional, Tuple

import PyPDF2
import pytesseract
from PIL import Image

try:
    from pdf2image import convert_from_bytes

    PDF_IMAGE_AVAILABLE = True
except ImportError:
    PDF_IMAGE_AVAILABLE = False


@dataclass
class ExtractedEvidence:
    """Extracted evidence from a file"""

    file_id: str
    filename: str
    file_type: str
    file_size: int
    extracted_text: str
    metadata: Dict[str, Any]
    ocr_confidence: float
    image_analysis: Optional[Dict[str, Any]]
    hash_sha256: str
    processed_at: datetime
    searchable_content: str


class MultiModalProcessor:
    """
    Multi-modal evidence processing system

    Capabilities:
    - PDF text extraction
    - OCR for images (Tesseract)
    - Image metadata extraction
    - Basic image forensics
    - Search indexing
    """

    SUPPORTED_IMAGE_FORMATS = {".jpg", ".jpeg", ".png", ".tiff", ".bmp", ".gif"}
    SUPPORTED_DOCUMENT_FORMATS = {".pdf", ".txt"}
    MAX_FILE_SIZE = 50 * 1024 * 1024  # 50MB

    def __init__(self, tesseract_path: Optional[str] = None):
        """
        Initialize processor

        Args:
            tesseract_path: Optional path to tesseract executable
        """
        if tesseract_path:
            pytesseract.pytesseract.tesseract_cmd = tesseract_path

        self.processed_files: List[ExtractedEvidence] = []

    def process_file(
        self, file_path: str, file_id: Optional[str] = None
    ) -> ExtractedEvidence:
        """
        Process a file and extract all available evidence

        Args:
            file_path: Path to file to process
            file_id: Optional file ID (generated if not provided)

        Returns:
            Extracted evidence object
        """
        file_path = Path(file_path)

        if not file_path.exists():
            raise FileNotFoundError(f"File not found: {file_path}")

        # Validate file size
        file_size = file_path.stat().st_size
        if file_size > self.MAX_FILE_SIZE:
            raise ValueError(
                f"File too large: {file_size} bytes (max {self.MAX_FILE_SIZE})"
            )

        # Read file
        with open(file_path, "rb") as f:
            file_bytes = f.read()

        # Calculate hash
        file_hash = hashlib.sha256(file_bytes).hexdigest()

        # Determine file type and process
        extension = file_path.suffix.lower()

        if extension in self.SUPPORTED_IMAGE_FORMATS:
            evidence = self._process_image(
                file_bytes, file_path.name, file_id or file_hash
            )
        elif extension == ".pdf":
            evidence = self._process_pdf(
                file_bytes, file_path.name, file_id or file_hash
            )
        elif extension == ".txt":
            evidence = self._process_text(
                file_bytes, file_path.name, file_id or file_hash
            )
        else:
            raise ValueError(f"Unsupported file format: {extension}")

        evidence.hash_sha256 = file_hash
        evidence.file_size = file_size

        self.processed_files.append(evidence)
        return evidence

    def _process_image(
        self, image_bytes: bytes, filename: str, file_id: str
    ) -> ExtractedEvidence:
        """Extract text and metadata from image using OCR"""

        # Open image
        image = Image.open(io.BytesIO(image_bytes))

        # Extract EXIF metadata
        metadata = self._extract_image_metadata(image)

        # Perform OCR
        ocr_text = pytesseract.image_to_string(image, config="--psm 6")
        ocr_data = pytesseract.image_to_data(image, output_type=pytesseract.Output.DICT)

        # Calculate average confidence
        confidences = [int(conf) for conf in ocr_data["conf"] if conf != "-1"]
        avg_confidence = sum(confidences) / len(confidences) if confidences else 0.0

        # Image analysis
        image_analysis = {
            "dimensions": {"width": image.width, "height": image.height},
            "format": image.format,
            "mode": image.mode,
            "has_transparency": image.mode in ("RGBA", "LA", "P"),
        }

        # Basic manipulation detection
        image_analysis["forensics"] = self._analyze_image_forensics(image, metadata)

        return ExtractedEvidence(
            file_id=file_id,
            filename=filename,
            file_type="image",
            file_size=0,  # Set by caller
            extracted_text=ocr_text.strip(),
            metadata=metadata,
            ocr_confidence=avg_confidence / 100.0,
            image_analysis=image_analysis,
            hash_sha256="",  # Set by caller
            processed_at=datetime.now(),
            searchable_content=self._create_searchable_content(ocr_text, metadata),
        )

    def _process_pdf(
        self, pdf_bytes: bytes, filename: str, file_id: str
    ) -> ExtractedEvidence:
        """Extract text from PDF"""

        pdf_reader = PyPDF2.PdfReader(io.BytesIO(pdf_bytes))

        # Extract metadata
        metadata = {}
        if pdf_reader.metadata:
            metadata = {
                "author": pdf_reader.metadata.get("/Author", ""),
                "creator": pdf_reader.metadata.get("/Creator", ""),
                "producer": pdf_reader.metadata.get("/Producer", ""),
                "subject": pdf_reader.metadata.get("/Subject", ""),
                "title": pdf_reader.metadata.get("/Title", ""),
                "creation_date": pdf_reader.metadata.get("/CreationDate", ""),
                "modification_date": pdf_reader.metadata.get("/ModDate", ""),
            }

        metadata["page_count"] = len(pdf_reader.pages)

        # Extract text from all pages
        text_content = []
        for page_num, page in enumerate(pdf_reader.pages, 1):
            page_text = page.extract_text()
            if page_text.strip():
                text_content.append(f"[Page {page_num}]\n{page_text}")

        full_text = "\n\n".join(text_content)

        # If no text extracted, try OCR on PDF images (if pdf2image available)
        ocr_confidence = 1.0  # Assume high confidence for direct text extraction
        if not full_text.strip() and PDF_IMAGE_AVAILABLE:
            try:
                images = convert_from_bytes(pdf_bytes, dpi=200)
                ocr_texts = []
                confidences = []

                for img_num, img in enumerate(images, 1):
                    ocr_text = pytesseract.image_to_string(img)
                    ocr_data = pytesseract.image_to_data(
                        img, output_type=pytesseract.Output.DICT
                    )

                    conf_values = [int(c) for c in ocr_data["conf"] if c != "-1"]
                    avg_conf = sum(conf_values) / len(conf_values) if conf_values else 0

                    ocr_texts.append(f"[Page {img_num} - OCR]\n{ocr_text}")
                    confidences.append(avg_conf)

                full_text = "\n\n".join(ocr_texts)
                ocr_confidence = (
                    sum(confidences) / len(confidences) / 100.0 if confidences else 0.0
                )
                metadata["ocr_performed"] = True
            except Exception as e:
                metadata["ocr_error"] = str(e)

        return ExtractedEvidence(
            file_id=file_id,
            filename=filename,
            file_type="pdf",
            file_size=0,
            extracted_text=full_text.strip(),
            metadata=metadata,
            ocr_confidence=ocr_confidence,
            image_analysis=None,
            hash_sha256="",
            processed_at=datetime.now(),
            searchable_content=self._create_searchable_content(full_text, metadata),
        )

    def _process_text(
        self, text_bytes: bytes, filename: str, file_id: str
    ) -> ExtractedEvidence:
        """Process plain text file"""

        # Try common encodings
        text_content = ""
        encoding_used = ""

        for encoding in ["utf-8", "latin-1", "ascii", "utf-16"]:
            try:
                text_content = text_bytes.decode(encoding)
                encoding_used = encoding
                break
            except UnicodeDecodeError:
                continue

        if not text_content:
            raise ValueError("Unable to decode text file with common encodings")

        metadata = {
            "encoding": encoding_used,
            "line_count": len(text_content.split("\n")),
            "char_count": len(text_content),
        }

        return ExtractedEvidence(
            file_id=file_id,
            filename=filename,
            file_type="text",
            file_size=0,
            extracted_text=text_content,
            metadata=metadata,
            ocr_confidence=1.0,
            image_analysis=None,
            hash_sha256="",
            processed_at=datetime.now(),
            searchable_content=self._create_searchable_content(text_content, metadata),
        )

    def _extract_image_metadata(self, image: Image.Image) -> Dict[str, Any]:
        """Extract EXIF and other metadata from image"""
        metadata = {}

        # Get EXIF data
        exif_data = image.getexif()
        if exif_data:
            from PIL.ExifTags import TAGS

            for tag_id, value in exif_data.items():
                tag = TAGS.get(tag_id, tag_id)
                metadata[str(tag)] = str(value)

        # Basic info
        metadata.update(
            {
                "format": image.format,
                "mode": image.mode,
                "size": f"{image.width}x{image.height}",
            }
        )

        return metadata

    def _analyze_image_forensics(
        self, image: Image.Image, metadata: Dict
    ) -> Dict[str, Any]:
        """
        Basic image forensics analysis

        Checks for:
        - Missing/suspicious EXIF data
        - Image manipulation indicators
        - Quality anomalies
        """
        forensics = {"has_exif": bool(metadata), "suspicious_factors": []}

        # Check for missing camera info (could indicate editing)
        if not any(key in metadata for key in ["Make", "Model", "DateTime"]):
            forensics["suspicious_factors"].append("missing_camera_metadata")

        # Check for inconsistent software tags
        if "Software" in metadata:
            editing_software = ["photoshop", "gimp", "paint", "illustrator"]
            if any(sw in metadata["Software"].lower() for sw in editing_software):
                forensics["suspicious_factors"].append("editing_software_detected")

        # Check image dimensions against EXIF
        if "ExifImageWidth" in metadata and "ExifImageHeight" in metadata:
            try:
                exif_w = int(metadata["ExifImageWidth"])
                exif_h = int(metadata["ExifImageHeight"])
                if exif_w != image.width or exif_h != image.height:
                    forensics["suspicious_factors"].append("dimension_mismatch")
            except (ValueError, KeyError):
                pass

        forensics["risk_level"] = (
            "high"
            if len(forensics["suspicious_factors"]) >= 2
            else "medium" if forensics["suspicious_factors"] else "low"
        )

        return forensics

    def _create_searchable_content(self, text: str, metadata: Dict) -> str:
        """Create searchable index from text and metadata"""

        # Combine text and important metadata
        searchable_parts = [text]

        # Add metadata values
        searchable_metadata = ["author", "title", "subject", "creator", "Make", "Model"]
        for key in searchable_metadata:
            if key in metadata and metadata[key]:
                searchable_parts.append(str(metadata[key]))

        return " ".join(searchable_parts).lower()

    def search(self, query: str) -> List[ExtractedEvidence]:
        """
        Search processed files for query term

        Args:
            query: Search query

        Returns:
            List of matching evidence items
        """
        query = query.lower()
        results = []

        for evidence in self.processed_files:
            if query in evidence.searchable_content:
                results.append(evidence)

        return results

    def get_statistics(self) -> Dict[str, Any]:
        """Get processing statistics"""
        return {
            "total_files": len(self.processed_files),
            "by_type": {
                "images": len(
                    [e for e in self.processed_files if e.file_type == "image"]
                ),
                "pdfs": len([e for e in self.processed_files if e.file_type == "pdf"]),
                "text": len([e for e in self.processed_files if e.file_type == "text"]),
            },
            "total_extracted_chars": sum(
                len(e.extracted_text) for e in self.processed_files
            ),
            "avg_ocr_confidence": (
                sum(e.ocr_confidence for e in self.processed_files)
                / len(self.processed_files)
                if self.processed_files
                else 0
            ),
            "suspicious_images": len(
                [
                    e
                    for e in self.processed_files
                    if e.image_analysis
                    and e.image_analysis.get("forensics", {}).get("risk_level")
                    == "high"
                ]
            ),
        }


# Example usage
if __name__ == "__main__":
    processor = MultiModalProcessor()

    print("Multi-Modal Evidence Processor")
    print("=" * 60)
    print("\nSupported formats:")
    print(f"  Images: {', '.join(processor.SUPPORTED_IMAGE_FORMATS)}")
    print(f"  Documents: {', '.join(processor.SUPPORTED_DOCUMENT_FORMATS)}")
    print(f"  Max file size: {processor.MAX_FILE_SIZE / 1024 / 1024:.0f}MB")
    print("\nFeatures:")
    print("  ✓ PDF text extraction")
    print("  ✓ OCR for images (requires Tesseract)")
    print("  ✓ EXIF metadata extraction")
    print("  ✓ Basic image forensics")
    print("  ✓ Full-text search indexing")
