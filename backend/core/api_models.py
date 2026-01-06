# API Models for standardized responses and requests
from fastapi import Request
from pydantic import BaseModel


# Standardized API Feature Models
class PaginationParams(BaseModel):
    """Standard pagination parameters"""

    page: int = 1
    page_size: int = 20

    class Config:
        validate_assignment = True

    @property
    def offset(self) -> int:
        return (self.page - 1) * self.page_size

    @property
    def limit(self) -> int:
        return self.page_size


class PaginationResponse(BaseModel):
    """Standard pagination response metadata"""

    page: int
    page_size: int
    total_items: int
    total_pages: int
    has_next: bool
    has_prev: bool

    @classmethod
    def create(
        cls, page: int, page_size: int, total_items: int
    ) -> "PaginationResponse":
        total_pages = (total_items + page_size - 1) // page_size
        return cls(
            page=page,
            page_size=page_size,
            total_items=total_items,
            total_pages=total_pages,
            has_next=page < total_pages,
            has_prev=page > 1,
        )


class FilterParams(BaseModel):
    """Standard filtering parameters"""

    q: str | None = None  # General search query
    sort_by: str | None = None
    sort_order: str = "asc"  # "asc" or "desc"
    status: str | None = None
    date_from: str | None = None
    date_to: str | None = None


class BulkOperationRequest(BaseModel):
    """Standard bulk operation request"""

    ids: list[str]
    operation: str  # "delete", "update", "archive", etc.
    data: dict | None = None


class BulkOperationResponse(BaseModel):
    """Standard bulk operation response"""

    operation: str
    total_requested: int
    successful: int
    failed: int
    errors: list[dict] | None = None


# Standardized Error Response Models
class ErrorDetail(BaseModel):
    """Standardized error detail structure"""

    field: str | None = None
    message: str
    code: str | None = None


class ErrorResponse(BaseModel):
    """Standardized error response structure"""

    error: dict = {
        "type": "api_error",
        "status_code": 500,
        "detail": "An error occurred",
        "request_id": None,
        "timestamp": None,
        "path": None,
        "method": None,
        "details": [],
    }


def create_error_response(
    status_code: int,
    detail: str,
    error_type: str = "api_error",
    request: Request = None,
    details: list[ErrorDetail] | None = None,
) -> dict:
    """Create standardized error response"""
    from datetime import datetime

    error_response = {
        "error": {
            "type": error_type,
            "status_code": status_code,
            "detail": detail,
            "request_id": getattr(request.state, "request_id", None)
            if request
            else None,
            "timestamp": datetime.now().isoformat(),
            "path": str(request.url.path) if request else None,
            "method": request.method if request else None,
            "details": [detail.dict() for detail in details] if details else [],
        }
    }
    return error_response
