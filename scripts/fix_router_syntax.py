#!/usr/bin/env python3
"""
Fix all syntax errors caused by automated script corruption
"""

import re
from pathlib import Path

ROUTER_DIR = Path("backend/app/routers")

# Common corruption patterns to fix
FIXES = [
    (r", Usernot ", " not "),
    (r", Usernow\(", " now("),
    (r"Tra, Usernsaction", "Transaction"),
    (r"FraudDetectio, UsernService", "FraudDetectionService"),
    (r"from pyda, Userntic import BaseModel", "from pydantic import BaseModel"),
    (r", UserFraudFlag", ""),
    (r"FraudFlag, User", "User"),
    (r"from app\.services\.loggi, Userng_service", "from app.services.logging_service"),
]


def fix_file(filepath: Path) -> bool:
    """Fix corruption in a single file"""
    try:
        with open(filepath) as f:
            content = f.read()

        original = content

        # Apply all fixes
        for pattern, replacement in FIXES:
            content = re.sub(pattern, replacement, content)

        # Remove orphaned auth_service import at end of file
        lines = content.splitlines()
        cleaned_lines = []
        for i, line in enumerate(lines):
            # Skip orphaned import lines
            if (
                line.strip() == "from app.services.auth_service import auth_service"
                and i > len(lines) - 5
            ):
                continue
            cleaned_lines.append(line)

        content = "\n".join(cleaned_lines)

        if content != original:
            with open(filepath, "w") as f:
                f.write(content)
            return True
        return False
    except Exception as e:
        print(f"Error fixing {filepath}: {e}")
        return False


def main():
    """Fix all router files"""
    print("🔧 Fixing syntax errors in router files...\n")

    files_fixed = 0
    for filepath in ROUTER_DIR.glob("*.py"):
        if fix_file(filepath):
            print(f"✅ Fixed: {filepath.name}")
            files_fixed += 1

    print(f"\n✅ Fixed {files_fixed} files")


if __name__ == "__main__":
    main()
