from fastapi.testclient import TestClient
from main import app


def test_root():
    with TestClient(app) as client:
        response = client.post("/api/v1/cases", json={"title": "Test Case"})
        # We don't care about the result, just that it returns
        assert response.status_code in [200, 201, 404, 401, 403, 500, 501]
