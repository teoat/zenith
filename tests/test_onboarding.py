import os
import sys
from dotenv import load_dotenv
from test_config import setup_test_environment

<<<<<<< HEAD
=======
# Ensure backend package path is importable when running tests from project root
sys.path.insert(0, os.path.abspath('backend'))

>>>>>>> 070c7cf08 (chore(batch): clean backend core files only)
load_dotenv()
setup_test_environment()

from fastapi.testclient import TestClient
from fastapi import FastAPI

<<<<<<< HEAD
from backend.app.routers.onboarding import router as onboarding_router
from backend.core.database import create_tables, RookieChecklist
=======
# Import the onboarding router directly and mount it on a lightweight test app
from app.routers.onboarding import router as onboarding_router

# Import create_tables in a robust way so tests run regardless of sys.path order
try:
    from backend.core.database import create_tables
except Exception:
    try:
        from core.database import create_tables
    except Exception:
        import importlib.util, os, sys
        db_path = os.path.join(os.path.abspath('backend'), 'core', 'database.py')
        spec = importlib.util.spec_from_file_location('backend_core_database', db_path)
        db_mod = importlib.util.module_from_spec(spec)
        spec.loader.exec_module(db_mod)  # type: ignore
        create_tables = getattr(db_mod, 'create_tables')
>>>>>>> 070c7cf08 (chore(batch): clean backend core files only)

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
<<<<<<< HEAD

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
=======
>>>>>>> 070c7cf08 (chore(batch): clean backend core files only)
