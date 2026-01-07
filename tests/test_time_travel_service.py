import sys
import pytest
from unittest.mock import MagicMock, patch
from datetime import datetime, timedelta
from pathlib import Path

# Add backend to path
sys.path.insert(0, str(Path(__file__).parent.parent.parent.parent / "backend"))

from app.services.intelligence.time_travel_service import TimeTravelService


@pytest.fixture
def mock_db():
    """Mock database session"""
    return MagicMock()


@pytest.fixture
def time_service():
    """Fixture for TimeTravelService"""
    return TimeTravelService()


class TestTimeTravelServiceInstantiation:
    """Test time travel service can be instantiated"""

    def test_service_exists(self):
        """Test service module can be imported"""
        from app.services.intelligence.time_travel_service import TimeTravelService
        assert TimeTravelService is not None

    def test_service_instantiation(self, time_service):
        """Test service can be instantiated"""
        assert time_service is not None


class TestTimeTravelServiceMethods:
    """Test time travel service methods"""

    def test_get_case_history_method_exists(self, time_service):
        """Test get_case_history method exists"""
        assert hasattr(time_service, 'get_case_history')


@pytest.mark.unit
def test_service_export():
    """Export test that time travel service is available"""
    from app.services.intelligence.time_travel_service import TimeTravelService
    assert TimeTravelService is not None
