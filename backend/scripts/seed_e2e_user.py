import os
import sys

# Add backend to path
sys.path.append(os.getcwd())
sys.path.append(os.path.join(os.getcwd(), "backend"))

import uuid

from app.services.infrastructure.auth_service import auth_service
from core.database import User, UserRole, create_engine_and_session


def seed():
    # Create analyst1
    seed_user("analyst@zenith.com", "Test Analyst", "Test123!", UserRole.ANALYST)
    # Create analyst2
    seed_user("analyst2@zenith.com", "Analyst Two", "Test123!", UserRole.ANALYST)


def seed_user(email, username, password, role):
    _engine, SessionLocal = create_engine_and_session()
    db = SessionLocal()

    # Check if exists (scan all because of encryption)
    exists = False
    try:
        for u in db.query(User).all():
            if u.email == email:
                exists = True
                print(f"User {email} already exists.")
                # Update password and username to be sure
                u.password_hash = auth_service.hash_password(password)
                u.username = email  # Consistent with previous fix
                u.is_active = True
                db.commit()
                print("Password and username updated.")
                break
    except Exception as e:
        print(f"Error checking users: {e}")

    if not exists:
        print(f"Creating user {email}...")
        try:
            pwd_hash = auth_service.hash_password(password)
            user = User(
                id=str(uuid.uuid4()),
                username=email,  # Consistent with previous fix
                email=email,
                full_name=username,
                password_hash=pwd_hash,
                role=role,
                is_active=True,
            )
            db.add(user)
            db.commit()
            print(f"User {email} created.")
        except Exception as e:
            print(f"Error creating user {email}: {e}")
            db.rollback()

    db.close()


if __name__ == "__main__":
    seed()
