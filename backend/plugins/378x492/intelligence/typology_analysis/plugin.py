from core.plugin_system import PluginInterface, PluginMetadata, PluginContext
from typing import Dict, Any, List
import logging
from dataclasses import dataclass

logger = logging.getLogger(__name__)

@dataclass
class TypologyConfig:
    similarity_threshold: float
    limit: int

class TypologyAnalysisPlugin(PluginInterface):
    """
    AI-powered typology analysis plugin.
    Uses semantic search to match case data against known fraud typologies.
    """
    
    @property
    def metadata(self) -> PluginMetadata:
        return PluginMetadata(
            name="typology_analysis",
            version="1.0.0",
            namespace="378x492/intelligence/typology_analysis",
            author="378x492 Team",
            description="Analyzes cases against known fraud typologies using semantic search",
            dependencies={},
            capabilities=["intelligence", "case_analysis"],
            security_level="official",
            api_version="v1"
        )
    
    async def initialize(self, context: PluginContext) -> bool:
        self.context = context
        config_dict = context.config if context.config else {
            "similarity_threshold": 0.3,
            "limit": 3
        }
        self.config = TypologyConfig(**config_dict)
        
        # Dependency injection
        self.ai_service = context.get_service('ai_service')
        if not self.ai_service:
            logger.warning("AI Service not available in context. Typology analysis will fail.")
            
        return True
    
    async def execute(self, inputs: Dict[str, Any]) -> Dict[str, Any]:
        """
        Expects {"case_data": {...}}
        """
        case_data = inputs.get("case_data")
        if not case_data:
            return {"error": "No case data provided"}
            
        if not self.ai_service:
             return {"error": "AI Service unavailable"}

        return await self._analyze_typology_context(case_data)

    async def _analyze_typology_context(
        self, case_data: Dict[str, Any]
    ) -> Dict[str, Any]:
        """
        RAG: Extract context from case and search Typology Knowledge Base.
        Copied and adapted from legacy AIService.
        """
        insights = []
        recommendations = []
        confidence = 0.0

        # 1. Construct Query from Case Data
        query_parts = []

        # Transactions
        transactions = case_data.get("transactions", [])
        for t in transactions:
            if t.get("description"):
                query_parts.append(t["description"])
            if t.get("amount", 0) > 5000:
                query_parts.append(f"High value transaction {t.get('amount')}")

        # Entities
        entities = case_data.get("entities", [])
        for e in entities:
            if e.get("type"):
                query_parts.append(e["type"])

        # Evidence (Summaries)
        evidence = case_data.get("evidence", [])
        for ev in evidence:
            if ev.get("summary"):
                query_parts.append(ev["summary"])

        if not query_parts:
            return {
                "insights": ["Insufficient data for typology analysis"],
                "risk_score": 0,
            }

        search_query = " ".join(query_parts)[:1000]  # Limit query length

        # 2. Semantic Search in Knowledge Base
        # We assume ai_service exposes semantic_search(query, limit, filters)
        results = await self.ai_service.semantic_search(
            search_query,
            limit=self.config.limit,
            filters=None,
        )

        # 3. Process Results
        matches = []
        for res in results:
            if res["similarity"] > self.config.similarity_threshold:
                matches.append(res)

        if matches:
            confidence = max(m["similarity"] for m in matches)
            # Take top match
            top_match = matches[0]
            typology_name = (
                top_match["metadata"]
                .get("filename", "Unknown")
                .replace(".md", "")
                .replace("_", " ")
                .title()
            )

            insights.append(
                f"Activity matches '{typology_name}' typology patterns (Confidence: {confidence:.2f})"
            )

            # Extract indicators from content
            content_lines = top_match["content"].split("\n")
            indicators = [
                line.strip("- ")
                for line in content_lines
                if line.strip().startswith("-")
            ][:3]
            if indicators:
                recommendations.append(
                    f"Check for {typology_name} indicators: {', '.join(indicators)}"
                )

        return {
            "insights": insights,
            "recommendations": recommendations,
            "confidence": confidence,
            "risk_score": int(confidence * 100),
            "typology_matches": matches,
        }

    async def cleanup(self) -> None:
        self.ai_service = None

    def validate_config(self, config: Dict[str, Any]) -> List[str]:
        return []
