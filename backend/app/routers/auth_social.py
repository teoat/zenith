from fastapi import APIRouter, HTTPException
from starlette.responses import RedirectResponse

router = APIRouter(prefix="/auth/oauth", tags=["Social Authentication"])


@router.get("/{provider}")
async def oauth_login(provider: str):
    """
    Redirect user to social identity provider.
    """
    if provider not in ["google", "microsoft", "okta"]:
        raise HTTPException(status_code=400, detail="Unsupported provider")

    # Simulate redirect url
    return RedirectResponse(url=f"https://{provider}.com/oauth2/authorize?client_id=123&redirect_uri=https://api.zenith.com/callback")


@router.get("/{provider}/callback")
async def oauth_callback(provider: str, code: str):
    """
    Handle OAuth2 callback code exchange.
    """
    # Simulate token exchange and user lookup
    user_email = f"user@example-{provider}.com"
    return {
        "access_token": "mock_access_token",
        "user_email": user_email,
        "linked": True,
    }
