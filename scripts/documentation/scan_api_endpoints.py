#!/usr/bin/env python3
"""
Simplified API Documentation Scanner
Analyzes FastAPI router files to extract endpoint information without running the app
"""

import ast
import json
import re
from pathlib import Path
from typing import Any, Dict, List


class APIEndpointScanner(ast.NodeVisitor):
    """AST visitor to extract API endpoint information"""

    def __init__(self):
        self.endpoints = []
        self.current_function = None
        self.imports = {}

    def visit_Import(self, node):
        """Track import statements"""
        for alias in node.names:
            self.imports[alias.name] = alias.asname
        self.generic_visit(node)

    def visit_ImportFrom(self, node):
        """Track from-import statements"""
        if node.module:
            for alias in node.names:
                full_name = f"{node.module}.{alias.name}"
                self.imports[alias.name] = alias.asname or alias.name
        self.generic_visit(node)

    def visit_FunctionDef(self, node):
        """Track function definitions"""
        self.current_function = node.name
        self.generic_visit(node)
        self.current_function = None

    def visit_Call(self, node):
        """Extract decorator calls for API endpoints"""
        if (
            isinstance(node.func, ast.Attribute)
            and isinstance(node.func.value, ast.Name)
            and node.func.value.id == "router"
        ):
            method = node.func.attr
            if method.upper() in ["GET", "POST", "PUT", "DELETE", "PATCH"]:
                endpoint_info = {
                    "method": method.upper(),
                    "path": self._extract_path(node),
                    "function": self.current_function,
                    "file": self.current_file,
                }
                self.endpoints.append(endpoint_info)

        self.generic_visit(node)

    def _extract_path(self, call_node):
        """Extract path from decorator call"""
        if call_node.args:
            first_arg = call_node.args[0]
            if isinstance(first_arg, ast.Str):
                return first_arg.s
            elif isinstance(first_arg, ast.Constant):
                return first_arg.value
        return "/"


def scan_router_file(file_path: Path) -> list[dict[str, Any]]:
    """Scan a single router file for API endpoints"""
    try:
        with open(file_path, encoding="utf-8") as f:
            content = f.read()

        # Parse AST
        tree = ast.parse(content)

        # Scan for endpoints
        scanner = APIEndpointScanner()
        scanner.current_file = str(file_path.relative_to(Path.cwd()))
        scanner.visit(tree)

        return scanner.endpoints

    except Exception as e:
        print(f"Error scanning {file_path}: {e}")
        return []


def extract_docstrings_and_comments(file_path: Path) -> dict[str, str]:
    """Extract docstrings and comments for documentation"""
    try:
        with open(file_path, encoding="utf-8") as f:
            content = f.read()

        # Extract docstrings
        docstring_pattern = r'"""([^"]+)"""'
        docstrings = re.findall(docstring_pattern, content, re.MULTILINE | re.DOTALL)

        # Extract comments
        comment_pattern = r"# ([^\n]+)"
        comments = re.findall(comment_pattern, content)

        return {"docstrings": docstrings, "comments": comments, "file_content": content}

    except Exception as e:
        print(f"Error extracting docs from {file_path}: {e}")
        return {"docstrings": [], "comments": [], "file_content": ""}


def analyze_api_models() -> dict[str, Any]:
    """Analyze Pydantic models for API schemas"""
    models_dir = Path(__file__).parent.parent.parent / "backend" / "app" / "models"
    models_info = {}

    if not models_dir.exists():
        return models_info

    for model_file in models_dir.glob("*.py"):
        try:
            with open(model_file, encoding="utf-8") as f:
                content = f.read()

            # Extract class definitions
            class_pattern = r"class\s+(\w+)\s*\([^)]*\):"
            classes = re.findall(class_pattern, content)

            models_info[model_file.stem] = {
                "classes": classes,
                "file_path": str(model_file),
                "content": content[:1000] + "..." if len(content) > 1000 else content,
            }

        except Exception as e:
            print(f"Error analyzing model file {model_file}: {e}")

    return models_info


def generate_comprehensive_api_docs() -> dict[str, Any]:
    """Generate comprehensive API documentation"""

    print("🔍 Scanning API router files...")

    # Find all router files
    backend_dir = Path(__file__).parent.parent.parent / "backend"
    routers_dir = backend_dir / "app" / "routers"

    if not routers_dir.exists():
        print(f"❌ Routers directory not found: {routers_dir}")
        return {}

    # Scan all router files
    all_endpoints = []
    router_files = list(routers_dir.glob("*.py"))

    for router_file in router_files:
        if router_file.name.startswith("__"):
            continue

        print(f"📋 Scanning {router_file.name}...")
        endpoints = scan_router_file(router_file)
        all_endpoints.extend(endpoints)

    # Analyze models
    print("🏗️  Analyzing API models...")
    models_info = analyze_api_models()

    # Organize endpoints by router
    endpoints_by_router = {}
    for endpoint in all_endpoints:
        router_name = Path(endpoint["file"]).stem
        if router_name not in endpoints_by_router:
            endpoints_by_router[router_name] = []
        endpoints_by_router[router_name].append(endpoint)

    # Generate statistics
    stats = {
        "total_endpoints": len(all_endpoints),
        "total_routers": len(endpoints_by_router),
        "total_models": len(models_info),
        "methods": {},
    }

    for endpoint in all_endpoints:
        method = endpoint["method"]
        stats["methods"][method] = stats["methods"].get(method, 0) + 1

    # Create comprehensive documentation
    api_docs = {
        "metadata": {
            "generated_by": "378x492 API Scanner v1.0",
            "timestamp": str(Path(__file__).stat().st_mtime),
            "total_endpoints": stats["total_endpoints"],
            "total_routers": stats["total_routers"],
        },
        "statistics": stats,
        "endpoints_by_router": endpoints_by_router,
        "all_endpoints": all_endpoints,
        "models": models_info,
    }

    return api_docs


def create_markdown_documentation(api_docs: dict[str, Any]) -> str:
    """Create markdown documentation from API analysis"""

    md = []

    # Header
    md.append("# Zenith Fraud Detection API Documentation")
    md.append("")
    md.append("## Overview")
    md.append("")
    md.append(f"**Total Endpoints**: {api_docs['metadata']['total_endpoints']}")
    md.append(f"**Total Routers**: {api_docs['metadata']['total_routers']}")
    md.append("**Base URL**: `https://api.zenith.com`")
    md.append("")

    # Statistics
    stats = api_docs["statistics"]
    md.append("## API Statistics")
    md.append("")
    md.append("| Method | Count |")
    md.append("|--------|-------|")
    for method, count in sorted(stats["methods"].items()):
        md.append(f"| {method} | {count} |")
    md.append("")

    # Endpoints by router
    md.append("## Endpoints by Router")
    md.append("")

    for router_name, endpoints in sorted(api_docs["endpoints_by_router"].items()):
        md.append(f"### {router_name.title()}")
        md.append("")

        for endpoint in endpoints:
            method = endpoint["method"]
            path = endpoint["path"]
            function = endpoint.get("function", "N/A")

            md.append(f"#### {method} {path}")
            md.append("")
            md.append(f"**Handler**: `{function}`")
            md.append("")

        md.append("")

    # Models
    if api_docs["models"]:
        md.append("## API Models")
        md.append("")

        for model_name, model_info in sorted(api_docs["models"].items()):
            md.append(f"### {model_name.title()}")
            md.append("")

            classes = model_info.get("classes", [])
            if classes:
                md.append("**Classes**:")
                for cls in classes:
                    md.append(f"- `{cls}`")
                md.append("")

    return "\n".join(md)


def save_documentation(api_docs: dict[str, Any], markdown_doc: str) -> None:
    """Save all documentation files"""

    docs_dir = Path(__file__).parent.parent.parent / "docs" / "api"
    docs_dir.mkdir(parents=True, exist_ok=True)

    # Save JSON documentation
    with open(docs_dir / "api_analysis.json", "w") as f:
        json.dump(api_docs, f, indent=2)

    # Save markdown documentation
    with open(docs_dir / "README.md", "w") as f:
        f.write(markdown_doc)

    print(f"✅ Documentation saved to {docs_dir}")
    print(f"   - API Analysis: {docs_dir / 'api_analysis.json'}")
    print(f"   - Markdown Docs: {docs_dir / 'README.md'}")
    print(f"   - Endpoints Found: {api_docs['metadata']['total_endpoints']}")
    print(f"   - Routers Analyzed: {api_docs['metadata']['total_routers']}")


def main():
    """Main documentation generation process"""
    print("🚀 Starting API Documentation Analysis...")

    # Generate comprehensive API docs
    api_docs = generate_comprehensive_api_docs()

    if not api_docs:
        print("❌ Failed to generate API documentation")
        return

    # Create markdown documentation
    print("📝 Creating markdown documentation...")
    markdown_doc = create_markdown_documentation(api_docs)

    # Save documentation
    print("💾 Saving documentation files...")
    save_documentation(api_docs, markdown_doc)

    print("✨ API Documentation Analysis Complete!")


if __name__ == "__main__":
    main()
