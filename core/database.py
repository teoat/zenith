"""Compatibility wrapper for backend.core.database
Re-exports everything from `backend.core.database` so top-level `core.database`
imports continue to function.
"""
from backend.core.database import *  # noqa: F401,F403

__all__ = [name for name in globals().keys() if not name.startswith("_")]
