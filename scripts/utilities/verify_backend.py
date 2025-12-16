import asyncio
import os
import sys

# Add backend directory to path
sys.path.append(os.path.join(os.getcwd(), "backend"))

from models.evidence import InvestigativeEvent

from core.config_profile import ConfigurationProfile
from services.evidence_engine import EvidenceEngine


async def main():
    print("Running Verification Script...")

    # Test Evidence Engine
    engine = EvidenceEngine()

    # Mock Chat
    chat_log = "[2025-12-07 14:00] Alice: The transfer is done.\n[2025-12-07 14:05] Bob: Great."
    events = await engine.process_chat_log(chat_log, "chat_export.txt")

    if len(events) == 2:
        print(f"✅ Parsed {len(events)} chat events.")
        print(f"   Sample: {events[0].content}")
    else:
        print(f"❌ Failed to parse chat events. Got {len(events)}")

    # Mock Models
    try:
        evt = InvestigativeEvent(id="123", content="Test")
        profile = ConfigurationProfile(name="Default")
        print("✅ Models instantiated successfully.")
    except Exception as e:
        print(f"❌ Model instantiation failed: {e}")

    print("Verification Complete.")


if __name__ == "__main__":
    asyncio.run(main())
