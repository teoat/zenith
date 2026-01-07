from datetime import datetime

from app.routers.backup import router as backup_router
from fastapi import FastAPI

from app.constants import API_VERSION
from app.routers import advanced_ai
from app.routers.admin import router as admin_router
from app.routers.ai import router as ai_router
from app.routers.ai_voice import router as ai_voice_router
from app.routers.analytics import router as analytics_router
from app.routers.apm import router as apm_router
from app.routers.audit import router as audit_router
from app.routers.auth import router as auth_router
from app.routers.auth_biometric import router as auth_biometric_router
from app.routers.auth_social import router as auth_social_router
from app.routers.cases import router as cases_router
from app.routers.collaboration import router as collaboration_router
from app.routers.compliance import router as compliance_router
from app.routers.cost_optimization import router as cost_optimization_router
from app.routers.csrf import router as csrf_router
from app.routers.entities import relationships_router as relationships_router_from_entities
from app.routers.entities import router as entities_router
from app.routers.evidence import router as evidence_router
from app.routers.forensic_intelligence import router as forensic_intel_router
from app.routers.fraud import router as fraud_router
from app.routers.fraud_rules import router as fraud_rules_router
from app.routers.graph import router as graph_router
from app.routers.health import router as health_router
from app.routers.logging import router as logging_router
from app.routers.metadata import router as metadata_router
from app.routers.multimodal import router as multimodal_router
from app.routers.notifications import router as notifications_router
from app.routers.onboarding import router as onboarding_router
from app.routers.proof import router as proof_router
from app.routers.realtime_sync import router as realtime_sync_router
from app.routers.reconciliation import router as reconciliation_router
from app.routers.regulatory_rag import router as regulatory_rag_router
from app.routers.reporting import router as reporting_router
from app.routers.search import router as search_router
from app.routers.self_healing import router as self_healing_router
from app.routers.semantic_search import router as semantic_search_router
from app.routers.stats import router as stats_router

# System specific router
from app.routers.system_routes import router as system_router
from app.routers.time_travel import router as time_travel_router
from app.routers.users import router as users_router
from app.routers.xai import router as xai_router
from core.logging import logger


def setup_routers(app: FastAPI):
    # Health Check Endpoints (Moved to app.routers.health)
    app.include_router(health_router)

    # System routes (metrics, dashboard, index)
    app.include_router(system_router)

    # Standard Routers
    app.include_router(auth_router, prefix=f"/api/{API_VERSION}/auth", tags=["Authentication"])
    app.include_router(search_router, prefix=f"/api/{API_VERSION}/search", tags=["Search"])
    app.include_router(admin_router, prefix=f"/api/{API_VERSION}/admin", tags=["Admin"])
    app.include_router(users_router, prefix=f"/api/{API_VERSION}/users", tags=["Users"])
    app.include_router(analytics_router, prefix=f"/api/{API_VERSION}/analytics", tags=["Analytics"])
    app.include_router(reporting_router, prefix=f"/api/{API_VERSION}/reports", tags=["Reporting"])
    app.include_router(cases_router, prefix=f"/api/{API_VERSION}/cases", tags=["Cases"])
    app.include_router(audit_router, prefix=f"/api/{API_VERSION}/audit", tags=["Audit"])
    app.include_router(
        cost_optimization_router,
        prefix=f"/api/{API_VERSION}/cost-optimization",
        tags=["Cost Optimization"],
    )
    app.include_router(evidence_router, prefix=f"/api/{API_VERSION}/evidence", tags=["Evidence"])
    app.include_router(fraud_router, prefix=f"/api/{API_VERSION}/fraud", tags=["Fraud"])
    app.include_router(compliance_router, prefix=f"/api/{API_VERSION}/compliance", tags=["Compliance"])

    # AI & Intelligence
    app.include_router(ai_router, prefix=f"/api/{API_VERSION}/ai", tags=["AI Intelligence"])
    app.include_router(advanced_ai.router, prefix=f"/api/{API_VERSION}/advanced_ai", tags=["Advanced AI"])

    # Additional Routers
    app.include_router(multimodal_router, prefix=f"/api/{API_VERSION}/multimodal", tags=["Multimodal"])
    # DEPRECATED: Semantic search router - will be removed Feb 1, 2026
    # Keep active until removal deadline to allow graceful migration
    removal_deadline = datetime(2026, 2, 1)
    if datetime.now() < removal_deadline:
        app.include_router(
            semantic_search_router,
            prefix=f"/api/{API_VERSION}/semantic_search",
            tags=["Semantic Search (DEPRECATED)"],
        )
    else:
        logger.warning("Semantic search router removal deadline reached - endpoints disabled")
    app.include_router(logging_router, prefix=f"/api/{API_VERSION}/logging", tags=["Logging"])
    app.include_router(apm_router, prefix=f"/api/{API_VERSION}/apm", tags=["APM"])
    app.include_router(graph_router, prefix=f"/api/{API_VERSION}/graph", tags=["Graph"])
    app.include_router(realtime_sync_router, prefix=f"/api/{API_VERSION}/sync", tags=["Realtime Sync"])
    app.include_router(
        notifications_router,
        prefix=f"/api/{API_VERSION}/notifications",
        tags=["Notifications"],
    )
    app.include_router(backup_router, prefix=f"/api/{API_VERSION}/backup", tags=["Backup"])
    app.include_router(fraud_rules_router, prefix=f"/api/{API_VERSION}/rules", tags=["Fraud Rules"])
    app.include_router(
        collaboration_router,
        prefix=f"/api/{API_VERSION}/collaboration",
        tags=["Collaboration"],
    )
    app.include_router(stats_router, prefix=f"/api/{API_VERSION}/stats", tags=["Stats"])
    app.include_router(
        reconciliation_router,
        prefix=f"/api/{API_VERSION}/reconciliation",
        tags=["Reconciliation"],
    )
    app.include_router(onboarding_router, prefix=f"/api/{API_VERSION}/onboarding", tags=["Onboarding"])
    app.include_router(metadata_router, prefix=f"/api/{API_VERSION}/metadata", tags=["Metadata"])

    app.include_router(proof_router, prefix=f"/api/{API_VERSION}/proof", tags=["Proof"])
    app.include_router(
        forensic_intel_router,
        prefix=f"/api/{API_VERSION}/forensic-intel",
        tags=["Forensic Intelligence"],
    )
    app.include_router(entities_router, prefix=f"/api/{API_VERSION}/entities", tags=["Entities"])
    app.include_router(csrf_router, prefix=f"/api/{API_VERSION}", tags=["Security"])

    # Roadmap to 10/10 Routers
    app.include_router(
        collaboration_router,
        prefix=f"/api/{API_VERSION}/collaboration",
        tags=["Collaboration (Roadmap)"],
    )
    app.include_router(
        time_travel_router,
        prefix=f"/api/{API_VERSION}/cases",
        tags=["Time Travel (Roadmap)"],
    )
    app.include_router(ai_voice_router, prefix=f"/api/{API_VERSION}/ai", tags=["AI Voice (Roadmap)"])

    # New Roadmap Routers (Completed)
    app.include_router(xai_router, prefix=f"/api/{API_VERSION}")
    app.include_router(regulatory_rag_router, prefix=f"/api/{API_VERSION}")
    app.include_router(auth_biometric_router, prefix=f"/api/{API_VERSION}")
    app.include_router(auth_social_router, prefix=f"/api/{API_VERSION}")
    app.include_router(self_healing_router, prefix=f"/api/{API_VERSION}")

    app.include_router(
        relationships_router_from_entities,
        prefix=f"/api/{API_VERSION}/relationships",
        tags=["Relationships"],
    )

    # Optional Routers
    try:
        from app.routers.projects import router as projects_router

        app.include_router(projects_router, prefix=f"/api/{API_VERSION}/projects", tags=["Projects"])
    except ImportError as e:
        logger.warning(f"Failed to import projects router: {e}")

    try:
        from app.routers.alerts import router as alerts_router

        app.include_router(alerts_router, prefix=f"/api/{API_VERSION}/alerts", tags=["Alerts"])
    except ImportError as e:
        logger.warning(f"Failed to import alerts router: {e}")

    try:
        from app.routers.metrics import router as metrics_router

        app.include_router(metrics_router, tags=["Metrics"])
    except ImportError:
        pass

    try:
        from app.routers.streaming import router as streaming_router

        app.include_router(streaming_router, prefix=f"/api/{API_VERSION}", tags=["Streaming"])
    except ImportError:
        pass

    try:
        from app.routers.websocket import router as websocket_router

        app.include_router(websocket_router, tags=["WebSocket"])
    except ImportError:
        pass

    try:
        from app.routers.diagnostics import router as diagnostics_router

        app.include_router(
            diagnostics_router,
            prefix=f"/api/{API_VERSION}/diagnostics",
            tags=["Diagnostics"],
        )
    except ImportError:
        pass
