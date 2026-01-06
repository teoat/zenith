#!/usr/bin/env python3
"""
Debug SSOT Integrity Check
"""

import hashlib
import json


def debug_ssot_integrity():
    # Read the SSOT file
    with open("ssot_master.json") as f:
        ssot_content = f.read()

    # Read the expected checksum
    with open("ssot_master.json.checksum") as f:
        expected_checksum = f.read().strip()

    # Calculate actual checksum
    actual_checksum = hashlib.sha256(ssot_content.encode()).hexdigest()

    print(f"Expected checksum: {expected_checksum}")
    print(f"Actual checksum:   {actual_checksum}")
    print(f"Match: {expected_checksum == actual_checksum}")

    # Check if content is valid JSON
    try:
        data = json.loads(ssot_content)
        print(f"Valid JSON: True ({len(data)} entries)")
    except:
        print("Valid JSON: False")


if __name__ == "__main__":
    debug_ssot_integrity()
