import pytest
from unittest.mock import patch

@pytest.fixture
def my_fixture():
    return "fixture_val"

@patch("os.path.exists")
def test_order(mock_exists, my_fixture):
    print(f"\nmock_exists: {mock_exists}")
    print(f"my_fixture: {my_fixture}")
    assert my_fixture == "fixture_val"
    assert hasattr(mock_exists, "return_value")

@patch("os.path.exists")
def test_order_rev(my_fixture, mock_exists):
    print(f"\nmy_fixture: {my_fixture}")
    print(f"mock_exists: {mock_exists}")
    assert my_fixture == "fixture_val"
    assert hasattr(mock_exists, "return_value")
