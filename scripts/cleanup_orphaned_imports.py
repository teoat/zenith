#!/usr/bin/env python3
"""
Comprehensive router file cleanup - remove orphaned imports
"""

import re
from pathlib import Path

ROUTER_DIR = Path("backend/app/routers")


def fix_orphaned_imports(filepath: Path) -> bool:
    """Remove orphaned auth_service imports at end of try/except blocks"""
    try:
        with open(filepath, "r") as f:
            content = f.read()

        original = content
        lines = content.splitlines()
        clean_lines = []
        skip_next = False

        for i, line in enumerate(lines):
            # Skip orphaned "from app.services.auth_service import auth_service"
            # that appears after try/except blocks
            if skip_next:
                skip_next = False
                continue

            if line.strip() == "from app.services.auth_service import auth_service":
                # Check context - is this at top of file?
                if i < 20 and ("import" in "\n".join(lines[max(0, i - 5) : i])):
                    # This is likely a proper import at top
                    clean_lines.append(line)
                elif i > 20:
                    # Check previous lines for try/except pattern
                    prev_5 = "\n".join(lines[max(0, i - 5) : i])
                    if "except" in prev_5 or "raise HTTPException" in prev_5:
                        # Skip this orphaned import
                        continue
                    else:
                        clean_lines.append(line)
                else:
                    clean_lines.append(line)
            else:
                clean_lines.append(line)

        content = "\n".join(clean_lines)

        if content != original:
            with open(filepath, "w") as f:
                f.write(content)
            return True
        return False
    except Exception as e:
        print(f"Error: {e}")
        return False


def main():
    print("🧹 Cleaning orphaned imports...\n")

    fixed = 0
    for filepath in ROUTER_DIR.glob("*.py"):
        if fix_orphaned_imports(filepath):
            print(f"✅ {filepath.name}")
            fixed += 1

    print(f"\n✅ Cleaned {fixed} files")


if __name__ == "__main__":
    main()
