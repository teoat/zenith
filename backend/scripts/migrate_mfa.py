import os
import sys

# Add parent dir to path to find core module
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from sqlalchemy import text

from core.database import create_engine_and_session


def migrate():
    print("Connecting to database with SQLCipher...")
    try:
        engine, _ = create_engine_and_session()

        with engine.connect() as conn:
            print("Database connected. Applying migrations...")

            # 1. Add mfa_secret
            try:
                print("Adding mfa_secret column...")
                conn.execute(text("ALTER TABLE users ADD COLUMN mfa_secret VARCHAR"))
                print("✅ mfa_secret added.")
            except Exception as e:
                if (
                    "duplicate column" in str(e).lower()
                    or "no such table" not in str(e).lower()
                ):
                    print(f"⚠️ mfa_secret might already exist: {e}")
                else:
                    print(f"❌ Error adding mfa_secret: {e}")

            # 2. Add mfa_enabled
            try:
                print("Adding mfa_enabled column...")
                conn.execute(
                    text("ALTER TABLE users ADD COLUMN mfa_enabled BOOLEAN DEFAULT 0")
                )
                print("✅ mfa_enabled added.")
            except Exception as e:
                if (
                    "duplicate column" in str(e).lower()
                    or "no such table" not in str(e).lower()
                ):
                    print(f"⚠️ mfa_enabled might already exist: {e}")
                else:
                    print(f"❌ Error adding mfa_enabled: {e}")

            conn.commit()
            print("Migration steps completed.")

    except Exception as e:
        print(f"Migration Failed: {e}")


if __name__ == "__main__":
    migrate()
