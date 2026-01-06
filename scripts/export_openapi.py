import json
import os
import sys

from fastapi.openapi.utils import get_openapi

# Add backend to sys.path
sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), "../backend")))

try:
    from main import app
except ImportError as e:
    print(f"Error importing app: {e}")
    sys.exit(1)


def export_openapi():
    print("Exporting OpenAPI schema...")
    openapi_schema = get_openapi(
        title=app.title,
        version=app.version,
        openapi_version=app.openapi_version,
        description=app.description,
        routes=app.routes,
    )

    output_dir = os.path.abspath(os.path.join(os.path.dirname(__file__), "../frontend"))
    output_path = os.path.join(output_dir, "openapi.json")

    with open(output_path, "w") as f:
        json.dump(openapi_schema, f, indent=2)
    print(f"OpenAPI schema exported to {output_path}")


if __name__ == "__main__":
    export_openapi()
