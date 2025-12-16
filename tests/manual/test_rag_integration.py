import sys
import os
import asyncio
import json

# Add project root to path
sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), "../../")))

from backend.app.services.ai_service import AIService

async def test_rag_integration():
    print("🚀 Testing RAG Integration...")
    ai = AIService()
    await ai.initialize()

    # Simulate a case that matches "Integration" typology (Real Estate, High Value)
    case_data = {
        "id": "case_123",
        "description": "Suspicious property purchase with cash.",
        "transactions": [
            {"amount": 500000, "description": "Purchase of luxury Villa in Bali", "date": "2023-10-01"},
            {"amount": 12000, "description": "Fees for escrow", "date": "2023-10-02"}
        ],
        "entities": [
            {"name": "John Doe", "type": "Individual"},
            {"name": "Shell Corp Ltd", "type": "Company"}
        ],
        "evidence": [
            {"filename": "deed.pdf", "summary": "Property Deed transfer for 5 million USD. No mortgage."}
        ]
    }

    print("\n🔍 Analyzing Case...")
    # Specifically call the new context analysis
    result = await ai.analyze_case(case_data, 'typology_context')

    print("\n📊 Analysis Result:")
    print(json.dumps(result, indent=2))

    # Assertions
    insights = result.get('insights', [])
    matches = result.get('typology_matches', [])

    if any("Integration" in i for i in insights) or any("Integration" in m.get('metadata', {}).get('filename', '') for m in matches):
        print("\n✅ SUCCESS: Integration Typology detected via RAG!")
    else:
        print("\n❌ FAILURE: Integration Typology NOT detected.")

if __name__ == "__main__":
    asyncio.run(test_rag_integration())
