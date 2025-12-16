"""
Unit tests for Fraud Detection Engine
Tests all three fraud detection algorithms
"""

import pytest
from datetime import datetime, timedelta
<<<<<<< Updated upstream
<<<<<<< Updated upstream
<<<<<<< Updated upstream
from app.services.fraud_detection_engine import (
=======
from app.services.intelligence.fraud_detection_engine import (
>>>>>>> Stashed changes
=======
from app.services.intelligence.fraud_detection_engine import (
>>>>>>> Stashed changes
=======
from app.services.intelligence.fraud_detection_engine import (
>>>>>>> Stashed changes
    FraudDetectionEngine,
    Transaction,
    FraudType,
    FraudAlert
)


class TestFraudDetectionEngine:
    """Test suite for FraudDetectionEngine"""
    
    @pytest.fixture
    def engine(self):
        """Create a fresh engine instance for each test"""
        return FraudDetectionEngine()
    
    @pytest.fixture
    def valid_transactions(self):
        """Create valid test transactions"""
        return [
            Transaction(
                id="tx1",
                amount=1000.0,
                timestamp=datetime.now(),
                source_account="ACC001",
                destination_account="ACC002",
                description="Payment"
            )
        ]
    
    # Input Validation Tests
    
    def test_analyze_transactions_with_none(self, engine):
        """Test that None input raises ValueError"""
        with pytest.raises(ValueError, match="cannot be None"):
            engine.analyze_transactions(None)
    
    def test_analyze_transactions_with_empty_list(self, engine):
        """Test that empty list raises ValueError"""
        with pytest.raises(ValueError, match="cannot be empty"):
            engine.analyze_transactions([])
    
    def test_analyze_transactions_with_invalid_type(self, engine):
        """Test that non-list input raises TypeError"""
        with pytest.raises(TypeError, match="must be a list"):
            engine.analyze_transactions("not a list")
    
    def test_analyze_transactions_with_invalid_items(self, engine):
        """Test that invalid transaction items raise TypeError"""
        with pytest.raises(TypeError, match="must be a Transaction instance"):
            engine.analyze_transactions([{"not": "a transaction"}])
    
    def test_analyze_transactions_with_valid_input(self, engine, valid_transactions):
        """Test that valid input doesn't raise errors"""
        alerts = engine.analyze_transactions(valid_transactions)
        assert isinstance(alerts, list)
        # Single small transaction shouldn't trigger alerts
        assert len(alerts) == 0
    
    # Structuring Detection Tests
    
    def test_structuring_detection_positive(self, engine):
        """Test that structuring pattern is detected"""
        # Create 3 transactions just below $10k threshold
        now = datetime.now()
        transactions = [
            Transaction("tx1", 9900, now - timedelta(hours=2), "ACC001", "ACC002", "Payment 1"),
            Transaction("tx2", 9800, now - timedelta(hours=1), "ACC001", "ACC002", "Payment 2"),
            Transaction("tx3", 9700, now, "ACC001", "ACC002", "Payment 3"),
        ]
        
        alerts = engine.analyze_transactions(transactions)
        
        # Should detect structuring
        assert len(alerts) >= 1
        structuring_alerts = [a for a in alerts if a.fraud_type == FraudType.STRUCTURING]
        assert len(structuring_alerts) == 1
        
        alert = structuring_alerts[0]
        assert alert.risk_score >= 60
        assert alert.confidence == 0.85
        assert len(alert.transactions) == 3
        assert "structuring" in alert.description.lower()
    
    def test_structuring_detection_negative(self, engine):
        """Test that normal transactions don't trigger structuring"""
        now = datetime.now()
        transactions = [
            Transaction("tx1", 5000, now - timedelta(hours=48), "ACC001", "ACC002", "Payment 1"),
            Transaction("tx2", 3000, now - timedelta(hours=24), "ACC001", "ACC002", "Payment 2"),
            Transaction("tx3", 2000, now, "ACC001", "ACC002", "Payment 3"),
        ]
        
        alerts = engine.analyze_transactions(transactions)
        structuring_alerts = [a for a in alerts if a.fraud_type == FraudType.STRUCTURING]
        
        # Should not detect structuring (amounts too low, spread over time)
        assert len(structuring_alerts) == 0
    
    def test_structuring_threshold_boundary(self, engine):
        """Test structuring detection at threshold boundaries"""
        now = datetime.now()
        
        # Exactly at 80% threshold
        transactions = [
            Transaction("tx1", 8000, now, "ACC001", "ACC002", "Payment 1"),
            Transaction("tx2", 8000, now, "ACC001", "ACC002", "Payment 2"),
            Transaction("tx3", 8000, now, "ACC001", "ACC002", "Payment 3"),
        ]
        
        alerts = engine.analyze_transactions(transactions)
        structuring_alerts = [a for a in alerts if a.fraud_type == FraudType.STRUCTURING]
        
        # Should detect (at or above 80% threshold)
        assert len(structuring_alerts) >= 1
    
    # Velocity Detection Tests
    
    def test_velocity_detection_positive(self, engine):
        """Test that velocity attack is detected"""
        now = datetime.now()
        
        # Create 12 transactions in 30 minutes (exceeds threshold)
        transactions = [
            Transaction(
                f"vtx{i}", 
                100, 
                now - timedelta(minutes=30-i*2), 
                "ACC003", 
                f"SHOP{i}", 
                f"Purchase {i}"
            )
            for i in range(12)
        ]
        
        alerts = engine.analyze_transactions(transactions)
        velocity_alerts = [a for a in alerts if a.fraud_type == FraudType.VELOCITY]
        
        # Should detect velocity
        assert len(velocity_alerts) >= 1
        
        alert = velocity_alerts[0]
        assert alert.risk_score >= 50
        assert alert.confidence == 0.75
        assert len(alert.transactions) >= 10
        assert "velocity" in alert.description.lower()
    
    def test_velocity_detection_negative(self, engine):
        """Test that normal transaction rate doesn't trigger velocity"""
        now = datetime.now()
        
        # 5 transactions over 2 hours (normal)
        transactions = [
            Transaction(
                f"tx{i}", 
                100, 
                now - timedelta(hours=2-i*0.5), 
                "ACC003", 
                f"SHOP{i}", 
                f"Purchase {i}"
            )
            for i in range(5)
        ]
        
        alerts = engine.analyze_transactions(transactions)
        velocity_alerts = [a for a in alerts if a.fraud_type == FraudType.VELOCITY]
        
        # Should not detect velocity
        assert len(velocity_alerts) == 0
    
    # Round-Trip Detection Tests
    
    def test_round_trip_detection_positive(self, engine):
        """Test that round-trip money flow is detected"""
        now = datetime.now()
        
        # Create round trip: A → B → C → A
        transactions = [
            Transaction("rtx1", 5000, now - timedelta(hours=48), "ACC004", "ACC005", "Transfer"),
            Transaction("rtx2", 4800, now - timedelta(hours=24), "ACC005", "ACC006", "Payment"),
            Transaction("rtx3", 4600, now, "ACC006", "ACC004", "Return"),
        ]
        
        alerts = engine.analyze_transactions(transactions)
        round_trip_alerts = [a for a in alerts if a.fraud_type == FraudType.ROUND_TRIP]
        
        # Should detect round trip
        assert len(round_trip_alerts) >= 1
        
        alert = round_trip_alerts[0]
        assert alert.risk_score >= 70
        assert alert.confidence == 0.90
        assert len(alert.transactions) == 3
        assert "round" in alert.description.lower()
        assert "→" in alert.description  # Path visualization
    
    def test_round_trip_detection_negative(self, engine):
        """Test that linear flow doesn't trigger round-trip"""
        now = datetime.now()
        
        # Create linear flow: A → B → C (no return to A)
        transactions = [
            Transaction("tx1", 5000, now - timedelta(hours=48), "ACC004", "ACC005", "Transfer"),
            Transaction("tx2", 4800, now - timedelta(hours=24), "ACC005", "ACC006", "Payment"),
            Transaction("tx3", 4600, now, "ACC006", "ACC007", "Forward"),
        ]
        
        alerts = engine.analyze_transactions(transactions)
        round_trip_alerts = [a for a in alerts if a.fraud_type == FraudType.ROUND_TRIP]
        
        # Should not detect round trip
        assert len(round_trip_alerts) == 0
    
    # Risk Scoring Tests
    
    def test_calculate_overall_risk_no_alerts(self, engine):
        """Test risk calculation for clean account"""
        transactions = [
            Transaction("tx1", 100, datetime.now(), "ACC001", "ACC002", "Test")
        ]
        
        risk_score = engine.calculate_overall_risk("ACC001", transactions)
        
        # Clean account should have minimal risk
        assert risk_score == 10
    
    def test_calculate_overall_risk_with_alerts(self, engine):
        """Test risk calculation for suspicious account"""
        now = datetime.now()
        
        # Transactions that will trigger multiple alerts
        transactions = [
            # Structuring
            Transaction("tx1", 9900, now, "ACC001", "ACC002", "Payment 1"),
            Transaction("tx2", 9800, now, "ACC001", "ACC002", "Payment 2"),
            Transaction("tx3", 9700, now, "ACC001", "ACC002", "Payment 3"),
            # Velocity
            *[
                Transaction(f"vtx{i}", 100, now, "ACC001", f"SHOP{i}", f"Purchase {i}")
                for i in range(12)
            ]
        ]
        
        risk_score = engine.calculate_overall_risk("ACC001", transactions)
        
        # Account with multiple fraud patterns should have high risk
        assert risk_score > 50
    
    def test_calculate_overall_risk_empty_account(self, engine):
        """Test risk calculation for account with no transactions"""
        risk_score = engine.calculate_overall_risk("ACC999", [])
        
        # Account with no activity should have zero risk
        assert risk_score == 0
    
    # Edge Cases
    
    def test_mixed_fraud_types(self, engine):
        """Test detection of multiple fraud types in single batch"""
        now = datetime.now()
        
        transactions = [
            # Structuring
            Transaction("s1", 9900, now, "ACC001", "ACC002", "Payment 1"),
            Transaction("s2", 9800, now, "ACC001", "ACC002", "Payment 2"),
            Transaction("s3", 9700, now, "ACC001", "ACC002", "Payment 3"),
            # Velocity
            *[
                Transaction(f"v{i}", 100, now, "ACC003", f"SHOP{i}", f"Purchase {i}")
                for i in range(12)
            ],
            # Round trip
            Transaction("r1", 5000, now - timedelta(hours=48), "ACC004", "ACC005", "Transfer"),
            Transaction("r2", 4800, now - timedelta(hours=24), "ACC005", "ACC006", "Payment"),
            Transaction("r3", 4600, now, "ACC006", "ACC004", "Return"),
        ]
        
        alerts = engine.analyze_transactions(transactions)
        
        # Should detect all three types
        fraud_types = {alert.fraud_type for alert in alerts}
        assert FraudType.STRUCTURING in fraud_types
        assert FraudType.VELOCITY in fraud_types
        assert FraudType.ROUND_TRIP in fraud_types
    
    def test_large_transaction_batch(self, engine):
        """Test performance with large batch of transactions"""
        now = datetime.now()
        
        # Create 1000 normal transactions
        transactions = [
            Transaction(
                f"tx{i}",
                100 + (i % 1000),
                now - timedelta(hours=i % 100),
                f"ACC{i % 50}",
                f"ACC{(i + 1) % 50}",
                f"Payment {i}"
            )
            for i in range(1000)
        ]
        
        # Should complete without errors
        alerts = engine.analyze_transactions(transactions)
        assert isinstance(alerts, list)
    
    def test_alert_id_uniqueness(self, engine):
        """Test that alert IDs are unique"""
        now = datetime.now()
        
        transactions = [
            Transaction("tx1", 9900, now, "ACC001", "ACC002", "Payment 1"),
            Transaction("tx2", 9800, now, "ACC001", "ACC002", "Payment 2"),
            Transaction("tx3", 9700, now, "ACC001", "ACC002", "Payment 3"),
        ]
        
        alerts = engine.analyze_transactions(transactions)
        alert_ids = [alert.alert_id for alert in alerts]
        
        # All IDs should be unique
        assert len(alert_ids) == len(set(alert_ids))
    
    def test_alert_details_completeness(self, engine):
        """Test that alerts contain all required details"""
        now = datetime.now()
        
        transactions = [
            Transaction("tx1", 9900, now, "ACC001", "ACC002", "Payment 1"),
            Transaction("tx2", 9800, now, "ACC001", "ACC002", "Payment 2"),
            Transaction("tx3", 9700, now, "ACC001", "ACC002", "Payment 3"),
        ]
        
        alerts = engine.analyze_transactions(transactions)
        
        for alert in alerts:
            # Check all required fields
            assert alert.alert_id
            assert alert.fraud_type
            assert 0 <= alert.risk_score <= 100
            assert 0.0 <= alert.confidence <= 1.0
            assert len(alert.transactions) > 0
            assert alert.description
            assert alert.detected_at
            assert isinstance(alert.details, dict)


# Run with: pytest backend/tests/test_fraud_detection.py -v
