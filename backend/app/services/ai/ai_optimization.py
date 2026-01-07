"""
AI Model Optimization and Caching Layer
Advanced caching and optimization for AI models and predictions
"""

import hashlib
import json
import logging
import time
from dataclasses import asdict, dataclass
from datetime import datetime, timedelta
from typing import Any

from app.services.infrastructure.cache_service import cache_manager

logger = logging.getLogger(__name__)


@dataclass
class AICacheEntry:
    """Cache entry for AI model results"""

    key: str
    result: Any
    model_version: str
    input_hash: str
    created_at: datetime
    expires_at: datetime
    hit_count: int = 0
    last_accessed: datetime = None
    metadata: dict[str, Any] = None

    def __post_init__(self):
        if self.last_accessed is None:
            self.last_accessed = self.created_at
        if self.metadata is None:
            self.metadata = {}

    def is_expired(self) -> bool:
        """Check if cache entry is expired"""
        return datetime.now() > self.expires_at

    def to_dict(self) -> dict[str, Any]:
        """Convert to dictionary for storage"""
        data = asdict(self)
        data["created_at"] = self.created_at.isoformat()
        data["expires_at"] = self.expires_at.isoformat()
        data["last_accessed"] = self.last_accessed.isoformat()
        return data

    @classmethod
    def from_dict(cls, data: dict[str, Any]) -> "AICacheEntry":
        """Create from dictionary"""
        data["created_at"] = datetime.fromisoformat(data["created_at"])
        data["expires_at"] = datetime.fromisoformat(data["expires_at"])
        data["last_accessed"] = datetime.fromisoformat(data["last_accessed"])
        return cls(**data)


class AIModelCache:
    """Advanced caching system for AI model predictions and results"""

    def __init__(self, cache_ttl_minutes: int = 60, max_cache_size: int = 10000):
        self.cache_ttl_minutes = cache_ttl_minutes
        self.max_cache_size = max_cache_size
        self.cache: dict[str, AICacheEntry] = {}
        self.model_versions: dict[str, str] = {}  # Track model versions

        # Performance metrics
        self.hits = 0
        self.misses = 0
        self.evictions = 0

    def _generate_cache_key(self, model_name: str, inputs: Any, context: dict[str, Any] | None = None) -> str:
        """Generate a unique cache key for the given inputs"""
        # Create input hash
        input_str = json.dumps(inputs, sort_keys=True, default=str)
        if context:
            input_str += json.dumps(context, sort_keys=True, default=str)

        input_hash = hashlib.sha256(input_str.encode()).hexdigest()[:16]

        # Include model version in key for cache invalidation on model updates
        model_version = self.model_versions.get(model_name, "v1")

        return f"ai:{model_name}:{model_version}:{input_hash}"

    def _should_evict(self) -> bool:
        """Check if cache eviction is needed"""
        return len(self.cache) >= self.max_cache_size

    def _evict_lru(self):
        """Evict least recently used entries"""
        if not self.cache:
            return

        # Find entry with oldest last_accessed time
        oldest_key = min(self.cache.keys(), key=lambda k: self.cache[k].last_accessed)

        del self.cache[oldest_key]
        self.evictions += 1
        logger.debug(f"Evicted LRU cache entry: {oldest_key}")

    async def get(self, model_name: str, inputs: Any, context: dict[str, Any] | None = None) -> Any | None:
        """Get cached result if available and valid"""
        cache_key = self._generate_cache_key(model_name, inputs, context)

        # Try memory cache first
        if cache_key in self.cache:
            entry = self.cache[cache_key]

            if entry.is_expired():
                del self.cache[cache_key]
                self.misses += 1
                return None

            # Update access time and hit count
            entry.last_accessed = datetime.now()
            entry.hit_count += 1
            self.hits += 1

            logger.debug(f"Cache hit for {model_name}: {cache_key}")
            return entry.result

        # Try persistent cache
        try:
            cached_data = await cache_manager.get(f"ai_cache:{cache_key}")
            if cached_data:
                entry = AICacheEntry.from_dict(json.loads(cached_data))
                if not entry.is_expired():
                    # Restore to memory cache
                    self.cache[cache_key] = entry
                    entry.last_accessed = datetime.now()
                    entry.hit_count += 1
                    self.hits += 1

                    logger.debug(f"Persistent cache hit for {model_name}: {cache_key}")
                    return entry.result
        except Exception as e:
            logger.warning(f"Error reading from persistent cache: {e}")

        self.misses += 1
        return None

    async def set(
        self,
        model_name: str,
        inputs: Any,
        result: Any,
        context: dict[str, Any] | None = None,
        metadata: dict[str, Any] | None = None,
    ) -> None:
        """Cache a result"""
        cache_key = self._generate_cache_key(model_name, inputs, context)

        # Evict if needed
        if self._should_evict():
            self._evict_lru()

        # Create cache entry
        entry = AICacheEntry(
            key=cache_key,
            result=result,
            model_version=self.model_versions.get(model_name, "v1"),
            input_hash=hashlib.sha256(json.dumps(inputs, sort_keys=True, default=str).encode()).hexdigest()[:16],
            created_at=datetime.now(),
            expires_at=datetime.now() + timedelta(minutes=self.cache_ttl_minutes),
            metadata=metadata or {},
        )

        # Store in memory
        self.cache[cache_key] = entry

        # Store in persistent cache
        try:
            await cache_manager.set(
                f"ai_cache:{cache_key}",
                json.dumps(entry.to_dict()),
                ttl_seconds=self.cache_ttl_minutes * 60,
            )
        except Exception as e:
            logger.warning(f"Error writing to persistent cache: {e}")

        logger.debug(f"Cached result for {model_name}: {cache_key}")

    def update_model_version(self, model_name: str, version: str) -> None:
        """Update model version (invalidates related cache entries)"""
        old_version = self.model_versions.get(model_name)

        if old_version != version:
            # Invalidate cache entries for this model
            keys_to_remove = [k for k in self.cache if f"ai:{model_name}:" in k]
            for key in keys_to_remove:
                del self.cache[key]

            self.model_versions[model_name] = version
            logger.info(f"Updated model version for {model_name}: {old_version} -> {version}")

    def clear_model_cache(self, model_name: str) -> int:
        """Clear all cache entries for a specific model"""
        keys_to_remove = [k for k in self.cache if f"ai:{model_name}:" in k]
        for key in keys_to_remove:
            del self.cache[key]

        logger.info(f"Cleared {len(keys_to_remove)} cache entries for model {model_name}")
        return len(keys_to_remove)

    def clear_all_cache(self) -> int:
        """Clear all cache entries"""
        count = len(self.cache)
        self.cache.clear()
        logger.info(f"Cleared all {count} cache entries")
        return count

    def get_cache_stats(self) -> dict[str, Any]:
        """Get cache performance statistics"""
        total_requests = self.hits + self.misses
        hit_rate = self.hits / total_requests if total_requests > 0 else 0

        return {
            "memory_cache": {
                "entries": len(self.cache),
                "max_size": self.max_cache_size,
                "utilization_percent": (len(self.cache) / self.max_cache_size) * 100,
            },
            "performance": {
                "hits": self.hits,
                "misses": self.misses,
                "total_requests": total_requests,
                "hit_rate_percent": hit_rate * 100,
            },
            "maintenance": {
                "evictions": self.evictions,
                "model_versions": self.model_versions.copy(),
            },
        }


class AIOptimizationManager:
    """Manager for AI model optimizations and caching"""

    def __init__(self):
        self.cache = AIModelCache()
        self.model_metrics: dict[str, dict[str, Any]] = {}
        self.batch_operations: dict[str, list[dict[str, Any]]] = {}

    async def optimize_prediction(self, model_name: str, inputs: Any, context: dict[str, Any] | None = None) -> tuple[bool, Any]:
        """
        Get optimized prediction with caching and batching
        Returns (was_cached, result)
        """
        start_time = time.time()

        # Try cache first
        cached_result = await self.cache.get(model_name, inputs, context)
        if cached_result is not None:
            processing_time = time.time() - start_time
            self._record_metric(model_name, "cache_hit", processing_time)
            return True, cached_result

        # Not in cache - would need actual model prediction here
        # For now, return cache miss indicator
        processing_time = time.time() - start_time
        self._record_metric(model_name, "cache_miss", processing_time)

        return False, None

    async def cache_prediction_result(
        self,
        model_name: str,
        inputs: Any,
        result: Any,
        context: dict[str, Any] | None = None,
        metadata: dict[str, Any] | None = None,
    ) -> None:
        """Cache a prediction result"""
        await self.cache.set(model_name, inputs, result, context, metadata)

    def add_to_batch(self, model_name: str, inputs: Any, context: dict[str, Any] | None = None) -> str:
        """Add prediction request to batch processing queue"""
        batch_id = f"batch_{model_name}_{int(time.time())}_{len(self.batch_operations)}"

        if model_name not in self.batch_operations:
            self.batch_operations[model_name] = []

        self.batch_operations[model_name].append(
            {
                "batch_id": batch_id,
                "inputs": inputs,
                "context": context,
                "added_at": datetime.now(),
            }
        )

        return batch_id

    async def process_batch(self, model_name: str) -> list[dict[str, Any]]:
        """Process batched prediction requests"""
        if model_name not in self.batch_operations:
            return []

        batch = self.batch_operations[model_name]
        if not batch:
            return []

        # Clear the batch
        del self.batch_operations[model_name]

        # Group similar requests for efficiency
        # In a real implementation, this would call the model with batched inputs
        results = []
        for item in batch:
            results.append(
                {
                    "batch_id": item["batch_id"],
                    "result": f"mock_result_for_{model_name}",
                    "processing_time": 0.1,
                    "cached": False,
                }
            )

        logger.info(f"Processed batch of {len(batch)} {model_name} predictions")
        return results

    def _record_metric(self, model_name: str, metric_type: str, value: float) -> None:
        """Record performance metric for a model"""
        if model_name not in self.model_metrics:
            self.model_metrics[model_name] = {
                "cache_hits": 0,
                "cache_misses": 0,
                "avg_cache_hit_time": 0.0,
                "avg_processing_time": 0.0,
                "total_predictions": 0,
            }

        metrics = self.model_metrics[model_name]

        if metric_type == "cache_hit":
            metrics["cache_hits"] += 1
            # Update rolling average
            metrics["avg_cache_hit_time"] = ((metrics["avg_cache_hit_time"] * (metrics["cache_hits"] - 1)) + value) / metrics["cache_hits"]

        elif metric_type == "cache_miss":
            metrics["cache_misses"] += 1
            metrics["avg_processing_time"] = ((metrics["avg_processing_time"] * (metrics["cache_misses"] - 1)) + value) / metrics[
                "cache_misses"
            ]

        metrics["total_predictions"] = metrics["cache_hits"] + metrics["cache_misses"]

    def get_model_stats(self, model_name: str | None = None) -> dict[str, Any]:
        """Get performance statistics"""
        if model_name:
            return self.model_metrics.get(model_name, {})

        # Aggregate stats across all models
        total_stats = {
            "models": list(self.model_metrics.keys()),
            "total_predictions": sum(m.get("total_predictions", 0) for m in self.model_metrics.values()),
            "total_cache_hits": sum(m.get("cache_hits", 0) for m in self.model_metrics.values()),
            "total_cache_misses": sum(m.get("cache_misses", 0) for m in self.model_metrics.values()),
            "cache_hit_rate": 0.0,
        }

        if total_stats["total_predictions"] > 0:
            total_stats["cache_hit_rate"] = total_stats["total_cache_hits"] / total_stats["total_predictions"] * 100

        return {
            **total_stats,
            **self.cache.get_cache_stats(),
            "model_details": self.model_metrics.copy(),
        }

    def optimize_cache_settings(self) -> dict[str, Any]:
        """Dynamically optimize cache settings based on usage patterns"""
        stats = self.get_model_stats()

        recommendations = []

        # Analyze cache hit rate
        hit_rate = stats.get("performance", {}).get("hit_rate_percent", 0)

        if hit_rate < 50:
            recommendations.append(
                {
                    "type": "cache_ttl",
                    "action": "increase",
                    "reason": f"Low cache hit rate ({hit_rate:.1f}%) suggests longer TTL needed",
                    "suggested_ttl_minutes": min(self.cache.cache_ttl_minutes * 1.5, 480),  # Max 8 hours
                }
            )

        elif hit_rate > 90:
            recommendations.append(
                {
                    "type": "cache_ttl",
                    "action": "decrease",
                    "reason": f"Very high cache hit rate ({hit_rate:.1f}%) allows shorter TTL for freshness",
                    "suggested_ttl_minutes": max(self.cache.cache_ttl_minutes * 0.8, 5),  # Min 5 minutes
                }
            )

        # Analyze memory usage
        utilization = stats.get("memory_cache", {}).get("utilization_percent", 0)

        if utilization > 90:
            recommendations.append(
                {
                    "type": "cache_size",
                    "action": "increase",
                    "reason": f"High memory utilization ({utilization:.1f}%) suggests cache size increase needed",
                    "suggested_max_size": int(self.cache.max_cache_size * 1.5),
                }
            )

        return {
            "current_settings": {
                "cache_ttl_minutes": self.cache.cache_ttl_minutes,
                "max_cache_size": self.cache.max_cache_size,
            },
            "performance_stats": stats,
            "recommendations": recommendations,
        }


# Global AI optimization manager
ai_optimizer = AIOptimizationManager()
