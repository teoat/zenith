import os
import traceback

from fastapi import FastAPI, HTTPException, Request
from fastapi.responses import JSONResponse
from starlette.exceptions import HTTPException as StarletteHTTPException

from core.api_models import create_error_response
from core.logging import log_error
from i18n import ErrorMessages
from locale_utils import get_locale_from_request


def setup_exception_handlers(app: FastAPI):
    environment = os.getenv("ENVIRONMENT", "development").lower()

    @app.exception_handler(HTTPException)
    async def http_exception_handler(request: Request, exc: HTTPException):
        """Handle HTTP exceptions with structured logging and localized response"""
        locale = get_locale_from_request(request)

        # Get localized error message based on status code
        localized_detail = exc.detail
        if exc.status_code == 401:
            localized_detail = ErrorMessages.unauthorized(locale)
        elif exc.status_code == 403:
            localized_detail = ErrorMessages.forbidden(locale)
        elif exc.status_code == 404:
            localized_detail = ErrorMessages.not_found(locale)
        elif exc.status_code >= 500:
            localized_detail = ErrorMessages.server_error(locale)

        log_error(
            "http_exception",
            f"HTTP {exc.status_code}: {localized_detail}",
            {
                "status_code": exc.status_code,
                "path": str(request.url),
                "method": request.method,
                "client_ip": request.client.host if request.client else None,
                "locale": locale,
            },
        )

        # Return standardized error response with localized message
        error_response = create_error_response(
            status_code=exc.status_code,
            detail=localized_detail,
            error_type="http_exception",
            request=request,
        )
        return JSONResponse(status_code=exc.status_code, content=error_response)

    @app.exception_handler(Exception)
    async def general_exception_handler(request: Request, exc: Exception):
        """Handle unexpected exceptions with structured logging and localized response"""
        locale = get_locale_from_request(request)

        localized_error_message = ErrorMessages.unexpected_error(locale)

        error_details = {
            "type": type(exc).__name__,
            "message": str(exc),
            "traceback": traceback.format_exc(),
            "path": str(request.url),
            "method": request.method,
            "client_ip": request.client.host if request.client else None,
            "locale": locale,
        }

        log_error("unexpected_error", f"Unexpected error: {exc!s}", error_details)

        # Don't expose internal error details in production
        if environment == "production":
            error_response = create_error_response(
                status_code=500,
                detail=localized_error_message,
                error_type="internal_server_error",
                request=request,
            )
            return JSONResponse(status_code=500, content=error_response)
        else:
            # Show full details in development
            error_response = create_error_response(
                status_code=500,
                detail=f"{localized_error_message} (Development: {exc!s})",
                error_type="unexpected_error",
                request=request,
            )
            # Add traceback for development
            error_response["error"]["traceback"] = traceback.format_exc()
            return JSONResponse(status_code=500, content=error_response)

    @app.exception_handler(StarletteHTTPException)
    async def starlette_exception_handler(request: Request, exc: StarletteHTTPException):
        """Handle Starlette HTTP exceptions with standardized response"""
        log_error(
            "starlette_exception",
            f"Starlette HTTP {exc.status_code}: {exc.detail}",
            {
                "status_code": exc.status_code,
                "path": str(request.url),
                "method": request.method,
            },
        )

        # Return standardized error response
        error_response = create_error_response(
            status_code=exc.status_code,
            detail=exc.detail,
            error_type="starlette_exception",
            request=request,
        )
        return JSONResponse(status_code=exc.status_code, content=error_response)
