"""
Service Mesh Implementation
Provides service discovery, load balancing, and inter-service communication
"""
import asyncio
import json
import logging
import hashlib
import time
from dataclasses import dataclass, field
from typing import Any, Dict, List, Optional, Callable, Union
from datetime import datetime, timedelta
from enum import Enum

logger = logging.getLogger(__name__)


class ServiceHealth(Enum):
    HEALTHY = "healthy"
    DEGRADED = "degraded"
    UNHEALTHY = "unhealthy"
    UNKNOWN = "unknown"


@dataclass
class ServiceInstance:
    """Represents a service instance in the mesh"""
    service_name: str
    instance_id: str
    host: str
    port: int
    protocol: str = "http"
    health: ServiceHealth = ServiceHealth.UNKNOWN
    last_health_check: Optional[datetime] = None
    metadata: Dict[str, Any] = field(default_factory=dict)
    registered_at: datetime = field(default_factory=datetime.now)

    @property
    def url(self) -> str:
        """Get the full service URL"""
        return f"{self.protocol}://{self.host}:{self.port}"

    def is_healthy(self) -> bool:
        """Check if service instance is healthy"""
        return self.health == ServiceHealth.HEALTHY

    def needs_health_check(self) -> bool:
        """Check if health check is needed"""
        if not self.last_health_check:
            return True
        return datetime.now() - self.last_health_check > timedelta(seconds=30)


@dataclass
class ServiceRoute:
    """Route configuration for service communication"""
    path: str
    methods: List[str] = field(default_factory=lambda: ["GET"])
    timeout: float = 30.0
    retries: int = 3
    circuit_breaker_enabled: bool = True
    rate_limit_per_minute: Optional[int] = None
    authentication_required: bool = True


class ServiceMesh:
    """Service mesh for inter-service communication"""

    def __init__(self):
        self.services: Dict[str, List[ServiceInstance]] = {}
        self.routes: Dict[str, Dict[str, ServiceRoute]] = {}
        self.load_balancers: Dict[str, 'LoadBalancer'] = {}

        # Health monitoring
        self.health_check_interval = 30  # seconds
        self._health_monitor_task: Optional[asyncio.Task] = None

        # Circuit breakers for service-to-service calls
        self.circuit_breakers: Dict[str, 'CircuitBreaker'] = {}

        logger.info("Service mesh initialized")

    async def start(self):
        """Start the service mesh"""
        logger.info("Starting service mesh...")
        self._health_monitor_task = asyncio.create_task(self._health_monitor_loop())
        logger.info("Service mesh started")

    async def stop(self):
        """Stop the service mesh"""
        if self._health_monitor_task:
            self._health_monitor_task.cancel()
            try:
                await self._health_monitor_task
            except asyncio.CancelledError:
                pass
        logger.info("Service mesh stopped")

    def register_service(self, service_name: str, instance: ServiceInstance):
        """Register a service instance"""
        if service_name not in self.services:
            self.services[service_name] = []
            self.load_balancers[service_name] = RoundRobinLoadBalancer()

        self.services[service_name].append(instance)
        logger.info(f"Registered service instance: {service_name}/{instance.instance_id} at {instance.url}")

    def deregister_service(self, service_name: str, instance_id: str):
        """Deregister a service instance"""
        if service_name in self.services:
            self.services[service_name] = [
                instance for instance in self.services[service_name]
                if instance.instance_id != instance_id
            ]

            if not self.services[service_name]:
                del self.services[service_name]
                if service_name in self.load_balancers:
                    del self.load_balancers[service_name]

            logger.info(f"Deregistered service instance: {service_name}/{instance_id}")

    def add_route(self, service_name: str, route_name: str, route: ServiceRoute):
        """Add a route configuration for a service"""
        if service_name not in self.routes:
            self.routes[service_name] = {}

        self.routes[service_name][route_name] = route
        logger.info(f"Added route {route_name} for service {service_name}")

    async def call_service(
        self,
        service_name: str,
        route_name: str,
        method: str = "GET",
        path_params: Optional[Dict[str, Any]] = None,
        query_params: Optional[Dict[str, Any]] = None,
        body: Optional[Any] = None,
        headers: Optional[Dict[str, str]] = None,
        timeout: Optional[float] = None,
    ) -> Dict[str, Any]:
        """
        Call a service through the mesh with load balancing and circuit breaking
        """
        try:
            # Get route configuration
            route = self._get_route_config(service_name, route_name)
            if not route:
                raise ServiceMeshError(f"Route {route_name} not found for service {service_name}")

            # Check if method is allowed
            if method.upper() not in [m.upper() for m in route.methods]:
                raise ServiceMeshError(f"Method {method} not allowed for route {route_name}")

            # Select service instance
            instance = self._select_instance(service_name)
            if not instance:
                raise ServiceUnavailableError(f"No healthy instances available for service {service_name}")

            # Build URL
            url = self._build_url(instance, route, path_params, query_params)

            # Prepare request
            request_config = {
                "method": method,
                "url": url,
                "headers": headers or {},
                "timeout": timeout or route.timeout,
                "body": body,
            }

            # Execute with circuit breaker
            circuit_key = f"{service_name}:{route_name}"
            if route.circuit_breaker_enabled:
                if circuit_key not in self.circuit_breakers:
                    self.circuit_breakers[circuit_key] = CircuitBreaker(failure_threshold=5, recovery_timeout=60)

                circuit_breaker = self.circuit_breakers[circuit_key]

                async with circuit_breaker.attempt_operation():
                    return await self._execute_request(request_config)

            else:
                return await self._execute_request(request_config)

        except Exception as e:
            logger.error(f"Service call failed: {service_name}/{route_name} - {e}")
            raise

    def _get_route_config(self, service_name: str, route_name: str) -> Optional[ServiceRoute]:
        """Get route configuration"""
        service_routes = self.routes.get(service_name, {})
        return service_routes.get(route_name)

    def _select_instance(self, service_name: str) -> Optional[ServiceInstance]:
        """Select a service instance using load balancer"""
        if service_name not in self.services:
            return None

        healthy_instances = [
            instance for instance in self.services[service_name]
            if instance.is_healthy()
        ]

        if not healthy_instances:
            return None

        load_balancer = self.load_balancers.get(service_name)
        if load_balancer:
            return load_balancer.select(healthy_instances)

        # Fallback to first healthy instance
        return healthy_instances[0]

    def _build_url(
        self,
        instance: ServiceInstance,
        route: ServiceRoute,
        path_params: Optional[Dict[str, Any]],
        query_params: Optional[Dict[str, Any]]
    ) -> str:
        """Build the complete URL for the request"""
        url = f"{instance.url}{route.path}"

        # Replace path parameters
        if path_params:
            for key, value in path_params.items():
                url = url.replace(f"{{{key}}}", str(value))

        # Add query parameters
        if query_params:
            from urllib.parse import urlencode
            query_string = urlencode(query_params)
            url += f"?{query_string}"

        return url

    async def _execute_request(self, config: Dict[str, Any]) -> Dict[str, Any]:
        """Execute the actual HTTP request"""
        import aiohttp

        async with aiohttp.ClientSession() as session:
            try:
                async with session.request(**config) as response:
                    result = {
                        "status_code": response.status,
                        "headers": dict(response.headers),
                        "url": str(response.url),
                    }

                    if response.content_type == "application/json":
                        result["data"] = await response.json()
                    else:
                        result["data"] = await response.text()

                    return result

            except aiohttp.ClientError as e:
                raise ServiceCommunicationError(f"HTTP request failed: {e}")

    async def _health_monitor_loop(self):
        """Background health monitoring loop"""
        while True:
            try:
                await self._perform_health_checks()
                await asyncio.sleep(self.health_check_interval)
            except asyncio.CancelledError:
                break
            except Exception as e:
                logger.error(f"Health monitor error: {e}")
                await asyncio.sleep(5)  # Brief pause before retry

    async def _perform_health_checks(self):
        """Perform health checks on all service instances"""
        for service_name, instances in self.services.items():
            for instance in instances:
                if instance.needs_health_check():
                    await self._check_instance_health(instance)

    async def _check_instance_health(self, instance: ServiceInstance):
        """Check health of a specific service instance"""
        try:
            import aiohttp

            health_url = f"{instance.url}/health"
            timeout = aiohttp.ClientTimeout(total=5.0)

            async with aiohttp.ClientSession(timeout=timeout) as session:
                async with session.get(health_url) as response:
                    if response.status == 200:
                        try:
                            health_data = await response.json()
                            status = health_data.get("status", "unknown")

                            if status == "healthy":
                                instance.health = ServiceHealth.HEALTHY
                            elif status == "degraded":
                                instance.health = ServiceHealth.DEGRADED
                            else:
                                instance.health = ServiceHealth.UNHEALTHY
                        except:
                            # If we can't parse JSON, assume healthy if status is 200
                            instance.health = ServiceHealth.HEALTHY
                    else:
                        instance.health = ServiceHealth.UNHEALTHY

        except Exception as e:
            logger.warning(f"Health check failed for {instance.url}: {e}")
            instance.health = ServiceHealth.UNHEALTHY

        instance.last_health_check = datetime.now()

    def get_service_status(self, service_name: Optional[str] = None) -> Dict[str, Any]:
        """Get status of services in the mesh"""
        if service_name:
            instances = self.services.get(service_name, [])
            return {
                "service_name": service_name,
                "instances": [
                    {
                        "instance_id": inst.instance_id,
                        "url": inst.url,
                        "health": inst.health.value,
                        "last_check": inst.last_health_check.isoformat() if inst.last_health_check else None,
                    }
                    for inst in instances
                ],
                "total_instances": len(instances),
                "healthy_instances": len([inst for inst in instances if inst.is_healthy()]),
            }

        # Return status for all services
        return {
            "services": {
                name: {
                    "instances": len(instances),
                    "healthy": len([inst for inst in instances if inst.is_healthy()]),
                    "routes": list(self.routes.get(name, {}).keys()),
                }
                for name, instances in self.services.items()
            },
            "total_services": len(self.services),
            "circuit_breakers": len(self.circuit_breakers),
        }


class LoadBalancer:
    """Base class for load balancing strategies"""
    def select(self, instances: List[ServiceInstance]) -> ServiceInstance:
        raise NotImplementedError


class RoundRobinLoadBalancer(LoadBalancer):
    """Round-robin load balancer"""

    def __init__(self):
        self.current_index = 0

    def select(self, instances: List[ServiceInstance]) -> ServiceInstance:
        if not instances:
            raise ValueError("No instances available")

        instance = instances[self.current_index % len(instances)]
        self.current_index += 1
        return instance


class LeastConnectionsLoadBalancer(LoadBalancer):
    """Least connections load balancer"""

    def select(self, instances: List[ServiceInstance]) -> ServiceInstance:
        if not instances:
            raise ValueError("No instances available")

        # In a real implementation, track active connections per instance
        # For now, just return the first healthy instance
        return instances[0]


class CircuitBreaker:
    """Simple circuit breaker for service calls"""

    def __init__(self, failure_threshold: int = 5, recovery_timeout: float = 60.0):
        self.failure_threshold = failure_threshold
        self.recovery_timeout = recovery_timeout
        self.failure_count = 0
        self.last_failure_time: Optional[float] = None
        self.state = "closed"

    async def __aenter__(self):
        if self.state == "open":
            if time.time() - (self.last_failure_time or 0) > self.recovery_timeout:
                self.state = "half-open"
            else:
                raise CircuitBreakerOpenError("Circuit breaker is open")

        return self

    async def __aexit__(self, exc_type, exc_val, exc_tb):
        if exc_type:
            self.failure_count += 1
            self.last_failure_time = time.time()

            if self.failure_count >= self.failure_threshold:
                self.state = "open"
        else:
            if self.state == "half-open":
                self.state = "closed"
                self.failure_count = 0

    async def attempt_operation(self):
        """Context manager for circuit breaker protection"""
        return self


# Custom exceptions
class ServiceMeshError(Exception):
    pass


class ServiceUnavailableError(ServiceMeshError):
    pass


class ServiceCommunicationError(ServiceMeshError):
    pass


class CircuitBreakerOpenError(ServiceMeshError):
    pass


# Global service mesh instance
service_mesh = ServiceMesh()