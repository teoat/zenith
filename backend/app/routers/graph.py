import logging
import uuid
from datetime import datetime, timedelta
from typing import Any

from fastapi import APIRouter, Depends, HTTPException, Query
from pydantic import BaseModel
from sqlalchemy import text
from sqlalchemy.orm import Session

from app.services.graph_service import relationship_graph
from app.services.infrastructure.auth_service import auth_service
from app.services.intelligence.metadata_correlation_service import (
    MetadataCorrelationEngine,
)
from core.database import GraphSnapshot, Relationship, User, get_db

logger = logging.getLogger(__name__)
router = APIRouter(prefix="/graph", tags=["relationship-graph"])


# Pydantic models for snapshot endpoints
class GraphSnapshotCreate(BaseModel):
    nodes: list[dict[str, Any]] = []
    links: list[dict[str, Any]] = []
    name: str | None = "Untitled Snapshot"
    description: str | None = None


class GraphSnapshotResponse(BaseModel):
    id: str
    case_id: str
    name: str
    node_count: int
    link_count: int
    created_at: str


@router.post("/snapshot/{case_id}")
async def save_graph_snapshot(
    case_id: str, snapshot_data: GraphSnapshotCreate, db: Session = Depends(get_db)
):
    """Save a graph snapshot for a case"""
    try:
        snapshot_id = str(uuid.uuid4())

        snapshot = GraphSnapshot(
            id=snapshot_id,
            case_id=case_id,
            name=snapshot_data.name or "Untitled Snapshot",
            description=snapshot_data.description,
            nodes=snapshot_data.nodes,
            links=snapshot_data.links,
            node_count=len(snapshot_data.nodes),
            link_count=len(snapshot_data.links),
        )

        db.add(snapshot)
        db.commit()
        db.refresh(snapshot)

        return {
            "success": True,
            "snapshot_id": snapshot_id,
            "message": f"Snapshot saved with {len(snapshot_data.nodes)} nodes and {len(snapshot_data.links)} links",
            "created_at": (
                snapshot.created_at.isoformat()
                if snapshot.created_at
                else datetime.now().isoformat()
            ),
        }

    except Exception as e:
        logger.error(f"Error saving graph snapshot: {e!s}")
        raise HTTPException(status_code=500, detail=f"Failed to save snapshot: {e!s}")


@router.get("/snapshots/{case_id}")
async def get_graph_snapshots(case_id: str, db: Session = Depends(get_db)):
    """Get all graph snapshots for a case"""
    try:
        snapshots = (
            db.query(GraphSnapshot)
            .filter(GraphSnapshot.case_id == case_id)
            .order_by(GraphSnapshot.created_at.desc())
            .all()
        )

        return {
            "case_id": case_id,
            "snapshots": [
                {
                    "id": s.id,
                    "name": s.name,
                    "node_count": s.node_count,
                    "link_count": s.link_count,
                    "created_at": s.created_at.isoformat() if s.created_at else None,
                }
                for s in snapshots
            ],
            "total": len(snapshots),
        }

    except Exception as e:
        logger.error(f"Error getting graph snapshots: {e!s}")
        raise HTTPException(status_code=500, detail=f"Failed to get snapshots: {e!s}")


@router.get("/snapshot/{snapshot_id}")
async def get_graph_snapshot(snapshot_id: str, db: Session = Depends(get_db)):
    """Get a specific graph snapshot by ID"""
    try:
        snapshot = (
            db.query(GraphSnapshot).filter(GraphSnapshot.id == snapshot_id).first()
        )

        if not snapshot:
            raise HTTPException(status_code=404, detail="Snapshot not found")

        return {
            "id": snapshot.id,
            "case_id": snapshot.case_id,
            "name": snapshot.name,
            "description": snapshot.description,
            "nodes": snapshot.nodes,
            "links": snapshot.links,
            "node_count": snapshot.node_count,
            "link_count": snapshot.link_count,
            "created_at": (
                snapshot.created_at.isoformat() if snapshot.created_at else None
            ),
        }

    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error getting graph snapshot: {e!s}")
        raise HTTPException(status_code=500, detail=f"Failed to get snapshot: {e!s}")


@router.post("/build")
async def build_relationship_graph(
    days_back: int = Query(30, description="Number of days to analyze"),
    entity_types: list[str] | None = Query(None, description="Entity types to include"),
):
    """Build relationship graph from transaction data"""
    try:
        # Get transaction data using SQLAlchemy
        db = get_db()
        cutoff_date = (datetime.now() - timedelta(days=days_back)).isoformat()

        query = """
        SELECT
            t.id,
            t.customer_id,
            t.customer_name,
            t.merchant_name,
            t.amount,
            t.date,
            t.merchant_category,
            t.counterparty
        FROM transactions t
        WHERE t.date >= :cutoff_date
        ORDER BY t.date DESC
        """

        result = db.execute(text(query), {"cutoff_date": cutoff_date})
        transactions = []

        for row in result:
            transactions.append(
                {
                    "id": row[0],
                    "customer_id": row[1],
                    "customer_name": row[2],
                    "merchant_name": row[3],
                    "amount": float(row[4]),
                    "date": row[5],
                    "merchant_category": row[6],
                    "counterparty": row[7],
                }
            )

        if not transactions:
            return {
                "message": "No transactions found for the specified period",
                "graph_data": {"nodes": [], "edges": []},
            }

        # Build the graph
        relationship_graph.build_graph_from_transactions(transactions)

        # Export graph data for visualization
        graph_data = relationship_graph.export_graph_data("json")

        # Get graph statistics
        stats = relationship_graph.get_graph_stats()

        return {
            "message": f"Graph built successfully from {len(transactions)} transactions",
            "graph_data": graph_data,
            "stats": stats,
            "period_analyzed": {"days_back": days_back, "cutoff_date": cutoff_date},
        }

    except Exception as e:
        logger.error(f"Error building relationship graph: {e!s}")
        raise HTTPException(status_code=500, detail=f"Failed to build graph: {e!s}")


@router.get("/data")
async def get_graph_data(current_user: User = Depends(auth_service.get_current_user)):
    """Get current graph data for visualization"""
    try:
        graph_data = relationship_graph.export_graph_data("json")
        stats = relationship_graph.get_graph_stats()

        return {"graph_data": graph_data, "stats": stats}

    except Exception as e:
        logger.error(f"Error getting graph data: {e!s}")
        raise HTTPException(status_code=500, detail=f"Failed to get graph data: {e!s}")


@router.get("/communities")
async def detect_communities(
    current_user: User = Depends(auth_service.get_current_user),
):
    """Detect communities in the relationship graph"""
    try:
        communities = relationship_graph.detect_communities()

        # Analyze communities
        community_analysis = []
        for i, community in enumerate(communities):
            community_data = {
                "community_id": i,
                "size": len(community),
                "entities": community,
                "entity_types": {},
            }

            # Count entity types in this community
            for entity_id in community:
                if (
                    hasattr(relationship_graph.graph, "nodes")
                    and entity_id in relationship_graph.graph.nodes
                ):
                    entity_type = relationship_graph.graph.nodes[entity_id].get(
                        "type", "unknown"
                    )
                    community_data["entity_types"][entity_type] = (
                        community_data["entity_types"].get(entity_type, 0) + 1
                    )

            community_analysis.append(community_data)

        return {
            "communities": community_analysis,
            "total_communities": len(communities),
            "largest_community_size": (
                max(len(c) for c in communities) if communities else 0
            ),
        }

    except Exception as e:
        logger.error(f"Error detecting communities: {e!s}")
        raise HTTPException(
            status_code=500, detail=f"Failed to detect communities: {e!s}"
        )


@router.get("/central-entities")
async def get_central_entities(
    top_n: int = Query(10, description="Number of top entities to return"),
):
    """Get most central entities in the graph"""
    try:
        central_entities = relationship_graph.find_central_entities(top_n)

        return {
            "central_entities": central_entities,
            "total_analyzed": len(central_entities),
        }

    except Exception as e:
        logger.error(f"Error getting central entities: {e!s}")
        raise HTTPException(
            status_code=500, detail=f"Failed to get central entities: {e!s}"
        )


@router.get("/suspicious-patterns")
async def get_suspicious_patterns(
    current_user: User = Depends(auth_service.get_current_user),
):
    """Find suspicious patterns in the relationship graph"""
    try:
        suspicious_patterns = relationship_graph.find_suspicious_patterns()

        return {
            "suspicious_patterns": suspicious_patterns,
            "total_patterns": len(suspicious_patterns),
            "analysis_timestamp": datetime.now().isoformat(),
        }

    except Exception as e:
        logger.error(f"Error finding suspicious patterns: {e!s}")
        raise HTTPException(
            status_code=500, detail=f"Failed to find suspicious patterns: {e!s}"
        )


@router.get("/entity/{entity_id}")
async def get_entity_details(entity_id: str):
    """Get detailed information about a specific entity"""
    try:
        if (
            not hasattr(relationship_graph.graph, "nodes")
            or entity_id not in relationship_graph.graph.nodes
        ):
            raise HTTPException(status_code=404, detail=f"Entity {entity_id} not found")

        node_data = relationship_graph.graph.nodes[entity_id]

        # Get connected entities
        neighbors = list(relationship_graph.graph.neighbors(entity_id))
        connections = []

        for neighbor in neighbors:
            edge_data = relationship_graph.graph.edges[entity_id, neighbor]
            neighbor_data = relationship_graph.graph.nodes[neighbor]

            connections.append(
                {
                    "entity_id": neighbor,
                    "label": neighbor_data.get("label", neighbor),
                    "type": neighbor_data.get("type", "unknown"),
                    "relationship": {
                        "weight": edge_data.get("weight", 1),
                        "total_amount": edge_data.get("total_amount", 0),
                        "transaction_count": edge_data.get("transaction_count", 0),
                        "relationship_type": edge_data.get(
                            "relationship_type", "unknown"
                        ),
                    },
                }
            )

        return {
            "entity_id": entity_id,
            "entity_data": node_data,
            "connections": connections,
            "total_connections": len(connections),
        }

    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error getting entity details: {e!s}")
        raise HTTPException(
            status_code=500, detail=f"Failed to get entity details: {e!s}"
        )


@router.get("/path/{source}/{target}")
async def find_shortest_path(source: str, target: str):
    """Find shortest path between two entities"""
    try:
        if not hasattr(relationship_graph.graph, "nodes"):
            raise HTTPException(status_code=400, detail="Graph not built yet")

        if source not in relationship_graph.graph.nodes:
            raise HTTPException(
                status_code=404, detail=f"Source entity {source} not found"
            )

        if target not in relationship_graph.graph.nodes:
            raise HTTPException(
                status_code=404, detail=f"Target entity {target} not found"
            )

        import networkx as nx

        try:
            path = nx.shortest_path(relationship_graph.graph, source, target)
            path_length = len(path) - 1

            # Get path details
            path_details = []
            for i in range(len(path) - 1):
                edge_data = relationship_graph.graph.edges[path[i], path[i + 1]]
                path_details.append(
                    {"from": path[i], "to": path[i + 1], "relationship": edge_data}
                )

            return {
                "path": path,
                "path_length": path_length,
                "path_details": path_details,
                "exists": True,
            }

        except nx.NetworkXNoPath:
            return {
                "path": [],
                "path_length": None,
                "path_details": [],
                "exists": False,
                "message": "No path exists between the specified entities",
            }

    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error finding shortest path: {e!s}")
        raise HTTPException(status_code=500, detail=f"Failed to find path: {e!s}")


@router.get("/export/{format}")
async def export_graph(format: str = "json"):
    """Export graph data in specified format"""
    try:
        if format not in ["json", "graphml"]:
            raise HTTPException(
                status_code=400, detail="Format must be 'json' or 'graphml'"
            )

        export_data = relationship_graph.export_graph_data(format)

        return {
            "export_format": format,
            "export_data": export_data,
            "exported_at": datetime.now().isoformat(),
        }

    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error exporting graph: {e!s}")
        raise HTTPException(status_code=500, detail=f"Failed to export graph: {e!s}")


@router.delete("/clear")
async def clear_graph(current_user: User = Depends(auth_service.get_current_user)):
    """Clear the current relationship graph"""
    try:
        relationship_graph.graph.clear()

        return {
            "message": "Graph cleared successfully",
            "timestamp": datetime.now().isoformat(),
        }

    except Exception as e:
        logger.error(f"Error clearing graph: {e!s}")
        raise HTTPException(status_code=500, detail=f"Failed to clear graph: {e!s}")


@router.get("/search")
async def search_graph(
    query: str = Query(..., description="Search query"),
    node_type: str | None = Query(None, description="Filter by node type"),
    limit: int = Query(20, description="Max results"),
):
    """Search for nodes in the graph"""
    try:
        if not hasattr(relationship_graph.graph, "nodes"):
            return {
                "success": True,
                "query": query,
                "total_matches": 0,
                "results": [],
                "timestamp": datetime.now().isoformat(),
            }

        results = []
        query_lower = query.lower()

        # Iterate over all nodes in the graph
        # Note: In a large graph, this should be optimized with an index
        for node_id, data in relationship_graph.graph.nodes(data=True):
            # Check node type filter
            if node_type and data.get("type") != node_type:
                continue

            # Search in ID, label, and other attributes
            label = data.get("label", str(node_id)).lower()

            if query_lower in str(node_id).lower() or query_lower in label:
                results.append(
                    {
                        "id": str(node_id),
                        "label": data.get("label", str(node_id)),
                        "type": data.get("type", "unknown"),
                        "risk_score": data.get("risk_score", 0),
                    }
                )

                if len(results) >= limit:
                    break

        return {
            "success": True,
            "query": query,
            "node_type": node_type,
            "total_matches": len(results),
            "results": results,
            "timestamp": datetime.now().isoformat(),
        }

    except Exception as e:
        logger.error(f"Error searching graph: {e!s}")
        raise HTTPException(status_code=500, detail=f"Failed to search graph: {e!s}")


@router.get("/{case_id}/correlations")
async def get_metadata_correlations(case_id: str, session: Session = Depends(get_db)):
    """Get all metadata correlations for a case"""
    try:
        engine = MetadataCorrelationEngine(session)
        correlations = engine.find_all_correlations(case_id)

        # Create Relationship records for UI visualization
        for corr in correlations:
            existing = (
                session.query(Relationship)
                .filter(
                    Relationship.source_id == corr["entity_a"],
                    Relationship.target_id == corr["entity_b"],
                    Relationship.relationship_type == corr["metadata_type"],
                )
                .first()
            )

            if not existing:
                rel = Relationship(
                    case_id=case_id,
                    source_id=corr["entity_a"],
                    target_id=corr["entity_b"],
                    relationship_type=corr["metadata_type"],
                    confidence=corr["confidence"],
                    relationship_metadata={
                        "metadata_value": corr["metadata_value"],
                        "reasoning": corr["reasoning"],
                    },
                )
                session.add(rel)

        session.commit()

        return {
            "correlations": correlations,
            "total_found": len(correlations),
        }

    except Exception as e:
        logger.error(f"Error getting metadata correlations: {e!s}")
        raise HTTPException(
            status_code=500, detail=f"Failed to get correlations: {e!s}"
        )
