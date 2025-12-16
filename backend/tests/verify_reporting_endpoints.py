import requests
import json
import sys

BASE_URL = "http://localhost:8001/api/v1"

def test_endpoint(name, url, method="GET", body=None):
    print(f"Testing {name} ({method} {url})...")
    try:
        if method == "GET":
            response = requests.get(f"{BASE_URL}{url}")
        elif method == "POST":
            response = requests.post(f"{BASE_URL}{url}", json=body)
        
        if response.status_code == 200:
            print(f"✅ {name} Passed")
            print(json.dumps(response.json(), indent=2))
            return True
        else:
            print(f"❌ {name} Failed: {response.status_code}")
            print(response.text)
            return False
    except Exception as e:
        print(f"❌ {name} Error: {e}")
        return False

def run_tests():
    passed = True
    
    # Test 1: Case Analytics
    if not test_endpoint("Case Analytics", "/analytics/cases"):
        passed = False
        
    # Test 2: Transaction Analytics
    if not test_endpoint("Transaction Analytics", "/analytics/transactions"):
        passed = False

    # Test 3: System Overview
    if not test_endpoint("System Overview", "/analytics/overview"):
        passed = False

    # Test 4: Export Report
    if not test_endpoint("Export Report", "/reporting/export", "POST", {
        "caseIds": ["CASE-123"],
        "format": "pdf"
    }):
        passed = False
        
    if passed:
        print("\n🎉 All Reporting Endpoints Verified!")
        sys.exit(0)
    else:
        print("\n💥 Some tests failed.")
        sys.exit(1)

if __name__ == "__main__":
    run_tests()
