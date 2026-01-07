import os
import sys
import unittest
from unittest.mock import MagicMock, patch

# Add backend to path - INSERT at 0 to prioritize over root app
sys.path.insert(0, os.path.join(os.path.dirname(__file__), "..", "backend"))

# Now this should import from backend/app
from app.services.infrastructure.auth_service import AuthService


class TestAuthServiceFix(unittest.TestCase):
    @patch("app.services.infrastructure.auth_service.db_service")
    def test_create_user_uses_password(self, mock_db_service):
        """
        Test that create_user uses the password provided in user_data
        instead of a hardcoded default.
        """
        # Ensure we have the right class
        if not hasattr(AuthService, "hash_password"):
            self.skipTest("Loaded Shim AuthService instead of Real AuthService")

        # Setup mocks
        mock_db = MagicMock()
        mock_db_service.get_db.return_value.__enter__.return_value = mock_db

        # Create instance of AuthService
        auth_service = AuthService()

        # Create user data with a specific password
        user_data = MagicMock()
        user_data.username = "testuser"
        user_data.email = "test@example.com"
        user_data.full_name = "Test User"
        user_data.role = "analyst"
        password = "SpecificPassword123!"
        user_data.password = password

        # Call create_user
        # We need to mock hash_password to verify what it was called with
        with patch.object(
            auth_service, "hash_password", return_value="hashed_secret"
        ) as mock_hash:
            new_user = auth_service.create_user(user_data)

            # Verify hash_password was called with the specific password
            mock_hash.assert_called_with(password)

            # Verify user was created with the hashed password
            self.assertEqual(new_user.password_hash, "hashed_secret")

    @patch("app.services.infrastructure.auth_service.db_service")
    def test_create_user_generates_password_if_missing(self, mock_db_service):
        """
        Test that create_user generates a password if not provided
        (fallback behavior).
        """
        # Ensure we have the right class
        if not hasattr(AuthService, "hash_password"):
            self.skipTest("Loaded Shim AuthService instead of Real AuthService")

        # Setup mocks
        mock_db = MagicMock()
        mock_db_service.get_db.return_value.__enter__.return_value = mock_db

        # Create instance of AuthService
        auth_service = AuthService()

        class UserData:
            username = "u"
            email = "e"
            full_name = "f"
            role = "r"

        data = UserData()

        # Call create_user
        with patch.object(
            auth_service, "hash_password", return_value="hashed_random"
        ) as mock_hash:
            new_user = auth_service.create_user(data)

            # Verify hash_password was NOT called with "default_temp_password"
            args, _ = mock_hash.call_args
            self.assertNotEqual(args[0], "default_temp_password")

            # Verify it was called with something (random token)
            self.assertTrue(len(args[0]) > 0)


if __name__ == "__main__":
    unittest.main()
