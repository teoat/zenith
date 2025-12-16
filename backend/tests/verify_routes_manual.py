import os
import sys
from unittest.mock import MagicMock

from fastapi.testclient import TestClient

# Add backend directory AND project root to sys.path
backend_dir = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
project_root = os.path.dirname(backend_dir)
sys.path.append(backend_dir)
sys.path.append(project_root)

# MOCK MISSING DEPENDENCIES
from unittest.mock import MagicMock

sys.modules["networkx"] = MagicMock()
sys.modules["pytesseract"] = MagicMock()
sys.modules["cv2"] = MagicMock()
sys.modules["PIL"] = MagicMock()
sys.modules["PyPDF2"] = MagicMock()
sys.modules["docx"] = MagicMock()
sys.modules["pandas"] = (
    MagicMock()
)  # Often missing/heavy, might as well mock if not critical for routing check. BUT reconciliation uses it.
# Wait, reconciliation endpoint uses pandas. "df_a = pd.read_csv(...)".
# But my test case calls GET /items, which uses SQL not pandas.
# Only /upload-and-reconcile uses pandas.
# So mocking pandas is safe for GET /items check.


from main import app

from core.database import get_db


# Mock DB Session
def override_get_db():
    try:
        db = MagicMock()
        yield db
    finally:
        pass


app.dependency_overrides[get_db] = override_get_db

client = TestClient(app)


def test_routes():
    print("Verifying API Routes...")

    # 1. Verify Reconciliation Items
    # Path: /api/v1/reconciliation/items
    print("\n[TEST] GET /api/v1/reconciliation/items")
    try:
        response = client.get("/api/v1/reconciliation/items")
        print(f"Status: {response.status_code}")
        if response.status_code == 200:
            print(
                "Response:",
                (
                    response.json()[:1]
                    if isinstance(response.json(), list)
                    else response.json()
                ),
            )
            print("✅ PASS")
        else:
            print(f"❌ FAIL: {response.text}")
    except Exception as e:
        print(f"❌ FAIL (Exception): {e}")

    # 2. Verify Fraud Rules Alerts
    # Path: /api/v1/fraud-rules/alerts
    print("\n[TEST] GET /api/v1/fraud-rules/alerts")
    try:
        response = client.get("/api/v1/fraud-rules/alerts")
        print(f"Status: {response.status_code}")
        if response.status_code == 200:
            print(
                "Response:",
                (
                    response.json()[:1]
                    if isinstance(response.json(), list)
                    else response.json()
                ),
            )
            print("✅ PASS")
        else:
            print(f"❌ FAIL: {response.text}")
    except Exception as e:
        print(f"❌ FAIL (Exception): {e}")

    # 3. Verify User Preferences
    # Path: /api/v1/users/me/preferences
    print("\n[TEST] PUT /api/v1/users/me/preferences")
    try:
        response = client.put(
            "/api/v1/users/me/preferences",
            json={"theme": "dark", "notifications": True},
        )
        print(f"Status: {response.status_code}")
        if response.status_code == 200:
            print("Response:", response.json())
            print("✅ PASS")
        else:
            print(f"❌ FAIL: {response.text}")
    except Exception as e:
        print(f"❌ FAIL (Exception): {e}")


if __name__ == "__main__":
    test_routes()
