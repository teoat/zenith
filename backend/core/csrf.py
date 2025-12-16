"""CSRF Protection for web interface"""

import hashlib
import hmac
import secrets
from typing import Optional

from fastapi import Header, HTTPException, Request
from starlette.middleware.base import BaseHTTPMiddleware


class CSRFProtection:
    """CSRF token generation and validation"""

    def __init__(self, secret_key: str):
        self.secret_key = secret_key.encode()

    def generate_token(self, session_id: str) -> str:
        """Generate CSRF token for session"""
        # Create token from session ID and random nonce
        nonce = secrets.token_hex(16)
        message = f"{session_id}:{nonce}".encode()

        # Sign with HMAC
        signature = hmac.new(self.secret_key, message, hashlib.sha256).hexdigest()

        return f"{nonce}.{signature}"

    def validate_token(self, token: str, session_id: str) -> bool:
        """Validate CSRF token"""
        try:
            nonce, signature = token.split(".")

            # Recreate signature
            message = f"{session_id}:{nonce}".encode()
            expected_signature = hmac.new(
                self.secret_key, message, hashlib.sha256
            ).hexdigest()

            # Constant-time comparison
            return hmac.compare_digest(signature, expected_signature)
        except (ValueError, AttributeError):
            return False


class CSRFMiddleware(BaseHTTPMiddleware):
    """Middleware to enforce CSRF protection"""

    def __init__(self, app, secret_key: str):
        super().__init__(app)
        self.csrf = CSRFProtection(secret_key)
        self.exempt_methods = {"GET", "HEAD", "OPTIONS", "TRACE"}
        self.exempt_paths = {"/auth/token", "/auth/register", "/health", "/metrics"}

    async def dispatch(self, request: Request, call_next):
        # Skip CSRF check for exempt methods and paths
        if request.method in self.exempt_methods:
            return await call_next(request)

        if any(request.url.path.startswith(path) for path in self.exempt_paths):
            return await call_next(request)

        # Get CSRF token from header
        csrf_token = request.headers.get("X-CSRF-Token")

        if not csrf_token:
            raise HTTPException(status_code=403, detail="CSRF token missing")

        # Get session ID from cookie or header
        session_id = request.cookies.get("session_id", "")

        if not self.csrf.validate_token(csrf_token, session_id):
            raise HTTPException(status_code=403, detail="Invalid CSRF token")

        response = await call_next(request)
        return response


# Helper function to get CSRF token
def get_csrf_token(secret_key: str, session_id: str) -> str:
    """Helper to generate CSRF token"""
    csrf = CSRFProtection(secret_key)
    return csrf.generate_token(session_id)
