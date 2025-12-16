#!/usr/bin/env python3
"""
Debug authentication issue
"""

import os
import sys

# Add the project root to the path
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from backend.app.services.auth_service import auth_service


def test_auth():
    """Test authentication directly"""
    try:
        print("Testing user authentication...")

        # Test user retrieval
        user = auth_service.authenticate_user("admin", "admin123")
        print(f"User authenticated: {user is not None}")
        if user:
            print(f"Username: {user.username}")
            print(f"Role: {user.role}")

            # Test token generation
            print("\nTesting token generation...")
            token_data = {"sub": user.id, "username": user.username, "role": user.role}
            print(f"Token data: {token_data}")

            access_token = auth_service.create_access_token(data=token_data)
            print(f"Access token generated: {bool(access_token)}")
            print(f"Token length: {len(access_token) if access_token else 0}")

            refresh_token = auth_service.create_refresh_token(user.id)
            print(f"Refresh token generated: {bool(refresh_token)}")
            print(f"Refresh token length: {len(refresh_token) if refresh_token else 0}")

    except Exception as e:
        print(f"Error: {e}")
        import traceback

        traceback.print_exc()


if __name__ == "__main__":
    test_auth()
