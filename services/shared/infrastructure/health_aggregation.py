"""
Service Health Aggregation
Aggregates health status from multiple services and provides overall system health
"""

import asyncio
import logging
from dataclasses import dataclass, field
from datetime import datetime
from typing import Any

logger = logging.getLogger(__name__)


@dataclass
class ServiceHealth:
    """Individual service health status"""

    service_name: str
    healthy: bool
    latency_ms: float
    status_code: int | None
    error: str | None
    details: dict[str, Any] | None
    last_check: datetime
    metadata: dict[str, Any] = field(default_factory=dict)


@dataclass
class SystemHealth:
    """Aggregated system health status"""

    overall_status: str
    healthy_services: int
    total_services: int
    services: dict[str, ServiceHealth]
    checked_at: datetime
    avg_latency_ms: float

    @property
    def health_percentage(self) -> float:
        return (
            (self.healthy_services / self.total_services * 100)
            if self.total_services > 0
            else 0
        )


class HealthAggregator:
    """
    Aggregates health status from multiple services
    """

    def __init__(self, check_timeout: float = 10.0):
        self._services: dict[str, dict[str, Any]] = {}
        self._check_timeout = check_timeout
        self._last_aggregated: SystemHealth | None = None
        self._lock = asyncio.Lock()

    def register_service(
        self,
        name: str,
        url: str,
        health_path: str = "/health",
        metadata: dict[str, Any] | None = None,
    ):
        """Register a service for health checking"""
        self._services[name] = {
            "url": url,
            "health_path": health_path,
            "metadata": metadata or {},
        }
        logger.info(f"Registered service for health aggregation: {name}")

    def unregister_service(self, name: str):
        """Unregister a service"""
        self._services.pop(name, None)
        logger.info(f"Unregistered service from health aggregation: {name}")

    async def check_all_services(self) -> SystemHealth:
        """Check health of all registered services"""
        import httpx

        results: dict[str, ServiceHealth] = {}
        total_latency = 0.0
        healthy_count = 0

        async with self._lock:
            tasks = []
            for name, config in self._services.items():
                tasks.append(self._check_service(name, config))

            if tasks:
                service_results = await asyncio.gather(*tasks, return_exceptions=True)

                for i, result in enumerate(service_results):
                    name = list(self._services.keys())[i]
                    if isinstance(result, ServiceHealth):
                        results[name] = result
                        total_latency += result.latency_ms
                        if result.healthy:
                            healthy_count += 1
                    else:
                        results[name] = ServiceHealth(
                            service_name=name,
                            healthy=False,
                            latency_ms=self._check_timeout * 1000,
                            status_code=None,
                            error=str(result),
                            details=None,
                            last_check=datetime.now(),
                        )

        overall_status = (
            "healthy"
            if healthy_count == len(results)
            else "degraded"
            if healthy_count > 0
            else "unhealthy"
        )

        self._last_aggregated = SystemHealth(
            overall_status=overall_status,
            healthy_services=healthy_count,
            total_services=len(results),
            services=results,
            checked_at=datetime.now(),
            avg_latency_ms=total_latency / len(results) if results else 0,
        )

        return self._last_aggregated

    async def _check_service(self, name: str, config: dict[str, Any]) -> ServiceHealth:
        """Check health of a single service"""
        import httpx

        url = f"{config['url'].rstrip('/')}{config['health_path']}"
        start_time = asyncio.get_event_loop().time()

        try:
            async with httpx.AsyncClient(timeout=self._check_timeout) as client:
                response = await client.get(url, follow_redirects=True)

                latency_ms = (asyncio.get_event_loop().time() - start_time) * 1000

                healthy = response.status_code == 200

                details = None
                if response.headers.get("content-type", "").startswith(
                    "application/json"
                ):
                    try:
                        details = response.json()
                    except Exception:
                        pass

                return ServiceHealth(
                    service_name=name,
                    healthy=healthy,
                    latency_ms=round(latency_ms, 2),
                    status_code=response.status_code,
                    error=None if healthy else f"HTTP {response.status_code}",
                    details=details,
                    last_check=datetime.now(),
                    metadata=config.get("metadata", {}),
                )

        except asyncio.TimeoutError:
            return ServiceHealth(
                service_name=name,
                healthy=False,
                latency_ms=self._check_timeout * 1000,
                status_code=None,
                error="timeout",
                details=None,
                last_check=datetime.now(),
                metadata=config.get("metadata", {}),
            )

        except Exception as e:
            return ServiceHealth(
                service_name=name,
                healthy=False,
                latency_ms=(asyncio.get_event_loop().time() - start_time) * 1000,
                status_code=None,
                error=str(e),
                details=None,
                last_check=datetime.now(),
                metadata=config.get("metadata", {}),
            )

    def get_last_health(self) -> SystemHealth | None:
        """Get last aggregated health status"""
        return self._last_aggregated

    def get_service_health(self, name: str) -> ServiceHealth | None:
        """Get health of a specific service"""
        if self._last_aggregated:
            return self._last_aggregated.services.get(name)
        return None

    def to_dict(self) -> dict[str, Any]:
        """Convert to dictionary"""
        if not self._last_aggregated:
            return {"status": "unknown", "services": {}}

        return {
            "overall_status": self._last_aggregated.overall_status,
            "healthy_services": self._last_aggregated.healthy_services,
            "total_services": self._last_aggregated.total_services,
            "health_percentage": round(self._last_aggregated.health_percentage, 2),
            "avg_latency_ms": round(self._last_aggregated.avg_latency_ms, 2),
            "checked_at": self._last_aggregated.checked_at.isoformat(),
            "services": {
                name: {
                    "healthy": service.healthy,
                    "latency_ms": service.latency_ms,
                    "status_code": service.status_code,
                    "error": service.error,
                }
                for name, service in self._last_aggregated.services.items()
            },
        }


class HealthCheckRouter:
    """
    Router for health check endpoints that aggregates service health
    """

    def __init__(self, health_aggregator: HealthAggregator):
        self.aggregator = health_aggregator

    def register_default_services(self):
        """Register default Zenith services"""
        from services.shared.infrastructure.config import settings

        self.aggregator.register_service(
            "api-gateway",
            f"http://localhost:{settings.SERVICE_PORT}",
            "/health",
            {"type": "gateway"},
        )

        if settings.AI_SERVICE_URL:
            self.aggregator.register_service(
                "ai-ml-service",
                settings.AI_SERVICE_URL,
                "/health",
                {"type": "ml", "gpu": settings.GPU_ENABLED},
            )

        if settings.FRAUD_SERVICE_URL:
            self.aggregator.register_service(
                "fraud-intel-service",
                settings.FRAUD_SERVICE_URL,
                "/health",
                {"type": "fraud"},
            )

        if settings.WORKFLOW_SERVICE_URL:
            self.aggregator.register_service(
                "workflow-service",
                settings.WORKFLOW_SERVICE_URL,
                "/health",
                {"type": "workflow"},
            )

    def create_health_response(self) -> dict[str, Any]:
        """Create health check response"""
        from services.shared.infrastructure.config import is_production

        response = self.aggregator.to_dict()
        response["environment"] = "production" if is_production() else "development"
        response["version"] = "1.0.0"

        return response

    def create_readiness_response(self) -> dict[str, Any]:
        """Create readiness check response"""
        health = self.aggregator.get_last_health()

        if not health:
            return {
                "ready": False,
                "reason": "Health checks not yet performed",
            }

        critical_services = ["api-gateway"]
        all_critical_healthy = all(
            health.services.get(
                name, ServiceHealth("", False, 0, None, None, None, datetime.now())
            ).healthy
            for name in critical_services
        )

        return {
            "ready": all_critical_healthy and health.overall_status != "unhealthy",
            "healthy_services": health.healthy_services,
            "total_services": health.total_services,
        }

    def create_liveness_response(self) -> dict[str, Any]:
        """Create liveness check response"""
        return {
            "alive": True,
            "timestamp": datetime.now().isoformat(),
        }


# Global health aggregator
health_aggregator = HealthAggregator()
health_router = HealthCheckRouter(health_aggregator)
