"""Top-level compatibility package for `core.*` imports.
These modules re-export the implementations under `backend.core` so tests and scripts
that import `core.*` continue to work.
"""

from . import database, metrics, validation, logging, security  # re-export submodules

__all__ = ["database", "metrics", "validation", "logging", "security"]