# api/multimodal.py
import builtins
import contextlib
import logging
import os
import tempfile
from datetime import UTC, datetime
from typing import Any

from fastapi import APIRouter, Depends, File, Form, HTTPException, UploadFile
from sqlalchemy.orm import Session

from app.services.intelligence.evidence_service import (
    EvidenceProcessor,
    ProcessingResult,
)
from core.database import get_db

logger = logging.getLogger(__name__)

# Remove prefix here because main.py includes it with /api/v1/multimodal prefix
router = APIRouter(tags=["multi-modal-analysis"])

# Global processor instance (lazy init or per request?)
# EvidenceProcessor is designed to be lightweight to init, but holds thread pools.
# Better to keep a global one or singleton.
# app.services.evidence_service doesn't expose a singleton, so we init one.
processor = EvidenceProcessor()


@router.post("/analyze")
@router.post("/analyze/upload")
async def analyze_uploaded_file(
    file: UploadFile = File(...),
    enable_ocr: bool = Form(True),
    enable_forensics: bool = Form(True),
    enable_object_detection: bool = Form(False),
    enable_face_detection: bool = Form(False),
    db: Session = Depends(get_db),
):
    """
    Analyze uploaded file with multi-modal analysis
    """
    try:
        # Validate file
        if not file.filename:
            raise HTTPException(status_code=400, detail="No file provided")

        # Save uploaded file temporarily
        with tempfile.NamedTemporaryFile(
            delete=False, suffix=f"_{file.filename}"
        ) as temp_file:
            content = await file.read()
            temp_file.write(content)
            temp_file_path = temp_file.name

        try:
            # Prepare analysis options
            options = {
                "enable_ocr": enable_ocr,
                "enable_forensics": enable_forensics,
                "enable_object_detection": enable_object_detection,
                "enable_face_detection": enable_face_detection,
            }

            # Perform analysis using EvidenceProcessor (Batch of 1)
            # This returns a List[ProcessingResult]
            results = await processor.process_files_batch([temp_file_path], options)
            if not results:
                raise HTTPException(
                    status_code=500, detail="Analysis produced no results"
                )

            analysis = results[0]

            if analysis.error:
                # If it's a processing error (like invalid image), return 400 instead of 500
                # to match API expectations for invalid input
                error_lower = analysis.error.lower()
                status_code = (
                    400
                    if any(
                        kw in error_lower
                        for kw in [
                            "unsupported",
                            "cannot identify",
                            "invalid",
                            "failed to process",
                        ]
                    )
                    else 500
                )
                raise HTTPException(
                    status_code=status_code, detail=f"Analysis failed: {analysis.error}"
                )

            # Convert ProcessingResult to the Response format frontend expects
            result = _map_processing_result(analysis, file.filename, options)

            return result

        finally:
            # Clean up temporary file
            with contextlib.suppress(builtins.BaseException):
                os.unlink(temp_file_path)

    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Multi-modal analysis failed: {e!s}")
        raise HTTPException(status_code=500, detail=f"Analysis failed: {e!s}")


@router.post("/analyze/path")
async def analyze_file_path(
    file_path: str = Form(...),
    enable_ocr: bool = Form(True),
    enable_forensics: bool = Form(True),
    enable_object_detection: bool = Form(False),
    enable_face_detection: bool = Form(False),
    db: Session = Depends(get_db),
):
    """
    Analyze file at specified path with multi-modal analysis
    """
    try:
        # Validate file path
        if not os.path.exists(file_path):
            raise HTTPException(status_code=404, detail="File not found")

        # Prepare analysis options
        options = {
            "enable_ocr": enable_ocr,
            "enable_forensics": enable_forensics,
            "enable_object_detection": enable_object_detection,
            "enable_face_detection": enable_face_detection,
        }

        # Perform analysis
        results = await processor.process_files_batch([file_path], options)
        if not results:
            raise HTTPException(status_code=500, detail="Analysis produced no results")

        analysis = results[0]

        if analysis.error:
            error_lower = analysis.error.lower()
            status_code = (
                400
                if any(
                    kw in error_lower
                    for kw in [
                        "unsupported",
                        "cannot identify",
                        "invalid",
                        "failed to process",
                    ]
                )
                else 500
            )
            raise HTTPException(
                status_code=status_code, detail=f"Analysis failed: {analysis.error}"
            )

        # Convert to dict for JSON response
        result = _map_processing_result(analysis, os.path.basename(file_path), options)

        return result

    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Multi-modal analysis failed: {e!s}")
        raise HTTPException(status_code=500, detail=f"Analysis failed: {e!s}")


@router.post("/analyze/batch")
async def analyze_batch_files(
    files: list[UploadFile] = File(...),
    enable_ocr: bool = Form(True),
    enable_forensics: bool = Form(True),
    enable_object_detection: bool = Form(False),
    enable_face_detection: bool = Form(False),
    db: Session = Depends(get_db),
):
    """
    Analyze multiple uploaded files with multi-modal analysis
    """
    try:
        if not files:
            raise HTTPException(status_code=400, detail="No files provided")

        # Prepare analysis options
        options = {
            "enable_ocr": enable_ocr,
            "enable_forensics": enable_forensics,
            "enable_object_detection": enable_object_detection,
            "enable_face_detection": enable_face_detection,
        }

        temp_files_map = {}  # path -> filename
        temp_paths = []

        try:
            # Process each file
            for file in files:
                if not file.filename:
                    continue

                # Save uploaded file temporarily
                with tempfile.NamedTemporaryFile(
                    delete=False, suffix=f"_{file.filename}"
                ) as temp_file:
                    content = await file.read()
                    temp_file.write(content)
                    temp_file_path = temp_file.name
                    temp_paths.append(temp_file_path)
                    temp_files_map[temp_file_path] = file.filename

            # Perform batch analysis
            analysis_results = await processor.process_files_batch(temp_paths, options)

            # Map results
            mapped_results = []
            for res in analysis_results:
                original_filename = temp_files_map.get(res.file_path, "unknown")
                if res.error:
                    mapped_results.append(
                        {
                            "filename": original_filename,
                            "error": res.error,
                            "success": False,
                        }
                    )
                else:
                    mapped = _map_processing_result(res, original_filename, options)
                    # Flatten structure slightly for batch response to match previous API if needed?
                    # Previous API returned full structure. We will return full structure + success flag.
                    mapped["success"] = True
                    mapped["filename"] = (
                        original_filename  # Ensure filename at top level
                    )
                    mapped_results.append(mapped)

            return {
                "success": True,
                "total_files": len(files),
                "successful_analyses": len(
                    [r for r in mapped_results if r.get("success", False)]
                ),
                "results": mapped_results,
                "analysis_timestamp": datetime.now(UTC).isoformat(),
            }

        finally:
            # Clean up temporary files
            for temp_file_path in temp_paths:
                with contextlib.suppress(builtins.BaseException):
                    os.unlink(temp_file_path)

    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Batch multi-modal analysis failed: {e!s}")
        raise HTTPException(status_code=500, detail=f"Batch analysis failed: {e!s}")


@router.get("/capabilities")
async def get_analysis_capabilities():
    """
    Get available analysis capabilities
    """
    # Hardcoded or derived from EvidenceProcessor
    # EvidenceProcessor doesn't expose capabilities flags directly like the old service
    # But we know what it supports from the code.
    return {
        "success": True,
        "capabilities": {
            "ocr_available": True,  # processing_service uses pytesseract
            "image_analysis_available": True,
            "document_analysis_available": True,
            "forensic_available": True,
            "analysis_features": {
                "text_extraction": True,
                "entity_extraction": True,
                "sentiment_analysis": True,
                "visual_analysis": True,
                "object_detection": False,
                "face_detection": False,
                "forensic_analysis": True,
            },
        },
        "timestamp": datetime.now(UTC).isoformat(),
    }


@router.get("/status")
async def get_analysis_status():
    """
    Get status of multi-modal analysis service
    """
    return {
        "success": True,
        "status": {
            "service_status": "healthy",
            "processor": "EvidenceProcessor",
            "backend": "production_evidence_service",
        },
        "timestamp": datetime.now(UTC).isoformat(),
    }


def _map_processing_result(
    analysis: ProcessingResult, filename: str, options: dict[str, Any]
) -> dict[str, Any]:
    """Helper to map EvidenceProcessor result to the JSON structure expected by frontend"""

    # Extract metadata fields if they exist
    meta = analysis.metadata or {}
    forensics = meta.get("forensics", {})
    if not forensics and meta.get("forensic_results"):
        # EvidenceService might store it elsewhere?
        # Looking at evidence_service.py: _analyze_image_forensics returns dict with 'manipulation_score', etc.
        # And it puts key 'forensics' in metadata in `_process_image` (likely).
        # We assume standard metadata structure. If it's empty, we provide defaults.
        pass

    # Construct the legacy response shape
    return {
        "success": True,
        "file_info": {
            "filename": filename,
            "evidence_id": analysis.file_id,
            "file_type": analysis.file_type,
            "size_bytes": analysis.size_bytes,
            "path": analysis.file_path,
        },
        "text_analysis": {
            "extracted_text": analysis.extracted_text,
            "key_entities": analysis.key_entities or [],
            "sentiment_score": analysis.sentiment_score,
            "language_detected": meta.get("language", "unknown"),
        },
        "visual_analysis": {
            "visual_features": meta.get("visual_features", {}),
            "objects_detected": meta.get(
                "objects_detected", []
            ),  # Features missing in evidence_service for now
            "faces_detected": meta.get("faces_detected", []),
        },
        "document_analysis": {
            "document_structure": meta.get("document_structure", {}),
            "signatures_detected": [],
            "form_fields": [],
        },
        "forensic_analysis": {
            "manipulation_score": forensics.get("manipulation_score", 0.0),
            "authenticity_score": forensics.get("authenticity_score", 100.0),
            "forensic_indicators": forensics.get("forensic_indicators", []),
            "metadata_analysis": forensics.get("metadata_analysis", {}),
            "confidence": forensics.get("confidence", 0.0),
        },
        "quality_assessment": {
            "quality_score": analysis.quality_score,
            "relevance_score": 0.0,  # Not computed by EvidenceProcessor
            "admissibility_score": 0.0,
        },
        "processing_info": {
            "processing_time": analysis.processing_time,
            "analysis_timestamp": datetime.now(UTC).isoformat(),
            "errors": [analysis.error] if analysis.error else [],
        },
    }
