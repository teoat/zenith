#!/usr/bin/env python3
"""
API Documentation Generator for Zenith Fraud Detection Platform
Generates comprehensive API documentation from FastAPI routers
"""

import importlib
import os
import sys
from datetime import datetime
from pathlib import Path
from typing import Any, Dict

# Add backend to path
sys.path.insert(0, str(Path(__file__).parent.parent / "backend"))


def get_router_info(router_path: str) -> dict[str, Any]:
    """Extract information from a FastAPI router module"""
    try:
        # Import the router module
        module_name = router_path.replace(".py", "")
        module = importlib.import_module(f"app.routers.{module_name}")

        info = {
            "name": router_path,
            "endpoints": [],
            "description": getattr(module, "__doc__", "").strip()
            if hasattr(module, "__doc__") and module.__doc__
            else "",
            "tags": [],
        }

        # Get the router object
        if hasattr(module, "router"):
            router = module.router

            # Extract tags
            if hasattr(router, "tags") and router.tags:
                info["tags"] = router.tags

            # Extract routes
            if hasattr(router, "routes") and router.routes:
                for route in router.routes:
                    endpoint_info = {
                        "path": getattr(route, "path", ""),
                        "methods": list(getattr(route, "methods", set())),
                        "name": getattr(route, "name", ""),
                        "summary": getattr(route, "summary", ""),
                        "description": getattr(route, "description", ""),
                        "response_model": getattr(route, "response_model", None),
                        "status_code": getattr(route, "status_code", None),
                    }

                    # Try to get docstring from handler function
                    if (
                        hasattr(route, "endpoint")
                        and route.endpoint
                        and hasattr(route.endpoint, "__doc__")
                    ):
                        endpoint_info["docstring"] = (
                            route.endpoint.__doc__.strip()
                            if route.endpoint.__doc__
                            else ""
                        )

                    if endpoint_info["path"]:  # Only add if path exists
                        info["endpoints"].append(endpoint_info)

        return info

    except Exception as e:
        import traceback

        return {
            "name": router_path,
            "error": f"{e!s}\n{traceback.format_exc()}",
            "endpoints": [],
        }


def generate_api_documentation():
    """Generate comprehensive API documentation"""

    # Get all router files
    routers_dir = Path(__file__).parent.parent / "backend" / "app" / "routers"
    router_files = [
        f for f in os.listdir(routers_dir) if f.endswith(".py") and f != "__init__.py"
    ]

    print(f"Found {len(router_files)} router files")

    all_routers = []

    for router_file in sorted(router_files):
        print(f"Processing {router_file}...")
        router_info = get_router_info(router_file)
        all_routers.append(router_info)

    # Generate markdown documentation
    doc_content = f"""# Zenith Fraud Detection Platform - API Documentation

**Generated on:** {datetime.now().strftime("%Y-%m-%d %H:%M:%S")}
**Total Routers:** {len(all_routers)}
**Total Endpoints:** {sum(len(r.get("endpoints", [])) for r in all_routers)}

## API Overview

This API provides comprehensive fraud detection and investigation capabilities for the 378x492 platform.

### Base URL
```
http://localhost:8000/api/v1
```

### Authentication
All endpoints require Bearer token authentication:
```
Authorization: Bearer <jwt_token>
```

## API Endpoints by Router

"""

    for router in all_routers:
        router_name = router["name"].replace(".py", "")
        endpoint_count = len(router.get("endpoints", []))
        tags = router.get("tags", [])

        doc_content += f"""### {router_name.upper()} Router
**Endpoints:** {endpoint_count}
**Tags:** {", ".join(tags) if tags else "None"}

"""

        if router.get("description"):
            doc_content += f"{router['description']}\n\n"

        if router.get("error"):
            doc_content += f"⚠️ **Error loading router:** {router['error']}\n\n"
            continue

        for endpoint in router.get("endpoints", []):
            methods = endpoint.get("methods", [])
            path = endpoint.get("path", "")
            name = endpoint.get("name", "")
            summary = endpoint.get("summary", "")
            description = endpoint.get("description", "")
            docstring = endpoint.get("docstring", "")

            doc_content += f"""#### {", ".join(methods)} {path}
**Route Name:** {name}
**Summary:** {summary}

{description}

{docstring}

**Parameters:**
- Path parameters as defined in route
- Query parameters as applicable
- Request body for POST/PUT requests

**Responses:**
- `200`: Success
- `400`: Bad Request
- `401`: Unauthorized
- `403`: Forbidden
- `404`: Not Found
- `500`: Internal Server Error

---

"""

    # Write to file
    output_path = Path(__file__).parent / "api" / "API_DOCUMENTATION.md"
    output_path.parent.mkdir(exist_ok=True)

    with open(output_path, "w", encoding="utf-8") as f:
        f.write(doc_content)

    print(f"API documentation generated at {output_path}")
    print(f"Total routers documented: {len(all_routers)}")
    print(
        f"Total endpoints documented: {sum(len(r.get('endpoints', [])) for r in all_routers)}"
    )


if __name__ == "__main__":
    generate_api_documentation()
