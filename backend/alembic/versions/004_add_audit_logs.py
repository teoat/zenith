"""add audit_logs table

Revision ID: 004_add_audit_logs
Revises: 003_add_rookie_checklists
Create Date: 2025-12-11

"""

import sqlalchemy as sa
from alembic import op

# revision identifiers, used by Alembic.
revision = "004_add_audit_logs"
down_revision = "003_add_rookie_checklists"
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.create_table(
        "audit_logs",
        sa.Column("id", sa.String, nullable=False),
        sa.Column("action", sa.String, nullable=True),
        sa.Column("user_id", sa.String, nullable=True),
        sa.Column("timestamp", sa.DateTime, nullable=True),
        sa.Column("signature", sa.String, nullable=True),
        sa.Column("data", sa.JSON, nullable=True),
        sa.PrimaryKeyConstraint("id"),
    )

    op.create_index("idx_audit_action", "audit_logs", ["action"])
    op.create_index("idx_audit_user", "audit_logs", ["user_id"])


def downgrade() -> None:
    op.drop_table("audit_logs")
