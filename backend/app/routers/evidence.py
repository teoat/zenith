import json
import logging
import os
import uuid
from dataclasses import asdict
from datetime import datetime
from typing import Dict, List, Optional, Any

from fastapi import (
    APIRouter,
    Depends,
    File,
    Form,
    HTTPException,
    Query,
    Request,
    UploadFile,
    Body,
)
from fastapi.responses import FileResponse
from sqlalchemy import text
from sqlalchemy.orm import Session

from app.services.infrastructure.auth_service import auth_service
from app.services.intelligence.evidence_service import evidence_processor
from app.services.search_service import evidence_search_index
from core.database import Case, User, get_db
from app.dependencies import get_current_project_id

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
    q: Optional[str] = Query(None, description="Search term for filename or uploader"),
    page: int = Query(1, ge=1, description="Page number"),
    page_size: int = Query(20, ge=1, le=100, description="Items per page"),
    db: Session = Depends(get_db),
    project_id: str = Depends(get_current_project_id),
):
    """
    Get list of evidence items with pagination and search
    """
    try:
        # Base filters
        filters = ["1=1"]
        params = {}

        if project_id:
            filters.append("e.case_id IN (SELECT id FROM cases WHERE project_id = :project_id)")
            params["project_id"] = project_id

        if case_id:
            filters.append("e.case_id = :case_id")
            params["case_id"] = case_id

        if file_type:
            filters.append("e.file_type = :file_type")
            params["file_type"] = file_type

        if q:
            filters.append("(e.filename ILIKE :q OR e.uploaded_by ILIKE :q)")
            params["q"] = f"%{q}%"

        where_clause = " AND ".join(filters)

        # Count total
        count_query = f"SELECT count(*) FROM evidence e WHERE {where_clause}"
        total = db.execute(text(count_query), params).scalar()

        # Get Page
        offset = (page - 1) * page_size
        data_query = f"""
            SELECT e.id, e.case_id, e.filename, e.file_path,
                   e.file_type, e.file_category, e.size_bytes, e.uploaded_at, e.uploaded_by,
                   e.processed_at, e.processing_status, e.hash, e.ocr_text, e.extracted_text,
                    e.sentiment_score, e.is_admissible, e.fraud_amount, e.customer_name,
                    e.quality_score, e.relevance_score, e.evidence_metadata, e.evidence_tags
            FROM evidence e
            WHERE {where_clause}
            ORDER BY e.uploaded_at DESC
            LIMIT :limit OFFSET :offset
        """
        params["limit"] = page_size
        params["offset"] = offset

        result = db.execute(text(data_query), params)
        rows = result.fetchall()

        evidence_list = []
        for row in rows:
            evidence_list.append(
                {
                    "id": row.id,
                    "caseId": row.case_id,
                    "fileName": row.filename,
                    "fileType": row.file_type,
                    "sizeBytes": row.size_bytes,
                    "uploadedAt": (
                        str(row.uploaded_at) if row.uploaded_at else None
                    ),
                    "filePath": row.file_path,
                    "ocrText": row.extracted_text,
                    "fraudAmount": row.fraud_amount,
                    "customerName": row.customer_name,
                    "processingStatus": row.processing_status
                }
            )

        return {
            "items": evidence_list,
            "total": total,
            "page": page,
            "page_size": page_size,
            "total_pages": (total + page_size - 1) // page_size
        }

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
    project_id: str = Depends(get_current_project_id),
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
                priority="MEDIUM",
                project_id=project_id
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
                "fraud_amount": processing_result.fraud_amount,
                "customer_name": processing_result.customer_name,
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
                        extracted_text, sentiment_score, quality_score, fraud_amount, customer_name,
                        evidence_metadata, evidence_tags
                    ) VALUES (
                        :id, :case_id, :filename, :file_path, :file_type,
                        :file_category, :size_bytes, :uploaded_at, :uploaded_by, :processing_status,
                        :extracted_text, :sentiment_score, :quality_score, :fraud_amount, :customer_name,
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
                    "fraud_amount": evidence_record["fraud_amount"],
                    "customer_name": evidence_record["customer_name"],
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
                "fraudAmount": processing_result.fraud_amount,
                "customerName": processing_result.customer_name,
                "analysis_result": {
                    "extractedTextLength": len(processing_result.extracted_text or ""),
                    "keyEntitiesCount": len(processing_result.key_entities or []),
                    "sentimentScore": processing_result.sentiment_score,
                    "qualityScore": processing_result.quality_score,
                    "fraudAmount": processing_result.fraud_amount,
                    "customerName": processing_result.customer_name,
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


@router.get("/{evidence_id}/highlights")
async def get_evidence_highlights(
    evidence_id: str,
    db: Session = Depends(get_db),
    project_id: str = Depends(get_current_project_id)
):
    """Get saved highlights for an evidence file"""
    try:
        query = "SELECT evidence_metadata FROM evidence WHERE id = :id"
        result = db.execute(text(query), {"id": evidence_id}).fetchone()

        if not result:
            raise HTTPException(status_code=404, detail="Evidence not found")

        metadata = result.evidence_metadata
        if isinstance(metadata, str):
            metadata = json.loads(metadata)
        
        return metadata.get("user_highlights", [])
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Failed to get highlights: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/{evidence_id}/highlights")
async def save_evidence_highlight(
    evidence_id: str,
    highlight:  Dict = None, # JSON body
    request: Request = None, # Alternative way to get body
    db: Session = Depends(get_db),
    current_user: User = Depends(auth_service.get_current_user),
):
    """Save a new highlight to evidence metadata"""
    try:
        # Get body if not bound (FastAPI sometimes tricky with generic Dict)
        if hasattr(request, "json"):
             body = await request.json()
             if body:
                  highlight = body

        if not highlight:
             raise HTTPException(status_code=400, detail="Highlight data required")

        # Get existing metadata
        query = "SELECT evidence_metadata FROM evidence WHERE id = :id"
        result = db.execute(text(query), {"id": evidence_id}).fetchone()

        if not result:
            raise HTTPException(status_code=404, detail="Evidence not found")

        metadata = result.evidence_metadata
        if isinstance(metadata, str):
            metadata = json.loads(metadata)
        
        if metadata is None:
            metadata = {}

        # Append highlight
        if "user_highlights" not in metadata:
            metadata["user_highlights"] = []
        
        # Add metadata to highlight
        highlight["created_at"] = datetime.now().isoformat()
        highlight["created_by"] = current_user.id if current_user else "unknown"
        
        metadata["user_highlights"].append(highlight)

        # Update DB
        update_query = """
            UPDATE evidence 
            SET evidence_metadata = :metadata 
            WHERE id = :id
        """
        db.execute(
            text(update_query), 
            {
                "metadata": json.dumps(metadata, default=str),
                "id": evidence_id
            }
        )
        db.commit()

        return {"status": "success", "count": len(metadata["user_highlights"])}

    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Failed to save highlight: {e}")
        raise HTTPException(status_code=500, detail=str(e))



@router.post("/bulk-delete")
async def bulk_delete_evidence(
    payload: Dict[str, Any] = Body(...),
    db: Session = Depends(get_db),
    current_user: User = Depends(auth_service.get_current_user),
):
    """Bulk delete evidence records and their associated files"""
    try:
        evidence_ids = payload.get("ids", [])
        if not evidence_ids:
            return {"deleted_count": 0, "status": "success"}

        # We use raw SQL for performance and to match the pattern in this file
        from sqlalchemy import text
        
        # Count records first
        check_query = text("SELECT COUNT(*) FROM evidence WHERE id IN :ids")
        count = db.execute(check_query, {"ids": tuple(evidence_ids)}).scalar()
        
        # Delete
        delete_query = text("DELETE FROM evidence WHERE id IN :ids")
        db.execute(delete_query, {"ids": tuple(evidence_ids)})
        
        db.commit()
        logger.info(f"Bulk deleted {count} evidence items")
        return {"deleted_count": count, "status": "success"}
    except Exception as e:
        db.rollback()
        logger.error(f"Bulk delete failed: {e}")
        raise HTTPException(status_code=500, detail=str(e))


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
