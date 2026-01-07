from typing import Any

from app.services.infrastructure.auth_service import auth_service
from app.services.infrastructure.storage.database_service import db_service
from fastapi import APIRouter, Body, Depends, HTTPException, Query

from core.api_models import (
    BulkOperationRequest,
    BulkOperationResponse,
    FilterParams,
    PaginationParams,
    PaginationResponse,
)

router = APIRouter()

# ---- Test placeholders (allow tests to patch module-level dependencies) ----
if "get_current_user" not in globals():

    def get_current_user(*args, **kwargs):
        return None


if "require_permission" not in globals():

    def require_permission(*args, **kwargs):
        def _dep(*a, **k):
            return None

        return _dep


for _svc in ("db_service", "auth_service"):
    if _svc not in globals():
        globals()[_svc] = None

# ===== USER MANAGEMENT ENDPOINTS =====


@router.put("/users/me/preferences")
async def update_user_preferences(
    preferences: dict,
    current_user: dict = Depends(auth_service.get_current_user),
):
    """Update current user preferences"""
    try:
        user_id = current_user.get("id")
        if not user_id:
            raise HTTPException(status_code=401, detail="Could not determine user ID")

        success = db_service.update_user(user_id, {"preferences": preferences})
        if not success:
            raise HTTPException(status_code=400, detail="Failed to update preferences")

        return {"status": "success", "preferences": preferences}
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.get(
    "/users",
    responses={
        200: {
            "description": "Successfully retrieved users with pagination",
            "content": {
                "application/json": {
                    "example": {
                        "users": [
                            {
                                "id": "usr_123456",
                                "username": "analyst1",
                                "email": "analyst1@company.com",
                                "full_name": "John Analyst",
                                "role": "ANALYST",
                                "department": "Fraud Detection",
                                "is_active": True,
                                "created_at": "2024-01-15T10:30:00Z",
                            }
                        ],
                        "pagination": {
                            "page": 1,
                            "page_size": 20,
                            "total_items": 1,
                            "total_pages": 1,
                            "has_next": False,
                            "has_prev": False,
                        },
                    }
                }
            },
        }
    },
)
async def get_users(
    page: int = Query(1, ge=1, description="Page number", example=1),
    page_size: int = Query(20, ge=1, le=100, description="Items per page", example=20),
    q: str | None = Query(
        None,
        description="Search query for username, email, or full name",
        example="john",
    ),
    role: str | None = Query(None, description="Filter by role", example="ANALYST"),
    department: str | None = Query(
        None, description="Filter by department", example="Fraud Detection"
    ),
    sort_by: str | None = Query(None, description="Sort field", example="username"),
    sort_order: str = Query("asc", description="Sort order (asc/desc)", example="asc"),
    status: str | None = Query(
        None, description="Filter by active status", example="active"
    ),
    current_user: dict = Depends(auth_service.get_current_user),
):
    """Get users with standardized pagination and filtering"""
    try:
        # Build filters
        filters = FilterParams(
            q=q, sort_by=sort_by, sort_order=sort_order, status=status
        )
        if role:
            filters.role = role
        if department:
            filters.department = department

        # Get paginated results
        pagination = PaginationParams(page=page, page_size=page_size)
        result = db_service.get_users_paginated(pagination, filters)

        # Build response
        users_data = [
            {
                "id": user.id,
                "username": user.username,
                "email": user.email,
                "full_name": user.full_name,
                "role": user.role if user.role else None,
                "department": user.department,
                "is_active": user.is_active,
                "created_at": user.created_at.isoformat() if user.created_at else None,
            }
            for user in result["users"]
        ]

        pagination_response = PaginationResponse.create(
            page=page, page_size=page_size, total_items=result["total"]
        )

        return {"users": users_data, "pagination": pagination_response.dict()}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.post(
    "/users/bulk",
    responses={
        200: {
            "description": "Bulk operation completed",
            "content": {
                "application/json": {
                    "example": {
                        "operation": "deactivate",
                        "total_requested": 3,
                        "successful": 2,
                        "failed": 1,
                        "errors": [{"user_id": "usr_789", "error": "User not found"}],
                    }
                }
            },
        }
    },
)
async def bulk_user_operations(
    request: BulkOperationRequest = Body(
        ...,
        example={
            "ids": ["usr_123", "usr_456", "usr_789"],
            "operation": "deactivate",
            "data": None,
        },
    ),
    current_user: dict = Depends(auth_service.get_current_user),
):
    """Perform bulk operations on users"""
    try:
        successful = 0
        errors = []

        if request.operation == "delete":
            for user_id in request.ids:
                try:
                    success = db_service.delete_user(user_id)
                    if success:
                        successful += 1
                    else:
                        errors.append(
                            {
                                "user_id": user_id,
                                "error": "User not found or delete failed",
                            }
                        )
                except Exception as e:
                    errors.append({"user_id": user_id, "error": str(e)})

        elif request.operation == "update":
            for user_id in request.ids:
                try:
                    success = db_service.update_user(user_id, request.data)
                    if success:
                        successful += 1
                    else:
                        errors.append(
                            {
                                "user_id": user_id,
                                "error": "User not found or update failed",
                            }
                        )
                except Exception as e:
                    errors.append({"user_id": user_id, "error": str(e)})

        elif request.operation == "activate":
            for user_id in request.ids:
                try:
                    success = db_service.update_user(user_id, {"is_active": True})
                    if success:
                        successful += 1
                    else:
                        errors.append(
                            {
                                "user_id": user_id,
                                "error": "User not found or activation failed",
                            }
                        )
                except Exception as e:
                    errors.append({"user_id": user_id, "error": str(e)})

        elif request.operation == "deactivate":
            for user_id in request.ids:
                try:
                    success = db_service.update_user(user_id, {"is_active": False})
                    if success:
                        successful += 1
                    else:
                        errors.append(
                            {
                                "user_id": user_id,
                                "error": "User not found or deactivation failed",
                            }
                        )
                except Exception as e:
                    errors.append({"user_id": user_id, "error": str(e)})

        else:
            raise HTTPException(
                status_code=400, detail=f"Unsupported operation: {request.operation}"
            )

        return BulkOperationResponse(
            operation=request.operation,
            total_requested=len(request.ids),
            successful=successful,
            failed=len(errors),
            errors=errors if errors else None,
        )

    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/me")
async def get_current_user(current_user: dict = Depends(auth_service.get_current_user)):
    """Get current authenticated user profile"""
    try:
        user = db_service.get_user(current_user["id"])
        if not user:
            raise HTTPException(status_code=404, detail="User not found")

        return {
            "id": user.id,
            "username": user.username,
            "email": user.email,
            "full_name": user.full_name,
            "role": user.role if user.role else None,
            "department": user.department,
            "is_active": user.is_active,
            "created_at": user.created_at.isoformat() if user.created_at else None,
            "last_login": user.last_login.isoformat() if user.last_login else None,
            "mfa_enabled": getattr(user, "mfa_enabled", False),
            "mfa_verified": getattr(user, "mfa_verified", False),
        }
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/users/{user_id}")
async def get_user(
    user_id: str,
    current_user: dict = Depends(auth_service.get_current_user),
):
    """Get user by ID"""
    try:
        user = db_service.get_user(user_id)
        if not user:
            raise HTTPException(status_code=404, detail="User not found")

        return {
            "id": user.id,
            "username": user.username,
            "email": user.email,
            "full_name": user.full_name,
            "role": user.role if user.role else None,
            "department": user.department,
            "is_active": user.is_active,
            "created_at": user.created_at.isoformat() if user.created_at else None,
            "last_login": user.last_login.isoformat() if user.last_login else None,
        }
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
