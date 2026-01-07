"""
Database Backup and Restore System for SQLCipher

This script provides automated backup and restore functionality for the
encrypted SQLite database.
"""

import os
import shutil
import sys
from datetime import datetime
from pathlib import Path

# Add parent directory to path for imports
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

try:
    from core.logging import logger
except ImportError:
    # Fallback if logging not available
    import logging

    logger = logging.getLogger(__name__)
    logging.basicConfig(level=logging.INFO)

# Backup configuration
BACKUP_DIR = os.path.expanduser("~/.zenith/backups")
DATABASE_PATH = os.path.expanduser("~/.zenith/fraud_detection.db")
MAX_DAILY_BACKUPS = 7
MAX_WEEKLY_BACKUPS = 4
MAX_MONTHLY_BACKUPS = 3


class BackupManager:
    """
    Manages encrypted database backups with rotation.
    """

    def __init__(self, db_path: str = DATABASE_PATH, backup_dir: str = BACKUP_DIR):
        self.db_path = db_path
        self.backup_dir = backup_dir
        os.makedirs(self.backup_dir, exist_ok=True)

    def create_backup(self, backup_type: str = "daily") -> str:
        """
        Create a backup of the database.

        Args:
            backup_type: Type of backup (daily, weekly, monthly)

        Returns:
            str: Path to backup file
        """
        if not os.path.exists(self.db_path):
            raise FileNotFoundError(f"Database not found: {self.db_path}")

        # Generate backup filename with timestamp
        timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
        backup_filename = f"zenith_fraud_detection_{backup_type}_{timestamp}.db"
        backup_path = os.path.join(self.backup_dir, backup_filename)

        try:
            # Copy database file (encrypted database is copied as-is)
            shutil.copy2(self.db_path, backup_path)

            # Verify backup integrity
            self._verify_backup(backup_path)

            logger.info(
                "Database backup created",
                extra={
                    "backup_type": backup_type,
                    "backup_path": backup_path,
                    "size_bytes": os.path.getsize(backup_path),
                },
            )

            # Rotate old backups
            self._rotate_backups(backup_type)

            return backup_path

        except Exception as e:
            logger.error(
                "Backup failed", extra={"error": str(e), "backup_path": backup_path}
            )
            # Clean up failed backup
            if os.path.exists(backup_path):
                os.remove(backup_path)
            raise

    def restore_backup(
        self, backup_path: str, verify_password: str | None = None
    ) -> bool:
        """
        Restore database from backup.

        Args:
            backup_path: Path to backup file
            verify_password: Optional password to verify before restore

        Returns:
            bool: True if successful
        """
        if not os.path.exists(backup_path):
            raise FileNotFoundError(f"Backup not found: {backup_path}")

        try:
            # Verify backup integrity
            self._verify_backup(backup_path)

            # Create backup of current database before restoring
            if os.path.exists(self.db_path):
                pre_restore_backup = f"{self.db_path}.pre_restore_{datetime.now().strftime('%Y%m%d_%H%M%S')}"
                shutil.copy2(self.db_path, pre_restore_backup)
                logger.info(f"Created pre-restore backup: {pre_restore_backup}")

            # Restore from backup
            shutil.copy2(backup_path, self.db_path)

            logger.info(
                "Database restored from backup",
                extra={"backup_path": backup_path, "restored_to": self.db_path},
            )

            return True

        except Exception as e:
            logger.error(
                "Restore failed", extra={"error": str(e), "backup_path": backup_path}
            )
            raise

    def _verify_backup(self, backup_path: str):
        """Verify backup file integrity"""
        # Check file exists and has size
        if not os.path.exists(backup_path):
            raise ValueError(f"Backup file not found: {backup_path}")

        file_size = os.path.getsize(backup_path)
        if file_size == 0:
            raise ValueError(f"Backup file is empty: {backup_path}")

        # Verify it's a valid SQLite database (header check)
        with open(backup_path, "rb") as f:
            header = f.read(16)
            if not header.startswith(b"SQLite format 3"):
                raise ValueError(f"Invalid SQLite database: {backup_path}")

    def _rotate_backups(self, backup_type: str):
        """
        Rotate old backups according to retention policy.

        Retention:
        - Daily: Keep last 7
        - Weekly: Keep last 4
        - Monthly: Keep last 3
        """
        # Get all backups of this type
        pattern = f"fraud_detection_{backup_type}_*.db"
        backups = sorted(
            Path(self.backup_dir).glob(pattern),
            key=lambda p: p.stat().st_mtime,
            reverse=True,
        )

        # Determine max to keep
        max_backups = {
            "daily": MAX_DAILY_BACKUPS,
            "weekly": MAX_WEEKLY_BACKUPS,
            "monthly": MAX_MONTHLY_BACKUPS,
        }.get(backup_type, 7)

        # Remove old backups
        for old_backup in backups[max_backups:]:
            try:
                old_backup.unlink()
                logger.info(f"Removed old backup: {old_backup}")
            except Exception as e:
                logger.warning(f"Failed to remove old backup {old_backup}: {e}")

    def list_backups(self, backup_type: str | None = None) -> list:
        """
        List available backups.

        Args:
            backup_type: Filter by backup type (daily, weekly, monthly)

        Returns:
            list: List of backup info dicts
        """
        pattern = (
            f"zenith_fraud_detection_{backup_type}_*.db"
            if backup_type
            else "zenith_fraud_detection_*.db"
        )
        backups = []

        for backup_path in sorted(Path(self.backup_dir).glob(pattern), reverse=True):
            stat = backup_path.stat()
            backups.append(
                {
                    "filename": backup_path.name,
                    "path": str(backup_path),
                    "size_bytes": stat.st_size,
                    "size_mb": round(stat.st_size / 1024 / 1024, 2),
                    "created": datetime.fromtimestamp(stat.st_ctime).isoformat(),
                    "modified": datetime.fromtimestamp(stat.st_mtime).isoformat(),
                }
            )

        return backups

    def get_backup_stats(self) -> dict:
        """Get backup statistics"""
        all_backups = self.list_backups()

        return {
            "total_backups": len(all_backups),
            "total_size_mb": round(
                sum(b["size_bytes"] for b in all_backups) / 1024 / 1024, 2
            ),
            "daily_backups": len(
                [b for b in all_backups if "_daily_" in b["filename"]]
            ),
            "weekly_backups": len(
                [b for b in all_backups if "_weekly_" in b["filename"]]
            ),
            "monthly_backups": len(
                [b for b in all_backups if "_monthly_" in b["filename"]]
            ),
            "oldest_backup": all_backups[-1]["created"] if all_backups else None,
            "newest_backup": all_backups[0]["created"] if all_backups else None,
        }


def create_daily_backup():
    """Create a daily backup (for cron/scheduled tasks)"""
    manager = BackupManager()
    backup_path = manager.create_backup("daily")
    print(f"Daily backup created: {backup_path}")
    return backup_path


def create_weekly_backup():
    """Create a weekly backup (for cron/scheduled tasks)"""
    manager = BackupManager()
    backup_path = manager.create_backup("weekly")
    print(f"Weekly backup created: {backup_path}")
    return backup_path


def create_monthly_backup():
    """Create a monthly backup (for cron/scheduled tasks)"""
    manager = BackupManager()
    backup_path = manager.create_backup("monthly")
    print(f"Monthly backup created: {backup_path}")
    return backup_path


if __name__ == "__main__":
    import argparse

    parser = argparse.ArgumentParser(description="Database Backup Management")
    parser.add_argument(
        "action",
        choices=["backup", "restore", "list", "stats"],
        help="Action to perform",
    )
    parser.add_argument(
        "--type",
        choices=["daily", "weekly", "monthly"],
        default="daily",
        help="Backup type (for backup action)",
    )
    parser.add_argument("--file", help="Backup file path (for restore action)")

    args = parser.parse_args()
    manager = BackupManager()

    if args.action == "backup":
        backup_path = manager.create_backup(args.type)
        print(f"✅ Backup created: {backup_path}")

    elif args.action == "restore":
        if not args.file:
            print("❌ Error: --file required for restore")
            exit(1)
        manager.restore_backup(args.file)
        print(f"✅ Database restored from: {args.file}")

    elif args.action == "list":
        backups = manager.list_backups()
        if not backups:
            print("No backups found")
        else:
            print(f"\n📦 Found {len(backups)} backups:\n")
            for backup in backups:
                print(f"  {backup['filename']}")
                print(f"    Size: {backup['size_mb']} MB")
                print(f"    Created: {backup['created']}")
                print()

    elif args.action == "stats":
        stats = manager.get_backup_stats()
        print("\n📊 Backup Statistics:\n")
        print(f"  Total Backups: {stats['total_backups']}")
        print(f"  Total Size: {stats['total_size_mb']} MB")
        print(f"  Daily: {stats['daily_backups']}")
        print(f"  Weekly: {stats['weekly_backups']}")
        print(f"  Monthly: {stats['monthly_backups']}")
        if stats["oldest_backup"]:
            print(f"  Oldest: {stats['oldest_backup']}")
        if stats["newest_backup"]:
            print(f"  Newest: {stats['newest_backup']}")
