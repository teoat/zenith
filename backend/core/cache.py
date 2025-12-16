"""Redis caching service for database queries"""
import json
from typing import Any, Optional
import hashlib

try:
    import redis
    REDIS_AVAILABLE = True
except ImportError:
    REDIS_AVAILABLE = False

class CacheService:
    def __init__(self, host: str = 'localhost', port: int = 6379, db: int = 0):
        if REDIS_AVAILABLE:
            self.redis_client = redis.Redis(
                host=host,
                port=port,
                db=db,
                decode_responses=True
            )
            self.enabled = True
        else:
            self.redis_client = None
            self.enabled = False
            print("Redis not available, caching disabled")
    
    def _generate_key(self, prefix: str, *args, **kwargs) -> str:
        """Generate cache key from arguments"""
        key_data = f"{prefix}:{json.dumps(args)}:{json.dumps(kwargs, sort_keys=True)}"
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
            print(f"Cache get error: {e}")
        return None
    
    def set(self, key: str, value: Any, ttl: int = 300):
        """Set value in cache with TTL (default 5 minutes)"""
        if not self.enabled:
            return
        
        try:
            self.redis_client.setex(
                key,
                ttl,
                json.dumps(value)
            )
        except Exception as e:
            print(f"Cache set error: {e}")
    
    def delete(self, key: str):
        """Delete key from cache"""
        if not self.enabled:
            return
        
        try:
            self.redis_client.delete(key)
        except Exception as e:
            print(f"Cache delete error: {e}")
    
    def invalidate_pattern(self, pattern: str):
        """Invalidate all keys matching pattern"""
        if not self.enabled:
            return
        
        try:
            for key in self.redis_client.scan_iter(match=pattern):
                self.redis_client.delete(key)
        except Exception as e:
            print(f"Cache invalidation error: {e}")

# Global cache instance
cache_service = CacheService()
