"""
Error Response Enforcement Middleware

This middleware ensures that all errors thrown by the application
are properly formatted using the standardized ErrorResponse structure.
"""

import traceback
from typing import Dict

from fastapi import HTTPException, Request, Response
from fastapi.responses import JSONResponse
from starlette.exceptions import HTTPException as StarletteHTTPException
from starlette.middleware.base import BaseHTTPMiddleware

from core.api_models import create_error_response
from core.logging import log_error


class ErrorResponseMiddleware(BaseHTTPMiddleware):
    """
    Middleware to enforce consistent error response format across the application.

    This middleware catches all exceptions and ensures they return a standardized
    error response format, regardless of where they originate in the application.
    """

    def __init__(self, app, debug: bool = False):
        super().__init__(app)
        self.debug = debug

    async def dispatch(self, request: Request, call_next):
        try:
            response = await call_next(request)

            # Check if response is already a standardized error response
            if self._is_standard_error_response(response):
                return response

            return response

        except HTTPException as exc:
            return self._handle_http_exception(request, exc)

        except StarletteHTTPException as exc:
            return self._handle_starlette_exception(request, exc)

        except Exception as exc:
            return self._handle_unexpected_exception(request, exc)

    def _is_standard_error_response(self, response: Response) -> bool:
        """Check if response is already in standard error format"""
        if not isinstance(response, JSONResponse):
            return False

        try:
            content = response.body.decode() if hasattr(response, "body") else {}
            if isinstance(content, str):
                import json

                content = json.loads(content)

            return (
                isinstance(content, dict)
                and "error" in content
                and isinstance(content["error"], dict)
                and "type" in content["error"]
                and "status_code" in content["error"]
                and "detail" in content["error"]
            )
        except (json.JSONDecodeError, AttributeError, KeyError):
            return False

    def _handle_http_exception(self, request: Request, exc: HTTPException) -> JSONResponse:
        """Handle HTTPException with standardized response"""
        # Determine error type based on status code
        error_type = self._get_error_type_from_status(exc.status_code)

        # Log the error
        log_error(
            "http_exception",
            f"HTTP {exc.status_code}: {exc.detail}",
            {
                "status_code": exc.status_code,
                "path": str(request.url.path),
                "method": request.method,
                "client_ip": request.client.host if request.client else None,
                "error_type": error_type,
            },
        )

        # Create standardized error response
        error_response = create_error_response(
            status_code=exc.status_code,
            detail=exc.detail,
            error_type=error_type,
            request=request,
        )

        return JSONResponse(status_code=exc.status_code, content=error_response, headers=self._get_security_headers())

    def _handle_starlette_exception(self, request: Request, exc: StarletteHTTPException) -> JSONResponse:
        """Handle Starlette HTTPException with standardized response"""
        error_type = self._get_error_type_from_status(exc.status_code)

        # Log the error
        log_error(
            "starlette_exception",
            f"Starlette HTTP {exc.status_code}: {exc.detail}",
            {
                "status_code": exc.status_code,
                "path": str(request.url.path),
                "method": request.method,
                "client_ip": request.client.host if request.client else None,
                "error_type": error_type,
            },
        )

        # Create standardized error response
        error_response = create_error_response(
            status_code=exc.status_code,
            detail=exc.detail,
            error_type=error_type,
            request=request,
        )

        return JSONResponse(status_code=exc.status_code, content=error_response, headers=self._get_security_headers())

    def _handle_unexpected_exception(self, request: Request, exc: Exception) -> JSONResponse:
        """Handle unexpected exceptions with standardized response"""
        # Log the full error
        error_details = {
            "type": type(exc).__name__,
            "message": str(exc),
            "traceback": traceback.format_exc(),
            "path": str(request.url.path),
            "method": request.method,
            "client_ip": request.client.host if request.client else None,
        }

        log_error("unexpected_error", f"Unexpected error: {exc!s}", error_details)

        # Determine error response based on debug mode
        if self.debug:
            # Show full details in development
            detail = f"Internal server error: {exc!s}"
            error_response = create_error_response(
                status_code=500,
                detail=detail,
                error_type="unexpected_error",
                request=request,
            )

            # Add debug information
            if isinstance(error_response, dict) and "error" in error_response:
                error_response["error"]["debug"] = {
                    "exception_type": type(exc).__name__,
                    "traceback": traceback.format_exc(),
                }
        else:
            # Hide internal details in production
            error_response = create_error_response(
                status_code=500,
                detail="Internal server error",
                error_type="internal_server_error",
                request=request,
            )

        return JSONResponse(status_code=500, content=error_response, headers=self._get_security_headers())

    def _get_error_type_from_status(self, status_code: int) -> str:
        """Map HTTP status codes to error types"""
        error_mapping = {
            400: "bad_request",
            401: "unauthorized",
            403: "forbidden",
            404: "not_found",
            405: "method_not_allowed",
            409: "conflict",
            422: "validation_error",
            429: "rate_limit_exceeded",
            500: "internal_server_error",
            502: "bad_gateway",
            503: "service_unavailable",
            504: "gateway_timeout",
        }
        return error_mapping.get(status_code, "http_error")

    def _get_security_headers(self) -> Dict[str, str]:
        """Get security headers for error responses"""
        return {
            "X-Content-Type-Options": "nosniff",
            "X-Frame-Options": "DENY",
            "X-XSS-Protection": "1; mode=block",
            "Cache-Control": "no-store, no-cache, must-revalidate",
            "Pragma": "no-cache",
        }


class ValidationErrorMiddleware(BaseHTTPMiddleware):
    """
    Specialized middleware for handling validation errors from Pydantic models.
    Ensures consistent error format for request validation failures.
    """

    async def dispatch(self, request: Request, call_next):
        try:
            response = await call_next(request)
            return response
        except Exception as exc:
            # Check if this is a validation error
            if self._is_validation_error(exc):
                return self._handle_validation_error(request, exc)
            # Let other errors be handled by the main error middleware
            raise

    def _is_validation_error(self, exc: Exception) -> bool:
        """Check if exception is a validation error"""
        from fastapi import RequestValidationError
        from pydantic import ValidationError

        return isinstance(exc, (ValidationError, RequestValidationError))

    def _handle_validation_error(self, request: Request, exc: Exception) -> JSONResponse:
        """Handle validation errors with detailed response"""
        from fastapi import RequestValidationError
        from pydantic import ValidationError

        # Extract validation details
        if isinstance(exc, ValidationError):
            validation_details = [
                {
                    "field": ".".join(str(x) for x in loc),
                    "message": msg,
                    "type": error_type,
                }
                for loc, msg, error_type in exc.errors()
            ]
        elif isinstance(exc, RequestValidationError):
            validation_details = [
                {
                    "field": ".".join(str(x) for x in loc),
                    "message": msg,
                    "type": error_type,
                }
                for loc, msg, error_type in exc.errors()
            ]
        else:
            validation_details = [
                {
                    "field": "unknown",
                    "message": str(exc),
                    "type": "validation_error",
                }
            ]

        # Log validation error
        log_error(
            "validation_error",
            f"Request validation failed: {exc!s}",
            {
                "path": str(request.url.path),
                "method": request.method,
                "validation_errors": validation_details,
                "client_ip": request.client.host if request.client else None,
            },
        )

        # Create standardized error response
        error_response = create_error_response(
            status_code=422,
            detail="Request validation failed",
            error_type="validation_error",
            request=request,
            details=validation_details,
        )

        return JSONResponse(status_code=422, content=error_response, headers=self._get_security_headers())

    def _get_security_headers(self) -> Dict[str, str]:
        """Get security headers for validation error responses"""
        return {
            "X-Content-Type-Options": "nosniff",
            "X-Frame-Options": "DENY",
            "X-XSS-Protection": "1; mode=block",
        }


class BusinessErrorMiddleware(BaseHTTPMiddleware):
    """
    Middleware for handling business logic errors with proper HTTP mapping.

    This middleware catches custom business exceptions and maps them to
    appropriate HTTP responses with standardized error format.
    """

    def __init__(self, app):
        super().__init__(app)
        self._business_error_mapping = {
            "UserNotFoundError": (404, "user_not_found", "User not found"),
            "InvalidCredentialsError": (401, "invalid_credentials", "Invalid credentials"),
            "AccountLockedError": (423, "account_locked", "Account is locked"),
            "InsufficientPermissionsError": (403, "insufficient_permissions", "Insufficient permissions"),
            "ResourceNotFoundError": (404, "resource_not_found", "Resource not found"),
            "ResourceConflictError": (409, "resource_conflict", "Resource conflict"),
            "BusinessRuleViolationError": (422, "business_rule_violation", "Business rule violation"),
            "RateLimitExceededError": (429, "rate_limit_exceeded", "Rate limit exceeded"),
            "ServiceUnavailableError": (503, "service_unavailable", "Service temporarily unavailable"),
        }

    async def dispatch(self, request: Request, call_next):
        try:
            response = await call_next(request)
            return response
        except Exception as exc:
            # Check if this is a known business error
            error_name = type(exc).__name__
            if error_name in self._business_error_mapping:
                return self._handle_business_error(request, exc, error_name)
            # Let other errors be handled by other middleware
            raise

    def _handle_business_error(self, request: Request, exc: Exception, error_name: str) -> JSONResponse:
        """Handle known business errors with standardized response"""
        status_code, error_type, default_message = self._business_error_mapping[error_name]

        # Use exception message if available, otherwise use default
        detail = str(exc) if str(exc) else default_message

        # Log business error
        log_error(
            "business_error",
            f"Business error: {error_name} - {detail}",
            {
                "error_name": error_name,
                "status_code": status_code,
                "path": str(request.url.path),
                "method": request.method,
                "client_ip": request.client.host if request.client else None,
            },
        )

        # Create standardized error response
        error_response = create_error_response(
            status_code=status_code,
            detail=detail,
            error_type=error_type,
            request=request,
        )

        return JSONResponse(status_code=status_code, content=error_response, headers=self._get_security_headers())

    def _get_security_headers(self) -> Dict[str, str]:
        """Get security headers for business error responses"""
        return {
            "X-Content-Type-Options": "nosniff",
            "X-Frame-Options": "DENY",
            "X-XSS-Protection": "1; mode=block",
        }


def setup_error_enforcement_middleware(app, debug: bool = False):
    """
    Setup all error enforcement middleware in the correct order.

    The middleware should be applied in this order:
    1. BusinessErrorMiddleware (first, for specific business errors)
    2. ValidationErrorMiddleware (for validation errors)
    3. ErrorResponseMiddleware (last, catch-all for all other errors)
    """
    from app.exceptions import setup_exception_handlers

    # First, setup the existing exception handlers
    setup_exception_handlers(app)

    # Then add our enforcement middleware
    app.add_middleware(BusinessErrorMiddleware)
    app.add_middleware(ValidationErrorMiddleware)
    app.add_middleware(ErrorResponseMiddleware, debug=debug)


# Export middleware classes
__all__ = [
    "ErrorResponseMiddleware",
    "ValidationErrorMiddleware",
    "BusinessErrorMiddleware",
    "setup_error_enforcement_middleware",
]
