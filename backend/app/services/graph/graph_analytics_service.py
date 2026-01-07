# Advanced Graph Analytics Service with Neo4j Integration
import asyncio
import json
from collections import defaultdict
from dataclasses import dataclass
from datetime import UTC, datetime
from typing import Any, Dict, List

import networkx as nx

from core.logging import logger

# Try to import Neo4j driver, fallback to in-memory if not available
try:
    from neo4j import GraphDatabase

    NEO4J_AVAILABLE = True
except ImportError:
    NEO4J_AVAILABLE = False
    logger.warning("Neo4j driver not available, using in-memory graph fallback")


@dataclass
class GraphNode:
    """Graph node representation"""

    id: str
    label: str
    properties: Dict[str, Any]
    node_type: str  # 'entity', 'transaction', 'alert', etc.


@dataclass
class GraphEdge:
    """Graph edge representation"""

    source: str
    target: str
    relationship: str
    properties: Dict[str, Any]
    weight: float = 1.0


@dataclass
class Community:
    """Community detection result"""

    id: str
    nodes: List[str]
    size: int
    density: float
    central_node: str


@dataclass
class CentralityResult:
    """Centrality analysis result"""

    node_id: str
    centrality_score: float
    ranking: int


class Neo4jGraphService:
    """Neo4j-based graph service"""

    def __init__(self, uri: str, user: str, password: str):
        if not NEO4J_AVAILABLE:
            raise RuntimeError("Neo4j driver not available")

        self.driver = GraphDatabase.driver(uri, auth=(user, password))
        self.database = "neo4j"

    async def close(self):
        """Close the driver connection"""
        await asyncio.get_event_loop().run_in_executor(None, self.driver.close)

    async def create_node(self, node: GraphNode) -> bool:
        """Create a node in Neo4j"""

        def _create_node(tx, node):
            query = f"""
            CREATE (n:{node.node_type} {{
                id: $id,
                label: $label,
                properties: $properties
            }})
            """
            tx.run(query, id=node.id, label=node.label, properties=json.dumps(node.properties))
            return True

        try:
            await asyncio.get_event_loop().run_in_executor(
                None, lambda: self.driver.execute_query(_create_node, node, database_=self.database)
            )
            return True
        except Exception as e:
            logger.error(f"Failed to create node {node.id}: {e}")
            return False

    async def create_relationship(self, edge: GraphEdge) -> bool:
        """Create a relationship between nodes"""

        def _create_relationship(tx, edge):
            query = f"""
            MATCH (a {{id: $source_id}}), (b {{id: $target_id}})
            CREATE (a)-[r:{edge.relationship} {{
                properties: $properties,
                weight: $weight
            }}]->(b)
            """
            tx.run(query, source_id=edge.source, target_id=edge.target, properties=json.dumps(edge.properties), weight=edge.weight)
            return True

        try:
            await asyncio.get_event_loop().run_in_executor(
                None, lambda: self.driver.execute_query(_create_relationship, edge, database_=self.database)
            )
            return True
        except Exception as e:
            logger.error(f"Failed to create relationship {edge.source}->{edge.target}: {e}")
            return False

    async def run_community_detection(self) -> List[Community]:
        """Run Louvain community detection algorithm"""

        def _community_detection(tx):

            # Run Louvain algorithm
            louvain_query = """
            CALL gds.louvain.stream('fraudGraph')
            YIELD nodeId, communityId, intermediateCommunityIds
            RETURN gds.util.asNode(nodeId).id AS nodeId,
                   communityId,
                   intermediateCommunityIds
            """

            communities = defaultdict(list)
            results = tx.run(louvain_query)

            for record in results:
                communities[record["communityId"]].append(record["nodeId"])

            return communities

        try:
            communities_data = await asyncio.get_event_loop().run_in_executor(
                None, lambda: self.driver.execute_query(_community_detection, database_=self.database)
            )

            communities = []
            for comm_id, nodes in communities_data[0].items():
                communities.append(
                    Community(
                        id=str(comm_id),
                        nodes=nodes,
                        size=len(nodes),
                        density=self._calculate_density(nodes),
                        central_node=nodes[0] if nodes else "",
                    )
                )

            return communities

        except Exception as e:
            logger.error(f"Community detection failed: {e}")
            return []

    def _calculate_density(self, nodes: List[str]) -> float:
        """Calculate community density"""
        # Simplified density calculation
        return min(1.0, len(nodes) / 100.0)


class InMemoryGraphService:
    """Fallback in-memory graph service using NetworkX"""

    def __init__(self):
        self.graph = nx.Graph()
        self.node_data = {}
        self.edge_data = {}

    async def create_node(self, node: GraphNode) -> bool:
        """Create a node in the in-memory graph"""
        try:
            self.graph.add_node(node.id, **node.properties)
            self.node_data[node.id] = node
            return True
        except Exception as e:
            logger.error(f"Failed to create node {node.id}: {e}")
            return False

    async def create_relationship(self, edge: GraphEdge) -> bool:
        """Create a relationship between nodes"""
        try:
            self.graph.add_edge(edge.source, edge.target, relationship=edge.relationship, weight=edge.weight, **edge.properties)
            self.edge_data[(edge.source, edge.target)] = edge
            return True
        except Exception as e:
            logger.error(f"Failed to create relationship {edge.source}->{edge.target}: {e}")
            return False

    async def run_community_detection(self) -> List[Community]:
        """Run community detection using NetworkX"""
        try:
            # Use greedy modularity maximization
            communities = list(nx.algorithms.community.greedy_modularity_communities(self.graph))

            result = []
            for i, community_nodes in enumerate(communities):
                nodes_list = list(community_nodes)

                # Calculate density (ratio of actual to possible edges)
                subgraph = self.graph.subgraph(nodes_list)
                density = nx.density(subgraph)

                # Find most central node
                if len(nodes_list) > 1:
                    centrality = nx.degree_centrality(subgraph)
                    central_node = max(centrality, key=centrality.get)
                else:
                    central_node = nodes_list[0] if nodes_list else ""

                result.append(Community(id=f"comm_{i}", nodes=nodes_list, size=len(nodes_list), density=density, central_node=central_node))

            return result

        except Exception as e:
            logger.error(f"In-memory community detection failed: {e}")
            return []

    async def calculate_centrality(self, method: str = "degree") -> List[CentralityResult]:
        """Calculate node centrality"""
        try:
            if method == "degree":
                centrality = nx.degree_centrality(self.graph)
            elif method == "betweenness":
                centrality = nx.betweenness_centrality(self.graph)
            elif method == "closeness":
                centrality = nx.closeness_centrality(self.graph)
            elif method == "eigenvector":
                centrality = nx.eigenvector_centrality(self.graph, max_iter=100)
            else:
                centrality = nx.degree_centrality(self.graph)

            # Sort by centrality score
            sorted_nodes = sorted(centrality.items(), key=lambda x: x[1], reverse=True)

            results = []
            for rank, (node_id, score) in enumerate(sorted_nodes[:20]):  # Top 20
                results.append(CentralityResult(node_id=node_id, centrality_score=score, ranking=rank + 1))

            return results

        except Exception as e:
            logger.error(f"Centrality calculation failed: {e}")
            return []

    async def find_shortest_paths(self, source: str, target: str, max_paths: int = 5) -> List[List[str]]:
        """Find shortest paths between nodes"""
        try:
            paths = list(nx.all_shortest_paths(self.graph, source, target))
            return paths[:max_paths]
        except Exception as e:
            logger.error(f"Shortest path finding failed: {e}")
            return []


class AdvancedGraphAnalyticsService:
    """Main service for advanced graph analytics"""

    def __init__(self):
        self.graph_service = None
        self._initialize_graph_service()

    def _initialize_graph_service(self):
        """Initialize the appropriate graph service"""
        # Try Neo4j first
        neo4j_config = {"uri": "bolt://localhost:7687", "user": "neo4j", "password": "password"}

        if NEO4J_AVAILABLE:
            try:
                self.graph_service = Neo4jGraphService(neo4j_config["uri"], neo4j_config["user"], neo4j_config["password"])
                logger.info("Using Neo4j graph service")
                return
            except Exception as e:
                logger.warning(f"Neo4j connection failed: {e}")

        # Fallback to in-memory
        self.graph_service = InMemoryGraphService()
        logger.info("Using in-memory graph service (Neo4j not available)")

    async def add_entity(self, entity_id: str, entity_type: str, properties: Dict[str, Any]) -> bool:
        """Add an entity to the graph"""
        node = GraphNode(id=entity_id, label=f"{entity_type}: {entity_id}", properties=properties, node_type="Entity")
        return await self.graph_service.create_node(node)

    async def add_transaction(self, transaction_id: str, from_entity: str, to_entity: str, amount: float, timestamp: datetime) -> bool:
        """Add a transaction relationship to the graph"""
        # Create transaction node
        transaction_node = GraphNode(
            id=transaction_id,
            label=f"Transaction: ${amount}",
            properties={"amount": amount, "timestamp": timestamp.isoformat(), "currency": "USD"},
            node_type="Transaction",
        )

        success1 = await self.graph_service.create_node(transaction_node)

        # Create relationships
        edge1 = GraphEdge(source=from_entity, target=transaction_id, relationship="INITIATED", properties={"role": "sender"})

        edge2 = GraphEdge(source=transaction_id, target=to_entity, relationship="TRANSFERRED_TO", properties={"role": "receiver"})

        success2 = await self.graph_service.create_relationship(edge1)
        success3 = await self.graph_service.create_relationship(edge2)

        return success1 and success2 and success3

    async def detect_communities(self) -> Dict[str, Any]:
        """Run community detection analysis"""
        communities = await self.graph_service.run_community_detection()

        # Sort by size
        communities.sort(key=lambda x: x.size, reverse=True)

        return {
            "total_communities": len(communities),
            "largest_community": communities[0].size if communities else 0,
            "average_community_size": sum(c.size for c in communities) / len(communities) if communities else 0,
            "communities": [
                {
                    "id": c.id,
                    "size": c.size,
                    "density": c.density,
                    "central_node": c.central_node,
                    "nodes_sample": c.nodes[:5],  # First 5 nodes
                }
                for c in communities[:10]  # Top 10 communities
            ],
        }

    async def analyze_centrality(self, method: str = "degree") -> Dict[str, Any]:
        """Analyze node centrality"""
        if not hasattr(self.graph_service, "calculate_centrality"):
            return {"error": "Centrality analysis not available for current graph service"}

        results = await self.graph_service.calculate_centrality(method)

        return {
            "method": method,
            "top_nodes": [{"node_id": r.node_id, "centrality_score": r.centrality_score, "ranking": r.ranking} for r in results],
        }

    async def find_suspicious_patterns(self) -> List[Dict[str, Any]]:
        """Find suspicious patterns in the graph"""
        # This would implement various fraud detection patterns
        patterns = []

        # Pattern 1: Circular transactions (money laundering indicator)
        # Pattern 2: High-velocity transactions
        # Pattern 3: Connections to known risky entities

        # Mock patterns for demonstration
        patterns.append(
            {
                "type": "circular_transaction",
                "severity": "high",
                "description": "Detected circular transaction pattern",
                "involved_nodes": ["entity_1", "entity_2", "entity_3"],
                "confidence": 0.85,
            }
        )

        patterns.append(
            {
                "type": "high_velocity",
                "severity": "medium",
                "description": "Unusual transaction velocity detected",
                "involved_nodes": ["entity_5"],
                "confidence": 0.72,
            }
        )

        return patterns

    async def get_graph_statistics(self) -> Dict[str, Any]:
        """Get overall graph statistics"""
        # This would query the graph for statistics
        return {
            "total_nodes": 150,  # Mock data
            "total_relationships": 450,
            "node_types": {"Entity": 120, "Transaction": 25, "Alert": 5},
            "relationship_types": {"RELATED_TO": 200, "TRANSFERRED_TO": 150, "TRIGGERED_BY": 100},
            "last_updated": datetime.now(UTC).isoformat(),
        }


# Global instance
