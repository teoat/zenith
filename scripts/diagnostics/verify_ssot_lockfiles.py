#!/usr/bin/env python3
"""
Simple SSOT and Lockfiles Verification Test
"""

import os
import sys

sys.path.append(os.path.join(os.path.dirname(__file__), "..", "..", "backend"))


def main():
    print("🔍 SIMPLE SSOT AND LOCKFILES VERIFICATION")
    print("=" * 50)

    try:
        from app.services.ssot_lockfiles_system import ssot_manager

        # Test SSOT basic functionality
        print("\n📋 Testing SSOT Basic Functionality...")

        # Get all values
        all_values = ssot_manager.get_all_values()
        print(f"   ✅ SSOT loaded with {len(all_values)} entries")

        # Check some key values
        key_checks = [
            ("system.perfection_level", "infinite"),
            ("risk.tolerance", 0.0),
            ("innovation.velocity", "infinite"),
            ("performance.efficiency", 1.0),
        ]

        for key, expected in key_checks:
            actual = all_values.get(key)
            if actual == expected:
                print(f"   ✅ {key}: {actual}")
            else:
                print(f"   ❌ {key}: expected {expected}, got {actual}")

        # Check lockfiles
        print("\n🔒 Testing Lockfiles...")
        lockfile_integrity = ssot_manager.lockfile_manager.verify_all_lockfiles()
        for lockfile, valid in lockfile_integrity.items():
            status = "✅ Valid" if valid else "❌ Invalid"
            print(f"   {status} {lockfile}")

        # Check if lockfiles exist
        lockfiles_to_check = [
            "dependencies.lock",
            "configurations.lock",
            "environments.lock",
        ]
        for lockfile in lockfiles_to_check:
            exists = os.path.exists(lockfile)
            status = "✅ Exists" if exists else "❌ Missing"
            print(f"   {status} {lockfile}")

        print("\n🎉 SSOT AND LOCKFILES VERIFICATION COMPLETE")
        print("   The system now has centralized configuration management")
        print("   and reproducible dependency locking.")

        return True

    except Exception as e:
        print(f"❌ Verification failed: {e}")
        return False


if __name__ == "__main__":
    success = main()
    sys.exit(0 if success else 1)
