# Alembic Migration Environment Configuration
# This file is used by Alembic to configure the migration environment

import os
import sys
from logging.config import fileConfig

from sqlalchemy import engine_from_config, pool

from alembic import context

# Add parent directory to path for imports
sys.path.insert(0, os.path.dirname(os.path.dirname(__file__)))

# Import your models' Base
from core.database import Base, get_database_url

# This is the Alembic Config object
config = context.config

# Interpret the config file for Python logging
if config.config_file_name is not None:
    fileConfig(config.config_file_name)

# Set target metadata for autogenerate
target_metadata = Base.metadata

# Schema versioning support
SCHEMA_VERSION = "1.0.0"  # Update this when making breaking changes


def get_version_table_name():
    """Get the name of the version table"""
    return "alembic_version"


def run_migrations_offline() -> None:
    """
    Run migrations in 'offline' mode.

    This configures the context with just a URL and not an Engine.
    Calls to context.execute() emit the SQL to a script file.
    """
    url = get_database_url()
    context.configure(
        url=url,
        target_metadata=target_metadata,
        literal_binds=True,
        dialect_opts={"paramstyle": "named"},
        version_table=get_version_table_name(),
        # Schema versioning tag
        process_revision_directives=process_revision_directives,
    )

    with context.begin_transaction():
        context.run_migrations()


def run_migrations_online() -> None:
    """
    Run migrations in 'online' mode.

    An Engine is created and associated with a connection.
    The connection is used for migrations.
    """
    # Override sqlalchemy.url with our database URL
    configuration = config.get_section(config.config_ini_section)
    configuration["sqlalchemy.url"] = get_database_url()

    connectable = engine_from_config(
        configuration,
        prefix="sqlalchemy.",
        poolclass=pool.NullPool,
    )

    with connectable.connect() as connection:
        context.configure(
            connection=connection,
            target_metadata=target_metadata,
            version_table=get_version_table_name(),
            process_revision_directives=process_revision_directives,
        )

        with context.begin_transaction():
            context.run_migrations()


def process_revision_directives(context, revision, directives):
    """
    Process revision directives to add version tagging.

    This function is called during migration generation to add
    custom metadata to migration files.
    """
    if directives:
        script = directives[0]

        # Add schema version to migration
        if script.upgrade_ops:
            # Add comment with schema version
            script.upgrade_ops.ops.insert(
                0,
                # This would add a comment in the generated migration
                # For now, we'll log it
                None,
            )

        # Log migration details
        print(f"[Alembic] Generating migration for schema v{SCHEMA_VERSION}")
        print(f"[Alembic] Revision: {revision}")


def stamp_version(revision: str = "head"):
    """
    Stamp the database with a specific revision without running migrations.

    Usage:
        from alembic import env
        env.stamp_version("head")
    """
    from alembic import command

    command.stamp(config, revision)


def check_current_version():
    """
    Check the current database version.

    Returns:
        str: Current revision ID or None if not stamped
    """
    from alembic.runtime.migration import MigrationContext

    # Get current revision from database
    configuration = config.get_section(config.config_ini_section)
    configuration["sqlalchemy.url"] = get_database_url()

    connectable = engine_from_config(
        configuration,
        prefix="sqlalchemy.",
        poolclass=pool.NullPool,
    )

    with connectable.connect() as connection:
        migration_context = MigrationContext.configure(connection)
        current_rev = migration_context.get_current_revision()
        return current_rev


def rollback_to_version(revision: str):
    """
    Rollback database to a specific version.

    Usage:
        from alembic import env
        env.rollback_to_version("abc123")
    """
    from alembic import command

    command.downgrade(config, revision)


# Main execution
if context.is_offline_mode():
    run_migrations_offline()
else:
    run_migrations_online()
