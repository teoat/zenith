"""Input validation and sanitization middleware with Pydantic models"""

import html
import re
from enum import Enum
from typing import Annotated, Any

from fastapi import HTTPException, Request
from pydantic import (
    AfterValidator,
    BaseModel,
    Field,
    ValidationInfo,
    constr,
    field_validator,
)
from starlette.middleware.base import BaseHTTPMiddleware

from core.logging import logger


class InputValidationMiddleware(BaseHTTPMiddleware):
    """Middleware to validate and sanitize input"""

    # Maximum request size (10MB)
    MAX_REQUEST_SIZE = 10 * 1024 * 1024

    # Patterns for detecting potential attacks
    SQL_INJECTION_PATTERN = re.compile(
        r"(\b(SELECT|INSERT|UPDATE|DELETE|DROP|CREATE|ALTER|EXEC|UNION|SCRIPT|OR\s+1\s*=\s*1|--)\b)",
        re.IGNORECASE,
    )

    XSS_PATTERN = re.compile(
        r"(<script|javascript:|onerror=|onload=|<iframe|<embed|<object)", re.IGNORECASE
    )

    # Path traversal detection
    PATH_TRAVERSAL_PATTERN = re.compile(
        r"(\.\./|\.\.\\|%2e%2e%2f|%2e%2e/|\.\.%2f|%2e%2e%5c)", re.IGNORECASE
    )

    # Command injection detection
    COMMAND_INJECTION_PATTERN = re.compile(
        r"([;&|`$]\s*(cat|ls|rm|chmod|wget|curl|nc|bash|sh|python|perl|ruby|php))",
        re.IGNORECASE,
    )

    # File upload validation
    ALLOWED_CONTENT_TYPES = {
        "application/json",
        "application/pdf",
        "image/jpeg",
        "image/png",
        "image/gif",
        "video/mp4",
        "audio/mpeg",
        "text/plain",
        "text/csv",
    }

    async def dispatch(self, request: Request, call_next):
        # Check request size
        content_length = request.headers.get("content-length")
        if content_length and int(content_length) > self.MAX_REQUEST_SIZE:
            logger.warning(
                "Request size exceeded",
                extra={
                    "path": str(request.url.path),
                    "size": content_length,
                    "max_size": self.MAX_REQUEST_SIZE,
                    "client_ip": request.client.host if request.client else None,
                },
            )
            raise HTTPException(
                status_code=413,
                detail=f"Request too large. Maximum size: {self.MAX_REQUEST_SIZE / 1024 / 1024}MB",
            )

        # Validate content type for file uploads
        content_type = request.headers.get("content-type", "").split(";")[0].strip()
        if request.method in ["POST", "PUT", "PATCH"] and content_type:
            if "multipart/form-data" in content_type:
                # Allow multipart for file uploads, will validate individual parts
                pass
            elif (
                content_type not in self.ALLOWED_CONTENT_TYPES
                and content_type != "application/x-www-form-urlencoded"
            ):
                logger.warning(
                    "Invalid content type",
                    extra={
                        "path": str(request.url.path),
                        "content_type": content_type,
                        "client_ip": request.client.host if request.client else None,
                    },
                )
                raise HTTPException(
                    status_code=415, detail=f"Unsupported content type: {content_type}"
                )

        # Get request body for POST/PUT/PATCH
        if request.method in ["POST", "PUT", "PATCH"]:
            try:
                body = await request.body()
                body_str = body.decode("utf-8")

                # Check for SQL injection patterns
                if self.SQL_INJECTION_PATTERN.search(body_str):
                    logger.error(
                        "SQL injection attempt detected",
                        extra={
                            "path": str(request.url.path),
                            "method": request.method,
                            "client_ip": (
                                request.client.host if request.client else None
                            ),
                        },
                    )
                    raise HTTPException(
                        status_code=400,
                        detail="Invalid input: Potential SQL injection detected",
                    )

                # Check for XSS patterns
                if self.XSS_PATTERN.search(body_str):
                    logger.error(
                        "XSS attempt detected",
                        extra={
                            "path": str(request.url.path),
                            "method": request.method,
                            "client_ip": (
                                request.client.host if request.client else None
                            ),
                        },
                    )
                    raise HTTPException(
                        status_code=400, detail="Invalid input: Potential XSS detected"
                    )

                # Check for path traversal
                if self.PATH_TRAVERSAL_PATTERN.search(body_str):
                    logger.error(
                        "Path traversal attempt detected",
                        extra={
                            "path": str(request.url.path),
                            "method": request.method,
                            "client_ip": (
                                request.client.host if request.client else None
                            ),
                        },
                    )
                    raise HTTPException(
                        status_code=400, detail="Invalid input: Path traversal detected"
                    )

                # Check for command injection
                if self.COMMAND_INJECTION_PATTERN.search(body_str):
                    logger.error(
                        "Command injection attempt detected",
                        extra={
                            "path": str(request.url.path),
                            "method": request.method,
                            "client_ip": (
                                request.client.host if request.client else None
                            ),
                        },
                    )
                    raise HTTPException(
                        status_code=400,
                        detail="Invalid input: Command injection detected",
                    )

            except UnicodeDecodeError:
                pass  # Binary data, skip validation

        # Check query parameters for attacks
        query_string = str(request.url.query)
        if query_string:
            if self.SQL_INJECTION_PATTERN.search(query_string):
                logger.error(
                    "SQL injection in query parameters",
                    extra={"path": str(request.url.path), "query": query_string},
                )
                raise HTTPException(status_code=400, detail="Invalid query parameters")

            if self.PATH_TRAVERSAL_PATTERN.search(query_string):
                logger.error(
                    "Path traversal in query parameters",
                    extra={"path": str(request.url.path), "query": query_string},
                )
                raise HTTPException(status_code=400, detail="Invalid query parameters")

        response = await call_next(request)
        return response


def sanitize_string(value: str, max_length: int = 1000) -> str:
    """Sanitize string input by escaping HTML and enforcing max length.

    Tests expect HTML entities to be escaped and single quotes converted
    to the HTML entity `&#x27;`.
    """
    if not isinstance(value, str):
        raise ValidationError("Input must be a string")

    # Limit length first
    if len(value) > max_length:
        value = value[:max_length]

    # Escape HTML (this converts <, >, &, etc.)
    escaped = html.escape(value)

    # Convert single quotes to the expected HTML entity
    escaped = escaped.replace("'", "&#x27;")

    return escaped


def validate_filename(filename: str) -> bool:
    """Validate uploaded filename"""
    # No path traversal
    if ".." in filename or "/" in filename or "\\" in filename:
        return False

    # Reasonable length
    if len(filename) > 255:
        return False

    # Allowed characters only
    return re.match(r"^[a-zA-Z0-9._-]+$", filename)


# Pydantic Models for API Input Validation
class ValidationError(Exception):
    """Custom exception for validation errors"""


class UserRole(str, Enum):
    ANALYST = "ANALYST"
    SENIOR_INVESTIGATOR = "SENIOR_INVESTIGATOR"
    ADMIN = "ADMIN"


class CaseStatus(str, Enum):
    OPEN = "open"
    CLOSED = "closed"
    UNDER_REVIEW = "under_review"


# Common validation patterns
SAFE_STRING_PATTERN = re.compile(r"^[a-zA-Z0-9\s\-_\.,!?()]+$")
EMAIL_PATTERN = re.compile(r"^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$")
UUID_PATTERN = re.compile(
    r"^[a-f0-9]{8}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{12}$"
)


def validate_safe_string(v: str) -> str:
    if not isinstance(v, str):
        raise ValueError("String required")
    if not SAFE_STRING_PATTERN.match(v):
        raise ValueError("String contains unsafe characters")
    return v


SafeString = Annotated[str, AfterValidator(validate_safe_string)]


def validate_email(v: str) -> str:
    if not isinstance(v, str):
        raise ValueError("String required")
    if not EMAIL_PATTERN.match(v):
        raise ValueError("Invalid email format")
    return v


EmailStr = Annotated[str, AfterValidator(validate_email)]


def validate_uuid(v: str) -> str:
    if not isinstance(v, str):
        raise ValueError("String required")
    if not UUID_PATTERN.match(v):
        raise ValueError("Invalid UUID format")
    return v


UUIDStr = Annotated[str, AfterValidator(validate_uuid)]


# API Input Models
class UserCreateRequest(BaseModel):
    username: constr(min_length=3, max_length=50) = Field(..., description="Username")
    email: EmailStr = Field(..., description="Email address")
    password: constr(min_length=8, max_length=128) = Field(..., description="Password")
    role: UserRole = Field(default=UserRole.ANALYST, description="User role")

    @field_validator("username")
    def username_alphanumeric(self, v):
        if not re.match(r"^[a-zA-Z0-9_-]+$", v):
            raise ValueError(
                "Username must be alphanumeric with underscores and hyphens only"
            )
        return v


class UserLoginRequest(BaseModel):
    username: SafeString = Field(..., description="Username")
    password: str = Field(..., description="Password")


class CaseCreateRequest(BaseModel):
    title: constr(min_length=1, max_length=200) = Field(..., description="Case title")
    description: constr(max_length=2000) | None = Field(
        None, description="Case description"
    )
    assigned_to: UUIDStr | None = Field(None, description="Assigned user ID")


class CaseUpdateRequest(BaseModel):
    title: constr(min_length=1, max_length=200) | None = Field(
        None, description="Case title"
    )
    description: constr(max_length=2000) | None = Field(
        None, description="Case description"
    )
    status: CaseStatus | None = Field(None, description="Case status")
    assigned_to: UUIDStr | None = Field(None, description="Assigned user ID")


class EvidenceUploadRequest(BaseModel):
    case_id: UUIDStr = Field(..., description="Case ID")
    filename: constr(min_length=1, max_length=255) = Field(
        ..., description="Original filename"
    )
    file_type: SafeString = Field(..., description="MIME type")
    size_bytes: int = Field(
        ..., ge=0, le=100 * 1024 * 1024, description="File size in bytes"
    )  # Max 100MB

    @field_validator("file_type")
    def validate_file_type(self, v):
        allowed_types = [
            "application/pdf",
            "image/jpeg",
            "image/png",
            "image/gif",
            "image/bmp",
            "text/plain",
            "application/msword",
            "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
            "video/mp4",
            "audio/mpeg",
        ]
        if v not in allowed_types:
            raise ValueError(f"File type {v} not allowed")
        return v


class SearchRequest(BaseModel):
    query: constr(min_length=1, max_length=500) = Field(..., description="Search query")
    case_id: UUIDStr | None = Field(None, description="Filter by case ID")
    limit: int = Field(default=20, ge=1, le=100, description="Result limit")
    offset: int = Field(default=0, ge=0, description="Result offset")


class TransactionFilterRequest(BaseModel):
    case_id: UUIDStr | None = Field(None, description="Case ID")
    start_date: str | None = Field(None, description="Start date (ISO format)")
    end_date: str | None = Field(None, description="End date (ISO format)")
    min_amount: float | None = Field(None, ge=0, description="Minimum amount")
    max_amount: float | None = Field(None, ge=0, description="Maximum amount")
    flagged_only: bool = Field(default=False, description="Only flagged transactions")

    @field_validator("end_date")
    @classmethod
    def validate_date_range(cls, v, info: ValidationInfo):
        if v and info.data.get("start_date") and v < info.data["start_date"]:
            raise ValueError("End date must be after start date")
        return v


def validate_input(data: dict[str, Any], model_class) -> dict[str, Any]:
    """
    Validate input data against a Pydantic model.
    Raises ValidationError on validation failure.
    """
    try:
        model = model_class(**data)
        return model.dict()
    except Exception as e:
        raise ValidationError(f"Input validation failed: {e!s}")


# Note: function `sanitize_string` above is the canonical implementation used by tests.
