"""
Clean Architecture Implementation - Hexagonal Ports & Adapters
Domain-Driven Design with ultimate separation of concerns
"""

import logging
from dataclasses import dataclass
from datetime import datetime
from typing import Any, Generic, Protocol, TypeVar

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Generic types for Clean Architecture
T = TypeVar("T")
ID = TypeVar("ID")


# Domain Events
@dataclass
class DomainEvent:
    """Base domain event"""

    event_id: str
    event_type: str
    aggregate_id: str
    event_data: dict[str, Any]
    timestamp: float
    version: int = 1


# Core Domain Entities
@dataclass
class Entity(Generic[ID]):
    """Base entity with identity"""

    id: ID
    created_at: datetime
    updated_at: datetime

    def update_timestamp(self):
        self.updated_at = datetime.now()


@dataclass
class AggregateRoot(Entity[ID]):
    """Base aggregate root"""

    version: int = 1
    domain_events: list[DomainEvent] = None

    def __post_init__(self):
        if self.domain_events is None:
            self.domain_events = []

    def add_domain_event(self, event: DomainEvent):
        self.domain_events.append(event)
        self.version += 1

    def clear_domain_events(self) -> list[DomainEvent]:
        events = self.domain_events.copy()
        self.domain_events.clear()
        return events


# Domain Models
@dataclass
class FraudCase(AggregateRoot[str]):
    """Fraud case aggregate root"""

    title: str
    description: str
    status: str
    priority: str
    case_type: str
    assignee_id: str | None
    risk_score: float
    tags: list[str]
    case_metadata: dict[str, Any]

    def assign_investigator(self, investigator_id: str):
        if self.status != "OPEN":
            raise ValueError("Can only assign investigators to open cases")

        self.assignee_id = investigator_id
        self.add_domain_event(
            DomainEvent(
                event_id=f"case_assigned_{self.id}",
                event_type="case.assigned",
                aggregate_id=self.id,
                event_data={"assignee_id": investigator_id},
                timestamp=datetime.now().timestamp(),
            )
        )
        self.update_timestamp()

    def update_risk_score(self, new_score: float):
        old_score = self.risk_score
        self.risk_score = new_score
        self.add_domain_event(
            DomainEvent(
                event_id=f"risk_updated_{self.id}",
                event_type="case.risk_updated",
                aggregate_id=self.id,
                event_data={"old_score": old_score, "new_score": new_score},
                timestamp=datetime.now().timestamp(),
            )
        )
        self.update_timestamp()


@dataclass
class Transaction(Entity[str]):
    """Transaction entity"""

    case_id: str
    amount: float
    currency: str
    description: str
    merchant_name: str
    transaction_date: datetime
    risk_score: float
    is_fraudulent: bool


# Repository Interfaces (Ports)
class Repository(Protocol[T, ID]):
    """Repository port interface"""

    async def save(self, entity: T) -> T:
        """Save entity"""
        ...

    async def find_by_id(self, entity_id: ID) -> T | None:
        """Find entity by ID"""
        ...

    async def find_all(self) -> list[T]:
        """Find all entities"""
        ...

    async def delete(self, entity_id: ID) -> bool:
        """Delete entity by ID"""
        ...


class FraudCaseRepository(Repository[FraudCase, str], Protocol):
    """Fraud case repository port"""

    async def find_by_assignee(self, assignee_id: str) -> list[FraudCase]:
        """Find cases by assignee"""
        ...

    async def find_high_risk_cases(self, threshold: float) -> list[FraudCase]:
        """Find high risk cases"""
        ...

    async def find_by_status(self, status: str) -> list[FraudCase]:
        """Find cases by status"""
        ...


class TransactionRepository(Repository[Transaction, str], Protocol):
    """Transaction repository port"""

    async def find_by_case_id(self, case_id: str) -> list[Transaction]:
        """Find transactions by case ID"""
        ...

    async def find_suspicious_transactions(self, threshold: float) -> list[Transaction]:
        """Find suspicious transactions"""
        ...


# Service Interfaces (Ports)
class FraudDetectionServicePort(Protocol):
    """Fraud detection service port"""

    async def analyze_transaction(self, transaction: Transaction) -> dict[str, Any]:
        """Analyze transaction for fraud"""
        ...

    async def analyze_case(self, case: FraudCase) -> dict[str, Any]:
        """Analyze entire case for fraud patterns"""
        ...


class NotificationServicePort(Protocol):
    """Notification service port"""

    async def send_alert(self, recipient: str, message: str, priority: str) -> bool:
        """Send alert notification"""
        ...

    async def send_report(self, recipient: str, report_data: dict[str, Any]) -> bool:
        """Send report notification"""
        ...


class AuditServicePort(Protocol):
    """Audit service port"""

    async def log_action(
        self,
        user_id: str,
        action: str,
        resource: str,
        resource_id: str,
        details: dict[str, Any],
    ) -> None:
        """Log audit action"""
        ...


# Use Cases (Application Layer)
class CreateFraudCaseUseCase:
    """Use case for creating fraud cases"""

    def __init__(
        self,
        fraud_case_repo: FraudCaseRepository,
        notification_service: NotificationServicePort,
        audit_service: AuditServicePort,
    ):
        self.fraud_case_repo = fraud_case_repo
        self.notification_service = notification_service
        self.audit_service = audit_service

    async def execute(self, case_data: dict[str, Any], created_by: str) -> FraudCase:
        """Execute use case"""

        # Create case entity
        case = FraudCase(
            id=f"case_{datetime.now().timestamp()}",
            title=case_data["title"],
            description=case_data["description"],
            status="OPEN",
            priority=case_data.get("priority", "MEDIUM"),
            case_type=case_data.get("case_type", "FRAUD_SUSPECTED"),
            assignee_id=None,
            risk_score=case_data.get("risk_score", 0.0),
            tags=case_data.get("tags", []),
            case_metadata=case_data.get("metadata", {}),
            created_at=datetime.now(),
            updated_at=datetime.now(),
        )

        # Save to repository
        saved_case = await self.fraud_case_repo.save(case)

        # Audit the action
        await self.audit_service.log_action(
            user_id=created_by,
            action="CREATE",
            resource="CASE",
            resource_id=saved_case.id,
            details={"case_data": case_data},
        )

        # Send notification
        await self.notification_service.send_alert(
            recipient="fraud_team",
            message=f"New fraud case created: {saved_case.title}",
            priority="medium",
        )

        # Clear domain events after successful save
        saved_case.clear_domain_events()

        return saved_case


class AnalyzeFraudUseCase:
    """Use case for fraud analysis"""

    def __init__(
        self,
        fraud_detection_service: FraudDetectionServicePort,
        transaction_repo: TransactionRepository,
        audit_service: AuditServicePort,
    ):
        self.fraud_detection_service = fraud_detection_service
        self.transaction_repo = transaction_repo
        self.audit_service = audit_service

    async def execute(self, case_id: str, analyzed_by: str) -> dict[str, Any]:
        """Execute fraud analysis"""

        # Get transactions for the case
        transactions = await self.transaction_repo.find_by_case_id(case_id)

        if not transactions:
            return {"status": "no_transactions", "analysis": {}}

        # Analyze each transaction
        analysis_results = []
        for transaction in transactions:
            result = await self.fraud_detection_service.analyze_transaction(transaction)
            analysis_results.append(result)

        # Overall case analysis
        case_analysis = await self.fraud_detection_service.analyze_case_pattern(
            case_id, analysis_results
        )

        # Audit the analysis
        await self.audit_service.log_action(
            user_id=analyzed_by,
            action="ANALYZE",
            resource="CASE",
            resource_id=case_id,
            details={
                "transaction_count": len(transactions),
                "fraud_indicators": len(
                    [r for r in analysis_results if r.get("is_fraudulent")]
                ),
            },
        )

        return {
            "case_id": case_id,
            "transaction_analysis": analysis_results,
            "case_analysis": case_analysis,
            "analyzed_at": datetime.now().isoformat(),
            "analyzed_by": analyzed_by,
        }


# Infrastructure Adapters
class InMemoryFraudCaseRepository(FraudCaseRepository):
    """In-memory implementation of fraud case repository"""

    def __init__(self):
        self.cases: dict[str, FraudCase] = {}

    async def save(self, case: FraudCase) -> FraudCase:
        self.cases[case.id] = case
        return case

    async def find_by_id(self, case_id: str) -> FraudCase | None:
        return self.cases.get(case_id)

    async def find_all(self) -> list[FraudCase]:
        return list(self.cases.values())

    async def delete(self, case_id: str) -> bool:
        if case_id in self.cases:
            del self.cases[case_id]
            return True
        return False

    async def find_by_assignee(self, assignee_id: str) -> list[FraudCase]:
        return [case for case in self.cases.values() if case.assignee_id == assignee_id]

    async def find_high_risk_cases(self, threshold: float) -> list[FraudCase]:
        return [case for case in self.cases.values() if case.risk_score >= threshold]

    async def find_by_status(self, status: str) -> list[FraudCase]:
        return [case for case in self.cases.values() if case.status == status]


class InMemoryTransactionRepository(TransactionRepository):
    """In-memory implementation of transaction repository"""

    def __init__(self):
        self.transactions: dict[str, Transaction] = {}

    async def save(self, transaction: Transaction) -> Transaction:
        self.transactions[transaction.id] = transaction
        return transaction

    async def find_by_id(self, transaction_id: str) -> Transaction | None:
        return self.transactions.get(transaction_id)

    async def find_all(self) -> list[Transaction]:
        return list(self.transactions.values())

    async def delete(self, transaction_id: str) -> bool:
        if transaction_id in self.transactions:
            del self.transactions[transaction_id]
            return True
        return False

    async def find_by_case_id(self, case_id: str) -> list[Transaction]:
        return [tx for tx in self.transactions.values() if tx.case_id == case_id]

    async def find_suspicious_transactions(self, threshold: float) -> list[Transaction]:
        return [tx for tx in self.transactions.values() if tx.risk_score >= threshold]


class MockFraudDetectionService(FraudDetectionServicePort):
    """Mock implementation of fraud detection service"""

    async def analyze_transaction(self, transaction: Transaction) -> dict[str, Any]:
        # Simple mock analysis
        is_fraudulent = (
            transaction.amount > 10000
            or "suspicious" in transaction.description.lower()
        )

        return {
            "transaction_id": transaction.id,
            "is_fraudulent": is_fraudulent,
            "risk_score": 0.8 if is_fraudulent else 0.2,
            "flags": ["high_amount"] if transaction.amount > 10000 else [],
            "confidence": 0.95,
        }

    async def analyze_case(self, case: FraudCase) -> dict[str, Any]:
        # Mock case analysis
        return {
            "case_id": case.id,
            "overall_risk": "HIGH" if case.risk_score > 0.7 else "MEDIUM",
            "patterns_detected": ["velocity_anomaly", "unusual_merchant"],
            "recommendations": ["escalate_for_review", "additional_investigation"],
        }


class MockNotificationService(NotificationServicePort):
    """Mock implementation of notification service"""

    async def send_alert(self, recipient: str, message: str, priority: str) -> bool:
        logger.info(f"Sending {priority} alert to {recipient}: {message}")
        return True

    async def send_report(self, recipient: str, report_data: dict[str, Any]) -> bool:
        logger.info(f"Sending report to {recipient}: {report_data.keys()}")
        return True


class MockAuditService(AuditServicePort):
    """Mock implementation of audit service"""

    async def log_action(
        self,
        user_id: str,
        action: str,
        resource: str,
        resource_id: str,
        details: dict[str, Any],
    ) -> None:
        logger.info(f"AUDIT: {user_id} {action} {resource}:{resource_id} - {details}")


# Application Services (Application Layer Orchestration)
class FraudInvestigationApplicationService:
    """Application service coordinating fraud investigation workflows"""

    def __init__(
        self,
        case_repo: FraudCaseRepository,
        transaction_repo: TransactionRepository,
        fraud_detection_service: FraudDetectionServicePort,
        notification_service: NotificationServicePort,
        audit_service: AuditServicePort,
    ):
        self.create_case_use_case = CreateFraudCaseUseCase(
            case_repo, notification_service, audit_service
        )
        self.analyze_fraud_use_case = AnalyzeFraudUseCase(
            fraud_detection_service, transaction_repo, audit_service
        )

    async def create_investigation_case(
        self, case_data: dict[str, Any], created_by: str
    ) -> FraudCase:
        """Create a new fraud investigation case"""
        return await self.create_case_use_case.execute(case_data, created_by)

    async def perform_fraud_analysis(
        self, case_id: str, analyzed_by: str
    ) -> dict[str, Any]:
        """Perform comprehensive fraud analysis on a case"""
        return await self.analyze_fraud_use_case.execute(case_id, analyzed_by)

    async def assign_investigator(
        self, case_id: str, investigator_id: str
    ) -> FraudCase | None:
        """Assign an investigator to a case"""
        case = await self.create_case_use_case.fraud_case_repo.find_by_id(case_id)
        if case:
            case.assign_investigator(investigator_id)
            return await self.create_case_use_case.fraud_case_repo.save(case)
        return None


# Clean Architecture Composition Root
class CleanArchitectureCompositionRoot:
    """Composition root for Clean Architecture dependency injection"""

    def __init__(self):
        # Infrastructure Layer (Adapters)
        self.fraud_case_repo = InMemoryFraudCaseRepository()
        self.transaction_repo = InMemoryTransactionRepository()
        self.fraud_detection_service = MockFraudDetectionService()
        self.notification_service = MockNotificationService()
        self.audit_service = MockAuditService()

        # Application Layer (Use Cases)
        self.application_service = FraudInvestigationApplicationService(
            self.fraud_case_repo,
            self.transaction_repo,
            self.fraud_detection_service,
            self.notification_service,
            self.audit_service,
        )

    async def initialize_system(self) -> dict[str, Any]:
        """Initialize the clean architecture system"""
        logger.info("Initializing Clean Architecture system...")

        # Create sample data
        await self._create_sample_data()

        return {
            "status": "initialized",
            "repositories": {
                "fraud_cases": await self.fraud_case_repo.find_all().__len__(),
                "transactions": await self.transaction_repo.find_all().__len__(),
            },
            "services": ["fraud_detection", "notification", "audit"],
        }

    async def _create_sample_data(self):
        """Create sample data for demonstration"""

        # Create sample case
        sample_case = await self.application_service.create_investigation_case(
            {
                "title": "Suspicious High-Value Transactions",
                "description": "Multiple large transactions from new merchant",
                "priority": "HIGH",
                "case_type": "MONEY_LAUNDERING",
                "risk_score": 0.85,
                "tags": ["money_laundering", "high_value"],
                "metadata": {"source": "automated_detection"},
            },
            "system",
        )

        # Create sample transactions
        sample_transactions = [
            Transaction(
                id=f"tx_{i}",
                case_id=sample_case.id,
                amount=50000.00 + (i * 1000),
                currency="USD",
                description=f"Large transaction {i}",
                merchant_name="New Merchant LLC",
                transaction_date=datetime.now(),
                risk_score=0.8,
                is_fraudulent=True,
                created_at=datetime.now(),
                updated_at=datetime.now(),
            )
            for i in range(1, 4)
        ]

        for tx in sample_transactions:
            await self.transaction_repo.save(tx)

        logger.info(
            f"Created sample case {sample_case.id} with {len(sample_transactions)} transactions"
        )

    async def demonstrate_clean_architecture(self) -> dict[str, Any]:
        """Demonstrate Clean Architecture capabilities"""
        logger.info("Demonstrating Clean Architecture...")

        # Create a new case
        new_case = await self.application_service.create_investigation_case(
            {
                "title": "Real-time Fraud Alert",
                "description": "Automated fraud detection triggered",
                "priority": "CRITICAL",
                "case_type": "ACCOUNT_TAKEOVER",
                "risk_score": 0.95,
                "tags": ["automated", "real_time"],
                "metadata": {"alert_source": "ai_model_v2"},
            },
            "fraud_detection_system",
        )

        # Assign investigator
        await self.application_service.assign_investigator(
            new_case.id, "investigator_001"
        )

        # Perform fraud analysis
        analysis_result = await self.application_service.perform_fraud_analysis(
            new_case.id, "ai_analyzer"
        )

        return {
            "new_case_created": new_case.id,
            "investigator_assigned": "investigator_001",
            "analysis_completed": bool(analysis_result),
            "architecture_demonstrated": True,
        }


# Global composition root instance
composition_root = CleanArchitectureCompositionRoot()


async def initialize_clean_architecture() -> dict[str, Any]:
    """Initialize the complete Clean Architecture system"""
    return await composition_root.initialize_system()


async def demonstrate_perfection() -> dict[str, Any]:
    """Demonstrate ultimate architectural perfection"""
    return await composition_root.demonstrate_clean_architecture()


# Export for use
__all__ = [
    "AggregateRoot",
    "AnalyzeFraudUseCase",
    "AuditServicePort",
    "CleanArchitectureCompositionRoot",
    "CreateFraudCaseUseCase",
    "DomainEvent",
    "Entity",
    "FraudCase",
    "FraudCaseRepository",
    "FraudDetectionServicePort",
    "FraudInvestigationApplicationService",
    "InMemoryFraudCaseRepository",
    "InMemoryTransactionRepository",
    "MockAuditService",
    "MockFraudDetectionService",
    "MockNotificationService",
    "NotificationServicePort",
    "Repository",
    "Transaction",
    "TransactionRepository",
    "composition_root",
    "demonstrate_perfection",
    "initialize_clean_architecture",
]
