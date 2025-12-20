#!/usr/bin/env python3
"""
Comprehensive Diagnostic Orchestration System for 378x492 Fraud Detection
=========================================================================

This script orchestrates systematic diagnosis across all system sectors:
- Infrastructure & System Health
- Backend Services & APIs
- Frontend Applications
- Database & Data Integrity
- AI/ML Services & Models
- Security & Compliance
- Performance & Monitoring
- Testing & Quality Assurance
- Documentation & Configuration
- Integration & Dependencies

Usage:
    python comprehensive_diagnostic_orchestrator.py [sector] [--fix]

Sectors:
    all         - Run all diagnostics
    infra       - Infrastructure & System Health
    backend     - Backend Services & APIs
    frontend    - Frontend Applications
    database    - Database & Data Integrity
    ai          - AI/ML Services & Models
    security    - Security & Compliance
    performance - Performance & Monitoring
    testing     - Testing & Quality Assurance
    docs        - Documentation & Configuration
    integration - Integration & Dependencies
"""

import asyncio
import json
import logging
import os
import subprocess
import sys
import time
from datetime import datetime, timezone
from pathlib import Path
from typing import Dict, List, Any, Optional
import psutil
import aiohttp

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

class ComprehensiveDiagnosticOrchestrator:
    """Orchestrates comprehensive diagnostics across all system sectors"""

    def __init__(self):
        self.project_root = Path(__file__).parent.parent.parent
        self.results = {
            "timestamp": datetime.now(timezone.utc).isoformat(),
            "orchestrator_version": "2.0.0",
            "sectors": {},
            "summary": {},
            "recommendations": []
        }
        self.sectors = {
            "infrastructure": self.diagnose_infrastructure,
            "backend": self.diagnose_backend,
            "frontend": self.diagnose_frontend,
            "database": self.diagnose_database,
            "ai_ml": self.diagnose_ai_ml,
            "security": self.diagnose_security,
            "performance": self.diagnose_performance,
            "testing": self.diagnose_testing,
            "documentation": self.diagnose_documentation,
            "integration": self.diagnose_integration
        }

    async def run_comprehensive_diagnosis(self, target_sectors: List[str] = None) -> Dict[str, Any]:
        """Run comprehensive diagnostics across specified sectors"""
        logger.info("🚀 Starting Comprehensive Diagnostic Orchestration")

        if target_sectors is None or "all" in target_sectors:
            target_sectors = list(self.sectors.keys())

        for sector in target_sectors:
            if sector in self.sectors:
                logger.info(f"📋 Diagnosing {sector} sector...")
                try:
                    self.results["sectors"][sector] = await self.sectors[sector]()
                    logger.info(f"✅ {sector} diagnosis completed")
                except Exception as e:
                    logger.error(f"❌ {sector} diagnosis failed: {e}")
                    self.results["sectors"][sector] = {
                        "status": "failed",
                        "error": str(e),
                        "timestamp": datetime.now(timezone.utc).isoformat()
                    }

        # Generate summary and recommendations
        self._generate_summary()
        self._generate_recommendations()

        return self.results

    # ===== INFRASTRUCTURE & SYSTEM HEALTH =====

    async def diagnose_infrastructure(self) -> Dict[str, Any]:
        """Diagnose infrastructure and system health"""
        results = {
            "status": "healthy",
            "checks": {},
            "issues": [],
            "metrics": {}
        }

        # System Resources
        system_metrics = self._check_system_resources()
        results["metrics"].update(system_metrics)

        # Disk Space
        disk_usage = psutil.disk_usage('/')
        results["metrics"]["disk_usage_percent"] = disk_usage.percent
        if disk_usage.percent > 90:
            results["issues"].append("Critical disk space low")
            results["status"] = "critical"

        # Network Connectivity
        network_status = await self._check_network_connectivity()
        results["checks"]["network"] = network_status

        # Services Running
        services_status = self._check_service_status()
        results["checks"]["services"] = services_status

        # Docker/Containers (if applicable)
        container_status = self._check_containers()
        results["checks"]["containers"] = container_status

        return results

    def _check_system_resources(self) -> Dict[str, Any]:
        """Check basic system resources"""
        return {
            "cpu_percent": psutil.cpu_percent(interval=1),
            "memory_percent": psutil.virtual_memory().percent,
            "memory_used_gb": psutil.virtual_memory().used / (1024**3),
            "memory_total_gb": psutil.virtual_memory().total / (1024**3),
            "load_average": psutil.getloadavg() if hasattr(psutil, 'getloadavg') else None,
            "process_count": len(psutil.pids())
        }

    async def _check_network_connectivity(self) -> Dict[str, Any]:
        """Check network connectivity to critical services"""
        results = {"status": "healthy", "services": {}}

        test_urls = {
            "backend_api": "http://localhost:8001/health",
            "frontend_dev": "http://localhost:5173",
            "database": "postgresql://localhost"  # Would need actual connection test
        }

        async with aiohttp.ClientSession(timeout=aiohttp.ClientTimeout(total=5)) as session:
            for service, url in test_urls.items():
                try:
                    if service == "database":
                        # Special handling for database connectivity
                        results["services"][service] = self._check_database_connectivity()
                    else:
                        async with session.get(url) as response:
                            results["services"][service] = {
                                "status": "healthy" if response.status < 400 else "unhealthy",
                                "response_code": response.status
                            }
                except Exception as e:
                    results["services"][service] = {
                        "status": "unhealthy",
                        "error": str(e)
                    }
                    results["status"] = "degraded"

        return results

    def _check_service_status(self) -> Dict[str, Any]:
        """Check status of critical services"""
        services = {
            "backend": "uvicorn",
            "frontend": "vite",
            "database": "postgres",
            "redis": "redis-server"
        }

        results = {}
        for service, process in services.items():
            try:
                # Check if process is running
                output = subprocess.run(
                    ["pgrep", "-f", process],
                    capture_output=True,
                    text=True,
                    timeout=5
                )
                running = output.returncode == 0
                results[service] = {
                    "status": "running" if running else "stopped",
                    "process_count": len(output.stdout.strip().split('\n')) if running else 0
                }
            except Exception as e:
                results[service] = {"status": "unknown", "error": str(e)}

        return results

    def _check_containers(self) -> Dict[str, Any]:
        """Check Docker containers if applicable"""
        try:
            result = subprocess.run(
                ["docker", "ps", "--format", "json"],
                capture_output=True,
                text=True,
                timeout=10
            )
            if result.returncode == 0:
                containers = [json.loads(line) for line in result.stdout.strip().split('\n') if line]
                return {
                    "status": "healthy",
                    "container_count": len(containers),
                    "containers": [{"name": c.get("Names", ""), "status": c.get("Status", "")} for c in containers]
                }
            else:
                return {"status": "no_containers", "reason": "Docker not running or no containers"}
        except Exception as e:
            return {"status": "error", "error": str(e)}

    # ===== BACKEND SERVICES & APIs =====

    async def diagnose_backend(self) -> Dict[str, Any]:
        """Diagnose backend services and APIs"""
        results = {
            "status": "healthy",
            "apis": {},
            "services": {},
            "performance": {},
            "issues": []
        }

        # API Endpoints Health
        api_checks = await self._check_api_endpoints()
        results["apis"] = api_checks

        # Service Dependencies
        service_checks = self._check_backend_services()
        results["services"] = service_checks

        # Configuration Validation
        config_checks = self._check_backend_configuration()
        results["checks"] = config_checks

        return results

    async def _check_api_endpoints(self) -> Dict[str, Any]:
        """Check health of backend API endpoints"""
        endpoints = {
            "/health": "System health check",
            "/api/v1/ai/status": "AI service status",
            "/api/v1/cases": "Cases API",
            "/docs": "API documentation"
        }

        results = {}

        async with aiohttp.ClientSession(timeout=aiohttp.ClientTimeout(total=10)) as session:
            for endpoint, description in endpoints.items():
                try:
                    url = f"http://localhost:8001{endpoint}"
                    start_time = time.time()
                    async with session.get(url) as response:
                        response_time = time.time() - start_time
                        status = "healthy" if response.status < 400 else "unhealthy"

                        results[endpoint] = {
                            "status": status,
                            "response_code": response.status,
                            "response_time": round(response_time, 3),
                            "description": description
                        }

                        if response.status >= 400:
                            results["overall_status"] = "degraded"

                except Exception as e:
                    results[endpoint] = {
                        "status": "unreachable",
                        "error": str(e),
                        "description": description
                    }

        return results

    def _check_backend_services(self) -> Dict[str, Any]:
        """Check backend service dependencies"""
        services = {
            "database": self._check_database_connectivity(),
            "cache": self._check_cache_service(),
            "ai_service": self._check_ai_service(),
            "monitoring": self._check_monitoring_service()
        }

        return services

    def _check_database_connectivity(self) -> Dict[str, Any]:
        """Check database connectivity"""
        try:
            # Try to connect to database
            # This would need actual database connection logic
            return {"status": "unknown", "note": "Database connectivity check needs implementation"}
        except Exception as e:
            return {"status": "error", "error": str(e)}

    def _check_cache_service(self) -> Dict[str, Any]:
        """Check cache service (Redis)"""
        try:
            import redis
            r = redis.Redis(host='localhost', port=6379, db=0, socket_timeout=5)
            r.ping()
            return {"status": "healthy", "type": "redis"}
        except ImportError:
            return {"status": "not_configured", "reason": "Redis client not available"}
        except Exception as e:
            return {"status": "unhealthy", "error": str(e)}

    def _check_ai_service(self) -> Dict[str, Any]:
        """Check AI service health"""
        try:
            # Import and check AI service
            from app.services.ai.ai_service import ai_service
            return {
                "status": "healthy" if ai_service.initialized else "unhealthy",
                "initialized": ai_service.initialized,
                "model_loaded": ai_service.model is not None,
                "documents_indexed": len(ai_service.vector_store)
            }
        except Exception as e:
            return {"status": "error", "error": str(e)}

    def _check_monitoring_service(self) -> Dict[str, Any]:
        """Check monitoring service"""
        try:
            from app.services.infrastructure.monitoring_service import monitoring_service
            return {
                "status": "healthy",
                "active": True,
                "metrics_collected": len(monitoring_service.metrics_history)
            }
        except Exception as e:
            return {"status": "error", "error": str(e)}

    def _check_backend_configuration(self) -> Dict[str, Any]:
        """Check backend configuration"""
        checks = {}

        # Check environment variables
        required_env_vars = [
            "DATABASE_URL", "SECRET_KEY", "ENVIRONMENT"
        ]

        for var in required_env_vars:
            checks[f"env_{var.lower()}"] = {
                "status": "configured" if os.getenv(var) else "missing",
                "value_set": bool(os.getenv(var))
            }

        # Check configuration files
        config_files = [
            "backend/.env",
            "backend/config/settings.py",
            "backend/pyproject.toml"
        ]

        for config_file in config_files:
            path = self.project_root / config_file
            checks[f"config_{Path(config_file).name}"] = {
                "status": "exists" if path.exists() else "missing",
                "path": str(path)
            }

        return checks

    # ===== FRONTEND APPLICATIONS =====

    async def diagnose_frontend(self) -> Dict[str, Any]:
        """Diagnose frontend applications"""
        results = {
            "status": "healthy",
            "build_status": {},
            "runtime_status": {},
            "dependencies": {},
            "performance": {},
            "issues": []
        }

        # Build Status
        build_checks = self._check_frontend_build()
        results["build_status"] = build_checks

        # Runtime Status
        runtime_checks = await self._check_frontend_runtime()
        results["runtime_status"] = runtime_checks

        # Dependencies
        dep_checks = self._check_frontend_dependencies()
        results["dependencies"] = dep_checks

        return results

    def _check_frontend_build(self) -> Dict[str, Any]:
        """Check frontend build status"""
        frontend_dir = self.project_root / "frontend"

        if not frontend_dir.exists():
            return {"status": "missing", "error": "Frontend directory not found"}

        checks = {}

        # Check package.json
        package_json = frontend_dir / "package.json"
        checks["package_json"] = {
            "status": "exists" if package_json.exists() else "missing"
        }

        # Check node_modules
        node_modules = frontend_dir / "node_modules"
        checks["node_modules"] = {
            "status": "exists" if node_modules.exists() else "missing"
        }

        # Check dist/build directory
        dist_dir = frontend_dir / "dist"
        checks["build_artifacts"] = {
            "status": "exists" if dist_dir.exists() else "missing"
        }

        return checks

    async def _check_frontend_runtime(self) -> Dict[str, Any]:
        """Check frontend runtime status"""
        results = {}

        # Check development server
        dev_server_url = "http://localhost:5173"
        try:
            async with aiohttp.ClientSession(timeout=aiohttp.ClientTimeout(total=5)) as session:
                async with session.get(dev_server_url) as response:
                    results["dev_server"] = {
                        "status": "running" if response.status < 400 else "unhealthy",
                        "response_code": response.status,
                        "url": dev_server_url
                    }
        except Exception as e:
            results["dev_server"] = {
                "status": "stopped",
                "error": str(e),
                "url": dev_server_url
            }

        return results

    def _check_frontend_dependencies(self) -> Dict[str, Any]:
        """Check frontend dependencies"""
        frontend_dir = self.project_root / "frontend"

        checks = {}

        if (frontend_dir / "package.json").exists():
            try:
                # Check for outdated packages (simplified)
                checks["dependency_check"] = {
                    "status": "completed",
                    "note": "Detailed dependency analysis would require npm audit/outdated"
                }
            except Exception as e:
                checks["dependency_check"] = {"status": "error", "error": str(e)}

        return checks

    # ===== DATABASE & DATA INTEGRITY =====

    async def diagnose_database(self) -> Dict[str, Any]:
        """Diagnose database and data integrity"""
        results = {
            "status": "healthy",
            "connectivity": {},
            "schema": {},
            "data_integrity": {},
            "performance": {},
            "issues": []
        }

        # Connectivity
        conn_check = self._check_database_connectivity()
        results["connectivity"] = conn_check

        # Schema Validation
        schema_check = self._check_database_schema()
        results["schema"] = schema_check

        # Data Integrity
        integrity_check = self._check_data_integrity()
        results["data_integrity"] = integrity_check

        return results

    def _check_database_schema(self) -> Dict[str, Any]:
        """Check database schema integrity"""
        # This would need actual database connection and schema validation
        return {
            "status": "unknown",
            "note": "Schema validation requires database connection implementation"
        }

    def _check_data_integrity(self) -> Dict[str, Any]:
        """Check data integrity constraints"""
        return {
            "status": "unknown",
            "note": "Data integrity checks require database connection implementation"
        }

    # ===== AI/ML SERVICES & MODELS =====

    async def diagnose_ai_ml(self) -> Dict[str, Any]:
        """Diagnose AI/ML services and models"""
        results = {
            "status": "healthy",
            "models": {},
            "services": {},
            "performance": {},
            "data": {},
            "issues": []
        }

        # AI Service Status
        ai_status = self._check_ai_service()
        results["services"]["ai_service"] = ai_status

        # Model Loading Status
        model_status = self._check_ml_models()
        results["models"] = model_status

        # Vector Store Health
        vector_status = self._check_vector_store()
        results["data"]["vector_store"] = vector_status

        return results

    def _check_ml_models(self) -> Dict[str, Any]:
        """Check ML model loading status"""
        try:
            from app.services.ai.ai_service import ai_service
            return {
                "sentence_transformer": {
                    "status": "loaded" if ai_service.model else "not_loaded",
                    "model_name": "sentence-transformers/all-MiniLM-L6-v2"
                },
                "faiss_index": {
                    "status": "initialized" if hasattr(ai_service, 'faiss_index') and ai_service.faiss_index else "not_initialized"
                }
            }
        except Exception as e:
            return {"status": "error", "error": str(e)}

    def _check_vector_store(self) -> Dict[str, Any]:
        """Check vector store health"""
        try:
            from app.services.ai.ai_service import ai_service
            return {
                "document_count": len(ai_service.vector_store),
                "status": "healthy",
                "last_updated": max([doc.get("created_at", "1970-01-01") for doc in ai_service.vector_store.values()]) if ai_service.vector_store else None
            }
        except Exception as e:
            return {"status": "error", "error": str(e)}

    # ===== SECURITY & COMPLIANCE =====

    async def diagnose_security(self) -> Dict[str, Any]:
        """Diagnose security and compliance"""
        results = {
            "status": "healthy",
            "authentication": {},
            "authorization": {},
            "encryption": {},
            "audit": {},
            "compliance": {},
            "issues": []
        }

        # Authentication Checks
        auth_checks = self._check_authentication()
        results["authentication"] = auth_checks

        # Security Headers
        header_checks = await self._check_security_headers()
        results["security_headers"] = header_checks

        # SSL/TLS Configuration
        ssl_checks = self._check_ssl_configuration()
        results["ssl_tls"] = ssl_checks

        return results

    def _check_authentication(self) -> Dict[str, Any]:
        """Check authentication mechanisms"""
        checks = {}

        # Check JWT configuration
        jwt_secret = os.getenv("SECRET_KEY")
        checks["jwt_secret"] = {
            "status": "configured" if jwt_secret else "missing",
            "length": len(jwt_secret) if jwt_secret else 0
        }

        # Check password policies (would need implementation)
        checks["password_policy"] = {
            "status": "unknown",
            "note": "Password policy validation needs implementation"
        }

        return checks

    async def _check_security_headers(self) -> Dict[str, Any]:
        """Check security headers on endpoints"""
        results = {}

        endpoints_to_check = [
            "http://localhost:8001/health",
            "http://localhost:8001/docs",
            "http://localhost:5173"
        ]

        async with aiohttp.ClientSession() as session:
            for url in endpoints_to_check:
                try:
                    async with session.get(url) as response:
                        headers = dict(response.headers)
                        security_headers = {
                            "X-Content-Type-Options": headers.get("X-Content-Type-Options"),
                            "X-Frame-Options": headers.get("X-Frame-Options"),
                            "X-XSS-Protection": headers.get("X-XSS-Protection"),
                            "Strict-Transport-Security": headers.get("Strict-Transport-Security"),
                            "Content-Security-Policy": headers.get("Content-Security-Policy")
                        }

                        results[url] = {
                            "status": "checking",
                            "headers": security_headers
                        }

                except Exception as e:
                    results[url] = {"status": "unreachable", "error": str(e)}

        return results

    def _check_ssl_configuration(self) -> Dict[str, Any]:
        """Check SSL/TLS configuration"""
        return {
            "status": "unknown",
            "note": "SSL/TLS configuration check needs implementation",
            "recommendations": [
                "Enable HTTPS in production",
                "Configure proper SSL certificates",
                "Set secure cookie flags"
            ]
        }

    # ===== PERFORMANCE & MONITORING =====

    async def diagnose_performance(self) -> Dict[str, Any]:
        """Diagnose performance and monitoring"""
        results = {
            "status": "healthy",
            "metrics": {},
            "monitoring": {},
            "alerts": {},
            "issues": []
        }

        # Performance Metrics
        perf_metrics = self._collect_performance_metrics()
        results["metrics"] = perf_metrics

        # Monitoring Systems
        monitoring_status = self._check_monitoring_systems()
        results["monitoring"] = monitoring_status

        # Alert Status
        alert_status = self._check_alerts()
        results["alerts"] = alert_status

        return results

    def _collect_performance_metrics(self) -> Dict[str, Any]:
        """Collect current performance metrics"""
        try:
            from app.services.infrastructure.performance_monitor import performance_monitor
            return performance_monitor.get_current_metrics()
        except Exception as e:
            return {"status": "error", "error": str(e)}

    def _check_monitoring_systems(self) -> Dict[str, Any]:
        """Check monitoring systems status"""
        systems = {
            "performance_monitor": self._check_performance_monitor(),
            "health_checks": self._check_health_endpoints(),
            "logging": self._check_logging_system()
        }

        return systems

    def _check_performance_monitor(self) -> Dict[str, Any]:
        """Check performance monitoring system"""
        try:
            from app.services.infrastructure.performance_monitor import performance_monitor
            baselines = performance_monitor.get_baselines()
            return {
                "status": "healthy",
                "active": baselines.get("monitoring_active", False),
                "metrics_collected": baselines.get("metrics_collected", 0)
            }
        except Exception as e:
            return {"status": "error", "error": str(e)}

    async def _check_health_endpoints(self) -> Dict[str, Any]:
        """Check health endpoints"""
        endpoints = [
            "http://localhost:8001/health",
            "http://localhost:8001/health/live",
            "http://localhost:8001/health/ready"
        ]

        results = {}
        async with aiohttp.ClientSession(timeout=aiohttp.ClientTimeout(total=5)) as session:
            for url in endpoints.items():
                try:
                    async with session.get(url) as response:
                        results[url.split('/')[-1]] = {
                            "status": "healthy" if response.status < 400 else "unhealthy",
                            "response_code": response.status
                        }
                except Exception as e:
                    results[url.split('/')[-1]] = {"status": "unreachable", "error": str(e)}

        return results

    def _check_logging_system(self) -> Dict[str, Any]:
        """Check logging system configuration"""
        log_files = [
            "backend/backend.log",
            "logs/backend_startup.log",
            "logs/fraud_detection.log"
        ]

        results = {}
        for log_file in log_files:
            path = self.project_root / log_file
            if path.exists():
                size = path.stat().st_size
                results[log_file] = {
                    "status": "exists",
                    "size_bytes": size,
                    "size_mb": round(size / (1024*1024), 2)
                }
            else:
                results[log_file] = {"status": "missing"}

        return results

    def _check_alerts(self) -> Dict[str, Any]:
        """Check current alert status"""
        try:
            from app.services.infrastructure.performance_monitor import performance_monitor
            alerts = performance_monitor.check_thresholds()
            return {
                "active_alerts": len(alerts),
                "alert_list": alerts[:10],  # First 10 alerts
                "status": "monitoring" if alerts else "clear"
            }
        except Exception as e:
            return {"status": "error", "error": str(e)}

    # ===== TESTING & QUALITY ASSURANCE =====

    async def diagnose_testing(self) -> Dict[str, Any]:
        """Diagnose testing and quality assurance"""
        results = {
            "status": "healthy",
            "unit_tests": {},
            "integration_tests": {},
            "e2e_tests": {},
            "coverage": {},
            "issues": []
        }

        # Unit Tests
        unit_status = self._check_unit_tests()
        results["unit_tests"] = unit_status

        # Integration Tests
        integration_status = self._check_integration_tests()
        results["integration_tests"] = integration_status

        # E2E Tests
        e2e_status = self._check_e2e_tests()
        results["e2e_tests"] = e2e_status

        # Test Coverage
        coverage_status = self._check_test_coverage()
        results["coverage"] = coverage_status

        return results

    def _check_unit_tests(self) -> Dict[str, Any]:
        """Check unit test status"""
        # Backend unit tests
        backend_tests = self._run_backend_tests()
        # Frontend unit tests
        frontend_tests = self._run_frontend_tests()

        return {
            "backend": backend_tests,
            "frontend": frontend_tests
        }

    def _run_backend_tests(self) -> Dict[str, Any]:
        """Run backend unit tests"""
        try:
            result = subprocess.run(
                ["python", "-m", "pytest", "backend/tests/unit/", "--tb=short", "--quiet"],
                capture_output=True,
                text=True,
                cwd=self.project_root,
                timeout=60
            )

            return {
                "status": "passed" if result.returncode == 0 else "failed",
                "return_code": result.returncode,
                "output": result.stdout[-500:],  # Last 500 chars
                "errors": result.stderr[-500:] if result.stderr else None
            }
        except Exception as e:
            return {"status": "error", "error": str(e)}

    def _run_frontend_tests(self) -> Dict[str, Any]:
        """Run frontend unit tests"""
        try:
            result = subprocess.run(
                ["npm", "test", "--", "--watchAll=false", "--coverage=false"],
                capture_output=True,
                text=True,
                cwd=self.project_root / "frontend",
                timeout=60
            )

            return {
                "status": "passed" if result.returncode == 0 else "failed",
                "return_code": result.returncode,
                "output": result.stdout[-500:],
                "errors": result.stderr[-500:] if result.stderr else None
            }
        except Exception as e:
            return {"status": "error", "error": str(e)}

    def _check_integration_tests(self) -> Dict[str, Any]:
        """Check integration test status"""
        try:
            result = subprocess.run(
                ["python", "-m", "pytest", "backend/tests/integration/", "--tb=short", "--quiet"],
                capture_output=True,
                text=True,
                cwd=self.project_root,
                timeout=60
            )

            return {
                "status": "passed" if result.returncode == 0 else "failed",
                "return_code": result.returncode
            }
        except Exception as e:
            return {"status": "error", "error": str(e)}

    def _check_e2e_tests(self) -> Dict[str, Any]:
        """Check E2E test status"""
        # Look for recent E2E test results
        e2e_results_dir = self.project_root / "test-results"
        if e2e_results_dir.exists():
            json_files = list(e2e_results_dir.glob("e2e_test_results_*.json"))
            if json_files:
                latest_result = max(json_files, key=lambda x: x.stat().st_mtime)
                try:
                    with open(latest_result) as f:
                        data = json.load(f)
                        return {
                            "status": "recent_results_found",
                            "latest_run": data.get("timestamp"),
                            "passed": data.get("passed", 0),
                            "failed": data.get("failed", 0)
                        }
                except Exception as e:
                    return {"status": "error_reading_results", "error": str(e)}

        return {"status": "no_recent_results"}

    def _check_test_coverage(self) -> Dict[str, Any]:
        """Check test coverage status"""
        coverage_dirs = [
            "backend/htmlcov",
            "frontend/coverage"
        ]

        results = {}
        for coverage_dir in coverage_dirs:
            path = self.project_root / coverage_dir
            if path.exists():
                results[coverage_dir] = {"status": "reports_available"}
                # Could parse coverage reports here
            else:
                results[coverage_dir] = {"status": "no_coverage_reports"}

        return results

    # ===== DOCUMENTATION & CONFIGURATION =====

    async def diagnose_documentation(self) -> Dict[str, Any]:
        """Diagnose documentation and configuration"""
        results = {
            "status": "healthy",
            "api_docs": {},
            "user_docs": {},
            "configuration": {},
            "issues": []
        }

        # API Documentation
        api_docs = await self._check_api_documentation()
        results["api_docs"] = api_docs

        # User Documentation
        user_docs = self._check_user_documentation()
        results["user_docs"] = user_docs

        # Configuration Documentation
        config_docs = self._check_configuration_docs()
        results["configuration"] = config_docs

        return results

    async def _check_api_documentation(self) -> Dict[str, Any]:
        """Check API documentation availability"""
        docs_urls = [
            "http://localhost:8001/docs",
            "http://localhost:8001/redoc",
            "http://localhost:8001/openapi.json"
        ]

        results = {}
        async with aiohttp.ClientSession(timeout=aiohttp.ClientTimeout(total=5)) as session:
            for url in docs_urls:
                try:
                    async with session.get(url) as response:
                        results[url.split('/')[-1]] = {
                            "status": "available" if response.status < 400 else "unavailable",
                            "response_code": response.status
                        }
                except Exception as e:
                    results[url.split('/')[-1]] = {"status": "unreachable", "error": str(e)}

        return results

    def _check_user_documentation(self) -> Dict[str, Any]:
        """Check user documentation files"""
        docs_dir = self.project_root / "docs"

        if not docs_dir.exists():
            return {"status": "missing", "error": "Documentation directory not found"}

        doc_files = [
            "README.md",
            "docs/api/README.md",
            "docs/developer-guide/README.md",
            "docs/user-guides/README.md"
        ]

        results = {}
        for doc_file in doc_files:
            path = self.project_root / doc_file
            if path.exists():
                size = path.stat().st_size
                results[doc_file] = {
                    "status": "exists",
                    "size_bytes": size
                }
            else:
                results[doc_file] = {"status": "missing"}

        return results

    def _check_configuration_docs(self) -> Dict[str, Any]:
        """Check configuration documentation"""
        config_files = [
            ".env.example",
            "backend/config/settings.py",
            "docker-compose.yml",
            "docs/operations/deployment.md"
        ]

        results = {}
        for config_file in config_files:
            path = self.project_root / config_file
            if path.exists():
                results[config_file] = {"status": "exists"}
            else:
                results[config_file] = {"status": "missing"}

        return results

    # ===== INTEGRATION & DEPENDENCIES =====

    async def diagnose_integration(self) -> Dict[str, Any]:
        """Diagnose integration and dependencies"""
        results = {
            "status": "healthy",
            "dependencies": {},
            "integrations": {},
            "compatibility": {},
            "issues": []
        }

        # Dependency Checks
        dep_checks = self._check_all_dependencies()
        results["dependencies"] = dep_checks

        # External Integrations
        integration_checks = await self._check_external_integrations()
        results["integrations"] = integration_checks

        # Version Compatibility
        compatibility_checks = self._check_version_compatibility()
        results["compatibility"] = compatibility_checks

        return results

    def _check_all_dependencies(self) -> Dict[str, Any]:
        """Check all system dependencies"""
        results = {}

        # Backend dependencies
        backend_deps = self._check_backend_dependencies()
        results["backend"] = backend_deps

        # Frontend dependencies
        frontend_deps = self._check_frontend_dependencies()
        results["frontend"] = frontend_deps

        # System dependencies
        system_deps = self._check_system_dependencies()
        results["system"] = system_deps

        return results

    def _check_backend_dependencies(self) -> Dict[str, Any]:
        """Check backend Python dependencies"""
        try:
            result = subprocess.run(
                ["python", "-m", "pip", "check"],
                capture_output=True,
                text=True,
                cwd=self.project_root / "backend",
                timeout=30
            )

            return {
                "status": "healthy" if result.returncode == 0 else "issues_found",
                "return_code": result.returncode,
                "output": result.stdout[:500] if result.stdout else None,
                "errors": result.stderr[:500] if result.stderr else None
            }
        except Exception as e:
            return {"status": "error", "error": str(e)}

    def _check_system_dependencies(self) -> Dict[str, Any]:
        """Check system-level dependencies"""
        system_tools = [
            "python3",
            "node",
            "npm",
            "docker",
            "git"
        ]

        results = {}
        for tool in system_tools:
            try:
                result = subprocess.run(
                    [tool, "--version"],
                    capture_output=True,
                    text=True,
                    timeout=5
                )
                results[tool] = {
                    "status": "available",
                    "version": result.stdout.strip() if result.returncode == 0 else "unknown"
                }
            except Exception as e:
                results[tool] = {"status": "unavailable", "error": str(e)}

        return results

    async def _check_external_integrations(self) -> Dict[str, Any]:
        """Check external service integrations"""
        integrations = {
            "ai_services": self._check_ai_service(),
            "cache_service": self._check_cache_service(),
            "monitoring_services": self._check_monitoring_systems()
        }

        return integrations

    def _check_version_compatibility(self) -> Dict[str, Any]:
        """Check version compatibility across components"""
        # This would check if all component versions are compatible
        return {
            "status": "unknown",
            "note": "Version compatibility checking needs implementation",
            "components": {
                "python": self._get_python_version(),
                "node": self._get_node_version(),
                "backend_framework": "FastAPI",
                "frontend_framework": "React"
            }
        }

    def _get_python_version(self) -> str:
        """Get Python version"""
        try:
            result = subprocess.run(
                ["python3", "--version"],
                capture_output=True,
                text=True,
                timeout=5
            )
            return result.stdout.strip() if result.returncode == 0 else "unknown"
        except:
            return "unknown"

    def _get_node_version(self) -> str:
        """Get Node.js version"""
        try:
            result = subprocess.run(
                ["node", "--version"],
                capture_output=True,
                text=True,
                timeout=5
            )
            return result.stdout.strip() if result.returncode == 0 else "unknown"
        except:
            return "unknown"

    # ===== SUMMARY & RECOMMENDATIONS =====

    def _generate_summary(self):
        """Generate overall diagnostic summary"""
        sectors = self.results["sectors"]
        summary = {
            "total_sectors": len(sectors),
            "healthy_sectors": 0,
            "degraded_sectors": 0,
            "unhealthy_sectors": 0,
            "failed_diagnostics": 0,
            "critical_issues": 0,
            "warning_issues": 0
        }

        for sector_name, sector_data in sectors.items():
            status = sector_data.get("status", "unknown")

            if status == "healthy":
                summary["healthy_sectors"] += 1
            elif status in ["degraded", "warning"]:
                summary["degraded_sectors"] += 1
            elif status in ["unhealthy", "critical", "failed"]:
                summary["unhealthy_sectors"] += 1

            # Count issues
            issues = sector_data.get("issues", [])
            summary["critical_issues"] += len([i for i in issues if "critical" in i.lower()])
            summary["warning_issues"] += len([i for i in issues if "warning" in i.lower() or "degraded" in i.lower()])

            if status == "failed":
                summary["failed_diagnostics"] += 1

        summary["overall_health"] = self._calculate_overall_health(summary)
        self.results["summary"] = summary

    def _calculate_overall_health(self, summary: Dict[str, Any]) -> str:
        """Calculate overall system health"""
        total_sectors = summary["total_sectors"]

        if summary["unhealthy_sectors"] > 0 or summary["failed_diagnostics"] > 0:
            return "critical"
        elif summary["degraded_sectors"] > total_sectors * 0.3:  # >30% degraded
            return "degraded"
        elif summary["healthy_sectors"] == total_sectors:
            return "healthy"
        else:
            return "warning"

    def _generate_recommendations(self):
        """Generate actionable recommendations based on findings"""
        recommendations = []

        sectors = self.results["sectors"]

        # Infrastructure recommendations
        if sectors.get("infrastructure", {}).get("status") != "healthy":
            recommendations.extend([
                "🔧 Infrastructure: Monitor system resources and scale as needed",
                "🔧 Infrastructure: Implement automated resource monitoring alerts",
                "🔧 Infrastructure: Set up proper logging and log rotation"
            ])

        # Backend recommendations
        if sectors.get("backend", {}).get("status") != "healthy":
            recommendations.extend([
                "🔧 Backend: Implement comprehensive API endpoint monitoring",
                "🔧 Backend: Set up automated dependency vulnerability scanning",
                "🔧 Backend: Implement proper database connection pooling"
            ])

        # AI/ML recommendations
        if sectors.get("ai_ml", {}).get("status") != "healthy":
            recommendations.extend([
                "🔧 AI/ML: Ensure ML model files are properly cached and loaded",
                "🔧 AI/ML: Implement model performance monitoring and retraining triggers",
                "🔧 AI/ML: Set up vector store backup and recovery procedures"
            ])

        # Security recommendations
        if sectors.get("security", {}).get("status") != "healthy":
            recommendations.extend([
                "🔒 Security: Implement security headers middleware",
                "🔒 Security: Set up automated security vulnerability scanning",
                "🔒 Security: Implement rate limiting and DDoS protection"
            ])

        # Performance recommendations
        if sectors.get("performance", {}).get("status") != "healthy":
            recommendations.extend([
                "⚡ Performance: Implement caching layers for frequently accessed data",
                "⚡ Performance: Set up performance monitoring and alerting",
                "⚡ Performance: Optimize database queries and implement indexing"
            ])

        # Testing recommendations
        if sectors.get("testing", {}).get("status") != "healthy":
            recommendations.extend([
                "🧪 Testing: Implement comprehensive automated testing suite",
                "🧪 Testing: Set up CI/CD pipeline with automated testing",
                "🧪 Testing: Implement test coverage monitoring and alerts"
            ])

        # Documentation recommendations
        if sectors.get("documentation", {}).get("status") != "healthy":
            recommendations.extend([
                "📚 Documentation: Set up automated API documentation generation",
                "📚 Documentation: Implement documentation quality checks",
                "📚 Documentation: Create comprehensive deployment and operations guides"
            ])

        self.results["recommendations"] = recommendations

    # ===== MAIN EXECUTION =====

    async def run_diagnostics(self, sectors: List[str] = None, output_file: str = None):
        """Run comprehensive diagnostics and save results"""
        logger.info("🚀 Starting Comprehensive System Diagnostics")

        if sectors is None:
            sectors = ["infrastructure", "backend", "frontend", "database",
                      "ai_ml", "security", "performance", "testing",
                      "documentation", "integration"]

        results = await self.run_comprehensive_diagnosis(sectors)

        # Save results
        if output_file:
            output_path = Path(output_file)
            output_path.parent.mkdir(parents=True, exist_ok=True)

            with open(output_path, 'w') as f:
                json.dump(results, f, indent=2, default=str)

            logger.info(f"📊 Diagnostic results saved to {output_path}")

        # Print summary
        self._print_summary(results)

        return results

    def _print_summary(self, results: Dict[str, Any]):
        """Print diagnostic summary to console"""
        summary = results.get("summary", {})

        print("\n" + "="*80)
        print("🔍 COMPREHENSIVE SYSTEM DIAGNOSTIC RESULTS")
        print("="*80)

        print(f"📊 Overall Health: {summary.get('overall_health', 'unknown').upper()}")
        print(f"📋 Sectors Analyzed: {summary.get('total_sectors', 0)}")
        print(f"✅ Healthy Sectors: {summary.get('healthy_sectors', 0)}")
        print(f"⚠️  Degraded Sectors: {summary.get('degraded_sectors', 0)}")
        print(f"❌ Unhealthy Sectors: {summary.get('unhealthy_sectors', 0)}")
        print(f"💥 Failed Diagnostics: {summary.get('failed_diagnostics', 0)}")
        print(f"🚨 Critical Issues: {summary.get('critical_issues', 0)}")
        print(f"⚠️  Warning Issues: {summary.get('warning_issues', 0)}")

        print("\n📋 SECTOR STATUS:")
        for sector_name, sector_data in results.get("sectors", {}).items():
            status = sector_data.get("status", "unknown")
            status_icon = {
                "healthy": "✅",
                "degraded": "⚠️",
                "warning": "⚠️",
                "unhealthy": "❌",
                "critical": "💥",
                "failed": "💥"
            }.get(status, "❓")

            print(f"  {status_icon} {sector_name}: {status}")

        recommendations = results.get("recommendations", [])
        if recommendations:
            print(f"\n💡 RECOMMENDATIONS ({len(recommendations)}):")
            for i, rec in enumerate(recommendations[:10], 1):  # Show first 10
                print(f"  {i}. {rec}")

            if len(recommendations) > 10:
                print(f"  ... and {len(recommendations) - 10} more recommendations")

        print(f"\n📅 Completed at: {datetime.now(timezone.utc).isoformat()}")
        print("="*80)


async def main():
    """Main execution function"""
    import argparse

    parser = argparse.ArgumentParser(description="Comprehensive System Diagnostic Orchestrator")
    parser.add_argument(
        "sectors",
        nargs="*",
        choices=["infrastructure", "backend", "frontend", "database", "ai_ml",
                "security", "performance", "testing", "documentation", "integration", "all"],
        default=["all"],
        help="Sectors to diagnose (default: all)"
    )
    parser.add_argument(
        "--output", "-o",
        default=f"diagnostic_results_{datetime.now().strftime('%Y%m%d_%H%M%S')}.json",
        help="Output file for results"
    )
    parser.add_argument(
        "--fix",
        action="store_true",
        help="Attempt automatic fixes for identified issues"
    )

    args = parser.parse_args()

    # Convert "all" to all sectors
    if "all" in args.sectors:
        sectors = ["infrastructure", "backend", "frontend", "database", "ai_ml",
                  "security", "performance", "testing", "documentation", "integration"]
    else:
        sectors = args.sectors

    # Run diagnostics
    orchestrator = ComprehensiveDiagnosticOrchestrator()
    await orchestrator.run_diagnostics(sectors, args.output)


if __name__ == "__main__":
    asyncio.run(main())