"""Fraud detection router - proxies to fraud service."""

from fastapi import APIRouter, Request
from fastapi.responses import JSONResponse

from app.utils.http_client import http_client
from app.utils.config import settings

router = APIRouter(prefix="/fraud", tags=["Fraud Detection"])


@router.post("/scan")
async def scan_transaction(request: Request):
    """Scan a transaction for fraud."""
    body = await request.body()
    response = await http_client.proxy_request(
        f"{settings.CASE_SERVICE_URL}/fraud/scan",
        method="POST",
        headers=dict(request.headers),
        body=body,
    )
    return JSONResponse(
        content=response.get("data", {}),
        status_code=response.get("status", 200),
    )


@router.get("/alerts")
async def get_alerts(request: Request):
    """Get fraud alerts."""
    response = await http_client.proxy_request(
        f"{settings.CASE_SERVICE_URL}/fraud/alerts",
        method="GET",
        headers=dict(request.headers),
    )
    return JSONResponse(
        content=response.get("data", {}),
        status_code=response.get("status", 200),
    )


@router.post("/rules")
async def create_rule(request: Request):
    """Create a fraud detection rule."""
    body = await request.body()
    response = await http_client.proxy_request(
        f"{settings.CASE_SERVICE_URL}/fraud/rules",
        method="POST",
        headers=dict(request.headers),
        body=body,
    )
    return JSONResponse(
        content=response.get("data", {}),
        status_code=response.get("status", 201),
    )


@router.get("/rules")
async def list_rules(request: Request):
    """List fraud detection rules."""
    response = await http_client.proxy_request(
        f"{settings.CASE_SERVICE_URL}/fraud/rules",
        method="GET",
        headers=dict(request.headers),
    )
    return JSONResponse(
        content=response.get("data", {}),
        status_code=response.get("status", 200),
    )
