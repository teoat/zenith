import secrets
from datetime import datetime, timedelta

from fastapi import APIRouter, HTTPException

router = APIRouter()

# In-memory token store (use Redis in production)
_csrf_tokens = {}


@router.get("/csrf-token")
async def get_csrf_token():
    """
    Get a CSRF token for the current session.
    In production, this should be stored in Redis or database with expiration.
    """
    try:
        # Generate a secure random token
        token = secrets.token_urlsafe(32)

        # Store token with anonymous context (CSRF tokens don't require authentication)
        token_key = f"anon_{secrets.token_hex(8)}"
        _csrf_tokens[token_key] = {
            "token": token,
            "expires": datetime.now() + timedelta(hours=1),  # 1 hour expiration
            "user_id": None,  # Anonymous token
        }

        return {
            "csrf_token": token,
            "expires_in": 3600,  # 1 hour in seconds
        }

    except Exception:
        raise HTTPException(status_code=500, detail="Failed to generate CSRF token")


@router.post("/validate-csrf")
async def validate_csrf_token(token: str):
    """
    Validate a CSRF token (optional endpoint for explicit validation)
    """
    try:
        # Check all possible token keys for anonymous users
        for key, stored_token in _csrf_tokens.items():
            if stored_token["token"] == token:
                if stored_token["expires"] > datetime.now():
                    return {"valid": True}
                else:
                    # Clean up expired token
                    del _csrf_tokens[key]
                    return {"valid": False, "error": "Token expired"}

        return {"valid": False, "error": "Invalid token"}

    except Exception:
        return {"valid": False, "error": "Validation failed"}


# Clean up expired tokens periodically (basic implementation)
@router.post("/cleanup-tokens")
async def cleanup_expired_tokens():
    """
    Clean up expired CSRF tokens (should be called by a scheduled job)
    """
    current_time = datetime.now()
    expired_keys = []

    for key, token_data in _csrf_tokens.items():
        if token_data["expires"] <= current_time:
            expired_keys.append(key)

    for key in expired_keys:
        del _csrf_tokens[key]

    return {"cleaned": len(expired_keys), "remaining": len(_csrf_tokens)}
