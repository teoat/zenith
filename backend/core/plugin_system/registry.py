from typing import Optional, Dict, Any, List
from sqlalchemy.orm import Session
from core.plugin_system.models import PluginRegistry, PluginExecution
import importlib
import logging

logger = logging.getLogger(__name__)

class PluginRegistryService:
    def __init__(self):
        self._plugin_cache = {} # In-memory cache of loaded plugin instances
        self._manual_registry = {} # For manually registered plugins during migration

    def register_manual_plugin(self, plugin_id: str, plugin_instance: Any):
        """
        Manually register a plugin instance (useful for testing/migration).
        """
        self._plugin_cache[plugin_id] = plugin_instance
        self._manual_registry[plugin_id] = plugin_instance

    async def get_plugin(self, plugin_id: str, db: Session = None):
        """
        Get a loaded plugin instance.
        """
        # 1. Check in-memory cache
        if plugin_id in self._plugin_cache:
            return self._plugin_cache[plugin_id]
        
        # 2. Check manual registry
        if plugin_id in self._manual_registry:
            return self._manual_registry[plugin_id]

        # 3. If not loaded, check registry DB (if db provided)
        if db:
            try:
                plugin_record = db.query(PluginRegistry).filter(PluginRegistry.namespace == plugin_id).first()
                if not plugin_record:
                    plugin_record = db.query(PluginRegistry).filter(PluginRegistry.plugin_id == plugin_id).first()
                
                if plugin_record:
                    # Dynamically load the plugin module
                    # Assumes namespace maps to python path: plugins.publisher.domain.category.plugin_name.plugin
                    namespace = plugin_record.namespace
                    # sanitize namespace to module path
                    module_path = "plugins." + namespace.replace("/", ".") + ".plugin"
                    
                    logger.info(f"Attempting to load plugin from {module_path}")
                    
                    module = importlib.import_module(module_path)
                    
                    # Expect a class matching the plugin name or specific convention
                    # We look for a class ending in 'Plugin' or check standard name
                    plugin_class = getattr(module, "Plugin", None)
                    if not plugin_class:
                         # try to find any class inheriting from PluginInterface? 
                         # For now, expect 'Plugin' class or 'CryptoFraudDetectorPlugin' etc
                         # Simpler: Inspect module for class with Plugin in name
                         import inspect
                         for name, obj in inspect.getmembers(module):
                             if inspect.isclass(obj) and name.endswith("Plugin") and name != "PluginInterface":
                                 plugin_class = obj
                                 break
                    
                    if not plugin_class:
                        raise ImportError(f"No Plugin class found in {module_path}")

                    plugin_instance = plugin_class()
                    
                    # Initialize the plugin
                    from core.plugin_system.interface import PluginContext
                    import asyncio
                    
                    # Create context (In real system, fetch config from DB/Env)
                    context = PluginContext(
                        config={}, 
                        services={} 
                    )
                    
                    # Initialize
                    if asyncio.iscoroutinefunction(plugin_instance.initialize):
                        await plugin_instance.initialize(context)
                    else:
                        plugin_instance.initialize(context)
                    
                    self._plugin_cache[plugin_id] = plugin_instance
                    return plugin_instance
            except Exception as e:
                logger.error(f"Failed to load plugin {plugin_id}: {e}")
                raise ImportError(f"Failed to load plugin {plugin_id}: {e}")

        raise ValueError(f"Plugin {plugin_id} not found in cache and no DB session provided")

    async def store_shadow_result(self, result: Any, db: Session = None):
        """
        Store result in DB.
        """
        if not db:
            return 
            
        try:
            # result is a ShadowResult dataclass
            execution = PluginExecution(
                plugin_id=result.plugin_id,
                execution_time_ms=int(result.execution_time_ms),
                status="success", 
                # matches_production is not in PluginExecution model directly, 
                # but we can store it in metadata or update model if needed. 
                # Model has input/output hashes etc.
                # For now just basic log
            )
            db.add(execution)
            db.commit()
        except Exception as e:
            logger.error(f"Failed to store shadow result: {e}")

plugin_registry_service = PluginRegistryService()
