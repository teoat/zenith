"""
Database Health Monitoring Service
Provides comprehensive health checks for PostgreSQL with PGBouncer connection pooling
"""

import asyncio
import logging
import time
from dataclasses import dataclass, field
from datetime import datetime
from enum import Enum
from typing import Any

try:
    import asyncpg

    HAS_ASYNCPG = True
except ImportError:
    HAS_ASYNCPG = False
    asyncpg = None

try:
    import psycopg2
    from psycopg2 import pool

    HAS_PSYCOPG2 = True
except ImportError:
    HAS_PSYCOPG2 = False
    pool = None

logger = logging.getLogger(__name__)


class HealthStatus(Enum):
    HEALTHY = "healthy"
    DEGRADED = "degraded"
    UNHEALTHY = "unhealthy"
    UNKNOWN = "unknown"


@dataclass
class PoolMetrics:
    """Connection pool metrics"""

    active_connections: int = 0
    idle_connections: int = 0
    max_connections: int = 0
    reserved_connections: int = 0
    wait_count: int = 0
    wait_duration_ms: float = 0.0


@dataclass
class QueryMetrics:
    """Query performance metrics"""

    avg_query_time_ms: float = 0.0
    slow_queries_count: int = 0
    failed_queries_count: int = 0
    total_queries: int = 0


@dataclass
class DatabaseHealthMetrics:
    """Comprehensive database health metrics"""

    status: HealthStatus = HealthStatus.UNKNOWN
    latency_ms: float = 0.0
    connection_pool: PoolMetrics = field(default_factory=PoolMetrics)
    query_metrics: QueryMetrics = field(default_factory=QueryMetrics)
    last_check: datetime = field(default_factory=datetime.now)
    error_message: str | None = None
    version: str | None = None
    max_connections: int = 0
    active_connections: int = 0
    idle_connections: int = 0
    database_size_bytes: int = 0
    table_count: int = 0


class DatabaseHealthMonitor:
    """
    Comprehensive database health monitoring with connection pool analysis
    """

    def __init__(
        self,
        dsn: str,
        pool_min_size: int = 5,
        pool_max_size: int = 20,
        check_interval: int = 30,
        slow_query_threshold_ms: float = 1000.0,
    ):
        self.dsn = dsn
        self.pool_min_size = pool_min_size
        self.pool_max_size = pool_max_size
        self.check_interval = check_interval
        self.slow_query_threshold_ms = slow_query_threshold_ms

        self._pool = None
        self._async_pool = None
        self._metrics = DatabaseHealthMetrics()
        self._last_check_time = 0.0
        self._lock = asyncio.Lock()

        self._query_times: list[float] = []
        self._slow_query_count = 0
        self._failed_query_count = 0
        self._total_queries = 0

    async def initialize(self):
        """Initialize connection pools"""
        if HAS_ASYNCPG:
            try:
                self._async_pool = await asyncpg.create_pool(
                    self.dsn,
                    min_size=self.pool_min_size,
                    max_size=self.pool_max_size,
                    command_timeout=30.0,
                )
                logger.info("Async connection pool initialized")
            except Exception as e:
                logger.warning(f"Failed to initialize async pool: {e}")

        if HAS_PSYCOPG2:
            try:
                self._pool = pool.ThreadedConnectionPool(
                    self.pool_min_size,
                    self.pool_max_size,
                    self.dsn,
                )
                logger.info("Sync connection pool initialized")
            except Exception as e:
                logger.warning(f"Failed to initialize sync pool: {e}")

    async def close(self):
        """Close connection pools"""
        if self._async_pool:
            await self._async_pool.close()
        if self._pool:
            self._pool.closeall()
        logger.info("Connection pools closed")

    async def check_health(self) -> DatabaseHealthMetrics:
        """Perform comprehensive health check"""
        async with self._lock:
            start_time = time.time()

            try:
                if HAS_ASYNCPG and self._async_pool:
                    await self._check_async()
                elif HAS_PSYCOPG2 and self._pool:
                    self._check_sync()

                self._metrics.status = HealthStatus.HEALTHY
                self._metrics.error_message = None

            except Exception as e:
                logger.error(f"Health check failed: {e}")
                self._metrics.status = HealthStatus.UNHEALTHY
                self._metrics.error_message = str(e)

            finally:
                self._metrics.latency_ms = (time.time() - start_time) * 1000
                self._metrics.last_check = datetime.now()

            return self._metrics

    async def _check_async(self):
        """Async health check using asyncpg"""
        async with self._async_pool.acquire() as conn:
            latency_start = time.time()

            version_result = await conn.fetchval("SELECT version()")
            self._metrics.version = (
                version_result.split(" ")[1] if version_result else None
            )

            stats = await conn.fetchrow(
                "SELECT "
                "numbackends as active_connections, "
                "xact_commit as transactions, "
                "xact_rollback as rollbacks, "
                "blks_read as blocks_read, "
                "blks_hit as blocks_hit "
                "FROM pg_stat_database WHERE datname = CURRENT_DATABASE()"
            )

            if stats:
                self._metrics.active_connections = stats["active_connections"]

            db_size = await conn.fetchval("SELECT pg_database_size(CURRENT_DATABASE())")
            self._metrics.database_size_bytes = db_size or 0

            table_count = await conn.fetchval(
                "SELECT COUNT(*) FROM information_schema.tables WHERE table_schema = 'public'"
            )
            self._metrics.table_count = table_count or 0

            pool_status = self._async_pool.get_status()
            if pool_status:
                self._metrics.connection_pool.active_connections = pool_status.get(
                    "size", 0
                )
                self._metrics.connection_pool.idle_connections = pool_status.get(
                    "idle", 0
                )
                self._metrics.connection_pool.max_connections = (
                    self._async_pool.get_max_size()
                )

            latency = (time.time() - latency_start) * 1000
            self._record_query_time(latency)

    def _check_sync(self):
        """Sync health check using psycopg2"""
        conn = self._pool.getconn()
        try:
            latency_start = time.time()

            with conn.cursor() as cursor:
                cursor.execute("SELECT version()")
                version_result = cursor.fetchone()
                self._metrics.version = (
                    version_result[0].split(" ")[1] if version_result else None
                )

                cursor.execute(
                    "SELECT "
                    "numbackends, "
                    "pg_database_size(CURRENT_DATABASE()) "
                    "FROM pg_stat_database WHERE datname = CURRENT_DATABASE()"
                )
                stats = cursor.fetchone()
                if stats:
                    self._metrics.active_connections = stats[0]
                    self._metrics.database_size_bytes = stats[1] or 0

                cursor.execute(
                    "SELECT COUNT(*) FROM information_schema.tables WHERE table_schema = 'public'"
                )
                self._metrics.table_count = cursor.fetchone()[0] or 0

            latency = (time.time() - latency_start) * 1000
            self._record_query_time(latency)

        finally:
            self._pool.putconn(conn)

    def _record_query_time(self, latency_ms: float):
        """Record query execution time"""
        self._total_queries += 1
        self._query_times.append(latency_ms)

        if len(self._query_times) > 100:
            self._query_times = self._query_times[-100:]

        if latency_ms > self.slow_query_threshold_ms:
            self._slow_query_count += 1

        self._metrics.query_metrics.avg_query_time_ms = sum(self._query_times) / len(
            self._query_times
        )
        self._metrics.query_metrics.slow_queries_count = self._slow_query_count
        self._metrics.query_metrics.failed_queries_count = self._failed_query_count
        self._metrics.query_metrics.total_queries = self._total_queries

    async def check_connection_quality(self) -> dict[str, Any]:
        """Check connection quality metrics"""
        results = {
            "connection_tests": [],
            "success_rate": 0.0,
            "avg_latency_ms": 0.0,
            "min_latency_ms": float("inf"),
            "max_latency_ms": 0.0,
        }

        test_count = 5
        latencies = []

        for i in range(test_count):
            start_time = time.time()
            try:
                if HAS_ASYNCPG and self._async_pool:
                    async with self._async_pool.acquire() as conn:
                        await conn.fetchval("SELECT 1")
                elif HAS_PSYCOPG2 and self._pool:
                    conn = self._pool.getconn()
                    try:
                        with conn.cursor() as cursor:
                            cursor.execute("SELECT 1")
                    finally:
                        self._pool.putconn(conn)

                latency = (time.time() - start_time) * 1000
                latencies.append(latency)
                results["connection_tests"].append(
                    {
                        "test": i + 1,
                        "success": True,
                        "latency_ms": round(latency, 2),
                    }
                )

            except Exception as e:
                results["connection_tests"].append(
                    {
                        "test": i + 1,
                        "success": False,
                        "error": str(e),
                    }
                )
                self._failed_query_count += 1

        if latencies:
            results["success_rate"] = len(latencies) / test_count
            results["avg_latency_ms"] = sum(latencies) / len(latencies)
            results["min_latency_ms"] = min(latencies)
            results["max_latency_ms"] = max(latencies)

        return results

    async def get_pool_status(self) -> dict[str, Any]:
        """Get connection pool status"""
        status = {
            "pool_config": {
                "min_size": self.pool_min_size,
                "max_size": self.pool_max_size,
            },
            "async_pool": None,
            "sync_pool": None,
        }

        if HAS_ASYNCPG and self._async_pool:
            pool_status = self._async_pool.get_status()
            status["async_pool"] = {
                "size": pool_status.get("size", 0) if pool_status else 0,
                "idle": pool_status.get("idle", 0) if pool_status else 0,
                "max_size": self._async_pool.get_max_size(),
            }

        if HAS_PSYCOPG2 and self._pool:
            status["sync_pool"] = {
                "getconn_called": getattr(self._pool, "getconn_count", 0),
                "putconn_called": getattr(self._pool, "putconn_count", 0),
            }

        return status

    def get_metrics(self) -> DatabaseHealthMetrics:
        """Get current metrics"""
        return self._metrics

    def to_dict(self) -> dict[str, Any]:
        """Convert metrics to dictionary"""
        return {
            "status": self._metrics.status.value,
            "latency_ms": round(self._metrics.latency_ms, 2),
            "version": self._metrics.version,
            "connections": {
                "active": self._metrics.active_connections,
                "idle": self._metrics.idle_connections,
                "max": self._metrics.max_connections,
            },
            "pool": {
                "active_connections": self._metrics.connection_pool.active_connections,
                "idle_connections": self._metrics.connection_pool.idle_connections,
                "max_connections": self._metrics.connection_pool.max_connections,
            },
            "queries": {
                "avg_time_ms": round(self._metrics.query_metrics.avg_query_time_ms, 2),
                "slow_count": self._metrics.query_metrics.slow_queries_count,
                "failed_count": self._metrics.query_metrics.failed_queries_count,
                "total": self._metrics.query_metrics.total_queries,
            },
            "database": {
                "size_bytes": self._metrics.database_size_bytes,
                "size_human": self._format_bytes(self._metrics.database_size_bytes),
                "table_count": self._metrics.table_count,
            },
            "last_check": self._metrics.last_check.isoformat(),
            "error": self._metrics.error_message,
        }

    def _format_bytes(self, bytes_value: int) -> str:
        """Format bytes to human-readable string"""
        for unit in ["B", "KB", "MB", "GB", "TB"]:
            if bytes_value < 1024:
                return f"{bytes_value:.2f} {unit}"
            bytes_value /= 1024
        return f"{bytes_value:.2f} PB"


class PGBouncerHealthMonitor:
    """
    PGBouncer connection pooler health monitoring
    """

    def __init__(self, dsn: str):
        self.dsn = dsn
        self._pool = None

        if HAS_PSYCOPG2:
            try:
                self._pool = pool.SimpleConnectionPool(1, 2, dsn)
            except Exception as e:
                logger.warning(f"Failed to initialize PGBouncer monitor: {e}")

    async def check_pgbouncer_stats(self) -> dict[str, Any]:
        """Get PGBouncer statistics"""
        stats = {
            "connected": False,
            "stats": {},
            "databases": {},
            "clients": {},
        }

        if not self._pool:
            return stats

        try:
            conn = self._pool.getconn()
            try:
                with conn.cursor() as cursor:
                    cursor.execute("SHOW STATS")
                    rows = cursor.fetchall()
                    for row in rows:
                        stats["stats"][row[0]] = {
                            "num_connections": row[1],
                            "num_requests": row[2],
                            "num_errors": row[3],
                            "avg_time": row[4],
                        }

                    cursor.execute("SHOW DATABASES")
                    rows = cursor.fetchall()
                    for row in rows:
                        stats["databases"][row[0]] = {
                            "host": row[1],
                            "port": row[2],
                            "database": row[3],
                            "force_user": row[4],
                            "pool_size": row[5],
                            "pool_mode": row[6],
                        }

                    cursor.execute("SHOW CLIENTS")
                    rows = cursor.fetchall()
                    for row in rows:
                        stats["clients"][row[0]] = {
                            "user": row[1],
                            "database": row[2],
                            "state": row[3],
                            "addr": row[4],
                            "port": row[5],
                            "connect_time": row[6],
                            "request_time": row[7],
                            "wait": row[8],
                        }

                stats["connected"] = True

            finally:
                self._pool.putconn(conn)

        except Exception as e:
            logger.error(f"PGBouncer stats check failed: {e}")
            stats["error"] = str(e)

        return stats

    async def get_pool_configuration(self) -> dict[str, Any]:
        """Get PGBouncer pool configuration"""
        config = {
            "connected": False,
            "configuration": {},
        }

        if not self._pool:
            return config

        try:
            conn = self._pool.getconn()
            try:
                with conn.cursor() as cursor:
                    cursor.execute("SHOW ALL")
                    rows = cursor.fetchall()
                    for row in rows:
                        config["configuration"][row[0]] = row[1]

                config["connected"] = True

            finally:
                self._pool.putconn(conn)

        except Exception as e:
            logger.error(f"PGBouncer config check failed: {e}")
            config["error"] = str(e)

        return config

    def close(self):
        """Close connection pool"""
        if self._pool:
            self._pool.closeall()


# Factory function for creating health monitor
def create_health_monitor(
    database_url: str,
    pool_min_size: int = 5,
    pool_max_size: int = 20,
) -> DatabaseHealthMonitor:
    """Create a database health monitor instance"""
    monitor = DatabaseHealthMonitor(
        dsn=database_url,
        pool_min_size=pool_min_size,
        pool_max_size=pool_max_size,
    )
    return monitor
