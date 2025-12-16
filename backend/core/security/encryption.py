import base64
import os

from cryptography.fernet import Fernet
from sqlalchemy.types import String, Text, TypeDecorator

from core.logging import logger


class EncryptedString(TypeDecorator):
    """
    SQLAlchemy TypeDecorator that encrypts data before saving to database
    and decrypts after retrieving.
    """

    impl = Text
    cache_ok = True

    def __init__(self, key=None, **kwargs):
        super().__init__(**kwargs)
        self._key = key or self._get_key()
        self._fernet = Fernet(self._key)

    def _get_key(self):
        """Get encryption key from environment or generate a dev one"""
        key = os.getenv("ENCRYPTION_KEY")
        if not key:
            # Generate a consistent dev key if not provided (NOT SECURE FOR PROD)
            # This ensures we don't break local dev restarts
            logger.warning(
                "No ENCRYPTION_KEY found. Using insecure default for development."
            )
            # Valid 32-byte base64-encoded key for dev
            return b"cw_0x689RpI-jtRR7oFt8p98l8UIghx0spL_SXQky-0="
        return key.encode() if isinstance(key, str) else key

    def process_bind_param(self, value, dialect):
        """Encrypt value before saving"""
        if value is None:
            return None
        if not isinstance(value, str):
            value = str(value)

        try:
            return self._fernet.encrypt(value.encode()).decode()
        except Exception as e:
            logger.error(f"Encryption failed: {e}")
            raise

    def process_result_value(self, value, dialect):
        """Decrypt value after retrieving"""
        if value is None:
            return None

        try:
            return self._fernet.decrypt(value.encode()).decode()
        except Exception as e:
            logger.error(f"Decryption failed: {e}")
            # Return raw value in case of error (might be unencrypted legacy data)
            return value


# Helper methods
def encrypt_value(value: str) -> str:
    if value is None:
        return None
    key = os.getenv("ENCRYPTION_KEY") or b"cw_0x689RpI-jtRR7oFt8p98l8UIghx0spL_SXQky-0="
    if isinstance(key, str):
        key = key.encode()
    f = Fernet(key)
    return f.encrypt(value.encode()).decode()


def decrypt_value(token: str) -> str:
    if token is None:
        return None
    key = os.getenv("ENCRYPTION_KEY") or b"cw_0x689RpI-jtRR7oFt8p98l8UIghx0spL_SXQky-0="
    if isinstance(key, str):
        key = key.encode()
    f = Fernet(key)
    return f.decrypt(token.encode()).decode()
