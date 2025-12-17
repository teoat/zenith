from typing import Optional, Dict, Any, List
from sqlalchemy.orm import Session
from core.plugin_system.models import PluginRegistry, PluginExecution
import importlib
import logging
import asyncio
import time
from datetime import datetime

logger = logging.getLogger(__name__)

class PluginRegistryService:
    def __init__(self, cache_ttl: int = 3600):
        # Enhanced Intelligent Cache with usage tracking
        self._plugin_cache: Dict[str, Dict[str, Any]] = {}
        self._manual_registry: Dict[str, Any] = {}
        self._load_locks: Dict[str, asyncio.Lock] = {}
        self.cache_ttl = cache_ttl

        # Performance metrics for intelligent caching
        self._access_counts: Dict[str, int] = {}
        self._last_access: Dict[str, float] = {}
        self._load_times: Dict[str, float] = {}

        # Batch loading support
        self._batch_queue: List[str] = []
        self._batch_lock = asyncio.Lock()
        self._batch_size = 5  # Load up to 5 plugins concurrently

    def register_manual_plugin(self, plugin_id: str, plugin_instance: Any):
        """Manually register a plugin instance (useful for testing/migration)."""
        expiry = time.time() + self.cache_ttl
        self._plugin_cache[plugin_id] = {'instance': plugin_instance, 'expiry': expiry}
        self._manual_registry[plugin_id] = plugin_instance

    async def get_plugin(self, plugin_id: str, db: Session = None):
        """Get a loaded plugin instance with async locking and intelligent TTL caching."""

        # Track access patterns for intelligent caching
        self._access_counts[plugin_id] = self._access_counts.get(plugin_id, 0) + 1
        self._last_access[plugin_id] = time.time()

        # 1. Check in-memory cache with TTL
        if plugin_id in self._plugin_cache:
            cached = self._plugin_cache[plugin_id]
            if time.time() < cached['expiry']:
                logger.debug(f"Cache hit for plugin {plugin_id}")
                return cached['instance']
            else:
                logger.info(f"Cache expired for plugin {plugin_id}, reloading...")

        # 2. Check manual registry (never expires)
        if plugin_id in self._manual_registry:
            logger.debug(f"Manual registry hit for plugin {plugin_id}")
            return self._manual_registry[plugin_id]

        # 3. Concurrency Safety: Use lock for this specific plugin_id
        if plugin_id not in self._load_locks:
            self._load_locks[plugin_id] = asyncio.Lock()
        
        async with self._load_locks[plugin_id]:
            # Double-check cache after acquiring lock
            if plugin_id in self._plugin_cache:
                cached = self._plugin_cache[plugin_id]
                if time.time() < cached['expiry']:
                    return cached['instance']

            # 4. Load from DB/Filesystem
            if db:
                try:
                    start_time = time.time()

                    plugin_record = db.query(PluginRegistry).filter(
                        (PluginRegistry.namespace == plugin_id) | (PluginRegistry.plugin_id == plugin_id)
                    ).first()

                    if plugin_record:
                        # Dynamically load the plugin module
                        namespace = plugin_record.namespace
                        module_path = "plugins." + namespace.replace("/", ".") + ".plugin"

                        logger.info(f"Attempting to load plugin from {module_path}")
                        
                        # run_in_executor to avoid blocking the event loop with synchronous import
                        loop = asyncio.get_event_loop()
                        module = await loop.run_in_executor(None, importlib.import_module, module_path)
                        
                        plugin_class = getattr(module, "Plugin", None)
                        if not plugin_class:
                             import inspect
                             for name, obj in inspect.getmembers(module):
                                 if inspect.isclass(obj) and name.endswith("Plugin") and name != "PluginInterface":
                                     plugin_class = obj
                                     break
                        
                        if not plugin_class:
                            raise ImportError(f"No Plugin class found in {module_path}")

                        plugin_instance = plugin_class()
                        
                        # Initialize the plugin
                        # Initialize the plugin
                        from core.plugin_system.interface import PluginContext
                        
                        # Inject Core Services (Local import to avoid circular dependencies)
                        services = {}
                        try:
                            from app.services.ai.ai_service import AIService
                            # Check if AIService is a class (needs instantiation) or instance
                            # Based on file view, it's a class but might have a global instance or need one
                            # However, 'ai_service' variable usually implies instance. 
                            # Let's check app/services/ai/__init__.py or usage patterns.
                            # Standard pattern in this project seems to be singletons.
                            # Let's try to get the singleton if it exists, or instantiate.
                            # Looking at main.py: from app.routers.ai import router as ai_router
                            # Let's assume we can instantiate or get a global.
                            # Re-checking ai_service.py view... it has `class AIService`.
                            # It doesn't seem to export a global instance at the bottom like others.
                            # Wait, generic `ai_service` usage in `typology_analysis` expects `semantic_search`.
                            # Let's instantiate a shared one or look for an existing one.
                            # To be safe and consistent with typical DI, we'll instantiate one if needed
                            # OR better, use the one from `app.services.ai.ai_service`.
                            
                            # Let's use a lazy property or similar if possible.
                            # For now, let's instantiate.
                            services['ai_service'] = AIService() # This uses local ./data/vector_store.db
                            await services['ai_service'].initialize()
                            
                            from app.services.infrastructure.storage.database_service import db_service
                            services['db_service'] = db_service
                            
                            from app.services.infrastructure.monitoring_service import monitoring_service
                            services['monitoring_service'] = monitoring_service
                            
                        except ImportError as e:
                            logger.warning(f"Could not inject some services into plugin context: {e}")
                            
                        context = PluginContext(config={}, services=services)
                        
                        if asyncio.iscoroutinefunction(plugin_instance.initialize):
                            await plugin_instance.initialize(context)
                        else:
                            plugin_instance.initialize(context)
                        
                        # Store in cache with expiry and track load time
                        load_time = time.time() - start_time
                        self._load_times[plugin_id] = load_time

                        expiry = time.time() + self.cache_ttl
                        self._plugin_cache[plugin_id] = {
                            'instance': plugin_instance,
                            'expiry': expiry,
                            'load_time': load_time,
                            'loaded_at': time.time()
                        }

                        logger.info(f"Successfully loaded and cached plugin {plugin_id} in {load_time:.2f}s")
                        return plugin_instance
                except Exception as e:
                    logger.error(f"Failed to load plugin {plugin_id}: {e}")
                    raise ImportError(f"Failed to load plugin {plugin_id}: {e}")

        raise ValueError(f"Plugin {plugin_id} not found and no valid DB session provided")

    async def preload_plugins(self, plugin_ids: List[str], db: Session = None) -> Dict[str, Any]:
        """Batch preload multiple plugins asynchronously for better performance."""
        results = {}

        # Process in batches to avoid overwhelming the system
        for i in range(0, len(plugin_ids), self._batch_size):
            batch = plugin_ids[i:i + self._batch_size]
            batch_tasks = [self.get_plugin(plugin_id, db) for plugin_id in batch]
            batch_results = await asyncio.gather(*batch_tasks, return_exceptions=True)

            for plugin_id, result in zip(batch, batch_results):
                if isinstance(result, Exception):
                    logger.error(f"Failed to preload plugin {plugin_id}: {result}")
                    results[plugin_id] = None
                else:
                    results[plugin_id] = result

        return results

    async def warmup_cache(self, frequently_used_plugins: List[str], db: Session = None):
        """Warm up the cache with frequently used plugins."""
        logger.info(f"Warming up cache with {len(frequently_used_plugins)} plugins")

        # Load plugins in background without blocking
        asyncio.create_task(self.preload_plugins(frequently_used_plugins, db))

    def get_cache_stats(self) -> Dict[str, Any]:
        """Get cache performance statistics."""
        total_plugins = len(self._plugin_cache)
        expired_count = sum(1 for cached in self._plugin_cache.values()
                           if time.time() >= cached['expiry'])

        total_accesses = sum(self._access_counts.values())
        avg_load_time = sum(self._load_times.values()) / max(len(self._load_times), 1)

        return {
            'total_cached_plugins': total_plugins,
            'expired_plugins': expired_count,
            'total_accesses': total_accesses,
            'average_load_time_ms': avg_load_time * 1000,
            'cache_hit_rate': self._calculate_cache_hit_rate(),
            'most_accessed_plugins': sorted(self._access_counts.items(),
                                          key=lambda x: x[1], reverse=True)[:5]
        }

    def _calculate_cache_hit_rate(self) -> float:
        """Calculate cache hit rate based on access patterns."""
        if not self._access_counts:
            return 0.0

        cache_hits = sum(1 for plugin_id in self._access_counts.keys()
                        if plugin_id in self._plugin_cache and
                        time.time() < self._plugin_cache[plugin_id]['expiry'])

        total_accesses = sum(self._access_counts.values())
        return cache_hits / total_accesses if total_accesses > 0 else 0.0

    async def cleanup_expired_cache(self):
        """Clean up expired cache entries to free memory."""
        expired_plugins = []
        current_time = time.time()

        for plugin_id, cached in self._plugin_cache.items():
            if current_time >= cached['expiry']:
                expired_plugins.append(plugin_id)

        for plugin_id in expired_plugins:
            del self._plugin_cache[plugin_id]
            logger.debug(f"Cleaned up expired cache for plugin {plugin_id}")

        if expired_plugins:
            logger.info(f"Cleaned up {len(expired_plugins)} expired plugin cache entries")

    async def store_shadow_result(self, result: Any, db: Session = None):
        """Store result in DB."""
        if not db: return 
            
        try:
            execution = PluginExecution(
                plugin_id=result.plugin_id,
                execution_time_ms=int(result.execution_time_ms),
                status="success", 
                # matches_production=result.matches_production # Update schema if needed
            )
            db.add(execution)
            db.commit()
        except Exception as e:
            logger.error(f"Failed to store shadow result: {e}")

plugin_registry_service = PluginRegistryService()
