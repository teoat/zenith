"""
Error handling middleware for consistent API error responses
"""

import logging
import uuid
from datetime import datetime

from app.models.error_responses import (
    APIErrorResponse,
    ErrorCodes,
    ErrorDetail,
    ValidationErrorResponse,
)
from fastapi import HTTPException, Request
from fastapi.responses import JSONResponse
from pydantic import ValidationError
from starlette.middleware.base import BaseHTTPMiddleware

logger = logging.getLogger(__name__)


class StandardizedErrorMiddleware(BaseHTTPMiddleware):
    """Middleware to standardize error responses across all endpoints"""

    async def dispatch(self, request: Request, call_next):
        try:
            response = await call_next(request)
            return response
        except Exception as exc:
            return await self._handle_exception(request, exc)

    async def _handle_exception(self, request: Request, exc: Exception) -> JSONResponse:
        """Handle exceptions and return standardized error responses"""

        # Generate request ID for tracking
        request_id = str(uuid.uuid4())

        # Log the error
        logger.error(
            f"Request error: {request.method} {request.url.path}",
            extra={
                "request_id": request_id,
                "method": request.method,
                "path": request.url.path,
                "user_agent": request.headers.get("user-agent"),
                "error_type": type(exc).__name__,
                "error_message": str(exc),
            },
            exc_info=True,
        )

        # Handle different exception types
        if isinstance(exc, HTTPException):
            return self._handle_http_exception(exc, request_id, request.url.path)
        elif isinstance(exc, ValidationError):
            return self._handle_validation_error(exc, request_id, request.url.path)
        else:
            return self._handle_generic_error(exc, request_id, request.url.path)

    def _handle_http_exception(
        self, exc: HTTPException, request_id: str, path: str
    ) -> JSONResponse:
        """Handle FastAPI HTTPException"""

        # Map HTTP status codes to error codes
        error_code_map = {
            400: ErrorCodes.VALIDATION_ERROR,
            401: ErrorCodes.UNAUTHORIZED,
            403: ErrorCodes.FORBIDDEN,
            404: ErrorCodes.RESOURCE_NOT_FOUND,
            409: ErrorCodes.RESOURCE_ALREADY_EXISTS,
            422: ErrorCodes.VALIDATION_ERROR,
            429: ErrorCodes.RATE_LIMIT_EXCEEDED,
            500: ErrorCodes.INTERNAL_SERVER_ERROR,
            503: ErrorCodes.SERVICE_UNAVAILABLE,
        }

        error_code = error_code_map.get(
            exc.status_code, ErrorCodes.INTERNAL_SERVER_ERROR
        )

        error_detail = ErrorDetail(
            message=str(exc.detail),
            code=error_code,
        )

        error_response = APIErrorResponse(
            error=error_detail,
            timestamp=datetime.now(),
            request_id=request_id,
            path=path,
        )

        return JSONResponse(
            status_code=exc.status_code,
            content=error_response.dict(),
        )

    def _handle_validation_error(
        self, exc: ValidationError, request_id: str, path: str
    ) -> JSONResponse:
        """Handle Pydantic validation errors"""

        error_details = []
        for error in exc.errors():
            field_path = ".".join(str(loc) for loc in error["loc"])
            error_details.append(
                ErrorDetail(
                    field=field_path,
                    message=error["msg"],
                    code=ErrorCodes.VALIDATION_ERROR,
                    details={"validation_error": error},
                )
            )

        error_response = ValidationErrorResponse(
            errors=error_details,
            timestamp=datetime.now(),
            request_id=request_id,
            path=path,
        )

        return JSONResponse(
            status_code=422,
            content=error_response.dict(),
        )

    def _handle_generic_error(
        self, exc: Exception, request_id: str, path: str
    ) -> JSONResponse:
        """Handle unexpected errors"""

        # Don't expose internal error details in production
        error_message = "An unexpected error occurred"
        if __debug__:  # Only show details in debug mode
            error_message = str(exc)

        error_detail = ErrorDetail(
            message=error_message,
            code=ErrorCodes.INTERNAL_SERVER_ERROR,
            details={"exception_type": type(exc).__name__} if __debug__ else None,
        )

        error_response = APIErrorResponse(
            error=error_detail,
            timestamp=datetime.now(),
            request_id=request_id,
            path=path,
        )

        return JSONResponse(
            status_code=500,
            content=error_response.dict(),
        )
