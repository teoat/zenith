"""Unit tests for fraud detection services"""

from datetime import datetime, timezone
from unittest.mock import AsyncMock, MagicMock, patch

import pytest

from app.services.ai.ai_service import AIService
from app.services.fraud import AlertSeverity, FraudAlert
from app.services.fraud_rules_engine import FraudRulesEngine
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

    @patch("app.services.fraud_service.FraudDetectionService._get_case_transactions")
    @patch(
        "app.services.fraud_service.FraudDetectionService._get_historical_transactions"
    )
    def test_analyze_case(self, mock_historical, mock_case_transactions, fraud_service):
        """Test case analysis functionality"""
        # Mock case data
        mock_case = MagicMock()
        mock_case.id = "case123"
        mock_case.customer_id = "cust123"

        # Mock transactions
        mock_case_transactions.return_value = [
            {"id": "tx1", "amount": 1000.0, "date": "2024-01-01"},
            {"id": "tx2", "amount": 2000.0, "date": "2024-01-02"},
        ]
        mock_historical.return_value = []

        fraud_service.db.query.return_value.filter.return_value.first.return_value = (
            mock_case
        )

        # Mock rule engine
        mock_alert = FraudAlert(
            rule_name="test_rule",
            severity=AlertSeverity.HIGH,
            confidence=0.9,
            risk_score=85.0,
            description="Test fraud alert",
            alert_id="alert123",
            detected_at=datetime.now(timezone.utc),
        )
        fraud_service.rule_engine.execute_rules.return_value = [mock_alert]

        result = fraud_service.analyze_case("case123")

        assert len(result) == 1
        assert result[0].rule_name == "test_rule"
        assert result[0].severity == AlertSeverity.HIGH

    def test_get_case_transactions(self, fraud_service):
        """Test transaction retrieval for case"""
        # Mock transactions
        mock_transaction = MagicMock()
        mock_transaction.id = "tx123"
        mock_transaction.amount = 1000.0
        mock_transaction.date = datetime.now(timezone.utc)

        fraud_service.db.query.return_value.filter.return_value.order_by.return_value.all.return_value = [
            mock_transaction
        ]

        result = fraud_service._get_case_transactions("case123")

        assert len(result) == 1
        assert result[0]["id"] == "tx123"


class TestFraudRulesEngine:
    """Test fraud rules engine"""

    @pytest.fixture
    def rules_engine(self):
        """Create rules engine instance"""
        return FraudRulesEngine()

    def test_engine_initialization(self, rules_engine):
        """Test engine initialization"""
        assert rules_engine is not None
        assert hasattr(rules_engine, "rules")
        assert hasattr(rules_engine, "execute_rules")

    def test_execute_rules_empty(self, rules_engine):
        """Test rule execution with no transactions"""
        result = rules_engine.execute_rules([])
        assert result == []

    def test_execute_rules_with_data(self, rules_engine):
        """Test rule execution with transaction data"""
        transactions = [
            {
                "id": "tx1",
                "amount": 50000.0,  # Large amount that might trigger rules
                "merchant_name": "Casino XYZ",
                "transaction_type": "DEBIT",
            }
        ]

        result = rules_engine.execute_rules(transactions)

        # Should return some alerts (depending on rules)
        assert isinstance(result, list)

    def test_get_execution_stats(self, rules_engine):
        """Test execution statistics retrieval"""
        stats = rules_engine.get_execution_stats()
        assert isinstance(stats, list)

    def test_rule_registration(self, rules_engine):
        """Test rule registration functionality"""
        # Check that rules are registered
        assert len(rules_engine.rules) > 0

        # Check rule structure
        for rule_name, rule in rules_engine.rules.items():
            assert hasattr(rule, "name")
            assert hasattr(rule, "enabled")
            assert hasattr(rule, "execute")


class TestAIService:
    """Test AI service functionality"""

    @pytest.fixture
    def ai_service(self):
        """Create AI service instance"""
        return AIService()

    @patch("app.services.ai_service.AIService._initialize_model")
    def test_service_initialization(self, mock_init, ai_service):
        """Test AI service initialization"""
        assert ai_service is not None
        assert hasattr(ai_service, "analyze_transaction")
        assert hasattr(ai_service, "train_model")

    @patch("app.services.ai_service.AIService._load_model")
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

    @patch("app.services.ai_service.AIService._save_model")
    @patch("app.services.ai_service.AIService._train_model")
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
