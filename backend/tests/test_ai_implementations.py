"""Integration tests for AI services implementations.
Tests cognitive decisions, notifications, vector store, and other implemented features.
"""

import asyncio
import os
import sys
from datetime import datetime

import pytest

# Add backend to path
sys.path.insert(0, os.path.join(os.path.dirname(__file__), '..'))

# Set test environment
os.environ['SECRET_KEY'] = 'test-secret-key-for-testing'
os.environ['DATABASE_URL'] = 'sqlite:///:memory:'
os.environ['VITE_API_URL'] = 'http://localhost:8000'
os.environ['VITE_SUPABASE_URL'] = 'https://test.supabase.co'
os.environ['VITE_SUPABASE_ANON_KEY'] = 'test-key'
os.environ['LOG_LEVEL'] = 'ERROR'
os.environ['CHROMA_DB_URL'] = ''  # Disable ChromaDB for testing


class TestAIDecisionModels:
    """Tests for AI decision models."""

    def test_ai_decision_model_creation(self):
        """Test that AIDecision model can be instantiated."""
        from app.models.ai_models import AIDecision

        decision = AIDecision(
            decision_id="test_decision_001",
            decision_type="fraud_analysis",
            confidence_level="high",
            decision="Fraudulent transaction detected",
            reasoning=["Pattern matches known fraud", "Amount exceeds threshold"],
            evidence={"transaction_amount": 15000, "merchant_risk": "high"},
            alternatives=[{"action": "block", "confidence": 0.9}],
            risk_assessment={"score": 0.85, "level": "high"},
            model_version="v1.0.0",
            processing_time=0.5,
            human_override_required=False,
            user_id=1,
            tenant_id=1,
        )

        assert decision.decision_id == "test_decision_001"
        assert decision.decision_type == "fraud_analysis"
        assert decision.confidence_level == "high"
        assert decision.user_id == 1

    def test_ai_interaction_model_creation(self):
        """Test that AIInteraction model can be instantiated."""
        from app.models.ai_models import AIInteraction

        interaction = AIInteraction(
            interaction_id="test_interaction_001",
            user_id=1,
            tenant_id=1,
            interaction_type="user_query",
            user_input="Analyze this transaction",
            ai_response="The transaction shows suspicious patterns...",
            context={"transaction_id": "tx_123"},
            collaboration_mode="interactive",
            confidence_score=0.85,
            processing_time=0.3,
        )

        assert interaction.interaction_id == "test_interaction_001"
        assert interaction.interaction_type == "user_query"
        assert interaction.confidence_score == 0.85


class TestNotificationService:
    """Tests for notification service implementations."""

    def test_notification_service_creation(self):
        """Test NotificationService can be created."""
        from app.services.infrastructure.notification_service import NotificationService

        service = NotificationService()
        assert service is not None
        assert hasattr(service, 'notifications')
        assert isinstance(service.notifications, list)

    def test_send_in_app_notification(self):
        """Test sending in-app notifications."""
        from app.services.infrastructure.notification_service import NotificationService

        service = NotificationService()
        result = service.send_in_app(
            user_id="user_123",
            title="Test Alert",
            body="This is a test notification",
            metadata={"type": "test"},
        )

        assert result is True
        assert len(service.notifications) == 1
        assert service.notifications[0]["title"] == "Test Alert"

    def test_send_email_notification(self):
        """Test email notification (logs to console in test mode)."""
        from app.services.infrastructure.notification_service import NotificationService

        service = NotificationService()
        result = service.send_email(
            email="test@example.com",
            subject="Test Subject",
            body="Test email body",
        )

        assert result is True

    def test_advanced_notification_system(self):
        """Test AdvancedNotificationSystem creation."""
        from app.services.infrastructure.notification_service import (
            AdvancedNotificationSystem,
        )

        system = AdvancedNotificationSystem()
        assert system is not None
        assert hasattr(system, 'handlers')
        assert hasattr(system, 'rules')
        assert hasattr(system, 'template_engine')

    def test_notification_template_rendering(self):
        """Test notification template engine."""
        from app.services.infrastructure.notification_service import (
            AdvancedNotificationSystem,
            NotificationType,
        )

        system = AdvancedNotificationSystem()
        result = system.template_engine.render(
            NotificationType.FRAUD_ALERT,
            {
                "risk_score": 0.95,
                "amount": 15000,
                "merchant": "Suspicious Merchant",
                "reason": "Multiple high-risk indicators",
            }
        )

        assert "title" in result
        assert "message" in result
        assert "Fraud Alert" in result["title"]


class TestVectorStore:
    """Tests for vector store implementations."""

    def test_vector_store_creation(self):
        """Test VectorStore can be created."""
        from app.services.intelligence.vector_store import VectorStore

        store = VectorStore()
        assert store is not None
        assert hasattr(store, 'documents')
        assert hasattr(store, 'ids')
        assert hasattr(store, '_matrix')

    def test_vector_store_indexing(self):
        """Test document indexing."""
        from app.services.intelligence.vector_store import VectorStore

        store = VectorStore()
        store.index("doc_001", "This is a test document about fraud detection")
        store.index("doc_002", "Another document about machine learning")

        assert len(store.documents) == 2
        assert len(store.ids) == 2

    def test_vector_store_query(self):
        """Test document querying."""
        from app.services.intelligence.vector_store import VectorStore

        store = VectorStore()
        store.index("doc_001", "Fraud detection and prevention")
        store.index("doc_002", "Machine learning algorithms")
        store.index("doc_003", "Credit card transactions")

        # Query for fraud-related documents
        results = store.query("fraud detection", top_k=2)

        assert len(results) >= 1
        assert results[0][0] == "doc_001"  # Should be the most relevant

    def test_vector_store_stats(self):
        """Test vector store statistics."""
        from app.services.intelligence.vector_store import VectorStore

        store = VectorStore()
        store.index("doc_001", "Test document")

        stats = store.get_stats()
        assert "total_documents" in stats
        assert stats["total_documents"] == 1


class TestAMLVelocityService:
    """Tests for AML velocity service implementations."""

    def test_aml_service_creation(self):
        """Test AMLVelocityService can be created."""
        from app.services.intelligence.aml_service import AMLVelocityService
        from sqlalchemy import create_engine
        from sqlalchemy.orm import sessionmaker

        engine = create_engine('sqlite:///:memory:')
        Session = sessionmaker(bind=engine)
        session = Session()

        service = AMLVelocityService(session)
        assert service is not None
        assert hasattr(service, 'db')
        assert hasattr(service, '_cache')

    def test_structuring_detection_no_transactions(self):
        """Test structuring detection with no transactions."""
        from app.services.intelligence.aml_service import AMLVelocityService
        from sqlalchemy import create_engine
        from sqlalchemy.orm import sessionmaker

        engine = create_engine('sqlite:///:memory:')
        Session = sessionmaker(bind=engine)
        session = Session()

        service = AMLVelocityService(session)

        # Test with no transactions
        result = asyncio.get_event_loop().run_until_complete(
            service.detect_structuring("account_001")
        )

        assert result["account_id"] == "account_001"
        assert result["structuring_detected"] is False
        assert result["smurfing_score"] == 0.0

    def test_consistency_calculation(self):
        """Test transaction consistency calculation."""
        from app.services.intelligence.aml_service import AMLVelocityService
        from sqlalchemy import create_engine
        from sqlalchemy.orm import sessionmaker

        engine = create_engine('sqlite:///:memory:')
        Session = sessionmaker(bind=engine)
        session = Session()

        service = AMLVelocityService(session)

        # Test with varying consistency
        consistent_txns = [
            {"amount": 9500},
            {"amount": 9600},
            {"amount": 9700},
        ]

        score = service._calculate_consistency(consistent_txns)
        assert 0 <= score <= 1

        # Test with inconsistent transactions
        inconsistent_txns = [
            {"amount": 1000},
            {"amount": 9000},
            {"amount": 500},
        ]

        score2 = service._calculate_consistency(inconsistent_txns)
        assert 0 <= score2 <= 1


class TestReconciliationService:
    """Tests for reconciliation service implementations."""

    def test_reconciliation_service_creation(self):
        """Test ReconciliationService can be created."""
        from app.services.reconciliation_service import ReconciliationService
        from sqlalchemy import create_engine
        from sqlalchemy.orm import sessionmaker

        engine = create_engine('sqlite:///:memory:')
        Session = sessionmaker(bind=engine)
        session = Session()

        service = ReconciliationService(session)
        assert service is not None

    def test_expense_candidates_empty(self):
        """Test getting expense candidates with empty database."""
        from app.services.reconciliation_service import ReconciliationService
        from sqlalchemy import create_engine
        from sqlalchemy.orm import sessionmaker

        engine = create_engine('sqlite:///:memory:')
        Session = sessionmaker(bind=engine)
        session = Session()

        service = ReconciliationService(session)

        # Test getting candidates when DB is empty
        ref_date = datetime.now()
        candidates = service._get_expense_candidates(ref_date, 7, 100.0, 10.0)

        assert isinstance(candidates, list)


class TestAICodeReviewer:
    """Tests for AI code reviewer implementations."""

    def test_code_reviewer_creation(self):
        """Test CodeReviewer can be created."""
        from app.services.ai.ai_code_reviewer import CodeReviewer

        reviewer = CodeReviewer()
        assert reviewer is not None
        assert hasattr(reviewer, 'security_patterns')
        assert hasattr(reviewer, 'quality_metrics')

    def test_analyze_code_method_exists(self):
        """Test that analyze_code method exists."""
        from app.services.ai.ai_code_reviewer import CodeReviewer

        reviewer = CodeReviewer()
        assert hasattr(reviewer, 'analyze_code')
        assert callable(reviewer.analyze_code)

    def test_generate_fix_method_exists(self):
        """Test that generate_fix method exists."""
        from app.services.ai.ai_code_reviewer import CodeReviewer

        reviewer = CodeReviewer()
        assert hasattr(reviewer, 'generate_fix')
        assert callable(reviewer.generate_fix)


class TestAIAccessValidation:
    """Tests for AI access validation."""

    def test_validate_ai_access_function_exists(self):
        """Test validate_ai_access function exists."""
        import inspect

        from app.api.v1.endpoints.ai_services import validate_ai_access

        assert callable(validate_ai_access)
        sig = inspect.signature(validate_ai_access)
        assert 'user_id' in sig.parameters
        assert 'service_type' in sig.parameters

    def test_ai_service_permissions_defined(self):
        """Test that AI service permissions are defined."""
        from app.api.v1.endpoints.ai_services import AI_SERVICE_PERMISSIONS

        assert isinstance(AI_SERVICE_PERMISSIONS, dict)
        assert 'make_cognitive_decision' in AI_SERVICE_PERMISSIONS
        assert 'generate_predictive_insights' in AI_SERVICE_PERMISSIONS
        assert 'human_ai_interaction' in AI_SERVICE_PERMISSIONS


class TestCognitiveDecisionStorage:
    """Tests for cognitive decision storage function."""

    def test_store_cognitive_decision_function_exists(self):
        """Test store_cognitive_decision function exists."""
        import inspect

        from app.api.v1.endpoints.ai_services import store_cognitive_decision

        assert callable(store_cognitive_decision)
        sig = inspect.signature(store_cognitive_decision)
        assert 'decision_id' in sig.parameters
        assert 'user_id' in sig.parameters


class TestStoreAIInteraction:
    """Tests for AI interaction storage function."""

    def test_store_ai_interaction_function_exists(self):
        """Test store_ai_interaction function exists."""
        import inspect

        from app.api.v1.endpoints.ai_services import store_ai_interaction

        assert callable(store_ai_interaction)
        sig = inspect.signature(store_ai_interaction)
        assert 'interaction_id' in sig.parameters
        assert 'user_id' in sig.parameters


# Run tests if executed directly
if __name__ == "__main__":
    pytest.main([__file__, "-v"])
