#!/usr/bin/env python3
"""Rotate audit signing key safely.

Creates a new keypair and archives the previous keys with a timestamped suffix.
This is a convenience script; rotate keys carefully and distribute public key to verifiers.
"""
import os
from pathlib import Path
import datetime

KEY_DIR = Path.home() / '.378x492'
PRIV = KEY_DIR / 'audit_private.key'
PUB = KEY_DIR / 'audit_public.key'

def archive(path: Path):
    if path.exists():
        ts = datetime.datetime.utcnow().strftime('%Y%m%d%H%M%S')
        path.rename(path.with_name(path.name + f'.{ts}.bak'))

def main():
    from generate_audit_keys import main as gen_main
    archive(PRIV)
    archive(PUB)
    gen_main()
    print('✅ Rotation complete. Verify public key distribution to verifiers.')

if __name__ == '__main__':
    main()
