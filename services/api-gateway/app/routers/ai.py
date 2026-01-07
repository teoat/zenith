"""AI router - proxies to AI/ML service."""

from fastapi import APIRouter, Request
from fastapi.responses import JSONResponse

from app.utils.http_client import http_client
from app.utils.config import settings

router = APIRouter(prefix="/ai", tags=["AI/ML"])


@router.post("/analyze")
async def analyze(request: Request):
    """Analyze data with AI models."""
    body = await request.body()
    response = await http_client.proxy_request(
        f"{settings.AI_SERVICE_URL}/ai/analyze",
        method="POST",
        headers=dict(request.headers),
        body=body,
    )
    return JSONResponse(
        content=response.get("data", {}),
        status_code=response.get("status", 200),
    )


@router.post("/fraud-detection")
async def detect_fraud(request: Request):
    """Run fraud detection on transactions."""
    body = await request.body()
    response = await http_client.proxy_request(
        f"{settings.AI_SERVICE_URL}/ai/fraud-detection",
        method="POST",
        headers=dict(request.headers),
        body=body,
    )
    return JSONResponse(
        content=response.get("data", {}),
        status_code=response.get("status", 200),
    )


@router.post("/embeddings")
async def generate_embeddings(request: Request):
    """Generate text embeddings."""
    body = await request.body()
    response = await http_client.proxy_request(
        f"{settings.AI_SERVICE_URL}/ai/embeddings",
        method="POST",
        headers=dict(request.headers),
        body=body,
    )
    return JSONResponse(
        content=response.get("data", {}),
        status_code=response.get("status", 200),
    )


@router.get("/models")
async def list_models(request: Request):
    """List available AI models."""
    response = await http_client.proxy_request(
        f"{settings.AI_SERVICE_URL}/ai/models",
        method="GET",
        headers=dict(request.headers),
    )
    return JSONResponse(
        content=response.get("data", {}),
        status_code=response.get("status", 200),
    )
