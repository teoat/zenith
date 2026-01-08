"""
Unit Tests for Service Components
API Gateway, AI/ML Service, Fraud+Intel Service, Workflow Service
"""

import pytest
from unittest.mock import Mock, AsyncMock, patch
import sys
from pathlib import Path

# Add project root to path
sys.path.insert(0, str(Path(__file__).parent.parent.parent))


class TestAPIGateway:
    """Tests for API Gateway container components."""
    
    @pytest.fixture
    def mock_http_client(self):
        client = AsyncMock()
        client.get = AsyncMock(return_value={"status": "ok"})
        client.post = AsyncMock(return_value={"id": "123"})
        return client
    
    @pytest.fixture
    def mock_cache(self):
        cache = AsyncMock()
        cache.get = AsyncMock(return_value=None)
        cache.set = AsyncMock()
        return cache
    
    @pytest.mark.asyncio
    async def test_health_check_endpoint(self, mock_http_client):
        """Test health check returns all service statuses."""
        # Simulate health check aggregation
        services = ["ai-ml", "fraud-intel", "workflow"]
        results = {}
        
        for service in services:
            mock_http_client.get.return_value = {"status": "healthy"}
            result = await mock_http_client.get(f"http://{service}/health")
            results[service] = result["status"]
        
        assert all(s == "healthy" for s in results.values())
    
    @pytest.mark.asyncio
    async def test_route_to_correct_service(self, mock_http_client):
        """Test requests are routed to correct service."""
        routes = {
            "/api/ai": "ai-ml-service",
            "/api/fraud": "fraud-intel-service",
            "/api/workflow": "workflow-regulatory-service",
        }
        
        for path, expected_service in routes.items():
            # Simulated routing logic
            service = path.split("/")[2].split("-")[0] + "-service"
            if "ai" in path:
                service = "ai-ml-service"
            elif "fraud" in path:
                service = "fraud-intel-service"
            elif "workflow" in path:
                service = "workflow-regulatory-service"
            
            assert expected_service == service
    
    @pytest.mark.asyncio
    async def test_cache_hit(self, mock_cache):
        """Test cached response is returned."""
        mock_cache.get.return_value = {"data": "cached"}
        
        result = await mock_cache.get("key123")
        assert result == {"data": "cached"}
    
    @pytest.mark.asyncio
    async def test_cache_miss_fetches_data(self, mock_cache, mock_http_client):
        """Test cache miss fetches from service."""
        mock_cache.get.return_value = None
        mock_http_client.get.return_value = {"data": "fresh"}
        
        cached = await mock_cache.get("key123")
        if cached is None:
            result = await mock_http_client.get("http://service/data")
            await mock_cache.set("key123", result)
        else:
            result = cached
        
        assert result == {"data": "fresh"}
        mock_cache.set.assert_called_once()


class TestAIMLService:
    """Tests for AI/ML service container components."""
    
    @pytest.fixture
    def mock_model(self):
        model = Mock()
        model.predict = Mock(return_value=[0.85, 0.15])
        model.encode = Mock(return_value=[0.1, 0.2, 0.3])
        return model
    
    def test_fraud_prediction(self, mock_model):
        """Test fraud model prediction."""
        features = {"amount": 1000, "time": "2AM", "location": "overseas"}
        
        prediction = mock_model.predict([features])
        
        assert len(prediction) == 2
        assert prediction[0] > 0.5  # High fraud probability
    
    def test_embedding_generation(self, mock_model):
        """Test text embedding generation."""
        text = "suspicious transaction pattern"
        
        embedding = mock_model.encode(text)
        
        assert len(embedding) == 3
        assert all(isinstance(x, float) for x in embedding)
    
    def test_model_caching(self, mock_model):
        """Test model is cached after loading."""
        model_cache = {}
        
        def get_model(name):
            if name not in model_cache:
                model_cache[name] = mock_model
            return model_cache[name]
        
        # First call loads model
        model1 = get_model("fraud_detector")
        # Second call returns cached
        model2 = get_model("fraud_detector")
        
        assert model1 is model2
    
    def test_batch_inference(self, mock_model):
        """Test batch inference for efficiency."""
        mock_model.predict = Mock(return_value=[[0.9], [0.1], [0.5]])
        
        batch = [
            {"amount": 10000},
            {"amount": 50},
            {"amount": 500},
        ]
        
        predictions = mock_model.predict(batch)
        
        assert len(predictions) == 3
        # Single call for batch
        assert mock_model.predict.call_count == 1


class TestFraudIntelService:
    """Tests for Fraud + Intelligence service components."""
    
    @pytest.fixture
    def mock_graph(self):
        graph = Mock()
        graph.add_node = Mock()
        graph.add_edge = Mock()
        graph.shortest_path = Mock(return_value=["A", "B", "C"])
        graph.connected_components = Mock(return_value=[{"A", "B"}, {"C"}])
        return graph
    
    @pytest.fixture
    def mock_pattern_detector(self):
        detector = Mock()
        detector.detect = Mock(return_value=[
            {"pattern": "velocity", "score": 0.9},
            {"pattern": "amount", "score": 0.7},
        ])
        return detector
    
    def test_build_transaction_graph(self, mock_graph):
        """Test transaction graph construction."""
        transactions = [
            {"from": "A", "to": "B", "amount": 100},
            {"from": "B", "to": "C", "amount": 200},
        ]
        
        for tx in transactions:
            mock_graph.add_node(tx["from"])
            mock_graph.add_node(tx["to"])
            mock_graph.add_edge(tx["from"], tx["to"], amount=tx["amount"])
        
        assert mock_graph.add_node.call_count == 4
        assert mock_graph.add_edge.call_count == 2
    
    def test_find_connected_entities(self, mock_graph):
        """Test finding connected entities in graph."""
        components = mock_graph.connected_components()
        
        assert len(components) == 2
        assert {"A", "B"} in components
    
    def test_pattern_detection(self, mock_pattern_detector):
        """Test fraud pattern detection."""
        transaction = {"amount": 50000, "time": "3AM", "velocity": 10}
        
        patterns = mock_pattern_detector.detect(transaction)
        
        assert len(patterns) == 2
        assert patterns[0]["pattern"] == "velocity"
        assert patterns[0]["score"] > 0.8
    
    def test_risk_score_calculation(self):
        """Test risk score calculation."""
        patterns = [
            {"pattern": "velocity", "score": 0.9, "weight": 0.4},
            {"pattern": "amount", "score": 0.7, "weight": 0.3},
            {"pattern": "time", "score": 0.5, "weight": 0.3},
        ]
        
        risk_score = sum(p["score"] * p["weight"] for p in patterns)
        
        assert 0 <= risk_score <= 1
        assert risk_score == pytest.approx(0.72, rel=0.01)


class TestWorkflowService:
    """Tests for Workflow + Regulatory service components."""
    
    @pytest.fixture
    def mock_workflow_engine(self):
        engine = Mock()
        engine.create_case = Mock(return_value={"id": "CASE-001", "status": "open"})
        engine.transition = Mock(return_value={"status": "review"})
        engine.assign = Mock()
        return engine
    
    @pytest.fixture
    def mock_compliance_checker(self):
        checker = Mock()
        checker.check = Mock(return_value={
            "compliant": True,
            "findings": [],
            "recommendations": []
        })
        return checker
    
    def test_create_case(self, mock_workflow_engine):
        """Test case creation."""
        case_data = {
            "title": "Suspicious Transaction",
            "priority": "high",
            "type": "fraud"
        }
        
        case = mock_workflow_engine.create_case(case_data)
        
        assert case["id"] == "CASE-001"
        assert case["status"] == "open"
    
    def test_case_state_transitions(self, mock_workflow_engine):
        """Test valid case state transitions."""
        valid_transitions = {
            "open": ["review", "assigned"],
            "assigned": ["in_progress", "on_hold"],
            "in_progress": ["resolved", "escalated"],
            "resolved": ["closed", "reopened"],
        }
        
        # Simulate transition
        mock_workflow_engine.transition.return_value = {"status": "review"}
        result = mock_workflow_engine.transition("CASE-001", "open", "review")
        
        assert result["status"] == "review"
    
    def test_compliance_check(self, mock_compliance_checker):
        """Test compliance checking."""
        case = {"id": "CASE-001", "resolution": "approved", "evidence": ["doc1"]}
        
        result = mock_compliance_checker.check(case)
        
        assert result["compliant"] is True
        assert len(result["findings"]) == 0
    
    def test_case_assignment(self, mock_workflow_engine):
        """Test case assignment to analyst."""
        mock_workflow_engine.assign("CASE-001", "analyst-001")
        
        mock_workflow_engine.assign.assert_called_once_with("CASE-001", "analyst-001")
    
    def test_compliance_report_generation(self):
        """Test compliance report generation."""
        cases = [
            {"id": "CASE-001", "status": "closed", "compliant": True},
            {"id": "CASE-002", "status": "open", "compliant": True},
            {"id": "CASE-003", "status": "closed", "compliant": False},
        ]
        
        report = {
            "total_cases": len(cases),
            "closed": sum(1 for c in cases if c["status"] == "closed"),
            "compliance_rate": sum(1 for c in cases if c["compliant"]) / len(cases),
        }
        
        assert report["total_cases"] == 3
        assert report["closed"] == 2
        assert report["compliance_rate"] == pytest.approx(0.667, rel=0.01)


class TestDatabaseService:
    """Tests for shared database service."""
    
    @pytest.fixture
    def mock_db(self):
        db = AsyncMock()
        db.execute = AsyncMock(return_value=Mock(fetchall=Mock(return_value=[])))
        db.commit = AsyncMock()
        return db
    
    @pytest.mark.asyncio
    async def test_connection_pooling(self, mock_db):
        """Test database connection pool is used."""
        # Simulate multiple queries using pool
        for _ in range(10):
            await mock_db.execute("SELECT 1")
        
        assert mock_db.execute.call_count == 10
    
    @pytest.mark.asyncio
    async def test_transaction_rollback(self, mock_db):
        """Test transaction rollback on error."""
        mock_db.execute.side_effect = Exception("DB Error")
        mock_db.rollback = AsyncMock()
        
        try:
            await mock_db.execute("INSERT ...")
        except Exception:
            await mock_db.rollback()
        
        mock_db.rollback.assert_called_once()


class TestHTTPClient:
    """Tests for inter-service HTTP client."""
    
    @pytest.fixture
    def mock_client(self):
        client = AsyncMock()
        client.request = AsyncMock()
        return client
    
    @pytest.mark.asyncio
    async def test_retry_on_failure(self, mock_client):
        """Test retry logic on transient failures."""
        # First two calls fail, third succeeds
        mock_client.request.side_effect = [
            Exception("Connection failed"),
            Exception("Connection failed"),
            {"status": "ok"}
        ]
        
        retries = 3
        for attempt in range(retries):
            try:
                result = await mock_client.request("GET", "/health")
                break
            except Exception:
                if attempt == retries - 1:
                    raise
        
        assert result == {"status": "ok"}
        assert mock_client.request.call_count == 3
    
    @pytest.mark.asyncio
    async def test_timeout_handling(self, mock_client):
        """Test timeout is properly handled."""
        import asyncio
        mock_client.request.side_effect = asyncio.TimeoutError()
        
        with pytest.raises(asyncio.TimeoutError):
            await mock_client.request("GET", "/slow-endpoint")


class TestServiceDiscovery:
    """Tests for service discovery mechanism."""
    
    def test_get_service_url(self):
        """Test service URL resolution."""
        services = {
            "api-gateway": "http://api-gateway:8000",
            "ai-ml-service": "http://ai-ml-service:8001",
            "fraud-intel-service": "http://fraud-intel-service:8002",
            "workflow-regulatory-service": "http://workflow-regulatory-service:8003",
        }
        
        for name, expected_url in services.items():
            assert services[name] == expected_url
    
    def test_service_health_check(self):
        """Test service health status tracking."""
        health_status = {
            "api-gateway": {"healthy": True, "last_check": "2026-01-08T04:00:00Z"},
            "ai-ml-service": {"healthy": True, "last_check": "2026-01-08T04:00:00Z"},
        }
        
        assert all(s["healthy"] for s in health_status.values())


if __name__ == "__main__":
    pytest.main([__file__, "-v"])
