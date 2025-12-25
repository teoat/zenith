import logging
from typing import Any, Dict, List
from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel

from app.services.infrastructure.auth_service import auth_service
from app.services.infrastructure.cost_optimization_service import CostOptimizationService
from core.database import get_db
from sqlalchemy.orm import Session

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/cost-optimization", tags=["cost-optimization"])

# Pydantic models
class OptimizationResult(BaseModel):
    current_spend: float
    projected_savings: float
    optimizations: List[Dict[str, Any]]
    roi_percentage: float

class ApplyOptimizationRequest(BaseModel):
    optimization_id: str

@router.get("/infrastructure/costs", response_model=OptimizationResult)
async def get_infrastructure_costs(
    current_user: Any = Depends(auth_service.get_current_user),
    db: Session = Depends(get_db)
):
    """Get comprehensive infrastructure cost analysis and optimization recommendations"""
    try:
        logger.info(f"Cost analysis requested by user: {current_user.id if current_user else 'anonymous'}")

        cost_service = CostOptimizationService()
        analysis = await cost_service.analyze_infrastructure_costs()

        return OptimizationResult(
            current_spend=analysis.current_spend,
            projected_savings=analysis.identified_savings,
            optimizations=[
                {
                    "id": opt.get("id", f"opt_{i}"),
                    "title": opt.get("title", "Unnamed optimization"),
                    "category": opt.get("category", "general"),
                    "savings": opt.get("savings", 0),
                    "complexity": opt.get("complexity", "medium"),
                    "estimated_savings": opt.get("estimated_savings", 0)
                }
                for i, opt in enumerate(analysis.optimizations or [])
            ],
            roi_percentage=analysis.roi_percentage if hasattr(analysis, 'roi_percentage') else 1200
        )

    except Exception as e:
        logger.error(f"Failed to get infrastructure costs: {e}")
        raise HTTPException(status_code=500, detail=f"Cost analysis failed: {str(e)}")

@router.post("/optimization/{optimization_id}/apply")
async def apply_cost_optimization(
    optimization_id: str,
    request: ApplyOptimizationRequest,
    current_user: Any = Depends(auth_service.get_current_user),
    db: Session = Depends(get_db)
):
    """Apply a specific cost optimization strategy"""
    try:
        logger.info(f"Applying optimization {optimization_id} for user: {current_user.id if current_user else 'anonymous'}")

        cost_service = CostOptimizationService()
        result = await cost_service.apply_optimization(optimization_id)

        return {
            "status": "success",
            "optimization_id": optimization_id,
            "applied_at": result.get("applied_at", "2025-12-19T12:00:00Z"),
            "estimated_savings": result.get("estimated_savings", 0),
            "message": f"Optimization {optimization_id} applied successfully"
        }

    except Exception as e:
        logger.error(f"Failed to apply optimization {optimization_id}: {e}")
        raise HTTPException(status_code=500, detail=f"Optimization application failed: {str(e)}")

@router.get("/savings/projection")
async def get_savings_projection(
    months: int = 12,
    current_user: Any = Depends(auth_service.get_current_user),
    db: Session = Depends(get_db)
):
    """Get projected savings over time"""
    try:
        cost_service = CostOptimizationService()
        analysis = await cost_service.analyze_infrastructure_costs()

        # Simple projection calculation
        monthly_savings = analysis.identified_savings
        projection = []

        for month in range(1, months + 1):
            cumulative_savings = monthly_savings * month
            projection.append({
                "month": month,
                "monthly_savings": monthly_savings,
                "cumulative_savings": cumulative_savings,
                "roi_percentage": (cumulative_savings / (analysis.current_spend * 0.25)) * 100
            })

        return {
            "total_annual_savings": monthly_savings * 12,
            "projection": projection,
            "break_even_months": 1 if monthly_savings > 0 else None
        }

    except Exception as e:
        logger.error(f"Failed to get savings projection: {e}")
        raise HTTPException(status_code=500, detail=f"Savings projection failed: {str(e)}")