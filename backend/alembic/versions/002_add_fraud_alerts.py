"""add fraud_alerts table

Revision ID: 002_add_fraud_alerts
Revises: 001_metadata_rename
Create Date: 2025-12-09

"""

import sqlalchemy as sa
from alembic import op

# revision identifiers, used by Alembic.
revision = "002_add_fraud_alerts"
down_revision = "001_metadata_rename"
branch_labels = None
depends_on = None


def upgrade() -> None:
    """Create fraud_alerts table"""

    op.create_table(
        "fraud_alerts",
        sa.Column("id", sa.String, nullable=False),
        sa.Column("case_id", sa.String, nullable=False),
        sa.Column("rule_name", sa.String, nullable=False),
        sa.Column("severity", sa.String, nullable=False),
        sa.Column("confidence", sa.Float, nullable=True),
        sa.Column("risk_score", sa.Float, nullable=True),
        sa.Column("description", sa.Text, nullable=False),
        sa.Column("transaction_ids", sa.JSON, nullable=True),
        sa.Column("entities", sa.JSON, nullable=True),
        sa.Column("metadata", sa.JSON, nullable=True),
        sa.Column("recommendations", sa.JSON, nullable=True),
        sa.Column("status", sa.String, nullable=True),
        sa.Column("assigned_to", sa.String, nullable=True),
        sa.Column("reviewed_by", sa.String, nullable=True),
        sa.Column("reviewed_at", sa.DateTime, nullable=True),
        sa.Column("resolution_notes", sa.Text, nullable=True),
        sa.Column("created_at", sa.DateTime, nullable=True),
        sa.Column("updated_at", sa.DateTime, nullable=True),
        sa.Column("resolved_at", sa.DateTime, nullable=True),
        sa.ForeignKeyConstraint(
            ["case_id"],
            ["cases.id"],
        ),
        sa.PrimaryKeyConstraint("id"),
    )

    # Create indexes
    op.create_index("ix_fraud_alerts_id", "fraud_alerts", ["id"])
    op.create_index("ix_fraud_alerts_case_id", "fraud_alerts", ["case_id"])
    op.create_index("ix_fraud_alerts_rule_name", "fraud_alerts", ["rule_name"])
    op.create_index("ix_fraud_alerts_severity", "fraud_alerts", ["severity"])
    op.create_index("ix_fraud_alerts_confidence", "fraud_alerts", ["confidence"])
    op.create_index("ix_fraud_alerts_risk_score", "fraud_alerts", ["risk_score"])
    op.create_index("ix_fraud_alerts_status", "fraud_alerts", ["status"])
    op.create_index("ix_fraud_alerts_assigned_to", "fraud_alerts", ["assigned_to"])
    op.create_index("ix_fraud_alerts_reviewed_by", "fraud_alerts", ["reviewed_by"])
    op.create_index("ix_fraud_alerts_created_at", "fraud_alerts", ["created_at"])
    op.create_index("ix_fraud_alerts_updated_at", "fraud_alerts", ["updated_at"])
    op.create_index("ix_fraud_alerts_reviewed_at", "fraud_alerts", ["reviewed_at"])
    op.create_index("ix_fraud_alerts_resolved_at", "fraud_alerts", ["resolved_at"])

    # Create composite indexes
    op.create_index(
        "idx_fraud_alert_case_severity", "fraud_alerts", ["case_id", "severity"]
    )
    op.create_index(
        "idx_fraud_alert_case_created", "fraud_alerts", ["case_id", "created_at"]
    )
    op.create_index(
        "idx_fraud_alert_severity_status", "fraud_alerts", ["severity", "status"]
    )
    op.create_index(
        "idx_fraud_alert_risk_created", "fraud_alerts", ["risk_score", "created_at"]
    )
    op.create_index(
        "idx_fraud_alert_rule_created", "fraud_alerts", ["rule_name", "created_at"]
    )
    op.create_index(
        "idx_fraud_alert_assigned_status", "fraud_alerts", ["assigned_to", "status"]
    )
    op.create_index(
        "idx_fraud_alert_confidence_risk", "fraud_alerts", ["confidence", "risk_score"]
    )


def downgrade() -> None:
    """Drop fraud_alerts table"""

    op.drop_table("fraud_alerts")
