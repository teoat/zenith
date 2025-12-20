
import asyncio
import os
import sys
import logging

# Setup paths
sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), "..")))

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

async def verify_plugin_di():
    print("\n--- PLUGIN DEPENDENCY INJECTION VERIFICATION ---\n")
    
    try:
        from core.plugin_system.registry import plugin_registry_service
        from core.plugin_system import PluginContext
        
        # 1. Check if registry service is initialized
        print(f"[*] Registry Service instance: {plugin_registry_service}")
        
        # 2. Trigger loading of a plugin (or manually trigger the context creation logic)
        # We'll peek into how get_plugin creates the context.
        # registry.py line 258 starts the plugin instantiation
        
        # Since get_plugin is async and does a lot of DB stuff, let's try to 
        # simulate the service injection logic from registry.py locally to see if it fails.
        
        print("[*] Simulating service injection logic...")
        services = {}
        try:
            from app.services.ai.ai_service import AIService
            print("[+] AIService imported successfully")
            
            ai_service_instance = AIService()
            print("[+] AIService instantiated")
            
            await ai_service_instance.initialize()
            services['ai_service'] = ai_service_instance
            print("[+] AIService initialized and added to services dict")
            
            from app.services.infrastructure.storage.database_service import db_service
            services['db_service'] = db_service
            print("[+] db_service added to services dict")
            
            from app.services.infrastructure.monitoring_service import monitoring_service
            services['monitoring_service'] = monitoring_service
            print("[+] monitoring_service added to services dict")
            
        except ImportError as e:
            print(f"[-] ERROR: Could not inject some services: {e}")
        except Exception as e:
            print(f"[-] ERROR: Unexpected failure during service injection: {e}")
            import traceback
            traceback.print_exc()
            
        # 3. Final Assertion
        if 'ai_service' in services and services['ai_service'] is not None:
            print("\n[✅] SUCCESS: AIService is correctly injectable.")
            if hasattr(services['ai_service'], 'initialized') and services['ai_service'].initialized:
                 print("[✅] SUCCESS: AIService is fully initialized.")
            else:
                 print("[⚠️] WARNING: AIService exists but is NOT initialized.")
        else:
            print("\n[❌] FAILURE: AIService is MISSING from the context services.")
            
        if 'db_service' in services:
             print("[✅] SUCCESS: db_service is present.")
        else:
             print("[❌] FAILURE: db_service is MISSING.")

    except Exception as e:
        print(f"[-] CRITICAL FAILURE: Verification script failed: {e}")
        import traceback
        traceback.print_exc()

if __name__ == "__main__":
    # Ensure ENVIRONMENT is set for Mock logic if needed
    os.environ["ENVIRONMENT"] = "test"
    asyncio.run(verify_plugin_di())
