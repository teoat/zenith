from core.plugin_system import PluginInterface, PluginMetadata, PluginContext
from typing import Dict, Any, List, Set
import logging
from dataclasses import dataclass

logger = logging.getLogger(__name__)

@dataclass
class EntityLinkageConfig:
    connection_threshold: int

class EntityLinkagePlugin(PluginInterface):
    """
    Analyzes connections between entities to find clusters and hubs.
    """
    
    @property
    def metadata(self) -> PluginMetadata:
        return PluginMetadata(
            name="entity_linkage",
            version="1.0.0",
            namespace="378x492/intelligence/entity_linkage",
            author="378x492 Team",
            description="Analyzes relationships and connections between entities in a case",
            dependencies={},
            capabilities=["intelligence", "case_analysis"],
            security_level="official",
            api_version="v1"
        )
    
    async def initialize(self, context: PluginContext) -> bool:
        self.context = context
        config_dict = context.config if context.config else {
            "connection_threshold": 3
        }
        self.config = EntityLinkageConfig(**config_dict)
        return True
    
    async def execute(self, inputs: Dict[str, Any]) -> Dict[str, Any]:
        """
        Expects {"case_data": {...}}
        """
        case_data = inputs.get("case_data")
        if not case_data:
            return {"error": "No case data provided"}
            
        return await self._analyze_entity_linkage(case_data)

    async def _analyze_entity_linkage(
        self, case_data: Dict[str, Any]
    ) -> Dict[str, Any]:
        """Analyze entity relationships and linkages"""
        insights = []
        recommendations = []
        confidence = 0.0

        entities = case_data.get("entities", [])
        transactions = case_data.get("transactions", [])

        if entities and transactions:
            # Build entity graph
            entity_connections = {}

            for transaction in transactions:
                sender = transaction.get("sender")
                receiver = transaction.get("receiver")

                if sender and receiver:
                    if sender not in entity_connections:
                        entity_connections[sender] = set()
                    if receiver not in entity_connections:
                        entity_connections[receiver] = set()

                    entity_connections[sender].add(receiver)
                    entity_connections[receiver].add(sender)

            # Find highly connected entities
            for entity, connections in entity_connections.items():
                if len(connections) >= self.config.connection_threshold:
                    insights.append(
                        f"Entity '{entity}' connected to {len(connections)} other entities"
                    )
                    recommendations.append(
                        f"Investigate entity '{entity}' for central role in network"
                    )
                    confidence += 0.5

            # Find isolated clusters
            visited = set()
            clusters = []

            for entity in entity_connections:
                if entity not in visited:
                    cluster = set()
                    self._dfs(entity, entity_connections, visited, cluster)
                    clusters.append(cluster)

            if len(clusters) > 1:
                insights.append(f"Found {len(clusters)} separate entity clusters")
                recommendations.append(
                    "Analyze each cluster for independent fraud schemes"
                )
                confidence += 0.4

        return {
            "insights": insights,
            "recommendations": recommendations,
            "confidence": min(confidence, 1.0),
            "risk_score": 50 if confidence > 0.5 else 20,
        }

    def _dfs(
        self, entity: str, connections: Dict[str, set], visited: set, cluster: set
    ):
        """Depth-first search for connected components"""
        visited.add(entity)
        cluster.add(entity)

        for neighbor in connections.get(entity, set()):
            if neighbor not in visited:
                self._dfs(neighbor, connections, visited, cluster)

    async def cleanup(self) -> None:
        pass

    def validate_config(self, config: Dict[str, Any]) -> List[str]:
        return []
