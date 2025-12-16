#!/usr/bin/env python3
"""
Production Key Generation Script
Generates cryptographically secure random keys for production environment
"""

import os
import secrets
import string
from pathlib import Path


def generate_secure_key(length: int = 64) -> str:
    """Generate a cryptographically secure random key"""
    alphabet = string.ascii_letters + string.digits
    return "".join(secrets.choice(alphabet) for _ in range(length))


def generate_hex_key(length: int = 64) -> str:
    """Generate a hex-encoded random key"""
    return secrets.token_hex(length // 2)


def create_production_env_file():
    """Create production environment file with generated keys"""

    print("🔐 GENERATING PRODUCTION ENVIRONMENT CONFIGURATION")
    print("=" * 60)

    # Generate all required keys
    keys = {
        "ENCRYPTION_KEY": generate_hex_key(64),
        "SQLCIPHER_KEY": generate_hex_key(64),
        "AUTH_ENCRYPTION_KEY": generate_hex_key(64),
        "FIELD_ENCRYPTION_KEY": generate_hex_key(64),
        "IPC_SECRET": generate_hex_key(64),
        "JWT_SECRET_KEY": generate_hex_key(64),
    }

    # Read template
    template_path = Path(".env.production.template")
    if not template_path.exists():
        print("❌ Template file .env.production.template not found")
        return False

    with open(template_path, "r") as f:
        template_content = f.read()

    # Replace placeholders
    production_content = template_content
    for key_name, key_value in keys.items():
        placeholder = f"PRODUCTION_{key_name}_REPLACE_WITH_STRONG_RANDOM_64_CHAR_HEX"
        production_content = production_content.replace(placeholder, key_value)

    # Write production file
    prod_env_path = Path(".env.production")
    with open(prod_env_path, "w") as f:
        f.write(production_content)

    print("✅ Production environment file created: .env.production")
    print("\n🔑 GENERATED KEYS:")
    for key_name, key_value in keys.items():
        print(f"   {key_name}: {key_value[:16]}... (length: {len(key_value)})")

    print("\n⚠️  SECURITY WARNING:")
    print("   - Never commit .env.production to version control")
    print("   - Store securely and backup encryption keys")
    print("   - Rotate keys periodically")
    print("   - Use different keys for different environments")

    # Create key backup (encrypted)
    backup_keys(keys)

    return True


def backup_keys(keys: dict):
    """Create an encrypted backup of keys for recovery"""

    import json

    from cryptography.fernet import Fernet

    # Generate a master key for backup encryption
    master_key = Fernet.generate_key()
    fernet = Fernet(master_key)

    # Encrypt keys
    keys_json = json.dumps(keys, indent=2)
    encrypted_keys = fernet.encrypt(keys_json.encode())

    # Save encrypted backup
    backup_path = Path(".env.production.keys.backup")
    with open(backup_path, "wb") as f:
        f.write(master_key + b"\n" + encrypted_keys)

    print(f"\n💾 Encrypted key backup created: {backup_path}")
    print(
        '   To decrypt: python -c "from cryptography.fernet import Fernet; '
        "master_key, encrypted = open('.env.production.keys.backup', 'rb').read().split(b'\n', 1); "
        'print(Fernet(master_key).decrypt(encrypted).decode())"'
    )


def validate_production_config():
    """Validate the production configuration"""

    print("\n🔍 VALIDATING PRODUCTION CONFIGURATION")
    print("-" * 40)

    issues = []

    # Check if production file exists
    prod_env_path = Path(".env.production")
    if not prod_env_path.exists():
        issues.append("Production environment file not found")
        return issues

    # Read and validate
    with open(prod_env_path, "r") as f:
        content = f.read()

    # Check for required keys
    required_keys = [
        "ENCRYPTION_KEY",
        "SQLCIPHER_KEY",
        "AUTH_ENCRYPTION_KEY",
        "FIELD_ENCRYPTION_KEY",
        "IPC_SECRET",
        "JWT_SECRET_KEY",
    ]

    for key in required_keys:
        if f"{key}=" not in content:
            issues.append(f"Missing required key: {key}")
        elif "REPLACE_WITH" in content and key in content:
            issues.append(f"Key not properly replaced: {key}")

    # Check key strengths
    lines = content.split("\n")
    for line in lines:
        if "=" in line and not line.startswith("#"):
            key, value = line.split("=", 1)
            key = key.strip()
            value = value.strip()

            if key in required_keys:
                if len(value) < 32:
                    issues.append(f"Key too short: {key} (length: {len(value)})")

    if not issues:
        print("✅ Production configuration validation passed")
    else:
        print("❌ Configuration validation failed:")
        for issue in issues:
            print(f"   - {issue}")

    return issues


if __name__ == "__main__":
    if create_production_env_file():
        issues = validate_production_config()
        if not issues:
            print("\n🎉 PRODUCTION CONFIGURATION READY")
            print("   Run: source .env.production && python backend/main.py")
        else:
            print(f"\n⚠️  {len(issues)} configuration issues found")
    else:
        print("❌ Failed to create production configuration")
