import os
import sys

# Ensure backend path
sys.path.insert(0, os.path.abspath('backend'))

from fastapi import FastAPI
from fastapi.testclient import TestClient

from app.routers.phase6b import router as phase6b_router
from core.database import create_tables
from test_config import setup_test_environment

setup_test_environment()
create_tables()


def test_metadata_correlation_empty():
    app = FastAPI()
    app.include_router(phase6b_router, prefix='/api/v1')
    client = TestClient(app)

    payload = {'case_id': 'case_x', 'fields': ['email', 'ip']}
    r = client.post('/api/v1/phase6b/metadata-correlation', json=payload)
    assert r.status_code == 200
    body = r.json()
    assert body['case_id'] == 'case_x'
    assert isinstance(body['correlated_entities'], list)


def test_temporal_burst_default():
    app = FastAPI()
    app.include_router(phase6b_router, prefix='/api/v1')
    client = TestClient(app)

    payload = {'entity_id': 'entity_1', 'window_minutes': 30}
    r = client.post('/api/v1/phase6b/temporal-burst', json=payload)
    assert r.status_code == 200
    body = r.json()
    assert body['burst_detected'] is False
