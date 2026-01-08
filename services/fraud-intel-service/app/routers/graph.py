"""
Graph analysis router
"""

from fastapi import APIRouter

router = APIRouter()


@router.post("/build")
async def build_graph():
    """Build relationship graph from transaction data"""
    return {"message": "Graph building endpoint - to be implemented"}


@router.post("/query")
async def query_graph():
    """Query graph for patterns and relationships"""
    return {"message": "Graph query endpoint - to be implemented"}
