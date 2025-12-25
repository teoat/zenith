from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from typing import Dict, Any, List

router = APIRouter(prefix="/ai", tags=["AI Companion"])

class VoiceCommandRequest(BaseModel):
    transcript: str
    context: Dict[str, Any] = {}

class VoiceCommandResponse(BaseModel):
    action: str
    parameters: Dict[str, Any]
    confirmation_message: str

@router.post("/voice-command", response_model=VoiceCommandResponse)
async def process_voice_command(request: VoiceCommandRequest):
    """
    Process a natural language voice transcript and map it to a UI action.
    """
    # Simple rule-based intent mapping for V1
    transcript = request.transcript.lower()
    
    if "high risk" in transcript:
        return VoiceCommandResponse(
            action="FILTER_GRAPH",
            parameters={"risk_level": "high"},
            confirmation_message="Filtering graph for high risk entities."
        )
    elif "show alerts" in transcript:
         return VoiceCommandResponse(
            action="NAVIGATE",
            parameters={"route": "/alerts"},
            confirmation_message="Navigating to alerts dashboard."
        )
    
    return VoiceCommandResponse(
        action="UNKNOWN",
        parameters={},
        confirmation_message="I didn't understand that command."
    )

class ChatRequest(BaseModel):
    message: str

@router.post("/chat/regulatory")
async def regulatory_chat(request: ChatRequest):
    """
    RAG-enabled chatbot for regulatory queries.
    """
    # Mock RAG response
    return {
        "response": f"According to FinCEN regulation X, regarding '{request.message}', you must file a SAR within 30 days.",
        "citations": ["FinCEN Guidance 2024-X", "BSA Section 314(b)"]
    }
