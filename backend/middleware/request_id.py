import uuid

from fastapi import Request
from starlette.middleware.base import BaseHTTPMiddleware


class RequestIDMiddleware(BaseHTTPMiddleware):
    async def dispatch(self, request: Request, call_next):
        # Prefer existing X-Request-ID header, otherwise generate new one
        request_id = request.headers.get("X-Request-ID", str(uuid.uuid4()))

        # Store in request state for access by other components
        request.state.request_id = request_id

        # Process request
        response = await call_next(request)

        # Ensure header is present in response
        response.headers["X-Request-ID"] = request_id

        return response
