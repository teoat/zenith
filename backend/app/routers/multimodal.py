# api/multimodal.py
import logging
import os
import tempfile
from datetime import datetime, timezone
from typing import Any, Dict, List, Optional

from fastapi import APIRouter, Depends, File, Form, HTTPException, Query, UploadFile
from sqlalchemy.orm import Session

from app.services.multimodal_analysis_service import MultiModalAnalyzer
from core.database import get_db

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/multimodal", tags=["multi-modal-analysis"])

# Global analyzer instance
multimodal_analyzer = MultiModalAnalyzer()


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

    Args:
        file: Uploaded file to analyze
        enable_ocr: Enable OCR text extraction
        enable_forensics: Enable forensic analysis
        enable_object_detection: Enable object detection
        enable_face_detection: Enable face detection

    Returns:
        Complete multi-modal analysis result
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

            # Perform analysis
            analysis = multimodal_analyzer.analyze_evidence(temp_file_path, options)

            # Convert to dict for JSON response
            result = {
                "success": True,
                "file_info": {
                    "filename": file.filename,
                    "evidence_id": analysis.evidence_id,
                    "file_type": analysis.file_type,
                    "size_bytes": analysis.size_bytes,
                },
                "text_analysis": {
                    "extracted_text": analysis.extracted_text,
                    "key_entities": analysis.key_entities,
                    "sentiment_score": analysis.sentiment_score,
                    "language_detected": analysis.language_detected,
                },
                "visual_analysis": {
                    "visual_features": analysis.visual_features,
                    "objects_detected": analysis.objects_detected,
                    "faces_detected": analysis.faces_detected,
                },
                "document_analysis": {
                    "document_structure": analysis.document_structure,
                    "signatures_detected": analysis.signatures_detected,
                    "form_fields": analysis.form_fields,
                },
                "forensic_analysis": {
                    "manipulation_score": (
                        analysis.forensic_result.manipulation_score
                        if analysis.forensic_result
                        else 0.0
                    ),
                    "authenticity_score": (
                        analysis.forensic_result.authenticity_score
                        if analysis.forensic_result
                        else 50.0
                    ),
                    "forensic_indicators": (
                        analysis.forensic_result.forensic_indicators
                        if analysis.forensic_result
                        else []
                    ),
                    "metadata_analysis": (
                        analysis.forensic_result.metadata_analysis
                        if analysis.forensic_result
                        else {}
                    ),
                    "confidence": (
                        analysis.forensic_result.confidence
                        if analysis.forensic_result
                        else 0.0
                    ),
                },
                "quality_assessment": {
                    "quality_score": analysis.quality_score,
                    "relevance_score": analysis.relevance_score,
                    "admissibility_score": analysis.admissibility_score,
                },
                "processing_info": {
                    "processing_time": analysis.processing_time,
                    "analysis_timestamp": analysis.analysis_timestamp.isoformat(),
                    "errors": analysis.errors,
                },
            }

            return result

        finally:
            # Clean up temporary file
            try:
                os.unlink(temp_file_path)
            except:
                pass

    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Multi-modal analysis failed: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Analysis failed: {str(e)}")


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

    Args:
        file_path: Path to file to analyze
        enable_ocr: Enable OCR text extraction
        enable_forensics: Enable forensic analysis
        enable_object_detection: Enable object detection
        enable_face_detection: Enable face detection

    Returns:
        Complete multi-modal analysis result
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
        analysis = multimodal_analyzer.analyze_evidence(file_path, options)

        # Convert to dict for JSON response
        result = {
            "success": True,
            "file_info": {
                "file_path": file_path,
                "evidence_id": analysis.evidence_id,
                "file_type": analysis.file_type,
                "size_bytes": analysis.size_bytes,
            },
            "text_analysis": {
                "extracted_text": analysis.extracted_text,
                "key_entities": analysis.key_entities,
                "sentiment_score": analysis.sentiment_score,
                "language_detected": analysis.language_detected,
            },
            "visual_analysis": {
                "visual_features": analysis.visual_features,
                "objects_detected": analysis.objects_detected,
                "faces_detected": analysis.faces_detected,
            },
            "document_analysis": {
                "document_structure": analysis.document_structure,
                "signatures_detected": analysis.signatures_detected,
                "form_fields": analysis.form_fields,
            },
            "forensic_analysis": {
                "manipulation_score": (
                    analysis.forensic_result.manipulation_score
                    if analysis.forensic_result
                    else 0.0
                ),
                "authenticity_score": (
                    analysis.forensic_result.authenticity_score
                    if analysis.forensic_result
                    else 50.0
                ),
                "forensic_indicators": (
                    analysis.forensic_result.forensic_indicators
                    if analysis.forensic_result
                    else []
                ),
                "metadata_analysis": (
                    analysis.forensic_result.metadata_analysis
                    if analysis.forensic_result
                    else {}
                ),
                "confidence": (
                    analysis.forensic_result.confidence
                    if analysis.forensic_result
                    else 0.0
                ),
            },
            "quality_assessment": {
                "quality_score": analysis.quality_score,
                "relevance_score": analysis.relevance_score,
                "admissibility_score": analysis.admissibility_score,
            },
            "processing_info": {
                "processing_time": analysis.processing_time,
                "analysis_timestamp": analysis.analysis_timestamp.isoformat(),
                "errors": analysis.errors,
            },
        }

        return result

    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Multi-modal analysis failed: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Analysis failed: {str(e)}")


@router.post("/analyze/batch")
async def analyze_batch_files(
    files: List[UploadFile] = File(...),
    enable_ocr: bool = Form(True),
    enable_forensics: bool = Form(True),
    enable_object_detection: bool = Form(False),
    enable_face_detection: bool = Form(False),
    db: Session = Depends(get_db),
):
    """
    Analyze multiple uploaded files with multi-modal analysis

    Args:
        files: List of uploaded files to analyze
        enable_ocr: Enable OCR text extraction
        enable_forensics: Enable forensic analysis
        enable_object_detection: Enable object detection
        enable_face_detection: Enable face detection

    Returns:
        List of multi-modal analysis results
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

        results = []
        temp_files = []

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
                    temp_files.append(temp_file_path)

                try:
                    # Perform analysis
                    analysis = multimodal_analyzer.analyze_evidence(
                        temp_file_path, options
                    )

                    # Convert to dict
                    result = {
                        "filename": file.filename,
                        "evidence_id": analysis.evidence_id,
                        "file_type": analysis.file_type,
                        "size_bytes": analysis.size_bytes,
                        "extracted_text": analysis.extracted_text,
                        "key_entities": analysis.key_entities,
                        "sentiment_score": analysis.sentiment_score,
                        "language_detected": analysis.language_detected,
                        "visual_features": analysis.visual_features,
                        "objects_detected": analysis.objects_detected,
                        "faces_detected": analysis.faces_detected,
                        "document_structure": analysis.document_structure,
                        "signatures_detected": analysis.signatures_detected,
                        "form_fields": analysis.form_fields,
                        "manipulation_score": (
                            analysis.forensic_result.manipulation_score
                            if analysis.forensic_result
                            else 0.0
                        ),
                        "authenticity_score": (
                            analysis.forensic_result.authenticity_score
                            if analysis.forensic_result
                            else 50.0
                        ),
                        "forensic_indicators": (
                            analysis.forensic_result.forensic_indicators
                            if analysis.forensic_result
                            else []
                        ),
                        "quality_score": analysis.quality_score,
                        "relevance_score": analysis.relevance_score,
                        "admissibility_score": analysis.admissibility_score,
                        "processing_time": analysis.processing_time,
                        "errors": analysis.errors,
                    }

                    results.append(result)

                except Exception as e:
                    logger.error(f"Analysis failed for {file.filename}: {str(e)}")
                    results.append(
                        {"filename": file.filename, "error": str(e), "success": False}
                    )

            return {
                "success": True,
                "total_files": len(files),
                "successful_analyses": len(
                    [r for r in results if r.get("success", True)]
                ),
                "results": results,
                "analysis_timestamp": datetime.now(timezone.utc).isoformat(),
            }

        finally:
            # Clean up temporary files
            for temp_file_path in temp_files:
                try:
                    os.unlink(temp_file_path)
                except:
                    pass

    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Batch multi-modal analysis failed: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Batch analysis failed: {str(e)}")


@router.get("/capabilities")
async def get_analysis_capabilities():
    """
    Get available analysis capabilities

    Returns:
        Information about available analysis modules
    """
    try:
        capabilities = {
            "ocr_available": multimodal_analyzer.ocr_available,
            "image_analysis_available": multimodal_analyzer.image_analysis_available,
            "document_analysis_available": multimodal_analyzer.document_analysis_available,
            "forensic_available": multimodal_analyzer.forensic_available,
            "supported_file_types": {
                "images": [
                    "image/jpeg",
                    "image/png",
                    "image/tiff",
                    "image/bmp",
                    "image/gif",
                    "image/webp",
                ],
                "documents": [
                    "application/pdf",
                    "application/msword",
                    "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
                    "application/vnd.ms-excel",
                    "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
                    "application/vnd.ms-powerpoint",
                    "application/vnd.openxmlformats-officedocument.presentationml.presentation",
                ],
                "text": [
                    "text/plain",
                    "text/csv",
                    "text/html",
                    "text/markdown",
                    "application/json",
                ],
            },
            "analysis_features": {
                "text_extraction": True,
                "entity_extraction": True,
                "sentiment_analysis": True,
                "language_detection": True,
                "visual_analysis": multimodal_analyzer.image_analysis_available,
                "object_detection": False,  # Would require additional models
                "face_detection": False,  # Would require additional models
                "forensic_analysis": multimodal_analyzer.forensic_available,
                "manipulation_detection": multimodal_analyzer.forensic_available,
                "authenticity_assessment": multimodal_analyzer.forensic_available,
            },
        }

        return {
            "success": True,
            "capabilities": capabilities,
            "timestamp": datetime.now(timezone.utc).isoformat(),
        }

    except Exception as e:
        logger.error(f"Failed to get capabilities: {str(e)}")
        raise HTTPException(
            status_code=500, detail=f"Failed to get capabilities: {str(e)}"
        )


@router.get("/status")
async def get_analysis_status():
    """
    Get status of multi-modal analysis service

    Returns:
        Service status and health information
    """
    try:
        status = {
            "service_status": "healthy",
            "modules": {
                "ocr": (
                    "available" if multimodal_analyzer.ocr_available else "unavailable"
                ),
                "image_analysis": (
                    "available"
                    if multimodal_analyzer.image_analysis_available
                    else "unavailable"
                ),
                "document_analysis": (
                    "available"
                    if multimodal_analyzer.document_analysis_available
                    else "unavailable"
                ),
                "forensic_analysis": (
                    "available"
                    if multimodal_analyzer.forensic_available
                    else "unavailable"
                ),
            },
            "temp_directory": multimodal_analyzer.temp_dir,
            "dependencies": {
                "pytesseract": multimodal_analyzer.ocr_available,
                "opencv": multimodal_analyzer.image_analysis_available,
                "pillow": multimodal_analyzer.image_analysis_available,
                "pypdf2": multimodal_analyzer.document_analysis_available,
                "python-docx": multimodal_analyzer.document_analysis_available,
            },
        }

        return {
            "success": True,
            "status": status,
            "timestamp": datetime.now(timezone.utc).isoformat(),
        }

    except Exception as e:
        logger.error(f"Failed to get status: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Failed to get status: {str(e)}")
