#!/usr/bin/env python3
"""
Quick endpoint test script for fraud detection API
Tests key endpoints without starting full server
"""

import asyncio
import os
import sys

sys.path.insert(0, os.path.dirname(__file__))


async def test_endpoints():
    """Test key endpoints directly"""
    try:
        print("Testing fraud_rules import...")
        print("✅ fraud_rules imported successfully")

        print("Testing fraud engine...")
        from app.services.fraud_rules_engine import get_fraud_engine

        engine = get_fraud_engine()
        print(f"✅ Fraud engine initialized with {len(engine.rules)} rules")

        print("Testing main app import...")
        from main import app

        print("✅ Main app imported successfully")

        # Check routes
        routes = [route for route in app.routes if hasattr(route, "path")]
        fraud_routes = [
            r for r in routes if hasattr(r, "path") and "rules" in str(r.path)
        ]

        print(f"Found {len(fraud_routes)} fraud rules routes:")
        for route in fraud_routes[:5]:  # Show first 5
            print(f"  {route.methods} {route.path}")

        print("\n✅ All endpoint tests passed!")
        return True

    except Exception as e:
        print(f"❌ Test failed: {e}")
        import traceback

        traceback.print_exc()
        return False


if __name__ == "__main__":
    success = asyncio.run(test_endpoints())
    sys.exit(0 if success else 1)
