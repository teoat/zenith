"""Top-level entrypoint shim for tests and tooling.
Exposes `app` for test imports (mirrors `backend.main.app`).
"""

from backend.main import app  # re-export the FastAPI app

__all__ = ["app"]
