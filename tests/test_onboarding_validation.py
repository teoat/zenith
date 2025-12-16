import os
import sys

# Ensure backend path
sys.path.insert(0, os.path.abspath('backend'))

from fastapi.testclient import TestClient
from fastapi import FastAPI
from app.routers.onboarding import router as onboarding_router
from core.database import create_tables
from dotenv import load_dotenv
from test_config import setup_test_environment

load_dotenv()  # load .env if present
setup_test_environment()
create_tables()


def test_missing_items_validation():
    app = FastAPI()
    app.include_router(onboarding_router, prefix='/api/v1')
    client = TestClient(app)

    # Missing 'items' field should return 422
    payload = {'user_email': 'test@example.com'}
    r = client.post('/api/v1/onboarding/rookie-checklist', json=payload)
    assert r.status_code == 422


def test_invalid_email_validation():
    app = FastAPI()
    app.include_router(onboarding_router, prefix='/api/v1')
    client = TestClient(app)

    payload = {'user_email': 'not-an-email', 'items': ['verify_email']}
    r = client.post('/api/v1/onboarding/rookie-checklist', json=payload)
    assert r.status_code == 422
