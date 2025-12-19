"""
Standardized Error Handling for Backend Services
Provides consistent error handling patterns across all services
"""
import logging
from contextlib import asynccontextmanager
from dataclasses import dataclass
from enum import Enum
from typing import Any, Dict, Optional, Union
from fastapi import HTTPException

logger = logging.getLogger(__name__)


class ErrorSeverity(Enum):
    LOW = "low"
    MEDIUM = "medium"
    HIGH = "high"
    CRITICAL = "critical"


class ErrorCategory(Enum):
    VALIDATION = "validation"
    DATABASE = "database"
    EXTERNAL_API = "external_api"
    AUTHENTICATION = "authentication"
    AUTHORIZATION = "authorization"
    BUSINESS_LOGIC = "business_logic"
    INFRASTRUCTURE = "infrastructure"
    UNKNOWN = "unknown"


@dataclass
class ServiceError:
    """Standardized error structure for all services"""
    message: str
    category: ErrorCategory
    severity: ErrorSeverity
    error_code: Optional[str] = None
    details: Optional[Dict[str, Any]] = None
    original_error: Optional[Exception] = None
    retryable: bool = False
    user_friendly_message: Optional[str] = None

    def to_dict(self) -> Dict[str, Any]:
        """Convert error to dictionary for logging/serialization"""
        return {
            "message": self.message,
            "category": self.category.value,
            "severity": self.severity.value,
            "error_code": self.error_code,
            "details": self.details,
            "retryable": self.retryable,
            "user_friendly_message": self.user_friendly_message,
        }


class ServiceErrorHandler:
    """Centralized error handler for consistent error processing"""

    @staticmethod
    def create_error(
        message: str,
        category: ErrorCategory,
        severity: ErrorSeverity,
        error_code: Optional[str] = None,
        details: Optional[Dict[str, Any]] = None,
        original_error: Optional[Exception] = None,
        retryable: bool = False,
        user_friendly_message: Optional[str] = None,
    ) -> ServiceError:
        """Create a standardized service error"""
        return ServiceError(
            message=message,
            category=category,
            severity=severity,
            error_code=error_code,
            details=details,
            original_error=original_error,
            retryable=retryable,
            user_friendly_message=user_friendly_message,
        )

    @staticmethod
    def handle_database_error(error: Exception, operation: str) -> ServiceError:
        """Handle database-related errors"""
        error_str = str(error).lower()

        if "connection" in error_str or "timeout" in error_str:
            return ServiceError(
                message=f"Database connection error during {operation}",
                category=ErrorCategory.DATABASE,
                severity=ErrorSeverity.HIGH,
                error_code="DB_CONNECTION_ERROR",
                original_error=error,
                retryable=True,
                user_friendly_message="Database temporarily unavailable. Please try again.",
            )
        elif "constraint" in error_str or "integrity" in error_str:
            return ServiceError(
                message=f"Database constraint violation during {operation}",
                category=ErrorCategory.VALIDATION,
                severity=ErrorSeverity.MEDIUM,
                error_code="DB_CONSTRAINT_ERROR",
                original_error=error,
                retryable=False,
                user_friendly_message="Invalid data provided. Please check your input.",
            )
        else:
            return ServiceError(
                message=f"Database error during {operation}",
                category=ErrorCategory.DATABASE,
                severity=ErrorSeverity.HIGH,
                error_code="DB_GENERIC_ERROR",
                original_error=error,
                retryable=True,
                user_friendly_message="A database error occurred. Please try again.",
            )

    @staticmethod
    def handle_external_api_error(error: Exception, service_name: str) -> ServiceError:
        """Handle external API errors"""
        error_str = str(error).lower()

        if "timeout" in error_str or "connection" in error_str:
            return ServiceError(
                message=f"External API timeout for {service_name}",
                category=ErrorCategory.EXTERNAL_API,
                severity=ErrorSeverity.MEDIUM,
                error_code="API_TIMEOUT",
                original_error=error,
                retryable=True,
                user_friendly_message=f"{service_name} is currently unavailable. Please try again later.",
            )
        elif "rate limit" in error_str or "429" in error_str:
            return ServiceError(
                message=f"Rate limit exceeded for {service_name}",
                category=ErrorCategory.EXTERNAL_API,
                severity=ErrorSeverity.MEDIUM,
                error_code="API_RATE_LIMIT",
                original_error=error,
                retryable=True,
                user_friendly_message="Service is temporarily busy. Please try again in a few minutes.",
            )
        else:
            return ServiceError(
                message=f"External API error for {service_name}",
                category=ErrorCategory.EXTERNAL_API,
                severity=ErrorSeverity.HIGH,
                error_code="API_GENERIC_ERROR",
                original_error=error,
                retryable=True,
                user_friendly_message=f"External service error. Please try again later.",
            )

    @staticmethod
    def handle_validation_error(error: Exception, field: Optional[str] = None) -> ServiceError:
        """Handle validation errors"""
        return ServiceError(
            message=f"Validation error{' for ' + field if field else ''}",
            category=ErrorCategory.VALIDATION,
            severity=ErrorSeverity.LOW,
            error_code="VALIDATION_ERROR",
            original_error=error,
            retryable=False,
            user_friendly_message="Please check your input and try again.",
        )

    @staticmethod
    def handle_authentication_error(error: Exception) -> ServiceError:
        """Handle authentication errors"""
        return ServiceError(
            message="Authentication failed",
            category=ErrorCategory.AUTHENTICATION,
            severity=ErrorSeverity.MEDIUM,
            error_code="AUTH_FAILED",
            original_error=error,
            retryable=False,
            user_friendly_message="Authentication failed. Please check your credentials.",
        )

    @staticmethod
    def handle_authorization_error(error: Exception, resource: Optional[str] = None) -> ServiceError:
        """Handle authorization errors"""
        return ServiceError(
            message=f"Authorization failed{' for ' + resource if resource else ''}",
            category=ErrorCategory.AUTHORIZATION,
            severity=ErrorSeverity.MEDIUM,
            error_code="AUTHZ_FAILED",
            original_error=error,
            retryable=False,
            user_friendly_message="You don't have permission to perform this action.",
        )

    @staticmethod
    def log_and_raise_http_error(service_error: ServiceError) -> None:
        """Log error and raise appropriate HTTP exception"""
        # Log the error with structured data
        log_data = {
            "message": service_error.message,
            "category": service_error.category.value,
            "severity": service_error.severity.value,
            "error_code": service_error.error_code,
            "retryable": service_error.retryable,
        }

        if service_error.details:
            log_data["details"] = service_error.details

        if service_error.original_error:
            log_data["original_error"] = str(service_error.original_error)

        # Choose log level based on severity
        if service_error.severity == ErrorSeverity.CRITICAL:
            logger.critical("Service error", extra=log_data)
        elif service_error.severity == ErrorSeverity.HIGH:
            logger.error("Service error", extra=log_data)
        elif service_error.severity == ErrorSeverity.MEDIUM:
            logger.warning("Service error", extra=log_data)
        else:
            logger.info("Service error", extra=log_data)

        # Raise HTTP exception with user-friendly message
        status_code = ServiceErrorHandler._get_http_status_code(service_error)
        raise HTTPException(
            status_code=status_code,
            detail=service_error.user_friendly_message or service_error.message
        )

    @staticmethod
    def _get_http_status_code(service_error: ServiceError) -> int:
        """Map service error to HTTP status code"""
        from fastapi import status

        category_status_map = {
            ErrorCategory.VALIDATION: status.HTTP_400_BAD_REQUEST,
            ErrorCategory.AUTHENTICATION: status.HTTP_401_UNAUTHORIZED,
            ErrorCategory.AUTHORIZATION: status.HTTP_403_FORBIDDEN,
            ErrorCategory.DATABASE: status.HTTP_503_SERVICE_UNAVAILABLE,
            ErrorCategory.EXTERNAL_API: status.HTTP_502_BAD_GATEWAY,
            ErrorCategory.BUSINESS_LOGIC: status.HTTP_422_UNPROCESSABLE_ENTITY,
            ErrorCategory.INFRASTRUCTURE: status.HTTP_503_SERVICE_UNAVAILABLE,
        }

        return category_status_map.get(service_error.category, status.HTTP_500_INTERNAL_SERVER_ERROR)


# Context manager for service operations
@asynccontextmanager
async def service_operation_context(operation_name: str, category: ErrorCategory = ErrorCategory.UNKNOWN):
    """Context manager for service operations with standardized error handling"""
    try:
        yield
    except Exception as e:
        error = ServiceError(
            message=f"Error in {operation_name}",
            category=category,
            severity=ErrorSeverity.MEDIUM,
            original_error=e,
            retryable=True,
        )
        ServiceErrorHandler.log_and_raise_http_error(error)


# Global error handler instance
error_handler = ServiceErrorHandler()