"""
Shared Infrastructure Services
Multi-layer caching, database health monitoring, and resilience patterns for Zenith microservices
"""

from .cache_manager import (
    MultiLayerCacheManager,
    CacheMetrics,
    CacheDecorator,
    cache_manager,
    cached,
    get_cache_stats,
    clear_cache_namespace,
    clear_all_cache,
)

from .database_health import (
    DatabaseHealthMonitor,
    DatabaseHealthMetrics,
    PGBouncerHealthMonitor,
    HealthStatus,
    PoolMetrics,
    QueryMetrics,
    create_health_monitor,
)

from .circuit_breaker import (
    CircuitBreaker,
    CircuitBreakerManager,
    CircuitState,
    CircuitConfig,
    CircuitMetrics,
    CircuitOpenError,
    CircuitTimeoutError,
    CircuitError,
    circuit_breaker_manager,
)

from .retry import (
    RetryPolicy,
    RetryConfig,
    Retryable,
    AsyncRetryable,
    RetryStrategy,
    RetryMetrics,
    DEFAULT_RETRY,
    AGGRESSIVE_RETRY,
    CONSERVATIVE_RETRY,
    with_retry,
)

from .service_discovery import (
    ServiceDiscovery,
    ServiceHealthChecker,
    ServiceConfig,
    ServiceEndpoint,
    service_discovery,
    service_health_checker,
    get_service_url,
    check_service_health,
    create_service_config,
)

from .config import (
    Settings,
    DatabaseConfig,
    RedisConfig,
    ServiceConfig,
    LoggingConfig,
    MetricsConfig,
    TracingConfig,
    SecurityConfig,
    load_settings,
    get_database_config,
    get_redis_config,
    get_security_config,
    get_logging_config,
    get_service_config,
    settings,
    is_production,
    is_development,
    is_gpu_enabled,
)

from .health_aggregation import (
    HealthAggregator,
    ServiceHealth,
    SystemHealth,
    HealthCheckRouter,
    health_aggregator,
    health_router,
)

__all__ = [
    # Cache Manager
    "MultiLayerCacheManager",
    "CacheMetrics",
    "CacheDecorator",
    "cache_manager",
    "cached",
    "get_cache_stats",
    "clear_cache_namespace",
    "clear_all_cache",
    # Database Health
    "DatabaseHealthMonitor",
    "DatabaseHealthMetrics",
    "PGBouncerHealthMonitor",
    "HealthStatus",
    "PoolMetrics",
    "QueryMetrics",
    "create_health_monitor",
    # Circuit Breaker
    "CircuitBreaker",
    "CircuitBreakerManager",
    "CircuitState",
    "CircuitConfig",
    "CircuitMetrics",
    "CircuitOpenError",
    "CircuitTimeoutError",
    "CircuitError",
    "circuit_breaker_manager",
    # Retry
    "RetryPolicy",
    "RetryConfig",
    "Retryable",
    "AsyncRetryable",
    "RetryStrategy",
    "RetryMetrics",
    "DEFAULT_RETRY",
    "AGGRESSIVE_RETRY",
    "CONSERVATIVE_RETRY",
    "with_retry",
    # Service Discovery
    "ServiceDiscovery",
    "ServiceHealthChecker",
    "ServiceConfig",
    "ServiceEndpoint",
    "service_discovery",
    "service_health_checker",
    "get_service_url",
    "check_service_health",
    "create_service_config",
    # Configuration
    "Settings",
    "DatabaseConfig",
    "RedisConfig",
    "ServiceConfig",
    "LoggingConfig",
    "MetricsConfig",
    "TracingConfig",
    "SecurityConfig",
    "load_settings",
    "get_database_config",
    "get_redis_config",
    "get_security_config",
    "get_logging_config",
    "get_service_config",
    "settings",
    "is_production",
    "is_development",
    "is_gpu_enabled",
    # Health Aggregation
    "HealthAggregator",
    "ServiceHealth",
    "SystemHealth",
    "HealthCheckRouter",
    "health_aggregator",
    "health_router",
]
