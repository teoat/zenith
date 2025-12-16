#!/usr/bin/env python3
"""
SSOT Validation Script
Validates SSOT files and their corresponding lock files
"""

import json
import hashlib
import os
import sys
from pathlib import Path

def calculate_checksum(data):
    """Calculate SHA256 checksum of JSON data"""
    json_str = json.dumps(data, sort_keys=True, separators=(',', ':'))
    return hashlib.sha256(json_str.encode('utf-8')).hexdigest()

def validate_ssot_file(ssot_file, lock_file):
    """Validate SSOT file against its lock file"""
    try:
        # Read SSOT file
        with open(ssot_file, 'r') as f:
            ssot_data = json.load(f)

        # Read lock file
        with open(lock_file, 'r') as f:
            lock_data = json.load(f)

        # Check if locked
        if not lock_data.get('locked', False):
            print(f"⚠️  {ssot_file} is not locked")
            return False

        # Calculate current checksum
        current_checksum = calculate_checksum(ssot_data)

        # Check checksum
        stored_checksum = lock_data.get('checksum', 'pending')
        if stored_checksum == 'pending':
            print(f"⚠️  {ssot_file} has pending checksum")
            return False

        if current_checksum != stored_checksum:
            print(f"❌ {ssot_file} checksum mismatch!")
            print(f"   Current: {current_checksum}")
            print(f"   Stored:  {stored_checksum}")
            return False

        print(f"✅ {ssot_file} validation passed")
        return True

    except FileNotFoundError as e:
        print(f"❌ File not found: {e}")
        return False
    except json.JSONDecodeError as e:
        print(f"❌ Invalid JSON in {ssot_file}: {e}")
        return False

def main():
    """Main validation function"""
    ssot_files = [
        ('ssot_api_schemas.json', 'api_schemas.lock'),
        ('ssot_database_schema.json', 'database_schema.lock'),
        ('ssot_security_policies.json', 'security_policies.lock'),
        ('ssot_ui_components.json', 'ui_components.lock'),
        ('ssot_test_data.json', 'test_data.lock'),
        ('ssot_feature_flags.json', 'feature_flags.lock'),
    ]

    all_valid = True
    for ssot_file, lock_file in ssot_files:
        if os.path.exists(ssot_file) and os.path.exists(lock_file):
            if not validate_ssot_file(ssot_file, lock_file):
                all_valid = False
        else:
            print(f"⚠️  Missing files: {ssot_file} or {lock_file}")
            all_valid = False

    return 0 if all_valid else 1

if __name__ == '__main__':
    sys.exit(main())