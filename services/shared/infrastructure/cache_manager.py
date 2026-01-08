"""
Multi-Layer Cache Manager for Microservices
L1: In-memory cache (fastest)
L2: Redis cache (distributed)
"""

import asyncio
import hashlib
import json
import logging
import threading
import time
from collections.abc import Callable
from dataclasses import dataclass
from datetime import datetime, timedelta
from typing import Any

try:
    import redis.asyncio as redis

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
    expires_at: datetime | None
    original_key: str = ""
    access_count: int = 0
    last_accessed: datetime | None = None
    size_bytes: int = 0


@dataclass
class CacheMetrics:
    hits: int = 0
    misses: int = 0
    evictions: int = 0
    sets: int = 0
    deletes: int = 0

    def hit_rate(self) -> float:
        total = self.hits + self.misses
        return self.hits / total if total > 0 else 0.0

    def to_dict(self) -> dict[str, Any]:
        return {
            "hits": self.hits,
            "misses": self.misses,
            "evictions": self.evictions,
            "sets": self.sets,
            "deletes": self.deletes,
            "hit_rate": round(self.hit_rate() * 100, 2),
            "total_requests": self.hits + self.misses,
        }


class MultiLayerCacheManager:
    """
    Multi-layer caching system:
    - L1: In-memory cache (fastest, per-instance)
    - L2: Redis cache (distributed, shared across instances)
    """

    def __init__(
        self,
        max_memory_entries: int = 1000,
        default_ttl_seconds: int = 300,
        redis_url: str | None = None,
        namespace: str = "zenith",
    ):
        self.namespace = namespace
        self.l1_cache: dict[str, CacheEntry] = {}
        self.l2_cache: dict[str, CacheEntry] = {}
        self.max_l1_entries = max_memory_entries // 4
        self.max_l2_entries = max_memory_entries - self.max_l1_entries
        self.default_ttl = timedelta(seconds=default_ttl_seconds)

        self.metrics = CacheMetrics()
        self.lock = threading.RLock()

        self.redis_client = None
        self.redis_available = False

        if redis_url and HAS_REDIS:
            self._init_redis(redis_url)

        self._start_cleanup_task()

    def _init_redis(self, redis_url: str):
        """Initialize Redis client"""
        try:
            self.redis_client = redis.Redis.from_url(
                redis_url,
                decode_responses=True,
                socket_connect_timeout=5,
                socket_timeout=5,
            )
            asyncio.create_task(self._test_redis_connection())
            logger.info("Redis cache layer initialized")
        except Exception as e:
            logger.warning(
                f"Redis initialization failed: {e}. Continuing with memory-only cache."
            )
            self.redis_client = None

    async def _test_redis_connection(self):
        """Test Redis connection"""
        try:
            if self.redis_client:
                await self.redis_client.ping()
                self.redis_available = True
                logger.info("Redis connection verified")
        except Exception as e:
            logger.warning(f"Redis connection test failed: {e}")
            self.redis_available = False

    def _generate_key(self, key: Any) -> tuple[str, str]:
        """Generate a consistent cache key and return (hash, original_key)"""
        if isinstance(key, (dict, list)):
            key_str = json.dumps(key, sort_keys=True, default=str)
        else:
            key_str = str(key)

        original_key = key_str
        full_key_for_hash = f"{self.namespace}:{key_str}"
        return hashlib.md5(full_key_for_hash.encode()).hexdigest(), original_key

    def _calculate_size(self, value: Any) -> int:
        """Calculate approximate memory size"""
        try:
            return len(json.dumps(value, default=str).encode("utf-8"))
        except Exception:
            return len(str(value).encode("utf-8"))

    def _is_expired(self, entry: CacheEntry) -> bool:
        """Check if cache entry is expired"""
        return entry.expires_at and datetime.now() > entry.expires_at

    def _evict_lru(self, cache: dict[str, CacheEntry], max_entries: int):
        """Evict least recently used entries"""
        if len(cache) <= max_entries:
            return

        entries = sorted(
            cache.items(), key=lambda x: x[1].last_accessed or x[1].created_at
        )
        to_evict = len(cache) - max_entries

        for key, _ in entries[:to_evict]:
            del cache[key]
            self.metrics.evictions += 1

    def _cleanup_expired(self):
        """Clean up expired entries"""
        with self.lock:
            now = datetime.now()

            expired_l1 = [k for k, v in self.l1_cache.items() if self._is_expired(v)]
            for key in expired_l1:
                del self.l1_cache[key]

            expired_l2 = [k for k, v in self.l2_cache.items() if self._is_expired(v)]
            for key in expired_l2:
                del self.l2_cache[key]

    def _start_cleanup_task(self):
        """Start background cleanup task"""

        def cleanup_worker():
            while True:
                try:
                    self._cleanup_expired()
                    time.sleep(60)
                except Exception as e:
                    logger.error(f"Cache cleanup error: {e}")
                    time.sleep(60)

        thread = threading.Thread(target=cleanup_worker, daemon=True)
        thread.start()

    def get(self, key: Any) -> Any | None:
        """Get value from cache (checks L1, then L2, then Redis)"""
        cache_key, original_key = self._generate_key(key)

        with self.lock:
            if cache_key in self.l1_cache:
                entry = self.l1_cache[cache_key]
                if not self._is_expired(entry):
                    entry.access_count += 1
                    entry.last_accessed = datetime.now()
                    self.metrics.hits += 1
                    return entry.value
                del self.l1_cache[cache_key]

            if cache_key in self.l2_cache:
                entry = self.l2_cache[cache_key]
                if not self._is_expired(entry):
                    entry.access_count += 1
                    entry.last_accessed = datetime.now()
                    self.metrics.hits += 1

                    self.l1_cache[cache_key] = entry
                    self._evict_lru(self.l1_cache, self.max_l1_entries)
                    return entry.value
                del self.l2_cache[cache_key]

            if self.redis_available and self.redis_client:
                try:
                    redis_key = f"{self.namespace}:{original_key}"
                    redis_value = self.redis_client.get(redis_key)
                    if redis_value:
                        value = json.loads(redis_value)
                        self.metrics.hits += 1

                        entry = CacheEntry(
                            key=cache_key,
                            value=value,
                            created_at=datetime.now(),
                            expires_at=None,
                            original_key=original_key,
                            size_bytes=self._calculate_size(value),
                        )

                        with self.lock:
                            self.l2_cache[cache_key] = entry
                            self._evict_lru(self.l2_cache, self.max_l2_entries)
                            self.l1_cache[cache_key] = entry
                            self._evict_lru(self.l1_cache, self.max_l1_entries)

                        return value
                except Exception as e:
                    logger.debug(f"Redis cache miss: {e}")

            self.metrics.misses += 1
            return None

    async def aget(self, key: Any) -> Any | None:
        """Async get from cache"""
        return self.get(key)

    def set(self, key: Any, value: Any, ttl_seconds: int | None = None) -> bool:
        """Set value in cache"""
        cache_key, original_key = self._generate_key(key)
        expires_at = (
            datetime.now() + timedelta(seconds=ttl_seconds) if ttl_seconds else None
        )
        size_bytes = self._calculate_size(value)

        entry = CacheEntry(
            key=cache_key,
            value=value,
            created_at=datetime.now(),
            expires_at=expires_at,
            original_key=original_key,
            size_bytes=size_bytes,
        )

        with self.lock:
            self.l2_cache[cache_key] = entry
            self._evict_lru(self.l2_cache, self.max_l2_entries)

            self.l1_cache[cache_key] = entry
            self._evict_lru(self.l1_cache, self.max_l1_entries)

            if self.redis_available and self.redis_client:
                try:
                    redis_key = f"{self.namespace}:{original_key}"
                    serialized = json.dumps(value, default=str)
                    if ttl_seconds:
                        self.redis_client.setex(redis_key, ttl_seconds, serialized)
                    else:
                        self.redis_client.set(redis_key, serialized)
                except Exception as e:
                    logger.debug(f"Redis cache set failed: {e}")

            self.metrics.sets += 1
            return True

    async def aset(self, key: Any, value: Any, ttl_seconds: int | None = None) -> bool:
        """Async set to cache"""
        return self.set(key, value, ttl_seconds)

    def delete(self, key: Any) -> bool:
        """Delete value from cache"""
        cache_key, original_key = self._generate_key(key)

        with self.lock:
            deleted = False
            if cache_key in self.l1_cache:
                del self.l1_cache[cache_key]
                deleted = True
            if cache_key in self.l2_cache:
                del self.l2_cache[cache_key]
                deleted = True

            if self.redis_available and self.redis_client:
                try:
                    redis_key = f"{self.namespace}:{original_key}"
                    self.redis_client.delete(redis_key)
                except Exception as e:
                    logger.debug(f"Redis cache delete failed: {e}")

            if deleted:
                self.metrics.deletes += 1
            return deleted

    async def adelete(self, key: Any) -> bool:
        """Async delete from cache"""
        return self.delete(key)

    def clear_namespace(self, namespace: str) -> int:
        """Clear all entries in a namespace"""
        with self.lock:
            cleared = 0

            to_remove_l1 = [k for k, v in self.l1_cache.items() if v.original_key.startswith(namespace)]
            for key in to_remove_l1:
                del self.l1_cache[key]
                cleared += 1

            to_remove_l2 = [k for k, v in self.l2_cache.items() if v.original_key.startswith(namespace)]
            for key in to_remove_l2:
                del self.l2_cache[key]
                cleared += 1

            if self.redis_available and self.redis_client:
                try:
                    pattern = f"{self.namespace}:{namespace}*"
                    keys = self.redis_client.keys(pattern)
                    if keys:
                        self.redis_client.delete(*keys)
                        cleared += len(keys)
                except Exception as e:
                    logger.debug(f"Redis cache clear failed: {e}")

            return cleared

    def clear_all(self) -> int:
        """Clear all cache entries"""
        with self.lock:
            total_cleared = len(self.l1_cache) + len(self.l2_cache)
            self.l1_cache.clear()
            self.l2_cache.clear()
            return total_cleared

    def get_stats(self) -> dict[str, Any]:
        """Get comprehensive cache statistics"""
        stats = {
            "l1_cache": {
                "entries": len(self.l1_cache),
                "max_entries": self.max_l1_entries,
                "utilization": round(len(self.l1_cache) / self.max_l1_entries * 100, 2)
                if self.max_l1_entries > 0
                else 0,
            },
            "l2_cache": {
                "entries": len(self.l2_cache),
                "max_entries": self.max_l2_entries,
                "utilization": round(len(self.l2_cache) / self.max_l2_entries * 100, 2)
                if self.max_l2_entries > 0
                else 0,
            },
            "metrics": self.metrics.to_dict(),
            "total_size_bytes": sum(e.size_bytes for e in self.l1_cache.values())
            + sum(e.size_bytes for e in self.l2_cache.values()),
            "redis": {
                "available": self.redis_available,
            },
        }

        if self.redis_available and self.redis_client:
            try:
                redis_info = self.redis_client.info()
                stats["redis"]["db_size"] = self.redis_client.dbsize()
                stats["redis"]["memory_used"] = redis_info.get(
                    "used_memory_human", "N/A"
                )
                stats["redis"]["connected_clients"] = redis_info.get(
                    "connected_clients", 0
                )
            except Exception as e:
                stats["redis"]["error"] = str(e)

        return stats


class CacheDecorator:
    """Decorator for caching function results"""

    def __init__(self, cache: MultiLayerCacheManager, ttl_seconds: int = 300):
        self.cache = cache
        self.ttl_seconds = ttl_seconds

    def __call__(self, func: Callable) -> Callable:
        async def async_wrapper(*args, **kwargs):
            key_data = {"function": func.__name__, "args": args, "kwargs": kwargs}
            cached_result = self.cache.get(key_data)
            if cached_result is not None:
                return cached_result

            result = await func(*args, **kwargs)
            self.cache.set(key_data, result, self.ttl_seconds)
            return result

        def sync_wrapper(*args, **kwargs):
            key_data = {"function": func.__name__, "args": args, "kwargs": kwargs}
            cached_result = self.cache.get(key_data)
            if cached_result is not None:
                return cached_result

            result = func(*args, **kwargs)
            self.cache.set(key_data, result, self.ttl_seconds)
            return result

        import asyncio

        if asyncio.iscoroutinefunction(func):
            return async_wrapper
        return sync_wrapper


# Global cache instance
cache_manager = MultiLayerCacheManager(
    max_memory_entries=2000,
    default_ttl_seconds=300,
)


# Convenience functions
def cached(ttl_seconds: int = 300):
    """Decorator for caching function results"""
    return CacheDecorator(cache_manager, ttl_seconds)


def get_cache_stats() -> dict[str, Any]:
    """Get cache statistics"""
    return cache_manager.get_stats()


def clear_cache_namespace(namespace: str):
    """Clear all cache entries in a namespace"""
    return cache_manager.clear_namespace(namespace)


def clear_all_cache():
    """Clear all cache entries"""
    return cache_manager.clear_all()
