"""
AI Data Models
Database models for AI-generated insights, decisions, and interactions
"""

from datetime import UTC, datetime

from sqlalchemy import Boolean, DateTime, Float, ForeignKey, Integer, String, Text
from sqlalchemy.orm import DeclarativeBase, Mapped, mapped_column, relationship


class Base(DeclarativeBase):
    pass


class AIDecision(Base):
    """AI-generated decisions and reasoning"""

    __tablename__ = "ai_decisions"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)
    decision_id: Mapped[str] = mapped_column(String(100), unique=True, index=True)
    decision_type: Mapped[str] = mapped_column(String(50))
    confidence_level: Mapped[str] = mapped_column(String(20))
    decision: Mapped[str] = mapped_column(Text)
    reasoning: Mapped[str] = mapped_column(Text)  # JSON array of reasoning strings
    evidence: Mapped[str] = mapped_column(Text)  # JSON object
    alternatives: Mapped[str] = mapped_column(Text)  # JSON array of alternatives
    risk_assessment: Mapped[str] = mapped_column(Text)  # JSON object
    model_version: Mapped[str] = mapped_column(String(50))
    processing_time: Mapped[float] = mapped_column(Float)
    human_override_required: Mapped[bool] = mapped_column(Boolean, default=False)
    human_override_reason: Mapped[str | None] = mapped_column(Text, nullable=True)

    # Foreign keys
    user_id: Mapped[int] = mapped_column(Integer, ForeignKey("users.id"))
    tenant_id: Mapped[int] = mapped_column(Integer, ForeignKey("tenants.id"))

    # Timestamps
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), default=datetime.now(UTC)
    )
    resolved_at: Mapped[datetime | None] = mapped_column(
        DateTime(timezone=True), nullable=True
    )

    # Relationships
    user: Mapped["User"] = relationship("User", back_populates="ai_decisions")


class AIPrediction(Base):
    """AI-generated predictions and forecasts"""

    __tablename__ = "ai_predictions"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)
    insight_id: Mapped[str] = mapped_column(String(100), unique=True, index=True)
    insight_type: Mapped[str] = mapped_column(String(50))
    prediction: Mapped[str] = mapped_column(Text)  # JSON-serializable prediction
    confidence_score: Mapped[float] = mapped_column(Float)
    confidence_interval_lower: Mapped[float] = mapped_column(Float)
    confidence_interval_upper: Mapped[float] = mapped_column(Float)
    timeframe: Mapped[str] = mapped_column(String(20))
    business_impact: Mapped[str] = mapped_column(String(50))
    recommended_actions: Mapped[str] = mapped_column(Text)  # JSON array
    data_quality_score: Mapped[float] = mapped_column(Float)
    model_used: Mapped[str] = mapped_column(String(50))

    # Foreign keys
    user_id: Mapped[int] = mapped_column(Integer, ForeignKey("users.id"))
    tenant_id: Mapped[int] = mapped_column(Integer, ForeignKey("tenants.id"))

    # Timestamps
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), default=datetime.now(UTC)
    )


class AIInteraction(Base):
    """Human-AI interaction records"""

    __tablename__ = "ai_interactions"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)
    interaction_id: Mapped[str] = mapped_column(String(100), unique=True, index=True)
    user_id: Mapped[int] = mapped_column(Integer, ForeignKey("users.id"))
    tenant_id: Mapped[int] = mapped_column(Integer, ForeignKey("tenants.id"))
    interaction_type: Mapped[str] = mapped_column(String(30))
    user_input: Mapped[str] = mapped_column(Text)
    ai_response: Mapped[str] = mapped_column(Text)
    context: Mapped[str] = mapped_column(Text)  # JSON object
    collaboration_mode: Mapped[str] = mapped_column(String(20))
    confidence_score: Mapped[float] = mapped_column(Float)
    user_feedback: Mapped[str | None] = mapped_column(
        Text, nullable=True
    )  # JSON object
    processing_time: Mapped[float] = mapped_column(Float)
    outcome: Mapped[str | None] = mapped_column(String(50), nullable=True)

    # Timestamps
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), default=datetime.now(UTC)
    )


class AIScalingEvent(Base):
    """AI-driven scaling events"""

    __tablename__ = "ai_scaling_events"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)
    event_id: Mapped[str] = mapped_column(String(100), unique=True, index=True)
    resource_type: Mapped[str] = mapped_column(String(50))
    decision: Mapped[str] = mapped_column(String(20))
    current_capacity: Mapped[float] = mapped_column(Float)
    target_capacity: Mapped[float] = mapped_column(Float)
    reason: Mapped[str] = mapped_column(Text)
    confidence_score: Mapped[float] = mapped_column(Float)
    estimated_cost_impact: Mapped[float] = mapped_column(Float)
    execution_time: Mapped[float | None] = mapped_column(Float, nullable=True)
    success: Mapped[bool] = mapped_column(Boolean, default=False)

    # Timestamps
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), default=datetime.now(UTC)
    )


class AIWorkflowOptimization(Base):
    """AI-generated workflow optimizations"""

    __tablename__ = "ai_workflow_optimizations"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)
    workflow_id: Mapped[str] = mapped_column(String(100), index=True)
    augmentation_type: Mapped[str] = mapped_column(String(50))
    description: Mapped[str] = mapped_column(Text)
    ai_suggestions: Mapped[str] = mapped_column(Text)  # JSON array
    human_tasks: Mapped[str] = mapped_column(Text)  # JSON array
    estimated_benefits: Mapped[str] = mapped_column(Text)  # JSON object
    implementation_complexity: Mapped[str] = mapped_column(String(20))
    confidence_score: Mapped[float] = mapped_column(Float)

    # Foreign keys
    user_id: Mapped[int] = mapped_column(Integer, ForeignKey("users.id"))
    tenant_id: Mapped[int] = mapped_column(Integer, ForeignKey("tenants.id"))

    # Timestamps
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), default=datetime.now(UTC)
    )


# Update existing User model to include AI relationships
# Note: This would need to be integrated with the existing User model
class User(Base):
    """Extended User model with AI relationships"""

    __tablename__ = "users"

    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    email: Mapped[str] = mapped_column(String(255), unique=True)
    full_name: Mapped[str] = mapped_column(String(100))

    # AI relationships
    ai_decisions: Mapped[list[AIDecision]] = relationship(
        "AIDecision", back_populates="user"
    )


# Alembic migration for AI tables would be created separately
# This file defines the models that would be included in the migration
