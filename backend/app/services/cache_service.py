# backend/services/cache_manager.py
import asyncio
import hashlib
import json
import logging
import threading
import time
from dataclasses import dataclass
from datetime import datetime, timedelta
from typing import Any, Awaitable, Callable, Dict, Optional

try:
    import redis

    HAS_REDIS = True
except ImportError:
    HAS_REDIS = False
    redis = None

logger = logging.getLogger(__name__)


@dataclass
class CacheEntry:
    key: str
    value: Any
    created_at: datetime
    expires_at: Optional[datetime]
    access_count: int = 0
    last_accessed: Optional[datetime] = None
    size_bytes: int = 0


class CacheMetrics:
    def __init__(self):
        self.hits = 0
        self.misses = 0
        self.evictions = 0
        self.sets = 0
        self.deletes = 0

    def hit_rate(self) -> float:
        total = self.hits + self.misses
        return self.hits / total if total > 0 else 0.0

    def to_dict(self) -> Dict[str, Any]:
        return {
            "hits": self.hits,
            "misses": self.misses,
            "evictions": self.evictions,
            "sets": self.sets,
            "deletes": self.deletes,
            "hit_rate": self.hit_rate(),
            "total_requests": self.hits + self.misses,
        }


class MultiLayerCache:
    """
    Multi-layer caching system with memory and optional Redis support
    L1: Fast in-memory (hot data)
    L2: Larger in-memory (warm data)
    L3: Redis (persistent, shared across instances)
    """

    def __init__(
        self,
        max_memory_entries: int = 1000,
        default_ttl_seconds: int = 300,
        redis_host: str = "localhost",
        redis_port: int = 6379,
        redis_db: int = 0,
    ):
        self.l1_cache: Dict[str, CacheEntry] = {}  # L1: Fast memory cache
        self.l2_cache: Dict[str, CacheEntry] = {}  # L2: Larger memory cache
        self.max_l1_entries = max_memory_entries // 4  # 25% for L1
        self.max_l2_entries = max_memory_entries - self.max_l1_entries  # 75% for L2
        self.default_ttl = timedelta(seconds=default_ttl_seconds)

        self.metrics = CacheMetrics()
        self.lock = threading.RLock()

        # Redis configuration
        self.redis_host = redis_host
        self.redis_port = redis_port
        self.redis_db = redis_db
        self.redis_client = None

        if HAS_REDIS:
            self._init_redis()

        # Start cleanup task
        self._start_cleanup_task()

    def _init_redis(self):
        """Initialize Redis client"""
        try:
            self.redis_client = redis.Redis(
                host=self.redis_host,
                port=self.redis_port,
                db=self.redis_db,
                decode_responses=False,  # We'll handle serialization
                socket_connect_timeout=5,
                socket_timeout=5,
                # retry_on_timeout=True # Deprecated
            )
            # Test connection
            self.redis_client.ping()
            logger.info("Redis cache layer initialized")
        except Exception as e:
            logger.warning(
                f"Redis initialization failed: {e}. Continuing with memory-only cache."
            )
            self.redis_client = None

    def _redis_available(self) -> bool:
        """Check if Redis is available"""
        return self.redis_client is not None

    def _serialize_for_redis(self, value: Any) -> str:
        """Serialize value for Redis storage"""
        try:
            return json.dumps(value, default=str)
        except Exception:
            return json.dumps({"error": "serialization_failed"})

    def _deserialize_from_redis(self, value: str) -> Any:
        """Deserialize value from Redis storage"""
        try:
            return json.loads(value)
        except Exception:
            return None

    def _generate_key(self, namespace: str, key: Any) -> str:
        """Generate a consistent cache key"""
        if isinstance(key, (dict, list)):
            key_str = json.dumps(key, sort_keys=True, default=str)
        else:
            key_str = str(key)

        full_key = f"{namespace}:{key_str}"
        return hashlib.md5(full_key.encode()).hexdigest()

    def _calculate_size(self, value: Any) -> int:
        """Calculate approximate memory size of value"""
        try:
            return len(json.dumps(value, default=str).encode("utf-8"))
        except:
            return len(str(value).encode("utf-8"))

    def _is_expired(self, entry: CacheEntry) -> bool:
        """Check if cache entry is expired"""
        return entry.expires_at and datetime.now() > entry.expires_at

    def _evict_lru(self, cache: Dict[str, CacheEntry], max_entries: int):
        """Evict least recently used entries"""
        if len(cache) <= max_entries:
            return

        # Sort by last accessed time (oldest first)
        entries = sorted(
            cache.items(), key=lambda x: x[1].last_accessed or x[1].created_at
        )
        to_evict = len(cache) - max_entries

        for key, _ in entries[:to_evict]:
            del cache[key]
            self.metrics.evictions += 1

    def _cleanup_expired(self):
        """Clean up expired entries from both cache layers"""
        with self.lock:
            current_time = datetime.now()

            # Clean L1 cache
            expired_l1 = [k for k, v in self.l1_cache.items() if self._is_expired(v)]
            for key in expired_l1:
                del self.l1_cache[key]

            # Clean L2 cache
            expired_l2 = [k for k, v in self.l2_cache.items() if self._is_expired(v)]
            for key in expired_l2:
                del self.l2_cache[key]

            if expired_l1 or expired_l2:
                logger.debug(
                    f"Cleaned up {len(expired_l1)} L1 and {len(expired_l2)} L2 expired entries"
                )

    def _start_cleanup_task(self):
        """Start background cleanup task"""

        def cleanup_worker():
            while True:
                try:
                    self._cleanup_expired()
                    time.sleep(60)  # Clean up every minute
                except Exception as e:
                    logger.error(f"Cache cleanup error: {e}")
                    time.sleep(60)

        thread = threading.Thread(target=cleanup_worker, daemon=True)
        thread.start()

    def get(self, namespace: str, key: Any) -> Optional[Any]:
        """Get value from cache"""
        cache_key = self._generate_key(namespace, key)

        with self.lock:
            # Try L1 cache first
            if cache_key in self.l1_cache:
                entry = self.l1_cache[cache_key]
                if not self._is_expired(entry):
                    entry.access_count += 1
                    entry.last_accessed = datetime.now()
                    self.metrics.hits += 1
                    return entry.value
                else:
                    del self.l1_cache[cache_key]

            # Try L2 cache
            if cache_key in self.l2_cache:
                entry = self.l2_cache[cache_key]
                if not self._is_expired(entry):
                    entry.access_count += 1
                    entry.last_accessed = datetime.now()
                    self.metrics.hits += 1

                    # Promote to L1 cache
                    self.l1_cache[cache_key] = entry
                    self._evict_lru(self.l1_cache, self.max_l1_entries)

                    return entry.value
                else:
                    del self.l2_cache[cache_key]

            # Try L3 cache (Redis)
            if self._redis_available():
                try:
                    redis_key = f"{namespace}:{cache_key}"
                    redis_value = self.redis_client.get(redis_key)
                    if redis_value:
                        value = self._deserialize_from_redis(
                            redis_value.decode("utf-8")
                        )
                        if value is not None:
                            self.metrics.hits += 1

                            # Promote to memory caches
                            entry = CacheEntry(
                                key=cache_key,
                                value=value,
                                created_at=datetime.now(),
                                expires_at=None,  # Redis handles TTL
                                size_bytes=self._calculate_size(value),
                            )

                            with self.lock:
                                self.l2_cache[cache_key] = entry
                                self._evict_lru(self.l2_cache, self.max_l2_entries)

                                self.l1_cache[cache_key] = entry
                                self._evict_lru(self.l1_cache, self.max_l1_entries)

                            return value
                except Exception as e:
                    logger.debug(f"Redis L3 cache miss: {e}")

            self.metrics.misses += 1
            return None

    def set(
        self, namespace: str, key: Any, value: Any, ttl_seconds: Optional[int] = None
    ) -> bool:
        """Set value in cache"""
        cache_key = self._generate_key(namespace, key)
        expires_at = (
            datetime.now() + timedelta(seconds=ttl_seconds) if ttl_seconds else None
        )
        size_bytes = self._calculate_size(value)

        entry = CacheEntry(
            key=cache_key,
            value=value,
            created_at=datetime.now(),
            expires_at=expires_at,
            size_bytes=size_bytes,
        )

        with self.lock:
            # Always set in L2 cache
            self.l2_cache[cache_key] = entry
            self._evict_lru(self.l2_cache, self.max_l2_entries)

            # Set in L1 cache for frequently accessed items
            self.l1_cache[cache_key] = entry
            self._evict_lru(self.l1_cache, self.max_l1_entries)

            # Store in L3 cache (Redis) if available
            if self._redis_available():
                try:
                    redis_key = f"{namespace}:{cache_key}"
                    serialized_value = self._serialize_for_redis(value)
                    if ttl_seconds:
                        self.redis_client.setex(
                            redis_key, ttl_seconds, serialized_value
                        )
                    else:
                        self.redis_client.set(redis_key, serialized_value)
                except Exception as e:
                    logger.debug(f"Redis L3 cache set failed: {e}")

            self.metrics.sets += 1
            return True

    def delete(self, namespace: str, key: Any) -> bool:
        """Delete value from cache"""
        cache_key = self._generate_key(namespace, key)

        with self.lock:
            deleted = False
            if cache_key in self.l1_cache:
                del self.l1_cache[cache_key]
                deleted = True
            if cache_key in self.l2_cache:
                del self.l2_cache[cache_key]
                deleted = True

            # Delete from L3 cache (Redis)
            if self._redis_available():
                try:
                    redis_key = f"{namespace}:{cache_key}"
                    self.redis_client.delete(redis_key)
                except Exception as e:
                    logger.debug(f"Redis L3 cache delete failed: {e}")

            if deleted:
                self.metrics.deletes += 1

            return deleted

    def clear_namespace(self, namespace: str) -> int:
        """Clear all entries in a namespace"""
        with self.lock:
            cleared = 0

            # Clear from L1
            to_remove_l1 = [
                k for k in self.l1_cache.keys() if k.startswith(f"{namespace}:")
            ]
            for key in to_remove_l1:
                del self.l1_cache[key]
                cleared += 1

            # Clear from L2
            to_remove_l2 = [
                k for k in self.l2_cache.keys() if k.startswith(f"{namespace}:")
            ]
            for key in to_remove_l2:
                del self.l2_cache[key]
                cleared += 1

            # Clear from L3 cache (Redis)
            if self._redis_available():
                try:
                    pattern = f"{namespace}:*"
                    keys = self.redis_client.keys(pattern)
                    if keys:
                        self.redis_client.delete(*keys)
                        cleared += len(keys)
                except Exception as e:
                    logger.debug(f"Redis L3 cache clear failed: {e}")

            return cleared

    def clear_all(self) -> int:
        """Clear all cache entries"""
        with self.lock:
            total_cleared = len(self.l1_cache) + len(self.l2_cache)
            self.l1_cache.clear()
            self.l2_cache.clear()
            return total_cleared

    def get_stats(self) -> Dict[str, Any]:
        """Get comprehensive cache statistics"""
        stats = {
            "l1_cache": {
                "entries": len(self.l1_cache),
                "max_entries": self.max_l1_entries,
                "utilization": (
                    len(self.l1_cache) / self.max_l1_entries
                    if self.max_l1_entries > 0
                    else 0
                ),
            },
            "l2_cache": {
                "entries": len(self.l2_cache),
                "max_entries": self.max_l2_entries,
                "utilization": (
                    len(self.l2_cache) / self.max_l2_entries
                    if self.max_l2_entries > 0
                    else 0
                ),
            },
            "metrics": self.metrics.to_dict(),
            "total_size_bytes": sum(e.size_bytes for e in self.l1_cache.values())
            + sum(e.size_bytes for e in self.l2_cache.values()),
        }

        # Add Redis stats if available
        if self._redis_available():
            try:
                redis_info = self.redis_client.info()
                stats["l3_cache"] = {
                    "available": True,
                    "db_size": self.redis_client.dbsize(),
                    "memory_used": redis_info.get("used_memory_human", "N/A"),
                    "connected_clients": redis_info.get("connected_clients", 0),
                }
            except Exception as e:
                stats["l3_cache"] = {"available": False, "error": str(e)}
        else:
            stats["l3_cache"] = {
                "available": False,
                "reason": "Redis not installed or not available",
            }

        return stats


class CachedFunction:
    """Decorator for caching function results"""

    def __init__(self, cache: MultiLayerCache, namespace: str, ttl_seconds: int = 300):
        self.cache = cache
        self.namespace = namespace
        self.ttl_seconds = ttl_seconds

    def __call__(self, func: Callable) -> Callable:
        async def async_wrapper(*args, **kwargs):
            # Create cache key from function name and arguments
            key_data = {"function": func.__name__, "args": args, "kwargs": kwargs}

            # Try cache first
            cached_result = self.cache.get(self.namespace, key_data)
            if cached_result is not None:
                return cached_result

            # Execute function
            result = await func(*args, **kwargs)

            # Cache result
            self.cache.set(self.namespace, key_data, result, self.ttl_seconds)

            return result

        def sync_wrapper(*args, **kwargs):
            # Create cache key from function name and arguments
            key_data = {"function": func.__name__, "args": args, "kwargs": kwargs}

            # Try cache first
            cached_result = self.cache.get(self.namespace, key_data)
            if cached_result is not None:
                return cached_result

            # Execute function
            result = func(*args, **kwargs)

            # Cache result
            self.cache.set(self.namespace, key_data, result, self.ttl_seconds)

            return result

        if asyncio.iscoroutinefunction(func):
            return async_wrapper
        else:
            return sync_wrapper


# Create singleton cache instance
cache_manager = MultiLayerCache(max_memory_entries=2000, default_ttl_seconds=300)


# Export convenience functions
def cached(namespace: str, ttl_seconds: int = 300):
    """Decorator for caching function results"""
    return CachedFunction(cache_manager, namespace, ttl_seconds)


def get_cache_stats():
    """Get cache statistics"""
    return cache_manager.get_stats()


def clear_cache_namespace(namespace: str):
    """Clear all cache entries in a namespace"""
    return cache_manager.clear_namespace(namespace)


def clear_all_cache():
    """Clear all cache entries"""
    return cache_manager.clear_all()
