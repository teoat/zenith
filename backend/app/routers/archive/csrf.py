import logging
import secrets
from datetime import datetime, timedelta
from typing import Any

from app.core.exceptions import ZenithError
from app.services.infrastructure.redis_cluster import redis_cluster_manager
from fastapi import APIRouter, HTTPException, Request

from core.zlogging import logger

logger = logging.getLogger(__name__)
router = APIRouter()
# In-memory token store (fallback for Redis)
_csrf_tokens: dict[str, dict[str, Any]] = {}


async def _store_csrf_token(token: str, expires_in: int = 3600):
    """Store CSRF token in Redis or in-memory fallback"""
    if redis_cluster_manager.is_connected:
        csrf_key = f"csrf_token:{token}"
        await redis_cluster_manager.set(csrf_key, "valid", ex=expires_in)
    else:
        _csrf_tokens[token] = {
            "expires": datetime.now() + timedelta(seconds=expires_in)
        }


async def _validate_csrf_token(token: str) -> bool:
    """Validate CSRF token in Redis or in-memory fallback"""
    if redis_cluster_manager.is_connected:
        csrf_key = f"csrf_token:{token}"
        return await redis_cluster_manager.exists(csrf_key)
    else:
        if token in _csrf_tokens:
            if _csrf_tokens[token]["expires"] > datetime.now():
                return True
            else:
                del _csrf_tokens[token]
        return False


@router.get("/csrf-token")
async def get_csrf_token(request: Request):
    """
    Get a CSRF token for the current session.
    Tokens are stored in Redis (preferred) or in-memory.
    """
    try:
        # Generate a secure random token
        token = secrets.token_urlsafe(32)
        # Store token
        await _store_csrf_token(token, expires_in=3600)
        logger.info(
            "CSRF token generated",
            extra={"ip": request.client.host if request.client else "unknown"},
        )
        return {"csrf_token": token, "expires_in": 3600}
    except (ZenithError, Exception) as e:
        logger.error(f"Failed to generate CSRF token: {e}")
        raise HTTPException(status_code=500, detail="Failed to generate CSRF token")


@router.post("/validate-csr")
async def validate_csrf_token(token: str):
    """
    Explicitly validate a CSRF token.
    """
    is_valid = await _validate_csrf_token(token)
    return {"valid": is_valid}


@router.post("/cleanup-tokens")
async def cleanup_expired_tokens():
    """
    Clean up expired CSRF tokens (in-memory only; Redis handles this automatically via TTL)
    """
    if redis_cluster_manager.is_connected:
        return {"message": "Redis is managing token cleanup automatically."}
    current_time = datetime.now()
    expired_keys = [k for k, v in _csrf_tokens.items() if v["expires"] <= current_time]
    for key in expired_keys:
        del _csrf_tokens[key]
    return {"cleaned": len(expired_keys), "remaining": len(_csrf_tokens)}
