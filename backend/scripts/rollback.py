"""Database migration rollback utilities"""

import sys

from alembic import command
from alembic.config import Config


def rollback_migration(steps: int = 1):
    """Rollback database migration by specified number of steps"""
    alembic_cfg = Config("alembic.ini")

    try:
        print(f"📉 Rolling back {steps} migration(s)...")

        if steps == 1:
            command.downgrade(alembic_cfg, "-1")
        else:
            command.downgrade(alembic_cfg, f"-{steps}")

        print(f"✅ Successfully rolled back {steps} migration(s)")
        return True
    except Exception as e:
        print(f"❌ Rollback failed: {e}")
        return False


def rollback_to_revision(revision: str):
    """Rollback to a specific revision"""
    alembic_cfg = Config("alembic.ini")

    try:
        print(f"📉 Rolling back to revision: {revision}")
        command.downgrade(alembic_cfg, revision)
        print(f"✅ Successfully rolled back to {revision}")
        return True
    except Exception as e:
        print(f"❌ Rollback failed: {e}")
        return False


def show_migration_history():
    """Display migration history"""
    alembic_cfg = Config("alembic.ini")

    try:
        print("📜 Migration History:")
        command.history(alembic_cfg)
        return True
    except Exception as e:
        print(f"❌ Failed to show history: {e}")
        return False


def get_current_revision():
    """Get current database revision"""
    alembic_cfg = Config("alembic.ini")

    try:
        command.current(alembic_cfg)
        return True
    except Exception as e:
        print(f"❌ Failed to get current revision: {e}")
        return False


if __name__ == "__main__":
    if len(sys.argv) < 2:
        print("Usage:")
        print("  python rollback.py history           # Show migration history")
        print("  python rollback.py current           # Show current revision")
        print("  python rollback.py down [steps]      # Rollback N steps (default: 1)")
        print("  python rollback.py to <revision>     # Rollback to specific revision")
        sys.exit(1)

    action = sys.argv[1]

    if action == "history":
        show_migration_history()
    elif action == "current":
        get_current_revision()
    elif action == "down":
        steps = int(sys.argv[2]) if len(sys.argv) > 2 else 1
        rollback_migration(steps)
    elif action == "to":
        if len(sys.argv) < 3:
            print("❌ Please specify revision")
            sys.exit(1)
        rollback_to_revision(sys.argv[2])
    else:
        print(f"❌ Unknown action: {action}")
        sys.exit(1)
