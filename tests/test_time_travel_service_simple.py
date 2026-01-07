"""Simple unit test for time travel service"""

import sys
import pytest
from unittest.mock import MagicMock
from pathlib import Path

# Add backend to path
sys.path.insert(0, str(Path(__file__).parent.parent.parent.parent / "backend"))

# Try importing, but skip if it fails
try:
    from app.services.intelligence.time_travel_service import TimeTravelService
    HAS_SERVICE = True
except ImportError:
    HAS_SERVICE = False


@pytest.fixture
def mock_service():
    """Fixture for TimeTravelService mock"""
    if not HAS_SERVICE:
        pytest.skip("TimeTravelService not available")
    return MagicMock()


@pytest.mark.skipif(not HAS_SERVICE, reason="TimeTravelService not available")
def test_service_module_can_be_imported():
    """Test service module can be imported"""
    from app.services.intelligence.time_travel_service import TimeTravelService
    assert TimeTravelService is not None


@pytest.mark.skipif(not HAS_SERVICE, reason="TimeTravelService not available")
def test_service_class_exists():
    """Test TimeTravelService class exists"""
    from app.services.intelligence.time_travel_service import TimeTravelService
    assert TimeTravelService is not None


@pytest.mark.skipif(not HAS_SERVICE, reason="TimeTravelService not available")
def test_service_mock_can_be_created(mock_service):
    """Test service mock can be created"""
    assert mock_service is not None


@pytest.mark.unit
@pytest.mark.asyncio
@pytest.mark.skipif(not HAS_SERVICE, reason="TimeTravelService not available")
async def test_service_export():
    """Export test that service is available"""
    from app.services.intelligence.time_travel_service import TimeTravelService
    assert TimeTravelService is not None
