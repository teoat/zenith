"""Top-level compatibility package for `services.*` imports.
This package exposes the modules from `backend/services` by extending the
package search path so imports like `import services.temporal_detector` will
resolve to `backend/services/temporal_detector.py`.
"""
import os
from pkgutil import extend_path

# Extend package path to include backend/services directory
__path__ = extend_path(__path__, __name__)
backend_services_path = os.path.abspath(os.path.join(os.path.dirname(__file__), '..', 'backend', 'services'))
if backend_services_path not in __path__:
	__path__.insert(0, backend_services_path)

__all__ = []
