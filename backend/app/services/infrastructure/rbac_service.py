"""
Role-Based Access Control (RBAC) Extension for auth_service
Provides role checking and permission management
"""

import logging

from app.services.infrastructure.auth_service import auth_service
from fastapi import Depends, HTTPException, status

from core.database import User

logger = logging.getLogger(__name__)


class RBACService:
    """Service for role-based access control"""

    # Role hierarchy (higher number = more privileges)
    ROLE_HIERARCHY = {
        "user": 1,
        "analyst": 2,
        "investigator": 3,
        "admin": 10,
        "superadmin": 100,
    }

    def __init__(self):
        self.logger = logging.getLogger(__name__)

    def get_role_level(self, role: str) -> int:
        """Get numeric level for a role"""
        return self.ROLE_HIERARCHY.get(role.lower(), 0)

    def has_role(self, user: User, required_role: str) -> bool:
        """Check if user has required role or higher"""
        user_level = self.get_role_level(user.role if hasattr(user, "role") else "user")
        required_level = self.get_role_level(required_role)
        return user_level >= required_level

    def require_role(self, required_role: str):
        """Dependency that requires a specific role or higher"""

        async def role_checker(
            current_user: User = Depends(auth_service.get_current_user),
        ):
            if not self.has_role(current_user, required_role):
                self.logger.warning(
                    f"Access denied: User {current_user.id} (role: {getattr(current_user, 'role', 'user')}) "
                    f"attempted to access {required_role}-only resource"
                )
                raise HTTPException(
                    status_code=status.HTTP_403_FORBIDDEN,
                    detail=f"{required_role.capitalize()} role required. Current role: {getattr(current_user, 'role', 'user')}",
                )
            return current_user

        return role_checker

    def require_any_role(self, allowed_roles: list[str]):
        """Dependency that requires any of the specified roles"""

        async def role_checker(
            current_user: User = Depends(auth_service.get_current_user),
        ):
            user_role = getattr(current_user, "role", "user").lower()
            if user_role not in [r.lower() for r in allowed_roles]:
                self.logger.warning(
                    f"Access denied: User {current_user.id} (role: {user_role}) "
                    f"attempted to access resource requiring one of: {allowed_roles}"
                )
                raise HTTPException(
                    status_code=status.HTTP_403_FORBIDDEN,
                    detail=f"One of these roles required: {', '.join(allowed_roles)}. Current role: {user_role}",
                )
            return current_user

        return role_checker

    def check_permission(self, user: User, permission: str) -> bool:
        """Check if user has specific permission (extensible for future use)"""
        # Future: implement granular permissions
        # For now, map to roles
        permission_map = {
            "read:transactions": ["user", "analyst", "investigator", "admin"],
            "write:transactions": ["analyst", "investigator", "admin"],
            "delete:transactions": ["admin"],
            "read:cases": ["user", "analyst", "investigator", "admin"],
            "write:cases": ["analyst", "investigator", "admin"],
            "close:cases": ["investigator", "admin"],
            "read:analytics": ["analyst", "investigator", "admin"],
            "admin:system": ["admin", "superadmin"],
            "admin:users": ["admin", "superadmin"],
            "admin:backup": ["superadmin"],
        }

        user_role = getattr(user, "role", "user").lower()
        allowed_roles = permission_map.get(permission, [])
        return user_role in allowed_roles


# Global instance
rbac_service = RBACService()


# Convenience dependencies for common roles
def require_admin(current_user: User = Depends(auth_service.get_current_user)):
    """Require admin role"""
    return rbac_service.require_role("admin")(current_user)


def require_investigator(current_user: User = Depends(auth_service.get_current_user)):
    """Require investigator role or higher"""
    return rbac_service.require_role("investigator")(current_user)


def require_analyst(current_user: User = Depends(auth_service.get_current_user)):
    """Require analyst role or higher"""
    return rbac_service.require_role("analyst")(current_user)
