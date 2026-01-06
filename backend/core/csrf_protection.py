import abc
import hashlib
import hmac
import os
import secrets
from datetime import datetime, timedelta

import redis
from fastapi import HTTPException, Request, status
from fastapi.responses import Response
from starlette.middleware.base import BaseHTTPMiddleware

from core.config import settings
from core.logging import logger

# CSRF configuration
CSRF_TOKEN_LENGTH = 32
CSRF_TOKEN_EXPIRY = 86400  # 24 hours in seconds
CSRF_HEADER_NAME = "X-CSRF-Token"
CSRF_COOKIE_NAME = "csrf_token"
CSRF_SECRET_KEY = settings.SECRET_KEY


class CSRFStore(abc.ABC):
    @abc.abstractmethod
    def set(self, token: str, expiry_seconds: int) -> None:
        pass

    @abc.abstractmethod
    def exists_and_valid(self, token: str) -> bool:
        pass

    @abc.abstractmethod
    def delete(self, token: str) -> None:
        pass


class InMemoryCSRFStore(CSRFStore):
    def __init__(self):
        self._store: dict[str, datetime] = {}

    def set(self, token: str, expiry_seconds: int) -> None:
        self._store[token] = datetime.now() + timedelta(seconds=expiry_seconds)
        self._cleanup()

    def exists_and_valid(self, token: str) -> bool:
        expiry = self._store.get(token)
        if not expiry:
            return False
        if datetime.now() > expiry:
            self.delete(token)
            return False
        return True

    def delete(self, token: str) -> None:
        if token in self._store:
            del self._store[token]

    def _cleanup(self):
        now = datetime.now()
        expired = [t for t, e in self._store.items() if now > e]
        for t in expired:
            del self._store[t]


class RedisCSRFStore(CSRFStore):
    def __init__(self, redis_url: str):
        self.client = redis.from_url(redis_url)

    def set(self, token: str, expiry_seconds: int) -> None:
        self.client.setex(f"csrf:{token}", expiry_seconds, "1")

    def exists_and_valid(self, token: str) -> bool:
        return bool(self.client.exists(f"csrf:{token}"))

    def delete(self, token: str) -> None:
        self.client.delete(f"csrf:{token}")


# Initialize store based on environment
def get_csrf_store() -> CSRFStore:
    if os.getenv("ENVIRONMENT") == "production" or os.getenv("REDIS_URL"):
        try:
            url = settings.REDIS_URL
            return RedisCSRFStore(url)
        except Exception as e:
            logger.error(f"Failed to initialize Redis CSRF store: {e}")
            return InMemoryCSRFStore()
    return InMemoryCSRFStore()


csrf_token_store = get_csrf_store()


def generate_csrf_token() -> str:
    """Generate and store a new CSRF token."""
    token = secrets.token_urlsafe(CSRF_TOKEN_LENGTH)
    csrf_token_store.set(token, CSRF_TOKEN_EXPIRY)
    logger.debug("Generated CSRF token")
    return token


def validate_csrf_token(token: str) -> bool:
    """Validate a CSRF token against the store."""
    return csrf_token_store.exists_and_valid(token)


def generate_double_submit_token(session_id: str) -> str:
    """Generate a double-submit CSRF token tied to session."""
    h = hmac.new(CSRF_SECRET_KEY.encode(), session_id.encode(), hashlib.sha256)
    return h.hexdigest()


def validate_double_submit_token(token: str, session_id: str) -> bool:
    """
    Validate double-submit CSRF token.

    Args:
        token: CSRF token from header
        session_id: User session identifier

    Returns:
        bool: True if valid
    """
    expected_token = generate_double_submit_token(session_id)
    return hmac.compare_digest(token, expected_token)


class CSRFProtectionMiddleware(BaseHTTPMiddleware):
    """
    Middleware to protect against CSRF attacks.

    For state-changing operations (POST, PUT, DELETE, PATCH):
    - Validates CSRF token from header
    - Validates CSRF token from cookie

    Safe methods (GET, HEAD, OPTIONS) are exempt.
    """

    # Methods that require CSRF protection
    PROTECTED_METHODS = {"POST", "PUT", "DELETE", "PATCH"}

    # Paths exempt from CSRF protection (e.g., auth endpoints)
    EXEMPT_PATHS = {
        "/auth/login",
        "/auth/register",
        "/auth/token",
        "/auth/setup",
        "/health",
        "/metrics",
        "/api/v1/communication",  # For websocket integration
        "/docs",
        "/openapi.json",
    }

    async def dispatch(self, request: Request, call_next):
        # Skip CSRF check for safe methods
        if request.method not in self.PROTECTED_METHODS:
            return await call_next(request)

        # Helper to check if path is exempt
        def is_exempt(path: str) -> bool:
            if os.getenv("ENVIRONMENT") == "development":
                return True
            for exempt_path in self.EXEMPT_PATHS:
                if path.startswith(exempt_path):
                    return True
            return False

        # Skip CSRF check for exempt paths
        if is_exempt(request.url.path):
            return await call_next(request)

        # Get CSRF token from header
        csrf_header = request.headers.get(CSRF_HEADER_NAME)

        # Get CSRF token from cookie
        csrf_cookie = request.cookies.get(CSRF_COOKIE_NAME)

        # Validate tokens
        if not csrf_header or not csrf_cookie:
            logger.warning(
                "CSRF validation failed: missing token",
                extra={
                    "path": request.url.path,
                    "method": request.method,
                    "has_header": bool(csrf_header),
                    "has_cookie": bool(csrf_cookie),
                },
            )
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail={
                    "error": {
                        "code": "csrf_token_missing",
                        "message": "CSRF token is missing. Please refresh the page and try again.",
                        "category": "security_error",
                    }
                },
            )

        # Verify tokens match
        if not hmac.compare_digest(csrf_header, csrf_cookie):
            logger.warning(
                "CSRF validation failed: token mismatch",
                extra={"path": request.url.path, "method": request.method},
            )
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail={
                    "error": {
                        "code": "csrf_token_invalid",
                        "message": "CSRF validation failed. Please refresh the page and try again.",
                        "category": "security_error",
                    }
                },
            )

        # Validate token is not expired
        if not validate_csrf_token(csrf_cookie):
            logger.warning(
                "CSRF validation failed: token invalid or expired",
                extra={"path": request.url.path, "method": request.method},
            )
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail={
                    "error": {
                        "code": "csrf_token_expired",
                        "message": "Your session has expired. Please refresh the page and try again.",
                        "category": "security_error",
                    }
                },
            )

        logger.debug(
            "CSRF validation successful",
            extra={"path": request.url.path, "method": request.method},
        )

        # Proceed with request
        response = await call_next(request)

        return response


def set_csrf_cookie(response: Response, token: str | None = None) -> Response:
    """
    Set CSRF token cookie on response.

    Args:
        response: Response object
        token: CSRF token (generates new if not provided)

    Returns:
        Response: Response with CSRF cookie set
    """
    if not token:
        token = generate_csrf_token()

    response.set_cookie(
        key=CSRF_COOKIE_NAME,
        value=token,
        httponly=True,  # Prevent JavaScript access
        secure=os.getenv("ENVIRONMENT") == "production",  # Only enforced in production
        samesite="strict",  # Strict same-site policy
        max_age=CSRF_TOKEN_EXPIRY,
    )

    return response


def get_csrf_token_for_response(request: Request) -> str:
    """
    Get or generate CSRF token for including in response.

    Args:
        request: Request object

    Returns:
        str: CSRF token
    """
    # Try to get existing token from cookie
    existing_token = request.cookies.get(CSRF_COOKIE_NAME)

    if existing_token and validate_csrf_token(existing_token):
        return existing_token

    # Generate new token
    return generate_csrf_token()
