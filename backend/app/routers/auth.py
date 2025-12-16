from typing import Optional

import pyotp
from fastapi import APIRouter, Depends, HTTPException, Request, status
from pydantic import BaseModel, Field

from app.services.auth_service import auth_service
from app.services.database_service import db_service
from core.database import User
from core.logging import logger

router = APIRouter()


# Authentication models
class LoginRequest(BaseModel):
    username: str = Field(..., min_length=1, max_length=50)
    password: str = Field(..., min_length=8)
    mfa_code: Optional[str] = None


class TokenResponse(BaseModel):
    access_token: str
    refresh_token: str
    token_type: str = "bearer"
    expires_in: int = 1800  # 30 minutes


class UserCreateRequest(BaseModel):
    username: str = Field(..., min_length=3, max_length=50)
    email: str = Field(..., pattern=r"^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$")
    full_name: str = Field(..., min_length=1, max_length=100)
    role: str = Field(
        ..., pattern=r"^(analyst|senior_analyst|investigator|manager|admin)$"
    )


# ===== AUTHENTICATION ENDPOINTS =====


@router.post("/login", response_model=TokenResponse)
async def login(login_data: LoginRequest, request: Request):
    """
    Authenticate user and return JWT tokens.
    Supports MFA: If user has MFA enabled, mfa_code is required.
    """
    try:
        user = auth_service.authenticate_user(login_data.username, login_data.password)
        if not user:
            # Log authentication failure
            logger.warning(
                f"Failed login attempt for username: {login_data.username} from IP: {request.client.host if request.client else 'unknown'}"
            )
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Invalid username or password",
            )

        # CHECK MFA
        if user.mfa_enabled:
            if not login_data.mfa_code:
                # Require MFA code
                raise HTTPException(
                    status_code=status.HTTP_403_FORBIDDEN, detail="MFA code required"
                )

            # Verify MFA code
            if not user.mfa_secret:
                logger.error(f"User {user.username} has MFA enabled but no secret")
                raise HTTPException(status_code=500, detail="MFA configuration error")

            totp = pyotp.TOTP(user.mfa_secret)
            if not totp.verify(login_data.mfa_code):
                logger.warning(f"Invalid MFA code for user {user.username}")
                raise HTTPException(
                    status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid MFA code"
                )

        # Log successful authentication
        logger.info(
            f"Successful login for user: {user.username} (ID: {user.id}) from IP: {request.client.host if request.client else 'unknown'}"
        )

        # Track user journey event
        try:
            from app.services.user_journey_tracker import user_journey_tracker

            user_journey_tracker.track_event(
                user_id=user.id,
                event_type="login",
                metadata={
                    "role": user.role.value if user.role else None,
                    "mfa": user.mfa_enabled,
                },
            )
        except Exception as e:
            logger.warning(f"Failed to track login event: {e}")

        # Create tokens
        access_token = auth_service.create_access_token(
            {
                "sub": user.id,
                "username": user.username,
                "role": user.role.value if user.role else None,
                "mfa_verified": user.mfa_enabled,  # Add claim
            }
        )

        refresh_token = auth_service.create_refresh_token(user.id)

        return TokenResponse(access_token=access_token, refresh_token=refresh_token)
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Login error: {str(e)}")
        raise HTTPException(status_code=500, detail="Internal login error")


class MFAVerifyRequest(BaseModel):
    code: str


@router.get("/mfa/setup")
async def mfa_setup(current_user: User = Depends(auth_service.get_current_user)):
    """Generate MFA secret and QR code URI for setup"""
    if current_user.mfa_enabled:
        raise HTTPException(status_code=400, detail="MFA is already enabled")

    # Generate secret
    secret = pyotp.random_base32()

    # Save secret to DB (but don't enable yet)
    # We must fetch a fresh user instance attached to a session to update
    with db_service.get_db() as db:
        user = db.query(User).filter(User.id == current_user.id).first()
        if not user:
            raise HTTPException(status_code=404, detail="User not found")

        user.mfa_secret = secret
        db.commit()

    # Generate Provisioning URI
    uri = pyotp.totp.TOTP(secret).provisioning_uri(
        name=current_user.email, issuer_name="378x492 Fraud Platform"
    )

    return {"secret": secret, "otpauth_url": uri}


@router.post("/mfa/verify")
async def mfa_verify(
    verify_data: MFAVerifyRequest,
    current_user: User = Depends(auth_service.get_current_user),
):
    """Verify MFA code and enable MFA for the account"""
    if current_user.mfa_enabled:
        return {"message": "MFA is already enabled"}

    # We need the secret from the DB
    # Fetch fresh user
    with db_service.get_db() as db:
        user = db.query(User).filter(User.id == current_user.id).first()
        if not user or not user.mfa_secret:
            raise HTTPException(
                status_code=400, detail="MFA setup not initiated (no secret found)"
            )

        totp = pyotp.TOTP(user.mfa_secret)
        if not totp.verify(verify_data.code):
            raise HTTPException(status_code=400, detail="Invalid code")

        # Enable MFA
        user.mfa_enabled = True
        db.commit()

    logger.info(f"MFA enabled for user {current_user.username}")
    return {"message": "MFA enabled successfully"}


@router.post("/register", response_model=TokenResponse)
async def register(user_data: UserCreateRequest):
    """Register a new user and return JWT tokens"""
    try:
        # Check if user exists
        if auth_service.get_user_by_username(
            user_data.username
        ) or auth_service.get_user_by_email(user_data.email):
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Username or email already registered",
            )

        # Create user
        user = auth_service.create_user(user_data)

        # Create tokens
        access_token = auth_service.create_access_token(
            {
                "sub": user.id,
                "username": user.username,
                "role": user.role.value if user.role else None,
            }
        )

        refresh_token = auth_service.create_refresh_token(user.id)

        return TokenResponse(access_token=access_token, refresh_token=refresh_token)
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
