import json
import logging
import os
import uuid
from dataclasses import asdict
from datetime import datetime
from typing import Dict, List, Optional

from fastapi import (
    APIRouter,
    Depends,
    File,
    Form,
    HTTPException,
    Query,
    Request,
    UploadFile,
)
from fastapi.responses import FileResponse
from sqlalchemy import text
from sqlalchemy.orm import Session

from app.services.infrastructure.auth_service import auth_service
from app.services.intelligence.evidence_service import evidence_processor
from app.services.search_service import evidence_search_index
from core.database import Case, User, get_db

# Provide a module-level alias `evidence_service` so tests can patch it
try:
    from app.services.intelligence.evidence_service import evidence_service
except Exception:
    evidence_service = None

# ---- Test placeholders (allow tests to patch module-level dependencies) ----
if "get_current_user" not in globals():
    try:
        get_current_user = auth_service.get_current_user
    except Exception:

        def get_current_user(*args, **kwargs):
            return None


if "require_permission" not in globals():

    def require_permission(*args, **kwargs):
        def _dep(*a, **k):
            return None

        return _dep


# Ensure common service aliases exist for tests that patch them
for _svc in (
    "evidence_service",
    "fraud_service",
    "notification_system",
    "case_service",
):
    if _svc not in globals():
        globals()[_svc] = None

logger = logging.getLogger(__name__)

router = APIRouter()

# ===== EVIDENCE ENDPOINTS =====


@router.get("")
async def get_evidence(
    case_id: Optional[str] = Query(None, description="Filter by case ID"),
    file_type: Optional[str] = Query(None, description="Filter by file type"),
    limit: int = Query(100, description="Maximum number of results"),
    db: Session = Depends(get_db),
):
    """
    Get list of evidence items

    Args:
        case_id: Filter by case ID
        file_type: Filter by file type
        limit: Maximum number of results
    """
    try:
        query = """
            SELECT id, case_id, filename, file_path,
                   file_type, file_category, size_bytes, uploaded_at, uploaded_by,
                   processed_at, processing_status, hash, ocr_text, extracted_text,
                   sentiment_score, is_admissible,
                   quality_score, relevance_score, evidence_metadata, evidence_tags
            FROM evidence WHERE 1=1
        """
        params = {}

        if case_id:
            query += " AND case_id = :case_id"
            params["case_id"] = case_id

        if file_type:
            query += " AND file_type = :file_type"
            params["file_type"] = file_type

        query += " ORDER BY uploaded_at DESC LIMIT :limit"
        params["limit"] = limit

        result = db.execute(text(query), params)
        rows = result.fetchall()

        evidence_list = []
        for row in rows:
            # Map row to dictionary - adapt based on actual columns in DB
            evidence_list.append(
                {
                    "id": row.id,
                    "caseId": row.case_id,
                    "fileName": row.filename,
                    "fileType": row.file_type,
                    "sizeBytes": row.size_bytes,
                    "uploadedAt": (
                        row.uploaded_at.isoformat() if row.uploaded_at else None
                    ),
                    "filePath": row.file_path,
                    "ocrText": row.extracted_text,
                }
            )

        return evidence_list

    except Exception as e:
        logger.error(f"Failed to get evidence: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Failed to get evidence: {str(e)}")


@router.get("/{evidence_id}/download")
async def download_evidence(evidence_id: str, db: Session = Depends(get_db)):
    """Download evidence file"""
    try:
        query = "SELECT file_path, filename, file_type FROM evidence WHERE id = :id"
        result = db.execute(text(query), {"id": evidence_id}).fetchone()

        if not result:
            raise HTTPException(status_code=404, detail="Evidence not found")

        file_path = result.file_path
        filename = result.filename

        # Security check: Ensure path is within allowed directory?
        # For now, simplistic check
        if not file_path or not os.path.exists(file_path):
            raise HTTPException(status_code=404, detail="File not found on server")

        return FileResponse(
            path=file_path, filename=filename, media_type="application/octet-stream"
        )
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Download failed: {e}")
        raise HTTPException(status_code=500, detail=f"Download failed: {str(e)}")


@router.get("/processing/metrics")
async def get_evidence_processing_metrics(
    current_user: User = Depends(auth_service.get_current_user),
):
    """Get evidence processing performance metrics"""
    try:
        metrics = evidence_processor.get_performance_metrics()
        return metrics
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/processing/cleanup")
async def cleanup_evidence_processor(
    current_user: User = Depends(auth_service.get_current_user),
):
    """Clean up evidence processor resources"""
    try:
        evidence_processor.cleanup()
        return {"message": "Evidence processor cleaned up successfully"}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/upload")
async def upload_evidence(
    request: Request,
    case_id: str = Form(...),
    file: UploadFile = File(...),
    description: Optional[str] = Form(None),
    tags: Optional[str] = Form(None),  # JSON string of tags
    db: Session = Depends(get_db),
):
    """
    Upload and process evidence file for a case

    This endpoint:
    1. Saves the uploaded file
    2. Performs multi-modal analysis (OCR, forensics, etc.)
    3. Creates evidence record in database
    4. Indexes content for search
    """
    try:
        from app.services.intelligence.evidence_service import evidence_processor

        # Validate or create case
        case = db.query(Case).filter(Case.id == case_id).first()
        if not case:
            # Auto-create case if it doesn't exist (Handling frontend hardcoded IDs like CASE-001)
            logger.info(f"Case {case_id} not found, auto-creating...")
            case = Case(
                id=case_id,
                title=f"Case {case_id}",
                description="Auto-generated case for evidence upload",
                status="OPEN",
                priority="MEDIUM"
            )
            db.add(case)
            db.commit()
            db.refresh(case)

        # Parse tags if provided
        evidence_tags = []
        if tags:
            try:
                evidence_tags = json.loads(tags)
            except json.JSONDecodeError:
                evidence_tags = [tags]  # Treat as single tag

        # Create persistent file for storage and analysis
        UPLOAD_DIR = "uploads"
        if not os.path.exists(UPLOAD_DIR):
            os.makedirs(UPLOAD_DIR)

        file_ext = os.path.splitext(file.filename)[1]
        unique_filename = f"{uuid.uuid4()}{file_ext}"
        saved_file_path = os.path.join(UPLOAD_DIR, unique_filename)

        # Write content
        content = await file.read()
        with open(saved_file_path, "wb") as f:
            f.write(content)

        temp_file_path = saved_file_path  # usage in rest of function

        try:
            # Using process_files_batch but with single file for now as per refactor
            results = await evidence_processor.process_files_batch(
                [temp_file_path],
                {
                    "filename": file.filename,
                    "enable_ocr": True,
                    "enable_forensics": True,
                }
            )

            if not results:
                raise Exception("Analysis returned no results")

            processing_result = results[0]

            if processing_result.error:
                 raise Exception(f"Processing error: {processing_result.error}")

            # Create evidence record
            evidence_id = str(uuid.uuid4())

            # Extract forensic result if available from metadata
            forensic_result = {
                "manipulation_score": processing_result.metadata.get("manipulation_score"),
                "authenticity_score": processing_result.metadata.get("authenticity_score"),
                "forensic_indicators": processing_result.metadata.get("forensic_indicators", []),
                # Include raw forensic data
                "raw_analysis": {
                     k: v for k, v in processing_result.metadata.items()
                     if k not in ["manipulation_score", "authenticity_score", "forensic_indicators"]
                }
            }

            evidence_record = {
                "id": evidence_id,
                "case_id": case_id,
                "filename": file.filename,
                "original_filename": file.filename,
                "file_path": temp_file_path,  # Will be moved to secure storage
                "file_type": processing_result.file_type,
                "file_category": _determine_file_category(
                    file.filename, processing_result.file_type
                ),
                "size_bytes": len(content),
                "uploaded_at": datetime.now(),
                "uploaded_by": getattr(request.state, "user_id", None) or "system",
                "processing_status": "completed",
                "extracted_text": processing_result.extracted_text or "",
                "key_entities": processing_result.key_entities or [],
                "sentiment_score": processing_result.sentiment_score,
                "quality_score": processing_result.quality_score,
                "evidence_metadata": {
                    "multimodal_analysis": processing_result.metadata,
                    "forensic_result": forensic_result,
                },
                "tags": evidence_tags,
            }

            # Save to database using named parameters
            db.execute(
                text(
                    """
                    INSERT INTO evidence (
                        id, case_id, filename, file_path, file_type,
                        file_category, size_bytes, uploaded_at, uploaded_by, processing_status,
                        extracted_text, sentiment_score, quality_score,
                        evidence_metadata, evidence_tags
                    ) VALUES (
                        :id, :case_id, :filename, :file_path, :file_type,
                        :file_category, :size_bytes, :uploaded_at, :uploaded_by, :processing_status,
                        :extracted_text, :sentiment_score, :quality_score,
                        :evidence_metadata, :evidence_tags
                    )
                """
                ),
                {
                    "id": evidence_record["id"],
                    "case_id": evidence_record["case_id"],
                    "filename": evidence_record["filename"],
                    "file_path": evidence_record["file_path"],
                    "file_type": evidence_record["file_type"],
                    "file_category": evidence_record["file_category"],
                    "size_bytes": evidence_record["size_bytes"],
                    "uploaded_at": evidence_record["uploaded_at"],
                    "uploaded_by": evidence_record["uploaded_by"],
                    "processing_status": evidence_record["processing_status"],
                    "extracted_text": evidence_record["extracted_text"],
                    "sentiment_score": evidence_record["sentiment_score"],
                    "quality_score": evidence_record["quality_score"],
                    "evidence_metadata": json.dumps(
                        evidence_record["evidence_metadata"], default=str
                    ),
                    "evidence_tags": json.dumps(evidence_record["tags"], default=str),
                },
            )
            db.commit()

            # Index for search
            try:
                # evidence_search_index.index_evidence expects (file_id, file_path, processing_dict)
                processing_dict = {
                    "extracted_text": processing_result.extracted_text,
                    "key_entities": processing_result.key_entities,
                    "metadata": processing_result.metadata,
                    "file_type": processing_result.file_type,
                    "quality_score": processing_result.quality_score,
                    "sentiment_score": processing_result.sentiment_score,
                }
                evidence_search_index.index_evidence(evidence_id, temp_file_path, processing_dict)
                logger.info(f"Evidence indexed for search: {evidence_id}")
            except Exception as e:
                logger.warning(f"Failed to index evidence for search: {e}")

            # clean up temp file logic removed - we keep the file now
            pass

            return {
                "message": "Evidence uploaded and processed successfully",
                "evidence_id": evidence_id,
                # Return standard EvidenceItem fields
                "id": evidence_id,
                "evidence_id": evidence_id,
                "caseId": case_id,
                "fileName": file.filename,
                "filename": file.filename,
                "fileType": processing_result.file_type,
                "sizeBytes": len(content),
                "uploadedAt": evidence_record["uploaded_at"].isoformat(),
                "filePath": temp_file_path,
                "ocrText": processing_result.extracted_text or "",
                "analysis_result": {
                    "extractedTextLength": len(processing_result.extracted_text or ""),
                    "keyEntitiesCount": len(processing_result.key_entities or []),
                    "sentimentScore": processing_result.sentiment_score,
                    "qualityScore": processing_result.quality_score,
                    "fileType": processing_result.file_type,
                },
            }

        except Exception as analysis_error:
            logger.error(f"Multi-modal analysis failed: {analysis_error}")
            # Still create evidence record but mark as failed
            evidence_id = str(uuid.uuid4())
            db.execute(
                text(
                    """
                    INSERT INTO evidence (
                        id, case_id, filename, file_path, file_type,
                        size_bytes, uploaded_at, uploaded_by, processing_status, evidence_metadata
                    ) VALUES (
                        :id, :case_id, :filename, :file_path, :file_type,
                        :size_bytes, :uploaded_at, :uploaded_by, :processing_status, :evidence_metadata
                    )
                """
                ),
                {
                    "id": evidence_id,
                    "case_id": case_id,
                    "filename": file.filename,
                    "file_path": temp_file_path,
                    "file_type": file.content_type or "unknown",
                    "size_bytes": len(content),
                    "uploaded_at": datetime.now(),
                    "uploaded_by": "system",
                    "processing_status": "failed",
                    "evidence_metadata": json.dumps({"error": str(analysis_error)}),
                },
            )
            db.commit()

            # Clean up
            try:
                os.unlink(temp_file_path)
            except:
                pass

            raise HTTPException(
                status_code=500,
                detail=f"Evidence uploaded but processing failed: {str(analysis_error)}",
            )

    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Evidence upload failed: {e}")
        raise HTTPException(status_code=500, detail=f"Evidence upload failed: {str(e)}")


def _determine_file_category(filename: str, mime_type: str) -> str:
    """Determine file category based on filename and MIME type"""
    ext = filename.lower().split(".")[-1] if "." in filename else ""

    if mime_type.startswith("image/") or ext in [
        "jpg",
        "jpeg",
        "png",
        "gif",
        "bmp",
        "tiff",
    ]:
        return "image"
    elif mime_type.startswith("video/") or ext in ["mp4", "avi", "mov", "wmv"]:
        return "video"
    elif mime_type.startswith("audio/") or ext in ["mp3", "wav", "flac", "aac"]:
        return "audio"
    elif mime_type == "application/pdf" or ext == "pdf":
        return "document"
    elif ext in ["doc", "docx", "txt", "rtf", "odt"]:
        return "document"
    elif ext in ["xls", "xlsx", "csv", "ods"]:
        return "spreadsheet"
    else:
        return "other"
