import sys
import os
import asyncio

# Add project root to path
sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), "../../")))

from backend.app.services.fraud_rules_engine import FraudRulesEngine

async def test_behavioral_rules():
    engine = FraudRulesEngine()
    print("Testing Behavioral Rules...")

    # Test 1: Money Mule (Pass-Through)
    print("\n[Test 1] Money Mule Pattern")
    mule_case = {
        "id": "case_mule_001",
        "transactions": [
            {"type": "credit", "amount": 15000, "date": "2023-01-01T10:00:00"},
            {"type": "debit", "amount": 14800, "date": "2023-01-01T14:00:00"} # 98.6% ratio
        ],
        "entities": [{"name": "John Doe", "metadata": {"age": "30"}}]
    }
    alerts = engine.check_behavioral_anomalies(mule_case)
    if any(a['rule_id'] == 'behavioral_money_mule' for a in alerts):
        print("✅ Money Mule Detected: PASS")
    else:
        print("❌ Money Mule Failed: FAIL")
        print(alerts)

    # Test 2: Ghost Employee
    print("\n[Test 2] Ghost Employee Pattern")
    ghost_case = {
        "id": "case_ghost_001",
        "transactions": [],
        "entities": [
            {"name": "Alice", "metadata": {"bank_account": "ACC_12345"}},
            {"name": "Bob", "metadata": {"bank_account": "ACC_12345"}} # Shared Account
        ]
    }
    alerts = engine.check_behavioral_anomalies(ghost_case)
    if any(a['rule_id'] == 'behavioral_ghost_employee' for a in alerts):
        print("✅ Ghost Employee Detected: PASS")
    else:
        print("❌ Ghost Employee Failed: FAIL")
        print(alerts)
    
    # Test 3: Elder Exploitation
    print("\n[Test 3] Elder Exploitation Pattern")
    elder_case = {
        "id": "case_elder_001",
        "transactions": [
             {"type": "debit", "amount": 6000, "date": "2023-01-01"}
        ],
        "entities": [
            {"name": "Grandma Jenkins", "metadata": {"age": "85"}}
        ]
    }
    alerts = engine.check_behavioral_anomalies(elder_case)
    if any(a['rule_id'] == 'behavioral_elder_exploitation' for a in alerts):
        print("✅ Elder Exploitation Detected: PASS")
    else:
        print("❌ Elder Exploitation Failed: FAIL")
        print(alerts)

if __name__ == "__main__":
    asyncio.run(test_behavioral_rules())
