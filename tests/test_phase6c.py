import os
import sys
sys.path.insert(0, os.path.abspath('.'))
sys.path.insert(0, os.path.abspath('backend'))

from dotenv import load_dotenv
from test_config import setup_test_environment

load_dotenv()
setup_test_environment()

from fastapi.testclient import TestClient
from fastapi import FastAPI

# Import the phase6c router directly and mount it on a lightweight test app
from backend.app.routers.phase6c import router as phase6c_router

app = FastAPI()
app.include_router(phase6c_router, prefix="/api/v1")
client = TestClient(app)


def test_rag_add():
    payload = {'doc_id': 'doc-456'}
    r = client.post('/api/v1/phase6c/rag/add', json=payload)
    assert r.status_code == 200
    body = r.json()
    assert body.get('status') == 'ok'
    assert body.get('doc_id') == 'doc-456'


def test_local_rag():
    payload = {'query': 'what is the meaning of life?'}
    r = client.post('/api/v1/phase6c/local-rag', json=payload)
    assert r.status_code == 200
    body = r.json()
    assert 'results' in body
    assert isinstance(body['results'], list)


def test_analyze_text():
    payload = {'text': 'I love sunny days!'}
    r = client.post('/api/v1/phase6c/analyze-text', json=payload)
    assert r.status_code == 200
    body = r.json()
    assert body.get('sentiment') == 'neutral' # The endpoint is a mock, so it always returns neutral
    assert body.get('text') == 'I love sunny days!'