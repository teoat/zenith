#!/usr/bin/env python3
"""
Test login endpoint directly
"""

import os
import sys

# Add the project root to the path
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from fastapi.testclient import TestClient

from backend.main import app


def test_login_direct():
    """Test login using TestClient"""
    try:
        client = TestClient(app)

        # Test login
        response = client.post(
            "/api/v1/auth/login", json={"username": "admin", "password": "admin123"}
        )

        print(f"Status Code: {response.status_code}")
        print(f"Response: {response.json()}")

        if response.status_code == 200:
            data = response.json()
            print("✅ Login successful!")
            print(f"Access token: {data.get('access_token')[:50]}...")
            print(f"Permissions: {data.get('permissions')}")
        else:
            print("❌ Login failed")

    except Exception as e:
        print(f"Error: {e}")
        import traceback

        traceback.print_exc()


if __name__ == "__main__":
    test_login_direct()
