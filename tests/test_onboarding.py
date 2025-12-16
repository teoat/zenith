import os
import sys
from dotenv import load_dotenv
from test_config import setup_test_environment

# Ensure backend package path is importable when running tests from project root
sys.path.insert(0, os.path.abspath('backend'))

load_dotenv()
setup_test_environment()

from fastapi.testclient import TestClient
from fastapi import FastAPI

# Import the onboarding router directly and mount it on a lightweight test app
from app.routers.onboarding import router as onboarding_router
from backend.core.database import create_tables

# Create DB tables for tests
create_tables()

app = FastAPI()
app.include_router(onboarding_router, prefix="/api/v1")
client = TestClient(app)


def test_get_roles():
    r = client.get('/api/v1/onboarding/roles')
    assert r.status_code == 200
    body = r.json()
    assert 'roles' in body
    assert isinstance(body['roles'], list)


def test_submit_rookie_checklist():
    payload = {'user': 'test@example.com', 'items': ['verify_email', 'complete_training']}
    r = client.post('/api/v1/onboarding/rookie-checklist', json=payload)
    assert r.status_code == 200
    body = r.json()
    assert body.get('status') == 'accepted'
