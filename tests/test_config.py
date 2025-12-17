"""
Test configuration constants and utilities.
Centralized location for test-specific settings to avoid hardcoded secrets.
"""
import os
from typing import Dict, Any
from cryptography.fernet import Fernet

# Test database encryption key - should be different from production
TEST_SQLCIPHER_KEY = 'test_sqlcipher_key_for_development_only_123456789012345678901234567890'

# Test authentication encryption key
TEST_AUTH_ENCRYPTION_KEY = 'test_auth_key_for_development_only_123456789012345678901234567890'

# Test encryption key for EncryptedString - must be a valid Fernet key
TEST_ENCRYPTION_KEY = Fernet.generate_key().decode()

def setup_test_environment() -> None:
    """Set up test environment variables safely."""
    os.environ.setdefault('SQLCIPHER_KEY', TEST_SQLCIPHER_KEY)
    os.environ.setdefault('AUTH_ENCRYPTION_KEY', TEST_AUTH_ENCRYPTION_KEY)
    os.environ.setdefault('ENCRYPTION_KEY', TEST_ENCRYPTION_KEY) # Add this line
    # Set test-specific environment
    os.environ.setdefault('ENV', 'test')

def get_test_db_config() -> Dict[str, Any]:
    """Get test database configuration."""
    return {
        'SQLCIPHER_KEY': TEST_SQLCIPHER_KEY,
        'database_url': './data/test_audit.db'
    }

def get_test_auth_config() -> Dict[str, Any]:
    """Get test authentication configuration."""
    return {
        'AUTH_ENCRYPTION_KEY': TEST_AUTH_ENCRYPTION_KEY,
        'secret_key': 'test_jwt_secret_key_for_development_only'
    }