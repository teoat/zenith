"""
Advanced Redis Clustering for Scalability
Provides distributed caching, session management, and high availability
"""

import asyncio
import json
import logging
import pickle
from collections.abc import Callable
from dataclasses import dataclass
from datetime import datetime
from typing import Any

try:
    import redis.asyncio as redis
    from redis.asyncio.cluster import RedisCluster
    from redis.asyncio.sentinel import Sentinel

    REDIS_AVAILABLE = True
except ImportError:
    redis = None
    RedisCluster = None
    Sentinel = None
    REDIS_AVAILABLE = False

logger = logging.getLogger(__name__)


@dataclass
class RedisConfig:
    """Configuration for Redis cluster"""

    hosts: list[str]  # List of host:port strings
    password: str | None = None
    db: int = 0
    cluster_mode: bool = False
    sentinel_mode: bool = False
    sentinel_master_name: str = "mymaster"
    ssl: bool = False
    socket_timeout: float = 5.0
    socket_connect_timeout: float = 5.0
    retry_on_timeout: bool = True
    max_connections: int = 20
    decode_responses: bool = True


class RedisClusterManager:
    """Advanced Redis cluster management with failover and scaling"""

    def __init__(self, config: RedisConfig):
        if not REDIS_AVAILABLE:
            raise ImportError("redis library not available. Install with: pip install redis")

        self.config = config
        self.client: redis.Redis | RedisCluster | Sentinel | None = None
        self.is_connected = False
        self.connection_pool = None

        # Performance metrics
        self.operations_count = 0
        self.error_count = 0
        self.avg_response_time = 0.0

    async def connect(self) -> bool:
        """Establish connection to Redis cluster"""
        try:
            if self.config.cluster_mode:
                # Redis Cluster mode
                startup_nodes = []
                for host_port in self.config.hosts:
                    if ":" in host_port:
                        host, port = host_port.rsplit(":", 1)
                        startup_nodes.append({"host": host, "port": int(port)})
                    else:
                        startup_nodes.append({"host": host_port, "port": 6379})

                self.client = RedisCluster(
                    startup_nodes=startup_nodes,
                    password=self.config.password,
                    db=self.config.db,
                    ssl=self.config.ssl,
                    socket_timeout=self.config.socket_timeout,
                    socket_connect_timeout=self.config.socket_connect_timeout,
                    retry_on_timeout=self.config.retry_on_timeout,
                    max_connections=self.config.max_connections,
                    decode_responses=self.config.decode_responses,
                )

            elif self.config.sentinel_mode:
                # Redis Sentinel mode
                sentinels = []
                for host_port in self.config.hosts:
                    if ":" in host_port:
                        host, port = host_port.rsplit(":", 1)
                        sentinels.append((host, int(port)))
                    else:
                        sentinels.append((host_port, 26379))  # Default sentinel port

                sentinel = Sentinel(
                    sentinels,
                    password=self.config.password,
                    db=self.config.db,
                    socket_timeout=self.config.socket_timeout,
                )
                self.client = sentinel.master_for(self.config.sentinel_master_name)

            else:
                # Single Redis instance or simple cluster
                if len(self.config.hosts) == 1:
                    # Single instance
                    host_port = self.config.hosts[0]
                    if ":" in host_port:
                        host, port = host_port.rsplit(":", 1)
                        port = int(port)
                    else:
                        host, port = host_port, 6379

                    self.client = redis.Redis(
                        host=host,
                        port=port,
                        password=self.config.password,
                        db=self.config.db,
                        ssl=self.config.ssl,
                        socket_timeout=self.config.socket_timeout,
                        socket_connect_timeout=self.config.socket_connect_timeout,
                        retry_on_timeout=self.config.retry_on_timeout,
                        max_connections=self.config.max_connections,
                        decode_responses=self.config.decode_responses,
                    )
                else:
                    # Multiple instances - use round-robin
                    self.connection_pool = redis.ConnectionPool(
                        host=self.config.hosts[0].split(":")[0],
                        port=int(self.config.hosts[0].split(":")[1]) if ":" in self.config.hosts[0] else 6379,
                        password=self.config.password,
                        db=self.config.db,
                        max_connections=self.config.max_connections,
                        decode_responses=self.config.decode_responses,
                    )
                    self.client = redis.Redis(connection_pool=self.connection_pool)

            # Test connection
            await self.client.ping()
            self.is_connected = True
            logger.info(f"Successfully connected to Redis cluster: {len(self.config.hosts)} nodes")
            return True

        except Exception as e:
            logger.error(f"Failed to connect to Redis cluster: {e}")
            self.is_connected = False
            return False

    async def disconnect(self):
        """Close Redis connections"""
        if self.client:
            await self.client.close()
            self.is_connected = False
            logger.info("Disconnected from Redis cluster")

    async def _execute_with_retry(self, operation: Callable, *args, **kwargs) -> Any:
        """Execute Redis operation with retry logic"""
        import time

        max_retries = 3
        base_delay = 0.1

        for attempt in range(max_retries):
            try:
                start_time = time.time()
                result = await operation(*args, **kwargs)
                response_time = time.time() - start_time

                # Update metrics
                self.operations_count += 1
                self.avg_response_time = ((self.avg_response_time * (self.operations_count - 1)) + response_time) / self.operations_count

                return result

            except Exception as e:
                self.error_count += 1
                if attempt == max_retries - 1:
                    logger.error(f"Redis operation failed after {max_retries} attempts: {e}")
                    raise

                delay = base_delay * (2**attempt)
                logger.warning(f"Redis operation failed (attempt {attempt + 1}), retrying in {delay}s: {e}")
                await asyncio.sleep(delay)

    # Core Redis operations with enhanced error handling
    async def get(self, key: str) -> str | None:
        """Get value from Redis"""
        if not self.is_connected:
            return None
        return await self._execute_with_retry(self.client.get, key)

    async def set(self, key: str, value: str, ex: int | None = None) -> bool:
        """Set value in Redis with optional expiration"""
        if not self.is_connected:
            return False
        return await self._execute_with_retry(self.client.set, key, value, ex=ex)

    async def delete(self, *keys: str) -> int:
        """Delete keys from Redis"""
        if not self.is_connected:
            return 0
        return await self._execute_with_retry(self.client.delete, *keys)

    async def exists(self, key: str) -> bool:
        """Check if key exists"""
        if not self.is_connected:
            return False
        return bool(await self._execute_with_retry(self.client.exists, key))

    async def expire(self, key: str, seconds: int) -> bool:
        """Set expiration on key"""
        if not self.is_connected:
            return False
        return await self._execute_with_retry(self.client.expire, key, seconds)

    async def ttl(self, key: str) -> int:
        """Get time-to-live for key"""
        if not self.is_connected:
            return -1
        return await self._execute_with_retry(self.client.ttl, key)

    # Advanced operations
    async def set_json(self, key: str, data: Any, ex: int | None = None) -> bool:
        """Set JSON data in Redis"""
        return await self.set(key, json.dumps(data), ex=ex)

    async def get_json(self, key: str) -> Any | None:
        """Get JSON data from Redis"""
        data = await self.get(key)
        if data:
            try:
                return json.loads(data)
            except json.JSONDecodeError:
                logger.warning(f"Failed to decode JSON data for key: {key}")
                return None
        return None

    async def set_pickle(self, key: str, data: Any, ex: int | None = None) -> bool:
        """Set pickled Python object in Redis"""
        try:
            pickled_data = pickle.dumps(data)
            return await self.set(key, pickled_data.decode("latin1"), ex=ex)
        except Exception as e:
            logger.error(f"Failed to pickle data for key {key}: {e}")
            return False

    async def get_pickle(self, key: str) -> Any | None:
        """Get pickled Python object from Redis"""
        try:
            data = await self.get(key)
            if data:
                return pickle.loads(data.encode("latin1"))
        except Exception as e:
            logger.error(f"Failed to unpickle data for key {key}: {e}")
        return None

    # Pub/Sub operations
    async def publish(self, channel: str, message: str) -> int:
        """Publish message to channel"""
        if not self.is_connected:
            return 0
        return await self._execute_with_retry(self.client.publish, channel, message)

    async def subscribe(self, *channels: str):
        """Subscribe to channels (returns pubsub object)"""
        if not self.is_connected:
            return None
        pubsub = self.client.pubsub()
        await pubsub.subscribe(*channels)
        return pubsub

    # Hash operations
    async def hget(self, key: str, field: str) -> str | None:
        """Get hash field value"""
        if not self.is_connected:
            return None
        return await self._execute_with_retry(self.client.hget, key, field)

    async def hset(self, key: str, field: str, value: str) -> bool:
        """Set hash field value"""
        if not self.is_connected:
            return False
        return bool(await self._execute_with_retry(self.client.hset, key, field, value))

    async def hgetall(self, key: str) -> dict[str, str]:
        """Get all hash fields"""
        if not self.is_connected:
            return {}
        return await self._execute_with_retry(self.client.hgetall, key)

    async def hdel(self, key: str, *fields: str) -> int:
        """Delete hash fields"""
        if not self.is_connected:
            return 0
        return await self._execute_with_retry(self.client.hdel, key, *fields)

    # Set operations
    async def sadd(self, key: str, *members: str) -> int:
        """Add members to set"""
        if not self.is_connected:
            return 0
        return await self._execute_with_retry(self.client.sadd, key, *members)

    async def srem(self, key: str, *members: str) -> int:
        """Remove members from set"""
        if not self.is_connected:
            return 0
        return await self._execute_with_retry(self.client.srem, key, *members)

    async def smembers(self, key: str) -> set:
        """Get all set members"""
        if not self.is_connected:
            return set()
        return await self._execute_with_retry(self.client.smembers, key)

    async def sismember(self, key: str, member: str) -> bool:
        """Check if member is in set"""
        if not self.is_connected:
            return False
        return await self._execute_with_retry(self.client.sismember, key, member)

    # Sorted set operations
    async def zadd(self, key: str, mapping: dict[str, float]) -> int:
        """Add members to sorted set with scores"""
        if not self.is_connected:
            return 0
        return await self._execute_with_retry(self.client.zadd, key, mapping)

    async def zrange(self, key: str, start: int, end: int, withscores: bool = False):
        """Get range from sorted set"""
        if not self.is_connected:
            return []
        return await self._execute_with_retry(self.client.zrange, key, start, end, withscores=withscores)

    async def zrevrange(self, key: str, start: int, end: int, withscores: bool = False):
        """Get reverse range from sorted set"""
        if not self.is_connected:
            return []
        return await self._execute_with_retry(self.client.zrevrange, key, start, end, withscores=withscores)

    async def zscore(self, key: str, member: str) -> float | None:
        """Get score of member in sorted set"""
        if not self.is_connected:
            return None
        return await self._execute_with_retry(self.client.zscore, key, member)

    # Cluster-specific operations
    async def get_cluster_info(self) -> dict[str, Any]:
        """Get cluster information"""
        if not self.is_connected or not self.config.cluster_mode:
            return {"cluster_mode": False}

        try:
            cluster_info = await self.client.cluster_info()
            nodes = await self.client.cluster_nodes()

            return {
                "cluster_mode": True,
                "cluster_info": cluster_info,
                "nodes": len(nodes) if nodes else 0,
                "cluster_state": cluster_info.get("cluster_state", "unknown"),
            }
        except Exception as e:
            logger.error(f"Failed to get cluster info: {e}")
            return {"cluster_mode": False, "error": str(e)}

    async def get_health_status(self) -> dict[str, Any]:
        """Get comprehensive health status"""
        status = {
            "connected": self.is_connected,
            "config": {
                "hosts": self.config.hosts,
                "cluster_mode": self.config.cluster_mode,
                "sentinel_mode": self.config.sentinel_mode,
            },
            "performance": {
                "total_operations": self.operations_count,
                "error_count": self.error_count,
                "avg_response_time_ms": round(self.avg_response_time * 1000, 2),
                "error_rate_percent": round((self.error_count / max(self.operations_count, 1)) * 100, 2),
            },
        }

        # Add cluster-specific info if applicable
        if self.config.cluster_mode:
            status.update(await self.get_cluster_info())

        # Test connection
        if self.is_connected:
            try:
                ping_result = await asyncio.wait_for(self.client.ping(), timeout=2.0)
                status["ping_success"] = True
                status["ping_response"] = ping_result
            except Exception as e:
                status["ping_success"] = False
                status["ping_error"] = str(e)

        return status

    # Session management
    async def store_session(self, session_id: str, data: dict[str, Any], ttl_seconds: int = 3600) -> bool:
        """Store session data with TTL"""
        key = f"session:{session_id}"
        return await self.set_json(key, data, ex=ttl_seconds)

    async def get_session(self, session_id: str) -> dict[str, Any] | None:
        """Retrieve session data"""
        key = f"session:{session_id}"
        return await self.get_json(key)

    async def delete_session(self, session_id: str) -> bool:
        """Delete session data"""
        key = f"session:{session_id}"
        return bool(await self.delete(key))

    # Distributed locking
    async def acquire_lock(self, lock_key: str, ttl_seconds: int = 30) -> str | None:
        """Acquire a distributed lock"""
        lock_value = f"{lock_key}:{datetime.now().isoformat()}"
        key = f"lock:{lock_key}"

        # Use SET with NX and EX for atomic operation
        success = await self.client.set(key, lock_value, ex=ttl_seconds, nx=True)
        return lock_value if success else None

    async def release_lock(self, lock_key: str, lock_value: str) -> bool:
        """Release a distributed lock"""
        key = f"lock:{lock_key}"

        # Use Lua script for atomic check-and-delete
        script = """
        if redis.call("get", KEYS[1]) == ARGV[1] then
            return redis.call("del", KEYS[1])
        else
            return 0
        end
        """

        try:
            result = await self.client.eval(script, 1, key, lock_value)
            return bool(result)
        except Exception as e:
            logger.error(f"Failed to release lock {lock_key}: {e}")
            return False


# Global Redis cluster manager
redis_cluster_manager = RedisClusterManager(
    RedisConfig(
        hosts=["localhost:6379"],  # Default single instance
        cluster_mode=False,
        sentinel_mode=False,
    )
)
