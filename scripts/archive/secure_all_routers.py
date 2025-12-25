#!/usr/bin/env python3
"""
Comprehensive Router Authentication Enhancement
Systematically adds authentication to all unprotected API endpoints
"""

import os
import re
import sys
from pathlib import Path

# Router files to secure with their endpoint counts
ROUTERS_TO_SECURE = {
    # Placeholder auth routers
    "cases.py": 7,
    "evidence.py": 4,
    "fraud.py": 8,
    "analytics.py": 5,
    # No auth routers
    "notifications.py": 8,
    "graph.py": 6,
    "apm.py": 15,
    "logging.py": 6,
    "reporting.py": 11,
}


def update_router_file(filepath: Path) -> dict:
    """Add authentication to a single router file"""

    with open(filepath, "r") as f:
        content = f.read()

    original_content = content
    changes = []

    # Step 1: Ensure User is imported from core.database
    if "from core.database import" in content and ", User" not in content:
        content = re.sub(r"(from core\.database import [^\\n]+)", r"\1, User", content)
        # Clean up any double commas or User, User
        content = content.replace("User, User", "User").replace(",,", ",")
        changes.append("Added User to database imports")

    # Step 2: Add auth_service import if missing
    if "from app.services.auth_service import auth_service" not in content:
        # Find last import line
        import_pattern = r"((?:from |import ).+\n)(?!(?:from |import ))"
        match = list(re.finditer(import_pattern, content))
        if match:
            last_import = match[-1]
            insert_pos = last_import.end()
            content = (
                content[:insert_pos]
                + "from app.services.auth_service import auth_service\n"
                + content[insert_pos:]
            )
            changes.append("Added auth_service import")

    # Step 3: Remove placeholder auth
    if "get_current_user = None" in content:
        content = content.replace("get_current_user = None", "")
        content = content.replace("require_permission = None", "")
        # Clean up empty comment blocks
        content = re.sub(r"# Module-level placeholders.*\n+", "", content)
        content = re.sub(r"# Placeholder for authentication.*\n+", "", content)
        changes.append("Removed auth placeholders")

    # Step 4: Add authentication to all endpoint functions
    # Pattern to match router decorators and function signatures
    endpoint_pattern = r"(@router\.(get|post|put|delete|patch)\([^\)]+\))\s*\n(async def |def )(\w+)\(([^\:]*)\):"

    def add_auth_param(match):
        decorator = match.group(1)
        async_prefix = match.group(3)
        func_name = match.group(4)
        params = match.group(5)

        # Skip if already has auth
        if "current_user" in params:
            return match.group(0)

        # Parse existing parameters
        param_list = [p.strip() for p in params.split(",") if p.strip()]

        # Add auth parameter
        auth_param = "current_user: User = Depends(auth_service.get_current_user)"

        if not param_list:
            new_params = f"\n    {auth_param}\n"
        elif len(param_list) == 1 and "=" not in param_list[0]:
            # Single parameter without default
            new_params = f"{param_list[0]}, {auth_param}"
        else:
            # Multiple parameters or parameters with defaults
            new_params = ",\n    ".join(param_list) + f",\n    {auth_param}\n"

        return f"{decorator}\n{async_prefix}{func_name}({new_params}):"

    endpoints_updated = 0
    new_content = content
    for match in re.finditer(endpoint_pattern, content):
        if "current_user" not in match.group(0):
            endpoints_updated += 1

    content = re.sub(endpoint_pattern, add_auth_param, content)

    if endpoints_updated > 0:
        changes.append(f"Added auth to {endpoints_updated} endpoints")

    # Only write if changes were made
    if content != original_content:
        with open(filepath, "w") as f:
            f.write(content)
        return {"success": True, "changes": changes, "endpoints": endpoints_updated}
    else:
        return {"success": False, "changes": ["No changes needed"], "endpoints": 0}


def main():
    """Main execution"""
    BASE_DIR = Path(__file__).parent.parent
    ROUTERS_DIR = BASE_DIR / "backend" / "app" / "routers"

    print("=" * 70)
    print("🔐 COMPREHENSIVE API AUTHENTICATION ENHANCEMENT")
    print("=" * 70)
    print()

    results = []
    total_endpoints = 0

    for router_file, expected_endpoints in ROUTERS_TO_SECURE.items():
        filepath = ROUTERS_DIR / router_file

        if not filepath.exists():
            results.append(
                {
                    "file": router_file,
                    "status": "❌",
                    "message": "File not found",
                    "endpoints": 0,
                }
            )
            continue

        print(f"Processing {router_file}...", end=" ")
        result = update_router_file(filepath)

        status = "✅" if result["success"] else "⚠️"
        message = "; ".join(result["changes"])
        endpoints = result["endpoints"]
        total_endpoints += endpoints

        results.append(
            {
                "file": router_file,
                "status": status,
                "message": message,
                "endpoints": endpoints,
                "expected": expected_endpoints,
            }
        )

        print(f"{status} ({endpoints} endpoints)")

    # Print summary
    print()
    print("=" * 70)
    print("📊 SUMMARY")
    print("=" * 70)
    print()
    print(f"{'Router':<25} {'Status':<8} {'Endpoints':<12} {'Changes'}")
    print("-" * 70)

    for r in results:
        print(
            f"{r['file']:<25} {r['status']:<8} {r['endpoints']:>3}/{r.get('expected', 0):<7} {r['message']}"
        )

    print()
    print(f"✅ Total endpoints secured: {total_endpoints}")
    print(f"✅ Routers processed: {len(results)}")
    successful = sum(1 for r in results if r["status"] == "✅")
    print(f"✅ Successfully updated: {successful}/{len(results)}")

    print()
    print("🎯 NEXT STEPS:")
    print("1. Re-enable CSRF protection in backend/main.py (line 255)")
    print("2. Run backend tests: cd backend && pytest tests/")
    print("3. Update implementation-status.md API security to 100%")
    print()


if __name__ == "__main__":
    main()
