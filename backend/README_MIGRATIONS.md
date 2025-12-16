# Migrations & Audit Key Management

This document explains how to run Alembic migrations for the backend and manage audit signing keys.

## Migrations

From the repository root, activate the project Python environment (where `alembic` is installed), then:

```bash
source .venv/bin/activate
./backend/scripts/run_migrations.sh
```

This will run `alembic -c backend/alembic.ini upgrade head` and apply available revisions.

## Audit Signing Keys (Ed25519)

The backend can sign audit log entries using an Ed25519 keypair. Use the provided script to create a keypair:

```bash
python backend/scripts/generate_audit_keys.py
```

This writes `~/.378x492/audit_private.key` (600) and `~/.378x492/audit_public.key` (644).

To rotate keys, run:

```bash
python backend/scripts/rotate_audit_key.py
```

If PyNaCl is not installed the generator will emit a HMAC key `auth_encryption.key` (base64) as a fallback. Production systems should use Ed25519 keys and distribute the public key to verifiers.
