import sys
import os
import asyncio
import logging

# Add backend to path
sys.path.append(os.path.join(os.path.dirname(__file__), "../.."))

from core.database import SessionLocal
from core.plugin_system.registry import plugin_registry_service
from core.plugin_system.interface import PluginContext

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger("full_stack_verifier")

async def verify_full_stack():
    db = SessionLocal()
    try:
        context = PluginContext(config={}, services={})

        # 1. Verify UI Plugin
        logger.info("--- Verifying UI Plugin (Phase 4) ---")
        ui_plugin = await plugin_registry_service.get_plugin("378x492/ui/fraud_metrics_widget", db)
        await ui_plugin.initialize(context)
        
        ui_result = await ui_plugin.execute({})
        logger.info(f"UI Config: {ui_result}")
        if ui_result.get("type") == "line" and "data_source" in ui_result:
            logger.info("✅ UI Plugin Passed")
        else:
            logger.error("❌ UI Plugin Failed")

        # 2. Verify Integration Plugin
        logger.info("\n--- Verifying Integration Plugin (Phase 5) ---")
        email_plugin = await plugin_registry_service.get_plugin("378x492/integration/email_notifier", db)
        await email_plugin.initialize(context)
        
        email_result = await email_plugin.execute({
            "to": "admin@example.com",
            "subject": "System Alert",
            "body": "This is a test notification."
        })
        logger.info(f"Email Result: {email_result}")
        if email_result.get("status") == "success":
            logger.info("✅ Integration Plugin Passed")
        else:
            logger.error("❌ Integration Plugin Failed")

        # 3. Verify Workflow Plugin
        logger.info("\n--- Verifying Workflow Plugin (Phase 6) ---")
        assign_plugin = await plugin_registry_service.get_plugin("378x492/workflow/round_robin_assigner", db)
        await assign_plugin.initialize(context)
        
        agents = ["Agent A", "Agent B"]
        # Call 1
        res1 = await assign_plugin.execute({"agents": agents, "case_id": "1"})
        # Call 2
        res2 = await assign_plugin.execute({"agents": agents, "case_id": "2"})
        # Call 3
        res3 = await assign_plugin.execute({"agents": agents, "case_id": "3"})
        
        logger.info(f"Assignments: {res1['assigned_agent']} -> {res2['assigned_agent']} -> {res3['assigned_agent']}")
        
        # Verify rotation: A -> B -> A
        if (res1['assigned_agent'] == "Agent A" and 
            res2['assigned_agent'] == "Agent B" and 
            res3['assigned_agent'] == "Agent A"):
            logger.info("✅ Workflow Plugin Passed")
        else:
            logger.error("❌ Workflow Plugin Failed (Rotation check)")

    except Exception as e:
        logger.error(f"Full Stack Verification failed: {e}")
        import traceback
        traceback.print_exc()
    finally:
        db.close()

if __name__ == "__main__":
    asyncio.run(verify_full_stack())
