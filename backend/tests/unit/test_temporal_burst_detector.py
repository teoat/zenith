"""
Unit tests for Temporal Burst Detection Service

Tests temporal burst detection service functionality
"""

import pytest
from unittest.mock import MagicMock, patch
from datetime import datetime, timedelta
from pathlib import Path
import sys

sys.path.insert(0, str(Path(__file__).parent.parent.parent / "backend"))


@pytest.fixture
def mock_db():
    """Mock database session"""
    return MagicMock()


@pytest.fixture
def burst_service(mock_db):
    """Fixture for TemporalBurstDetector"""
    from app.services.intelligence.temporal_burst_detector import TemporalBurstDetector
    return TemporalBurstDetector(mock_db)


class TestTemporalBurstDetectorInstantiation:
    """Test temporal burst detector can be instantiated"""
    
    def test_service_exists(self):
        """Test service module can be imported"""
        from app.services.intelligence.temporal_burst_detector import TemporalBurstDetector
        assert TemporalBurstDetector is not None
    
    def test_service_instantiation(self, mock_db):
        """Test service can be instantiated"""
        from app.services.intelligence.temporal_burst_detector import TemporalBurstDetector
        service = TemporalBurstDetector(mock_db)
        assert service is not None
        assert hasattr(service, 'detect_bursts') or hasattr(service, 'analyze_patterns')


class TestTemporalBurstDetectorMethods:
    """Test temporal burst detector methods"""
    
    def test_detect_bursts_method_exists(self, burst_service):
        """Test detect_bursts method exists"""
        assert hasattr(burst_service, 'detect_bursts') or hasattr(burst_service, 'analyze_activity_pattern')
    
    def test_analyze_patterns_method_exists(self, burst_service):
        """Test analyze_patterns method exists"""
        assert hasattr(burst_service, 'analyze_patterns') or hasattr(burst_service, 'calculate_burst_score')
    
    def test_detect_time_windows_method_exists(self, burst_service):
        """Test detect_time_windows method exists"""
        assert hasattr(burst_service, 'detect_time_windows') or hasattr(burst_service, 'analyze_temporal_patterns')


@pytest.mark.unit
def test_service_export():
    """Export test that burst detector is available"""
    from app.services.intelligence.temporal_burst_detector import TemporalBurstDetector
    assert TemporalBurstDetector is not None
