"""rename metadata to activity_metadata

Revision ID: 001_metadata_rename
Revises:
Create Date: 2025-12-08

"""

import sqlalchemy as sa

from alembic import op

# revision identifiers, used by Alembic.
revision = "001_metadata_rename"
down_revision = None
branch_labels = None
depends_on = None


def upgrade() -> None:
    """Rename metadata column to activity_metadata in case_activities table"""

    # SQLite doesn't support column rename directly, need to recreate table
    # Check if old column exists first
    conn = op.get_bind()
    inspector = sa.inspect(conn)
    columns = [col["name"] for col in inspector.get_columns("case_activities")]

    # Only rename if old 'metadata' column exists
    if "metadata" in columns and "activity_metadata" not in columns:
        # Create temporary table with new schema
        op.execute(
            """
            CREATE TABLE case_activities_new (
                id VARCHAR PRIMARY KEY,
                case_id VARCHAR,
                user_id VARCHAR,
                user_name VARCHAR,
                activity_type VARCHAR,
                description VARCHAR,
                old_value VARCHAR,
                new_value VARCHAR,
                activity_metadata JSON,
                timestamp DATETIME,
                FOREIGN KEY (case_id) REFERENCES cases (id)
            )
        """
        )

        # Copy data from old table to new table
        op.execute(
            """
            INSERT INTO case_activities_new
            (id, case_id, user_id, user_name, activity_type, description,
             old_value, new_value, activity_metadata, timestamp)
            SELECT
                id, case_id, user_id, user_name, activity_type, description,
                old_value, new_value, metadata, timestamp
            FROM case_activities
        """
        )

        # Drop old table
        op.drop_table("case_activities")

        # Rename new table to original name
        op.rename_table("case_activities_new", "case_activities")

        # Recreate indexes
        op.create_index(
            "idx_case_activity_case_timestamp",
            "case_activities",
            ["case_id", "timestamp"],
        )
        op.create_index(
            "idx_case_activity_type_timestamp",
            "case_activities",
            ["activity_type", "timestamp"],
        )
        op.create_index(
            "idx_case_activity_user_timestamp",
            "case_activities",
            ["user_id", "timestamp"],
        )
        op.create_index("ix_case_activities_case_id", "case_activities", ["case_id"])
        op.create_index("ix_case_activities_user_id", "case_activities", ["user_id"])
        op.create_index(
            "ix_case_activities_activity_type", "case_activities", ["activity_type"]
        )
        op.create_index(
            "ix_case_activities_timestamp", "case_activities", ["timestamp"]
        )


def downgrade() -> None:
    """Revert activity_metadata back to metadata"""

    # Check if new column exists
    conn = op.get_bind()
    inspector = sa.inspect(conn)
    columns = [col["name"] for col in inspector.get_columns("case_activities")]

    if "activity_metadata" in columns and "metadata" not in columns:
        # Create temporary table with old schema
        op.execute(
            """
            CREATE TABLE case_activities_old (
                id VARCHAR PRIMARY KEY,
                case_id VARCHAR,
                user_id VARCHAR,
                user_name VARCHAR,
                activity_type VARCHAR,
                description VARCHAR,
                old_value VARCHAR,
                new_value VARCHAR,
                metadata JSON,
                timestamp DATETIME,
                FOREIGN KEY (case_id) REFERENCES cases (id)
            )
        """
        )

        # Copy data back
        op.execute(
            """
            INSERT INTO case_activities_old
            (id, case_id, user_id, user_name, activity_type, description,
             old_value, new_value, metadata, timestamp)
            SELECT
                id, case_id, user_id, user_name, activity_type, description,
                old_value, new_value, activity_metadata, timestamp
            FROM case_activities
        """
        )

        # Drop new table
        op.drop_table("case_activities")

        # Rename back
        op.rename_table("case_activities_old", "case_activities")

        # Recreate indexes
        op.create_index(
            "idx_case_activity_case_timestamp",
            "case_activities",
            ["case_id", "timestamp"],
        )
        op.create_index(
            "idx_case_activity_type_timestamp",
            "case_activities",
            ["activity_type", "timestamp"],
        )
        op.create_index(
            "idx_case_activity_user_timestamp",
            "case_activities",
            ["user_id", "timestamp"],
        )
        op.create_index("ix_case_activities_case_id", "case_activities", ["case_id"])
        op.create_index("ix_case_activities_user_id", "case_activities", ["user_id"])
        op.create_index(
            "ix_case_activities_activity_type", "case_activities", ["activity_type"]
        )
        op.create_index(
            "ix_case_activities_timestamp", "case_activities", ["timestamp"]
        )
