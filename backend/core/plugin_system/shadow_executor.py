import asyncio
import time
from typing import Any, Dict, Callable
from dataclasses import dataclass
from datetime import datetime
from app.services.infrastructure.monitoring_service import monitoring_service
from core.plugin_system.registry import plugin_registry_service
import logging

logger = logging.getLogger(__name__)

@dataclass
class ShadowResult:
    plugin_id: str
    execution_time_ms: float
    matches_production: bool
    match_percentage: float
    production_result: Any
    shadow_result: Any
    differences: Dict[str, Any]
    timestamp: datetime

class ShadowExecutor:
    """
    Execute plugins in shadow mode:
    - Run plugin alongside production code
    - Compare results
    - Log discrepancies
    - Zero production impact
    """
    
    def __init__(self, metrics_service, registry_service):
        self.metrics = metrics_service
        self.registry = registry_service
        self.comparison_threshold = 0.99  # 99% match required
        
    async def execute_with_shadow(
        self,
        plugin_id: str,
        production_function: Callable,
        input_data: Dict[str, Any],
        comparison_function: Callable = None,
        db_session = None
    ) -> Any:
        """
        Execute production code + plugin in parallel.
        ALWAYS return production result.
        """
        # Execute production code
        start_time = time.time()
        
        # Check if production_function is async
        if asyncio.iscoroutinefunction(production_function):
            production_result = await production_function(input_data)
        else:
            production_result = production_function(input_data)
            
        production_time_ms = (time.time() - start_time) * 1000
        
        # Execute shadow plugin (non-blocking, fire-and-forget)
        asyncio.create_task(
            self._execute_shadow(
                plugin_id=plugin_id,
                input_data=input_data,
                expected_result=production_result,
                expected_time_ms=production_time_ms,
                comparison_function=comparison_function,
                db_session=db_session
            )
        )
        
        # ALWAYS return production result
        return production_result
    
    async def _execute_shadow(
        self,
        plugin_id: str,
        input_data: Dict[str, Any],
        expected_result: Any,
        expected_time_ms: float,
        comparison_function: Callable = None,
        db_session = None
    ):
        """Execute and compare shadow plugin (background task)"""
        try:
            # Load plugin
            plugin = await self.registry.get_plugin(plugin_id, db=db_session)
            
            # Execute with timeout (2x production time or min 1s)
            timeout = max(expected_time_ms * 2 / 1000, 1.0)
            
            start_time = time.time()
            shadow_result = await asyncio.wait_for(
                plugin.execute(input_data),
                timeout=timeout
            )
            shadow_time_ms = (time.time() - start_time) * 1000
            
            # Compare results
            if comparison_function:
                matches, match_pct, diffs = comparison_function(
                    expected_result, shadow_result
                )
            else:
                matches, match_pct, diffs = self._default_comparison(
                    expected_result, shadow_result
                )
            
            # Record metrics
            result = ShadowResult(
                plugin_id=plugin_id,
                execution_time_ms=shadow_time_ms,
                matches_production=matches,
                match_percentage=match_pct,
                production_result=expected_result,
                shadow_result=shadow_result,
                differences=diffs,
                timestamp=datetime.utcnow()
            )
            
            await self._record_shadow_result(result, db_session)
            
            # Alert if significant discrepancy
            if match_pct < self.comparison_threshold:
                self.metrics.record_error(
                    "shadow_mismatch",
                    f"Shadow plugin {plugin_id} mismatch ({match_pct:.2f})",
                    {"plugin_id": plugin_id, "diffs": str(diffs)}
                )
            
        except asyncio.TimeoutError:
            self.metrics.record_error("shadow_timeout", f"Shadow execution timed out for {plugin_id}")
        except Exception as e:
            logger.error(f"Shadow execution error for {plugin_id}: {e}")
            self.metrics.record_error("shadow_error", str(e), {"plugin_id": plugin_id})
    
    def _default_comparison(self, expected: Any, actual: Any) -> tuple:
        """Default result comparison"""
        if expected == actual:
            return True, 1.0, {}
        
        # For dict results, calculate field-level match
        if isinstance(expected, dict) and isinstance(actual, dict):
            total_fields = len(expected)
            matching_fields = sum(
                1 for k in expected 
                if k in actual and expected[k] == actual[k]
            )
            
            match_pct = matching_fields / total_fields if total_fields > 0 else 0.0
            
            diffs = {
                k: {'expected': expected.get(k), 'actual': actual.get(k)}
                for k in set(expected.keys()) | set(actual.keys())
                if expected.get(k) != actual.get(k)
            }
            
            return match_pct >= self.comparison_threshold, match_pct, diffs
        
        # Binary match for non-dict results
        return False, 0.0, {'expected': str(expected), 'actual': str(actual)}
    
    async def _record_shadow_result(self, result: ShadowResult, db_session):
        """Store shadow execution results for analysis"""
        self.metrics.record_metric(
            "shadow.match_rate", 
            1.0 if result.matches_production else 0.0, 
            {"plugin_id": result.plugin_id}
        )
        self.metrics.record_metric(
            "shadow.execution_time", 
            result.execution_time_ms, 
            {"plugin_id": result.plugin_id}
        )
        
        # Store in database for analysis
        # await self.registry.store_shadow_result(result, db=db_session)

shadow_executor = ShadowExecutor(monitoring_service, plugin_registry_service)
