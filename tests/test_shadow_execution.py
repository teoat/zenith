import asyncio
import logging
import os
import sys
from typing import Any

# Add backend to path
sys.path.append(os.path.join(os.path.dirname(__file__), ".."))

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

from core.database import SessionLocal
from core.plugin_system import shadow_executor


# Mock legacy function
async def legacy_crypto_check(transaction: dict[str, Any]) -> dict[str, Any]:
    """Legacy implementation we want to replace"""
    logger.info("Running legacy crypto check...")
    await asyncio.sleep(0.1)  # Simulate work

    amount = float(transaction.get("amount", 0))
    # Simple legacy logic
    is_fraud = amount > 1000

    return {"is_fraud": is_fraud, "score": 0.8 if is_fraud else 0.1, "source": "legacy"}


def comparison_function(legacy_result, plugin_result):
    """Custom comparison logic"""
    # We compare is_fraud decision
    match = legacy_result["is_fraud"] == plugin_result["is_fraud"]

    diffs = {}
    if not match:
        diffs = {
            "legacy": legacy_result["is_fraud"],
            "plugin": plugin_result["is_fraud"],
        }

    return match, 1.0 if match else 0.0, diffs


async def main():
    logger.info("Starting Shadow Mode Test for Crypto Fraud Detector...")

    # 1. Setup Input Data (High value bitcoin transaction)
    input_data = {
        "hash": "tx_123456789",
        "amount": 12.5,
        "blockchain": "bitcoin",
        "timestamp": "2023-10-27T10:00:00Z",
    }  # Legacy logic says not fraud (12.5 < 1000? Wait, 12.5 BTC is huge, but if legacy checks simplified amount...)
    # Legacy: amount > 1000. 12.5 is < 1000. So Legacy -> False.
    # Plugin: amount > 10.0 -> Risk 0.8 (Fraud).
    # So we EXPECT a mismatch.

    db = SessionLocal()

    try:
        # 2. Execute via Shadow Executor
        plugin_id = "zenith/detection/fraud/crypto_fraud_detector"

        logger.info(f"Executing plugin {plugin_id} in shadow mode...")

        result = await shadow_executor.execute_with_shadow(
            plugin_id=plugin_id,
            production_function=legacy_crypto_check,
            input_data=input_data,
            comparison_function=comparison_function,
            db_session=db,
        )

        logger.info(f"Production Result returned: {result}")

        # Give time for shadow task to complete (since it's fire-and-forget in background)
        await asyncio.sleep(2)

        logger.info("Test complete. Check logs for shadow execution details.")

    except Exception as e:
        logger.error(f"Test failed: {e}")
    finally:
        db.close()


if __name__ == "__main__":
    asyncio.run(main())
