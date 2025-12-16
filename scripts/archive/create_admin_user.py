#!/usr/bin/env python3
"""
Create admin user for 378x492 Fraud Detection Platform
"""

import os
import sys

# Add the project root to the path
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

import uuid

from backend.app.services.auth_service import auth_service
from backend.app.services.database_service import db_service
from backend.core.database import User, utc_now


def create_admin_user():
    """Create admin user if it doesn't exist"""
    try:
        # Check if admin user already exists
        existing_user = db_service.get_user_by_username("admin")
        if existing_user:
            print(f"Admin user already exists: {existing_user.username}")
            return existing_user

        # Create admin user
        with db_service.get_db() as db:
            admin_user = User(
                id=str(uuid.uuid4()),
                username="admin",
                email="admin@example.com",  # This will be encrypted
                full_name="System Administrator",
                password_hash=auth_service.hash_password("admin123"),
                role="ADMIN",
                is_active=True,
                created_at=utc_now(),
                mfa_enabled=False,
                mfa_secret=None,
            )

            db.add(admin_user)
            db.commit()
            db.refresh(admin_user)

            print("✅ Admin user created successfully!")
            print(f"   Username: admin")
            print(f"   Password: admin123")
            print(f"   Role: {admin_user.role}")
            print(f"   ID: {admin_user.id}")

            return admin_user

    except Exception as e:
        print(f"❌ Failed to create admin user: {e}")
        return None


if __name__ == "__main__":
    create_admin_user()
