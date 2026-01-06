import hashlib
import secrets
import time
from datetime import datetime

from .encryption import EncryptedString, decrypt_value, encrypt_value


# Enhanced session security
def generate_secure_session_token() -> str:
    """Generate cryptographically secure session tokens"""
    # Use cryptographically secure random generation
    random_bytes = secrets.token_bytes(32)
    timestamp = str(int(time.time())).encode()
    combined = random_bytes + timestamp

    # Hash with SHA-256 for additional security
    token = hashlib.sha256(combined).hexdigest()

    return token


def validate_session_integrity(session_data: dict) -> bool:
    """Validate session data integrity"""
    required_fields = ["user_id", "token", "created_at", "expires_at"]

    # Check all required fields present
    if not all(field in session_data for field in required_fields):
        return False

    # Check expiration
    current_time = datetime.utcnow().timestamp()
    if session_data["expires_at"] < current_time:
        return False

    # Additional security checks
    return True
