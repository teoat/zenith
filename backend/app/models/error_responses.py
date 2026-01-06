"""
Standardized Error Response Models for API consistency
"""

from datetime import datetime
from typing import Any, ClassVar

from pydantic import BaseModel


class ErrorDetail(BaseModel):
    """Detailed error information"""

    field: str | None = None
    message: str
    code: str | None = None
    details: dict[str, Any] | None = None


class APIErrorResponse(BaseModel):
    """Standardized API error response"""

    success: bool = False
    error: ErrorDetail
    timestamp: datetime
    request_id: str | None = None
    path: str | None = None

    class Config:
        json_encoders: ClassVar = {datetime: lambda v: v.isoformat()}


class ValidationErrorResponse(BaseModel):
    """Response for validation errors with multiple field errors"""

    success: bool = False
    errors: list[ErrorDetail]
    timestamp: datetime
    request_id: str | None = None
    path: str | None = None

    class Config:
        json_encoders: ClassVar = {datetime: lambda v: v.isoformat()}


class RateLimitErrorResponse(BaseModel):
    """Response for rate limiting errors"""

    success: bool = False
    error: ErrorDetail
    retry_after: int  # seconds
    timestamp: datetime
    request_id: str | None = None
    path: str | None = None

    class Config:
        json_encoders: ClassVar = {datetime: lambda v: v.isoformat()}


# Common error codes
class ErrorCodes:
    # Authentication & Authorization
    UNAUTHORIZED = "UNAUTHORIZED"
    FORBIDDEN = "FORBIDDEN"
    TOKEN_EXPIRED = "TOKEN_EXPIRED"
    INVALID_CREDENTIALS = "INVALID_CREDENTIALS"

    # Validation
    VALIDATION_ERROR = "VALIDATION_ERROR"
    MISSING_REQUIRED_FIELD = "MISSING_REQUIRED_FIELD"
    INVALID_FORMAT = "INVALID_FORMAT"

    # Business Logic
    RESOURCE_NOT_FOUND = "RESOURCE_NOT_FOUND"
    RESOURCE_ALREADY_EXISTS = "RESOURCE_ALREADY_EXISTS"
    OPERATION_NOT_ALLOWED = "OPERATION_NOT_ALLOWED"
    INSUFFICIENT_PERMISSIONS = "INSUFFICIENT_PERMISSIONS"

    # System
    INTERNAL_SERVER_ERROR = "INTERNAL_SERVER_ERROR"
    SERVICE_UNAVAILABLE = "SERVICE_UNAVAILABLE"
    DATABASE_ERROR = "DATABASE_ERROR"
    EXTERNAL_API_ERROR = "EXTERNAL_API_ERROR"

    # Rate Limiting
    RATE_LIMIT_EXCEEDED = "RATE_LIMIT_EXCEEDED"

    # File Operations
    FILE_TOO_LARGE = "FILE_TOO_LARGE"
    INVALID_FILE_TYPE = "INVALID_FILE_TYPE"
    UPLOAD_FAILED = "UPLOAD_FAILED"
