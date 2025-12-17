from core.plugin_system import PluginInterface, PluginMetadata, PluginContext
from typing import Dict, Any, List
import logging

logger = logging.getLogger(__name__)

class RoundRobinAssignerPlugin(PluginInterface):
    """
    Assigns cases to agents in a round-robin fashion.
    """
    
    @property
    def metadata(self) -> PluginMetadata:
        return PluginMetadata(
            name="round_robin_assigner",
            version="1.0.0",
            namespace="378x492/workflow/round_robin_assigner",
            author="378x492 Team",
            description="Assigns cases to agents in a round-robin fashion",
            dependencies={},
            capabilities=["workflow", "assignment"],
            security_level="official",
            api_version="v1"
        )
    
    async def initialize(self, context: PluginContext) -> bool:
        self.context = context
        self.counter = 0
        return True
    
    async def execute(self, inputs: Dict[str, Any]) -> Dict[str, Any]:
        """
        Assigns a case.
        Inputs: {"case_id": "123", "agents": ["Alice", "Bob", "Charlie"]}
        """
        agents = inputs.get("agents", [])
        if not agents:
            return {"error": "No agents provided"}
            
        # Simplistic Round Robin
        assigned_agent = agents[self.counter % len(agents)]
        self.counter += 1
        
        logger.info(f"🔄 [AssignmentPlugin] Assigned case {inputs.get('case_id')} to {assigned_agent}")
        
        return {
            "assigned_agent": assigned_agent,
            "strategy": "round_robin"
        }

    async def cleanup(self) -> None:
        pass

    def validate_config(self, config: Dict[str, Any]) -> List[str]:
        return []
