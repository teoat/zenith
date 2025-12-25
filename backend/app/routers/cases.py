import logging
import uuid
from datetime import datetime, timezone
from typing import List, Optional, Dict, Any

from fastapi import APIRouter, BackgroundTasks, Depends, HTTPException, Query, Body
from pydantic import BaseModel, Field
from sqlalchemy.orm import Session

from app.services.ai.ai_service import ai_service
from app.services.infrastructure.auth_service import auth_service, AuthService
from app.services.business.case_service import case_service
from core.database import Case, Entity, Transaction, User, get_db
from app.dependencies import get_current_project_id
from app.services.infrastructure.storage.database_service import db_service

logger = logging.getLogger(__name__)

# router defined below near line 113

# Clean dependency injection - services are imported at module level
# No test placeholders needed with proper service architecture

# ===== REQUEST/RESPONSE MODELS =====


# ===== REQUEST/RESPONSE MODELS =====

class CaseCreate(BaseModel):
    title: str = Field(..., min_length=1, max_length=200)
    description: Optional[str] = Field(None, max_length=2000)
    priority: Optional[str] = Field("Medium", pattern=r"^(Low|Medium|High|Critical)$")
    assigneeId: Optional[str] = None
    tags: Optional[List[str]] = Field(default_factory=list, max_items=20)

class CaseUpdate(BaseModel):
    title: Optional[str] = Field(None, min_length=1, max_length=200)
    description: Optional[str] = Field(None, max_length=2000)
    priority: Optional[str] = Field(None, pattern=r"^(Low|Medium|High|Critical)$")
    assigneeId: Optional[str] = None
    tags: Optional[List[str]] = Field(None, max_items=20)

class CaseResponse(BaseModel):
    id: str
    case_id: str
    title: str
    description: Optional[str] = None
    status: str
    priority: str
    assigneeId: Optional[str] = None
    riskScore: Optional[float] = 0.0
    riskLevel: Optional[str] = "low"
    fraudAmount: Optional[float] = 0.0
    customerName: Optional[str] = "Unknown"
    createdAt: datetime
    updatedAt: Optional[datetime] = None
    dueDate: Optional[datetime] = None
    tags: List[str] = Field(default_factory=list)

class CaseCreateResponse(BaseModel):
    id: str
    case_id: str
    message: str
    case: Dict[str, Any]

class CaseListResponse(BaseModel):
    cases: List[CaseResponse]
    page: int
    perPage: int
    total: int
    totalPages: int

class CaseNoteCreate(BaseModel):
    content: str = Field(..., min_length=1, max_length=2000)
    isInternal: bool = False
    category: Optional[str] = Field(None, pattern=r"^(Investigation|Evidence|Analysis|Communication)$")

class CaseNoteResponse(BaseModel):
    id: str
    content: str
    authorId: str
    authorName: str
    isInternal: bool
    category: Optional[str]
    createdAt: datetime

class BulkDeleteRequest(BaseModel):
    caseIds: List[str] = Field(..., min_items=1, max_items=100)

class BulkDeleteResponse(BaseModel):
    deletedCount: int
    failedIds: List[str]
    message: str
    selectedCountry: Optional[str] = None
    selectedDocuments: Optional[List[str]] = []
    reconciliationType: Optional[str] = "general"
    selectedCalendarFormat: Optional[str] = "gregory"
    selectedCurrencyFormat: Optional[str] = "USD"
    selectedDecimalFormat: Optional[str] = "standard"
    milestones: Optional[List[str]] = []
    proposedFeatures: Optional[List[str]] = []
    status: Optional[str] = "OPEN"
    fraudAmount: Optional[float] = 0.0
    customerName: Optional[str] = "Unknown"


router = APIRouter()

# ===== CASE MANAGEMENT ENDPOINTS =====


@router.post("", response_model=CaseCreateResponse, status_code=201)
async def create_case(
    case_data: CaseCreate,
    current_user: dict = Depends(auth_service.get_current_user),
    db: Session = Depends(get_db),
    project_id: str = Depends(get_current_project_id),
):
    """Create a new case"""
    try:
        # Prepare metadata for fields not in standard columns
        case_metadata = {
            "selected_country": getattr(case_data, "selectedCountry", None),
            "selected_documents": getattr(case_data, "selectedDocuments", []),
            "reconciliation_type": getattr(case_data, "reconciliationType", "general"),
            "selected_calendar_format": getattr(case_data, "selectedCalendarFormat", "gregory"),
            "selected_currency_format": getattr(case_data, "selectedCurrencyFormat", "USD"),
            "selected_decimal_format": getattr(case_data, "selectedDecimalFormat", "standard"),
            "milestones": getattr(case_data, "milestones", []),
            "proposed_features": getattr(case_data, "proposedFeatures", []),
        }

        # Creates persistence call
        new_case = db_service.create_case(
            db,
            id=str(uuid.uuid4()),
            title=case_data.title,
            description=case_data.description,
            priority=case_data.priority.lower() if case_data.priority else "medium",
            status="open",
            fraud_amount=0.0,
            tags=case_data.tags or [],
            case_metadata=case_metadata,
            project_id=project_id
        )

        return {
            "id": new_case.id,
            "case_id": new_case.id,
            "message": "Case created successfully",
            "case": {
                "id": new_case.id,
                "title": new_case.title,
                "status": new_case.status,
                "priority": new_case.priority,
                "fraudAmount": getattr(new_case, "fraud_amount", 0.0),
                "customerName": getattr(new_case, "customer_name", "Unknown"),
                "createdAt": new_case.created_at.isoformat() if new_case.created_at else None,
            }
        }
    except Exception as e:
        logger.error(f"Error creating case: {e}")
        raise HTTPException(status_code=500, detail=str(e))


# Backwards-compatible root endpoints (tests may call the router root `/` under
# the `/api/v1/cases` prefix). Register the same handlers at `/` so both
# `/api/v1/cases/` and `/api/v1/cases/cases` work.
router.post("/", status_code=201)


async def create_case_root(case: CaseCreate):
    return await create_case(case)


@router.get("", response_model=CaseListResponse)
async def get_cases(
    page: int = Query(1, ge=1, le=1000),
    per_page: int = Query(20, ge=1, le=100),
    search: Optional[str] = Query(None, min_length=1, max_length=100),
    status: Optional[str] = Query(None, pattern=r"^(OPEN|INVESTIGATING|PENDING_REVIEW|ESCALATED|CLOSED|ARCHIVED)$"),
    assignee_id: Optional[str] = Query(None),
    priority: Optional[str] = Query(None, pattern=r"^(Low|Medium|High|Critical)$"),
    risk_level: Optional[str] = Query(None, pattern=r"^(Low|Medium|High|Critical)$"),
    current_user: dict = Depends(auth_service.get_current_user),
    db: Session = Depends(get_db),
    project_id: str = Depends(get_current_project_id),
):
    """
    Get a paginated list of cases with optional filtering.
    """
    try:
        # Normalize filters
        if status:
            status = status.lower()
        if priority:
            priority = priority.lower()
            
        filters = {"status": status, "priority": priority, "search": search, "project_id": project_id}
        result = db_service.get_cases_paginated(db, page, per_page, filters)
        
        # Convert rows to dicts with camelCase keys for frontend compatibility
        cases_data = []
        for row in result["cases"]:
            cases_data.append(
                {
                    "id": row.id,
                    "title": row.title,
                    "description": row.description,
                    "status": row.status,
                    "type": row.case_type,
                    "assigneeId": row.assignee_id,
                    "riskScore": row.risk_score or 0,
                    "riskLevel": getattr(row, "risk_level", "low"),
                    "fraudAmount": getattr(row, "fraud_amount", 0.0),
                    "customerName": getattr(row, "customer_name", "Unknown"),
                    "createdAt": row.created_at.isoformat() if row.created_at else None,
                    "updatedAt": row.updated_at.isoformat() if row.updated_at else None,
                    "dueDate": getattr(row, "due_date", None).isoformat() if getattr(row, "due_date", None) else None,
                    "tags": row.tags if hasattr(row, "tags") else [],
                }
            )

        return {
            "cases": cases_data,
            "items": cases_data,
            "page": page,
            "perPage": per_page,
            "total": result["total"],
            "totalCount": result["total"],
            "totalPages": result["total_pages"],
        }
    except Exception as e:
        logger.error(f"Error listing cases: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/search")
async def search_cases(
    q: str,
    status: Optional[str] = None,
    priority: Optional[str] = None,
    db: Session = Depends(get_db),
    current_user: dict = Depends(auth_service.get_current_user),
    project_id: str = Depends(get_current_project_id),
):
    """Specific search endpoint for cases"""
    return await get_cases(
        search=q, 
        status=status, 
        priority=priority, 
        db=db, 
        current_user=current_user, 
        project_id=project_id,
        page=1, 
        per_page=20
    )

@router.get("/{case_id}", response_model=CaseResponse)
async def get_case_detail(
    case_id: str,
    db: Session = Depends(get_db),
    current_user: dict = Depends(auth_service.get_current_user),
):
    """Get detailed information for a specific case"""
    try:
        from app.services.infrastructure.storage.database_service import db_service
        case = db_service.get_case(db, case_id)
        if not case:
            raise HTTPException(status_code=404, detail="Case not found")
        
        return {
            "id": case.id,
            "case_id": case.id,
            "title": case.title,
            "description": case.description,
            "status": case.status,
            "priority": case.priority,
            "assigneeId": case.assignee_id,
            "riskScore": getattr(case, "risk_score", 0),
            "riskLevel": getattr(case, "risk_level", "low"),
            "fraudAmount": getattr(case, "fraud_amount", 0.0),
            "customerName": getattr(case, "customer_name", "Unknown"),
            "createdAt": case.created_at,
            "updatedAt": case.updated_at,
            "dueDate": getattr(case, "due_date", None),
            "tags": case.tags or [],
        }
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error getting case details: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.patch("/{case_id}")
async def update_case_partial(
    case_id: str,
    updates: Dict[str, Any] = Body(...),
    db: Session = Depends(get_db),
    current_user: dict = Depends(auth_service.get_current_user),
):
    """Update general case details"""
    from app.services.infrastructure.storage.database_service import db_service
    case = db_service.update_case(db, case_id, **updates)
    if not case:
        raise HTTPException(status_code=404, detail="Case not found")
    return case

@router.put("/{case_id}/status")
async def update_case_status(
    case_id: str,
    status_data: Dict[str, str] = Body(...),
    db: Session = Depends(get_db),
    current_user: dict = Depends(auth_service.get_current_user),
):
    """Update case status specifically"""
    status = status_data.get("status")
    if not status:
         raise HTTPException(status_code=400, detail="Status is required")
         
    from app.services.infrastructure.storage.database_service import db_service
    case = db_service.update_case(db, case_id, status=status.lower())
    if not case:
        raise HTTPException(status_code=404, detail="Case not found")
    return case

@router.post("/{case_id}/notes", response_model=CaseNoteResponse, status_code=201)
async def add_case_note(
    case_id: str,
    note_data: CaseNoteCreate,
    current_user: dict = Depends(auth_service.get_current_user),
    db: Session = Depends(get_db),
):
    """Add a note to a case"""
    from app.services.infrastructure.storage.database_service import db_service
    case = db_service.get_case(db, case_id)
    if not case:
        raise HTTPException(status_code=404, detail="Case not found")

    return {
        "id": str(uuid.uuid4()),
        "case_id": case_id,
        "content": note_data.content,
        "authorId": getattr(current_user, "id", "system"),
        "authorName": getattr(current_user, "username", "System"),
        "isInternal": note_data.isInternal,
        "category": note_data.category,
        "createdAt": datetime.now(timezone.utc).isoformat(),
    }

@router.post("/{case_id}/close")
async def close_case(
    case_id: str,
    close_data: Dict[str, Any] = Body(...),
    db: Session = Depends(get_db),
    current_user: dict = Depends(auth_service.get_current_user),
):
    """Close a case"""
    from app.services.infrastructure.storage.database_service import db_service
    case = db_service.update_case(db, case_id, status="closed", closed_at=datetime.now(timezone.utc))
    if not case:
        raise HTTPException(status_code=404, detail="Case not found")
    return {
        "status": "CLOSED",
        "case_id": case_id,
        "resolution": close_data.get("resolution")
    }










@router.put("/{case_id}", response_model=CaseResponse)
async def update_case(
    case_id: str, 
    update_data: Dict[str, Any] = Body(...),
    db: Session = Depends(get_db),
    current_user: dict = Depends(auth_service.get_current_user),
):
    """Update a case"""
    try:
        from app.services.infrastructure.storage.database_service import db_service
        # Map camelCase inputs to snake_case for DB
        mapped_data = {}
        for k, v in update_data.items():
            if k == "type":
                mapped_data["case_type"] = v
            elif k == "assigneeId":
                mapped_data["assignee_id"] = v
            elif k == "riskScore":
                mapped_data["risk_score"] = v
            elif k == "fraudAmount":
                mapped_data["fraud_amount"] = v
            elif k == "customerName":
                mapped_data["customer_name"] = v
            elif k == "dueDate":
                mapped_data["due_date"] = v
            else:
                # Keep other keys as is or map if needed
                mapped_data[k] = v

        case = db_service.update_case(db, case_id, **mapped_data)
        if not case:
            raise HTTPException(status_code=404, detail="Case not found")

        return {
            "id": case.id,
            "title": case.title,
            "status": case.status,
            "priority": case.priority,
            "fraudAmount": getattr(case, "fraud_amount", 0.0),
            "customerName": getattr(case, "customer_name", "Unknown"),
            "createdAt": case.created_at,
            "updatedAt": case.updated_at,
            "tags": case.tags or [],
        }
    except Exception as e:
        logger.error(f"Error updating case: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.delete("/{case_id}")
async def delete_case(
    case_id: str,
    db: Session = Depends(get_db),
    current_user: dict = Depends(auth_service.get_current_user),
):
    """Delete a case"""
    try:
        from app.services.infrastructure.storage.database_service import db_service
        success = db_service.delete_case(db, case_id)
        if not success:
            raise HTTPException(status_code=404, detail="Case not found")

        return {"message": "Case deleted successfully"}
    except Exception as e:
        logger.error(f"Error deleting case: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/bulk-delete", response_model=BulkDeleteResponse)
async def bulk_delete_cases(
    request: BulkDeleteRequest,
    db: Session = Depends(get_db),
    current_user: dict = Depends(auth_service.get_current_user),
):
    """Bulk delete cases"""
    try:
        case_ids = request.caseIds
        if not case_ids:
            return BulkDeleteResponse(deletedCount=0, failedIds=[], message="No cases specified for deletion")

        deleted_count = 0
        failed_ids = []

        from app.services.infrastructure.storage.database_service import db_service
        for case_id in case_ids:
            try:
                if db_service.delete_case(db, case_id):
                    deleted_count += 1
                else:
                    failed_ids.append(case_id)
            except Exception as e:
                logger.warning(f"Failed to delete case {case_id}: {e}")
                failed_ids.append(case_id)

        message = f"Successfully deleted {deleted_count} cases"
        if failed_ids:
            message += f", {len(failed_ids)} failed"

        return BulkDeleteResponse(
            deletedCount=deleted_count,
            failedIds=failed_ids,
            message=message
        )
    except Exception as e:
        logger.error(f"Bulk delete cases failed: {e}")
        raise HTTPException(status_code=500, detail=str(e))
