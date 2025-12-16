"""Compatibility wrapper for backend.core.security
Re-exports everything from `backend.core.security` so top-level `core.security`
imports continue to function.
"""
from backend.core.security import *  # noqa: F401,F403

__all__ = [name for name in globals().keys() if not name.startswith("_")]