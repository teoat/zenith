#!/usr/bin/env python3
"""
Batch Authentication Enhancement Script
Adds authentication to all unprotected router endpoints
"""

import os
import re
from pathlib import Path

# Routers that need authentication added
ROUTERS_TO_SECURE = [
    "cases.py",
    "evidence.py",
    "fraud.py",
    "analytics.py",
    "notifications.py",
    "graph.py",
    "apm.py",
    "logging.py",
    "reporting.py",
]

ROUTERS_DIR = Path(__file__).parent.parent / "backend" / "app" / "routers"


def add_auth_imports(content: str) -> str:
    """Add authentication imports if not present"""
    if "from app.services.auth_service import auth_service" in content:
        return content

    # Add auth_service import after other imports
    if "from core.database import" in content:
        content = content.replace(
            "from core.database import", "from core.database import User, "
        )
        # Remove duplicate if already there
        content = content.replace("User, User,", "User,")

    # Add auth service import
    import_lines = content.split("\n")
    insert_index = 0
    for i, line in enumerate(import_lines):
        if line.startswith("from ") or line.startswith("import "):
            insert_index = i + 1
        if line.startswith("router = APIRouter()"):
            break

    if "from app.services.auth_service import auth_service" not in content:
        import_lines.insert(
            insert_index, "from app.services.auth_service import auth_service"
        )

    return "\n".join(import_lines)


def replace_placeholder_auth(content: str) -> str:
    """Replace get_current_user = None placeholders"""
    return content.replace(
        "get_current_user = None", "# Authentication handled by auth_service"
    )


def add_auth_to_endpoint(match) -> str:
    """Add authentication parameter to endpoint function"""
    decorator = match.group(1)
    func_def = match.group(2)
    params = match.group(3)

    # Check if auth already added
    if "current_user" in params or "auth_service.get_current_user" in params:
        return match.group(0)

    # Add auth parameter
    if "db: Session = Depends(get_db)" in params:
        new_params = params.replace(
            "db: Session = Depends(get_db)",
            "db: Session = Depends(get_db),\n    current_user: User = Depends(auth_service.get_current_user)",
        )
    elif params.strip() == "":
        new_params = "\n    db: Session = Depends(get_db),\n    current_user: User = Depends(auth_service.get_current_user)\n"
    else:
        # Append to existing params
        new_params = (
            params.rstrip(")")
            + ",\n    current_user: User = Depends(auth_service.get_current_user)\n)"
        )

    return f"{decorator}\n{func_def}({new_params}"


def secure_router_file(filepath: Path) -> tuple[bool, str]:
    """Add authentication to a router file"""
    try:
        with open(filepath, "r") as f:
            content = f.read()

        original_content = content

        # Step 1: Add imports
        content = add_auth_imports(content)

        # Step 2: Replace placeholders
        content = replace_placeholder_auth(content)

        # Step 3: Add auth to endpoints
        # Pattern to match endpoint decorators and function signatures
        pattern = r"(@router\.(get|post|put|delete|patch)\([^\)]+\))\s*\n(async def \w+|def \w+)\(([^\{]*)\):"
        content = re.sub(pattern, add_auth_to_endpoint, content)

        if content != original_content:
            with open(filepath, "w") as f:
                f.write(content)
            return True, "Updated successfully"
        else:
            return False, "No changes needed"

    except Exception as e:
        return False, f"Error: {str(e)}"


def main():
    """Main execution"""
    print("🔐 Starting Batch Authentication Enhancement\n")

    results = []
    for router_file in ROUTERS_TO_SECURE:
        filepath = ROUTERS_DIR / router_file
        if not filepath.exists():
            results.append((router_file, False, "File not found"))
            continue

        success, message = secure_router_file(filepath)
        results.append((router_file, success, message))

    # Print results
    print("\n📊 Results:\n")
    for filename, success, message in results:
        status = "✅" if success else "⚠️"
        print(f"{status} {filename:30s} - {message}")

    successful = sum(1 for _, s, _ in results if s)
    print(f"\n✅ Successfully updated {successful}/{len(results)} routers")


if __name__ == "__main__":
    main()
