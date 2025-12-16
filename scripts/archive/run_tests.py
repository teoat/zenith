#!/usr/bin/env python3
"""
Run Integration Tests
Executes all security-related integration tests
"""

import subprocess
import sys
from pathlib import Path


def run_tests():
    """Run all integration tests"""
    print("🧪 Running Integration Tests\\n")
    print("=" * 60)

    backend_dir = Path("backend")

    if not backend_dir.exists():
        print("❌ Backend directory not found")
        return 1

    # Test 1: Admin & Backup Security Tests
    print("\\n📋 Test Suite 1: Admin & Backup Security")
    print("-" * 60)
    result = subprocess.run(
        [
            "pytest",
            "tests/integration/test_admin_backup_security.py",
            "-v",
            "--tb=short",
        ],
        cwd=backend_dir,
        capture_output=False,
    )

    if result.returncode != 0:
        print("\\n❌ Security tests failed")
        return result.returncode

    print("\\n✅ All integration tests passed!")
    return 0


if __name__ == "__main__":
    sys.exit(run_tests())
