"""Redis caching service for database queries"""

import functools
import hashlib
import json
import logging
from typing import Any, Callable, Optional, TypeVar, Union

try:
    import redis

    REDIS_AVAILABLE = True
except ImportError:
    REDIS_AVAILABLE = False

logger = logging.getLogger(__name__)

T = TypeVar("T")


class CacheService:
    def __init__(self, host: str = "localhost", port: int = 6379, db: int = 0):
        if REDIS_AVAILABLE:
            try:
                self.redis_client = redis.Redis(
                    host=host, port=port, db=db, decode_responses=True, socket_connect_timeout=1
                )
                self.redis_client.ping()
                self.enabled = True
            except (redis.ConnectionError, Exception) as e:
                logger.warning(f"Redis not available: {e}. Caching disabled.")
                self.redis_client = None
                self.enabled = False
        else:
            self.redis_client = None
            self.enabled = False
            logger.warning("Redis library not installed, caching disabled")

    def _generate_key(self, prefix: str, *args, **kwargs) -> str:
        """Generate cache key from arguments"""
        # Create a stable string representation of args and kwargs
        key_parts = [prefix]
        if args:
            key_parts.append(str(args))
        if kwargs:
            key_parts.append(json.dumps(kwargs, sort_keys=True, default=str))
            
        key_data = ":".join(key_parts)
        return hashlib.md5(key_data.encode()).hexdigest()

    def get(self, key: str) -> Optional[Any]:
        """Get value from cache"""
        if not self.enabled:
            return None

        try:
            value = self.redis_client.get(key)
            if value:
                return json.loads(value)
        except Exception as e:
            logger.warning(f"Cache get error: {e}")
        return None

    def set(self, key: str, value: Any, ttl: int = 300):
        """Set value in cache with TTL (default 5 minutes)"""
        if not self.enabled:
            return

        try:
            self.redis_client.setex(key, ttl, json.dumps(value, default=str))
        except Exception as e:
            logger.warning(f"Cache set error: {e}")

    def delete(self, key: str):
        """Delete key from cache"""
        if not self.enabled:
            return

        try:
            self.redis_client.delete(key)
        except Exception as e:
            logger.warning(f"Cache delete error: {e}")

    def invalidate_pattern(self, pattern: str):
        """Invalidate all keys matching pattern"""
        if not self.enabled:
            return

        try:
            keys = list(self.redis_client.scan_iter(match=pattern))
            if keys:
                self.redis_client.delete(*keys)
        except Exception as e:
            logger.warning(f"Cache invalidation error: {e}")


# Global cache instance
cache_service = CacheService()


def redis_cache(ttl: int = 300, prefix: str = None):
    """
    Decorator for caching function results in Redis
    
    Args:
        ttl: Time to live in seconds (default 300)
        prefix: Optional prefix for cache key (default: function name)
    """
    def decorator(func: Callable[..., T]) -> Callable[..., T]:
        @functools.wraps(func)
        def wrapper(*args, **kwargs) -> T:
            if not cache_service.enabled:
                return func(*args, **kwargs)
                
            # Generate cache key
            key_prefix = prefix or func.__name__
            cache_key = cache_service._generate_key(key_prefix, *args, **kwargs)
            
            # Try to get from cache
            cached_value = cache_service.get(cache_key)
            if cached_value is not None:
                return cached_value
                
            # Execute function
            result = func(*args, **kwargs)
            
            # Cache result
            if result is not None:
                cache_service.set(cache_key, result, ttl)
                
            return result
            
        @functools.wraps(func)
        async def async_wrapper(*args, **kwargs) -> T:
            if not cache_service.enabled:
                return await func(*args, **kwargs)
                
            # Generate cache key
            key_prefix = prefix or func.__name__
            cache_key = cache_service._generate_key(key_prefix, *args, **kwargs)
            
            # Try to get from cache
            cached_value = cache_service.get(cache_key)
            if cached_value is not None:
                return cached_value
                
            # Execute function
            result = await func(*args, **kwargs)
            
            # Cache result
            if result is not None:
                cache_service.set(cache_key, result, ttl)
                
            return result

        # Return appropriate wrapper based on sync/async
        import asyncio
        if asyncio.iscoroutinefunction(func):
            return async_wrapper
        return wrapper
        
    return decorator
