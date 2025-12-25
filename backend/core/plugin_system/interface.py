from abc import ABC, abstractmethod
from typing import Dict, Any, List, Optional
from dataclasses import dataclass

@dataclass
class PluginMetadata:
    name: str
    version: str
    namespace: str
    author: str
    description: str
    dependencies: Dict[str, str] # name: version_constraint
    capabilities: List[str]      # ['fraud_detection', 'ui_component']
    security_level: str          # 'official', 'verified', 'community', 'custom'
    api_version: str

@dataclass
class PluginContext:
    config: Dict[str, Any]
    services: Dict[str, Any] # Map of service accessors
    
    def get_service(self, name: str) -> Any:
        return self.services.get(name)

class PluginInterface(ABC):
    """
    Base interface for all plugins.
    """
    
    @property
    @abstractmethod
    def metadata(self) -> PluginMetadata:
        pass

    @abstractmethod
    async def initialize(self, context: PluginContext) -> bool:
        """Initialize with injected dependencies"""
        pass

    @abstractmethod
    async def execute(self, *args, **kwargs) -> Any:
        """Main execution method"""
        pass

    @abstractmethod
    async def cleanup(self) -> None:
        """Cleanup resources"""
        pass
    
    @abstractmethod
    def validate_config(self, config: Dict[str, Any]) -> List[str]:
        """Validate plugin configuration"""
        pass
