"""Expose `backend/app` as top-level `app` package for tests and scripts.

This file adjusts the package search path so imports like `app.routers.phase6b`
resolve to `backend/app/routers/phase6b.py`.
"""
import os
from pkgutil import extend_path

__path__ = extend_path(__path__, __name__)
backend_app_path = os.path.abspath(os.path.join(os.path.dirname(__file__), '..', 'backend', 'app'))
if backend_app_path not in __path__:
    __path__.insert(0, backend_app_path)

__all__ = []
