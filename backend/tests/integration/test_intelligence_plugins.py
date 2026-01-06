import asyncio
import logging
import os
import sys

# Add backend to path
sys.path.append(os.path.join(os.path.dirname(__file__), ".."))

from core.database import SessionLocal
from core.plugin_system.interface import PluginContext
from core.plugin_system.registry import plugin_registry_service

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger("verifier")


class MockAIService:
    async def semantic_search(self, query, limit=10, filters=None):
        logger.info(f"Mock Semantic Search called with: {query}")
        # Return mock typology match
        return [
            {
                "similarity": 0.95,
                "content": "Typology: Shell Company Scheme\n- High value transaction > 5000\n- Round number\n- Offshore",
                "metadata": {"filename": "Shell_Company_Scheme.md"},
            }
        ]


async def verify_intelligence_plugins():
    db = SessionLocal()
    try:
        # 1. Typology Analysis
        logger.info("--- Verifying Typology Analysis ---")
        typology_plugin = await plugin_registry_service.get_plugin(
            "zenith/intelligence/typology_analysis", db
        )

        # Inject Mock AI Service
        context = PluginContext(config={}, services={"ai_service": MockAIService()})
        await typology_plugin.initialize(context)

        case_data = {
            "transactions": [
                {"description": "Consulting fee", "amount": 6000},
                {"description": "Service payment", "amount": 6000},
            ],
            "entities": [{"type": "Company"}],
            "evidence": [],
        }

        result = await typology_plugin.execute({"case_data": case_data})
        logger.info(f"Typology Result: {result}")

        if result.get("confidence", 0) > 0.9:
            logger.info("✅ Typology Analysis Passed")
        else:
            logger.error("❌ Typology Analysis Failed")

        # 2. Entity Linkage
        logger.info("\n--- Verifying Entity Linkage ---")
        linkage_plugin = await plugin_registry_service.get_plugin(
            "zenith/intelligence/entity_linkage", db
        )
        await linkage_plugin.initialize(context)  # Context doesn't matter much here

        linkage_case = {
            "transactions": [
                {"sender": "A", "receiver": "B"},
                {"sender": "A", "receiver": "C"},
                {"sender": "A", "receiver": "D"},
                {"sender": "B", "receiver": "A"},
            ],
            "entities": ["A", "B", "C", "D"],
        }

        linkage_result = await linkage_plugin.execute({"case_data": linkage_case})
        logger.info(f"Linkage Result: {linkage_result}")

        # Expecting Entity A to be connected to 3 entities (B, C, D)
        # Threshold is default 3.
        match = any(
            "Entity 'A' connected to 3" in i for i in linkage_result.get("insights", [])
        )
        if match:
            logger.info("✅ Entity Linkage Passed")
        else:
            logger.error("❌ Entity Linkage Failed")

        # 3. Evidence Analysis
        logger.info("\n--- Verifying Evidence Analysis ---")
        evidence_plugin = await plugin_registry_service.get_plugin(
            "zenith/intelligence/evidence_analysis", db
        )
        await evidence_plugin.initialize(context)

        evidence_case = {
            "evidence": [
                {
                    "filename": "invoice.pdf",
                    "content": "Payment to offshore shell company in Cayman",
                }
            ]
        }

        evidence_result = await evidence_plugin.execute({"case_data": evidence_case})
        logger.info(f"Evidence Result: {evidence_result}")

        if "contains suspicious keywords" in str(evidence_result.get("insights")):
            logger.info("✅ Evidence Analysis Passed")
        else:
            logger.error("❌ Evidence Analysis Failed")

    except Exception as e:
        logger.error(f"Verification failed: {e}")
        import traceback

        traceback.print_exc()
    finally:
        db.close()


if __name__ == "__main__":
    asyncio.run(verify_intelligence_plugins())
