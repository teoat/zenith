"""
Enhanced Error Handling with User-Friendly Messages

This module provides structured error tracking and user-friendly error messages
for API responses.
"""

from enum import Enum
from typing import Optional, Dict, Any
from fastapi import HTTPException
from pydantic import BaseModel
from core.logging import logger, log_error


class ErrorCategory(str, Enum):
    """Error categories for better error handling"""
    CLIENT_ERROR = "client_error"          # User input issues (400-level)
    SERVER_ERROR = "server_error"          # Internal server issues (500-level)
    VALIDATION_ERROR = "validation_error"  # Data validation failures
    AUTHENTICATION_ERROR = "authentication_error"  # Auth failures
    AUTHORIZATION_ERROR = "authorization_error"    # Permission issues
    NOT_FOUND_ERROR = "not_found_error"    # Resource not found
    CONFLICT_ERROR = "conflict_error"       # Resource conflicts
    RATE_LIMIT_ERROR = "rate_limit_error"  # Too many requests


class AppError(BaseModel):
    """Structured error model"""
    category: ErrorCategory
    code: str
    message: str  # User-friendly message
    technical_message: Optional[str] = None  # Technical details (dev only)
    context: Optional[Dict[str, Any]] = None
    suggestion: Optional[str] = None  # What user should do


# User-friendly error message mappings
ERROR_MESSAGES = {
    # Database errors
    "db_connection_failed": AppError(
        category=ErrorCategory.SERVER_ERROR,
        code="db_connection_failed",
        message="Unable to connect to the database. Please try again later.",
        suggestion="If the problem persists, please contact support."
    ),
    "db_query_timeout": AppError(
        category=ErrorCategory.SERVER_ERROR,
        code="db_query_timeout",
        message="The request took too long to process. Please try again.",
        suggestion="Try narrowing your search criteria."
    ),
    
    # Validation errors
    "invalid_case_id": AppError(
        category=ErrorCategory.VALIDATION_ERROR,
        code="invalid_case_id",
        message="The case ID provided is not valid.",
        suggestion="Please check the case ID and try again."
    ),
    "invalid_date_range": AppError(
        category=ErrorCategory.VALIDATION_ERROR,
        code="invalid_date_range",
        message="The date range is invalid.",
        suggestion="Please ensure the start date is before the end date."
    ),
    "file_too_large": AppError(
        category=ErrorCategory.VALIDATION_ERROR,
        code="file_too_large",
        message="The file you're trying to upload is too large.",
        suggestion="Please upload a file smaller than 50MB."
    ),
    
    # Authentication errors
    "invalid_credentials": AppError(
        category=ErrorCategory.AUTHENTICATION_ERROR,
        code="invalid_credentials",
        message="The username or password you entered is incorrect.",
        suggestion="Please check your credentials and try again."
    ),
    "session_expired": AppError(
        category=ErrorCategory.AUTHENTICATION_ERROR,
        code="session_expired",
        message="Your session has expired.",
        suggestion="Please log in again to continue."
    ),
    
    # Authorization errors
    "insufficient_permissions": AppError(
        category=ErrorCategory.AUTHORIZATION_ERROR,
        code="insufficient_permissions",
        message="You don't have permission to perform this action.",
        suggestion="Contact your administrator if you need access."
    ),
    
    # Not found errors
    "case_not_found": AppError(
        category=ErrorCategory.NOT_FOUND_ERROR,
        code="case_not_found",
        message="The case you're looking for could not be found.",
        suggestion="Please verify the case ID and try again."
    ),
    "evidence_not_found": AppError(
        category=ErrorCategory.NOT_FOUND_ERROR,
        code="evidence_not_found",
        message="The evidence file could not be found.",
        suggestion="The file may have been deleted or moved."
    ),
    
    # Conflict errors
    "case_already_exists": AppError(
        category=ErrorCategory.CONFLICT_ERROR,
        code="case_already_exists",
        message="A case with this ID already exists.",
        suggestion="Please use a different case ID or update the existing case."
    ),
    
    # Rate limit errors
    "rate_limit_exceeded": AppError(
        category=ErrorCategory.RATE_LIMIT_ERROR,
        code="rate_limit_exceeded",
        message="You've made too many requests. Please slow down.",
        suggestion="Wait a few minutes before trying again."
    ),
    
    # Fraud detection errors
    "fraud_analysis_failed": AppError(
        category=ErrorCategory.SERVER_ERROR,
        code="fraud_analysis_failed",
        message="We couldn't complete the fraud analysis.",
        suggestion="Please try again or upload different evidence."
    ),
    
    # File processing errors
    "file_processing_failed": AppError(
        category=ErrorCategory.SERVER_ERROR,
        code="file_processing_failed",
        message="We couldn't process your file.",
        suggestion="Please ensure the file is not corrupted and try again."
    ),
    "unsupported_file_type": AppError(
        category=ErrorCategory.VALIDATION_ERROR,
        code="unsupported_file_type",
        message="This file type is not supported.",
        suggestion="Please upload a PDF, image, or video file."
    ),
}


def get_error_message(
    error_code: str,
    context: Optional[Dict[str, Any]] = None,
    technical_message: Optional[str] = None
) -> AppError:
    """
    Get user-friendly error message for a given error code.
    
    Args:
        error_code: Error code identifier
        context: Additional context about the error
        technical_message: Technical details (only shown in dev mode)
    
    Returns:
        AppError: Structured error with user-friendly message
    """
    error = ERROR_MESSAGES.get(error_code)
    
    if not error:
        # Default error for unknown codes
        error = AppError(
            category=ErrorCategory.SERVER_ERROR,
            code=error_code,
            message="An unexpected error occurred.",
            suggestion="Please try again later or contact support."
        )
    
    # Add context and technical details
    if context:
        error.context = context
    if technical_message:
        error.technical_message = technical_message
    
    return error


def raise_app_error(
    error_code: str,
    status_code: int = 400,
    context: Optional[Dict[str, Any]] = None,
    technical_message: Optional[str] = None,
    log_level: str = "warning"
):
    """
    Raise an HTTPException with structured error details.
    
    Args:
        error_code: Error code identifier
        status_code: HTTP status code
        context: Additional error context
        technical_message: Technical details for logging
        log_level: Logging level (debug, info, warning, error)
    """
    error = get_error_message(error_code, context, technical_message)
    
    # Log the error
    log_data = {
        "error_code": error_code,
        "category": error.category,
        "status_code": status_code,
        "context": context or {}
    }
    
    if technical_message:
        log_data["technical_message"] = technical_message
    
    if log_level == "error":
        log_error(error_code, error.message, log_data)
    elif log_level == "warning":
        logger.warning(error.message, extra=log_data)
    else:
        logger.info(error.message, extra=log_data)
    
    # Raise HTTP exception
    raise HTTPException(
        status_code=status_code,
        detail={
            "error": {
                "code": error.code,
                "category": error.category,
                "message": error.message,
                "suggestion": error.suggestion,
                "context": error.context
            }
        }
    )


def handle_exception(exc: Exception, request_id: Optional[str] = None) -> Dict[str, Any]:
    """
    Convert any exception to a structured error response.
    
    Args:
        exc: Exception to handle
        request_id: Optional request ID for tracking
    
    Returns:
        dict: Structured error response
    """
    error_code = "unknown_error"
    status_code = 500
    
    # Map common exceptions to error codes
    if isinstance(exc, ValueError):
        error_code = "invalid_input"
        status_code = 400
    elif isinstance(exc, PermissionError):
        error_code = "insufficient_permissions"
        status_code = 403
    elif isinstance(exc, FileNotFoundError):
        error_code = "not_found"
        status_code = 404
    elif isinstance(exc, TimeoutError):
        error_code = "request_timeout"
        status_code = 504
    
    error = get_error_message(
        error_code,
        context={"request_id": request_id} if request_id else None,
        technical_message=str(exc)
    )
    
    # Log the exception
    log_error(
        error_code,
        str(exc),
        {
            "exception_type": type(exc).__name__,
            "request_id": request_id
        }
    )
    
    return {
        "error": {
            "code": error.code,
            "category": error.category,
            "message": error.message,
            "suggestion": error.suggestion,
            "request_id": request_id
        }
    }
