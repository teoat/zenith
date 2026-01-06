import os
import sys

from dotenv import load_dotenv
from test_config import setup_test_environment

# Ensure backend package path is importable when running tests from project root
sys.path.insert(0, os.path.abspath("."))

load_dotenv()
setup_test_environment()

# Import the phase6b router directly and mount it on a lightweight test app
from app.routers.phase6b import router as phase6b_router
from fastapi import FastAPI
from fastapi.testclient import TestClient

# Import create_tables in a robust way so tests run regardless of sys.path order
try:
    from backend.core.database import create_tables
except Exception:
    try:
        from core.database import create_tables
    except Exception:
        import importlib.util
        import os
        import sys

        db_path = os.path.join(os.path.abspath("backend"), "core", "database.py")
        spec = importlib.util.spec_from_file_location("backend_core_database", db_path)
        db_mod = importlib.util.module_from_spec(spec)
        spec.loader.exec_module(db_mod)  # type: ignore
        create_tables = getattr(db_mod, "create_tables")

# Create DB tables for tests
create_tables()

app = FastAPI()
app.include_router(phase6b_router, prefix="/api/v1")
client = TestClient(app)


def test_metadata_correlation():
    payload = {"case_id": "case-123", "fields": ["ip_address", "device_fingerprint"]}
    r = client.post("/api/v1/phase6b/metadata-correlation", json=payload)
    assert r.status_code == 200
    body = r.json()
    assert body.get("case_id") == "case-123"
    assert body.get("fields") == ["ip_address", "device_fingerprint"]
    assert "correlated_entities" in body
    assert isinstance(body["correlated_entities"], list)


def test_temporal_burst():
    # This test is simpler than the original test_temporal_detector.py,
    # as it tests the endpoint, not the underlying service directly.
    # It doesn't require setting up a database session.
    payload = {"entity_id": "192.168.1.101", "window_minutes": 60}
    r = client.post("/api/v1/phase6b/temporal-burst", json=payload)
    assert r.status_code == 200
    body = r.json()
    assert "burst_detected" in body
    assert "z_score" in body
    assert "count_now" in body
    assert "mean_hist" in body
    assert "std_hist" in body
