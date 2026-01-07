import logging

import networkx as nx

logger = logging.getLogger(__name__)


class GraphService:
    """
    Graph Service for relationship analysis.
    Restored/Mocked to allow backend startup.
    """

    def __init__(self):
        self.graph = nx.Graph()

    def build_graph_from_transactions(self, transactions):
        self.graph.clear()
        for t in transactions:
            if "customer_id" in t:
                counterparty = t.get("merchant_name") or t.get("counterparty") or "Unknown"
                self.graph.add_edge(t["customer_id"], counterparty, weight=t.get("amount", 0))
        logger.info(f"Built graph with {self.graph.number_of_nodes()} nodes")
        return self.graph

    def export_graph_data(self, format="json"):
        if format == "json":
            return nx.node_link_data(self.graph)
        return str(self.graph)

    def get_graph_stats(self):
        return {
            "node_count": self.graph.number_of_nodes(),
            "edge_count": self.graph.number_of_edges(),
            "density": nx.density(self.graph) if self.graph.number_of_nodes() > 0 else 0,
        }

    def detect_communities(self):
        return []

    def find_central_entities(self, top_n=10):
        return []

    def find_suspicious_patterns(self):
        return []

    def detect_shell_networks(self, min_community_size=3, max_density=0.9):
        return []


relationship_graph = GraphService()
