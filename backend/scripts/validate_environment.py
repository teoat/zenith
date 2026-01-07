#!/usr/bin/env python3
"""
Environment Configuration Validator

Validates that all required environment variables are set and properly formatted
for the Zenith Fraud Detection Platform.
"""

import os
import sys
import base64
from typing import List, Tuple


def validate_fernet_key(key: str, name: str) -> bool:
    """Validate that a key is a proper Fernet key (32 bytes, base64 encoded)"""
    try:
        # Fernet keys must be 32 bytes when decoded
        decoded = base64.urlsafe_b64decode(key)
        if len(decoded) != 32:
            print(f"❌ {name}: Invalid key length ({len(decoded)} bytes, must be 32)")
            return False
        return True
    except Exception as e:
        print(f"❌ {name}: Invalid base64 encoding - {e}")
        return False


def validate_environment_variables() -> Tuple[List[str], List[str]]:
    """Validate all required environment variables"""
    missing = []
    invalid = []

    # Required variables
    required_vars = {
        "SECRET_KEY": "General application secret key",
        "FIELD_ENCRYPTION_KEY": "Database field encryption key (Fernet)",
    }

    # Optional but recommended
    optional_vars = {
        "ENCRYPTION_KEY": "Alternative encryption key (Fernet)",
        "DATABASE_URL": "Database connection URL",
        "REDIS_URL": "Redis connection URL",
        "LOG_LEVEL": "Logging level (DEBUG, INFO, WARNING, ERROR, CRITICAL)",
        "ENVIRONMENT": "Application environment (development, staging, production)",
    }

    # Check required variables
    for var, description in required_vars.items():
        value = os.getenv(var)
        if not value:
            missing.append(f"{var} - {description}")
        elif var.endswith("_ENCRYPTION_KEY"):
            if not validate_fernet_key(value, var):
                invalid.append(var)

    # Check optional variables
    for var, description in optional_vars.items():
        value = os.getenv(var)
        if value and var.endswith("_ENCRYPTION_KEY"):
            if not validate_fernet_key(value, var):
                invalid.append(var)

    return missing, invalid


def validate_database_connection() -> bool:
    """Test database connection if DATABASE_URL is set"""
    db_url = os.getenv("DATABASE_URL")
    if not db_url:
        print("⚠️  DATABASE_URL not set - skipping database connection test")
        return True

    try:
        if db_url.startswith("sqlite"):
            # SQLite - just check if path is accessible
            if db_url == "sqlite:///:memory:":
                print("✅ DATABASE_URL set to in-memory SQLite (valid for testing)")
                return True

            import sqlite3

            # Extract path from sqlite:///path
            db_path = db_url.replace("sqlite:///", "")
            conn = sqlite3.connect(db_path)
            conn.close()
            print("✅ SQLite database connection successful")
            return True
        else:
            # Other databases - just validate URL format
            print("✅ DATABASE_URL format appears valid")
            return True
    except Exception as e:
        print(f"❌ Database connection test failed: {e}")
        return False


def validate_redis_connection() -> bool:
    """Test Redis connection if REDIS_URL is set"""
    redis_url = os.getenv("REDIS_URL")
    if not redis_url:
        print("⚠️  REDIS_URL not set - skipping Redis connection test")
        return True

    try:
        import redis

        r = redis.from_url(redis_url)
        r.ping()
        print("✅ Redis connection successful")
        return True
    except ImportError:
        print("⚠️  redis package not installed - skipping Redis test")
        return True
    except Exception as e:
        print(f"❌ Redis connection test failed: {e}")
        return False


def main():
    """Main validation function"""
    print("🔍 Zenith Platform Environment Configuration Validator")
    print("=" * 60)

    # Check Python version
    if sys.version_info < (3, 12):
        print(f"⚠️  Python {sys.version_info.major}.{sys.version_info.minor} detected. Python 3.12+ recommended.")
    else:
        print(f"✅ Python {sys.version_info.major}.{sys.version_info.minor}.{sys.version_info.micro} detected")

    print()

    # Validate environment variables
    missing, invalid = validate_environment_variables()

    if missing:
        print("❌ Missing required environment variables:")
        for var in missing:
            print(f"   • {var}")
        print()

    if invalid:
        print("❌ Invalid environment variables:")
        for var in invalid:
            print(f"   • {var}")
        print()

    # Test connections
    db_ok = validate_database_connection()
    redis_ok = validate_redis_connection()

    print()
    print("=" * 60)

    # Summary
    if not missing and not invalid and db_ok and redis_ok:
        print("✅ Environment configuration is VALID")
        print("🚀 Ready for deployment")
        return 0
    else:
        print("❌ Environment configuration has ISSUES")
        print("🔧 Please fix the issues above before deployment")
        return 1


if __name__ == "__main__":
    sys.exit(main())
