"""
AI Services API Endpoints
Integrated AI-powered services for cognitive automation, predictive intelligence, and collaboration
"""

import json
import logging
from datetime import UTC, datetime
from typing import Any

from fastapi import APIRouter, BackgroundTasks, Depends, HTTPException
from pydantic import BaseModel
from sqlalchemy.exc import SQLAlchemyError

from app.models.ai_models import AIDecision, AIInteraction
from app.services.infrastructure.auth_service import auth_service
from core.autonomous_scaling import scaling_engine
from core.cognitive_automation import DecisionType, cognitive_engine
from core.database import SessionLocal
from core.human_ai_collaboration import collaboration_engine
from core.predictive_intelligence import predictive_engine

logger = logging.getLogger(__name__)

router = APIRouter()

# AI Service permission definitions
AI_SERVICE_PERMISSIONS = {
    "make_cognitive_decision": ["admin", "analyst", "superuser"],
    "generate_predictive_insights": ["admin", "analyst", "superuser"],
    "human_ai_interaction": ["admin", "analyst", "user", "superuser"],
    "optimize_scaling": ["admin", "superuser"],
}

# Premium AI services requiring additional subscription
PREMIUM_SERVICES = ["make_cognitive_decision"]


async def validate_ai_access(user_id: int, service_type: str) -> dict[str, Any]:
    """
    Validate user has access to AI services.

    Returns dict with 'allowed' (bool), 'reason' (str), and optionally 'upgrade_required' (bool).
    """
    # Simplified access check - uses auth_service
    # In production, this would check the user's role and subscription tier
    try:
        user = auth_service.get_current_user_info(user_id)

        if not user:
            return {"allowed": False, "reason": "User not found"}

        user_role = user.get("role", "user")
        user_tier = user.get("subscription_tier", "free")

        # Check if service requires specific permissions
        allowed_roles = AI_SERVICE_PERMISSIONS.get(service_type, ["admin", "superuser"])

        if user_role in allowed_roles:
            # Check if premium service
            if service_type in PREMIUM_SERVICES and user_tier == "free":
                return {
                    "allowed": True,
                    "reason": f"Access granted for {service_type}",
                    "upgrade_required": True,
                    "message": "Premium service - upgrade for full functionality"
                }
            return {"allowed": True, "reason": f"Access granted for {service_type}"}

        return {
            "allowed": False,
            "reason": f"Role '{user_role}' does not have permission for '{service_type}'"
        }

    except Exception as e:
        logger.error(f"Error validating AI access for user {user_id}: {e}")
        # Fail open for development - deny access on error
        return {"allowed": False, "reason": f"Error validating access: {e!s}"}


# Pydantic Models
class CognitiveDecisionRequest(BaseModel):
    decision_type: str
    data: dict[str, Any]
    context: dict[str, Any] = {}


class PredictiveRequest(BaseModel):
    forecast_type: str
    data: dict[str, Any]


class CollaborationRequest(BaseModel):
    input: str
    context: dict[str, Any] = {}


class ScalingRequest(BaseModel):
    resource_type: str
    analysis_scope: str = "comprehensive"


@router.post("/cognitive/decision")
async def make_cognitive_decision(
    request: CognitiveDecisionRequest,
    background_tasks: BackgroundTasks,
    current_user = Depends(auth_service.get_current_user),
):
    """Make an automated cognitive decision"""
    # Validate AI access permissions
    access_result = await validate_ai_access(current_user["id"], "make_cognitive_decision")
    if not access_result.get("allowed"):
        raise HTTPException(status_code=403, detail=access_result.get("reason", "AI service access denied"))

    try:
        decision_type = DecisionType(request.decision_type)

        result = await cognitive_engine.make_automated_decision(
            decision_type, request.data, {**request.context, "user_id": current_user["id"]}
        )

        # Store decision in background
        background_tasks.add_task(
            store_cognitive_decision,
            decision_id=result.decision_id,
            decision_type=result.decision_type.value,
            confidence_level=result.confidence_level.value,
            decision=result.decision,
            reasoning=result.reasoning,
            evidence=result.evidence,
            alternatives=result.alternatives,
            risk_assessment=result.risk_assessment,
            model_version=result.model_version,
            processing_time=result.processing_time,
            human_override_required=result.human_override_required,
            user_id=current_user.id,
        )

        response = {
            "decision_id": result.decision_id,
            "decision": result.decision,
            "confidence": result.confidence_level.value,
            "reasoning": result.reasoning,
            "human_override_required": result.human_override_required,
        }

        # Include upgrade warning if applicable
        if access_result.get("upgrade_required"):
            response["upgrade_warning"] = access_result.get("message")

        return response

    except ValueError as e:
        raise HTTPException(status_code=400, detail=f"Invalid decision type: {e!s}")
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Cognitive decision failed: {e!s}")


@router.post("/predictive/insights")
async def generate_predictive_insights(
    request: PredictiveRequest, current_user = Depends(auth_service.get_current_user)
):
    """Generate predictive business insights"""
    # Validate AI access permissions
    access_result = await validate_ai_access(current_user["id"], "generate_predictive_insights")
    if not access_result.get("allowed"):
        raise HTTPException(status_code=403, detail=access_result.get("reason", "Predictive insights access denied"))

    try:
        insight = await predictive_engine.generate_business_forecast(
            request.forecast_type, request.data
        )

        return {
            "insight_id": insight.insight_id,
            "prediction": insight.prediction,
            "confidence_interval": insight.confidence_interval,
            "business_impact": insight.business_impact,
            "recommendations": insight.recommended_actions,
            "timeframe": insight.timeframe,
        }

    except Exception as e:
        raise HTTPException(
            status_code=500, detail=f"Predictive analysis failed: {e!s}"
        )


@router.post("/collaboration/interact")
async def human_ai_interaction(
    request: CollaborationRequest,
    background_tasks: BackgroundTasks,
    current_user = Depends(auth_service.get_current_user),
):
    """Process human-AI collaboration interaction"""
    # Validate AI access permissions
    access_result = await validate_ai_access(current_user["id"], "human_ai_interaction")
    if not access_result.get("allowed"):
        raise HTTPException(status_code=403, detail=access_result.get("reason", "AI collaboration access denied"))

    try:
        import uuid
        start_time = datetime.now(UTC)

        response = await collaboration_engine.process_user_interaction(
            current_user.id,
            request.input,
            {**request.context, "user_id": current_user.id},
        )

        processing_time = (datetime.now(UTC) - start_time).total_seconds()

        # Store interaction in background
        background_tasks.add_task(
            store_ai_interaction,
            interaction_id=f"collab_{uuid.uuid4().hex[:16]}",
            interaction_type="user_query",
            user_input=request.input,
            ai_response=str(response),
            context={**request.context, "user_id": current_user.id},
            collaboration_mode="interactive",
            confidence_score=response.get("confidence", 0.8),
            processing_time=processing_time,
            user_id=current_user.id,
        )

        return response

    except Exception as e:
        raise HTTPException(status_code=500, detail=f"AI collaboration failed: {e!s}")


@router.post("/scaling/optimize")
async def optimize_scaling(
    request: ScalingRequest, current_user = Depends(auth_service.get_current_user)
):
    """Run autonomous scaling optimization"""
    # Validate AI access permissions
    access_result = await validate_ai_access(current_user["id"], "optimize_scaling")
    if not access_result.get("allowed"):
        raise HTTPException(status_code=403, detail=access_result.get("reason", "Scaling access denied"))

    try:
        if request.resource_type == "all":
            report = await scaling_engine.run_autonomous_scaling_cycle()
        else:
            # Optimize specific resource
            report = await scaling_engine.optimize_resource_allocation()

        return {
            "optimization_report": report,
            "timestamp": report.get("cycle_timestamp", "completed"),
        }

    except Exception as e:
        raise HTTPException(
            status_code=500, detail=f"Scaling optimization failed: {e!s}"
        )


@router.get("/health/ai")
async def ai_services_health():
    """Get AI services health status"""
    try:
        health_status = {
            "cognitive_engine": "healthy",
            "predictive_engine": "healthy",
            "scaling_engine": "healthy",
            "collaboration_engine": "healthy",
            "overall_status": "healthy",
        }

        # Check if services are responsive
        try:
            cognitive_metrics = cognitive_engine.get_performance_metrics()
            health_status["cognitive_decisions"] = cognitive_metrics["total_decisions"]
        except Exception:
            health_status["cognitive_engine"] = "unhealthy"

        try:
            predictive_metrics = predictive_engine.get_predictive_performance_metrics()
            health_status["predictive_insights"] = predictive_metrics["total_insights"]
        except Exception:
            health_status["predictive_engine"] = "unhealthy"

        try:
            scaling_report = scaling_engine.get_resource_utilization_report()
            health_status["scaling_resources"] = (
                len(scaling_report) - 1
            )  # Exclude system_health
        except Exception:
            health_status["scaling_engine"] = "unhealthy"

        try:
            collaboration_metrics = collaboration_engine.get_collaboration_metrics()
            health_status["collaboration_sessions"] = collaboration_metrics[
                "total_interactions"
            ]
        except Exception:
            health_status["collaboration_engine"] = "unhealthy"

        # Determine overall status
        unhealthy_services = [k for k, v in health_status.items() if v == "unhealthy"]
        if unhealthy_services:
            health_status["overall_status"] = "degraded"
            health_status["unhealthy_services"] = unhealthy_services

        return health_status

    except Exception as e:
        return {"overall_status": "unhealthy", "error": str(e)}


async def store_cognitive_decision(
    decision_id: str,
    decision_type: str,
    confidence_level: str,
    decision: str,
    reasoning: list[str],
    evidence: dict[str, Any],
    alternatives: list[dict[str, Any]],
    risk_assessment: dict[str, Any],
    model_version: str,
    processing_time: float,
    human_override_required: bool,
    user_id: int,
    tenant_id: int = 1,
):
    """
    Store cognitive decision in database.

    Persists AI-generated decisions for audit trail and future reference.
    """
    db = SessionLocal()
    try:
        ai_decision = AIDecision(
            decision_id=decision_id,
            decision_type=decision_type,
            confidence_level=confidence_level,
            decision=decision,
            reasoning=json.dumps(reasoning),
            evidence=json.dumps(evidence),
            alternatives=json.dumps(alternatives),
            risk_assessment=json.dumps(risk_assessment),
            model_version=model_version,
            processing_time=processing_time,
            human_override_required=human_override_required,
            user_id=user_id,
            tenant_id=tenant_id,
            created_at=datetime.now(UTC),
        )

        db.add(ai_decision)
        db.commit()
        logger.info(f"Stored cognitive decision: {decision_id} for user {user_id}")

    except SQLAlchemyError as e:
        db.rollback()
        logger.error(f"Failed to store cognitive decision {decision_id}: {e}")
    finally:
        db.close()


async def store_ai_interaction(
    interaction_id: str,
    interaction_type: str,
    user_input: str,
    ai_response: str,
    context: dict[str, Any],
    collaboration_mode: str,
    confidence_score: float,
    processing_time: float,
    user_id: int,
    tenant_id: int = 1,
):
    """Store human-AI interaction in database."""
    db = SessionLocal()
    try:
        interaction = AIInteraction(
            interaction_id=interaction_id,
            user_id=user_id,
            tenant_id=tenant_id,
            interaction_type=interaction_type,
            user_input=user_input,
            ai_response=ai_response,
            context=json.dumps(context),
            collaboration_mode=collaboration_mode,
            confidence_score=confidence_score,
            processing_time=processing_time,
            created_at=datetime.now(UTC),
        )

        db.add(interaction)
        db.commit()
        logger.info(f"Stored AI interaction: {interaction_id}")

    except SQLAlchemyError as e:
        db.rollback()
        logger.error(f"Failed to store AI interaction {interaction_id}: {e}")
    finally:
        db.close()


# Export router
__all__ = ["router"]
