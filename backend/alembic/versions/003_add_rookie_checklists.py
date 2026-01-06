"""add rookie_checklists table

Revision ID: 003_add_rookie_checklists
Revises: 002_add_fraud_alerts
Create Date: 2025-12-11

"""

import sqlalchemy as sa
from alembic import op

# revision identifiers, used by Alembic.
revision = "003_add_rookie_checklists"
down_revision = "002_add_fraud_alerts"
branch_labels = None
depends_on = None


def upgrade() -> None:
    """Create rookie_checklists table"""
    op.create_table(
        "rookie_checklists",
        sa.Column("id", sa.String, nullable=False),
        sa.Column("user_email", sa.String, nullable=True),
        sa.Column("user_id", sa.String, nullable=True),
        sa.Column("items", sa.JSON, nullable=True),
        sa.Column("extra_metadata", sa.JSON, nullable=True),
        sa.Column("created_at", sa.DateTime, nullable=True),
        sa.PrimaryKeyConstraint("id"),
    )

    # Indexes
    op.create_index("idx_rookie_user_email", "rookie_checklists", ["user_email"])
    op.create_index("idx_rookie_created", "rookie_checklists", ["created_at"])


def downgrade() -> None:
    """Drop rookie_checklists table"""
    op.drop_table("rookie_checklists")
