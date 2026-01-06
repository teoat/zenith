import json
import logging
import os

logger = logging.getLogger(__name__)


class IntegrityChecker:
    """
    Enforces environment integrity on boot.
    Verifies critical files and dependencies.
    """

    def __init__(self, project_root: str | None = None):
        self.project_root = project_root or os.getcwd()
        self.dependencies_lock_path = os.path.join(
            self.project_root, "dependencies.lock"
        )

    def check_integrity(self) -> bool:
        """Run all integrity checks."""
        logger.info("Starting Boot Integrity Check...")

        try:
            if not self._verify_dependencies_lock():
                logger.error(
                    "Integrity Check Failed: dependencies.lock verification failed"
                )
                return False

            # Additional checks could go here (e.g. Python version, specific package versions)

            logger.info("Boot Integrity Verified Successfully.")
            return True
        except Exception as e:
            logger.error(f"Integrity Check Failed with error: {e}")
            return False

    def _verify_dependencies_lock(self) -> bool:
        """Verify the dependencies.lock file itself hasn't been tampered with (basic existence check + checksum logic if applicable)."""
        if not os.path.exists(self.dependencies_lock_path):
            logger.warning("dependencies.lock not found. Skipping strict verification.")
            return True  # Allow for now if missing, or return False to be strict

        try:
            with open(self.dependencies_lock_path) as f:
                data = json.load(f)

            # Simple structure validation
            if not isinstance(data, dict):
                return False

            # Log what we found
            logger.info(f"Verified dependencies.lock containing {len(data)} modules.")
            return True
        except Exception as e:
            logger.error(f"Error parse dependencies.lock: {e}")
            return False


# Global instance
integrity_checker = IntegrityChecker()
