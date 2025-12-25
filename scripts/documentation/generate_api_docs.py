#!/usr/bin/env python3
"""
Automated API Documentation Generator
Extracts OpenAPI specs from FastAPI and generates comprehensive documentation
"""

import json
import os
import sys
from pathlib import Path
from typing import Dict, Any, List
import importlib.util

# Add backend to path for imports
backend_path = Path(__file__).parent.parent.parent / "backend"
sys.path.insert(0, str(backend_path))

def extract_openapi_specs() -> Dict[str, Any]:
    """Extract OpenAPI specifications from FastAPI app"""
    try:
        # Change to backend directory for imports
        original_cwd = os.getcwd()
        backend_dir = Path(__file__).parent.parent.parent / "backend"
        os.chdir(str(backend_dir))
        
        # Import FastAPI app
        import main as app_module
        app = app_module.app
        
        # Generate OpenAPI spec
        openapi_spec = app.openapi()
        
        # Restore original directory
        os.chdir(original_cwd)
        
        # Enhance with custom metadata
        openapi_spec["info"]["x-generated-by"] = "378x492 Auto-Doc Generator v1.0"
        openapi_spec["info"]["x-generation-timestamp"] = str(Path(__file__).stat().st_mtime)
        
        return openapi_spec
    except ImportError as e:
        print(f"Error importing FastAPI app: {e}")
        return {}
    except Exception as e:
        print(f"Error extracting OpenAPI specs: {e}")
        return {}

def organize_endpoints_by_tag(openapi_spec: Dict[str, Any]) -> Dict[str, List[Dict]]:
    """Organize endpoints by their tags for better navigation"""
    endpoints_by_tag = {}
    
    for path, methods in openapi_spec.get("paths", {}).items():
        for method, spec in methods.items():
            if method.lower() in ["get", "post", "put", "delete", "patch"]:
                tags = spec.get("tags", ["default"])
                for tag in tags:
                    if tag not in endpoints_by_tag:
                        endpoints_by_tag[tag] = []
                    endpoints_by_tag[tag].append({
                        "path": path,
                        "method": method.upper(),
                        "summary": spec.get("summary", ""),
                        "description": spec.get("description", ""),
                        "operationId": spec.get("operationId", ""),
                        "parameters": spec.get("parameters", []),
                        "responses": spec.get("responses", {})
                    })
    
    return endpoints_by_tag

def generate_endpoint_examples(endpoints_by_tag: Dict[str, List[Dict]]) -> Dict[str, List[Dict]]:
    """Generate code examples for endpoints"""
    examples = {}
    
    for tag, endpoints in endpoints_by_tag.items():
        examples[tag] = []
        for endpoint in endpoints:
            example = {
                "path": endpoint["path"],
                "method": endpoint["method"],
                "curl_example": generate_curl_example(endpoint),
                "python_example": generate_python_example(endpoint),
                "javascript_example": generate_javascript_example(endpoint)
            }
            examples[tag].append(example)
    
    return examples

def generate_curl_example(endpoint: Dict) -> str:
    """Generate curl command example"""
    method = endpoint["method"]
    path = endpoint["path"]
    
    base_url = "https://api.zenith.com"
    url = f"{base_url}{path}"
    
    curl_cmd = f"curl -X {method} '{url}'"
    
    if method in ["POST", "PUT", "PATCH"]:
        curl_cmd += " -H 'Content-Type: application/json'"
        curl_cmd += " -d '{\"key\": \"value\"}'"
    
    curl_cmd += " -H 'Authorization: Bearer YOUR_TOKEN'"
    
    return curl_cmd

def generate_python_example(endpoint: Dict) -> str:
    """Generate Python requests example"""
    method = endpoint["method"].lower()
    path = endpoint["path"]
    
    base_url = "https://api.zenith.com"
    url = f"{base_url}{path}"
    
    python_code = f"""import requests

headers = {{
    "Authorization": "Bearer YOUR_TOKEN",
    "Content-Type": "application/json"
}}

response = requests.{method}("{url}", headers=headers)
print(response.json())"""
    
    return python_code

def generate_javascript_example(endpoint: Dict) -> str:
    """Generate JavaScript fetch example"""
    method = endpoint["method"]
    path = endpoint["path"]
    
    base_url = "https://api.zenith.com"
    url = f"{base_url}{path}"
    
    js_code = f"""fetch('{url}', {{
    method: '{method}',
    headers: {{
        'Authorization': 'Bearer YOUR_TOKEN',
        'Content-Type': 'application/json'
    }}
}})
.then(response => response.json())
.then(data => console.log(data));"""
    
    return js_code

def create_markdown_documentation(openapi_spec: Dict[str, Any], 
                                 endpoints_by_tag: Dict[str, List[Dict]], 
                                 examples: Dict[str, List[Dict]]) -> str:
    """Generate comprehensive markdown documentation"""
    
    md = []
    
    # Header
    md.append("# Zenith Fraud Detection API Documentation")
    md.append("")
    md.append("## Overview")
    md.append("")
    md.append(f"**Version**: {openapi_spec.get('info', {}).get('version', '1.0.0')}")
    md.append(f"**Base URL**: `https://api.zenith.com`")
    md.append("")
    md.append("## Authentication")
    md.append("")
    md.append("All API requests require authentication using a Bearer token:")
    md.append("")
    md.append("```")
    md.append("Authorization: Bearer YOUR_API_TOKEN")
    md.append("```")
    md.append("")
    
    # Table of Contents
    md.append("## Table of Contents")
    md.append("")
    for tag in sorted(endpoints_by_tag.keys()):
        md.append(f"- [{tag.title()}](#{tag.lower().replace(' ', '-')})")
    md.append("")
    
    # Endpoints by tag
    for tag, endpoints in endpoints_by_tag.items():
        md.append(f"## {tag.title()}")
        md.append("")
        
        for endpoint in endpoints:
            path = endpoint["path"]
            method = endpoint["method"]
            summary = endpoint.get("summary", "")
            
            md.append(f"### {method} {path}")
            if summary:
                md.append(f"{summary}")
            md.append("")
            
            if endpoint.get("description"):
                md.append(endpoint["description"])
                md.append("")
            
            # Parameters
            if endpoint.get("parameters"):
                md.append("#### Parameters")
                md.append("")
                for param in endpoint["parameters"]:
                    param_name = param.get("name", "")
                    param_type = param.get("schema", {}).get("type", "")
                    required = "Required" if param.get("required", False) else "Optional"
                    param_desc = param.get("description", "")
                    
                    md.append(f"- `{param_name}` ({param_type}, {required}): {param_desc}")
                md.append("")
            
            # Responses
            if endpoint.get("responses"):
                md.append("#### Responses")
                md.append("")
                for status_code, response in endpoint["responses"].items():
                    status_desc = response.get("description", "")
                    md.append(f"**{status_code}**: {status_desc}")
                md.append("")
            
            # Examples
            example = next((e for e in examples.get(tag, []) if e["path"] == path), None)
            if example:
                md.append("#### Examples")
                md.append("")
                
                md.append("**cURL**")
                md.append("```bash")
                md.append(example["curl_example"])
                md.append("```")
                md.append("")
                
                md.append("**Python**")
                md.append("```python")
                md.append(example["python_example"])
                md.append("```")
                md.append("")
                
                md.append("**JavaScript**")
                md.append("```javascript")
                md.append(example["javascript_example"])
                md.append("```")
                md.append("")
    
    return "\n".join(md)

def save_documentation(openapi_spec: Dict[str, Any], 
                      endpoints_by_tag: Dict[str, List[Dict]], 
                      examples: Dict[str, List[Dict]], 
                      markdown_doc: str) -> None:
    """Save all documentation files"""
    
    docs_dir = Path(__file__).parent.parent.parent / "docs" / "api"
    docs_dir.mkdir(parents=True, exist_ok=True)
    
    # Save OpenAPI spec
    with open(docs_dir / "openapi.json", "w") as f:
        json.dump(openapi_spec, f, indent=2)
    
    # Save endpoints by tag
    with open(docs_dir / "endpoints_by_tag.json", "w") as f:
        json.dump(endpoints_by_tag, f, indent=2)
    
    # Save examples
    with open(docs_dir / "examples.json", "w") as f:
        json.dump(examples, f, indent=2)
    
    # Save markdown documentation
    with open(docs_dir / "README.md", "w") as f:
        f.write(markdown_doc)
    
    print(f"✅ Documentation saved to {docs_dir}")
    print(f"   - OpenAPI spec: {docs_dir / 'openapi.json'}")
    print(f"   - Markdown docs: {docs_dir / 'README.md'}")
    print(f"   - Endpoints organized: {len(endpoints_by_tag)} tags")
    print(f"   - Examples generated: {sum(len(ex) for ex in examples.values())} endpoints")

def main():
    """Main documentation generation process"""
    print("🚀 Starting API Documentation Generation...")
    
    # Extract OpenAPI specs
    print("📋 Extracting OpenAPI specifications...")
    openapi_spec = extract_openapi_specs()
    
    if not openapi_spec:
        print("❌ Failed to extract OpenAPI specs")
        sys.exit(1)
    
    # Organize endpoints
    print("🏷️  Organizing endpoints by tags...")
    endpoints_by_tag = organize_endpoints_by_tag(openapi_spec)
    
    # Generate examples
    print("💻 Generating code examples...")
    examples = generate_endpoint_examples(endpoints_by_tag)
    
    # Create markdown documentation
    print("📝 Creating markdown documentation...")
    markdown_doc = create_markdown_documentation(openapi_spec, endpoints_by_tag, examples)
    
    # Save documentation
    print("💾 Saving documentation files...")
    save_documentation(openapi_spec, endpoints_by_tag, examples, markdown_doc)
    
    print("✨ API Documentation Generation Complete!")

if __name__ == "__main__":
    main()