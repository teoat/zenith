import os
import sys
from dotenv import load_dotenv
from test_config import setup_test_environment

load_dotenv()
setup_test_environment()

from fastapi.testclient import TestClient
from fastapi import FastAPI

from backend.app.routers.onboarding import router as onboarding_router
from backend.core.database import create_tables, RookieChecklist

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

def test_submit_rookie_checklist_no_items():
    payload = {'user': 'test@example.com', 'items': []}
    r = client.post('/api/v1/onboarding/rookie-checklist', json=payload)
    assert r.status_code == 422
    body = r.json()
    assert 'items required' in body['detail']

def test_submit_rookie_checklist_invalid_email():
    payload = {'user': 'not-an-email', 'items': ['verify_email']}
    r = client.post('/api/v1/onboarding/rookie-checklist', json=payload)
    assert r.status_code == 422
    body = r.json()
    assert 'invalid email' in body['detail']