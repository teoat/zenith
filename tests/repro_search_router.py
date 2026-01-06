
import sys
import os
from unittest.mock import MagicMock, AsyncMock
from fastapi import FastAPI
from fastapi.testclient import TestClient

# Mock environmental variables BEFORE importing app
os.environ["SECRET_KEY"] = "test_secret_key"
os.environ["JWT_SECRET_KEY"] = "test_jwt_secret"
os.environ["FIELD_ENCRYPTION_KEY"] = "test_encryption_key"

# 1. Mock the dependencies BEFORE importing the router
sys.path.append(os.path.join(os.getcwd(), "backend"))

# Mock ai_service
ai_service_mock = MagicMock()
ai_service_mock.vector_store = {}
ai_service_mock.initialized = True
ai_service_mock.semantic_search = AsyncMock(return_value=[{"id": "1", "content": "mock result"}])

# Mock evidence_search_index
evidence_search_mock = MagicMock()
evidence_search_mock.search_evidence = AsyncMock(return_value=[{"id": "1", "content": "mock result"}])
evidence_search_mock.get_evidence_stats = MagicMock(return_value={"count": 10})

# Patch modules
sys.modules["app.services.ai.ai_service"] = MagicMock(ai_service=ai_service_mock)
sys.modules["app.services.search_service"] = MagicMock(evidence_search_index=evidence_search_mock)

# Also mock auth_service completely to avoid further imports
auth_service_mock = MagicMock()
# get_current_user should return a user if authenticated, or raise HTTPException if not.
# However, Depends(auth_service.get_current_user) invokes the function.
# We want to test that the router USES this dependency.
# In a unit test with TestClient, if we don't mock the dependency override, it calls the real function.
# But here we are importing `auth_service` from `app.services.infrastructure.auth_service`.
# If we mock `app.services.infrastructure.auth_service` in sys.modules, `search.py` will import our mock.
sys.modules["app.services.infrastructure.auth_service"] = MagicMock(auth_service=auth_service_mock)

# IMPORTANT: We need `get_current_user` to be a callable that FastAPI can use as a dependency.
# If we just use MagicMock(), it works as a dependency but doesn't enforce auth logic by default unless we configure it.
# To verify security, we can check if `Depends` was called with this mock.
# OR, we can configure the mock to raise HTTPException to simulate "no auth".

from fastapi import HTTPException
def mock_get_current_user():
    # Simulate strict auth: raise 401
    raise HTTPException(status_code=401, detail="Unauthorized")

auth_service_mock.get_current_user = mock_get_current_user

# 2. Import the router
from backend.app.routers.search import router

# 3. Create a bare FastAPI app and include the router
app = FastAPI()
app.include_router(router, prefix="/api/v1/search")

client = TestClient(app)

def test_search_endpoint_security():
    print("Testing /api/v1/search endpoint security...")

    # Try to access without authentication
    response = client.post(
        "/api/v1/search?query=fraud",
        json={}
    )

    print(f"Status Code: {response.status_code}")

    # If vulnerable, it returns 200 OK
    if response.status_code == 200:
        print("Vulnerability REPRODUCED: Endpoint is accessible without authentication!")
    elif response.status_code == 401:
        print("Secure: Endpoint returned 401 Unauthorized.")
    else:
        print(f"Unexpected status code: {response.status_code}")
        print(response.json())

if __name__ == "__main__":
    test_search_endpoint_security()
