"""add AI models tables

Revision ID: 005_add_ai_models
Revises: 004_add_audit_logs
Create Date: 2026-01-06

"""

import sqlalchemy as sa
from alembic import op

revision = "005_add_ai_models"
down_revision = "004_add_audit_logs"
branch_labels = None
depends_on = None


def upgrade() -> None:
    # AI Decisions table
    op.create_table(
        "ai_decisions",
        sa.Column("id", sa.Integer, nullable=False),
        sa.Column("decision_id", sa.String(100), nullable=True),
        sa.Column("decision_type", sa.String(50), nullable=True),
        sa.Column("confidence_level", sa.String(20), nullable=True),
        sa.Column("decision", sa.Text, nullable=True),
        sa.Column("reasoning", sa.Text, nullable=True),
        sa.Column("evidence", sa.Text, nullable=True),
        sa.Column("alternatives", sa.Text, nullable=True),
        sa.Column("risk_assessment", sa.Text, nullable=True),
        sa.Column("model_version", sa.String(50), nullable=True),
        sa.Column("processing_time", sa.Float, nullable=True),
        sa.Column("human_override_required", sa.Boolean, nullable=True),
        sa.Column("human_override_reason", sa.Text, nullable=True),
        sa.Column("user_id", sa.Integer, nullable=True),
        sa.Column("tenant_id", sa.Integer, nullable=True),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=True),
        sa.Column("resolved_at", sa.DateTime(timezone=True), nullable=True),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index("idx_ai_decision_id", "ai_decisions", ["decision_id"])
    op.create_index("idx_ai_decision_user", "ai_decisions", ["user_id"])

    # AI Predictions table
    op.create_table(
        "ai_predictions",
        sa.Column("id", sa.Integer, nullable=False),
        sa.Column("insight_id", sa.String(100), nullable=True),
        sa.Column("insight_type", sa.String(50), nullable=True),
        sa.Column("prediction", sa.Text, nullable=True),
        sa.Column("confidence_score", sa.Float, nullable=True),
        sa.Column("confidence_interval_lower", sa.Float, nullable=True),
        sa.Column("confidence_interval_upper", sa.Float, nullable=True),
        sa.Column("timeframe", sa.String(20), nullable=True),
        sa.Column("business_impact", sa.String(50), nullable=True),
        sa.Column("recommended_actions", sa.Text, nullable=True),
        sa.Column("data_quality_score", sa.Float, nullable=True),
        sa.Column("model_used", sa.String(50), nullable=True),
        sa.Column("user_id", sa.Integer, nullable=True),
        sa.Column("tenant_id", sa.Integer, nullable=True),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=True),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index("idx_ai_prediction_insight", "ai_predictions", ["insight_id"])

    # AI Interactions table
    op.create_table(
        "ai_interactions",
        sa.Column("id", sa.Integer, nullable=False),
        sa.Column("interaction_id", sa.String(100), nullable=True),
        sa.Column("user_id", sa.Integer, nullable=True),
        sa.Column("tenant_id", sa.Integer, nullable=True),
        sa.Column("interaction_type", sa.String(30), nullable=True),
        sa.Column("user_input", sa.Text, nullable=True),
        sa.Column("ai_response", sa.Text, nullable=True),
        sa.Column("context", sa.Text, nullable=True),
        sa.Column("collaboration_mode", sa.String(20), nullable=True),
        sa.Column("confidence_score", sa.Float, nullable=True),
        sa.Column("user_feedback", sa.Text, nullable=True),
        sa.Column("processing_time", sa.Float, nullable=True),
        sa.Column("outcome", sa.String(50), nullable=True),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=True),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index("idx_ai_interaction_user", "ai_interactions", ["user_id"])

    # AI Scaling Events table
    op.create_table(
        "ai_scaling_events",
        sa.Column("id", sa.Integer, nullable=False),
        sa.Column("event_id", sa.String(100), nullable=True),
        sa.Column("resource_type", sa.String(50), nullable=True),
        sa.Column("decision", sa.String(20), nullable=True),
        sa.Column("current_capacity", sa.Float, nullable=True),
        sa.Column("target_capacity", sa.Float, nullable=True),
        sa.Column("reason", sa.Text, nullable=True),
        sa.Column("confidence_score", sa.Float, nullable=True),
        sa.Column("estimated_cost_impact", sa.Float, nullable=True),
        sa.Column("execution_time", sa.Float, nullable=True),
        sa.Column("success", sa.Boolean, nullable=True),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=True),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index("idx_ai_scaling_event", "ai_scaling_events", ["event_id"])

    # AI Workflow Optimizations table
    op.create_table(
        "ai_workflow_optimizations",
        sa.Column("id", sa.Integer, nullable=False),
        sa.Column("workflow_id", sa.String(100), nullable=True),
        sa.Column("augmentation_type", sa.String(50), nullable=True),
        sa.Column("description", sa.Text, nullable=True),
        sa.Column("ai_suggestions", sa.Text, nullable=True),
        sa.Column("human_tasks", sa.Text, nullable=True),
        sa.Column("estimated_benefits", sa.Text, nullable=True),
        sa.Column("implementation_complexity", sa.String(20), nullable=True),
        sa.Column("confidence_score", sa.Float, nullable=True),
        sa.Column("user_id", sa.Integer, nullable=True),
        sa.Column("tenant_id", sa.Integer, nullable=True),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=True),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index("idx_ai_workflow_user", "ai_workflow_optimizations", ["user_id"])


def downgrade() -> None:
    op.drop_table("ai_workflow_optimizations")
    op.drop_table("ai_scaling_events")
    op.drop_table("ai_interactions")
    op.drop_table("ai_predictions")
    op.drop_table("ai_decisions")
