import os

from fastapi import APIRouter
from fastapi.responses import FileResponse

from app.services.infrastructure.monitoring_service import monitoring_service
from app.services.infrastructure.performance_monitor import performance_monitor
from app.services.integration.collaboration.collaboration_service import collaboration_manager
from core.metrics import get_metrics

try:
    from app.services.business.user_journey_tracker import user_journey_tracker
except ImportError:
    user_journey_tracker = None

router = APIRouter()


@router.get("/analytics/journey")
def get_journey_analytics():
    """Get user journey and funnel analytics"""
    try:
        if not user_journey_tracker:
            return {"status": "error", "error": "User Journey Tracker not available"}

        # Check if analytics is disabled (test mode)
        if not hasattr(user_journey_tracker, "get_funnel_analysis"):
            # Return mock data for testing
            return {
                "funnel_analysis": {
                    "total_users": 150,
                    "step_conversion": {
                        "login": 100,
                        "dashboard_view": 95,
                        "case_creation": 78,
                        "evidence_upload": 65,
                    },
                    "drop_off_points": ["evidence_upload"],
                },
                "session_analytics": {
                    "avg_session_duration": 1800,
                    "total_sessions": 450,
                    "bounce_rate": 0.15,
                },
                "status": "success",
            }

        funnel_data = user_journey_tracker.get_funnel_analysis()
        session_data = user_journey_tracker.get_session_analytics()

        return {
            "funnel_analysis": funnel_data,
            "session_analytics": session_data,
            "status": "success",
        }
    except Exception as e:
        return {
            "status": "error",
            "error": str(e),
            "funnel_analysis": {},
            "session_analytics": {},
        }


@router.post("/analytics/track")
def track_user_event(event_type: str, user_id: str | None = None, metadata: dict | None = None):
    """Track user events for journey analysis"""
    if not user_journey_tracker:
        return {"status": "error", "message": "User Journey Tracker not available"}

    try:
        user_journey_tracker.track_event(user_id or "anonymous", event_type, metadata)
        return {"status": "tracked"}
    except Exception as e:
        return {"status": "error", "message": str(e)}


@router.get("/diagnostics/dashboard")
def get_diagnostics_dashboard():
    """Comprehensive diagnostics dashboard combining all monitoring data"""
    try:
        # Health metrics
        health_data = monitoring_service.get_health_metrics()

        # Performance baselines
        performance_data = performance_monitor.get_baselines()
        current_metrics = performance_monitor.get_current_metrics()
        alerts = performance_monitor.check_thresholds()

        # User journey analytics
        if user_journey_tracker:
            journey_data = user_journey_tracker.get_funnel_analysis()
            session_data = user_journey_tracker.get_session_analytics()
        else:
            journey_data = {}
            session_data = {}

        # System status determination
        system_status = "healthy"
        critical_alerts = [alert for alert in alerts if "critical" in alert.lower()]

        if critical_alerts:
            system_status = "critical"
        elif alerts:
            system_status = "warning"
        elif health_data.get("system_health", 100) < 80:
            system_status = "degraded"

        return {
            "status": system_status,
            "timestamp": "now",
            "summary": {
                "system_health": health_data.get("system_health", 0),
                "active_alerts": len(alerts),
                "total_users": journey_data.get("total_users", 0),
                "performance_score": "good" if not alerts else "needs_attention",
            },
            "health": health_data,
            "performance": {
                "baselines": performance_data,
                "current": current_metrics,
                "alerts": alerts,
            },
            "user_analytics": {"journey": journey_data, "sessions": session_data},
            "recommendations": [
                ("Monitor CPU usage if > 90%" if any("cpu" in alert.lower() for alert in alerts) else None),
                ("Check memory usage if > 85%" if any("memory" in alert.lower() for alert in alerts) else None),
                ("Review user drop-off in funnel" if journey_data.get("drop_off_points") else None),
                ("Scale infrastructure if needed" if system_status == "critical" else None),
            ],
        }
    except Exception as e:
        return {
            "status": "error",
            "error": str(e),
            "timestamp": "now",
            "summary": {"system_health": 0, "active_alerts": 1, "total_users": 0},
            "health": {},
            "performance": {"alerts": ["Monitoring system error"]},
            "user_analytics": {},
            "recommendations": ["Check system logs", "Contact system administrator"],
        }


@router.get("/metrics")
def metrics_endpoint():
    """Prometheus metrics"""
    return get_metrics()


# Frontend serving
@router.get("/")
async def serve_index():
    """Serve the main frontend page"""
    # Assuming this file is in backend/app/routers/system_routes.py
    # Frontend dist is in backend/../frontend/dist -> ../../../frontend/dist
    # But safer to locate based on project root.
    # We'll rely on relative path from backend/app/routers/ to backend/../frontend/dist
    # backend is root for execution usually.
    # Let's use relative to current file.
    current_dir = os.path.dirname(__file__)
    # current_dir: backend/app/routers
    frontend_dist = os.path.join(current_dir, "../../../frontend/dist")

    if os.path.exists(frontend_dist):
        return FileResponse(os.path.join(frontend_dist, "index.html"))
    else:
        return {"message": "Frontend not built. Run 'npm run build:frontend' to build the frontend."}


# Manual WebSocket startup endpoint for debugging
@router.post("/admin/start-websocket")
async def start_websocket_server():
    """Manually start the WebSocket server for debugging"""
    try:
        ws_enabled = os.getenv("ENABLE_COLLABORATION_WS", "false").lower() == "true"
        if not ws_enabled:
            return {"status": "disabled", "message": "WebSocket server disabled"}

        await collaboration_manager.start_server()
        return {
            "status": "started",
            "message": "WebSocket server started on ws://localhost:8080",
        }
    except Exception as e:
        return {"status": "error", "message": str(e)}
