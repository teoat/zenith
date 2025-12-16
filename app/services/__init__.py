"""Package shim for `app.services` that exposes both workspace-local
service stubs and the real `backend/app/services` implementations.
"""
import os
from pkgutil import extend_path

__path__ = extend_path(__path__, __name__)
backend_services_path = os.path.abspath(os.path.join(os.path.dirname(__file__), '..', 'backend', 'app', 'services'))
if backend_services_path not in __path__:
	__path__.insert(0, backend_services_path)

# Import any lightweight shims provided in this directory (e.g., fraud, search)
try:
	from . import fraud  # type: ignore
	__all__ = ["fraud"]
except Exception:
	__all__ = []
