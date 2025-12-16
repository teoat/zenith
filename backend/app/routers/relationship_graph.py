# api/relationship_graph.py
import logging
from datetime import datetime, timezone
from typing import Any, Dict, List, Optional

from fastapi import APIRouter, Body, Depends, HTTPException, Query
from sqlalchemy.orm import Session

from app.services.graph_service import relationship_graph as graph_analyzer
from core.database import get_db

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/relationship-graph", tags=["relationship-graph"])


@router.post("/build")
async def build_graph_from_transactions(
    transactions: List[Dict[str, Any]] = Body(...),
    include_historical: bool = True,
    time_window_days: int = 90,
    db: Session = Depends(get_db),
):
    """
    Build relationship graph from transaction data
    """
    try:
        from app.services.graph_service import graph_analyzer

        # Convert transactions to dict format
        transaction_dicts = []
        for tx in transactions:
            transaction_dicts.append(
                {
                    "id": tx.get("id"),
                    "case_id": tx.get("case_id"),
                    "date": tx.get("date"),
                    "amount": float(tx.get("amount", 0)),
                    "currency": tx.get("currency", "USD"),
                    "description": tx.get("description", ""),
                    "merchant_name": tx.get("merchant_name", ""),
                    "merchant_category": tx.get("merchant_category", ""),
                    "transaction_type": tx.get("transaction_type", ""),
                    "country": tx.get("country", ""),
                    "city": tx.get("city", ""),
                    "ip_address": tx.get("ip_address", ""),
                    "device_fingerprint": tx.get("device_fingerprint", ""),
                    "customer_id": tx.get("customer_id", ""),
                    "customer_name": tx.get("customer_name", ""),
                    "customer_email": tx.get("customer_email", ""),
                    "customer_phone": tx.get("customer_phone", ""),
                }
            )

        # Build graph
        result = graph_analyzer.build_graph_from_transactions(transaction_dicts)

        return {
            "success": True,
            "case_id": transactions[0].get("case_id") if transactions else None,
            "graph_statistics": result.get("graph_statistics"),
            "build_timestamp": result.get("build_timestamp"),
            "nodes_count": result.get("nodes"),
            "edges_count": result.get("edges"),
        }

    except Exception as e:
        logger.error(f"Failed to build graph: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Failed to build graph: {str(e)}")


@router.get("/nodes/{node_id}")
async def get_node_details(
    node_id: str,
    include_neighborhood: bool = Query(
        True, description="Include neighborhood analysis"
    ),
    neighborhood_depth: int = Query(2, description="Neighborhood depth"),
    db: Session = Depends(get_db),
):
    """Get detailed node information"""
    try:
        from app.services.graph_service import graph_analyzer

        if node_id not in graph_analyzer.graph.nodes:
            return {"success": False, "error": "Node not found", "node_id": node_id}

        node_data = graph_analyzer.graph.nodes[node_id]

        return {
            "success": True,
            "node_id": node_id,
            "node_data": node_data,
            "timestamp": datetime.now(timezone.utc).isoformat(),
        }

    except Exception as e:
        logger.error(f"Failed to get node details: {str(e)}")
        raise HTTPException(
            status_code=500, detail=f"Failed to get node details: {str(e)}"
        )


@router.get("/paths")
async def find_paths(
    source_id: str = Query(..., description="Source node ID"),
    target_id: str = Query(..., description="Target node ID"),
    max_paths: int = Query(3, description="Maximum number of paths"),
    db: Session = Depends(get_db),
):
    """Find shortest paths between two nodes"""
    try:
        from app.services.graph_service import graph_analyzer

        paths = graph_analyzer.find_shortest_paths(source_id, target_id, max_paths)

        return {
            "success": True,
            "source_id": source_id,
            "target_id": target_id,
            "paths": paths,
            "total_paths_found": len(paths),
            "timestamp": datetime.now(timezone.utc).isoformat(),
        }

    except Exception as e:
        logger.error(f"Failed to find paths: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Failed to find paths: {str(e)}")


@router.get("/suspicious-patterns")
async def get_suspicious_patterns(
    pattern_type: Optional[str] = Query(None, description="Filter by pattern type"),
    min_confidence: float = Query(0.5, description="Minimum confidence threshold"),
    db: Session = Depends(get_db),
):
    """Get suspicious patterns detected in graph"""
    try:
        from app.services.graph_service import graph_analyzer

        patterns = graph_analyzer.find_suspicious_patterns(pattern_type, min_confidence)

        return {
            "success": True,
            "patterns": patterns,
            "total_count": len(patterns),
            "timestamp": datetime.now(timezone.utc).isoformat(),
        }

    except Exception as e:
        logger.error(f"Failed to get suspicious patterns: {str(e)}")
        raise HTTPException(
            status_code=500, detail=f"Failed to get suspicious patterns: {str(e)}"
        )


@router.get("/high-risk-entities")
async def get_high_risk_entities(
    min_risk_score: float = Query(70.0, description="Minimum risk score"),
    limit: int = Query(50, description="Maximum number of entities"),
    db: Session = Depends(get_db),
):
    """Get high-risk entities from graph"""
    try:
        from app.services.graph_service import graph_analyzer

        high_risk_entities = graph_analyzer.get_high_risk_entities(
            min_risk_score, limit
        )

        return {
            "success": True,
            "entities": high_risk_entities,
            "total_count": len(high_risk_entities),
            "timestamp": datetime.now(timezone.utc).isoformat(),
        }

    except Exception as e:
        logger.error(f"Failed to get high-risk entities: {str(e)}")
        raise HTTPException(
            status_code=500, detail=f"Failed to get high-risk entities: {str(e)}"
        )


@router.get("/communities")
async def get_communities(
    min_community_size: int = Query(3, description="Minimum community size"),
    db: Session = Depends(get_db),
):
    """Get communities from graph"""
    try:
        from app.services.graph_service import graph_analyzer

        communities = graph_analyzer.detect_communities(min_community_size)

        return {
            "success": True,
            "communities": communities,
            "total_count": len(communities),
            "timestamp": datetime.now(timezone.utc).isoformat(),
        }

    except Exception as e:
        logger.error(f"Failed to get communities: {str(e)}")
        raise HTTPException(
            status_code=500, detail=f"Failed to get communities: {str(e)}"
        )


@router.get("/graph-statistics")
async def get_graph_statistics(db: Session = Depends(get_db)):
    """Get comprehensive graph statistics"""
    try:
        from app.services.graph_service import graph_analyzer

        stats = graph_analyzer.get_graph_statistics()

        return {
            "success": True,
            "statistics": stats,
            "timestamp": datetime.now(timezone.utc).isoformat(),
        }

    except Exception as e:
        logger.error(f"Failed to get graph statistics: {str(e)}")
        raise HTTPException(
            status_code=500, detail=f"Failed to get graph statistics: {str(e)}"
        )


@router.post("/export")
async def export_graph(
    format: str = Query("json", description="Export format"),
    center_node: Optional[str] = Query(None, description="Center node ID"),
    radius: int = Query(2, description="Radius for visualization"),
    include_neighbors: bool = Query(True, description="Include neighborhood"),
    db: Session = Depends(get_db),
):
    """Export graph data in specified format"""
    try:
        from app.services.graph_service import graph_analyzer

        export_data = graph_analyzer.export_graph(
            format, center_node, radius, include_neighbors
        )

        return {
            "success": True,
            "format": format,
            "data": export_data.get("data"),
            "timestamp": datetime.now(timezone.utc).isoformat(),
        }

    except Exception as e:
        logger.error(f"Failed to export graph: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Failed to export graph: {str(e)}")


@router.get("/visualization-data/{node_id}")
async def get_visualization_data(
    center_node: Optional[str] = Query(None, description="Center node ID"),
    radius: int = Query(2, description="Radius for visualization"),
    db: Session = Depends(get_db),
):
    """Get visualization data for a node"""
    try:
        viz_data = graph_analyzer.get_visualization_data(center_node, radius)

        return {
            "success": True,
            "visualization_data": viz_data,
            "timestamp": datetime.now(timezone.utc).isoformat(),
        }

    except Exception as e:
        logger.error(f"Failed to get visualization data: {str(e)}")
        raise HTTPException(
            status_code=500, detail=f"Failed to get visualization data: {str(e)}"
        )


@router.get("/search")
async def search_graph(
    query: str = Query(..., description="Search query"),
    node_type: Optional[str] = Query(None, description="Filter by node type"),
    limit: int = Query(20, description="Maximum results"),
    db: Session = Depends(get_db),
):
    """Search graph for nodes matching criteria"""
    try:
        from app.services.graph_service import graph_analyzer

        # Simple text search implementation
        matching_nodes = []
        query_lower = query.lower()

        # Search in node labels and properties
        for node_id, node_data in graph_analyzer.graph.nodes(data=True):
            node_label = graph_analyzer._get_node_label(node_id, node_data)
            node_properties = node_data.get("properties", {})
            node_type_val = node_data.get("type", "unknown")

            # Filter by type if requested
            if node_type and node_type.lower() != node_type_val.lower():
                continue

            # Check if query matches
            if query_lower in node_label.lower() or query_lower in str(
                node_properties.get("name", "").lower()
            ):
                matching_nodes.append(
                    {
                        "id": node_id,
                        "label": node_label,
                        "type": node_type_val,
                        "risk_score": graph_analyzer._calculate_node_risk_score(
                            node_id
                        ),
                    }
                )

        # Sort by relevance (risk score for now)
        matching_nodes.sort(key=lambda x: x["risk_score"], reverse=True)

        # Apply limit
        results = matching_nodes[:limit]

        return {
            "success": True,
            "query": query,
            "node_type": node_type,
            "total_matches": len(matching_nodes),
            "results": results,
            "timestamp": datetime.now(timezone.utc).isoformat(),
        }

    except Exception as e:
        logger.error(f"Failed to search graph: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Failed to search graph: {str(e)}")


# Note: graph_analyzer imported from graph_service module
