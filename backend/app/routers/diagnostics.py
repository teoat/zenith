import logging
from typing import Any

from app.services.core.auth_service import auth_service
from app.services.diagnostics.diagnostic_service import DiagnosticService
from fastapi import APIRouter, Depends, HTTPException

from app.services.core.implementation_pipeline_service import pipeline_service
from app.services.core.investigation_workflow_service import investigation_service
from app.services.core.orchestration_notification_service import (
    orchestration_notification_service,
)
from app.services.core.sync_protocol_service import sync_protocol_service
from app.services.scoring.automated_scoring_system import scoring_system

logger = logging.getLogger(__name__)

# Use instance method for dependency
get_current_user = auth_service.get_current_user

router = APIRouter(prefix="/diagnostics", tags=["diagnostics"])


@router.get("/health")
async def get_system_health(current_user=Depends(get_current_user)):
    """
    Get comprehensive system health diagnostics.
    """
    diagnostic_service = DiagnosticService()
    try:
        health_report = await diagnostic_service.run_comprehensive_diagnostics()
        return health_report
    except Exception as e:
        logger.error(f"Diagnostic service error: {e}")
        raise HTTPException(status_code=500, detail="Diagnostic service unavailable")


@router.get("/ai-ml-performance")
async def get_ai_ml_diagnostics(current_user=Depends(get_current_user)):
    """
    Get AI/ML performance diagnostics.
    """
    diagnostic_service = DiagnosticService()
    try:
        return await diagnostic_service.diagnose_ai_ml_performance()
    except Exception as e:
        logger.error(f"AI/ML diagnostics error: {e}")
        raise HTTPException(status_code=500, detail="AI/ML diagnostics unavailable")


@router.get("/data-quality")
async def get_data_quality_diagnostics(current_user=Depends(get_current_user)):
    """
    Get data quality diagnostics.
    """
    diagnostic_service = DiagnosticService()
    try:
        return await diagnostic_service.diagnose_data_quality()
    except Exception as e:
        logger.error(f"Data quality diagnostics error: {e}")
        raise HTTPException(status_code=500, detail="Data quality diagnostics unavailable")


@router.get("/user-experience")
async def get_user_experience_diagnostics(current_user=Depends(get_current_user)):
    """
    Get user experience diagnostics.
    """
    diagnostic_service = DiagnosticService()
    try:
        return await diagnostic_service.diagnose_user_experience()
    except Exception as e:
        logger.error(f"User experience diagnostics error: {e}")
        raise HTTPException(status_code=500, detail="User experience diagnostics unavailable")


@router.get("/scalability")
async def get_scalability_diagnostics(current_user=Depends(get_current_user)):
    """
    Get scalability diagnostics.
    """
    diagnostic_service = DiagnosticService()
    try:
        return await diagnostic_service.diagnose_scalability()
    except Exception as e:
        logger.error(f"Scalability diagnostics error: {e}")
        raise HTTPException(status_code=500, detail="Scalability diagnostics unavailable")


@router.get("/compliance")
async def get_compliance_diagnostics(current_user=Depends(get_current_user)):
    """
    Get compliance diagnostics.
    """
    diagnostic_service = DiagnosticService()
    try:
        return await diagnostic_service.diagnose_compliance()
    except Exception as e:
        logger.error(f"Compliance diagnostics error: {e}")
        raise HTTPException(status_code=500, detail="Compliance diagnostics unavailable")


@router.get("/integration-health")
async def get_integration_health_diagnostics(current_user=Depends(get_current_user)):
    """
    Get integration health diagnostics.
    """
    diagnostic_service = DiagnosticService()
    try:
        return await diagnostic_service.diagnose_integration_health()
    except Exception as e:
        logger.error(f"Integration health diagnostics error: {e}")
        raise HTTPException(status_code=500, detail="Integration health diagnostics unavailable")


@router.get("/business-impact")
async def get_business_impact_diagnostics(current_user=Depends(get_current_user)):
    """
    Get business impact diagnostics.
    """
    diagnostic_service = DiagnosticService()
    try:
        return await diagnostic_service.diagnose_business_impact()
    except Exception as e:
        logger.error(f"Business impact diagnostics error: {e}")
        raise HTTPException(status_code=500, detail="Business impact diagnostics unavailable")


@router.post("/scoring/run")
async def run_scoring_cycle(current_user=Depends(get_current_user)):
    """
    Manually trigger a scoring cycle.
    """
    try:
        result = await scoring_system.run_scoring_cycle()
        return result
    except Exception as e:
        logger.error(f"Scoring cycle error: {e}")
        raise HTTPException(status_code=500, detail="Scoring cycle failed")


@router.get("/scoring/history")
async def get_scoring_history(days_back: int = 30, current_user=Depends(get_current_user)):
    """
    Get historical scoring data.
    """
    try:
        history = await scoring_system.get_scoring_history(days_back)
        return history
    except Exception as e:
        logger.error(f"Scoring history error: {e}")
        raise HTTPException(status_code=500, detail="Failed to retrieve scoring history")


@router.get("/scoring/current")
async def get_current_scoring(current_user=Depends(get_current_user)):
    """
    Get current scoring status and latest results.
    """
    try:
        # Run a fresh scoring cycle
        result = await scoring_system.run_scoring_cycle()
        return result
    except Exception as e:
        logger.error(f"Current scoring error: {e}")
        raise HTTPException(status_code=500, detail="Failed to get current scoring")


@router.get("/sync/status")
async def get_sync_status(current_user=Depends(get_current_user)):
    """
    Get synchronization status across all protocols.
    """
    try:
        status = await sync_protocol_service.check_sync_status()
        return status
    except Exception as e:
        logger.error(f"Sync status error: {e}")
        raise HTTPException(status_code=500, detail="Failed to get sync status")


@router.post("/sync/trigger/{protocol_name}/{action}")
async def trigger_sync_action(protocol_name: str, action: str, current_user=Depends(get_current_user)):
    """
    Trigger a synchronization action.
    """
    try:
        result = await sync_protocol_service.trigger_sync_action(protocol_name, action)
        return result
    except Exception as e:
        logger.error(f"Sync action error: {e}")
        raise HTTPException(status_code=500, detail="Failed to trigger sync action")


@router.get("/sync/history")
async def get_sync_history(limit: int = 50, current_user=Depends(get_current_user)):
    """
    Get synchronization history.
    """
    try:
        history = sync_protocol_service.get_sync_history(limit)
        return {"history": history}
    except Exception as e:
        logger.error(f"Sync history error: {e}")
        raise HTTPException(status_code=500, detail="Failed to get sync history")


@router.post("/investigation/check-triggers")
async def check_investigation_triggers(current_user=Depends(get_current_user)):
    """
    Check investigation triggers against current diagnostics.
    """
    try:
        # Get current diagnostics
        diagnostics = await DiagnosticService().run_comprehensive_diagnostics()

        # Check triggers
        triggered = await investigation_service.check_triggers(diagnostics)

        # Start investigations for triggered items
        started_investigations = []
        for trigger in triggered:
            investigation_id = await investigation_service.start_investigation(trigger)
            started_investigations.append({"investigation_id": investigation_id, "trigger": trigger})

        return {
            "triggers_checked": len(triggered),
            "investigations_started": started_investigations,
        }
    except Exception as e:
        logger.error(f"Investigation trigger check error: {e}")
        raise HTTPException(status_code=500, detail="Failed to check investigation triggers")


@router.get("/investigation/active")
async def get_active_investigations(current_user=Depends(get_current_user)):
    """
    Get all active investigations.
    """
    try:
        active = investigation_service.get_active_investigations()
        return {"active_investigations": active}
    except Exception as e:
        logger.error(f"Active investigations error: {e}")
        raise HTTPException(status_code=500, detail="Failed to get active investigations")


@router.get("/investigation/{investigation_id}")
async def get_investigation_status(investigation_id: str, current_user=Depends(get_current_user)):
    """
    Get status of a specific investigation.
    """
    try:
        status = await investigation_service.get_investigation_status(investigation_id)
        if status is None:
            raise HTTPException(status_code=404, detail="Investigation not found")

        return status
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Investigation status error: {e}")
        raise HTTPException(status_code=500, detail="Failed to get investigation status")


@router.get("/investigation/history")
async def get_investigation_history(limit: int = 50, current_user=Depends(get_current_user)):
    """
    Get investigation history.
    """
    try:
        history = investigation_service.get_investigation_history(limit)
        return {"history": history}
    except Exception as e:
        logger.error(f"Investigation history error: {e}")
        raise HTTPException(status_code=500, detail="Failed to get investigation history")


@router.post("/pipeline/create")
async def create_implementation_pipeline(
    implementation_type: str,
    parameters: dict[str, Any] | None = None,
    current_user=Depends(get_current_user),
):
    """
    Create a new implementation pipeline.
    """
    try:
        pipeline_id = await pipeline_service.create_pipeline(implementation_type, parameters)
        return {"pipeline_id": pipeline_id, "status": "created"}
    except Exception as e:
        logger.error(f"Pipeline creation error: {e}")
        raise HTTPException(status_code=500, detail="Failed to create pipeline")


@router.post("/pipeline/{pipeline_id}/execute")
async def execute_pipeline(pipeline_id: str, current_user=Depends(get_current_user)):
    """
    Execute an implementation pipeline.
    """
    try:
        result = await pipeline_service.execute_pipeline(pipeline_id)
        return result
    except Exception as e:
        logger.error(f"Pipeline execution error: {e}")
        raise HTTPException(status_code=500, detail="Failed to execute pipeline")


@router.get("/pipeline/active")
async def get_active_pipelines(current_user=Depends(get_current_user)):
    """
    Get all active implementation pipelines.
    """
    try:
        active = pipeline_service.get_active_pipelines()
        return {"active_pipelines": active}
    except Exception as e:
        logger.error(f"Active pipelines error: {e}")
        raise HTTPException(status_code=500, detail="Failed to get active pipelines")


@router.get("/pipeline/{pipeline_id}")
async def get_pipeline_status(pipeline_id: str, current_user=Depends(get_current_user)):
    """
    Get status of a specific pipeline.
    """
    try:
        status = await pipeline_service.get_pipeline_status(pipeline_id)
        if status is None:
            raise HTTPException(status_code=404, detail="Pipeline not found")

        return status
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Pipeline status error: {e}")
        raise HTTPException(status_code=500, detail="Failed to get pipeline status")


@router.post("/pipeline/{pipeline_id}/cancel")
async def cancel_pipeline(pipeline_id: str, current_user=Depends(get_current_user)):
    """
    Cancel an active pipeline.
    """
    try:
        cancelled = await pipeline_service.cancel_pipeline(pipeline_id)
        return {"cancelled": cancelled}
    except Exception as e:
        logger.error(f"Pipeline cancellation error: {e}")
        raise HTTPException(status_code=500, detail="Failed to cancel pipeline")


@router.post("/pipeline/{pipeline_id}/approve/{step_index}")
async def approve_pipeline_step(pipeline_id: str, step_index: int, current_user=Depends(get_current_user)):
    """
    Approve a pending pipeline step.
    """
    try:
        approved = await pipeline_service.approve_step(pipeline_id, step_index)
        return {"approved": approved}
    except Exception as e:
        logger.error(f"Step approval error: {e}")
        raise HTTPException(status_code=500, detail="Failed to approve step")


@router.post("/notifications/check-alerts")
async def check_alerts(current_user=Depends(get_current_user)):
    """
    Check for alerts and send notifications.
    """
    try:
        # Get current diagnostics
        diagnostics = await DiagnosticService().run_comprehensive_diagnostics()

        # Check and send alerts
        await orchestration_notification_service.check_and_send_alerts(diagnostics)

        return {"status": "alerts_checked", "message": "Alert checking completed"}
    except Exception as e:
        logger.error(f"Alert checking error: {e}")
        raise HTTPException(status_code=500, detail="Failed to check alerts")


@router.get("/notifications/recent")
async def get_recent_notifications(limit: int = 50, current_user=Depends(get_current_user)):
    """
    Get recent notifications and alerts.
    """
    try:
        notifications = orchestration_notification_service.get_recent_alerts(limit)
        return {"notifications": notifications}
    except Exception as e:
        logger.error(f"Recent notifications error: {e}")
        raise HTTPException(status_code=500, detail="Failed to get recent notifications")
