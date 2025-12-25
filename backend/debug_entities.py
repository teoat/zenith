
import pytest
from fastapi.testclient import TestClient
from app.main import app

def test_debug_relationship_creation():
    client = TestClient(app)
    # Auth headers mock
    auth_headers = {"Authorization": "Bearer test_token"}
    
    # Create entities first
    e1_resp = client.post("/api/v1/entities", headers=auth_headers, json={"name": "E1", "entity_type": "person"})
    print(f"E1 Resp: {e1_resp.json()}")
    e1_id = e1_resp.json().get("entity_id")
    
    e2_resp = client.post("/api/v1/entities", headers=auth_headers, json={"name": "E2", "entity_type": "company"})
    print(f"E2 Resp: {e2_resp.json()}")
    e2_id = e2_resp.json().get("entity_id")
    
    relationship = {
        "from_entity_id": e1_id,
        "to_entity_id": e2_id,
        "relationship_type": "EMPLOYEE_OF",
        "confidence": 0.95
    }
    
    response = client.post("/api/v1/entities/relationships",
                          headers=auth_headers,
                          json=relationship)
    
    print(f"Status: {response.status_code}")
    print(f"Response: {response.json()}")
    assert response.status_code == 201

if __name__ == "__main__":
    test_debug_relationship_creation()
