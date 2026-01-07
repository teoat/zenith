"""
Standardized Exception Hierarchy for Zenith API
Provides consistent error handling across all endpoints
"""

import inspect
import logging
from enum import Enum
from functools import wraps
from typing import Any

from fastapi import HTTPException, status

logger = logging.getLogger(__name__)


class ErrorCategory(Enum):
    """Categorizes different types of errors for consistent handling"""

    VALIDATION = "validation"
    AUTHENTICATION = "authentication"
    AUTHORIZATION = "authorization"
    BUSINESS_LOGIC = "business_logic"
    EXTERNAL_SERVICE = "external_service"
    DATABASE = "database"
    FILESYSTEM = "filesystem"
    NETWORK = "network"
    CONFIGURATION = "configuration"
    SECURITY = "security"


def handle_exceptions(func_name: str, category: ErrorCategory = ErrorCategory.BUSINESS_LOGIC):
    """
    Decorator for standardized exception handling

    Usage:
    @handle_exceptions("fraud_detection", ErrorCategory.EXTERNAL_SERVICE)
    async def detect_fraud(data):
        # Function logic here
        pass
    """

    def decorator(func):
        @wraps(func)
        async def async_wrapper(*args, **kwargs):
            try:
                return await func(*args, **kwargs)
            except APIException:
                # Re-raise our API exceptions as-is
                raise
            except ValueError as e:
                # Convert common exceptions to our types
                raise ValidationError(str(e)) from e
            except PermissionError as e:
                raise PermissionError(str(e)) from e
            except ConnectionError as e:
                raise ServiceUnavailableError("external") from e
            except FileNotFoundError as e:
                raise APIException(status.HTTP_404_NOT_FOUND, f"File not found: {e!s}") from e
            except Exception as e:
                # Log unexpected errors and convert to generic API exception
                logger.error(f"Unexpected error in {func_name}: {e}", exc_info=True)
                raise APIException(
                    status.HTTP_500_INTERNAL_SERVER_ERROR,
                    f"An unexpected error occurred in {func_name}",
                    "INTERNAL_ERROR",
                    {"operation": func_name, "error_type": type(e).__name__},
                ) from e

        def sync_wrapper(*args, **kwargs):
            try:
                return func(*args, **kwargs)
            except APIException:
                raise
            except ValueError as e:
                raise ValidationError(str(e)) from e
            except PermissionError as e:
                raise PermissionError(str(e)) from e
            except ConnectionError as e:
                raise ServiceUnavailableError("external") from e
            except FileNotFoundError as e:
                raise APIException(status.HTTP_404_NOT_FOUND, f"File not found: {e!s}") from e
            except Exception as e:
                logger.error(f"Unexpected error in {func_name}: {e}", exc_info=True)
                raise APIException(
                    status.HTTP_500_INTERNAL_SERVER_ERROR,
                    f"An unexpected error occurred in {func_name}",
                    "INTERNAL_ERROR",
                    {"operation": func_name, "error_type": type(e).__name__},
                ) from e

        # Return appropriate wrapper based on function type
        if inspect.iscoroutinefunction(func):
            return async_wrapper
        else:
            return sync_wrapper

    return decorator


class APIException(HTTPException):
    """Base exception for all API errors"""

    def __init__(
        self,
        status_code: int,
        detail: str,
        error_code: str | None = None,
        metadata: dict[str, Any] | None = None,
    ):
        super().__init__(status_code=status_code, detail=detail)
        self.error_code = error_code or self.__class__.__name__
        self.metadata = metadata or {}

        # Log all API exceptions
        logger.warning(
            f"API Exception: {self.error_code}",
            extra={"status_code": status_code, "detail": detail, "metadata": metadata},
        )


# Authentication & Authorization Errors


class AuthenticationError(APIException):
    """Invalid or missing authentication"""

    def __init__(self, detail: str = "Authentication required", metadata: dict | None = None):
        super().__init__(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail=detail,
            error_code="AUTHENTICATION_REQUIRED",
            metadata=metadata,
        )


class InvalidTokenError(AuthenticationError):
    """Invalid JWT token"""

    def __init__(self, detail: str = "Invalid or expired token"):
        super().__init__(detail=detail, metadata={"error_code": "INVALID_TOKEN"})


class PermissionError(APIException):
    """Insufficient permissions"""

    def __init__(
        self,
        detail: str = "Insufficient permissions",
        required_role: str | None = None,
    ):
        metadata = {"required_role": required_role} if required_role else {}
        super().__init__(
            status_code=status.HTTP_403_FORBIDDEN,
            detail=detail,
            error_code="PERMISSION_DENIED",
            metadata=metadata,
        )


# Resource Errors


class ResourceNotFoundError(APIException):
    """Resource not found"""

    def __init__(self, resource_type: str, resource_id: Any):
        super().__init__(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"{resource_type} not found",
            error_code="RESOURCE_NOT_FOUND",
            metadata={"resource_type": resource_type, "resource_id": str(resource_id)},
        )


class ResourceAlreadyExistsError(APIException):
    """Resource already exists"""

    def __init__(self, resource_type: str, identifier: str):
        super().__init__(
            status_code=status.HTTP_409_CONFLICT,
            detail=f"{resource_type} already exists",
            error_code="RESOURCE_EXISTS",
            metadata={"resource_type": resource_type, "identifier": identifier},
        )


# Validation Errors


class ValidationError(APIException):
    """Input validation failed"""

    def __init__(self, detail: str, field: str | None = None):
        metadata = {"field": field} if field else {}
        super().__init__(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail=detail,
            error_code="VALIDATION_ERROR",
            metadata=metadata,
        )


class BusinessRuleViolation(APIException):
    """Business rule validation failed"""

    def __init__(self, detail: str, rule: str | None = None):
        metadata = {"rule": rule} if rule else {}
        super().__init__(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=detail,
            error_code="BUSINESS_RULE_VIOLATION",
            metadata=metadata,
        )


# Service Errors


class ServiceUnavailableError(APIException):
    """External service unavailable"""

    def __init__(self, service_name: str, detail: str | None = None):
        super().__init__(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail=detail or f"{service_name} service unavailable",
            error_code="SERVICE_UNAVAILABLE",
            metadata={"service": service_name},
        )


class DatabaseError(APIException):
    """Database operation failed"""

    def __init__(self, operation: str, detail: str | None = None):
        super().__init__(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=detail or f"Database {operation} failed",
            error_code="DATABASE_ERROR",
            metadata={"operation": operation},
        )


# Rate Limiting


class RateLimitExceededError(APIException):
    """Rate limit exceeded"""

    def __init__(self, retry_after: int | None = None):
        super().__init__(
            status_code=status.HTTP_429_TOO_MANY_REQUESTS,
            detail="Rate limit exceeded. Please try again later.",
            error_code="RATE_LIMIT_EXCEEDED",
            metadata={"retry_after_seconds": retry_after},
        )


# Context Managers for standardized error handling


class handle_api_errors:
    """Context manager to catch and convert exceptions to API exceptions"""

    def __init__(self, operation: str = "Operation"):
        self.operation = operation

    def __enter__(self):
        return self

    def __exit__(self, exc_type, exc_val, exc_tb):
        if exc_type is None:
            return True

        # Already an APIException, re-raise
        if isinstance(exc_val, APIException):
            return False

        # Convert common exceptions
        if exc_type.__name__ == "IntegrityError":
            raise DatabaseError("create", f"Integrity constraint violation during {self.operation}")

        if exc_type.__name__ == "OperationalError":
            raise DatabaseError("query", f"Database error during {self.operation}")

        # Log and raise generic API exception
        logger.error(f"Unhandled exception during {self.operation}: {exc_val}", exc_info=True)
        raise APIException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Internal error during {self.operation}",
            error_code="INTERNAL_ERROR",
            metadata={"operation": self.operation, "error_type": exc_type.__name__},
        )


# Convenience functions


def require_resource(resource: Any, resource_type: str, resource_id: Any):
    """Raise ResourceNotFoundError if resource is None"""
    if resource is None:
        raise ResourceNotFoundError(resource_type, resource_id)
    return resource


def require_field(value: Any, field_name: str):
    """Raise ValidationError if value is None or empty"""
    if value is None or (isinstance(value, str) and not value.strip()):
        raise ValidationError(f"{field_name} is required", field=field_name)
    return value
