"""Cases router - proxies to case service."""

from fastapi import APIRouter, Request
from fastapi.responses import JSONResponse

from app.utils.http_client import http_client
from app.utils.config import settings

router = APIRouter(prefix="/cases", tags=["Cases"])


@router.get("/")
async def list_cases(request: Request):
    """List all cases."""
    response = await http_client.proxy_request(
        f"{settings.CASE_SERVICE_URL}/cases/",
        method="GET",
        headers=dict(request.headers),
    )
    return JSONResponse(
        content=response.get("data", {}),
        status_code=response.get("status", 200),
    )


@router.post("/")
async def create_case(request: Request):
    """Create a new case."""
    body = await request.body()
    response = await http_client.proxy_request(
        f"{settings.CASE_SERVICE_URL}/cases/",
        method="POST",
        headers=dict(request.headers),
        body=body,
    )
    return JSONResponse(
        content=response.get("data", {}),
        status_code=response.get("status", 201),
    )


@router.get("/{case_id}")
async def get_case(request: Request, case_id: str):
    """Get a specific case."""
    response = await http_client.proxy_request(
        f"{settings.CASE_SERVICE_URL}/cases/{case_id}",
        method="GET",
        headers=dict(request.headers),
    )
    return JSONResponse(
        content=response.get("data", {}),
        status_code=response.get("status", 200),
    )


@router.put("/{case_id}")
async def update_case(request: Request, case_id: str):
    """Update a case."""
    body = await request.body()
    response = await http_client.proxy_request(
        f"{settings.CASE_SERVICE_URL}/cases/{case_id}",
        method="PUT",
        headers=dict(request.headers),
        body=body,
    )
    return JSONResponse(
        content=response.get("data", {}),
        status_code=response.get("status", 200),
    )


@router.delete("/{case_id}")
async def delete_case(request: Request, case_id: str):
    """Delete a case."""
    response = await http_client.proxy_request(
        f"{settings.CASE_SERVICE_URL}/cases/{case_id}",
        method="DELETE",
        headers=dict(request.headers),
    )
    return JSONResponse(
        content=response.get("data", {}),
        status_code=response.get("status", 200),
    )
