from cryptography.fernet import Fernet
from sqlalchemy.types import Text, TypeDecorator

from core.config import settings
from core.logging import logger


class VersionedEncryptedString(TypeDecorator):
    """
    SQLAlchemy TypeDecorator that encrypts data with key versioning for migration support.
    Supports multiple encryption keys and automatic decryption with fallback.
    """

    impl = Text
    cache_ok = True

    # Key versions for migration support
    KEY_VERSIONS = {
        "v1": settings.FIELD_ENCRYPTION_KEY,  # Current key
        # Add older keys here for migration: "v0": "old_key_here"
    }

    def __init__(self, key=None, **kwargs):
        super().__init__(**kwargs)
        self._current_version = "v1"
        self._fernet_instances = {}

        # Initialize Fernet instances for all key versions
        for version, key_value in self.KEY_VERSIONS.items():
            key_bytes = key_value.encode() if isinstance(key_value, str) else key_value
            self._fernet_instances[version] = Fernet(key_bytes)

        # Use current version for encryption
        self._current_fernet = self._fernet_instances[self._current_version]

    def process_bind_param(self, value, dialect):
        """Encrypt value before saving with version prefix"""
        if value is None:
            return None
        if not isinstance(value, str):
            value = str(value)

        try:
            encrypted = self._current_fernet.encrypt(value.encode()).decode()
            # Prefix with version for future migration support
            return f"{self._current_version}:{encrypted}"
        except Exception as e:
            logger.error(f"Encryption failed: {e}")
            raise

    def process_result_value(self, value, dialect):
        """Decrypt value after retrieving with version-aware fallback"""
        if value is None:
            return None

        # Handle versioned encrypted data
        if ":" in value and len(value.split(":", 1)) == 2:
            version, encrypted_data = value.split(":", 1)
            if version in self._fernet_instances:
                try:
                    return self._fernet_instances[version].decrypt(encrypted_data.encode()).decode()
                except Exception as e:
                    logger.error(f"Decryption failed for {version}: {e}")
                    # Continue to fallback logic
            else:
                logger.warning(f"Unknown encryption version: {version}")

        # Fallback: try all known keys (for legacy data without version prefix)
        for version, fernet in self._fernet_instances.items():
            try:
                return fernet.decrypt(value.encode()).decode()
            except Exception:
                continue

        # Final fallback: return raw value (might be unencrypted legacy data)
        logger.error(f"All decryption attempts failed for value starting with: {value[:50]}...")
        return value


# Backward compatibility alias
class EncryptedString(VersionedEncryptedString):
    """Backward compatibility alias for VersionedEncryptedString"""


# Helper methods
def encrypt_value(value: str) -> str:
    if value is None:
        return None
    key = settings.FIELD_ENCRYPTION_KEY
    if isinstance(key, str):
        key = key.encode()
    f = Fernet(key)
    return f.encrypt(value.encode()).decode()


def decrypt_value(token: str) -> str:
    if token is None:
        return None
    key = settings.FIELD_ENCRYPTION_KEY
    if isinstance(key, str):
        key = key.encode()
    f = Fernet(key)
    return f.decrypt(token.encode()).decode()
