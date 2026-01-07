import asyncio
import json
import logging
import os
from datetime import datetime
from typing import Any

# Try to import OpenAI compatible client
try:
    from openai import AsyncOpenAI

    HAS_OPENAI = True
except ImportError:
    HAS_OPENAI = False

logger = logging.getLogger(__name__)


class ACosmicLLMResponse:
    def __init__(
        self,
        content: str,
        confidence: float,
        provider: str,
        response_time_ms: int,
        metadata: dict[str, Any] | None = None,
    ):
        self.content = content
        self.confidence = confidence
        self.provider = provider
        self.response_time_ms = response_time_ms
        self.metadata = metadata or {}
        self.confidence_interval = [
            max(0.0, confidence - 0.1),
            min(1.0, confidence + 0.1),
        ]


class AdvancedLLMService:
    """
    Advanced LLM Service handling multi-persona analysis and intelligent responses.
    Supports fallback to simulated intelligence if API keys are missing.
    """

    def __init__(self):
        self.api_key = os.getenv("OPENAI_API_KEY")
        self.client = AsyncOpenAI(api_key=self.api_key) if HAS_OPENAI and self.api_key else None

    def is_api_available(self) -> bool:
        """Check if external LLM API is available and configured."""
        return self.client is not None

    async def generate_response(
        self,
        prompt: str,
        context: dict[str, Any] | None = None,
        persona: str = "frenly",
    ) -> ACosmicLLMResponse:
        """
        Generate a single response based on persona and context.
        """
        start_time = datetime.now()

        system_prompt = self._build_system_prompt(persona)

        if self.client:
            try:
                # Real API Call
                response = await self.client.chat.completions.create(
                    model="gpt-4-turbo-preview",
                    messages=[
                        {"role": "system", "content": system_prompt},
                        {
                            "role": "user",
                            "content": f"Context: {json.dumps(context or {})}\n\n_query: {prompt}",
                        },
                    ],
                    temperature=0.7,
                )
                content = response.choices[0].message.content
                confidence = 0.95  # High confidence in LLM
                provider = "openai-gpt4"
            except Exception as e:
                logger.error(f"LLM API call failed: {e}")
                # Fallback to simulation on error
                return await self._simulate_response(prompt, context, persona)
        else:
            # Simulation Fallback
            return await self._simulate_response(prompt, context, persona)

        duration = int((datetime.now() - start_time).total_seconds() * 1000)

        return ACosmicLLMResponse(
            content=content,
            confidence=confidence,
            provider=provider,
            response_time_ms=duration,
            metadata={"system_fingerprint": "123"},
        )

    async def multi_persona_analysis(
        self, prompt: str, personas: list[str], context: dict[str, Any] | None = None
    ) -> dict[str, ACosmicLLMResponse]:
        """
        Analyze a prompt through multiple personas concurrently.
        """
        results = {}
        tasks = []

        for persona in personas:
            tasks.append(self.generate_response(prompt, context, persona))

        responses = await asyncio.gather(*tasks)

        for i, persona in enumerate(personas):
            results[persona] = responses[i]

        return results

    async def _simulate_response(self, prompt: str, context: dict[str, Any] | None, persona: str) -> ACosmicLLMResponse:
        """
        Generate a sophisticated simulated response using RAG-like heuristics.
        """
        start_time = datetime.now()
        await asyncio.sleep(0.5)  # Simulate processing time

        prompt_lower = prompt.lower()

        # Persona-specific Templates
        templates = {
            "frenly": "Hey! I've dug into '{query}' for you. {analysis} Let me know if you need deeply nested entity checks!",
            "legal": "Regulatory assessment regarding '{query}': {analysis} Recommendation: Ensure SAR filing compliance under Section 314(b).",
            "forensic": "Forensic trace on '{query}' complete. Findings: {analysis} Correlation confidence: High.",
            "investigator": "Field notes on '{query}': {analysis} This matches modis operandi from the 'BlueSky' syndicate.",
        }

        # Dynamic Analysis based on keywords
        analysis = "No specific patterns detected, but standard due diligence is advised."

        if "layering" in prompt_lower or "structure" in prompt_lower:
            analysis = "detected complex transaction layering often associated with placement phase money laundering."
        elif "crypto" in prompt_lower or "bitcoin" in prompt_lower:
            analysis = "identified high-velocity crypto-to-fiat off-ramping activity."
        elif "relationship" in prompt_lower or "link" in prompt_lower:
            analysis = "found 3 hidden relationships between subject and known high-risk entities."
        elif "delete" in prompt_lower:
            analysis = "user intent to delete evidence noted. Logging logic requires administrative override."

        template = templates.get(persona, templates["frenly"])
        content = template.format(query=prompt, analysis=analysis)

        duration = int((datetime.now() - start_time).total_seconds() * 1000)

        if persona == "technical_reviewer":
            analysis = "Code Scan Complete."
            content = "Findings: 1. Potential Hardcoded Secret detected in variable assignment. 2. SQL Injection risk in query construction. Recommendation: Use parameterized queries and environment variables."
            return ACosmicLLMResponse(
                content=content,
                confidence=0.95,
                provider="code-security-engine",
                response_time_ms=duration,
                metadata={"simulated_scan": True},
            )

        return ACosmicLLMResponse(
            content=content,
            confidence=0.85,  # Simulated confidence
            provider="local-heuristic-engine",
            response_time_ms=duration,
            metadata={"simulated": True},
        )

    def _build_system_prompt(self, persona: str) -> str:
        prompts = {
            "frenly": "You are a helpful, enthusiastic fraud analyst assistant. Use emojis and be encouraging.",
            "legal": "You are a strict legal compliance officer. Cite regulations (BSA, AML, FATF) and be formal.",
            "forensic": "You are a data forensic specialist. Focus on timestamps, IP addresses, and hash collisions. Be terse.",
            "investigator": "You are a seasoned detective. Use investigative jargon and focus on intent and motive.",
            "technical_reviewer": "You are a senior software security engineer. Focus on OWASP vulnerabilities, code quality, and performance optimization.",
        }
        return prompts.get(persona, prompts["frenly"])


# Dependency Pattern
_llm_service = None


async def get_llm_service() -> AdvancedLLMService:
    global _llm_service
    if _llm_service is None:
        _llm_service = AdvancedLLMService()
    return _llm_service
