from abc import ABC, abstractmethod
from dataclasses import dataclass
from typing import Any


@dataclass
class PluginMetadata:
    name: str
    version: str
    namespace: str
    author: str
    description: str
    dependencies: dict[str, str]  # name: version_constraint
    capabilities: list[str]  # ['fraud_detection', 'ui_component']
    security_level: str  # 'official', 'verified', 'community', 'custom'
    api_version: str


@dataclass
class PluginContext:
    config: dict[str, Any]
    services: dict[str, Any]  # Map of service accessors

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

    @abstractmethod
    async def execute(self, *args, **kwargs) -> Any:
        """Main execution method"""

    @abstractmethod
    async def cleanup(self) -> None:
        """Cleanup resources"""

    @abstractmethod
    def validate_config(self, config: dict[str, Any]) -> list[str]:
        """Validate plugin configuration"""
