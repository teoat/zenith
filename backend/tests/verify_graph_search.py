
import sys
import os
from fastapi.testclient import TestClient
from unittest.mock import MagicMock

# Add backend directory AND project root to sys.path
backend_dir = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
project_root = os.path.dirname(backend_dir)
sys.path.append(backend_dir)
sys.path.append(project_root)

# MOCK MISSING DEPENDENCIES (Dependencies that might not be installed in this env)
sys.modules["networkx"] = MagicMock()
sys.modules["pytesseract"] = MagicMock()
sys.modules["cv2"] = MagicMock()
sys.modules["PIL"] = MagicMock()
sys.modules["PyPDF2"] = MagicMock()
sys.modules["docx"] = MagicMock()
sys.modules["pandas"] = MagicMock()

# Mock SQLAlchemy and Database
sys.modules["sqlalchemy.orm"] = MagicMock()
sys.modules["backend.core.database"] = MagicMock()
sys.modules["core.database"] = MagicMock()

# Mock Services
graph_service_mock = MagicMock()
# Mock the graph object and its nodes method
mock_graph = MagicMock()
# Create some sample nodes
sample_nodes = [
    ("node1", {"label": "John Doe", "type": "person", "risk_score": 80}),
    ("node2", {"label": "Evil Corp", "type": "company", "risk_score": 95}),
    ("node3", {"label": "Safe Bank", "type": "bank", "risk_score": 10})
]
mock_graph.nodes.return_value = sample_nodes
# Make nodes() callable with data=True
mock_graph.nodes.side_effect = lambda data=False: sample_nodes if data else [n[0] for n in sample_nodes]

graph_service_mock.relationship_graph.graph = mock_graph
sys.modules["services.relationship_graph"] = graph_service_mock
sys.modules["app.services.relationship_graph"] = graph_service_mock # support both import paths

# Now import main
try:
    from main import app
except ImportError:
    # If main imports api.graph which imports services.relationship_graph, our mock should handle it.
    # But if there are other import errors, we might need to mock more.
    pass

# We might need to manually override the import in api/graph.py if it was already imported
import api.graph
api.graph.relationship_graph = graph_service_mock.relationship_graph 

client = TestClient(app)

def test_graph_search():
    print("Verifying Graph Search API...")
    
    # 1. Search for "John"
    print("\n[TEST] GET /api/v1/graph/search?query=John")
    try:
        response = client.get("/api/v1/graph/search?query=John")
        print(f"Status: {response.status_code}")
        if response.status_code == 200:
            data = response.json()
            print("Response:", data)
            if data['success'] and len(data['results']) == 1 and data['results'][0]['id'] == 'node1':
                print("✅ PASS: Found John Doe")
            else:
                print("❌ FAIL: Did not find expected node")
        else:
            print(f"❌ FAIL: {response.text}")
    except Exception as e:
        print(f"❌ FAIL (Exception): {e}")

    # 2. Search for "Corp" with type filter "company"
    print("\n[TEST] GET /api/v1/graph/search?query=Corp&node_type=company")
    try:
        response = client.get("/api/v1/graph/search?query=Corp&node_type=company")
        print(f"Status: {response.status_code}")
        if response.status_code == 200:
            data = response.json()
            print("Response:", data)
            if len(data['results']) == 1 and data['results'][0]['id'] == 'node2':
                print("✅ PASS: Found Evil Corp")
            else:
                print("❌ FAIL: Did not find expected node")
        else:
            print(f"❌ FAIL: {response.text}")
    except Exception as e:
        print(f"❌ FAIL (Exception): {e}")

if __name__ == "__main__":
    test_graph_search()
