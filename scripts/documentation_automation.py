#!/usr/bin/env python3
"""
Automated Documentation Generation System
Generates comprehensive API documentation and system guides
"""

import os
import sys
import json
import inspect
from datetime import datetime
from pathlib import Path
from typing import Dict, List, Any, Optional, get_type_hints
import importlib.util

# Add backend to path
backend_path = Path(__file__).parent / "backend"
sys.path.insert(0, str(backend_path))

class DocumentationGenerator:
    """Automated documentation generation system"""

    def __init__(self):
        self.api_endpoints = []
        self.models = []
        self.services = []
        self.configurations = []

    def discover_api_endpoints(self) -> List[Dict[str, Any]]:
        """Discover API endpoints from FastAPI routers"""

        endpoints = []

        try:
            # Import the main FastAPI app
            from main import app

            # Extract routes from the app
            for route in app.routes:
                if hasattr(route, 'methods') and hasattr(route, 'path'):
                    endpoint = {
                        'path': route.path,
                        'methods': list(route.methods),
                        'name': getattr(route, 'name', ''),
                        'summary': getattr(route, 'summary', ''),
                        'description': getattr(route, 'description', ''),
                        'tags': getattr(route, 'tags', []),
                        'deprecated': getattr(route, 'deprecated', False)
                    }
                    endpoints.append(endpoint)

        except ImportError as e:
            print(f"⚠️ Could not import FastAPI app: {e}")
            # Fallback: try to discover routers manually
            endpoints = self._discover_routers_manually()

        return endpoints

    def _discover_routers_manually(self) -> List[Dict[str, Any]]:
        """Fallback method to discover API endpoints manually"""

        endpoints = []

        # Common router patterns
        router_files = [
            "backend/app/routers/auth.py",
            "backend/app/routers/users.py",
            "backend/app/routers/fraud.py",
            "backend/app/routers/cases.py",
            "backend/app/routers/analytics.py"
        ]

        for router_file in router_files:
            try:
                spec = importlib.util.spec_from_file_location("router", router_file)
                if spec and spec.loader:
                    module = importlib.util.module_from_spec(spec)
                    spec.loader.exec_module(module)

                    # Look for router variable
                    if hasattr(module, 'router'):
                        router = module.router
                        # Extract basic endpoint info
                        endpoints.append({
                            'path': f"/{router_file.split('/')[-1].replace('.py', '')}",
                            'methods': ['GET', 'POST', 'PUT', 'DELETE'],  # Assume all methods
                            'name': router_file.split('/')[-1].replace('.py', ''),
                            'summary': f"{router_file.split('/')[-1].replace('.py', '').title()} endpoints",
                            'description': f"API endpoints for {router_file.split('/')[-1].replace('.py', '')}",
                            'tags': [router_file.split('/')[-1].replace('.py', '')],
                            'deprecated': False
                        })

            except Exception as e:
                print(f"⚠️ Could not analyze {router_file}: {e}")

        return endpoints

    def discover_models(self) -> List[Dict[str, Any]]:
        """Discover database models"""

        models = []

        try:
            from core.database import Base
            from sqlalchemy import Column

            # Get all model classes
            for mapper in Base.registry.mappers:
                model_class = mapper.class_

                model_info = {
                    'name': model_class.__name__,
                    'table_name': getattr(model_class, '__tablename__', ''),
                    'description': model_class.__doc__ or '',
                    'fields': []
                }

                # Extract field information
                for column_name, column in mapper.columns.items():
                    field_info = {
                        'name': column_name,
                        'type': str(column.type),
                        'nullable': column.nullable,
                        'primary_key': column.primary_key,
                        'default': str(column.default) if column.default else None,
                        'foreign_keys': [str(fk) for fk in column.foreign_keys]
                    }
                    model_info['fields'].append(field_info)

                models.append(model_info)

        except Exception as e:
            print(f"⚠️ Could not discover models: {e}")

        return models

    def discover_services(self) -> List[Dict[str, Any]]:
        """Discover service classes and their methods"""

        services = []

        # Service files to analyze
        service_files = [
            "backend/app/services/auth_service.py",
            "backend/app/services/fraud_service.py",
            "backend/app/services/database_service.py"
        ]

        for service_file in service_files:
            try:
                spec = importlib.util.spec_from_file_location("service", service_file)
                if spec and spec.loader:
                    module = importlib.util.module_from_spec(spec)
                    spec.loader.exec_module(module)

                    # Find service classes
                    for name, obj in inspect.getmembers(module):
                        if (inspect.isclass(obj) and
                            name.endswith('Service') and
                            obj.__module__ == module.__name__):

                            service_info = {
                                'name': name,
                                'file': service_file,
                                'description': obj.__doc__ or '',
                                'methods': []
                            }

                            # Extract public methods
                            for method_name, method in inspect.getmembers(obj, predicate=inspect.isfunction):
                                if not method_name.startswith('_'):
                                    method_info = {
                                        'name': method_name,
                                        'signature': str(inspect.signature(method)),
                                        'doc': method.__doc__ or ''
                                    }
                                    service_info['methods'].append(method_info)

                            services.append(service_info)

            except Exception as e:
                print(f"⚠️ Could not analyze {service_file}: {e}")

        return services

    def discover_configurations(self) -> List[Dict[str, Any]]:
        """Discover configuration options"""

        configs = []

        # Environment variables from various config files
        config_files = [
            ".env.example",
            "backend/config/production.py"
        ]

        for config_file in config_files:
            if Path(config_file).exists():
                try:
                    with open(config_file, 'r') as f:
                        content = f.read()

                    config_info = {
                        'file': config_file,
                        'type': 'environment' if config_file.endswith('.env.example') else 'python',
                        'variables': []
                    }

                    # Extract environment variables
                    for line in content.split('\n'):
                        line = line.strip()
                        if line and not line.startswith('#') and '=' in line:
                            var_name = line.split('=')[0]
                            config_info['variables'].append({
                                'name': var_name,
                                'description': f"Configuration for {var_name.lower().replace('_', ' ')}"
                            })

                    configs.append(config_info)

                except Exception as e:
                    print(f"⚠️ Could not analyze {config_file}: {e}")

        return configs

    def generate_api_documentation(self) -> str:
        """Generate OpenAPI/Swagger-style API documentation"""

        endpoints = self.discover_api_endpoints()

        doc = f"""# Fraud Detection Platform API Documentation

**Generated on:** {datetime.now().isoformat()}
**Total Endpoints:** {len(endpoints)}

## API Endpoints

"""

        # Group endpoints by tags
        tagged_endpoints = {}
        for endpoint in endpoints:
            for tag in endpoint.get('tags', ['general']):
                if tag not in tagged_endpoints:
                    tagged_endpoints[tag] = []
                tagged_endpoints[tag].append(endpoint)

        for tag, eps in tagged_endpoints.items():
            doc += f"### {tag.title()} Endpoints\n\n"
            for ep in eps:
                methods = ', '.join(ep['methods'])
                doc += f"- **{methods}** `{ep['path']}`\n"
                if ep.get('summary'):
                    doc += f"  - {ep['summary']}\n"
                if ep.get('description'):
                    doc += f"  - {ep['description']}\n"
            doc += "\n"

        return doc

    def generate_model_documentation(self) -> str:
        """Generate database model documentation"""

        models = self.discover_models()

        doc = f"""# Database Models Documentation

**Generated on:** {datetime.now().isoformat()}
**Total Models:** {len(models)}

## Database Schema

"""

        for model in models:
            doc += f"### {model['name']}\n\n"
            doc += f"**Table:** `{model['table_name']}`\n\n"
            if model.get('description'):
                doc += f"{model['description']}\n\n"

            doc += "#### Fields\n\n"
            doc += "| Field | Type | Nullable | Primary Key | Foreign Keys |\n"
            doc += "|-------|------|----------|-------------|--------------|\n"

            for field in model['fields']:
                fk_str = ', '.join(field['foreign_keys']) if field['foreign_keys'] else ''
                doc += f"| {field['name']} | {field['type']} | {field['nullable']} | {field['primary_key']} | {fk_str} |\n"

            doc += "\n"

        return doc

    def generate_service_documentation(self) -> str:
        """Generate service layer documentation"""

        services = self.discover_services()

        doc = f"""# Service Layer Documentation

**Generated on:** {datetime.now().isoformat()}
**Total Services:** {len(services)}

## Services

"""

        for service in services:
            doc += f"### {service['name']}\n\n"
            doc += f"**File:** `{service['file']}`\n\n"
            if service.get('description'):
                doc += f"{service['description']}\n\n"

            doc += "#### Methods\n\n"
            for method in service['methods']:
                doc += f"##### `{method['name']}{method['signature']}`\n\n"
                if method.get('doc'):
                    doc += f"{method['doc']}\n\n"

        return doc

    def generate_configuration_documentation(self) -> str:
        """Generate configuration documentation"""

        configs = self.discover_configurations()

        doc = f"""# Configuration Documentation

**Generated on:** {datetime.now().isoformat()}

## Configuration Options

"""

        for config in configs:
            doc += f"### {config['file']}\n\n"
            doc += f"**Type:** {config['type']}\n\n"

            if config['variables']:
                doc += "#### Variables\n\n"
                for var in config['variables']:
                    doc += f"- **{var['name']}**: {var['description']}\n"
                doc += "\n"

        return doc

    def generate_complete_documentation(self) -> Dict[str, str]:
        """Generate complete documentation package"""

        print("📚 GENERATING AUTOMATED DOCUMENTATION")
        print("=" * 50)

        docs = {
            'api': self.generate_api_documentation(),
            'models': self.generate_model_documentation(),
            'services': self.generate_service_documentation(),
            'config': self.generate_configuration_documentation()
        }

        # Save individual documentation files
        doc_files = {
            'API_DOCUMENTATION.md': docs['api'],
            'MODEL_DOCUMENTATION.md': docs['models'],
            'SERVICE_DOCUMENTATION.md': docs['services'],
            'CONFIG_DOCUMENTATION.md': docs['config']
        }

        for filename, content in doc_files.items():
            filepath = Path(filename)
            with open(filepath, 'w') as f:
                f.write(content)
            print(f"✅ Generated {filename}")

        # Generate comprehensive README
        readme_content = f"""# Fraud Detection Platform Documentation

**Generated on:** {datetime.now().isoformat()}

## Overview

This documentation was automatically generated from the codebase and provides comprehensive information about the Fraud Detection Platform.

## Documentation Sections

### 🔌 API Documentation
Complete API endpoint reference with methods, paths, and descriptions.
- **File:** [API_DOCUMENTATION.md](API_DOCUMENTATION.md)
- **Endpoints:** {len(self.discover_api_endpoints())}

### 🗄️ Database Models
Database schema documentation with table structures and relationships.
- **File:** [MODEL_DOCUMENTATION.md](MODEL_DOCUMENTATION.md)
- **Models:** {len(self.discover_models())}

### ⚙️ Service Layer
Service classes and methods documentation.
- **File:** [SERVICE_DOCUMENTATION.md](SERVICE_DOCUMENTATION.md)
- **Services:** {len(self.discover_services())}

### 🔧 Configuration
Configuration options and environment variables.
- **File:** [CONFIG_DOCUMENTATION.md](CONFIG_DOCUMENTATION.md)

## Getting Started

1. **Setup:** Follow the installation guide in the main README
2. **Configuration:** Review [CONFIG_DOCUMENTATION.md](CONFIG_DOCUMENTATION.md)
3. **API Usage:** See [API_DOCUMENTATION.md](API_DOCUMENTATION.md)
4. **Database:** Check [MODEL_DOCUMENTATION.md](MODEL_DOCUMENTATION.md)

## Architecture

- **Backend:** FastAPI with SQLAlchemy
- **Database:** SQLite with SQLCipher encryption
- **Authentication:** JWT with role-based access control
- **Monitoring:** Prometheus metrics and alerting
- **Documentation:** Auto-generated from codebase

## Support

For technical support or questions about this documentation, please refer to the main project repository.

---
*This documentation is automatically generated and updated with each deployment.*
"""

        with open("AUTOMATED_DOCUMENTATION_README.md", 'w') as f:
            f.write(readme_content)

        print("✅ Generated AUTOMATED_DOCUMENTATION_README.md")

        # Create documentation index
        index_content = {
            "documentation_generated": datetime.now().isoformat(),
            "sections": {
                "api_endpoints": len(self.discover_api_endpoints()),
                "database_models": len(self.discover_models()),
                "services": len(self.discover_services()),
                "configuration_files": len(self.discover_configurations())
            },
            "files": list(doc_files.keys()) + ["AUTOMATED_DOCUMENTATION_README.md"]
        }

        with open("documentation_index.json", 'w') as f:
            json.dump(index_content, f, indent=2)

        print("✅ Generated documentation_index.json")

        print("\n📊 DOCUMENTATION SUMMARY")
        print(f"  API Endpoints: {index_content['sections']['api_endpoints']}")
        print(f"  Database Models: {index_content['sections']['database_models']}")
        print(f"  Services: {index_content['sections']['services']}")
        print(f"  Configuration Files: {index_content['sections']['configuration_files']}")
        print(f"  Documentation Files: {len(index_content['files'])}")

        return docs

def main():
    """Main documentation generation function"""

    generator = DocumentationGenerator()
    docs = generator.generate_complete_documentation()

    print("\n🎉 AUTOMATED DOCUMENTATION GENERATION COMPLETED!")
    print("📚 Documentation is ready for deployment and developer reference")

if __name__ == "__main__":
    main()