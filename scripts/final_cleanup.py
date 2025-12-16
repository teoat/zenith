#!/usr/bin/env python3
"""
Final comprehensive router cleanup - fix all remaining syntax issues
"""

import re
from pathlib import Path

ROUTER_DIR = Path("backend/app/routers")

# All known corruption patterns
CORRUPTION_FIXES = [
    (r"Relatio, Usernship", "Relationship"),
    (r"start_spa, Usern,", "start_span,"),
    (r"loggi, Userng_service", "logging_service"),
    (r"FraudDetectio, UsernService", "FraudDetectionService"),
    (r"Tra, Usernsaction", "Transaction"),
    (r", Usernot ", " not "),
    (r", Usernow\(", " now("),
    (r"from pyda, Userntic import BaseModel", "from pydantic import BaseModel"),
]

# Files that need User and auth_service imports
NEEDS_AUTH = [
    "apm.py",
    "graph.py",
    "stats.py",
    "cases.py",
    "evidence.py",
    "fraud.py",
    "analytics.py",
    "notifications.py",
    "logging.py",
    "reporting.py",
]


def ensure_auth_imports(filepath: Path) -> bool:
    """Ensure User and auth_service are imported"""
    if filepath.name not in NEEDS_AUTH:
        return False

    with open(filepath, "r") as f:
        content = f.read()

    original = content
    lines = content.splitlines()
    new_lines = []

    # Find the import section
    user_import_added = False
    auth_import_added = False
    last_import_line = 0

    for i, line in enumerate(lines):
        # Track imports
        if line.startswith("import ") or line.startswith("from "):
            last_import_line = i

            # Add User to core.database import if missing
            if (
                "from core.database import" in line
                and ", User" not in line
                and not user_import_added
            ):
                if line.endswith(")"):
                    # Multi-line import
                    new_lines.append(line)
                else:
                    line = line.rstrip() + ", User"
                    user_import_added = True

            # Check if auth import exists
            if "from app.services.auth_service import auth_service" in line:
                auth_import_added = True

        new_lines.append(line)

    # Add auth_service import after last import if missing
    if not auth_import_added and last_import_line > 0:
        new_lines.insert(
            last_import_line + 1, "from app.services.auth_service import auth_service"
        )

    content = "\n".join(new_lines)

    # Apply corruption fixes
    for pattern, replacement in CORRUPTION_FIXES:
        content = re.sub(pattern, replacement, content)

    # Remove orphaned auth imports at end of file
    lines = content.splitlines()
    clean_lines = []
    for i, line in enumerate(lines):
        # Skip orphaned imports that appear late in file (after line 100)
        if (
            i > 100
            and line.strip() == "from app.services.auth_service import auth_service"
        ):
            # Check if previous line is except/raise
            if i > 0 and ("except" in lines[i - 1] or "raise" in lines[i - 1]):
                continue
        clean_lines.append(line)

    content = "\n".join(clean_lines)

    if content != original:
        with open(filepath, "w") as f:
            f.write(content)
        return True
    return False


def main():
    print("🔧 FINAL COMPREHENSIVE CLEANUP\n")

    fixed = 0
    for filepath in sorted(ROUTER_DIR.glob("*.py")):
        if ensure_auth_imports(filepath):
            print(f"✅ {filepath.name}")
            fixed += 1

    print(f"\n✅ Fixed {fixed} files")

    # Test import
    print("\n🧪 Testing backend import...")
    import sys

    sys.path.insert(0, "backend")
    try:
        from main import app

        print(f"✅✅✅ SUCCESS - {len(app.routes)} routes registered!")
        return 0
    except Exception as e:
        print(f"❌ Error: {e}")
        import traceback

        traceback.print_exc()
        return 1


if __name__ == "__main__":
    import sys

    sys.exit(main())
