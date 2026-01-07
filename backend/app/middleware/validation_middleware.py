"""
Request validation middleware for enhanced input validation and security
"""

import logging

from fastapi import HTTPException, Request
from starlette.middleware.base import BaseHTTPMiddleware

logger = logging.getLogger(__name__)


class RequestValidationMiddleware(BaseHTTPMiddleware):
    """Middleware for comprehensive request validation and security checks"""

    def __init__(self, app, max_body_size: int = 10 * 1024 * 1024):  # 10MB default
        super().__init__(app)
        self.max_body_size = max_body_size

    async def dispatch(self, request: Request, call_next):
        try:
            # Validate request size
            await self._validate_request_size(request)

            # Validate content type for POST/PUT/PATCH requests
            await self._validate_content_type(request)

            # Log suspicious requests
            await self._log_suspicious_requests(request)

            response = await call_next(request)
            return response

        except HTTPException:
            raise
        except Exception as exc:
            logger.error(f"Request validation middleware error: {exc}")
            raise

    async def _validate_request_size(self, request: Request) -> None:
        """Validate request body size"""
        if request.method in ["POST", "PUT", "PATCH"]:
            content_length = request.headers.get("content-length")
            if content_length:
                try:
                    size = int(content_length)
                    if size > self.max_body_size:
                        raise HTTPException(
                            status_code=413,
                            detail=f"Request body too large. Maximum size: {self.max_body_size} bytes",
                        )
                except ValueError:
                    pass  # Invalid content-length header, let FastAPI handle it

    async def _validate_content_type(self, request: Request) -> None:
        """Validate content type for requests with bodies"""
        if request.method in ["POST", "PUT", "PATCH"]:
            content_type = request.headers.get("content-type", "").lower()

            # Require content-type for requests with bodies
            if not content_type:
                # Read a small amount to check if there's actually a body
                body = await request.body()
                if body and len(body) > 0:
                    raise HTTPException(
                        status_code=400,
                        detail="Content-Type header required for requests with body",
                    )
                return

            # Validate content-type format
            allowed_types = [
                "application/json",
                "application/x-www-form-urlencoded",
                "multipart/form-data",
                "text/plain",
                "application/xml",
                "application/octet-stream",
            ]

            # Check if it's one of the allowed types or starts with allowed prefix
            is_allowed = any(content_type.startswith(allowed) for allowed in allowed_types)

            if not is_allowed:
                raise HTTPException(status_code=415, detail=f"Unsupported content type: {content_type}")

    async def _log_suspicious_requests(self, request: Request) -> None:
        """Log potentially suspicious requests for security monitoring"""
        suspicious_indicators = []

        # Check for SQL injection patterns in query parameters
        query_params = str(request.query_params)
        sql_patterns = [
            "union",
            "select",
            "insert",
            "update",
            "delete",
            "drop",
            "exec",
            "script",
        ]
        if any(pattern in query_params.lower() for pattern in sql_patterns):
            suspicious_indicators.append("sql_injection_patterns")

        # Check for XSS patterns in query parameters
        xss_patterns = ["<script", "javascript:", "onload=", "onerror="]
        if any(pattern in query_params.lower() for pattern in xss_patterns):
            suspicious_indicators.append("xss_patterns")

        # Check for unusually long query strings
        if len(query_params) > 2000:
            suspicious_indicators.append("long_query_string")

        # Check for suspicious user agents
        user_agent = request.headers.get("user-agent", "").lower()
        suspicious_uas = ["sqlmap", "nmap", "masscan", "dirbuster", "gobuster"]
        if any(ua in user_agent for ua in suspicious_uas):
            suspicious_indicators.append("suspicious_user_agent")

        # Log suspicious requests
        if suspicious_indicators:
            logger.warning(
                f"Suspicious request detected: {request.method} {request.url.path}",
                extra={
                    "client_ip": request.client.host if request.client else "unknown",
                    "user_agent": user_agent,
                    "indicators": suspicious_indicators,
                    "query_params_length": len(query_params),
                },
            )


class InputValidationMiddleware(BaseHTTPMiddleware):
    """Middleware for input sanitization and validation"""

    async def dispatch(self, request: Request, call_next):
        try:
            # Sanitize headers
            await self._sanitize_headers(request)

            # Validate request path and query parameters
            await self._validate_request_parameters(request)

            response = await call_next(request)
            return response

        except HTTPException:
            raise
        except Exception as exc:
            logger.error(f"Input validation middleware error: {exc}")
            raise

    async def _sanitize_headers(self, request: Request) -> None:
        """Sanitize and validate request headers"""
        # Remove any headers that could cause issues

        # Log headers that might indicate proxy misuse
        suspicious_headers = ["x-forwarded-for", "x-real-ip", "x-client-ip"]
        found_suspicious = [h for h in suspicious_headers if h in request.headers]

        if found_suspicious:
            logger.info(f"Request with proxy headers: {found_suspicious}")

    async def _validate_request_parameters(self, request: Request) -> None:
        """Validate request path and query parameters"""
        # Check for path traversal attempts
        path = request.url.path
        if ".." in path or "%" in path:
            # More thorough check for path traversal
            normalized_path = path.replace("\\", "/")
            if "../" in normalized_path or "..\\" in normalized_path:
                raise HTTPException(status_code=400, detail="Invalid path: path traversal detected")

        # Validate query parameter names (no special characters that could cause issues)
        for param_name in request.query_params:
            if any(char in param_name for char in ["<", ">", '"', "'", ";", "(", ")"]):
                raise HTTPException(
                    status_code=400,
                    detail=f"Invalid query parameter name: {param_name}",
                )
