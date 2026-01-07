from datetime import datetime

import pyotp
from fastapi import APIRouter, Depends, HTTPException, Request, Response, status
from pydantic import BaseModel, Field

from app.services.infrastructure.auth_service import auth_service
from app.services.infrastructure.storage.database_service import db_service
from core.database import User
from core.logging import logger

router = APIRouter()


# Authentication models
class LoginRequest(BaseModel):
    username: str = Field(..., min_length=1, max_length=50)
    password: str = Field(..., min_length=8)
    mfa_code: str | None = None


class TokenResponse(BaseModel):
    access_token: str
    refresh_token: str
    token_type: str = "bearer"
    expires_in: int = 1800  # 30 minutes


class UserCreateRequest(BaseModel):
    username: str = Field(..., min_length=3, max_length=50)
    email: str = Field(..., pattern=r"^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$")
    full_name: str = Field(..., min_length=1, max_length=100)
    role: str = Field(..., pattern=r"^(analyst|senior_analyst|investigator|manager|admin)$")


class RegisterRequest(BaseModel):
    username: str = Field(..., min_length=3, max_length=50)
    email: str = Field(..., pattern=r"^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$")
    password: str = Field(..., min_length=8, max_length=128)
    full_name: str = Field(..., min_length=1, max_length=100)
    role: str | None = "ANALYST"  # Default role


class UserProfileResponse(BaseModel):
    id: str
    username: str
    email: str
    full_name: str
    role: str
    is_active: bool
    mfa_enabled: bool
    created_at: datetime
    last_login: datetime | None


# ===== AUTHENTICATION ENDPOINTS =====


class RegisterResponse(BaseModel):
    user_id: str
    username: str
    email: str
    message: str
    created_at: datetime


@router.post("/register", response_model=RegisterResponse, status_code=status.HTTP_201_CREATED)
async def register(user_data: RegisterRequest):
    """
    Register a new user with password strength validation
    """
    try:
        # Validate password strength
        password_errors = auth_service.validate_password_strength(user_data.password)
        if password_errors:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail={
                    "message": "Password does not meet security requirements",
                    "errors": password_errors,
                },
            )

        # Check if username already exists
        existing_user = auth_service.get_user_by_username(user_data.username)
        if existing_user:
            raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail="Username already exists")

        # Check if email already exists
        existing_email = auth_service.get_user_by_email(user_data.email)
        if existing_email:
            raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail="Email already registered")

        # Create user
        new_user = auth_service.create_user(user_data)

        logger.info(f"New user registered: {new_user.username}")

        return {
            "id": new_user.id,
            "username": new_user.username,
            "email": new_user.email,
            "full_name": new_user.full_name,
            "role": new_user.role,
            "message": "User registered successfully",
        }

    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Registration error: {e!s}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="An internal error occurred during registration.",
        )


@router.post("/login", response_model=UserProfileResponse)
async def login(login_data: LoginRequest, request: Request, response: Response):
    """
    Authenticate user and set HttpOnly cookies.
    """
    try:
        user = auth_service.authenticate_user(login_data.username, login_data.password)
        if not user:
            logger.warning(
                f"Failed login attempt for username: {login_data.username} from IP: {request.client.host if request.client else 'unknown'}"
            )
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Invalid username or password",
            )

        # CHECK MFA
        if user.mfa_enabled:
            # If MFA enabled and no code provided, return 403 to trigger frontend prompt
            if not login_data.mfa_code:
                raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="MFA code required")

            if not user.mfa_secret:
                logger.error(f"User {user.username} has MFA enabled but no secret")
                raise HTTPException(status_code=500, detail="MFA configuration error")

            totp = pyotp.TOTP(user.mfa_secret)
            if not totp.verify(login_data.mfa_code):
                logger.warning(f"Invalid MFA code for user {user.username}")
                raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid MFA code")

        logger.info(
            f"Successful login for user: {user.username} (ID: {user.id}) from IP: {request.client.host if request.client else 'unknown'}"
        )

        # Track user journey
        try:
            from app.services.business.user_journey_tracker import user_journey_tracker

            user_journey_tracker.track_event(
                user_id=user.id,
                event_type="login",
                metadata={"role": user.role, "mfa": user.mfa_enabled},
            )
        except Exception as e:
            logger.warning(f"Failed to track user journey event: {e}")

        # Create tokens
        access_token = auth_service.create_access_token(
            {
                "sub": user.id,
                "username": user.username,
                "role": user.role,
                "mfa_verified": user.mfa_enabled,
            }
        )
        refresh_token = auth_service.create_refresh_token(user.id)

        # Set HttpOnly Cookies
        # Secure=True in production (HTTPS), False in dev if needed
        secure_cookie = True

        response.set_cookie(
            key="access_token",
            value=access_token,
            httponly=True,
            secure=secure_cookie,
            samesite="strict",
            max_age=1800,  # 30 minutes
        )

        response.set_cookie(
            key="refresh_token",
            value=refresh_token,
            httponly=True,
            secure=secure_cookie,
            samesite="strict",
            path="/api/v1/auth/refresh",
            max_age=7 * 24 * 60 * 60,  # 7 days
        )

        return {
            "id": user.id,
            "username": user.username,
            "email": user.email,
            "full_name": user.full_name,
            "role": user.role,
            "is_active": user.is_active,
            "mfa_enabled": user.mfa_enabled,
            "created_at": user.created_at,
            "last_login": user.last_login,
        }

    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Login error: {e!s}")
        raise HTTPException(status_code=500, detail="Internal login error")


class MFAVerifyRequest(BaseModel):
    code: str


class MFASetupResponse(BaseModel):
    secret: str
    otpauth_url: str


@router.get("/mfa/setup", response_model=MFASetupResponse)
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
    uri = pyotp.totp.TOTP(secret).provisioning_uri(name=current_user.email, issuer_name="Zenith Fraud Platform")

    return {"secret": secret, "otpauth_url": uri}


class MFAVerifyResponse(BaseModel):
    verified: bool
    message: str


@router.post("/mfa/verify", response_model=MFAVerifyResponse)
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
            raise HTTPException(status_code=400, detail="MFA setup not initiated (no secret found)")

        totp = pyotp.TOTP(user.mfa_secret)
        if not totp.verify(verify_data.code):
            raise HTTPException(status_code=400, detail="Invalid code")

        # Enable MFA
        user.mfa_enabled = True
        db.commit()

    logger.info(f"MFA enabled for user {current_user.username}")
    return {"message": "MFA enabled successfully"}


@router.post("/refresh")
async def refresh_token(request: Request, response: Response):
    """
    Refresh access token using HttpOnly cookie.
    """
    refresh_token = request.cookies.get("refresh_token")
    if not refresh_token:
        raise HTTPException(status_code=401, detail="Refresh cookie missing")

    try:
        # Verify refresh token
        payload = auth_service.decode_token(refresh_token)
        if payload.get("type") != "refresh":
            raise HTTPException(status_code=401, detail="Invalid token type")

        user_id = payload.get("sub")

        # Determine claims
        user = auth_service.get_user(user_id) if hasattr(auth_service, "get_user") else None

        claims = {"sub": user_id}
        if user:
            claims.update(
                {
                    "username": user.username,
                    "role": user.role,
                    "mfa_verified": user.mfa_enabled,
                }
            )
        else:
            claims.update({"username": "unknown", "role": "analyst"})

        new_access_token = auth_service.create_access_token(claims)

        # Set new access token cookie
        response.set_cookie(
            key="access_token",
            value=new_access_token,
            httponly=True,
            secure=True,
            samesite="strict",
            max_age=1800,  # 30 minutes
        )

        return {"message": "Token refreshed"}

    except Exception as e:
        logger.warning(f"Refresh failed: {e}")
        # Clear cookies on failure
        response.delete_cookie("access_token")
        response.delete_cookie("refresh_token", path="/api/v1/auth/refresh")
        raise HTTPException(status_code=401, detail="Invalid refresh token")


@router.post("/logout")
async def logout(response: Response):
    """
    Logout user by clearing cookies.
    """
    response.delete_cookie("access_token")
    response.delete_cookie("refresh_token", path="/api/v1/auth/refresh")
    return {"message": "Logged out successfully"}


@router.get("/me", response_model=UserProfileResponse)
async def get_current_user_profile(
    current_user: User = Depends(auth_service.get_current_user),
):
    """Get current user profile"""
    return {
        "id": current_user.id,
        "username": current_user.username,
        "email": current_user.email,
        "full_name": current_user.full_name,
        "role": current_user.role,
        "is_active": current_user.is_active,
        "mfa_enabled": current_user.mfa_enabled,
        "created_at": current_user.created_at,
        "last_login": current_user.last_login,
    }
