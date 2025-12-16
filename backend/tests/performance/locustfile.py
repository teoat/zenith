"""
Load testing for Simple378 Fraud Detection API
Tests system performance under concurrent load
"""
from locust import HttpUser, task, between, TaskSet
import json
import random
from datetime import datetime, timedelta

class CaseManagementTasks(TaskSet):
    """Task set for case management workflows"""
    
    def on_start(self):
        """Login and get auth token"""
        response = self.client.post("/auth/login", json={
            "username": "load_test_user",
            "password": "LoadTest123!"
        })
        if response.status_code == 200:
            self.token = response.json().get("access_token")
            self.headers = {"Authorization": f"Bearer {self.token}"}
        else:
            self.headers = {}
    
    @task(5)
    def list_cases(self):
        """GET /api/v1/cases - List all cases"""
        self.client.get(
            "/api/v1/cases",
            headers=self.headers,
            name="List Cases"
        )
    
    @task(3)
    def get_case_details(self):
        """GET /api/v1/cases/{id} - Get specific case"""
        case_id = f"case_{random.randint(1, 1000)}"
        self.client.get(
            f"/api/v1/cases/{case_id}",
            headers=self.headers,
            name="Get Case Details"
        )
    
    @task(2)
    def create_case(self):
        """POST /api/v1/cases - Create new case"""
        case_data = {
            "title": f"Load Test Case {random.randint(1, 10000)}",
            "description": "Automated load testing case",
            "priority": random.choice(["low", "medium", "high", "critical"]),
            "case_type": random.choice(["fraud_suspected", "money_laundering", "structuring"])
        }
        
        response = self.client.post(
            "/api/v1/cases",
            json=case_data,
            headers=self.headers,
            name="Create Case"
        )
        
        if response.status_code in [200, 201]:
            self.case_id = response.json().get("id")
    
    @task(2)
    def search_cases(self):
        """GET /api/v1/cases?search=... - Search cases"""
        search_terms = ["fraud", "structuring", "suspicious", "money laundering"]
        term = random.choice(search_terms)
        
        self.client.get(
            f"/api/v1/cases?search={term}",
            headers=self.headers,
            name="Search Cases"
        )
    
    @task(1)
    def update_case(self):
        """PUT /api/v1/cases/{id} - Update case"""
        if hasattr(self, 'case_id'):
            update_data = {
                "status": random.choice(["open", "investigating", "closed_approved"]),
                "risk_score": random.uniform(0, 100)
            }
            
            self.client.put(
                f"/api/v1/cases/{self.case_id}",
                json=update_data,
                headers=self.headers,
                name="Update Case"
            )

class FraudAnalysisTasks(TaskSet):
    """Task set for fraud detection workflows"""
    
    def on_start(self):
        """Setup"""
        self.case_id = "test_case_fraud_analysis"
    
    @task(3)
    def analyze_transactions(self):
        """POST /api/v1/fraud/analyze - Run fraud analysis"""
        transactions = []
        for i in range(random.randint(5, 20)):
            transactions.append({
                "amount": random.uniform(100, 10000),
                "date": (datetime.now() - timedelta(days=random.randint(0, 30))).isoformat(),
                "merchant": f"Merchant_{random.randint(1, 100)}"
            })
        
        self.client.post(
            "/api/v1/fraud/analyze",
            json={
                "case_id": self.case_id,
                "transactions": transactions
            },
            name="Analyze Transactions"
        )
    
    @task(2)
    def get_risk_score(self):
        """GET /api/v1/fraud/risk-score/{case_id}"""
        self.client.get(
            f"/api/v1/fraud/risk-score/{self.case_id}",
            name="Get Risk Score"
        )
    
    @task(1)
    def detect_patterns(self):
        """POST /api/v1/fraud/detect-patterns"""
        self.client.post(
            "/api/v1/fraud/detect-patterns",
            json={"case_id": self.case_id},
            name="Detect Patterns"
        )

class EvidenceUploadTasks(TaskSet):
    """Task set for evidence upload workflows"""
    
    @task(2)
    def upload_document(self):
        """POST /api/v1/evidence/upload - Upload evidence file"""
        # Simulate file upload
        files = {
            'file': ('test_document.pdf', b'%PDF-1.4 fake content...', 'application/pdf')
        }
        
        self.client.post(
            "/api/v1/evidence/upload",
            files=files,
            name="Upload Evidence"
        )
    
    @task(1)
    def process_evidence(self):
        """POST /api/v1/evidence/process - Process uploaded evidence"""
        self.client.post(
            "/api/v1/evidence/process",
            json={"evidence_id": f"evidence_{random.randint(1, 1000)}"},
            name="Process Evidence"
        )

class FraudAnalystUser(HttpUser):
    """Simulate fraud analyst user behavior"""
    wait_time = between(1, 3)  # Wait 1-3 seconds between tasks
    tasks = [CaseManagementTasks, FraudAnalysisTasks, EvidenceUploadTasks]
    weight = 3  # 75% of users are analysts

class ManagerUser(HttpUser):
    """Simulate manager user behavior (read-heavy)"""
    wait_time = between(2, 5)
    tasks = [CaseManagementTasks]
    weight = 1  # 25% of users are managers

# Performance test scenarios
class QuickLoad(HttpUser):
    """Quick load test - simulate normal traffic"""
    wait_time = between(1, 2)
    tasks = [CaseManagementTasks]

class StressLoad(HttpUser):
    """Stress test - high concurrent load"""
    wait_time = between(0.5, 1)
    tasks = [CaseManagementTasks, FraudAnalysisTasks]

class SpikeLoad(HttpUser):
    """Spike test - sudden bursts of traffic"""
    wait_time = between(0.1, 0.5)
    tasks = [CaseManagementTasks, FraudAnalysisTasks, EvidenceUploadTasks]

# Run instructions:
# 
# Quick load test:
#   locust -f locustfile.py --headless --users 50 --spawn-rate 5 --run-time 60s
#
# Stress test:
#   locust -f locustfile.py --headless --users 200 --spawn-rate 20 --run-time 300s
#
# Spike test:
#   locust -f locustfile.py --headless --users 500 --spawn-rate 100 --run-time 120s
#
# Interactive mode (with web UI):
#   locust -f locustfile.py
#   # Then open http://localhost:8089
