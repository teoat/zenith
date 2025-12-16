"""
Server-Sent Events (SSE) Streaming for AI Responses
Enables token-by-token streaming of AI responses to frontend
"""

import asyncio
import json
from datetime import datetime
from typing import AsyncGenerator

from fastapi import APIRouter, Request
from fastapi.responses import StreamingResponse

router = APIRouter()


async def generate_ai_stream(message: str, context: dict) -> AsyncGenerator[str, None]:
    """
    Generate AI response stream token-by-token

    This is a placeholder implementation that simulates streaming.
    In production, this would integrate with actual LLM streaming APIs.
    """
    # Simulated thinking steps
    steps = [
        "Analyzing query context...",
        "Retrieving relevant case data...",
        "Consulting fraud detection rules...",
        "Generating response...",
    ]

    for step in steps:
        yield f"data: {json.dumps({'type': 'thinking', 'content': step, 'timestamp': datetime.utcnow().isoformat()})}\n\n"
        await asyncio.sleep(0.3)

    # Simulated response tokens
    response = f"Based on your query about '{message}', here is my analysis. This is a simulated streaming response that demonstrates token-by-token delivery."
    words = response.split()

    for i, word in enumerate(words):
        token_data = {
            "type": "token",
            "content": word + " ",
            "index": i,
            "timestamp": datetime.utcnow().isoformat(),
        }
        yield f"data: {json.dumps(token_data)}\n\n"
        await asyncio.sleep(0.05)  # Simulate natural typing speed

    # Send completion event
    completion_data = {
        "type": "complete",
        "total_tokens": len(words),
        "timestamp": datetime.utcnow().isoformat(),
    }
    yield f"data: {json.dumps(completion_data)}\n\n"


@router.post("/ai/stream")
async def stream_ai_response(request: Request):
    """
    Stream AI response using Server-Sent Events

    Request body:
    {
        "message": "User message",
        "context": {
            "caseId": "optional",
            "persona": "frenly|skeptical|thorough"
        }
    }
    """
    body = await request.json()
    message = body.get("message", "")
    context = body.get("context", {})

    return StreamingResponse(
        generate_ai_stream(message, context),
        media_type="text/event-stream",
        headers={
            "Cache-Control": "no-cache",
            "Connection": "keep-alive",
            "X-Accel-Buffering": "no",  # Disable nginx buffering
        },
    )


async def generate_analysis_stream(transaction_data: dict) -> AsyncGenerator[str, None]:
    """
    Generate streaming analysis for transaction
    """
    # Yield progress updates
    stages = [
        ("Validating transaction data", 10),
        ("Checking velocity patterns", 25),
        ("Analyzing risk factors", 50),
        ("Calculating fraud score", 75),
        ("Generating recommendations", 90),
        ("Analysis complete", 100),
    ]

    for stage, progress in stages:
        update_data = {
            "type": "progress",
            "stage": stage,
            "progress": progress,
            "timestamp": datetime.utcnow().isoformat(),
        }
        yield f"data: {json.dumps(update_data)}\n\n"
        await asyncio.sleep(0.5)

    # Yield final result
    result = {
        "type": "result",
        "risk_score": 75,
        "risk_level": "HIGH",
        "flags": [
            "Unusual velocity pattern detected",
            "Transaction amount exceeds normal range",
            "Geographic anomaly identified",
        ],
        "recommendations": [
            "Manual review recommended",
            "Contact fraud team",
            "Verify with customer",
        ],
        "timestamp": datetime.utcnow().isoformat(),
    }
    yield f"data: {json.dumps(result)}\n\n"


@router.post("/ai/analyze/stream")
async def stream_transaction_analysis(request: Request):
    """
    Stream transaction analysis results

    Request body:
    {
        "transaction_id": "txn_123",
        "amount": 15000.00,
        "currency": "USD",
        ...
    }
    """
    body = await request.json()

    return StreamingResponse(
        generate_analysis_stream(body),
        media_type="text/event-stream",
        headers={
            "Cache-Control": "no-cache",
            "Connection": "keep-alive",
            "X-Accel-Buffering": "no",
        },
    )


@router.get("/ai/stream/test")
async def test_stream():
    """
    Test SSE streaming endpoint
    """

    async def test_generator():
        for i in range(10):
            yield f"data: {json.dumps({'message': f'Test message {i}', 'timestamp': datetime.utcnow().isoformat()})}\n\n"
            await asyncio.sleep(1)

    return StreamingResponse(
        test_generator(),
        media_type="text/event-stream",
        headers={"Cache-Control": "no-cache"},
    )
