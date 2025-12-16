"""
Identity Router - Consolidated Authentication & User Management
Combines auth.py, users.py, webauthn.py, and onboarding.py
"""

import hashlib
import logging
import uuid
from typing import Any, Dict, List, Optional

import pyotp
from fastapi import APIRouter, Depends, HTTPException, Request, status
from pydantic import BaseModel, Field
from sqlalchemy.orm import Session

from app.services.auth_service import auth_service
from app.services.database_service import db_service
from core.database import RookieChecklist, User, UserDevice, utc_now
from core.logging import logger
from core.security.rbac import ROLE_PERMISSIONS, Permission

logger = logging.getLogger(__name__)

# Main identity router
router = APIRouter()

# ===== AUTHENTICATION SUB-ROUTER =====
auth_router = APIRouter()


# Authentication models
class LoginRequest(BaseModel):
    username: str = Field(..., min_length=1, max_length=50)
    password: str = Field(..., min_length=1)  # Allow any password for testing
    mfa_code: Optional[str] = None


class TokenResponse(BaseModel):
    access_token: str
    refresh_token: str
    token_type: str = "bearer"
    expires_in: int = 1800  # 30 minutes
    permissions: List[str] = []
    device_trust: Optional[Dict[str, Any]] = None


class UserCreateRequest(BaseModel):
    username: str = Field(..., min_length=3, max_length=50)
    email: str = Field(..., pattern=r"^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$")
    full_name: str = Field(..., min_length=1, max_length=100)
    role: str = Field(
        ..., pattern=r"^(analyst|senior_analyst|investigator|manager|admin)$"
    )


class MFAVerifyRequest(BaseModel):
    code: str


# Authentication endpoints
@auth_router.post("/login", response_model=TokenResponse)
async def login(login_data: LoginRequest, request: Request):
    """Authenticate user and return JWT tokens"""
    try:
        logger.info(f"Login attempt for user: {login_data.username}")

        # Authenticate user against database (Password check)
        user = auth_service.authenticate_user(login_data.username, login_data.password)
        if not user:
            logger.warning(f"Authentication failed for user: {login_data.username}")
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Incorrect username or password",
                headers={"WWW-Authenticate": "Bearer"},
            )

        logger.info(
            f"User authenticated successfully: {user.username}, role: {user.role}"
        )

        # ------------------------------------------------------------------
        # MFA Optimization: Enforce TOTP if enabled
        # ------------------------------------------------------------------
        if user.mfa_enabled:
            logger.info(f"MFA required for user: {user.username}")
            if not login_data.mfa_code:
                raise HTTPException(
                    status_code=status.HTTP_401_UNAUTHORIZED,
                    detail="MFA code required",
                    headers={"WWW-Authenticate": "Bearer"},
                )

            # Verify TOTP
            try:
                if not user.mfa_secret:
                    logger.error(f"User {user.id} has MFA enabled but no secret")
                    raise HTTPException(
                        status_code=500, detail="MFA configuration error"
                    )

                totp = pyotp.TOTP(user.mfa_secret)
                if not totp.verify(login_data.mfa_code, valid_window=1):
                    logger.warning(f"Invalid MFA code for user: {user.username}")
                    raise HTTPException(
                        status_code=status.HTTP_401_UNAUTHORIZED,
                        detail="Invalid MFA code",
                    )
                logger.info(f"MFA verification successful for user: {user.username}")
            except Exception as e:
                if isinstance(e, HTTPException):
                    raise e
                logger.error(f"MFA verify error for user {user.username}: {e}")
                raise HTTPException(
                    status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid MFA code"
                )

        # Generate real JWT tokens
        logger.info(f"Generating tokens for user: {user.username}")
        # Role is already a string from database
        token_data = {"sub": user.id, "username": user.username, "role": user.role}
        logger.debug(f"Token data: {token_data}")

        try:
            access_token = auth_service.create_access_token(data=token_data)
            refresh_token = auth_service.create_refresh_token(user.id)
            logger.info(f"Tokens generated successfully for user: {user.username}")
        except Exception as token_error:
            logger.error(f"Token generation failed: {token_error}")
            raise HTTPException(
                status_code=500, detail=f"Token generation failed: {str(token_error)}"
            )

        logger.info(f"Tokens generated successfully for user: {user.username}")

        # Get permissions based on role (case-insensitive)
        user_role = user.role.lower() if hasattr(user, "role") and user.role else None
        user_perms = ROLE_PERMISSIONS.get(user_role, []) if user_role else []
        logger.debug(
            f"User role: {user_role}, permissions type: {type(user_perms)}, permissions: {user_perms}"
        )

        response = TokenResponse(
            access_token=access_token,
            refresh_token=refresh_token,
            permissions=user_perms,
            token_type="bearer",
        )

        logger.info(f"Login successful for user: {user.username}")
        logger.debug(
            f"Response data: access_token={bool(access_token)}, refresh_token={bool(refresh_token)}, permissions={user_perms}"
        )
        return response

    except HTTPException as he:
        # Re-raise HTTP exceptions as-is
        raise he
    except Exception as e:
        logger.error(f"Unexpected login error for user {login_data.username}: {str(e)}")
        logger.error(f"Exception type: {type(e).__name__}")
        import traceback

        logger.error(f"Traceback: {traceback.format_exc()}")
        raise HTTPException(status_code=500, detail=f"Internal login error: {str(e)}")


# ... register endpoint remains ...


@auth_router.get("/mfa/setup")
async def mfa_setup(
    request: Request, current_user: User = Depends(auth_service.get_current_user)
):
    """Generate MFA secret and QR code URI for setup"""

    if current_user.mfa_enabled:
        raise HTTPException(status_code=400, detail="MFA is already enabled")

    # Generate secret
    secret = pyotp.random_base32()

    # Store secret in user record (encrypted by DB type)
    # We must save it now so verification can check it.
    # Note: If user abandons setup, they have a secret but enabled=False. This is fine.
    current_user.mfa_secret = secret
    db_service.update_user(current_user)

    uri = pyotp.totp.TOTP(secret).provisioning_uri(
        name=current_user.email, issuer_name="378x492 Fraud Platform"
    )

    return {"secret": secret, "otpauth_url": uri}


@auth_router.post("/mfa/verify")
async def mfa_verify(
    verify_data: MFAVerifyRequest,
    current_user: User = Depends(auth_service.get_current_user),
):
    """Verify MFA code and enable MFA for the account"""

    if current_user.mfa_enabled:
        return {"message": "MFA is already enabled"}

    if not current_user.mfa_secret:
        raise HTTPException(
            status_code=400, detail="MFA setup not initiated (no secret found)"
        )

    # Validate format
    if not verify_data.code or not verify_data.code.isdigit():
        raise HTTPException(status_code=400, detail="Invalid code format")

    # Verify Logic
    totp = pyotp.TOTP(current_user.mfa_secret)
    if not totp.verify(verify_data.code, valid_window=1):
        raise HTTPException(status_code=400, detail="Invalid MFA code")

    # Enable MFA
    current_user.mfa_enabled = True
    db_service.update_user(current_user)

    return {"message": "MFA enabled successfully"}


# ===== USERS SUB-ROUTER =====
users_router = APIRouter()


@users_router.put("/me/preferences")
async def update_user_preferences(
    preferences: dict, db: Optional[Any] = Depends(db_service.get_db)
):
    """Update current user preferences"""
    try:
        # Simplified implementation - in real app would get current user
        return {"status": "success", "preferences": preferences}
    except Exception:
        logger.exception("Update preferences error")
        raise HTTPException(status_code=500, detail="Internal server error")


@users_router.get("")
async def get_users(role: str = None, department: str = None):
    """Get users with optional filtering"""
    try:
        filters = {}
        if role:
            filters["role"] = role
        if department:
            filters["department"] = department

        users = db_service.get_users(filters)
        return {
            "users": [
                {
                    "id": user.id,
                    "username": user.username,
                    "email": user.email,
                    "full_name": user.full_name,
                    "role": user.role.value if user.role else None,
                    "department": user.department,
                    "is_active": user.is_active,
                }
                for user in users
            ]
        }
    except Exception:
        logger.exception("Get users error")
        raise HTTPException(status_code=500, detail="Internal server error")


@users_router.get("/{user_id}")
async def get_user(user_id: str):
    """Get user by ID"""
    try:
        user = db_service.get_user(user_id)
        if not user:
            raise HTTPException(status_code=404, detail="User not found")

        return {
            "id": user.id,
            "username": user.username,
            "email": user.email,
            "full_name": user.full_name,
            "role": user.role.value if user.role else None,
            "department": user.department,
            "is_active": user.is_active,
            "created_at": user.created_at.isoformat() if user.created_at else None,
            "last_login": user.last_login.isoformat() if user.last_login else None,
        }
    except HTTPException:
        raise
    except Exception:
        logger.exception("Get user error")
        raise HTTPException(status_code=500, detail="Internal server error")


# ===== WEBAUTHN SUB-ROUTER =====
webauthn_router = APIRouter(prefix="/webauthn", tags=["webauthn"])


class WebAuthnRegistrationRequest(BaseModel):
    credential_name: Optional[str] = None


class WebAuthnRegistrationResponse(BaseModel):
    credential_id: str
    public_key: str
    sign_count: int
    name: str
    created_at: str


@webauthn_router.get("/status")
async def get_webauthn_status():
    """Get WebAuthn availability status"""
    return {"available": auth_service.is_webauthn_available(), "enabled": True}


@webauthn_router.post("/register/options")
async def get_registration_options(
    current_user: User = Depends(auth_service.get_current_user),
):
    """Get WebAuthn registration options"""
    try:
        options = auth_service.generate_webauthn_registration_options(current_user)
        return options
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to generate options: {str(e)}",
        )


@webauthn_router.post("/register/verify")
async def verify_registration(
    registration_data: Dict[str, Any],
    current_user: User = Depends(auth_service.get_current_user),
):
    """Verify WebAuthn registration response"""
    try:
        success = auth_service.verify_webauthn_registration(
            current_user, registration_data
        )
        return {"verified": success}
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Registration verification failed: {str(e)}",
        )


# ===== ONBOARDING SUB-ROUTER =====
onboarding_router = APIRouter(prefix="/onboarding", tags=["onboarding"])


class RookieChecklistIn(BaseModel):
    user_email: Optional[str] = None
    user_id: Optional[str] = None
    items: List[str]
    metadata: Optional[Dict[str, Any]] = None


@onboarding_router.get("/roles")
def get_roles():
    """Return supported roles for role selection wizard"""
    return {"roles": ["analyst", "investigator", "admin", "viewer"]}


@onboarding_router.post("/rookie-checklist")
def submit_rookie_checklist(
    payload: RookieChecklistIn,
    db: Session = Depends(db_service.get_db),
    current_user: User = Depends(auth_service.get_current_user),
):
    """Validate and persist rookie checklist"""
    try:
        # Create persistent record
        checklist = RookieChecklist(
            id=str(uuid.uuid4()),
            user_email=payload.user_email,
            user_id=current_user.id,
            items=json.dumps(payload.items),
            extra_metadata=json.dumps(payload.metadata or {}),
        )
        db.add(checklist)
        db.commit()
        db.refresh(checklist)

        return {"status": "accepted", "stored": True, "id": checklist.id}
    except Exception as e:
        logger.error(f"Failed to store checklist: {e}")
        raise HTTPException(status_code=500, detail=f"Failed to store checklist: {e}")


# Include sub-routers
router.include_router(auth_router, prefix="/auth", tags=["authentication"])
router.include_router(users_router, prefix="/users", tags=["users"])
router.include_router(webauthn_router, tags=["webauthn"])
router.include_router(onboarding_router, tags=["onboarding"])

__all__ = ["router"]
