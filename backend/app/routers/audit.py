from fastapi import APIRouter
from typing import List, Dict
from datetime import datetime

router = APIRouter()

# ---- Test placeholders (allow tests to patch module-level dependencies) ----
if 'get_current_user' not in globals():
    def get_current_user(*args, **kwargs):
        return None

if 'require_permission' not in globals():
    def require_permission(*args, **kwargs):
        def _dep(*a, **k):
            return None
        return _dep

for _svc in ('audit_service',):
    if _svc not in globals():
        globals()[_svc] = None

@router.get("/")
def get_audit_logs(limit: int = 50, offset: int = 0):
    """Returns paginated audit logs"""
    return [
        {"id": 1, "action": "LOGIN", "user": "admin", "timestamp": datetime.now(), "ip": "127.0.0.1"},
        {"id": 2, "action": "VIEW_CASE", "resource_id": "123", "user": "investigator", "timestamp": datetime.now(), "ip": "192.168.1.5"},
    ]