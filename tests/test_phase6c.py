import os
import sys

sys.path.insert(0, os.path.abspath('backend'))

from fastapi import FastAPI
from fastapi.testclient import TestClient
from app.routers.phase6c import router as phase6c_router
from core.database import create_tables
from test_config import setup_test_environment

setup_test_environment()
create_tables()

def test_local_rag_add_and_retrieve():
    app = FastAPI()
    app.include_router(phase6c_router, prefix='/api/v1')
    client = TestClient(app)

    r = client.post('/api/v1/phase6c/rag/add', data={'doc_id': 'd1', 'text': 'This is a test document about payments and fraud'})
    assert r.status_code == 200

    r2 = client.post('/api/v1/phase6c/local-rag', json={'query': 'payments fraud', 'k': 1})
    assert r2.status_code == 200
    body = r2.json()
    assert 'results' in body


def test_multimodal_analyze_text():
    app = FastAPI()
    app.include_router(phase6c_router, prefix='/api/v1')
    client = TestClient(app)

    r = client.post('/api/v1/phase6c/analyze-text', data={'text': 'Payment of $100 received'})
    assert r.status_code == 200
    body = r.json()
    assert 'sentiment' in body
