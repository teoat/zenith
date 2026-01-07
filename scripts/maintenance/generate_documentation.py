"""
Automated Documentation Generator
Generates API documentation from code and integrates with MkDocs
"""

import ast
import inspect
import json
import logging
import re
import subprocess
from datetime import datetime
from pathlib import Path
from typing import Dict, List, Any, Optional, Set


logger = logging.getLogger(__name__)


class APIDocumentationGenerator:
    """Generate API documentation from code"""

    def __init__(self, backend_path: Path = Path("backend")):
        self.backend_path = backend_path
        self.output_path = backend_path / "docs" / "api"
        self.output_path.mkdir(parents=True, exist_ok=True)

    def generate_router_docs(self) -> Dict[str, Any]:
        """Generate documentation from FastAPI routers"""
        print("\n📝 Generating router documentation...")

        routers_path = self.backend_path / "app" / "routers"
        router_docs = {}

        for router_file in routers_path.glob("*.py"):
            if router_file.name.startswith("__"):
                continue

            router_name = router_file.stem
            print(f"  Processing: {router_name}")

            try:
                content = router_file.read_text()
                routes = self._extract_routes(content)
                router_docs[router_name] = routes

            except Exception as e:
                logger.error(f"Error processing {router_name}: {e}")

        return router_docs

    def _extract_routes(self, content: str) -> List[Dict[str, Any]]:
        """Extract API routes from router content"""
        routes = []

        tree = ast.parse(content)

        for node in ast.walk(tree):
            if isinstance(node, ast.FunctionDef):
                for decorator in node.decorator_list:
                    route_info = self._extract_route_decorator(decorator, node)
                    if route_info:
                        routes.append(route_info)

        return routes

    def _extract_route_decorator(self, decorator: ast.AST, func_node: ast.FunctionDef) -> Optional[Dict[str, Any]]:
        """Extract route information from decorator"""
        if isinstance(decorator, ast.Call):
            if isinstance(decorator.func, ast.Attribute):
                if decorator.func.attr in ["get", "post", "put", "delete", "patch"]:
                    route_info = {
                        "method": decorator.func.attr.upper(),
                        "path": self._get_string_value(decorator.args[0]) if decorator.args else "",
                        "function": func_node.name,
                        "description": self._extract_docstring(func_node),
                        "parameters": self._extract_parameters(func_node),
                    }
                    return route_info

        return None

    def _get_string_value(self, node: ast.AST) -> str:
        """Extract string value from AST node"""
        if isinstance(node, ast.Constant):
            return str(node.value)
        elif isinstance(node, ast.Str):
            return node.s
        return ""

    def _extract_docstring(self, node: ast.FunctionDef) -> str:
        """Extract docstring from function"""
        docstring = ast.get_docstring(node)
        return docstring or ""

    def _extract_parameters(self, node: ast.FunctionDef) -> List[Dict[str, Any]]:
        """Extract parameters from function"""
        params = []

        for arg in node.args.args:
            if arg.arg in ["self", "request"]:
                continue

            param_type = "unknown"
            if arg.annotation:
                param_type = ast.unparse(arg.annotation)

            params.append({
                "name": arg.arg,
                "type": param_type,
                "required": arg not in node.args.defaults,
            })

        return params

    def generate_model_docs(self) -> Dict[str, Any]:
        """Generate documentation from Pydantic models"""
        print("\n📝 Generating model documentation...")

        models_path = self.backend_path / "app" / "models"
        model_docs = {}

        for model_file in models_path.glob("*.py"):
            if model_file.name.startswith("__"):
                continue

            model_name = model_file.stem
            print(f"  Processing: {model_name}")

            try:
                content = model_file.read_text()
                models = self._extract_models(content)
                model_docs[model_name] = models

            except Exception as e:
                logger.error(f"Error processing {model_name}: {e}")

        return model_docs

    def _extract_models(self, content: str) -> List[Dict[str, Any]]:
        """Extract Pydantic models from file"""
        models = []

        tree = ast.parse(content)

        for node in ast.walk(tree):
            if isinstance(node, ast.ClassDef):
                if any(base.id == "BaseModel" for base in node.bases if isinstance(base, ast.Name)):
                    model_info = {
                        "name": node.name,
                        "description": self._extract_docstring(node),
                        "fields": self._extract_model_fields(node),
                    }
                    models.append(model_info)

        return models

    def _extract_model_fields(self, class_node: ast.ClassDef) -> List[Dict[str, Any]]:
        """Extract fields from Pydantic model"""
        fields = []

        for node in class_node.body:
            if isinstance(node, ast.AnnAssign) and isinstance(node.target, ast.Name):
                field_name = node.target.id
                field_type = ast.unparse(node.annotation) if node.annotation else "unknown"

                field_info = {
                    "name": field_name,
                    "type": field_type,
                }

                if node.value:
                    field_info["default"] = ast.unparse(node.value)

                fields.append(field_info)

        return fields

    def generate_service_docs(self) -> Dict[str, Any]:
        """Generate documentation from service modules"""
        print("\n📝 Generating service documentation...")

        services_path = self.backend_path / "app" / "services"
        service_docs = {}

        for service_file in services_path.glob("*.py"):
            if service_file.name.startswith("__"):
                continue

            service_name = service_file.stem
            print(f"  Processing: {service_name}")

            try:
                content = service_file.read_text()
                classes = self._extract_classes(content)
                service_docs[service_name] = classes

            except Exception as e:
                logger.error(f"Error processing {service_name}: {e}")

        return service_docs

    def _extract_classes(self, content: str) -> List[Dict[str, Any]]:
        """Extract class definitions from file"""
        classes = []

        tree = ast.parse(content)

        for node in ast.walk(tree):
            if isinstance(node, ast.ClassDef):
                class_info = {
                    "name": node.name,
                    "description": self._extract_docstring(node),
                    "methods": self._extract_methods(node),
                }
                classes.append(class_info)

        return classes

    def _extract_methods(self, class_node: ast.ClassDef) -> List[Dict[str, Any]]:
        """Extract methods from class"""
        methods = []

        for node in class_node.body:
            if isinstance(node, ast.FunctionDef):
                method_info = {
                    "name": node.name,
                    "description": self._extract_docstring(node),
                    "parameters": self._extract_parameters(node),
                }
                methods.append(method_info)

        return methods

    def generate_markdown_docs(self) -> Path:
        """Generate complete Markdown documentation"""
        print("\n📚 Generating Markdown documentation...")

        md_content = []
        md_content.append("# API Documentation")
        md_content.append("")
        md_content.append(f"*Generated: {datetime.now().isoformat()}*")
        md_content.append("")

        router_docs = self.generate_router_docs()

        md_content.append("## API Routes")
        md_content.append("")

        for router_name, routes in router_docs.items():
            if not routes:
                continue

            router_title = router_name.replace("_", " ").title()
            md_content.append(f"### {router_title}")
            md_content.append("")

            for route in routes:
                md_content.append(f"#### {route['method']} {route['path']}")
                md_content.append("")

                if route["description"]:
                    md_content.append(f"**Description:** {route['description']}")
                    md_content.append("")

                if route["parameters"]:
                    md_content.append("**Parameters:**")
                    md_content.append("")

                    for param in route["parameters"]:
                        required = " (required)" if param["required"] else " (optional)"
                        md_content.append(f"- `{param['name']}`: {param['type']}{required}")

                    md_content.append("")

            md_content.append("---")
            md_content.append("")

        model_docs = self.generate_model_docs()

        md_content.append("## Data Models")
        md_content.append("")

        for model_file, models in model_docs.items():
            if not models:
                continue

            md_content.append(f"### {model_file}")
            md_content.append("")

            for model in models:
                md_content.append(f"#### {model['name']}")
                md_content.append("")

                if model["description"]:
                    md_content.append(f"**Description:** {model['description']}")
                    md_content.append("")

                if model["fields"]:
                    md_content.append("**Fields:**")
                    md_content.append("")

                    for field in model["fields"]:
                        md_content.append(f"- `{field['name']}`: {field['type']}")
                        if "default" in field:
                            md_content.append(f"  - Default: `{field['default']}`")

                    md_content.append("")

        md_path = self.output_path / "auto_generated.md"

        with open(md_path, "w") as f:
            f.write("\n".join(md_content))

        print(f"✅ Markdown documentation generated at {md_path}")
        return md_path


class DocumentationBuilder:
    """Build and deploy documentation"""

    def __init__(self, docs_path: Path = Path("docs")):
        self.docs_path = docs_path

    def build_mkdocs(self) -> bool:
        """Build MkDocs site"""
        print("\n🏗️  Building MkDocs site...")

        try:
            result = subprocess.run(
                ["mkdocs", "build"],
                cwd=str(self.docs_path),
                capture_output=True,
                text=True,
                timeout=300,
            )

            if result.returncode == 0:
                print("✅ MkDocs build successful")
                return True
            else:
                print(f"❌ MkDocs build failed: {result.stderr}")
                return False

        except subprocess.TimeoutExpired:
            print("❌ MkDocs build timed out")
            return False
        except Exception as e:
            print(f"❌ Error building MkDocs: {e}")
            return False

    def serve_mkdocs(self, port: int = 8000) -> None:
        """Serve MkDocs site locally"""
        print(f"\n🌐 Serving MkDocs at http://localhost:{port}")

        subprocess.run(
            ["mkdocs", "serve", "-a", f"localhost:{port}"],
            cwd=str(self.docs_path),
        )


def generate_full_documentation() -> bool:
    """Generate complete documentation suite"""
    print("\n📚 GENERATING DOCUMENTATION SUITE")
    print("=" * 80)

    generator = APIDocumentationGenerator()
    md_path = generator.generate_markdown_docs()

    builder = DocumentationBuilder()

    if not Path("docs/mkdocs.yml").exists():
        print("⚠️  mkdocs.yml not found, skipping build")
        return True

    success = builder.build_mkdocs()

    return success


def main():
    """Main execution"""
    import argparse

    parser = argparse.ArgumentParser(description="Automated Documentation Generation")
    parser.add_argument(
        "--backend-path",
        default="backend",
        help="Path to backend directory",
    )
    parser.add_argument(
        "--build",
        action="store_true",
        help="Build MkDocs site",
    )
    parser.add_argument(
        "--serve",
        action="store_true",
        help="Serve documentation locally",
    )
    parser.add_argument(
        "--port",
        type=int,
        default=8000,
        help="Port for serving documentation",
    )
    args = parser.parse_args()

    generator = APIDocumentationGenerator(Path(args.backend_path))
    md_path = generator.generate_markdown_docs()

    if args.build or args.serve:
        builder = DocumentationBuilder()

        if args.build:
            success = builder.build_mkdocs()
            exit(0 if success else 1)

        if args.serve:
            builder.serve_mkdocs(port=args.port)


if __name__ == "__main__":
    main()
