# tests/unit/test_fraud_services.py

import os
import sys

sys.path.insert(0, os.path.abspath("."))

from datetime import UTC, datetime, timedelta, timezone
from unittest.mock import Mock, patch

import pytest
from sqlalchemy.orm import Session

from backend.app.services.ai.temporal_burst_detector import (
    BurstAlert,
    TemporalBurstDetector,
)
from backend.app.services.fraud.engine import RuleEngine as PluginRuleEngine

# Import fraud detection modules
from backend.app.services.fraud.fraud_service import FraudDetectionService
from backend.app.services.fraud.rule_engine import (
    AmountThresholdRule,
    GeographicAnomalyRule,
    RiskLevel,
    RuleEngine,
    RuleType,
    VelocityRule,
)
from backend.core.database import Transaction


class TestFraudDetectionService:
    """Unit tests for FraudDetectionService"""

    @pytest.fixture
    def mock_db(self):
        """Create a mock database session"""
        return Mock(spec=Session)

    @pytest.fixture
    def mock_rule_engine(self):
        """Create a mock rule engine"""
        engine = Mock()
        engine.execute_rules = Mock(return_value=[])
        return engine

    @pytest.fixture
    def fraud_service(self, mock_db, mock_rule_engine):
        """Create FraudDetectionService with mocked dependencies"""
        with patch(
            "backend.app.services.fraud.fraud_service.rule_engine", mock_rule_engine
        ):
            service = FraudDetectionService(mock_db)
            service.rule_engine = mock_rule_engine
            return service

    def test_analyze_case_success(self, fraud_service, mock_db, mock_rule_engine):
        """Test successful case analysis with fraud alerts"""
        # Mock case
        mock_case = Mock()
        mock_case.id = "case123"
        mock_db.query.return_value.filter.return_value.first.return_value = mock_case

        # Mock transactions
        mock_txns = [
            Mock(
                id="txn1",
                amount=5000.0,
                timestamp=datetime.now(UTC),
                description="Test transaction",
                merchant="Test Merchant",
            )
        ]
        mock_db.query.return_value.filter.return_value.all.return_value = mock_txns

        # Mock rule engine results
        mock_alert = Mock()
        mock_alert.transaction_ids = ["txn1"]
        mock_alert.confidence = 0.8
        mock_alert.risk_score = 75.0
        mock_alert.recommendations = ["Review transaction"]
        mock_alert.rule_name = "TestRule"
        mock_alert.severity = Mock(value="high")
        mock_alert.description = "High risk transaction"
        mock_rule_engine.execute_rules.return_value = [mock_alert]

        result = fraud_service.analyze_case("case123")

        assert result["case_id"] == "case123"
        assert result["transactions_analyzed"] == 1
        assert result["alerts_generated"] == 1
        assert len(result["alerts"]) == 1
        assert result["alerts"][0]["rule_name"] == "TestRule"
        assert result["alerts"][0]["severity"] == "high"

        mock_rule_engine.execute_rules.assert_called_once()
        mock_db.add.assert_called_once()
        mock_db.commit.assert_called_once()

    def test_analyze_case_not_found(self, fraud_service, mock_db):
        """Test case not found scenario"""
        mock_db.query.return_value.filter.return_value.first.return_value = None

        result = fraud_service.analyze_case("nonexistent")

        assert result["error"] == "Case not found"
        assert result["alerts"] == []

    def test_analyze_case_with_transaction_ids(
        self, fraud_service, mock_db, mock_rule_engine
    ):
        """Test case analysis with specific transaction IDs"""
        # Mock case
        mock_case = Mock()
        mock_case.id = "case123"
        mock_db.query.return_value.filter.return_value.first.return_value = mock_case

        # Mock filtered transactions
        mock_txns = [Mock(id="txn1")]
        mock_query = Mock()
        mock_query.filter.return_value.all.return_value = mock_txns
        mock_db.query.return_value.filter.return_value = mock_query

        mock_rule_engine.execute_rules.return_value = []

        result = fraud_service.analyze_case("case123", ["txn1"])

        assert result["transactions_analyzed"] == 1
        mock_query.filter.assert_called_with(Transaction.id.in_(["txn1"]))

    def test_analyze_case_db_error(self, fraud_service, mock_db, mock_rule_engine):
        """Test database error during case analysis"""
        mock_db.query.side_effect = Exception("DB Error")

        result = fraud_service.analyze_case("case123")

        assert result["error"] == "DB Error"
        assert result["alerts"] == []
        mock_db.rollback.assert_called_once()

    def test_get_case_alerts_success(self, fraud_service, mock_db):
        """Test successful retrieval of case alerts"""
        mock_alerts = [
            Mock(
                id="alert1",
                rule_name="Rule1",
                severity="high",
                confidence=0.8,
                risk_score=70.0,
                status="open",
                reviewed_by=None,
                reviewed_at=None,
                created_at=datetime.now(UTC),
                details={},
            )
        ]
        mock_db.query.return_value.filter.return_value.order_by.return_value.all.return_value = mock_alerts

        result = fraud_service.get_case_alerts("case123")

        assert len(result) == 1
        assert result[0]["id"] == "alert1"
        assert result[0]["severity"] == "high"
        assert result[0]["status"] == "open"

    def test_get_case_alerts_empty(self, fraud_service, mock_db):
        """Test case with no alerts"""
        mock_db.query.return_value.filter.return_value.order_by.return_value.all.return_value = []

        result = fraud_service.get_case_alerts("case123")

        assert result == []

    def test_update_alert_status_success(self, fraud_service, mock_db):
        """Test successful alert status update"""
        mock_alert = Mock()
        mock_db.query.return_value.filter.return_value.first.return_value = mock_alert

        result = fraud_service.update_alert_status("alert1", "resolved", "reviewer1")

        assert result is True
        assert mock_alert.status == "resolved"
        assert mock_alert.reviewed_by == "reviewer1"
        mock_db.commit.assert_called_once()

    def test_update_alert_status_not_found(self, fraud_service, mock_db):
        """Test alert not found during status update"""
        mock_db.query.return_value.filter.return_value.first.return_value = None

        result = fraud_service.update_alert_status("nonexistent", "resolved")

        assert result is False

    def test_get_fraud_stats_success(self, fraud_service, mock_db):
        """Test successful fraud statistics retrieval"""
        mock_db.query.return_value.count.side_effect = [
            100,
            25,
            10,
            5,
        ]  # cases, alerts, high_risk, resolved

        result = fraud_service.get_fraud_stats()

        assert result["total_cases_analyzed"] == 100
        assert result["total_alerts_generated"] == 25
        assert result["high_risk_alerts"] == 10
        assert result["resolved_alerts"] == 5


class TestRuleEngine:
    """Unit tests for rule engine components"""

    @pytest.fixture
    def velocity_rule(self):
        """Create a velocity rule for testing"""
        return VelocityRule("VEL001", max_transactions=5, time_window_minutes=10)

    @pytest.fixture
    def amount_rule(self):
        """Create an amount threshold rule"""
        return AmountThresholdRule("AMT001", threshold_amount=10000.0)

    @pytest.fixture
    def geo_rule(self):
        """Create a geographic anomaly rule"""
        return GeographicAnomalyRule("GEO001")

    @pytest.fixture
    def rule_engine(self):
        """Create a rule engine instance"""
        return RuleEngine()

    def test_velocity_rule_no_trigger(self, velocity_rule):
        """Test velocity rule when threshold not exceeded"""
        transaction = {
            "account_id": "acc1",
            "timestamp": datetime.now(UTC).isoformat(),
        }
        context = {"recent_transactions": []}

        result = velocity_rule.evaluate(transaction, context)

        assert not result["triggered"]
        assert result["risk_score"] == 0
        assert "Velocity exceeded" not in result["reason"]

    def test_velocity_rule_triggered(self, velocity_rule):
        """Test velocity rule when threshold exceeded"""
        now = datetime.now(UTC)
        transaction = {"account_id": "acc1", "timestamp": now.isoformat()}
        recent_txns = [
            {
                "account_id": "acc1",
                "timestamp": (now - timedelta(minutes=5)).isoformat(),
            },
            {
                "account_id": "acc1",
                "timestamp": (now - timedelta(minutes=4)).isoformat(),
            },
            {
                "account_id": "acc1",
                "timestamp": (now - timedelta(minutes=3)).isoformat(),
            },
            {
                "account_id": "acc1",
                "timestamp": (now - timedelta(minutes=2)).isoformat(),
            },
            {
                "account_id": "acc1",
                "timestamp": (now - timedelta(minutes=1)).isoformat(),
            },
        ]
        context = {"recent_transactions": recent_txns}

        result = velocity_rule.evaluate(transaction, context)

        assert result["triggered"]
        assert result["risk_score"] > 0
        assert result["transaction_count"] == 6  # 5 recent + 1 current
        assert velocity_rule.triggered_count == 1

    def test_amount_rule_no_trigger(self, amount_rule):
        """Test amount rule when threshold not exceeded"""
        transaction = {"amount": 5000.0, "currency": "USD"}
        context = {}

        result = amount_rule.evaluate(transaction, context)

        assert not result["triggered"]
        assert result["risk_score"] == 0

    def test_amount_rule_triggered(self, amount_rule):
        """Test amount rule when threshold exceeded"""
        transaction = {"amount": 15000.0, "currency": "USD"}
        result = amount_rule.evaluate(transaction, context={})

        assert result["triggered"]
        assert result["risk_score"] > 0
        assert "15000.0 exceeds threshold" in result["reason"]
        assert amount_rule.triggered_count == 1

    def test_geo_rule_no_trigger(self, geo_rule):
        """Test geographic rule with no previous transaction"""
        transaction = {"location": {"lat": 40.0, "lon": -74.0}}
        context = {}

        result = geo_rule.evaluate(transaction, context)

        assert not result["triggered"]
        assert result["risk_score"] == 0
        assert "No previous transaction" in result["reason"]

    def test_geo_rule_triggered(self, geo_rule):
        """Test geographic rule with impossible travel"""
        transaction = {
            "location": {"lat": 40.0, "lon": -74.0},  # NYC
            "timestamp": datetime.now(UTC).isoformat(),
        }
        context = {
            "last_transaction": {
                "location": {"lat": 34.0, "lon": -118.0},  # LA
                "timestamp": (
                    datetime.now(UTC) - timedelta(minutes=30)
                ).isoformat(),
            }
        }

        result = geo_rule.evaluate(transaction, context)

        assert result["triggered"]
        assert result["risk_score"] > 0
        assert "Impossible travel" in result["reason"]
        assert geo_rule.triggered_count == 1

    def test_rule_engine_evaluate_transaction(self, rule_engine):
        """Test rule engine transaction evaluation"""
        # Add a test rule
        test_rule = Mock()
        test_rule.enabled = True
        test_rule.evaluate.return_value = {
            "triggered": True,
            "risk_score": 80,
            "reason": "Test fraud",
            "details": {},
        }
        test_rule.name = "TestRule"
        test_rule.rule_type = RuleType.VELOCITY
        test_rule.risk_level = RiskLevel.HIGH

        rule_engine.add_rule(test_rule)

        transaction = {"id": "txn1", "amount": 1000.0}
        context = {}

        result = rule_engine.evaluate_transaction(transaction, context)

        assert result["is_fraud"]
        assert result["overall_risk_score"] == 80
        assert len(result["triggered_rules"]) == 1
        assert result["triggered_rules"][0]["rule_name"] == "TestRule"

    def test_rule_engine_generate_recommendations(self, rule_engine):
        """Test recommendation generation"""
        triggered_rules = [{"rule_type": "velocity", "risk_level": "critical"}]

        recommendations = rule_engine._generate_recommendations(triggered_rules, 85)

        assert "IMMEDIATE ACTION" in recommendations[0]
        assert "Freeze account" in recommendations[1]

    def test_rule_engine_no_rules(self, rule_engine):
        """Test rule engine with no rules"""
        transaction = {"id": "txn1"}
        context = {}

        result = rule_engine.evaluate_transaction(transaction, context)

        assert not result["is_fraud"]
        assert result["overall_risk_score"] == 0
        assert result["triggered_rules"] == []


class TestPluginRuleEngine:
    """Unit tests for plugin-based rule engine"""

    @pytest.fixture
    def plugin_rule_engine(self):
        """Create plugin rule engine instance"""
        return PluginRuleEngine()

    @patch("backend.app.services.fraud.engine.plugin_registry_service")
    async def test_execute_rules_with_plugins(self, mock_registry, plugin_rule_engine):
        """Test rule execution with plugin rules"""
        # Mock plugin
        mock_plugin = Mock()
        mock_plugin.execute = Mock(
            return_value={
                "alerts": [
                    {
                        "risk_score": 80.0,
                        "confidence": 0.9,
                        "reason": "Plugin detected fraud",
                    }
                ]
            }
        )
        mock_plugin.metadata = Mock()
        mock_plugin.metadata.name = "TestPlugin"

        # Mock registry
        mock_registry.get_plugin = Mock(return_value=mock_plugin)

        # Mock database session for plugin loading
        with patch("backend.app.services.fraud.engine.SessionLocal") as mock_session:
            mock_db = Mock()
            mock_session.return_value = mock_db
            mock_db.query.return_value.filter.return_value.all.return_value = [
                Mock(
                    plugin_id="plugin1",
                    metadata_json='{"capabilities": ["fraud_detection"]}',
                )
            ]

            await plugin_rule_engine.initialize()

            transactions = [{"id": "txn1", "amount": 1000.0}]
            alerts = await plugin_rule_engine.execute_rules(transactions)

            assert len(alerts) == 1
            assert alerts[0].rule_name == "TestPlugin"
            assert alerts[0].risk_score == 80.0

    async def test_execute_rules_no_plugins(self, plugin_rule_engine):
        """Test rule execution with no plugins"""
        transactions = [{"id": "txn1"}]
        alerts = await plugin_rule_engine.execute_rules(transactions)

        assert alerts == []


class TestTemporalBurstDetector:
    """Unit tests for temporal burst detection"""

    @pytest.fixture
    def burst_detector(self):
        """Create burst detector instance"""
        return TemporalBurstDetector()

    def test_analyze_transactions_empty(self, burst_detector):
        """Test analysis with no transactions"""
        result = burst_detector.analyze_transactions([])

        assert result["transaction_count"] == 0
        assert result["alerts"] == []
        assert result["summary"]["overall_risk_score"] == 0.0

    def test_analyze_transactions_burst_pattern(self, burst_detector):
        """Test detection of burst patterns"""
        # Create 15 transactions within 24 hours
        base_time = datetime.now(UTC)
        transactions = []
        for i in range(15):
            transactions.append(
                {
                    "customer_id": "cust1",
                    "customer_name": "Test Customer",
                    "amount": 1000.0,
                    "date": (base_time + timedelta(hours=i)).isoformat(),
                }
            )

        result = burst_detector.analyze_transactions(transactions)

        assert result["transaction_count"] == 15
        assert len(result["alerts"]) > 0
        assert any(alert["pattern_type"] == "burst" for alert in result["alerts"])
        assert result["summary"]["burst_patterns"] > 0

    def test_analyze_transactions_structuring(self, burst_detector):
        """Test detection of structuring patterns"""
        base_time = datetime.now(UTC)
        transactions = []
        for i in range(5):
            transactions.append(
                {
                    "customer_id": "cust1",
                    "amount": 9500.0,  # Just below $10k threshold
                    "date": (base_time + timedelta(days=i)).isoformat(),
                }
            )

        result = burst_detector.analyze_transactions(transactions)

        assert len(result["alerts"]) > 0
        assert any(alert["pattern_type"] == "structuring" for alert in result["alerts"])

    def test_analyze_transactions_velocity_anomaly(self, burst_detector):
        """Test detection of velocity anomalies"""
        base_time = datetime.now(UTC)
        transactions = []

        # Slow transactions first (baseline)
        for i in range(8):
            transactions.append(
                {
                    "customer_id": "cust1",
                    "amount": 500.0,
                    "date": (base_time + timedelta(days=i * 2)).isoformat(),
                }
            )

        # Then rapid transactions
        for i in range(5):
            transactions.append(
                {
                    "customer_id": "cust1",
                    "amount": 500.0,
                    "date": (base_time + timedelta(days=16, hours=i)).isoformat(),
                }
            )

        result = burst_detector.analyze_transactions(transactions)

        assert len(result["alerts"]) > 0
        assert any(alert["pattern_type"] == "velocity" for alert in result["alerts"])

    def test_detect_burst_patterns_threshold_not_met(self, burst_detector):
        """Test burst detection when threshold not met"""
        transactions = [
            {"customer_id": "cust1", "date": datetime.now(UTC).isoformat()}
            for _ in range(5)  # Below threshold of 10
        ]

        alerts = burst_detector._detect_burst_patterns("cust1", transactions)

        assert alerts == []

    def test_detect_structuring_patterns_insufficient(self, burst_detector):
        """Test structuring detection with insufficient transactions"""
        transactions = [
            {"amount": 9500.0, "date": datetime.now(UTC).isoformat()}
            for _ in range(2)  # Below threshold of 3
        ]

        alerts = burst_detector._detect_structuring_patterns("cust1", transactions)

        assert alerts == []

    def test_calculate_risk_score(self, burst_detector):
        """Test risk score calculation"""
        alerts = [
            BurstAlert(
                "cust1",
                "Customer",
                "burst",
                15,
                15000.0,
                24.0,
                0.8,
                "high",
                [],
                "Test burst",
                datetime.now(UTC).isoformat(),
            ),
            BurstAlert(
                "cust1",
                "Customer",
                "structuring",
                5,
                47500.0,
                48.0,
                0.6,
                "medium",
                [],
                "Test structuring",
                datetime.now(UTC).isoformat(),
            ),
        ]

        score = burst_detector._calculate_risk_score(alerts)

        assert score > 0.0
        assert score <= 100.0

    def test_determine_severity(self, burst_detector):
        """Test severity determination"""
        assert burst_detector._determine_severity(0.9, 10000.0) == "critical"
        assert burst_detector._determine_severity(0.7, 30000.0) == "high"
        assert burst_detector._determine_severity(0.5, 10000.0) == "medium"
        assert burst_detector._determine_severity(0.3, 5000.0) == "low"


# Edge Cases and Error Conditions


class TestFraudServicesEdgeCases:
    """Tests for edge cases and error conditions"""

    @pytest.fixture
    def fraud_service(self):
        """Create fraud service with mock DB"""
        mock_db = Mock(spec=Session)
        with patch("backend.app.services.fraud.fraud_service.rule_engine"):
            return FraudDetectionService(mock_db)

    def test_velocity_rule_edge_cases(self):
        """Test velocity rule edge cases"""
        rule = VelocityRule("VEL001", max_transactions=3, time_window_minutes=5)

        # No account_id
        transaction = {"timestamp": datetime.now(UTC).isoformat()}
        context = {"recent_transactions": []}
        result = rule.evaluate(transaction, context)
        assert not result["triggered"]

        # Invalid timestamp
        transaction = {"account_id": "acc1", "timestamp": "invalid"}
        result = rule.evaluate(transaction, context)
        assert not result["triggered"]

    def test_amount_rule_edge_cases(self):
        """Test amount rule edge cases"""
        rule = AmountThresholdRule("AMT001", threshold_amount=10000.0)

        # String amount
        transaction = {"amount": "15000.0", "currency": "USD"}
        result = rule.evaluate(transaction, context={})
        assert result["triggered"]

        # Different currency
        transaction = {"amount": 15000.0, "currency": "EUR"}
        result = rule.evaluate(transaction, context={})
        assert not result["triggered"]

        # No currency
        transaction = {"amount": 15000.0}
        result = rule.evaluate(transaction, context={})
        assert result["triggered"]

    def test_geo_rule_edge_cases(self):
        """Test geographic rule edge cases"""
        rule = GeographicAnomalyRule("GEO001")

        # No location
        transaction = {"timestamp": datetime.now(UTC).isoformat()}
        context = {"last_transaction": {"location": {"lat": 0, "lon": 0}}}
        result = rule.evaluate(transaction, context)
        assert not result["triggered"]

        # Same location
        transaction = {
            "location": {"lat": 40.0, "lon": -74.0},
            "timestamp": datetime.now(UTC).isoformat(),
        }
        context = {
            "last_transaction": {
                "location": {"lat": 40.0, "lon": -74.0},
                "timestamp": (
                    datetime.now(UTC) - timedelta(hours=2)
                ).isoformat(),
            }
        }
        result = rule.evaluate(transaction, context)
        assert not result["triggered"]

    def test_burst_detector_parse_date_edge_cases(self, burst_detector):
        """Test date parsing edge cases"""
        assert burst_detector._parse_date("") == datetime.min.replace(
            tzinfo=UTC
        )
        assert burst_detector._parse_date("2023-01-01").tzinfo == UTC

    def test_fraud_service_db_rollback_on_error(self, fraud_service):
        """Test database rollback on errors"""
        fraud_service.db.query.side_effect = Exception("Test error")

        result = fraud_service.analyze_case("case123")

        assert "error" in result
        fraud_service.db.rollback.assert_called_once()
