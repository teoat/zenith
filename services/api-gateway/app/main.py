"""
Zenith Platform API Gateway
Main entry point for the API Gateway service.
"""

import logging
from contextlib import asynccontextmanager
from fastapi import FastAPI, Request
from fastapi.responses import JSONResponse
from fastapi.middleware.cors import CORSMiddleware

from app.utils.config import settings
from app.utils.http_client import RailwayHttpClient
from app.middleware.rate_limit import RateLimitMiddleware
from app.middleware.security import SecurityMiddleware

logging.basicConfig(
    level=getattr(logging, settings.LOG_LEVEL.upper()),
    format="%(asctime)s - %(name)s - %(levelname)s - %(message)s",
)
logger = logging.getLogger(__name__)

http_client = RailwayHttpClient()


@asynccontextmanager
async def lifespan(app: FastAPI):
    logger.info("Starting API Gateway service")
    logger.info(f"Environment: {settings.ENVIRONMENT}")
    yield
    logger.info("Shutting down API Gateway service")


app = FastAPI(
    title="Zenith Platform API Gateway",
    description="Central API Gateway for routing requests to backend services",
    version="1.0.0",
    lifespan=lifespan,
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.add_middleware(RateLimitMiddleware)
app.add_middleware(SecurityMiddleware)


@app.get("/health", tags=["Health"])
async def health_check():
    """Health check endpoint for Railway."""
    return {"status": "healthy", "service": "api-gateway"}


@app.get("/ready", tags=["Health"])
async def readiness_check():
    """Readiness check endpoint."""
    return {
        "status": "ready",
        "service": "api-gateway",
    }


@app.api_route("/{path:path}", methods=["GET", "POST", "PUT", "DELETE", "PATCH"])
async def proxy_request(request: Request, path: str):
    """
    Proxy requests to appropriate backend services.
    """
    try:
        target_url = f"{settings.AUTH_SERVICE_URL}/{path}"
        response = await http_client.proxy_request(
            target_url,
            method=request.method,
            headers=dict(request.headers),
            body=await request.body(),
        )
        return JSONResponse(
            content=response.get("data", {}),
            status_code=response.get("status", 200),
        )
    except Exception as e:
        logger.error(f"Proxy error: {e}")
        return JSONResponse(
            content={"error": "Service unavailable"},
            status_code=503,
        )


if __name__ == "__main__":
    import uvicorn

    uvicorn.run(
        "app.main:app",
        host="0.0.0.0",
        port=8000,
        reload=settings.ENVIRONMENT == "development",
    )
