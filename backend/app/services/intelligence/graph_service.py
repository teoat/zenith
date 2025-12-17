import json
import logging
import os
from collections import defaultdict
from datetime import datetime, timedelta
from typing import Any, Dict, List, Optional, Set

import networkx as nx

logger = logging.getLogger(__name__)


class RelationshipGraph:
    """Builds and analyzes relationship graphs from transaction data"""

    def __init__(self):
        self.graph = nx.Graph()

    def build_graph_from_transactions(
        self, transactions: List[Dict[str, Any]]
    ) -> nx.Graph:
        """Build a relationship graph from transaction data"""
        self.graph.clear()

        # Extract entities (accounts, merchants, individuals)
        entities = self._extract_entities(transactions)

        # Add nodes
        for entity_id, entity_data in entities.items():
            self.graph.add_node(entity_id, **entity_data)

        # Add edges based on transactions
        transaction_edges = self._build_transaction_edges(transactions)

        for edge_data in transaction_edges:
            self.graph.add_edge(
                edge_data["source"], edge_data["target"], **edge_data["attributes"]
            )

        logger.info(
            f"Built graph with {len(self.graph.nodes)} nodes and {len(self.graph.edges)} edges"
        )
        return self.graph

    def _extract_entities(
        self, transactions: List[Dict[str, Any]]
    ) -> Dict[str, Dict[str, Any]]:
        """Extract unique entities from transactions"""
        entities = {}

        for tx in transactions:
            # Customer/Account entity
            customer_id = (
                tx.get("customer_id")
                or tx.get("account_id")
                or f"account_{tx.get('id', 'unknown')}"
            )
            if customer_id not in entities:
                entities[customer_id] = {
                    "type": "account",
                    "label": tx.get("customer_name", customer_id),
                    "total_transactions": 0,
                    "total_amount": 0.0,
                    "first_seen": tx.get("date"),
                    "last_seen": tx.get("date"),
                }

            # Merchant entity
            merchant = tx.get("merchant_name") or tx.get("counterparty")
            if merchant:
                merchant_id = f"merchant_{hash(merchant) % 1000000}"
                if merchant_id not in entities:
                    entities[merchant_id] = {
                        "type": "merchant",
                        "label": merchant,
                        "total_transactions": 0,
                        "total_amount": 0.0,
                        "category": tx.get("merchant_category", "unknown"),
                        "first_seen": tx.get("date"),
                        "last_seen": tx.get("date"),
                    }

            # Update entity stats
            for entity_id in [customer_id, merchant_id] if merchant else [customer_id]:
                if entity_id in entities:
                    entities[entity_id]["total_transactions"] += 1
                    entities[entity_id]["total_amount"] += float(tx.get("amount", 0))
                    entities[entity_id]["last_seen"] = tx.get("date")

        return entities

    def _build_transaction_edges(
        self, transactions: List[Dict[str, Any]]
    ) -> List[Dict[str, Any]]:
        """Build edges representing transaction relationships"""
        edges = []

        # Group transactions by entity pairs
        entity_pairs = defaultdict(list)

        for tx in transactions:
            customer_id = (
                tx.get("customer_id")
                or tx.get("account_id")
                or f"account_{tx.get('id', 'unknown')}"
            )
            merchant = tx.get("merchant_name") or tx.get("counterparty")

            if merchant:
                merchant_id = f"merchant_{hash(merchant) % 1000000}"
                pair_key = tuple(sorted([customer_id, merchant_id]))
                entity_pairs[pair_key].append(tx)

        # Create edges from grouped transactions
        for (entity1, entity2), tx_list in entity_pairs.items():
            total_amount = sum(float(tx.get("amount", 0)) for tx in tx_list)
            transaction_count = len(tx_list)

            # Determine edge direction (customer -> merchant)
            customer_entity = entity1 if entity1.startswith("account_") else entity2
            merchant_entity = entity2 if entity2.startswith("merchant_") else entity1

            edges.append(
                {
                    "source": customer_entity,
                    "target": merchant_entity,
                    "attributes": {
                        "weight": transaction_count,
                        "total_amount": total_amount,
                        "avg_amount": total_amount / transaction_count,
                        "relationship_type": "customer_merchant",
                        "transaction_count": transaction_count,
                        "first_transaction": min(
                            tx.get("date") for tx in tx_list if tx.get("date")
                        ),
                        "last_transaction": max(
                            tx.get("date") for tx in tx_list if tx.get("date")
                        ),
                    },
                }
            )

        return edges

    def detect_communities(self) -> List[List[str]]:
        """Detect communities in the graph using Louvain method"""
        if len(self.graph) == 0:
            return []
        try:
            import community as community_louvain

            partition = community_louvain.best_partition(self.graph)
            communities = defaultdict(list)

            for node, community_id in partition.items():
                communities[community_id].append(node)

            return list(communities.values())

        except ImportError:
            logger.warning("python-louvain not available, using connected components")
            return [
                list(component) for component in nx.connected_components(self.graph)
            ]

    def detect_shell_networks(
        self,
        min_community_size: int = 3,
        max_density: float = 0.9,
        min_internal_ratio: float = 0.7,
    ) -> List[Dict[str, Any]]:
        """
        Detect potential shell company networks using community detection.

        Shell networks are characterized by:
        - Small, tight-knit communities (high internal transaction ratio)
        - Circular transaction patterns
        - Limited external connections

        Args:
            min_community_size: Minimum nodes for a community to be analyzed
            max_density: Maximum density threshold (too dense = natural group)
            min_internal_ratio: Minimum ratio of internal transactions

        Returns:
            List of detected shell network communities with risk scoring
        """
        if len(self.graph) < min_community_size:
            return []

        communities = self.detect_communities()
        shell_networks = []

        for community_id, nodes in enumerate(communities):
            if len(nodes) < min_community_size:
                continue

            # Create subgraph for this community
            subgraph = self.graph.subgraph(nodes)

            # Calculate community density
            density = nx.density(subgraph)

            # Calculate internal vs external edges ratio
            internal_edges = subgraph.number_of_edges()
            total_edges = sum(self.graph.degree(node) for node in nodes) // 2
            external_edges = (
                total_edges - internal_edges if total_edges > internal_edges else 0
            )

            internal_ratio = internal_edges / total_edges if total_edges > 0 else 0

            # Calculate total transaction amounts within community
            internal_amount = sum(
                data.get("total_amount", 0) for _, _, data in subgraph.edges(data=True)
            )

            # Detect circular patterns (cycles) in subgraph
            try:
                cycles = list(nx.simple_cycles(subgraph.to_directed()))
                cycle_count = min(len(cycles), 100)  # Limit for performance
            except:
                cycle_count = 0

            # Calculate shell network risk score
            risk_factors = []
            risk_score = 0.0

            # High internal ratio is suspicious
            if internal_ratio >= min_internal_ratio:
                risk_factors.append(
                    f"High internal transaction ratio: {internal_ratio:.1%}"
                )
                risk_score += 25

            # Presence of cycles indicates circular transactions
            if cycle_count > 0:
                risk_factors.append(
                    f"Circular transaction patterns detected: {cycle_count} cycles"
                )
                risk_score += min(30, cycle_count * 5)

            # Medium density (not too sparse, not too dense)
            if 0.3 <= density <= max_density:
                risk_factors.append(f"Suspicious network density: {density:.2f}")
                risk_score += 15

            # Small tight-knit group
            if len(nodes) <= 10:
                risk_factors.append(f"Small tight-knit group: {len(nodes)} entities")
                risk_score += 10

            # Only include if risk score indicates potential shell network
            if risk_score >= 25:
                # Get entity details
                entity_details = []
                for node in nodes:
                    node_data = self.graph.nodes.get(node, {})
                    entity_details.append(
                        {
                            "entity_id": node,
                            "label": node_data.get("label", node),
                            "type": node_data.get("type", "unknown"),
                            "total_amount": node_data.get("total_amount", 0),
                            "transaction_count": node_data.get("total_transactions", 0),
                        }
                    )

                shell_networks.append(
                    {
                        "community_id": community_id,
                        "entity_count": len(nodes),
                        "entities": entity_details,
                        "density": round(density, 3),
                        "internal_edges": internal_edges,
                        "external_edges": external_edges,
                        "internal_ratio": round(internal_ratio, 3),
                        "internal_amount": internal_amount,
                        "cycle_count": cycle_count,
                        "risk_score": min(100, risk_score),
                        "risk_factors": risk_factors,
                        "severity": (
                            "critical"
                            if risk_score >= 70
                            else "high" if risk_score >= 50 else "medium"
                        ),
                    }
                )

        # Sort by risk score descending
        shell_networks.sort(key=lambda x: x["risk_score"], reverse=True)

        return shell_networks

    def find_central_entities(self, top_n: int = 10) -> List[Dict[str, Any]]:
        """Find most central entities using various centrality measures"""
        if len(self.graph) == 0:
            return []

        # Degree centrality
        degree_centrality = nx.degree_centrality(self.graph)

        # Betweenness centrality
        betweenness_centrality = nx.betweenness_centrality(self.graph)

        # Eigenvector centrality
        eigenvector_centrality = nx.eigenvector_centrality_numpy(self.graph)

        # Combine centrality measures
        entities = []
        for node in self.graph.nodes():
            centrality_score = (
                degree_centrality.get(node, 0) * 0.4
                + betweenness_centrality.get(node, 0) * 0.4
                + eigenvector_centrality.get(node, 0) * 0.2
            )

            entities.append(
                {
                    "entity_id": node,
                    "label": self.graph.nodes[node].get("label", node),
                    "type": self.graph.nodes[node].get("type", "unknown"),
                    "centrality_score": centrality_score,
                    "degree": degree_centrality.get(node, 0),
                    "betweenness": betweenness_centrality.get(node, 0),
                    "eigenvector": eigenvector_centrality.get(node, 0),
                    "total_amount": self.graph.nodes[node].get("total_amount", 0),
                    "transaction_count": self.graph.nodes[node].get(
                        "total_transactions", 0
                    ),
                }
            )

        # Sort by centrality score
        entities.sort(key=lambda x: x["centrality_score"], reverse=True)
        return entities[:top_n]

    def find_suspicious_patterns(self) -> List[Dict[str, Any]]:
        """Find suspicious patterns in the relationship graph"""
        suspicious_patterns = []

        # Find entities with high centrality and unusual transaction patterns
        central_entities = self.find_central_entities(20)

        for entity in central_entities:
            node = entity["entity_id"]
            node_data = self.graph.nodes[node]

            # Check for unusual patterns
            if node_data.get("type") == "merchant":
                # Merchants with very high transaction volume
                if node_data.get("total_transactions", 0) > 100:
                    suspicious_patterns.append(
                        {
                            "type": "high_volume_merchant",
                            "entity": entity,
                            "description": f"Merchant with unusually high transaction volume: {node_data.get('total_transactions')} transactions",
                        }
                    )

            elif node_data.get("type") == "account":
                # Accounts connected to many different merchants
                degree = self.graph.degree(node)
                if degree > 20:
                    suspicious_patterns.append(
                        {
                            "type": "highly_connected_account",
                            "entity": entity,
                            "description": f"Account connected to {degree} different entities",
                        }
                    )

        # Find potential money laundering rings (cycles in the graph)
        try:
            cycles = list(nx.simple_cycles(self.graph))
            if cycles:
                suspicious_patterns.append(
                    {
                        "type": "potential_cycles",
                        "description": f"Found {len(cycles)} potential circular transaction patterns",
                        "cycles": cycles[:5],  # Limit to first 5
                    }
                )
        except:
            pass

        return suspicious_patterns

    def export_graph_data(self, format: str = "json") -> Dict[str, Any]:
        """Export graph data for visualization"""
        if format == "json":
            nodes = []
            for node_id, node_data in self.graph.nodes(data=True):
                nodes.append(
                    {
                        "id": node_id,
                        "label": node_data.get("label", node_id),
                        "type": node_data.get("type", "unknown"),
                        "size": max(
                            10, min(50, node_data.get("total_transactions", 1) * 2)
                        ),
                        "total_amount": node_data.get("total_amount", 0),
                        "transaction_count": node_data.get("total_transactions", 0),
                        **node_data,
                    }
                )

            edges = []
            for source, target, edge_data in self.graph.edges(data=True):
                edges.append(
                    {
                        "source": source,
                        "target": target,
                        "weight": edge_data.get("weight", 1),
                        "total_amount": edge_data.get("total_amount", 0),
                        "transaction_count": edge_data.get("transaction_count", 0),
                        **edge_data,
                    }
                )

            return {
                "nodes": nodes,
                "edges": edges,
                "metadata": {
                    "node_count": len(nodes),
                    "edge_count": len(edges),
                    "generated_at": datetime.now().isoformat(),
                },
            }

        elif format == "graphml":
            # Export as GraphML for tools like Gephi
            import tempfile

            with tempfile.NamedTemporaryFile(
                mode="w", suffix=".graphml", delete=False
            ) as f:
                nx.write_graphml(self.graph, f.name)
                with open(f.name, "r") as rf:
                    content = rf.read()
                os.unlink(f.name)
                return {"graphml": content}

        return {}

    def get_graph_stats(self) -> Dict[str, Any]:
        """Get comprehensive statistics about the graph"""
        if len(self.graph) == 0:
            return {"empty": True}

        # Basic stats
        stats = {
            "node_count": len(self.graph.nodes),
            "edge_count": len(self.graph.edges),
            "density": nx.density(self.graph),
            "average_degree": sum(dict(self.graph.degree()).values()) / len(self.graph),
            "connected_components": nx.number_connected_components(self.graph),
        }

        # Node type distribution
        node_types = {}
        for node, data in self.graph.nodes(data=True):
            node_type = data.get("type", "unknown")
            node_types[node_type] = node_types.get(node_type, 0) + 1
        stats["node_types"] = node_types

        # Edge weight distribution
        edge_weights = [
            data.get("weight", 1) for _, _, data in self.graph.edges(data=True)
        ]
        if edge_weights:
            stats["avg_edge_weight"] = sum(edge_weights) / len(edge_weights)
            stats["max_edge_weight"] = max(edge_weights)
            stats["min_edge_weight"] = min(edge_weights)

        # Centrality measures
        try:
            stats["diameter"] = nx.diameter(self.graph)
        except:
            stats["diameter"] = None  # Graph might not be connected

        return stats


# Global instance
relationship_graph = RelationshipGraph()
