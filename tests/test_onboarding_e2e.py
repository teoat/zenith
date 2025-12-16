import os
import sys

# Ensure backend dir is on sys.path so internal packages (core, services) resolve
sys.path.insert(0, os.path.abspath('backend'))

from fastapi.testclient import TestClient
from fastapi import FastAPI
import importlib.util

# Load onboarding router module directly to avoid package import edge-cases
onboarding_path = os.path.abspath(os.path.join('backend', 'app', 'routers', 'onboarding.py'))
spec = importlib.util.spec_from_file_location('onboarding_module', onboarding_path)
onboarding_module = importlib.util.module_from_spec(spec)
spec.loader.exec_module(onboarding_module)
onboarding_router = getattr(onboarding_module, 'router')

# Load create_tables from core/database.py
db_path = os.path.abspath(os.path.join('backend', 'core', 'database.py'))
spec2 = importlib.util.spec_from_file_location('core_database', db_path)
core_database = importlib.util.module_from_spec(spec2)
spec2.loader.exec_module(core_database)
create_tables = getattr(core_database, 'create_tables')


# Ensure a SQLCIPHER_KEY is set for test DB usage (development/test only)
from test_config import setup_test_environment
setup_test_environment()

# Create DB tables for tests (idempotent)
create_tables()


def test_onboarding_e2e_flow():
    app = FastAPI()
    app.include_router(onboarding_router, prefix='/api/v1')
    client = TestClient(app)

    # Roles
    r = client.get('/api/v1/onboarding/roles')
    assert r.status_code == 200
    assert 'roles' in r.json()

    # Submit rookie checklist
    payload = {'user_email': 'e2e@example.com', 'items': ['verify_email', 'complete_training']}
    r2 = client.post('/api/v1/onboarding/rookie-checklist', json=payload)
    assert r2.status_code == 200
    body = r2.json()
    assert body.get('status') == 'accepted'
