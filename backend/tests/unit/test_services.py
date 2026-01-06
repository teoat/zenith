"""Unit tests for fraud detection services"""

from datetime import UTC, datetime
from unittest.mock import AsyncMock, MagicMock, patch

import pytest
from app.services.ai.ai_service import AIService
from app.services.fraud.engine import FraudRule, RuleEngine
from app.services.fraud.fraud_service import FraudDetectionService
from app.services.infrastructure.monitoring_service import MonitoringService


class TestFraudDetectionService:
    """Test fraud detection service"""

    @pytest.fixture
    def fraud_service(self):
        """Create fraud detection service instance"""
        mock_db = MagicMock()
        return FraudDetectionService(mock_db)

    def test_service_initialization(self, fraud_service):
        """Test service initialization"""
        assert fraud_service is not None
        assert hasattr(fraud_service, "analyze_case")
        assert hasattr(fraud_service, "rule_engine")

    @pytest.mark.asyncio
    @patch("app.services.fraud.fraud_service.RuleEngine")
    async def test_analyze_case(self, mock_rule_engine_cls, fraud_service):
        """Test case analysis functionality"""
        # Mock case data
        mock_case = MagicMock()
        mock_case.id = "case123"
        mock_case.customer_id = "cust123"

        # Mock transactions
        mock_transaction = MagicMock()
        mock_transaction.id = "tx1"
        mock_transaction.amount = 1000.0
        mock_transaction.timestamp = datetime.now(UTC)

        # Setup db query mock to handle both Case and Transaction queries
        # Since db.query(...).filter(...) returns the same mock object by default,
        # we can configure both first() (for Case) and all() (for Transactions) on it.
        mock_query = fraud_service.db.query.return_value
        mock_filter = mock_query.filter.return_value
        mock_filter.first.return_value = mock_case
        mock_filter.all.return_value = [mock_transaction]

        # Ensure side_effect is cleared if it was set previously (though fresh fixture should handle it)
        fraud_service.db.query.side_effect = None

        # Mock rule engine instance
        mock_engine_instance = mock_rule_engine_cls.return_value
        fraud_service.rule_engine = mock_engine_instance

        mock_alert = MagicMock()
        mock_alert.rule_name = "test_rule"
        mock_alert.severity.value = "high"
        mock_alert.confidence = 0.9
        mock_alert.risk_score = 85.0
        mock_alert.description = "Test fraud alert"
        mock_alert.transaction_ids = ["tx1"]
        mock_alert.recommendations = []

        mock_engine_instance.execute_rules = AsyncMock(return_value=[mock_alert])

        result = await fraud_service.analyze_case("case123")

        assert result["case_id"] == "case123"
        assert result["alerts_generated"] == 1
        assert len(result["alerts"]) == 1
        assert result["alerts"][0]["rule_name"] == "test_rule"


class TestFraudRulesEngine:
    """Test fraud rules engine"""

    @pytest.fixture
    def rules_engine(self):
        """Create rules engine instance"""
        return RuleEngine()

    def test_engine_initialization(self, rules_engine):
        """Test engine initialization"""
        assert rules_engine is not None
        assert hasattr(rules_engine, "rules")
        assert hasattr(rules_engine, "execute_rules")

    @pytest.mark.asyncio
    async def test_execute_rules_empty(self, rules_engine):
        """Test rule execution with no transactions"""
        result = await rules_engine.execute_rules([])
        assert result == []

    @pytest.mark.asyncio
    async def test_execute_rules_with_data(self, rules_engine):
        """Test rule execution with transaction data"""
        transactions = [
            {
                "id": "tx1",
                "amount": 50000.0,
                "merchant_name": "Casino XYZ",
                "transaction_type": "DEBIT",
            }
        ]

        # Register a mock rule to ensure something happens
        mock_rule = MagicMock(spec=FraudRule)
        mock_rule.name = "MockRule"
        mock_rule.enabled = True
        mock_rule.execute = AsyncMock(return_value=[])
        rules_engine.register_rule(mock_rule)

        result = await rules_engine.execute_rules(transactions)

        assert isinstance(result, list)
        mock_rule.execute.assert_called_once()

    def test_get_execution_stats(self, rules_engine):
        """Test execution statistics retrieval"""
        stats = rules_engine.get_execution_stats()
        assert isinstance(stats, list)

    def test_rule_registration(self, rules_engine):
        """Test rule registration functionality"""
        # Register a mock rule
        mock_rule = MagicMock()
        mock_rule.name = "TestRule"
        rules_engine.register_rule(mock_rule)

        # Check that rules are registered
        assert "TestRule" in rules_engine.rules
        assert rules_engine.rules["TestRule"] == mock_rule


class TestAIService:
    """Test AI service functionality"""

    @pytest.fixture
    def ai_service(self):
        """Create AI service instance"""
        return AIService()

    @patch("app.services.ai.ai_service.AIService._initialize_model")
    def test_service_initialization(self, mock_init, ai_service):
        """Test AI service initialization"""
        assert ai_service is not None
        assert hasattr(ai_service, "analyze_transaction")
        assert hasattr(ai_service, "train_model")

    @patch("app.services.ai.ai_service.AIService._load_model")
    def test_analyze_transaction(self, mock_load, ai_service):
        """Test transaction analysis"""
        transaction = {
            "amount": 1000.0,
            "merchant": "Test Store",
            "location": "New York",
        }

        # Mock model prediction
        mock_model = MagicMock()
        mock_model.predict.return_value = [0.8]  # 80% fraud probability
        ai_service.model = mock_model

        result = ai_service.analyze_transaction(transaction)

        assert "fraud_probability" in result
        assert "risk_score" in result
        assert result["fraud_probability"] == 0.8

    @patch("app.services.ai.ai_service.AIService._save_model")
    @patch("app.services.ai.ai_service.AIService._train_model")
    def test_train_model(self, mock_train, mock_save, ai_service):
        """Test model training"""
        training_data = [
            {"amount": 100.0, "is_fraud": 0},
            {"amount": 10000.0, "is_fraud": 1},
        ]

        result = ai_service.train_model(training_data)

        assert result is True
        mock_train.assert_called_once()
        mock_save.assert_called_once()


class TestMonitoringService:
    """Test monitoring service functionality"""

    @pytest.fixture
    def monitoring_service(self):
        """Create monitoring service instance"""
        return MonitoringService()

    def test_service_initialization(self, monitoring_service):
        """Test monitoring service initialization"""
        assert monitoring_service is not None
        assert hasattr(monitoring_service, "record_error")
        assert hasattr(monitoring_service, "get_health_metrics")

    def test_record_error(self, monitoring_service):
        """Test error recording"""
        monitoring_service.record_error(
            "test_error", "Test error message", {"component": "test"}
        )

        # Check that error was recorded
        assert len(monitoring_service.error_counts) > 0

    def test_get_health_metrics(self, monitoring_service):
        """Test health metrics retrieval"""
        metrics = monitoring_service.get_health_metrics()

        assert "error_counts" in metrics
        assert "performance_metrics" in metrics
        assert "system_health" in metrics

    @patch("psutil.cpu_percent")
    @patch("psutil.virtual_memory")
    def test_system_metrics_collection(self, mock_memory, mock_cpu, monitoring_service):
        """Test system metrics collection"""
        mock_cpu.return_value = 45.5
        mock_memory.return_value.percent = 67.8

        metrics = monitoring_service._collect_system_metrics()

        assert metrics["cpu_usage"] == 45.5
        assert metrics["memory_usage"] == 67.8
