"""Compatibility shim that re-exports `backend.app.services.auth_service`.
"""
from backend.app.services.auth_service import *  # noqa: F401,F403

__all__ = [name for name in globals().keys() if not name.startswith("_")]
