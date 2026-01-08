"""
Service Discovery Utilities
Provides dynamic service discovery and configuration for microservices
"""

import asyncio
import logging
import os
from dataclasses import dataclass, field
from datetime import datetime
from typing import Any

logger = logging.getLogger(__name__)


@dataclass
class ServiceEndpoint:
    """Service endpoint information"""

    name: str
    url: str
    port: int
    health_check_path: str = "/health"
    timeout: float = 5.0
    weight: int = 1

    @property
    def host(self) -> str:
        """Extract host from URL"""
        return (
            self.url.split("://")[1].split(":")[0]
            if "://" in self.url
            else self.url.split(":")[0]
        )

    @property
    def scheme(self) -> str:
        """Extract scheme from URL"""
        return self.url.split("://")[0] if "://" in self.url else "http"


@dataclass
class ServiceConfig:
    """Service configuration"""

    name: str
    endpoints: list[ServiceEndpoint] = field(default_factory=list)
    default_timeout: float = 30.0
    retry_config_name: str = "default"

    def get_healthy_endpoint(self) -> ServiceEndpoint | None:
        """Get first available endpoint"""
        return self.endpoints[0] if self.endpoints else None


class ServiceDiscovery:
    """
    Dynamic service discovery and configuration manager
    """

    def __init__(self):
        self._services: dict[str, ServiceConfig] = {}
        self._service_urls: dict[str, str] = {}
        self._lock = asyncio.Lock()
        self._initialized = False

    def register_service(self, config: ServiceConfig):
        """Register a service configuration"""
        self._services[config.name] = config
        if config.endpoints:
            self._service_urls[config.name] = config.endpoints[0].url
        logger.info(f"Registered service: {config.name}")

    def get_service_url(self, service_name: str) -> str | None:
        """Get service URL by name"""
        env_key = f"{service_name.upper().replace('-', '_')}_SERVICE_URL"
        return os.getenv(env_key) or self._service_urls.get(service_name)

    def get_service(self, service_name: str) -> ServiceConfig | None:
        """Get service configuration by name"""
        return self._services.get(service_name)

    def get_all_services(self) -> list[str]:
        """Get all registered service names"""
        return list(self._services.keys())

    def get_all_urls(self) -> dict[str, str]:
        """Get all service URLs"""
        return {name: self._service_urls.get(name) for name in self._services}

    def update_service_url(self, service_name: str, url: str):
        """Update service URL dynamically"""
        self._service_urls[service_name] = url
        if service_name in self._services and self._services[service_name].endpoints:
            self._services[service_name].endpoints[0].url = url

    async def initialize_from_env(self):
        """Initialize service discovery from environment variables"""
        if self._initialized:
            return

        service_mapping = {
            "auth": ["AUTH_SERVICE_URL", "AUTH_SERVICE"],
            "case": ["CASE_SERVICE_URL", "CASE_SERVICE"],
            "ai": ["AI_SERVICE_URL", "AI_SERVICE"],
            "fraud": ["FRAUD_SERVICE_URL", "FRAUD_SERVICE"],
            "workflow": ["WORKFLOW_SERVICE_URL", "WORKFLOW_SERVICE"],
            "api-gateway": ["API_GATEWAY_URL", "API_GATEWAY"],
        }

        for service_name, env_vars in service_mapping.items():
            for env_var in env_vars:
                url = os.getenv(env_var)
                if url:
                    self._service_urls[service_name] = url
                    logger.info(f"Discovered service {service_name}: {url}")
                    break

        self._initialized = True


class ServiceHealthChecker:
    """
    Health checker for services with configurable checks
    """

    def __init__(self):
        self._health_status: dict[str, dict[str, Any]] = {}
        self._last_check: dict[str, datetime] = {}
        self._lock = asyncio.Lock()
        self._check_interval = 30.0

    async def check_health(
        self,
        service_name: str,
        url: str,
        health_path: str = "/health",
        timeout: float = 5.0,
    ) -> dict[str, Any]:
        """Check health of a service"""
        import httpx

        full_url = f"{url.rstrip('/')}{health_path}"
        start_time = asyncio.get_event_loop().time()

        try:
            async with httpx.AsyncClient(timeout=timeout) as client:
                response = await client.get(full_url)

                duration_ms = (asyncio.get_event_loop().time() - start_time) * 1000

                status = {
                    "service": service_name,
                    "url": url,
                    "healthy": response.status_code == 200,
                    "status_code": response.status_code,
                    "latency_ms": round(duration_ms, 2),
                    "last_check": datetime.now().isoformat(),
                }

                if response.status_code == 200:
                    try:
                        status["details"] = response.json()
                    except Exception:
                        status["details"] = {"raw": response.text[:200]}

                else:
                    status["error"] = f"HTTP {response.status_code}"

        except asyncio.TimeoutError:
            status = {
                "service": service_name,
                "url": url,
                "healthy": False,
                "error": "timeout",
                "latency_ms": timeout * 1000,
                "last_check": datetime.now().isoformat(),
            }

        except Exception as e:
            status = {
                "service": service_name,
                "url": url,
                "healthy": False,
                "error": str(e),
                "last_check": datetime.now().isoformat(),
            }

        async with self._lock:
            self._health_status[service_name] = status
            self._last_check[service_name] = datetime.now()

        return status

    async def check_all_services(
        self,
        service_discovery: ServiceDiscovery,
        timeout: float = 5.0,
    ) -> dict[str, dict[str, Any]]:
        """Check health of all registered services"""
        results = {}

        for service_name, url in service_discovery.get_all_urls().items():
            if url:
                service = service_discovery.get_service(service_name)
                health_path = (
                    service.endpoints[0].health_check_path
                    if service and service.endpoints
                    else "/health"
                )
                results[service_name] = await self.check_health(
                    service_name, url, health_path, timeout
                )

        return results

    def get_health_status(self, service_name: str) -> dict[str, Any] | None:
        """Get health status of a service"""
        return self._health_status.get(service_name)

    def get_all_health_status(self) -> dict[str, dict[str, Any]]:
        """Get health status of all services"""
        return dict(self._health_status)

    def get_aggregate_health(self) -> dict[str, Any]:
        """Get aggregate health status"""
        total = len(self._health_status)
        healthy = sum(
            1 for s in self._health_status.values() if s.get("healthy", False)
        )

        return {
            "total_services": total,
            "healthy_services": healthy,
            "unhealthy_services": total - healthy,
            "health_percentage": round(healthy / total * 100, 2) if total > 0 else 0,
            "services": self._health_status,
        }


# Global instances
service_discovery = ServiceDiscovery()
service_health_checker = ServiceHealthChecker()


def get_service_url(service_name: str) -> str | None:
    """Convenience function to get service URL"""
    return service_discovery.get_service_url(service_name)


async def check_service_health(
    service_name: str,
    url: str,
    health_path: str = "/health",
) -> dict[str, Any]:
    """Convenience function to check service health"""
    return await service_health_checker.check_health(service_name, url, health_path)


def create_service_config(
    name: str,
    url: str,
    health_check_path: str = "/health",
    timeout: float = 30.0,
) -> ServiceConfig:
    """Create and register a service configuration"""
    config = ServiceConfig(
        name=name,
        endpoints=[
            ServiceEndpoint(
                name=name,
                url=url,
                port=8000,
                health_check_path=health_check_path,
                timeout=timeout,
            )
        ],
        default_timeout=timeout,
    )
    service_discovery.register_service(config)
    return config
