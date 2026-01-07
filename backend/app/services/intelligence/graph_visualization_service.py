"""Graph visualization helpers and API-friendly utilities.
Provides snapshot export and basic node/edge extraction.
"""

from typing import Any


class GraphVisualizationService:
    def __init__(self):
        pass

    def extract_nodes_edges(self, case_data: dict[str, Any]) -> dict[str, list[dict[str, Any]]]:
        # Minimal extraction: treat entities as nodes and relationships as edges if present
        nodes = []
        edges = []

        for ent in case_data.get("entities", []):
            nodes.append({"id": ent.get("id") or ent.get("name"), "label": ent.get("name")})

        for rel in case_data.get("relationships", []):
            edges.append(
                {
                    "source": rel.get("source"),
                    "target": rel.get("target"),
                    "type": rel.get("type"),
                }
            )

        return {"nodes": nodes, "edges": edges}

    def export_snapshot(self, graph: dict[str, Any]) -> dict[str, Any]:
        # Simple JSON-serializable snapshot
        return {"snapshot": graph, "exported_at": None}
