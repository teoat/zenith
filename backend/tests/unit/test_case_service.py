"""
Unit tests for CaseService
"""
import pytest
from unittest.mock import Mock, patch
from sqlalchemy.orm import Session

from app.services.business.case_service import CaseService
from core.database import Case


class TestCaseService:
    """Test CaseService functionality"""

    def test_service_instantiation(self):
        """Test that CaseService can be instantiated"""
        service = CaseService()
        assert service is not None
        assert hasattr(service, 'get_case')
        assert hasattr(service, 'get_case_summary')

    @patch('app.services.business.case_service.Session')
    def test_get_case_with_joins(self, mock_session):
        """Test get_case method with proper joins"""
        mock_db = Mock(spec=Session)
        mock_case = Mock(spec=Case)
        mock_case.id = "test-case-123"

        # Mock the query chain
        mock_query = Mock()
        mock_query.options.return_value = mock_query
        mock_query.filter.return_value = mock_query
        mock_query.first.return_value = mock_case

        mock_db.query.return_value = mock_query

        service = CaseService()
        result = service.get_case(mock_db, "test-case-123")

        assert result == mock_case
        mock_db.query.assert_called_once()
        mock_query.filter.assert_called_once()
        mock_query.first.assert_called_once()

    @patch('app.services.business.case_service.Session')
    def test_get_case_not_found(self, mock_session):
        """Test get_case when case doesn't exist"""
        mock_db = Mock(spec=Session)

        # Mock the query chain returning None
        mock_query = Mock()
        mock_query.options.return_value = mock_query
        mock_query.filter.return_value = mock_query
        mock_query.first.return_value = None

        mock_db.query.return_value = mock_query

        service = CaseService()
        result = service.get_case(mock_db, "nonexistent-case")

        assert result is None

    @patch('app.services.business.case_service.Session')
    def test_get_case_summary(self, mock_session):
        """Test get_case_summary method"""
        mock_db = Mock(spec=Session)

        # Mock the query result
        mock_result = Mock()
        mock_result.id = "test-case-123"
        mock_result.title = "Test Case"
        mock_result.status = "OPEN"
        mock_result.evidence_count = 5
        mock_result.notes_count = 3

        mock_query = Mock()
        mock_query.outerjoin.return_value = mock_query
        mock_query.outerjoin.return_value = mock_query  # Second outerjoin
        mock_query.filter.return_value = mock_query
        mock_query.first.return_value = mock_result

        mock_db.query.return_value = mock_query

        service = CaseService()
        result = service.get_case_summary(mock_db, "test-case-123")

        assert result is not None
        assert result['id'] == "test-case-123"
        assert result['title'] == "Test Case"
        assert result['status'] == "OPEN"

    @patch('app.services.business.case_service.Session')
    def test_create_case(self, mock_session):
        """Test create_case method"""
        mock_db = Mock(spec=Session)
        mock_case = Mock()
        mock_case.id = "new-case-123"

        service = CaseService()
        with patch.object(service, '_create_case_object', return_value=mock_case) as mock_create:
            result = service.create_case(
                mock_db,
                title="New Case",
                description="Test description",
                status="OPEN"
            )

            mock_create.assert_called_once()
            assert result == mock_case

    @patch('app.services.business.case_service.Session')
    def test_update_case(self, mock_session):
        """Test update_case method"""
        mock_db = Mock(spec=Session)
        mock_case = Mock()
        mock_case.id = "test-case-123"

        # Mock query
        mock_query = Mock()
        mock_query.filter.return_value = mock_query
        mock_query.first.return_value = mock_case

        mock_db.query.return_value = mock_query

        service = CaseService()
        result = service.update_case(mock_db, "test-case-123", title="Updated Title")

        assert result == mock_case
        mock_db.commit.assert_called_once()

    @patch('app.services.business.case_service.Session')
    def test_delete_case(self, mock_session):
        """Test delete_case method"""
        mock_db = Mock(spec=Session)
        mock_case = Mock()

        # Mock query
        mock_query = Mock()
        mock_query.filter.return_value = mock_query
        mock_query.first.return_value = mock_case

        mock_db.query.return_value = mock_query

        service = CaseService()
        result = service.delete_case(mock_db, "test-case-123")

        assert result is True
        mock_db.delete.assert_called_once_with(mock_case)
        mock_db.commit.assert_called_once()

    def test_case_service_methods_exist(self):
        """Test that all expected methods exist"""
        service = CaseService()
        expected_methods = [
            'get_case',
            'get_case_summary',
            'get_cases',
            'get_cases_with_counts',
            'create_case',
            'update_case',
            'delete_case',
            'get_case_stats',
            'get_cases_paginated'
        ]

        for method in expected_methods:
            assert hasattr(service, method), f"Method {method} should exist"