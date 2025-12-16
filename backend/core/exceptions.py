"""
Standardized Exception Hierarchy for 378x492 API
Provides consistent error handling across all endpoints
"""

from typing import Optional, Dict, Any
from fastapi import HTTPException, status
import logging

logger = logging.getLogger(__name__)


class APIException(HTTPException):
    """Base exception for all API errors"""
    
    def __init__(
        self,
        status_code: int,
        detail: str,
        error_code: Optional[str] = None,
        metadata: Optional[Dict[str, Any]] = None
    ):
        super().__init__(status_code=status_code, detail=detail)
        self.error_code = error_code or self.__class__.__name__
        self.metadata = metadata or {}
        
        # Log all API exceptions
        logger.warning(
            f"API Exception: {self.error_code}",
            extra={
                "status_code": status_code,
                "detail": detail,
                "metadata": metadata
            }
        )


# Authentication & Authorization Errors

class AuthenticationError(APIException):
    """Invalid or missing authentication"""
    def __init__(self, detail: str = "Authentication required", metadata: Optional[Dict] = None):
        super().__init__(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail=detail,
            error_code="AUTHENTICATION_REQUIRED",
            metadata=metadata
        )


class InvalidTokenError(AuthenticationError):
    """Invalid JWT token"""
    def __init__(self, detail: str = "Invalid or expired token"):
        super().__init__(
            detail=detail,
            metadata={"error_code": "INVALID_TOKEN"}
        )


class PermissionError(APIException):
    """Insufficient permissions"""
    def __init__(self, detail: str = "Insufficient permissions", required_role: Optional[str] = None):
        metadata = {"required_role": required_role} if required_role else {}
        super().__init__(
            status_code=status.HTTP_403_FORBIDDEN,
            detail=detail,
            error_code="PERMISSION_DENIED",
            metadata=metadata
        )


# Resource Errors

class ResourceNotFoundError(APIException):
    """Resource not found"""
    def __init__(self, resource_type: str, resource_id: Any):
        super().__init__(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"{resource_type} not found",
            error_code="RESOURCE_NOT_FOUND",
            metadata={"resource_type": resource_type, "resource_id": str(resource_id)}
        )


class ResourceAlreadyExistsError(APIException):
    """Resource already exists"""
    def __init__(self, resource_type: str, identifier: str):
        super().__init__(
            status_code=status.HTTP_409_CONFLICT,
            detail=f"{resource_type} already exists",
            error_code="RESOURCE_EXISTS",
            metadata={"resource_type": resource_type, "identifier": identifier}
        )


# Validation Errors

class ValidationError(APIException):
    """Input validation failed"""
    def __init__(self, detail: str, field: Optional[str] = None):
        metadata = {"field": field} if field else {}
        super().__init__(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail=detail,
            error_code="VALIDATION_ERROR",
            metadata=metadata
        )


class BusinessRuleViolation(APIException):
    """Business rule validation failed"""
    def __init__(self, detail: str, rule: Optional[str] = None):
        metadata = {"rule": rule} if rule else {}
        super().__init__(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=detail,
            error_code="BUSINESS_RULE_VIOLATION",
            metadata=metadata
        )


# Service Errors

class ServiceUnavailableError(APIException):
    """External service unavailable"""
    def __init__(self, service_name: str, detail: Optional[str] = None):
        super().__init__(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail=detail or f"{service_name} service unavailable",
            error_code="SERVICE_UNAVAILABLE",
            metadata={"service": service_name}
        )


class DatabaseError(APIException):
    """Database operation failed"""
    def __init__(self, operation: str, detail: Optional[str] = None):
        super().__init__(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=detail or f"Database {operation} failed",
            error_code="DATABASE_ERROR",
            metadata={"operation": operation}
        )


# Rate Limiting

class RateLimitExceededError(APIException):
    """Rate limit exceeded"""
    def __init__(self, retry_after: Optional[int] = None):
        super().__init__(
            status_code=status.HTTP_429_TOO_MANY_REQUESTS,
            detail="Rate limit exceeded. Please try again later.",
            error_code="RATE_LIMIT_EXCEEDED",
            metadata={"retry_after_seconds": retry_after}
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
            metadata={"operation": self.operation, "error_type": exc_type.__name__}
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
