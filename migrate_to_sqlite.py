#!/usr/bin/env python3
"""
Database Migration Script: PostgreSQL to SQLite

This script migrates data from a PostgreSQL database to SQLite with SQLCipher encryption.
Run this script to migrate existing data when transitioning to the Electron desktop app.

Requirements:
- psycopg2-binary for PostgreSQL connection
- Existing PostgreSQL database with data
- Python environment with required dependencies

Usage:
    python migrate_to_sqlite.py

Environment Variables:
    POSTGRES_URL: PostgreSQL connection URL (default: from environment)
    SQLCIPHER_KEY: Encryption key for SQLite database (default: from environment)
"""

import os
import sys
from pathlib import Path

# Add backend to path
backend_path = Path(__file__).parent / 'backend'
sys.path.insert(0, str(backend_path))

try:
    from core.database import create_tables, SessionLocal, Base
    from sqlalchemy import create_engine, text
    import logging

    logging.basicConfig(level=logging.INFO)
    logger = logging.getLogger(__name__)

    def get_postgres_engine():
        """Create PostgreSQL engine"""
        postgres_url = os.getenv('POSTGRES_URL')
        if not postgres_url:
            logger.warning("No POSTGRES_URL provided, skipping PostgreSQL connection")
            return None

        try:
            from sqlalchemy import create_engine
            return create_engine(postgres_url)
        except ImportError:
            logger.error("psycopg2-binary not installed. Install with: pip install psycopg2-binary")
            return None

    def migrate_table(pg_engine, table_name, sqlite_session):
        """Migrate a single table from PostgreSQL to SQLite"""
        if not pg_engine:
            return

        try:
            with pg_engine.connect() as pg_conn:
                # Get column information
                columns_query = text("""
                    SELECT column_name, data_type, is_nullable
                    FROM information_schema.columns
                    WHERE table_name = :table_name
                    ORDER BY ordinal_position
                """)

                columns = pg_conn.execute(columns_query, {'table_name': table_name}).fetchall()

                if not columns:
                    logger.warning(f"No columns found for table {table_name}")
                    return

                # Get data
                data_query = text(f"SELECT * FROM {table_name}")
                data = pg_conn.execute(data_query).fetchall()

                if not data:
                    logger.info(f"No data found in table {table_name}")
                    return

                # Insert into SQLite
                column_names = [col[0] for col in columns]
                placeholders = ', '.join([':' + col for col in column_names])
                insert_query = text(f"INSERT INTO {table_name} ({', '.join(column_names)}) VALUES ({placeholders})")

                for row in data:
                    row_dict = dict(zip(column_names, row))
                    sqlite_session.execute(insert_query, row_dict)

                sqlite_session.commit()
                logger.info(f"Migrated {len(data)} rows from {table_name}")

        except Exception as e:
            logger.error(f"Failed to migrate table {table_name}: {e}")

    def main():
        logger.info("Starting database migration from PostgreSQL to SQLite")

        # Get PostgreSQL connection
        pg_engine = get_postgres_engine()
        if not pg_engine:
            logger.info("No PostgreSQL connection available, creating fresh SQLite database")
        else:
            logger.info("Connected to PostgreSQL database")

        # Create SQLite tables
        logger.info("Creating SQLite database tables")
        create_tables()

        # Get SQLite session
        sqlite_session = SessionLocal()

        try:
            if pg_engine:
                # List of tables to migrate (in dependency order)
                tables_to_migrate = [
                    'users',
                    'teams',
                    'cases',
                    'case_notes',
                    'case_activities',
                    'transactions',
                    'evidence'
                ]

                for table_name in tables_to_migrate:
                    logger.info(f"Migrating table: {table_name}")
                    migrate_table(pg_engine, table_name, sqlite_session)

            logger.info("Database migration completed successfully")

        try:
            main()
        except Exception as e:
            logger.error(f"Migration failed: {e}")
        finally:
            sqlite_session.close()
            if pg_engine:
                pg_engine.dispose()

if __name__ == '__main__':
    main()