"""Compatibility shim that provides a lightweight `AsyncClient(app)` API
backed by Starlette's TestClient so tests written for older helpers keep working.

This shadow file is intentionally small and only implements the sync methods
used by the test suite (get, post, put, delete, json(), status_code access, etc.).
"""
from typing import Any


class AsyncClient:
    def __init__(self, app=None, *args, **kwargs):
        # Lazy import to avoid circular import during package init
        from starlette.testclient import TestClient

        # Accept positional `app` like older AsyncClient usage in tests
        self._client = TestClient(app)

    # Provide common HTTP methods used in tests
    def get(self, *args, **kwargs):
        return self._client.get(*args, **kwargs)

    def post(self, *args, **kwargs):
        return self._client.post(*args, **kwargs)

    def put(self, *args, **kwargs):
        return self._client.put(*args, **kwargs)

    def delete(self, *args, **kwargs):
        return self._client.delete(*args, **kwargs)

    def patch(self, *args, **kwargs):
        return self._client.patch(*args, **kwargs)

    # Close helper
    def close(self):
        try:
            self._client.__exit__(None, None, None)
        except Exception:
            pass

    # Context manager support
    def __enter__(self):
        return self

    def __exit__(self, exc_type, exc, tb):
        self.close()

# Also support top-level functions or other attributes if tests expect them
__all__ = ["AsyncClient"]
