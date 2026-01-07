"""API Gateway routers."""

from fastapi import APIRouter

router = APIRouter()

from app.routers import auth, health, cases, ai, fraud

__all__ = ["router", "auth", "health", "cases", "ai", "fraud"]
