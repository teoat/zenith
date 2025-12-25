"""
Role-Based Access Control (RBAC) for Zenith Fraud Detection Platform
"""

from enum import Enum
from typing import Any, Dict, List


class Permission(str, Enum):
    # Case permissions
    VIEW_CASES = "view_cases"
    CREATE_CASES = "create_cases"
    EDIT_CASES = "edit_cases"
    DELETE_CASES = "delete_cases"
    CLOSE_CASES = "close_cases"

    # Transaction permissions
    VIEW_TRANSACTIONS = "view_transactions"
    UPLOAD_TRANSACTIONS = "upload_transactions"
    EDIT_TRANSACTIONS = "edit_transactions"

    # Evidence permissions
    VIEW_EVIDENCE = "view_evidence"
    UPLOAD_EVIDENCE = "upload_evidence"
    DELETE_EVIDENCE = "delete_evidence"

    # User permissions
    MANAGE_USERS = "manage_users"
    VIEW_USERS = "view_users"

    # System permissions
    VIEW_REPORTS = "view_reports"
    MANAGE_SYSTEM = "manage_system"
    VIEW_AUDIT = "view_audit"


# Role definitions
ROLE_PERMISSIONS: Dict[str, List[str]] = {
    "viewer": [
        Permission.VIEW_CASES,
        Permission.VIEW_TRANSACTIONS,
        Permission.VIEW_EVIDENCE,
        Permission.VIEW_REPORTS,
    ],
    "analyst": [
        Permission.VIEW_CASES,
        Permission.CREATE_CASES,
        Permission.EDIT_CASES,
        Permission.VIEW_TRANSACTIONS,
        Permission.UPLOAD_TRANSACTIONS,
        Permission.EDIT_TRANSACTIONS,
        Permission.VIEW_EVIDENCE,
        Permission.UPLOAD_EVIDENCE,
        Permission.VIEW_REPORTS,
        Permission.VIEW_AUDIT,
    ],
    "investigator": [
        Permission.VIEW_CASES,
        Permission.CREATE_CASES,
        Permission.EDIT_CASES,
        Permission.CLOSE_CASES,
        Permission.DELETE_CASES,
        Permission.VIEW_TRANSACTIONS,
        Permission.UPLOAD_TRANSACTIONS,
        Permission.EDIT_TRANSACTIONS,
        Permission.VIEW_EVIDENCE,
        Permission.UPLOAD_EVIDENCE,
        Permission.DELETE_EVIDENCE,
        Permission.VIEW_REPORTS,
        Permission.VIEW_AUDIT,
    ],
    "manager": [
        Permission.VIEW_CASES,
        Permission.CREATE_CASES,
        Permission.EDIT_CASES,
        Permission.CLOSE_CASES,
        Permission.DELETE_CASES,
        Permission.VIEW_TRANSACTIONS,
        Permission.UPLOAD_TRANSACTIONS,
        Permission.EDIT_TRANSACTIONS,
        Permission.VIEW_EVIDENCE,
        Permission.UPLOAD_EVIDENCE,
        Permission.DELETE_EVIDENCE,
        Permission.MANAGE_USERS,
        Permission.VIEW_USERS,
        Permission.VIEW_REPORTS,
        Permission.VIEW_AUDIT,
    ],
    "admin": [
        Permission.VIEW_CASES,
        Permission.CREATE_CASES,
        Permission.EDIT_CASES,
        Permission.CLOSE_CASES,
        Permission.DELETE_CASES,
        Permission.VIEW_TRANSACTIONS,
        Permission.UPLOAD_TRANSACTIONS,
        Permission.EDIT_TRANSACTIONS,
        Permission.VIEW_EVIDENCE,
        Permission.UPLOAD_EVIDENCE,
        Permission.DELETE_EVIDENCE,
        Permission.MANAGE_USERS,
        Permission.VIEW_USERS,
        Permission.MANAGE_SYSTEM,
        Permission.VIEW_REPORTS,
        Permission.VIEW_AUDIT,
    ],
}


def has_permission(user_role: str, permission: str) -> bool:
    """Check if a user role has a specific permission"""
    if user_role not in ROLE_PERMISSIONS:
        return False
    return permission in ROLE_PERMISSIONS[user_role]


def get_role_permissions(role: str) -> List[str]:
    """Get all permissions for a role"""
    return ROLE_PERMISSIONS.get(role, [])
