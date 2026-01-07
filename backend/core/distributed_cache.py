"""
Distributed Cache System with Redis Integration

Replaces the custom query cache with a proper distributed cache
that supports Redis for production and in-memory fallback for development.
"""

import hashlib
import json
import pickle
import time
from abc import ABC, abstractmethod
from functools import wraps
from typing import Any, Callable, Dict, Optional

from core.logging import logger


class CacheBackend(ABC):
    """Abstract base class for cache backends"""

    @abstractmethod
    async def get(self, key: str) -> Optional[Any]:
        """Get value from cache"""
        pass

    @abstractmethod
    async def set(self, key: str, value: Any, ttl: Optional[int] = None) -> bool:
        """Set value in cache with optional TTL"""
        pass

    @abstractmethod
    async def delete(self, key: str) -> bool:
        """Delete key from cache"""
        pass

    @abstractmethod
    async def exists(self, key: str) -> bool:
        """Check if key exists in cache"""
        pass

    @abstractmethod
    async def clear(self, pattern: Optional[str] = None) -> int:
        """Clear cache keys, optionally by pattern"""
        pass

    @abstractmethod
    async def get_stats(self) -> Dict[str, Any]:
        """Get cache statistics"""
        pass


class InMemoryCache(CacheBackend):
    """In-memory cache backend for development"""

    def __init__(self, max_size: int = 1000):
        self.store: Dict[str, Dict[str, Any]] = {}
        self.max_size = max_size
        self.stats = {
            "hits": 0,
            "misses": 0,
            "sets": 0,
            "deletes": 0,
            "evictions": 0,
        }

    async def get(self, key: str) -> Optional[Any]:
        """Get value from cache"""
        if key not in self.store:
            self.stats["misses"] += 1
            return None

        entry = self.store[key]

        # Check if expired
        if entry.get("expires_at") and time.time() > entry["expires_at"]:
            del self.store[key]
            self.stats["misses"] += 1
            return None

        self.stats["hits"] += 1
        return entry["value"]

    async def set(self, key: str, value: Any, ttl: Optional[int] = None) -> bool:
        """Set value in cache with optional TTL"""
        try:
            # Check if we need to evict entries
            if len(self.store) >= self.max_size and key not in self.store:
                self._evict_oldest()

            expires_at = None
            if ttl:
                expires_at = time.time() + ttl

            self.store[key] = {
                "value": value,
                "created_at": time.time(),
                "expires_at": expires_at,
                "access_count": 0,
            }

            self.stats["sets"] += 1
            return True
        except Exception as e:
            logger.error(f"In-memory cache set failed: {e}")
            return False

    async def delete(self, key: str) -> bool:
        """Delete key from cache"""
        if key in self.store:
            del self.store[key]
            self.stats["deletes"] += 1
            return True
        return False

    async def exists(self, key: str) -> bool:
        """Check if key exists in cache"""
        if key not in self.store:
            return False

        entry = self.store[key]

        # Check if expired
        if entry.get("expires_at") and time.time() > entry["expires_at"]:
            del self.store[key]
            return False

        return True

    async def clear(self, pattern: Optional[str] = None) -> int:
        """Clear cache keys, optionally by pattern"""
        if pattern:
            import fnmatch

            keys_to_delete = [k for k in self.store.keys() if fnmatch.fnmatch(k, pattern)]
        else:
            keys_to_delete = list(self.store.keys())

        for key in keys_to_delete:
            del self.store[key]

        return len(keys_to_delete)

    async def get_stats(self) -> Dict[str, Any]:
        """Get cache statistics"""
        total_requests = self.stats["hits"] + self.stats["misses"]
        hit_ratio = self.stats["hits"] / total_requests if total_requests > 0 else 0

        return {
            **self.stats,
            "total_keys": len(self.store),
            "hit_ratio": hit_ratio,
            "memory_usage_mb": self._estimate_memory_usage(),
        }

    def _evict_oldest(self):
        """Evict the oldest entry based on created_at"""
        if not self.store:
            return

        oldest_key = min(self.store.keys(), key=lambda k: self.store[k]["created_at"])
        del self.store[oldest_key]
        self.stats["evictions"] += 1

    def _estimate_memory_usage(self) -> float:
        """Estimate memory usage in MB (rough estimate)"""
        try:
            total_size = sum(len(pickle.dumps(entry)) for entry in self.store.values())
            return total_size / (1024 * 1024)  # Convert to MB
        except Exception:
            return 0.0


class RedisCache(CacheBackend):
    """Redis cache backend for production"""

    def __init__(self, redis_client, key_prefix: str = "cache:"):
        self.redis = redis_client
        self.key_prefix = key_prefix
        self.stats = {
            "hits": 0,
            "misses": 0,
            "sets": 0,
            "deletes": 0,
            "errors": 0,
        }

    def _make_key(self, key: str) -> str:
        """Create full Redis key with prefix"""
        return f"{self.key_prefix}{key}"

    async def get(self, key: str) -> Optional[Any]:
        """Get value from cache"""
        try:
            redis_key = self._make_key(key)
            value = await self.redis.get(redis_key)

            if value is None:
                self.stats["misses"] += 1
                return None

            # Deserialize value
            try:
                deserialized_value = pickle.loads(value)
                self.stats["hits"] += 1
                return deserialized_value
            except (pickle.PickleError, TypeError):
                # Fallback to JSON if pickle fails
                deserialized_value = json.loads(value)
                self.stats["hits"] += 1
                return deserialized_value

        except Exception as e:
            logger.error(f"Redis cache get failed: {e}")
            self.stats["errors"] += 1
            return None

    async def set(self, key: str, value: Any, ttl: Optional[int] = None) -> bool:
        """Set value in cache with optional TTL"""
        try:
            redis_key = self._make_key(key)

            # Serialize value
            try:
                serialized_value = pickle.dumps(value)
            except (pickle.PickleError, TypeError):
                # Fallback to JSON if pickle fails
                serialized_value = json.dumps(value, default=str)

            # Set with TTL if provided
            if ttl:
                await self.redis.setex(redis_key, ttl, serialized_value)
            else:
                await self.redis.set(redis_key, serialized_value)

            self.stats["sets"] += 1
            return True

        except Exception as e:
            logger.error(f"Redis cache set failed: {e}")
            self.stats["errors"] += 1
            return False

    async def delete(self, key: str) -> bool:
        """Delete key from cache"""
        try:
            redis_key = self._make_key(key)
            result = await self.redis.delete(redis_key)

            if result > 0:
                self.stats["deletes"] += 1
                return True
            return False

        except Exception as e:
            logger.error(f"Redis cache delete failed: {e}")
            self.stats["errors"] += 1
            return False

    async def exists(self, key: str) -> bool:
        """Check if key exists in cache"""
        try:
            redis_key = self._make_key(key)
            result = await self.redis.exists(redis_key)
            return result > 0
        except Exception as e:
            logger.error(f"Redis cache exists failed: {e}")
            self.stats["errors"] += 1
            return False

    async def clear(self, pattern: Optional[str] = None) -> int:
        """Clear cache keys, optionally by pattern"""
        try:
            if pattern:
                search_pattern = self._make_key(pattern)
                keys = await self.redis.keys(search_pattern)
            else:
                search_pattern = self._make_key("*")
                keys = await self.redis.keys(search_pattern)

            if keys:
                await self.redis.delete(*keys)

            return len(keys)

        except Exception as e:
            logger.error(f"Redis cache clear failed: {e}")
            self.stats["errors"] += 1
            return 0

    async def get_stats(self) -> Dict[str, Any]:
        """Get cache statistics"""
        try:
            info = await self.redis.info()
            total_requests = self.stats["hits"] + self.stats["misses"]
            hit_ratio = self.stats["hits"] / total_requests if total_requests > 0 else 0

            return {
                **self.stats,
                "hit_ratio": hit_ratio,
                "redis_memory_used_mb": info.get("used_memory", 0) / (1024 * 1024),
                "redis_connected_clients": info.get("connected_clients", 0),
                "redis_total_commands": info.get("total_commands_processed", 0),
            }
        except Exception as e:
            logger.error(f"Failed to get Redis stats: {e}")
            return {**self.stats, "error": str(e)}


class DistributedCache:
    """Unified distributed cache interface"""

    def __init__(self, backend: CacheBackend):
        self.backend = backend

    async def get(self, key: str) -> Optional[Any]:
        """Get value from cache"""
        return await self.backend.get(key)

    async def set(self, key: str, value: Any, ttl: Optional[int] = None) -> bool:
        """Set value in cache with optional TTL"""
        return await self.backend.set(key, value, ttl)

    async def delete(self, key: str) -> bool:
        """Delete key from cache"""
        return await self.backend.delete(key)

    async def exists(self, key: str) -> bool:
        """Check if key exists in cache"""
        return await self.backend.exists(key)

    async def clear(self, pattern: Optional[str] = None) -> int:
        """Clear cache keys, optionally by pattern"""
        return await self.backend.clear(pattern)

    async def get_stats(self) -> Dict[str, Any]:
        """Get cache statistics"""
        return await self.backend.get_stats()

    def cached(self, ttl: Optional[int] = None, key_prefix: str = ""):
        """Decorator for caching function results"""

        def decorator(func: Callable):
            @wraps(func)
            async def wrapper(*args, **kwargs):
                # Create cache key
                cache_key = self._make_cache_key(func, args, kwargs, key_prefix)

                # Try to get from cache
                cached_result = await self.get(cache_key)
                if cached_result is not None:
                    return cached_result

                # Execute function and cache result
                result = await func(*args, **kwargs)
                await self.set(cache_key, result, ttl)

                return result

            return wrapper

        return decorator

    def _make_cache_key(self, func: Callable, args: tuple, kwargs: dict, prefix: str) -> str:
        """Create a cache key for a function call"""
        # Create a string representation of the function and arguments
        key_data = {
            "func": f"{func.__module__}.{func.__name__}",
            "args": str(args),
            "kwargs": str(sorted(kwargs.items())),
        }

        key_string = json.dumps(key_data, sort_keys=True)
        key_hash = hashlib.md5(key_string.encode()).hexdigest()

        return f"{prefix}{func.__module__}.{func.__name__}:{key_hash}"


# Cache factory function
def create_cache() -> DistributedCache:
    """Create a cache instance with appropriate backend"""
    try:
        import os

        if os.getenv("ENVIRONMENT", "development").lower() == "production":
            # Try to initialize Redis
            import redis.asyncio as redis

            redis_url = os.getenv("REDIS_URL", "redis://localhost:6379")
            redis_client = redis.from_url(redis_url)
            backend = RedisCache(redis_client)
            logger.info("Using Redis for distributed cache")
        else:
            raise ImportError("Use in-memory for development")
    except (ImportError, Exception) as e:
        backend = InMemoryCache(max_size=1000)
        logger.info(f"Using in-memory cache for distributed cache: {e}")

    return DistributedCache(backend)


# Global cache instance
_cache_instance: Optional[DistributedCache] = None


def get_cache() -> DistributedCache:
    """Get the global cache instance"""
    global _cache_instance
    if _cache_instance is None:
        _cache_instance = create_cache()
    return _cache_instance


# Legacy compatibility functions
async def cached_query(ttl: int = 300):
    """Legacy decorator for backward compatibility"""
    cache = get_cache()
    return cache.cached(ttl=ttl)


async def clear_query_cache():
    """Legacy function to clear query cache"""
    cache = get_cache()
    return await cache.clear()


# Export main classes and functions
__all__ = [
    "DistributedCache",
    "CacheBackend",
    "InMemoryCache",
    "RedisCache",
    "create_cache",
    "get_cache",
    # Legacy compatibility
    "cached_query",
    "clear_query_cache",
]
