"""Authentication router - proxies to auth service."""

from fastapi import APIRouter, Request, HTTPException
from fastapi.responses import JSONResponse

from app.utils.http_client import http_client
from app.utils.config import settings

router = APIRouter(prefix="/auth", tags=["Authentication"])


@router.post("/login")
async def login(request: Request):
    """Authenticate user."""
    body = await request.body()
    response = await http_client.proxy_request(
        f"{settings.AUTH_SERVICE_URL}/auth/login",
        method="POST",
        headers=dict(request.headers),
        body=body,
    )
    return JSONResponse(
        content=response.get("data", {}),
        status_code=response.get("status", 200),
    )


@router.post("/logout")
async def logout(request: Request):
    """Logout user."""
    body = await request.body()
    response = await http_client.proxy_request(
        f"{settings.AUTH_SERVICE_URL}/auth/logout",
        method="POST",
        headers=dict(request.headers),
        body=body,
    )
    return JSONResponse(
        content=response.get("data", {}),
        status_code=response.get("status", 200),
    )


@router.get("/me")
async def get_current_user(request: Request):
    """Get current authenticated user."""
    response = await http_client.proxy_request(
        f"{settings.AUTH_SERVICE_URL}/auth/me",
        method="GET",
        headers=dict(request.headers),
    )
    return JSONResponse(
        content=response.get("data", {}),
        status_code=response.get("status", 200),
    )


@router.post("/refresh")
async def refresh_token(request: Request):
    """Refresh authentication token."""
    body = await request.body()
    response = await http_client.proxy_request(
        f"{settings.AUTH_SERVICE_URL}/auth/refresh",
        method="POST",
        headers=dict(request.headers),
        body=body,
    )
    return JSONResponse(
        content=response.get("data", {}),
        status_code=response.get("status", 200),
    )
