#!/usr/bin/env python3
"""
API Examples Generator
Creates comprehensive code examples for top API endpoints
"""

import json
from pathlib import Path
from typing import Dict


class APIExamplesGenerator:
    """Generate code examples for API endpoints"""

    def __init__(self):
        self.top_endpoints = [
            # Authentication
            "/auth/register",
            "/auth/login",
            "/auth/refresh",
            "/auth/me",
            # Cases
            "/cases",
            "/cases/{case_id}",
            "/cases/{case_id}/notes",
            "/cases/{case_id}/close",
            # Evidence
            "/evidence",
            "/evidence/{evidence_id}",
            "/evidence/upload/chunk",
            "/evidence/upload/complete",
            # Fraud Analysis
            "/fraud/analyze",
            "/fraud/analyze/batch",
            "/fraud/risk-score",
            # AI Services
            "/ai/embeddings",
            "/ai/semantic-search",
            "/ai/analyze",
            "/ai/insights",
            # Reporting
            "/reports/generate",
            "/reports/job/{job_id}",
            "/reports/download/{report_id}",
            # Admin
            "/admin/system/diagnostics",
            "/admin/database/stats",
            "/admin/cache/stats",
        ]

    def generate_curl_examples(self) -> dict[str, str]:
        """Generate curl command examples"""
        examples = {}

        base_url = "https://api.zenith.com"

        for endpoint in self.top_endpoints:
            method = self._get_method(endpoint)
            url = f"{base_url}{endpoint}"

            if method.upper() == "GET":
                example = f"""curl -X GET '{url}' \\
  -H 'Authorization: Bearer YOUR_API_TOKEN' \\
  -H 'Content-Type: application/json'"""
            elif method.upper() == "POST":
                example = f"""curl -X POST '{url}' \\
  -H 'Authorization: Bearer YOUR_API_TOKEN' \\
  -H 'Content-Type: application/json' \\
  -d '{{"key": "value"}}'"""
            elif method.upper() == "PUT":
                example = f"""curl -X PUT '{url}' \\
  -H 'Authorization: Bearer YOUR_API_TOKEN' \\
  -H 'Content-Type: application/json' \\
  -d '{{"key": "value"}}'"""
            elif method.upper() == "DELETE":
                example = f"""curl -X DELETE '{url}' \\
  -H 'Authorization: Bearer YOUR_API_TOKEN' \\
  -H 'Content-Type: application/json'"""
            else:
                example = f"curl -X {method} '{url}'"

            examples[endpoint] = example

        return examples

    def generate_python_examples(self) -> dict[str, str]:
        """Generate Python requests examples"""
        examples = {}

        base_url = "https://api.zenith.com"

        for endpoint in self.top_endpoints:
            method = self._get_method(endpoint)
            url = f"{base_url}{endpoint}"

            example = f"""import requests
import json

headers = {{
    "Authorization": "Bearer YOUR_API_TOKEN",
    "Content-Type": "application/json"
}}

{self._generate_python_request(method, url, "headers")}"""

            examples[endpoint] = example

        return examples

    def generate_javascript_examples(self) -> dict[str, str]:
        """Generate JavaScript fetch examples"""
        examples = {}

        base_url = "https://api.zenith.com"

        for endpoint in self.top_endpoints:
            method = self._get_method(endpoint)
            url = f"{base_url}{endpoint}"

            example = f"""const response = await fetch('{url}', {{
    method: '{method}',
    headers: {{
        'Authorization': 'Bearer YOUR_API_TOKEN',
        'Content-Type': 'application/json'
    }},
    {self._generate_js_body(method)}
}});

{self._generate_js_response(method)}"""

            examples[endpoint] = example

        return examples

    def _get_method(self, endpoint: str) -> str:
        """Determine HTTP method from endpoint"""
        if (
            endpoint in ["/auth/register", "/auth/login", "/auth/refresh"]
            or (endpoint.startswith("/cases") and "{case_id}" not in endpoint)
            or endpoint.startswith(
                ("/evidence/upload", "/fraud", "/ai", "/reports/generate")
            )
        ):
            return "POST"
        elif (
            "{case_id}" in endpoint
            or "{evidence_id}" in endpoint
            or "{job_id}" in endpoint
        ):
            return "GET" if "download" not in endpoint else "GET"
        elif endpoint.startswith("/admin/"):
            return "GET"
        else:
            return "GET"

    def _generate_python_request(self, method: str, url: str, headers: str) -> str:
        """Generate Python request code based on method"""
        if method.upper() == "GET":
            return f"""response = requests.get('{url}', headers=headers)
data = response.json()
print(data)"""
        elif method.upper() == "POST":
            return f"""data = {{
    "key": "value"
}}

response = requests.post('{url}', headers=headers, json=data)
result = response.json()
print(result)"""
        elif method.upper() == "PUT":
            return f"""data = {{
    "key": "value"
}}

response = requests.put('{url}', headers=headers, json=data)
result = response.json()
print(result)"""
        elif method.upper() == "DELETE":
            return f"""response = requests.delete('{url}', headers=headers)
print(f"Status: {{response.status_code}}")"""
        else:
            return f"response = requests.{method.lower()}('{url}', headers=headers)"

    def _generate_js_body(self, method: str) -> str:
        """Generate JavaScript body based on method"""
        if method.upper() in ["POST", "PUT"]:
            return "body: JSON.stringify({key: 'value'})"
        return ""

    def _generate_js_response(self, method: str) -> str:
        """Generate JavaScript response handling"""
        return """if (response.ok) {
    const data = await response.json();
    console.log('Success:', data);
} else {
    console.error('Error:', response.status, response.statusText);
}"""

    def generate_interactive_examples(self) -> str:
        """Generate interactive API documentation"""
        html = r"""<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>378x492 API Interactive Documentation</title>
    <style>
        body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
            line-height: 1.6;
            margin: 0;
            padding: 2rem;
            background-color: #f8f9fa;
        }

        .container {
            max-width: 1200px;
            margin: 0 auto;
            background: white;
            border-radius: 8px;
            box-shadow: 0 2px 10px rgba(0,0,0,0.1);
            overflow: hidden;
        }

        .header {
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            color: white;
            padding: 2rem;
            text-align: center;
        }

        .tabs {
            display: flex;
            background: #f1f3f4;
            border-bottom: 1px solid #d1d5da;
        }

        .tab {
            flex: 1;
            padding: 1rem;
            text-align: center;
            cursor: pointer;
            border: none;
            background: none;
            font-size: 1rem;
        }

        .tab.active {
            background: white;
            border-bottom: 2px solid #667eea;
        }

        .content {
            padding: 2rem;
        }

        .endpoint-list {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
            gap: 1rem;
        }

        .endpoint {
            border: 1px solid #e1e4e8;
            border-radius: 6px;
            padding: 1rem;
            background: #fafbfc;
        }

        .endpoint h3 {
            margin: 0 0 0.5rem 0;
            color: #0969da;
            font-family: 'SFMono-Regular', Consolas, monospace;
        }

        .method {
            display: inline-block;
            padding: 0.25rem 0.5rem;
            border-radius: 4px;
            font-weight: bold;
            font-size: 0.875rem;
            margin-right: 0.5rem;
        }

        .get { background: #28a745; color: white; }
        .post { background: #007bff; color: white; }
        .put { background: #ffc107; color: black; }
        .delete { background: #dc3545; color: white; }

        .code-block {
            background: #f6f8fa;
            border: 1px solid #e1e4e8;
            border-radius: 6px;
            padding: 1rem;
            margin: 1rem 0;
            font-family: 'SFMono-Regular', Consolas, monospace;
            font-size: 0.875rem;
            overflow-x: auto;
        }

        .try-it-btn {
            background: #667eea;
            color: white;
            border: none;
            padding: 0.5rem 1rem;
            border-radius: 4px;
            cursor: pointer;
            margin-top: 1rem;
        }

        .try-it-btn:hover {
            background: #5a67d8;
        }

        .response {
            margin-top: 1rem;
            padding: 1rem;
            background: #f0f6ff;
            border: 1px solid #c3d9ff;
            border-radius: 6px;
        }

        .hidden { display: none; }
    </style>
</head>
<body>
    <div class="container">
        <header class="header">
            <h1>378x492 API Interactive Documentation</h1>
            <p>Try our API endpoints directly in your browser</p>
        </header>

        <div class="tabs">
            <button class="tab active" onclick="showTab('endpoints')">Endpoints</button>
            <button class="tab" onclick="showTab('examples')">Examples</button>
        </div>

        <div class="content">
            <div id="endpoints" class="tab-content">
                <div class="endpoint-list">
                    <!-- Endpoints will be populated here -->
                </div>
            </div>

            <div id="examples" class="tab-content hidden">
                <h2>Code Examples</h2>
                <div id="code-examples">
                    <!-- Examples will be populated here -->
                </div>
            </div>
        </div>
    </div>

    <script>
        // API endpoints data
        const endpoints = [
            {path: "/auth/register", method: "POST", description: "Register new user"},
            {path: "/auth/login", method: "POST", description: "User login"},
            {path: "/auth/me", method: "GET", description: "Get current user info"},
            {path: "/cases", method: "POST", description: "Create new case"},
            {path: "/cases/{case_id}", method: "GET", description: "Get case details"},
            {path: "/fraud/analyze", method: "POST", description: "Analyze transaction for fraud"},
            {path: "/ai/embeddings", method: "POST", description: "Generate text embeddings"},
            {path: "/reports/generate", method: "POST", description: "Generate fraud report"}
        ];

        function showTab(tabName) {
            // Hide all tabs
            document.querySelectorAll('.tab-content').forEach(content => {
                content.classList.add('hidden');
            });

            // Remove active class from all tabs
            document.querySelectorAll('.tab').forEach(tab => {
                tab.classList.remove('active');
            });

            // Show selected tab
            document.getElementById(tabName).classList.remove('hidden');
            event.target.classList.add('active');
        }

        function populateEndpoints() {
            const container = document.querySelector('.endpoint-list');

            endpoints.forEach(endpoint => {
                const endpointDiv = document.createElement('div');
                endpointDiv.className = 'endpoint';
                endpointDiv.innerHTML = `
                    <h3>
                        <span class="method ${endpoint.method.toLowerCase()}">${endpoint.method}</span>
                        ${endpoint.path}
                    </h3>
                    <p>${endpoint.description}</p>
                    <button class="try-it-btn" onclick="tryEndpoint('${endpoint.path}', '${endpoint.method}')">Try It</button>
                    <div id="response-${endpoint.path.replace(/[{}\/]/g, '-')}" class="response hidden"></div>
                `;
                container.appendChild(endpointDiv);
            });
        }

        async function tryEndpoint(path, method) {
            const responseDiv = document.getElementById(`response-${path.replace(/[{}\/]/g, '-')}`);
            responseDiv.classList.remove('hidden');
            responseDiv.innerHTML = '<p>Testing endpoint...</p>';

            try {
                const response = await fetch(`https://api.zenith.com${path}`, {
                    method: method,
                    headers: {
                        'Authorization': 'Bearer YOUR_API_TOKEN',
                        'Content-Type': 'application/json'
                    }
                });

                const data = await response.json();
                responseDiv.innerHTML = `
                    <strong>Response (${response.status}):</strong>
                    <div class="code-block">${JSON.stringify(data, null, 2)}</div>
                `;
            } catch (error) {
                responseDiv.innerHTML = `
                    <strong>Error:</strong>
                    <div class="code-block">${error.message}</div>
                `;
            }
        }

        // Initialize
        populateEndpoints();
    </script>
</body>
</html>"""

        return html

    def save_examples(self):
        """Save all examples to files"""
        docs_dir = Path(__file__).parent.parent.parent / "docs" / "api" / "examples"
        docs_dir.mkdir(parents=True, exist_ok=True)

        # Generate examples
        curl_examples = self.generate_curl_examples()
        python_examples = self.generate_python_examples()
        js_examples = self.generate_javascript_examples()

        # Save curl examples
        with open(docs_dir / "curl_examples.md", "w") as f:
            f.write("# curl Examples\n\n")
            for endpoint, example in curl_examples.items():
                f.write(f"## {endpoint}\n\n```bash\n{example}\n```\n\n")

        # Save Python examples
        with open(docs_dir / "python_examples.md", "w") as f:
            f.write("# Python Examples\n\n")
            for endpoint, example in python_examples.items():
                f.write(f"## {endpoint}\n\n```python\n{example}\n```\n\n")

        # Save JavaScript examples
        with open(docs_dir / "javascript_examples.md", "w") as f:
            f.write("# JavaScript Examples\n\n")
            for endpoint, example in js_examples.items():
                f.write(f"## {endpoint}\n\n```javascript\n{example}\n```\n\n")

        # Save interactive documentation
        interactive_html = self.generate_interactive_examples()
        with open(docs_dir / "interactive.html", "w") as f:
            f.write(interactive_html)

        # Generate summary
        summary = {
            "total_endpoints": len(self.top_endpoints),
            "examples_generated": {
                "curl": len(curl_examples),
                "python": len(python_examples),
                "javascript": len(js_examples),
            },
            "files_created": [
                "curl_examples.md",
                "python_examples.md",
                "javascript_examples.md",
                "interactive.html",
            ],
        }

        with open(docs_dir / "examples_summary.json", "w") as f:
            json.dump(summary, f, indent=2)

        print("✅ API examples generated:")
        print(f"   - {len(curl_examples)} curl examples")
        print(f"   - {len(python_examples)} Python examples")
        print(f"   - {len(js_examples)} JavaScript examples")
        print("   - Interactive HTML documentation")
        print(f"   - Saved to: {docs_dir}")


def main():
    """Main examples generation process"""
    print("🔧 Generating API Examples...")

    generator = APIExamplesGenerator()
    generator.save_examples()

    print("✨ API Examples Generation Complete!")


if __name__ == "__main__":
    main()
