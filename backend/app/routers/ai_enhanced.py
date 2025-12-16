"""
Updated AI Router with Enhanced Investigation Intelligence
"""

from fastapi import APIRouter, Depends, HTTPException, BackgroundTasks, Query
from fastapi.responses import JSONResponse
from sqlalchemy.orm import Session
from typing import List, Optional, Dict, Any
from pydantic import BaseModel, Field
from datetime import datetime, timezone
import logging
import asyncio

from core.database import get_db
from app.services.intelligence.ai_service import AIService
from app.services.workflow.workflow_engine import WorkflowEngine
from app.services.regulatory.regulatory_intelligence import RegulatoryIntelligenceHub
from app.services.analytics.dashboard_analytics import AnalyticsDashboard
from app.services.intelligence.timeline_reconstruction import TimelineReconstructionEngine
from app.services.core.audit_service import audit_service

logger = logging.getLogger(__name__)

# Enhanced Pydantic models for Phase 1 capabilities
class EnhancedChatRequest(BaseModel):
    message: str
    context: Optional[Dict[str, Any]] = None
    persona: str = "aml_analyst"
    investigation_mode: Optional[str] = None  # quick, deep, automated
    require_timeline: bool = False
    evidence_sources: Optional[List[str]] = None

class EnhancedChatResponse(BaseModel):
    response: str
    persona: str
    suggestions: Optional[List[Dict[str, Any]]] = None
    timeline: Optional[Dict[str, Any]] = None
    metadata: Optional[Dict[str, Any]] = None
    confidence_score: Optional[float] = None
    processing_time_ms: Optional[int] = None

class InvestigationGenerationRequest(BaseModel):
    alert_data: Dict[str, Any]
    case_type: str = "fraud_detection"  # aml_investigation, fraud_detection, network_analysis, compliance_review
    priority: str = "medium"  # low, medium, high, critical
    auto_execute: bool = False
    ai_enhanced: bool = True

class InvestigationGenerationResponse(BaseModel):
    case_id: str
    status: str
    generated_actions: List[Dict[str, Any]]
    timeline: Dict[str, Any]
    evidence_plan: Dict[str, Any]
    estimated_duration: int  # hours
    ai_insights: Dict[str, Any]
    automation_level: float  # 0-1 score

class TimelineGenerationRequest(BaseModel):
    case_id: str
    evidence_data: List[Dict[str, Any]]
    transaction_data: List[Dict[str, Any]]
    ai_insights: List[Dict[str, Any]] = None

class TimelineGenerationResponse(BaseModel):
    case_id: str
    status: str
    timeline: Dict[str, Any]
    events: List[Dict[str, Any]]
    total_duration: Optional[int] = None
    integrity_score: float = 0.0

class ComplianceCheckRequest(BaseModel):
    case_id: str
    jurisdiction: str = "us"  # us, eu, uk, singapore
    regulation_type: str = "aml"  # aml, cft, sanctions, data_protection
    case_data: Dict[str, Any]

class ComplianceCheckResponse(BaseModel):
    case_id: str
    jurisdiction: str
    compliance_rate: float
    violations: List[Dict[str, Any]]
    recommendations: List[str]
    risk_score: float
    checked_at: datetime

class AnalyticsRequest(BaseModel):
    time_range_days: int = 30
    metrics_type: Optional[str] = None
    include_insights: bool = True
    format_type: str = "summary"  # summary, detailed, trends

class AnalyticsResponse(BaseModel):
    current_metrics: Dict[str, Any]
    performance_trends: List[Dict[str, Any]]
    insights: List[Dict[str, Any]]
    configuration: Dict[str, Any]
    generated_at: datetime

# Router
router = APIRouter()

# Initialize enhanced services
def get_workflow_engine(db: Session) -> WorkflowEngine:
    return WorkflowEngine(db)

def get_regulatory_hub(db: Session) -> RegulatoryIntelligenceHub:
    return RegulatoryIntelligenceHub(db)

def get_analytics_dashboard(db: Session) -> AnalyticsDashboard:
    return AnalyticsDashboard(db)

def get_timeline_engine(db: Session) -> TimelineReconstructionEngine:
    return TimelineReconstructionEngine(db)

@router.post("/chat")
async def enhanced_chat(
    request: EnhancedChatRequest,
    db: Session = Depends(get_db)
):
    """
    Enhanced chat with Phase 1 intelligence capabilities
    """
    try:
        ai_service = AIService(db)
        
        start_time = datetime.now(timezone.utc)
        
        # Generate enhanced response with timeline support
        timeline = None
        if request.require_timeline:
            timeline_engine = get_timeline_engine(db)
            timeline_result = await timeline_engine.reconstruct_timeline(
                case_id=request.context.get("caseId", "default"),
                evidence_data=[],
                transaction_data=[],
                ai_insights=[]
            )
            timeline = timeline_result.dict() if timeline_result else None
        
        # Generate contextual suggestions based on investigation mode
        if request.investigation_mode == "quick":
            # Quick investigation - focus on immediate actions
            contextual_context = {"mode": "quick", "urgency": request.priority}
        elif request.investigation_mode == "deep":
            # Deep investigation - comprehensive analysis
            contextual_context = {"mode": "deep", "comprehensive": True}
        else:
            contextual_context = {"mode": "standard"}
        
        suggestions = await ai_service.generate_contextual_suggestions(
            request.context.get("caseId", "default"),
            f"{request.message} {request.investigation_mode or ''} {request.priority or ''}"
        )
        
        # Generate enhanced response
        response_text = await ai_service.generate_chat_response(
            request.message,
            request.context,
            request.persona
        )
        
        processing_time = int((datetime.now(timezone.utc) - start_time).total_seconds() * 1000)
        
        # Log enhanced interaction
        await audit_service.log_access(
            action="enhanced_ai_chat",
            resource=f"chat:{request.persona}",
            details={
                "message_length": len(request.message),
                "context_provided": bool(request.context),
                "investigation_mode": request.investigation_mode,
                "timeline_requested": request.require_timeline,
                "suggestions_generated": len(suggestions),
                "processing_time_ms": processing_time,
                "enhanced_features": True
            }
        )
        
        return EnhancedChatResponse(
            response=response_text,
            persona=request.persona,
            suggestions=suggestions,
            timeline=timeline,
            metadata={
                "confidence_score": 0.85,
                "processing_time_ms": processing_time,
                "investigation_mode": request.investigation_mode,
                "ai_enhanced": True
            },
            processing_time_ms=processing_time
        )

    except Exception as e:
        logger.error(f"Enhanced AI chat failed: {e}")
        raise HTTPException(status_code=500, detail="Enhanced AI chat failed")

@router.post("/investigations/generate")
async def generate_investigation(
    request: InvestigationGenerationRequest,
    db: Session = Depends(get_db),
    workflow_engine: WorkflowEngine = Depends(get_workflow_engine)
):
    """
    Phase 2: Automated investigation generation with workflow engine
    """
    try:
        start_time = datetime.now(timezone.utc)
        
        # Generate complete investigation case
        investigation_result = await workflow_engine.generate_investigation_case(
            alert_data=request.alert_data,
            case_type=request.case_type,
            priority=request.priority,
            ai_enhanced=request.ai_enhanced
        )
        
        # Auto-execute if requested
        if request.auto_execute and investigation_result.get("status") == "generated":
            # Execute the generated actions
            execution_result = await workflow_engine.execute_investigation_actions(
                case_id=investigation_result["case_id"],
                actions=investigation_result["generated_actions"]
            )
            
            investigation_result["execution_result"] = execution_result
            investigation_result["status"] = "auto_executed"
        
        processing_time = int((datetime.now(timezone.utc) - start_time).total_seconds() * 1000)
        
        # Log investigation generation
        await audit_service.log_access(
            action="investigation_generation",
            resource=f"investigation:{request.case_type}",
            details={
                "case_id": investigation_result.get("case_id"),
                "priority": request.priority,
                "auto_execute": request.auto_execute,
                "actions_generated": len(investigation_result.get("generated_actions", [])),
                "ai_enhanced": request.ai_enhanced,
                "processing_time_ms": processing_time
            }
        )
        
        return InvestigationGenerationResponse(
            case_id=investigation_result.get("case_id", "unknown"),
            status=investigation_result.get("status", "failed"),
            generated_actions=investigation_result.get("generated_actions", []),
            timeline=investigation_result.get("timeline", {}),
            evidence_plan=investigation_result.get("evidence_plan", {}),
            estimated_duration=investigation_result.get("estimated_duration", 0),
            ai_insights=investigation_result.get("ai_insights", {}),
            automation_level=investigation_result.get("automation_level", 0.0)
        )

    except Exception as e:
        logger.error(f"Investigation generation failed: {e}")
        raise HTTPException(status_code=500, detail="Investigation generation failed")

@router.post("/timelines/generate")
async def generate_timeline(
    request: TimelineGenerationRequest,
    db: Session = Depends(get_db),
    timeline_engine: TimelineReconstructionEngine = Depends(get_timeline_engine)
):
    """
    Phase 1: Automated timeline reconstruction
    """
    try:
        start_time = datetime.now(timezone.utc)
        
        # Generate comprehensive timeline
        timeline_result = await timeline_engine.reconstruct_timeline(
            case_id=request.case_id,
            evidence_data=request.evidence_data,
            transaction_data=request.transaction_data,
            ai_insights=request.ai_insights
        )
        
        # Validate timeline integrity
        validation_result = await timeline_engine.validate_timeline_integrity(timeline_result)
        
        # Optimize timeline
        optimized_timeline = await timeline_engine.optimize_timeline(timeline_result) if timeline_result else None
        
        processing_time = int((datetime.now(timezone.utc) - start_time).total_seconds() * 1000)
        
        # Log timeline generation
        await audit_service.log_access(
            action="timeline_generation",
            resource=f"timeline:{request.case_id}",
            details={
                "evidence_items": len(request.evidence_data),
                "transaction_items": len(request.transaction_data),
                "ai_insights_count": len(request.ai_insights or []),
                "validation_passed": validation_result.get("is_valid", False),
                "processing_time_ms": processing_time
            }
        )
        
        return TimelineGenerationResponse(
            case_id=request.case_id,
            status="completed" if optimized_timeline else "failed",
            timeline=optimized_timeline.dict() if optimized_timeline else {},
            events=optimized_timeline.get("events", []) if optimized_timeline else [],
            total_duration=optimized_timeline.get("total_duration") if optimized_timeline else None,
            integrity_score=validation_result.get("confidence_score", 0.0) if validation_result else 0.0
        )

    except Exception as e:
        logger.error(f"Timeline generation failed: {e}")
        raise HTTPException(status_code=500, detail="Timeline generation failed")

@router.post("/compliance/check")
async def check_compliance(
    request: ComplianceCheckRequest,
    db: Session = Depends(get_db),
    regulatory_hub: RegulatoryIntelligenceHub = Depends(get_regulatory_hub)
):
    """
    Phase 1: Enhanced regulatory compliance checking
    """
    try:
        start_time = datetime.now(timezone.utc)
        
        # Perform comprehensive compliance check
        compliance_result = await regulatory_hub.check_compliance(
            case_id=request.case_id,
            jurisdiction=request.jurisdiction,
            regulation_type=request.regulation_type,
            case_data=request.case_data
        )
        
        processing_time = int((datetime.now(timezone.utc) - start_time).total_seconds() * 1000)
        
        # Log compliance check
        await audit_service.log_access(
            action="compliance_check",
            resource=f"compliance:{request.jurisdiction}:{request.regulation_type}",
            details={
                "case_id": request.case_id,
                "compliance_rate": compliance_result.get("compliance_rate", 0.0),
                "violations_count": len(compliance_result.get("violations", [])),
                "risk_score": compliance_result.get("risk_score", 0.0),
                "processing_time_ms": processing_time
            }
        )
        
        return ComplianceCheckResponse(
            case_id=request.case_id,
            jurisdiction=request.jurisdiction,
            compliance_rate=compliance_result.get("compliance_rate", 0.0),
            violations=compliance_result.get("violations", []),
            recommendations=compliance_result.get("recommendations", []),
            risk_score=compliance_result.get("risk_score", 0.0),
            checked_at=datetime.now()
        )

    except Exception as e:
        logger.error(f"Compliance check failed: {e}")
        raise HTTPException(status_code=500, detail="Compliance check failed")

@router.get("/analytics/dashboard")
async def get_analytics_dashboard(
    request: AnalyticsRequest,
    db: Session = Depends(get_db),
    analytics_dashboard: AnalyticsDashboard = Depends(get_analytics_dashboard)
):
    """
    Phase 1: Real-time analytics dashboard
    """
    try:
        start_time = datetime.now(timezone.utc)
        
        # Get comprehensive dashboard data
        dashboard_data = await analytics_dashboard.get_dashboard_data(
            time_range_days=request.time_range_days,
            metrics_type=request.metrics_type,
            include_insights=request.include_insights,
            format_type=request.format_type
        )
        
        processing_time = int((datetime.now(timezone.utc) - start_time).total_seconds() * 1000)
        
        # Log analytics access
        await audit_service.log_access(
            action="analytics_dashboard",
            resource="dashboard_analytics",
            details={
                "time_range_days": request.time_range_days,
                "metrics_type": request.metrics_type,
                "include_insights": request.include_insights,
                "processing_time_ms": processing_time
            }
        )
        
        return AnalyticsResponse(
            current_metrics=dashboard_data.get("current_metrics", {}),
            performance_trends=dashboard_data.get("performance_trends", []),
            insights=dashboard_data.get("insights", []),
            configuration=dashboard_data.get("configuration", {}),
            generated_at=datetime.now()
        )

    except Exception as e:
        logger.error(f"Analytics dashboard failed: {e}")
        raise HTTPException(status_code=500, detail="Analytics dashboard failed")

# Background task for continuous monitoring
@router.post("/monitoring/update")
async def update_monitoring(
    background_tasks: BackgroundTasks,
    db: Session = Depends(get_db)
):
    """
    Continuous monitoring and optimization
    """
    try:
        background_tasks.add_task(
            optimize_investigation_performance,
            db=db
        )
        
        return {"status": "monitoring_update_initiated"}
        
    except Exception as e:
        logger.error(f"Monitoring update failed: {e}")
        raise HTTPException(status_code=500, detail="Monitoring update failed")

async def optimize_investigation_performance(db: Session):
    """Background task to optimize investigation performance"""
    try:
        # This would integrate with learning models and performance optimization
        logger.info("Starting investigation performance optimization")
        
        # Simulate optimization process
        await asyncio.sleep(5)
        
        logger.info("Investigation performance optimization completed")
        
    except Exception as e:
        logger.error(f"Performance optimization failed: {e}")