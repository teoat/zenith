#!/usr/bin/env python3
"""Generate Ed25519 audit signing keypair for immutable audit logs.

Writes two files under ~/.zenith/:
- audit_private.key (binary, 0o600)
- audit_public.key (binary, 0o644)

If PyNaCl is not available, a random HMAC key will be written as `auth_encryption.key` (base64).
"""
import base64
import os
import secrets
import stat
from pathlib import Path

KEY_DIR = Path.home() / ".Zenith"
KEY_DIR.mkdir(parents=True, exist_ok=True)


def write_file(path: Path, data: bytes, mode=0o600):
    tmp = path.with_suffix(".tmp")
    with open(tmp, "wb") as f:
        f.write(data)
    os.chmod(tmp, mode)
    tmp.replace(path)


def main():
    try:
        from nacl import signing

        sk = signing.SigningKey.generate()
        pk = sk.verify_key

        priv = sk.encode()  # bytes
        pub = pk.encode()

        write_file(KEY_DIR / "audit_private.key", priv, mode=0o600)
        write_file(KEY_DIR / "audit_public.key", pub, mode=0o644)

        print(f"🔐 Generated Ed25519 keypair at {KEY_DIR}")
        print("Private key: audit_private.key (600)")
        print("Public key:  audit_public.key (644)")
    except Exception:
        # Fallback: generate an HMAC key and store base64
        key = secrets.token_urlsafe(48).encode("utf-8")
        write_file(KEY_DIR / "auth_encryption.key", base64.b64encode(key), mode=0o600)
        print(
            f"⚠️  PyNaCl not available. Generated HMAC auth key at {KEY_DIR / 'auth_encryption.key'}"
        )


if __name__ == "__main__":
    main()
