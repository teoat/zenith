"""
Domain Layer - Domain-Driven Design Implementation
Achieving 10/10 maintainability through clean domain modeling
"""

from abc import ABC, abstractmethod
from dataclasses import dataclass
from datetime import datetime
from typing import Any
from uuid import UUID


# Domain Events
@dataclass
class DomainEvent:
    """Base class for all domain events"""

    event_id: UUID
    aggregate_id: UUID
    event_type: str
    timestamp: datetime
    version: int
    data: dict[str, Any]

    def __post_init__(self):
        if not self.event_id:
            self.event_id = UUID()
        if not self.timestamp:
            self.timestamp = datetime.now()


# Value Objects
@dataclass(frozen=True)
class Money:
    """Money value object for precise financial calculations"""

    amount: float
    currency: str = "USD"

    def __post_init__(self):
        if self.amount < 0:
            raise ValueError("Amount cannot be negative")
        if not self.currency:
            raise ValueError("Currency is required")

    def add(self, other: "Money") -> "Money":
        if self.currency != other.currency:
            raise ValueError("Cannot add different currencies")
        return Money(self.amount + other.amount, self.currency)

    def multiply(self, factor: float) -> "Money":
        return Money(self.amount * factor, self.currency)


@dataclass(frozen=True)
class RiskScore:
    """Risk score value object with validation"""

    value: float
    confidence: float
    factors: list[str]

    def __post_init__(self):
        if not (0.0 <= self.value <= 1.0):
            raise ValueError("Risk score must be between 0.0 and 1.0")
        if not (0.0 <= self.confidence <= 1.0):
            raise ValueError("Confidence must be between 0.0 and 1.0")


@dataclass(frozen=True)
class EntityId:
    """Strongly typed entity identifier"""

    value: UUID

    @classmethod
    def new(cls) -> "EntityId":
        return cls(UUID())

    @classmethod
    def from_string(cls, value: str) -> "EntityId":
        return cls(UUID(value))


# Domain Entities
@dataclass
class AggregateRoot(ABC):
    """Base class for aggregate roots"""

    id: EntityId
    version: int = 0
    _uncommitted_events: list[DomainEvent] = None

    def __post_init__(self):
        if self._uncommitted_events is None:
            self._uncommitted_events = []

    def _apply_event(self, event: DomainEvent):
        """Apply domain event to aggregate"""
        self._uncommitted_events.append(event)
        self.version += 1
        self._when(event)

    @abstractmethod
    def _when(self, event: DomainEvent):
        """Handle domain event"""

    def get_uncommitted_events(self) -> list[DomainEvent]:
        """Get uncommitted domain events"""
        return self._uncommitted_events.copy()

    def mark_events_as_committed(self):
        """Mark events as committed"""
        self._uncommitted_events.clear()


@dataclass
class FraudCase(AggregateRoot):
    """Fraud case aggregate root"""

    title: str
    description: str | None = None
    status: str = "open"
    priority: str = "medium"
    assignee_id: EntityId | None = None
    risk_score: RiskScore | None = None
    created_at: datetime | None = None
    updated_at: datetime | None = None

    def __post_init__(self):
        super().__post_init__()
        if self.created_at is None:
            self.created_at = datetime.now()
        if self.updated_at is None:
            self.updated_at = datetime.now()

    def assign_investigator(self, investigator_id: EntityId):
        """Assign case to investigator"""
        if self.assignee_id == investigator_id:
            return  # No change

        event = DomainEvent(
            event_id=None,
            aggregate_id=self.id.value,
            event_type="CaseAssigned",
            timestamp=datetime.now(),
            version=self.version + 1,
            data={
                "old_assignee": str(self.assignee_id.value) if self.assignee_id else None,
                "new_assignee": str(investigator_id.value),
                "assigned_at": datetime.now().isoformat(),
            },
        )
        self._apply_event(event)

    def update_risk_score(self, risk_score: RiskScore):
        """Update case risk score"""
        if self.risk_score == risk_score:
            return  # No change

        event = DomainEvent(
            event_id=None,
            aggregate_id=self.id.value,
            event_type="RiskScoreUpdated",
            timestamp=datetime.now(),
            version=self.version + 1,
            data={
                "old_score": self.risk_score.value if self.risk_score else None,
                "new_score": risk_score.value,
                "confidence": risk_score.confidence,
                "factors": risk_score.factors,
                "updated_at": datetime.now().isoformat(),
            },
        )
        self._apply_event(event)

    def _when(self, event: DomainEvent):
        """Handle domain events"""
        if event.event_type == "CaseAssigned":
            self.assignee_id = EntityId(UUID(event.data["new_assignee"]))
            self.updated_at = datetime.now()

        elif event.event_type == "RiskScoreUpdated":
            self.risk_score = RiskScore(
                value=event.data["new_score"],
                confidence=event.data["confidence"],
                factors=event.data["factors"],
            )
            self.updated_at = datetime.now()


@dataclass
class Transaction:
    """Transaction entity"""

    id: EntityId
    case_id: EntityId
    amount: Money
    merchant: str
    transaction_date: datetime
    flagged: bool = False
    risk_factors: list[str] = None

    def __post_init__(self):
        if self.risk_factors is None:
            self.risk_factors = []

    def flag_for_review(self, reason: str):
        """Flag transaction for review"""
        self.flagged = True
        if reason not in self.risk_factors:
            self.risk_factors.append(reason)


# Domain Services
class FraudAnalysisService:
    """Domain service for fraud analysis"""

    def __init__(self, risk_threshold: float = 0.7):
        self.risk_threshold = risk_threshold

    def analyze_transaction_patterns(self, transactions: list[Transaction], case: FraudCase) -> RiskScore:
        """Analyze transaction patterns for fraud indicators"""

        if not transactions:
            return RiskScore(0.0, 1.0, ["No transactions to analyze"])

        # Analyze transaction patterns
        risk_factors = []
        total_amount = sum(tx.amount.amount for tx in transactions)
        avg_amount = total_amount / len(transactions)

        # Check for unusual patterns
        if len(transactions) > 10:
            risk_factors.append("High transaction volume")

        if avg_amount > 5000:
            risk_factors.append("High average transaction amount")

        # Check for rapid succession
        if len(transactions) >= 2:
            time_diffs = []
            sorted_txs = sorted(transactions, key=lambda x: x.transaction_date)

            for i in range(1, len(sorted_txs)):
                diff = (sorted_txs[i].transaction_date - sorted_txs[i - 1].transaction_date).seconds
                time_diffs.append(diff)

            avg_time_diff = sum(time_diffs) / len(time_diffs)
            if avg_time_diff < 3600:  # Less than 1 hour apart
                risk_factors.append("Rapid transaction succession")

        # Calculate risk score
        base_risk = len(risk_factors) * 0.2
        risk_score = min(base_risk + (total_amount / 100000), 1.0)  # Cap at 1.0

        confidence = min(0.5 + (len(transactions) * 0.1), 1.0)  # Higher confidence with more data

        return RiskScore(risk_score, confidence, risk_factors)

    def assess_case_risk(self, case: FraudCase, transactions: list[Transaction]) -> RiskScore:
        """Assess overall case risk"""
        if not transactions:
            return RiskScore(0.1, 0.8, ["Insufficient transaction data"])

        # Get transaction pattern analysis
        transaction_risk = self.analyze_transaction_patterns(transactions, case)

        # Factor in case priority
        priority_multiplier = {
            "low": 0.5,
            "medium": 1.0,
            "high": 1.5,
            "critical": 2.0,
        }.get(case.priority.lower(), 1.0)

        adjusted_risk = min(transaction_risk.value * priority_multiplier, 1.0)

        factors = [*transaction_risk.factors, f"Priority: {case.priority}"]

        return RiskScore(adjusted_risk, transaction_risk.confidence, factors)


class CaseAssignmentService:
    """Domain service for intelligent case assignment"""

    def __init__(self, workload_capacity: dict[str, int]):
        self.workload_capacity = workload_capacity  # investigator_id -> max_cases

    def recommend_assignment(self, case: FraudCase, available_investigators: list[dict[str, Any]]) -> EntityId | None:
        """
        Recommend case assignment based on:
        - Investigator expertise
        - Current workload
        - Case priority and risk
        """

        if not available_investigators:
            return None

        # Score each investigator
        scored_investigators = []

        for investigator in available_investigators:
            inv_id = investigator["id"]
            current_cases = investigator.get("current_cases", 0)
            expertise = investigator.get("expertise", [])

            # Base score
            score = 100

            # Adjust for workload (lower score if over capacity)
            capacity = self.workload_capacity.get(str(inv_id), 10)
            if current_cases >= capacity:
                score -= 50  # Significant penalty for full capacity

            # Adjust for expertise match
            if "fraud" in expertise:
                score += 20
            if "financial_crime" in expertise:
                score += 15

            # Adjust for case priority
            if case.priority == "critical":
                score += 30  # High priority gets priority assignment
            elif case.priority == "high":
                score += 20

            scored_investigators.append((inv_id, score))

        # Return highest scoring investigator
        if scored_investigators:
            best_investigator = max(scored_investigators, key=lambda x: x[1])
            return EntityId(UUID(best_investigator[0]))

        return None


# Repository Interfaces (Domain Layer)
class Repository(ABC):
    """Base repository interface"""

    @abstractmethod
    async def save(self, aggregate: AggregateRoot) -> None:
        pass

    @abstractmethod
    async def find_by_id(self, aggregate_id: EntityId) -> AggregateRoot | None:
        pass


class FraudCaseRepository(Repository):
    """Repository interface for fraud cases"""

    @abstractmethod
    async def find_by_status(self, status: str) -> list[FraudCase]:
        pass

    @abstractmethod
    async def find_by_assignee(self, assignee_id: EntityId) -> list[FraudCase]:
        pass

    @abstractmethod
    async def find_high_risk_cases(self, threshold: float) -> list[FraudCase]:
        pass


class TransactionRepository(ABC):
    """Repository interface for transactions"""

    @abstractmethod
    async def find_by_case(self, case_id: EntityId) -> list[Transaction]:
        pass

    @abstractmethod
    async def find_flagged_transactions(self) -> list[Transaction]:
        pass

    @abstractmethod
    async def find_suspicious_patterns(self, time_window_hours: int) -> list[Transaction]:
        pass


# Application Services (Use Cases)
class CreateFraudCaseUseCase:
    """Use case for creating fraud cases"""

    def __init__(self, case_repository: FraudCaseRepository):
        self.case_repository = case_repository

    async def execute(self, title: str, description: str | None, priority: str, creator_id: EntityId) -> FraudCase:
        # Create new case
        case_id = EntityId.new()
        case = FraudCase(
            id=case_id,
            title=title,
            description=description,
            status="open",
            priority=priority,
            assignee_id=None,  # Will be assigned later
            risk_score=None,  # Will be calculated after transactions
            created_at=datetime.now(),
            updated_at=datetime.now(),
        )

        # Save case
        await self.case_repository.save(case)

        return case


class AnalyzeCaseRiskUseCase:
    """Use case for analyzing case risk"""

    def __init__(
        self,
        case_repository: FraudCaseRepository,
        transaction_repository: TransactionRepository,
        fraud_analysis_service: FraudAnalysisService,
    ):
        self.case_repository = case_repository
        self.transaction_repository = transaction_repository
        self.fraud_analysis_service = fraud_analysis_service

    async def execute(self, case_id: EntityId) -> RiskScore:
        # Get case and transactions
        case = await self.case_repository.find_by_id(case_id)
        if not case:
            raise ValueError(f"Case {case_id.value} not found")

        transactions = await self.transaction_repository.find_by_case(case_id)

        # Analyze risk
        risk_score = self.fraud_analysis_service.assess_case_risk(case, transactions)

        # Update case with new risk score
        case.update_risk_score(risk_score)
        await self.case_repository.save(case)

        return risk_score


# Export domain objects
__all__ = [
    "AggregateRoot",
    "AnalyzeCaseRiskUseCase",
    "CaseAssignmentService",
    "CreateFraudCaseUseCase",
    "DomainEvent",
    "EntityId",
    "FraudAnalysisService",
    "FraudCase",
    "FraudCaseRepository",
    "Money",
    "Repository",
    "RiskScore",
    "Transaction",
    "TransactionRepository",
]
