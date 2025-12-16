# tests/unit/test_fraud_detection.py
import pytest
from unittest.mock import Mock, patch
from services.fraud_detection import FraudDetectionEngine, RiskLevel, FraudPattern


class TestFraudDetectionEngine:
    """Unit tests for FraudDetectionEngine"""

    @pytest.fixture
    def engine(self):
        """Create a fresh engine instance for each test"""
        return FraudDetectionEngine()

    def test_initialization(self, engine):
        """Test that engine initializes with correct default values"""
        assert engine.fuzzy_threshold == 80
        assert engine.velocity_threshold == 5
        assert engine.structuring_threshold == 10000
        assert engine.anomaly_zscore_threshold == 3.0
        assert 'NG' in engine.high_risk_countries
        assert 'BR' in engine.medium_risk_countries

    def test_calculate_risk_score_low_risk(self, engine):
        """Test risk score calculation for low-risk transaction"""
        transaction = {
            'amount': 50.0,
            'merchant_name': 'Regular Grocery Store',
            'country': 'US'
        }

        result = engine.calculate_risk_score(transaction)

        assert result.score < 40  # Low risk
        assert result.level == RiskLevel.LOW
        assert len(result.factors) > 0

    def test_calculate_risk_score_high_risk(self, engine):
        """Test risk score calculation for high-risk transaction"""
        transaction = {
            'amount': 50000.0,  # Very large amount
            'merchant_name': 'Unknown Vendor',
            'country': 'NG'  # High-risk country
        }

        result = engine.calculate_risk_score(transaction)

        assert result.score >= 60  # High risk
        assert result.level in [RiskLevel.HIGH, RiskLevel.CRITICAL]
        assert len(result.factors) > 0

    def test_amount_risk_calculation(self, engine):
        """Test amount-based risk calculation"""
        # Low amount
        score, factors = engine._calculate_amount_risk({'amount': 25.0})
        assert score < 20

        # High amount
        score, factors = engine._calculate_amount_risk({'amount': 50000.0})
        assert score > 80

        # Round number (potential structuring)
        score, factors = engine._calculate_amount_risk({'amount': 9500.0})
        assert score > 60

    def test_velocity_risk_calculation(self, engine):
        """Test velocity-based risk calculation"""
        transaction = {'amount': 100.0, 'date': '2024-01-01T10:00:00'}

        # No historical data
        score, factors = engine._calculate_velocity_risk(transaction, [])
        assert score < 25

        # High velocity (10 transactions in hour)
        historical = [
            {'amount': 100.0, 'date': f'2024-01-01T{i:02d}:00:00'}
            for i in range(10, 11)  # 10 transactions in same hour
        ]
        score, factors = engine._calculate_velocity_risk(transaction, historical)
        assert score > 70

    def test_geographic_risk_calculation(self, engine):
        """Test geographic risk calculation"""
        # Low risk country
        score, factors = engine._calculate_geographic_risk({'country': 'US'})
        assert score < 30

        # High risk country
        score, factors = engine._calculate_geographic_risk({'country': 'NG'})
        assert score > 80

        # Cross-border transaction
        score, factors = engine._calculate_geographic_risk({
            'country': 'US',
            'merchant_country': 'CA'
        })
        assert score > 35

    def test_structuring_detection(self, engine):
        """Test structuring pattern detection"""
        # Create transactions that sum to exactly $10,000 (structuring threshold)
        transactions = [
            {'amount': 2500.0, 'type': 'DEBIT', 'date': '2024-01-01T10:00:00'},
            {'amount': 2500.0, 'type': 'DEBIT', 'date': '2024-01-01T11:00:00'},
            {'amount': 2500.0, 'type': 'DEBIT', 'date': '2024-01-01T12:00:00'},
            {'amount': 2500.0, 'type': 'DEBIT', 'date': '2024-01-01T13:00:00'},
        ]

        alerts = engine.detect_structuring(transactions)

        assert len(alerts) > 0
        assert alerts[0]['type'] == 'structuring'
        assert alerts[0]['amount'] == 10000.0

    def test_velocity_pattern_detection(self, engine):
        """Test high-velocity pattern detection"""
        # Create 6 rapid transactions
        transactions = [
            {'id': f'tx{i}', 'amount': 100.0, 'date': f'2024-01-01T10:{i:02d}:00'}
            for i in range(6)
        ]

        alerts = engine.detect_velocity_patterns(transactions)

        assert len(alerts) > 0
        assert alerts[0]['type'] == 'high_velocity'
        assert alerts[0]['transaction_count'] == 6

    def test_fuzzy_matching(self, engine):
        """Test fuzzy string matching"""
        # Exact match
        match, score = engine.fuzzy_match("John Smith", "John Smith")
        assert match is True
        assert score == 100

        # Close match
        match, score = engine.fuzzy_match("John Smith", "Jon Smith")
        assert match is True
        assert score >= 80

        # No match
        match, score = engine.fuzzy_match("John Smith", "Jane Doe")
        assert match is False

    def test_amount_matching(self, engine):
        """Test amount matching with tolerance"""
        # Exact match
        result = engine.match_amounts(100.0, 100.0)
        assert result['match_type'] == 'exact'
        assert result['confidence'] == 1.0

        # Tolerance match
        result = engine.match_amounts(100.0, 100.5)  # 0.5% difference
        assert result['match_type'] == 'tolerance'
        assert result['confidence'] > 0.8

        # No match
        result = engine.match_amounts(100.0, 150.0)  # 50% difference
        assert result['match_type'] == 'no_match'
        assert result['confidence'] == 0.0

    @patch('services.fraud_detection.datetime')
    def test_time_risk_calculation(self, mock_datetime, engine):
        """Test time-based risk calculation"""
        # Mock current time as 3 AM (high risk hour)
        mock_datetime.now.return_value.hour = 3

        transaction = {'date': '2024-01-01T03:00:00'}
        score, factors = engine._calculate_time_risk(transaction)

        assert score > 40  # Should be high risk for 3 AM transaction

        # Mock weekend
        mock_datetime.now.return_value.weekday.return_value = 5  # Saturday
        score, factors = engine._calculate_time_risk(transaction)

        assert score > 30  # Should be moderate risk for weekend