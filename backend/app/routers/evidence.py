import json
import logging
import os
import uuid
import hashlib
import aiofiles
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
    BackgroundTasks,
)
from fastapi.responses import FileResponse, StreamingResponse
from sqlalchemy import text
from sqlalchemy.orm import Session

from app.services.infrastructure.auth_service import auth_service
from app.services.intelligence.evidence_service import evidence_processor
from app.services.business.evidence_service import evidence_service
from core.database import Case, User, get_db
from app.dependencies import get_current_project_id
from pydantic import BaseModel, Field

# Streaming upload models
class UploadChunkRequest(BaseModel):
    file_id: str = Field(..., description="Unique file identifier")
    chunk_index: int = Field(..., ge=0, description="Chunk index (0-based)")
    total_chunks: int = Field(..., gt=0, description="Total number of chunks")
    chunk_data: str = Field(..., description="Base64 encoded chunk data")
    file_name: str = Field(..., description="Original file name")
    file_size: int = Field(..., gt=0, description="Total file size in bytes")
    mime_type: str = Field(..., description="File MIME type")

class UploadChunkResponse(BaseModel):
    file_id: str
    chunk_index: int
    uploaded: bool
    message: str

class UploadCompleteRequest(BaseModel):
    file_id: str
    case_id: str
    description: Optional[str] = None
    tags: Optional[List[str]] = Field(default_factory=list)

class UploadCompleteResponse(BaseModel):
    evidence_id: str
    file_name: str
    file_size: int
    uploaded_at: datetime
    processing_status: str
    message: str

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
    current_user: User = Depends(auth_service.get_current_user),
):
    """
    Get list of evidence items with pagination and search
    """
    try:
        return evidence_service.get_evidence_paginated(
            db=db,
            page=page,
            page_size=page_size,
            project_id=project_id,
            case_id=case_id,
            file_type=file_type,
            search_query=q
        )
    except Exception as e:
        logger.error(f"Failed to get evidence: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Failed to get evidence: {str(e)}")


@router.get("/{evidence_id}/download/stream")
async def download_evidence_stream(
    evidence_id: str,
    current_user: User = Depends(auth_service.get_current_user),
    db: Session = Depends(get_db),
):
    """
    Stream download evidence file for large files.
    Provides better memory efficiency for large downloads.
    """
    try:
        # Get evidence record
        evidence = db.query(Evidence).filter(Evidence.id == evidence_id).first()
        if not evidence:
            raise HTTPException(status_code=404, detail="Evidence not found")

        # Check permissions (simplified)
        if not current_user:
            raise HTTPException(status_code=401, detail="Authentication required")

        file_path = evidence.file_path
        if not os.path.exists(file_path):
            raise HTTPException(status_code=404, detail="File not found on disk")

        # Get file size for streaming
        file_size = os.path.getsize(file_path)

        # Stream the file
        async def file_generator():
            async with aiofiles.open(file_path, 'rb') as f:
                chunk_size = 8192  # 8KB chunks
                while True:
                    chunk = await f.read(chunk_size)
                    if not chunk:
                        break
                    yield chunk

        return StreamingResponse(
            file_generator(),
            media_type='application/octet-stream',
            headers={
                'Content-Disposition': f'attachment; filename="{evidence.filename}"',
                'Content-Length': str(file_size),
            }
        )

    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Failed to stream download evidence {evidence_id}: {e}")
        raise HTTPException(status_code=500, detail="Download failed")


@router.get("/processing/metrics")
async def get_processing_metrics(
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


# ===== STREAMING UPLOAD ENDPOINTS =====

@router.post("/upload/chunk", response_model=UploadChunkResponse)
async def upload_file_chunk(
    request: UploadChunkRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(auth_service.get_current_user),
):
    """
    Upload a file chunk for resumable file uploads.
    Supports large file uploads by splitting them into chunks.
    """
    try:
        # Create upload directory if it doesn't exist
        upload_dir = "uploads/chunks"
        os.makedirs(upload_dir, exist_ok=True)

        # Create file-specific directory
        file_dir = os.path.join(upload_dir, request.file_id)
        os.makedirs(file_dir, exist_ok=True)

        # Decode chunk data
        import base64
        chunk_data = base64.b64decode(request.chunk_data)

        # Save chunk
        chunk_path = os.path.join(file_dir, f"chunk_{request.chunk_index:06d}")
        async with aiofiles.open(chunk_path, 'wb') as f:
            await f.write(chunk_data)

        # Store chunk metadata in database for resumability
        chunk_record = {
            "file_id": request.file_id,
            "chunk_index": request.chunk_index,
            "total_chunks": request.total_chunks,
            "file_name": request.file_name,
            "file_size": request.file_size,
            "mime_type": request.mime_type,
            "uploaded_at": datetime.now(),
            "user_id": current_user.id if current_user else None,
        }

        # Store in a simple JSON file for now (could be database table)
        metadata_file = os.path.join(file_dir, "metadata.json")
        async with aiofiles.open(metadata_file, 'w') as f:
            await f.write(json.dumps(chunk_record, default=str))

        return UploadChunkResponse(
            file_id=request.file_id,
            chunk_index=request.chunk_index,
            uploaded=True,
            message=f"Chunk {request.chunk_index + 1}/{request.total_chunks} uploaded successfully"
        )

    except Exception as e:
        logger.error(f"Failed to upload chunk {request.chunk_index} for file {request.file_id}: {e}")
        raise HTTPException(status_code=500, detail=f"Chunk upload failed: {str(e)}")


@router.post("/upload/complete", response_model=UploadCompleteResponse)
async def complete_file_upload(
    request: UploadCompleteRequest,
    background_tasks: BackgroundTasks,
    db: Session = Depends(get_db),
    current_user: User = Depends(auth_service.get_current_user),
    project_id: str = Depends(get_current_project_id),
):
    """
    Complete a resumable file upload by assembling chunks and processing the file.
    """
    try:
        upload_dir = "uploads/chunks"
        file_dir = os.path.join(upload_dir, request.file_id)

        if not os.path.exists(file_dir):
            raise HTTPException(status_code=404, detail="Upload session not found")

        # Load metadata
        metadata_file = os.path.join(file_dir, "metadata.json")
        async with aiofiles.open(metadata_file, 'r') as f:
            metadata = json.loads(await f.read())

        # Assemble file from chunks
        final_file_path = os.path.join("uploads", f"{request.file_id}_{metadata['file_name']}")

        async with aiofiles.open(final_file_path, 'wb') as final_file:
            for i in range(metadata['total_chunks']):
                chunk_path = os.path.join(file_dir, f"chunk_{i:06d}")
                if not os.path.exists(chunk_path):
                    raise HTTPException(status_code=400, detail=f"Missing chunk {i}")

                async with aiofiles.open(chunk_path, 'rb') as chunk_file:
                    await final_file.write(await chunk_file.read())

        # Clean up chunk directory
        import shutil
        shutil.rmtree(file_dir)

        # Process file in background
        background_tasks.add_task(
            process_evidence_file_background,
            final_file_path,
            request.case_id,
            metadata['file_name'],
            request.description,
            request.tags,
            metadata['mime_type'],
            current_user.id if current_user else None,
            project_id,
        )

        return UploadCompleteResponse(
            evidence_id=request.file_id,
            file_name=metadata['file_name'],
            file_size=metadata['file_size'],
            uploaded_at=datetime.now(),
            processing_status="processing",
            message="File uploaded successfully, processing in background"
        )

    except Exception as e:
        logger.error(f"Failed to complete upload for file {request.file_id}: {e}")
        raise HTTPException(status_code=500, detail=f"Upload completion failed: {str(e)}")


async def process_evidence_file_background(
    file_path: str,
    case_id: str,
    file_name: str,
    description: Optional[str],
    tags: List[str],
    mime_type: str,
    user_id: Optional[str],
    project_id: str,
):
    """Background task to process uploaded evidence file"""
    try:
        logger.info(f"Starting background processing for file: {file_name}")

        # Import here to avoid circular imports
        from app.services.business.evidence_service import evidence_service

        # Process the file
        result = await evidence_service.process_file(
            file_path=file_path,
            case_id=case_id,
            file_name=file_name,
            description=description,
            tags=tags,
            mime_type=mime_type,
            uploaded_by=user_id,
            project_id=project_id,
        )

        logger.info(f"Successfully processed evidence file: {file_name}, evidence_id: {result.get('evidence_id')}")

    except Exception as e:
        logger.error(f"Background processing failed for file {file_name}: {e}")


# ===== LEGACY ENDPOINTS =====

@router.post("/upload")
async def upload_evidence(
    request: Request,
    case_id: str = Form(...),
    file: UploadFile = File(...),
    description: Optional[str] = Form(None),
    tags: Optional[str] = Form(None),  # JSON string of tags
    db: Session = Depends(get_db),
    project_id: str = Depends(get_current_project_id),
    current_user: User = Depends(auth_service.get_current_user),
):
    """
    Upload and process evidence file for a case

    This endpoint:
    1. Saves the uploaded file
    2. Performs multi-modal analysis (OCR, forensics, etc.)
    3. Creates evidence record in database
    4. Indexes content for search (via processor)
    """
    try:
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

        # Virus scanning
        try:
            import clamav
            cd = clamav.ClamAV()
            scan_result = cd.scan(saved_file_path)
            if scan_result:
                # File is infected
                os.remove(saved_file_path)  # Delete infected file
                logger.warning(f"Virus detected in uploaded file {file.filename}: {scan_result}")
                raise HTTPException(
                    status_code=400,
                    detail="File contains malicious content and has been rejected"
                )
        except ImportError:
            logger.warning("ClamAV not available, skipping virus scan")
        except Exception as e:
            logger.error(f"Virus scan failed for {file.filename}: {e}")
            # In production, you might want to quarantine the file instead of rejecting
            os.remove(saved_file_path)
            raise HTTPException(
                status_code=500,
                detail="File scanning failed, upload rejected for security"
            )

        temp_file_path = saved_file_path  # usage in rest of function

        try:
            # Using process_files_batch but with single file.
            # NOTE: process_files_batch handles indexing to search and vector store
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
    project_id: str = Depends(get_current_project_id),
    current_user: User = Depends(auth_service.get_current_user),
):
    """Get saved highlights for an evidence file"""
    try:
        metadata = evidence_service.get_evidence_metadata(db, evidence_id)
        
        if metadata and isinstance(metadata, str):
            metadata = json.loads(metadata)
        elif not metadata:
             # If None, maybe evidence not found or no metadata
             # To be strict we should check if evidence exists
            raise HTTPException(status_code=404, detail="Evidence not found")

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
        metadata = evidence_service.get_evidence_metadata(db, evidence_id)
        
        if metadata is None:
             raise HTTPException(status_code=404, detail="Evidence not found")

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



@router.post("/bulk-delete", responses={
    200: {
        "description": "Bulk delete operation completed successfully",
        "content": {
            "application/json": {
                "example": {
                    "deleted_count": 3,
                    "status": "success"
                }
            }
        }
    },
    400: {
        "description": "Invalid request data",
        "content": {
            "application/json": {
                "example": {
                    "error": {
                        "type": "validation_error",
                        "status_code": 400,
                        "detail": "Invalid evidence IDs provided",
                        "request_id": "req_12345",
                        "timestamp": "2024-12-19T06:20:00Z",
                        "path": "/api/v1/evidence/bulk-delete",
                        "method": "POST",
                        "details": []
                    }
                }
            }
        }
    }
})
async def bulk_delete_evidence(
    payload: Dict[str, Any] = Body(
        ...,
        example={
            "ids": ["ev_123456", "ev_789012", "ev_345678"]
        }
    ),
    db: Session = Depends(get_db),
    current_user: User = Depends(auth_service.get_current_user),
):
    """Bulk delete evidence records and their associated files"""
    try:
        evidence_ids = payload.get("ids", [])
        count = evidence_service.delete_evidence(db, evidence_ids)
        logger.info(f"Bulk deleted {count} evidence items")
        return {"deleted_count": count, "status": "success"}
    except Exception as e:
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
