"""
AI API Router for 378x492 Fraud Detection
Provides endpoints for AI analysis and semantic search
"""

from fastapi import APIRouter, HTTPException, Depends, BackgroundTasks
from fastapi.responses import JSONResponse
from sqlalchemy.orm import Session
from typing import List, Optional, Dict, Any, Tuple
from pydantic import BaseModel, Field
from typing import List, Dict, Any, Optional, Literal
from datetime import datetime
import logging

from app.services.ai_service import get_ai_service

logger = logging.getLogger(__name__)

router = APIRouter(
    prefix="",
    tags=["AI"],
    responses={404: {"description": "Not found"}},
)

# Authentication Dependency
from app.services.auth_service import auth_service
from core.database import User

# Request/Response Models

class SearchRequest(BaseModel):
    query: str = Field(..., description="Natural language search query")
    filters: Optional[Dict[str, Any]] = Field(None, description="Search filters")
    limit: int = Field(default=10, ge=1, le=100, description="Maximum results to return")

class SearchResult(BaseModel):
    id: str
    similarity: float
    content: str
    metadata: Dict[str, Any]
    created_at: str

class SearchResponse(BaseModel):
    success: bool = True
    results: List[SearchResult]
    total: int

class AnalysisRequest(BaseModel):
    type: Literal["case_summary", "fraud_pattern", "entity_linkage", "risk_assessment", "evidence_analysis"] = Field(
        ..., description="Type of analysis to perform"
    )
    data: Dict[str, Any] = Field(..., description="Analysis input data")
    caseId: Optional[str] = Field(None, description="Associated case ID")

class AnalysisResponse(BaseModel):
    success: bool = True
    analysis: Dict[str, Any]
    confidence: float
    jobId: Optional[str] = None

class InsightsRequest(BaseModel):
    context: Dict[str, Any] = Field(..., description="Current application context")

class InsightsResponse(BaseModel):
    success: bool = True
    insights: Dict[str, Any]

class InsightsResponse(BaseModel):
    success: bool = True
    insights: Dict[str, Any]

class FeedbackRequest(BaseModel):
    insight_id: str
    is_positive: bool
    feedback_text: Optional[str] = None
    context: Optional[Dict[str, Any]] = None

class MultiPersonaRequest(BaseModel):
    case_id: str
    personas: List[str]

class ProactiveRequest(BaseModel):
    alert_id: str
    context: str

# API Endpoints

@router.post("/search", response_model=SearchResponse)
async def semantic_search(request: SearchRequest, current_user: User = Depends(auth_service.get_current_user)):
    """
    Perform semantic search across case data and evidence.

    This endpoint uses AI-powered semantic search to find relevant information
    based on natural language queries, going beyond simple keyword matching.
    """
    try:
        ai_service = await get_ai_service()

        results = await ai_service.semantic_search(
            query=request.query,
            limit=request.limit,
            filters=request.filters
        )

        return SearchResponse(
            results=results,
            total=len(results)
        )

    except Exception as e:
        logger.error(f"Semantic search failed: {e}")
        raise HTTPException(status_code=500, detail=f"Search failed: {str(e)}")

@router.post("/analyze", response_model=AnalysisResponse)
async def ai_analyze(request: AnalysisRequest, background_tasks: BackgroundTasks, current_user: User = Depends(auth_service.get_current_user)):
    """
    Perform AI-powered analysis on case data or evidence.

    Supports various analysis types:
    - case_summary: Generate comprehensive case summary
    - fraud_pattern: Detect fraud patterns in transactions
    - entity_linkage: Analyze relationships between entities
    - risk_assessment: Assess overall risk level
    - evidence_analysis: Analyze evidence for fraud indicators
    """
    try:
        ai_service = await get_ai_service()

        # For complex analysis, run in background
        if request.type in ['fraud_pattern', 'entity_linkage']:
            # Generate job ID for background processing
            job_id = f"analysis_{datetime.now().strftime('%Y%m%d_%H%M%S')}_{hash(str(request.data)) % 10000}"

            # Add to background tasks
            background_tasks.add_task(
                process_ai_analysis,
                job_id,
                request.type,
                request.data,
                request.caseId
            )

            return AnalysisResponse(
                analysis={"status": "processing", "message": "Analysis started in background"},
                confidence=0.0,
                jobId=job_id
            )

        # For simple analysis, process immediately
        else:
            analysis_result = await ai_service.analyze_case(request.data, request.type)

            return AnalysisResponse(
                analysis=analysis_result,
                confidence=analysis_result.get('confidence', 0.0)
            )

    except Exception as e:
        logger.error(f"AI analysis failed: {e}")
        raise HTTPException(status_code=500, detail=f"Analysis failed: {str(e)}")

@router.post("/insights", response_model=InsightsResponse)
async def get_insights(request: InsightsRequest, current_user: User = Depends(auth_service.get_current_user)):
    """
    Generate contextual AI insights based on current application state.

    Provides intelligent suggestions, warnings, and opportunities based on
    the user's current page, selected data, and overall context.
    """
    try:
        ai_service = await get_ai_service()

        insights = await ai_service.get_insights(request.context)

        return InsightsResponse(insights=insights)

    except Exception as e:
        logger.error(f"Insights generation failed: {e}")
        raise HTTPException(status_code=500, detail=f"Insights failed: {str(e)}")

@router.post("/documents")
async def add_document(
    doc_id: str,
    content: str,
    metadata: Optional[Dict[str, Any]] = None
):
    """
    Add a document to the AI vector store for semantic search.

    This endpoint indexes documents for future semantic search queries.
    Documents can be case descriptions, evidence content, or any text data.
    """
    try:
        ai_service = await get_ai_service()

        success = await ai_service.add_document(doc_id, content, metadata)

        if success:
            return {"success": True, "message": f"Document {doc_id} added to vector store"}
        else:
            raise HTTPException(status_code=500, detail="Failed to add document")

    except Exception as e:
        logger.error(f"Document addition failed: {e}")
        raise HTTPException(status_code=500, detail=f"Document addition failed: {str(e)}")

@router.delete("/documents/{doc_id}")
async def remove_document(doc_id: str):
    """
    Remove a document from the AI vector store.

    This permanently removes the document from semantic search capabilities.
    """
    try:
        ai_service = await get_ai_service()

        # Note: This would need to be implemented in the AIService class
        # For now, return not implemented
        raise HTTPException(status_code=501, detail="Document removal not yet implemented")

    except Exception as e:
        logger.error(f"Document removal failed: {e}")
        raise HTTPException(status_code=500, detail=f"Document removal failed: {str(e)}")

@router.post("/multi-persona-analysis")
async def multi_persona_analysis(request: MultiPersonaRequest, current_user: User = Depends(auth_service.get_current_user)):
    """
    Perform analysis using multiple AI personas.
    """
    try:
        ai_service = await get_ai_service()
        results = await ai_service.analyze_multi_persona(request.case_id, request.personas)
        return results
    except Exception as e:
        logger.error(f"Multi-persona analysis failed: {e}")
        raise HTTPException(status_code=500, detail=f"Analysis failed: {str(e)}")

@router.post("/investigate/{subject_id}")
async def investigate_subject(subject_id: str, current_user: User = Depends(auth_service.get_current_user)):
    """
    Perform deep dive investigation on a subject.
    """
    try:
        ai_service = await get_ai_service()
        results = await ai_service.investigate_subject(subject_id)
        return results
    except Exception as e:
        logger.error(f"Subject investigation failed: {e}")
        raise HTTPException(status_code=500, detail=f"Investigation failed: {str(e)}")

@router.post("/proactive-suggestions")
async def get_proactive_suggestions(request: ProactiveRequest, current_user: User = Depends(auth_service.get_current_user)):
    """
    Get proactive suggestions based on an alert.
    """
    try:
        ai_service = await get_ai_service()
        results = await ai_service.get_proactive_suggestions(request.alert_id, request.context)
        return results
    except Exception as e:
        logger.error(f"Proactive suggestions failed: {e}")
        raise HTTPException(status_code=500, detail=f"Suggestions failed: {str(e)}")

@router.get("/status")
async def get_ai_status():
    """
    Get the current status of the AI service.

    Returns information about the AI service health, indexed documents,
    and available analysis capabilities.
    """
    try:
        ai_service = await get_ai_service()

        status = {
            "initialized": ai_service.initialized,
            "documents_indexed": len(ai_service.vector_store),
            "capabilities": [
                "semantic_search",
                "fraud_pattern_analysis",
                "entity_linkage_analysis",
                "risk_assessment",
                "evidence_analysis",
                "contextual_insights"
            ],
            "last_updated": datetime.now().isoformat()
        }

        return {"success": True, "status": status}

    except Exception as e:
        logger.error(f"Status check failed: {e}")
        return {
            "success": False,
            "error": str(e),
            "status": {"initialized": False}
        }

# Background task processing
async def process_ai_analysis(job_id: str, analysis_type: str, data: Dict[str, Any], case_id: Optional[str]):
    """
    Background task for processing complex AI analysis
    """
    try:
        logger.info(f"Starting background analysis job {job_id}")

        ai_service = await get_ai_service()
        analysis_result = await ai_service.analyze_case(data, analysis_type)

        # In a real implementation, you would store the result in a database
        # and potentially send notifications when complete
        logger.info(f"Completed background analysis job {job_id}")

        # Here you could emit WebSocket events or store results for retrieval

    except Exception as e:
        logger.error(f"Background analysis job {job_id} failed: {e}")

class ChatRequest(BaseModel):
    message: str
    context: Optional[Dict[str, Any]] = None
    persona: Optional[str] = "frenly"

class ChatResponse(BaseModel):
    response: str
    confidence: float
    persona: str
    suggestions: Optional[List[Dict[str, Any]]] = None

@router.post("/chat", response_model=ChatResponse)
async def ai_chat(request: ChatRequest, current_user: User = Depends(auth_service.get_current_user)):
    """
    Interact with the Frenly AI Assistant.
    Supports multi-turn conversations and persona-based responses.
    """
    try:
        # In a real implementation, this would call the LLM service
        # For now, we return a mock response based on the persona
        persona = request.persona or "frenly"
        response_text = ""
        
        if persona == "legal":
            response_text = f"[Legal Advisor] I've reviewed your query regarding '{request.message}'. From a compliance standpoint, ensure all evidence is properly logged."
        elif persona == "forensic":
            response_text = f"[Forensic Accountant] Analyzing the data points related to '{request.message}'. I detect a 12% variance from the expected baseline."
        elif persona == "investigator":
            response_text = f"[Senior Investigator] Based on '{request.message}', I recommend interviewing the primary suspect and checking their known associates."
        else:
            response_text = f"I understand you're asking about '{request.message}'. I'm analyzing the current context to help you identify patterns."

        return ChatResponse(
            response=response_text,
            confidence=0.89,
            persona=persona,
            suggestions=[
                {"label": "View related case", "action": "navigate_case"},
                {"label": "Check compliance", "action": "check_rules"}
            ]
        )

    except Exception as e:
        logger.error(f"Chat failed: {e}")
        raise HTTPException(status_code=500, detail=f"Chat failed: {str(e)}")

# Functions from Stashed Changes (Restored)
from core.database import get_db

@router.post("/analyze/case")
async def analyze_case_ai(
    request: AnalysisRequest, # Changed from CaseAnalysisRequest to match imports
    background_tasks: BackgroundTasks,
    db: Session = Depends(get_db)
):
    """
    Perform comprehensive AI-powered case analysis
    """
    try:
        ai_service = await get_ai_service()
        # Mock result for now as AIService is async via get_ai_service()
        return {"status": "analysis_started", "job_id": "mock_job_123"}
    except Exception as e:
         logger.error(f"Analysis failed: {e}")
         raise HTTPException(status_code=500, detail=str(e))

        


# Health check endpoint for AI service
@router.get("/health")
async def ai_health_check():
    """
    Health check for AI service components
    """
    try:
        ai_service = await get_ai_service()

        health_status = {
            "service": "ai",
            "status": "healthy" if ai_service.initialized else "initializing",
            "timestamp": datetime.now().isoformat(),
            "components": {
                "vector_store": {
                    "status": "healthy",
                    "documents": len(ai_service.vector_store)
                },
                "search_index": {
                    "status": "healthy" if ai_service.tfidf_vectorizer else "building",
                    "features": ai_service.tfidf_vectorizer.n_features_ if ai_service.tfidf_vectorizer else 0
                }
            }
        }

        return health_status

    except Exception as e:
        return {
            "service": "ai",
            "status": "unhealthy",
            "error": str(e),
            "timestamp": datetime.now().isoformat()
        }