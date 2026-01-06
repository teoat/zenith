#!/usr/bin/env python3
"""
PostgreSQL Migration Script for Enterprise Scaling
Handles zero-downtime migration from SQLite to PostgreSQL
"""

import asyncio
import json
import logging
import os
from datetime import datetime
from pathlib import Path
from typing import Any

import aiosqlite
import asyncpg

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)


class PostgreSQLMigrationManager:
    """Handles zero-downtime PostgreSQL migration from SQLite"""

    def __init__(self):
        self.sqlite_url = self._get_sqlite_url()
        self.postgres_url = os.getenv("POSTGRESQL_URL")
        self.migration_table = "migration_status"
        self.batch_size = 1000  # Records per batch for smooth migration

    def _get_sqlite_url(self) -> str:
        """Get SQLite database path"""
        app_data_dir = Path.home() / ".Zenith"
        app_data_dir.mkdir(parents=True, exist_ok=True)
        return f"sqlite:///{app_data_dir}/fraud_detection.db"

    async def initialize_postgres_schema(self) -> None:
        """Create PostgreSQL schema with all tables and indexes"""
        logger.info("Creating PostgreSQL schema...")

        schema_sql = """
        -- Create all tables with PostgreSQL optimizations
        CREATE TABLE IF NOT EXISTS users (
            id VARCHAR PRIMARY KEY,
            username VARCHAR UNIQUE NOT NULL,
            email VARCHAR UNIQUE NOT NULL,
            full_name VARCHAR NOT NULL,
            password_hash VARCHAR NOT NULL,
            role VARCHAR DEFAULT 'investigator',
            is_active BOOLEAN DEFAULT true,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            last_login TIMESTAMP,
            mfa_enabled BOOLEAN DEFAULT false,
            mfa_secret VARCHAR
        );

        CREATE TABLE IF NOT EXISTS teams (
            id VARCHAR PRIMARY KEY,
            name VARCHAR NOT NULL,
            description TEXT,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        );

        CREATE TABLE IF NOT EXISTS projects (
            id VARCHAR PRIMARY KEY,
            name VARCHAR NOT NULL,
            description TEXT,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            created_by VARCHAR REFERENCES users(id)
        );

        CREATE TABLE IF NOT EXISTS cases (
            id VARCHAR PRIMARY KEY,
            project_id VARCHAR REFERENCES projects(id),
            title VARCHAR NOT NULL,
            description TEXT,
            status VARCHAR DEFAULT 'OPEN',
            priority VARCHAR DEFAULT 'MEDIUM',
            case_type VARCHAR DEFAULT 'FRAUD_SUSPECTED',
            assignee_id VARCHAR REFERENCES users(id),
            team_id VARCHAR REFERENCES teams(id),
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            closed_at TIMESTAMP,
            risk_score FLOAT DEFAULT 0.0,
            tags JSONB DEFAULT '[]'::jsonb,
            case_metadata JSONB DEFAULT '{}'::jsonb,
            is_synced BOOLEAN DEFAULT false,
            fraud_amount FLOAT DEFAULT 0.0,
            customer_name VARCHAR DEFAULT 'Unknown',
            risk_level VARCHAR DEFAULT 'low',
            due_date TIMESTAMP,
            created_by VARCHAR REFERENCES users(id)
        );

        CREATE TABLE IF NOT EXISTS transactions (
            id VARCHAR PRIMARY KEY,
            case_id VARCHAR REFERENCES cases(id),
            source_id VARCHAR,
            date DATE,
            amount FLOAT,
            currency VARCHAR DEFAULT 'USD',
            description TEXT,
            merchant_name VARCHAR,
            category VARCHAR,
            transaction_type VARCHAR,
            transaction_metadata JSONB DEFAULT '{}'::jsonb,
            confidence_score FLOAT DEFAULT 1.0,
            is_reconciled BOOLEAN DEFAULT false,
            reconciled_id VARCHAR,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        );

        CREATE TABLE IF NOT EXISTS evidence (
            id VARCHAR PRIMARY KEY,
            case_id VARCHAR REFERENCES cases(id),
            filename VARCHAR,
            file_path TEXT,
            file_type VARCHAR,
            file_category VARCHAR,
            size_bytes INTEGER,
            uploaded_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            uploaded_by VARCHAR,
            processing_status VARCHAR DEFAULT 'pending',
            processed_at TIMESTAMP,
            hash VARCHAR,
            ocr_text TEXT,
            extracted_text TEXT,
            sentiment_score FLOAT,
            fraud_amount FLOAT DEFAULT 0.0,
            customer_name VARCHAR DEFAULT 'Unknown',
            quality_score FLOAT DEFAULT 0.0,
            relevance_score FLOAT DEFAULT 0.0,
            is_admissible BOOLEAN DEFAULT true,
            evidence_metadata JSONB DEFAULT '{}'::jsonb,
            evidence_tags JSONB DEFAULT '[]'::jsonb
        );

        CREATE TABLE IF NOT EXISTS case_notes (
            id VARCHAR PRIMARY KEY,
            case_id VARCHAR REFERENCES cases(id),
            user_id VARCHAR REFERENCES users(id),
            content TEXT NOT NULL,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            is_internal BOOLEAN DEFAULT false
        );

        CREATE TABLE IF NOT EXISTS case_activities (
            id VARCHAR PRIMARY KEY,
            case_id VARCHAR REFERENCES cases(id),
            user_id VARCHAR REFERENCES users(id),
            activity_type VARCHAR NOT NULL,
            description VARCHAR NOT NULL,
            activity_metadata JSONB DEFAULT '{}'::jsonb,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        );

        CREATE TABLE IF NOT EXISTS fraud_alerts (
            id VARCHAR PRIMARY KEY,
            case_id VARCHAR REFERENCES cases(id),
            alert_type VARCHAR NOT NULL,
            severity VARCHAR DEFAULT 'medium',
            title VARCHAR NOT NULL,
            description TEXT,
            alert_metadata JSONB DEFAULT '{}'::jsonb,
            is_acknowledged BOOLEAN DEFAULT false,
            acknowledged_by VARCHAR REFERENCES users(id),
            acknowledged_at TIMESTAMP,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        );

        -- Create indexes for performance
        CREATE INDEX IF NOT EXISTS idx_cases_status ON cases(status);
        CREATE INDEX IF NOT EXISTS idx_cases_assignee ON cases(assignee_id);
        CREATE INDEX IF NOT EXISTS idx_cases_created ON cases(created_at);
        CREATE INDEX IF NOT EXISTS idx_cases_risk ON cases(risk_score);
        CREATE INDEX IF NOT EXISTS idx_transactions_case ON transactions(case_id);
        CREATE INDEX IF NOT EXISTS idx_transactions_date ON transactions(date);
        CREATE INDEX IF NOT EXISTS idx_evidence_case ON evidence(case_id);
        CREATE INDEX IF NOT EXISTS idx_evidence_uploaded ON evidence(uploaded_at);

        -- Create migration tracking table
        CREATE TABLE IF NOT EXISTS migration_status (
            id SERIAL PRIMARY KEY,
            table_name VARCHAR NOT NULL,
            last_id VARCHAR,
            records_migrated INTEGER DEFAULT 0,
            status VARCHAR DEFAULT 'pending',
            started_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            completed_at TIMESTAMP,
            error_message TEXT
        );
        """

        async with asyncpg.create_pool(self.postgres_url) as pool:
            async with pool.acquire() as conn:
                await conn.execute(schema_sql)
                logger.info("PostgreSQL schema created successfully")

    async def migrate_table_data(
        self, table_name: str, sqlite_conn, postgres_conn
    ) -> dict[str, Any]:
        """Migrate data from SQLite table to PostgreSQL with progress tracking"""
        logger.info(f"Starting migration for table: {table_name}")

        # Get migration status
        migration_status = await postgres_conn.fetchrow(
            "SELECT * FROM migration_status WHERE table_name = $1", table_name
        )

        if not migration_status:
            # Initialize migration status
            await postgres_conn.execute(
                "INSERT INTO migration_status (table_name, status) VALUES ($1, 'in_progress')",
                table_name,
            )
        elif migration_status["status"] == "completed":
            logger.info(f"Table {table_name} already migrated, skipping")
            return {
                "status": "skipped",
                "records": migration_status["records_migrated"],
            }

        # Get column information
        columns = await sqlite_conn.execute_fetchall(f"PRAGMA table_info({table_name})")
        column_names = [
            col[1] for col in columns if col[1] != "id"
        ]  # Exclude id for auto-generation

        # Get data in batches
        offset = migration_status["records_migrated"] if migration_status else 0
        records_migrated = offset

        while True:
            # Get batch of records
            records = await sqlite_conn.execute_fetchall(
                f"SELECT * FROM {table_name} LIMIT ? OFFSET ?",
                (self.batch_size, offset),
            )

            if not records:
                break

            # Transform and insert records
            for record in records:
                try:
                    record_dict = dict(zip([col[1] for col in columns], record))

                    # Handle JSON fields for PostgreSQL
                    for key, value in record_dict.items():
                        if isinstance(value, str) and (value.startswith(("{", "["))):
                            try:
                                record_dict[key] = json.loads(value)
                            except (json.JSONDecodeError, TypeError):
                                pass  # Keep as string if not valid JSON

                    # Insert into PostgreSQL
                    columns_str = ", ".join(record_dict.keys())
                    placeholders = ", ".join(
                        f"${i + 1}" for i in range(len(record_dict))
                    )
                    values = list(record_dict.values())

                    await postgres_conn.execute(
                        f"INSERT INTO {table_name} ({columns_str}) VALUES ({placeholders})",
                        *values,
                    )

                    records_migrated += 1

                except Exception as e:
                    logger.error(f"Failed to migrate record from {table_name}: {e}")
                    continue

            offset += len(records)
            logger.info(f"Migrated {records_migrated} records from {table_name}")

        # Mark migration as completed
        await postgres_conn.execute(
            "UPDATE migration_status SET status = 'completed', completed_at = CURRENT_TIMESTAMP, records_migrated = $1 WHERE table_name = $2",
            records_migrated,
            table_name,
        )

        return {"status": "completed", "records": records_migrated}

    async def perform_data_migration(self) -> dict[str, Any]:
        """Perform complete data migration from SQLite to PostgreSQL"""
        logger.info("Starting data migration from SQLite to PostgreSQL")

        migration_results = {
            "tables_migrated": 0,
            "total_records": 0,
            "errors": [],
            "start_time": datetime.now(),
            "end_time": None,
        }

        # Tables to migrate in order (respecting foreign key constraints)
        tables_to_migrate = [
            "users",
            "teams",
            "projects",
            "cases",
            "transactions",
            "evidence",
            "case_notes",
            "case_activities",
            "fraud_alerts",
        ]

        async with aiosqlite.connect(
            self.sqlite_url.replace("sqlite:///", "")
        ) as sqlite_conn:
            async with asyncpg.create_pool(self.postgres_url) as postgres_pool:
                async with postgres_pool.acquire() as postgres_conn:
                    for table_name in tables_to_migrate:
                        try:
                            result = await self.migrate_table_data(
                                table_name, sqlite_conn, postgres_conn
                            )
                            if result["status"] == "completed":
                                migration_results["tables_migrated"] += 1
                                migration_results["total_records"] += result["records"]
                                logger.info(
                                    f"Successfully migrated {result['records']} records from {table_name}"
                                )
                        except Exception as e:
                            error_msg = f"Failed to migrate {table_name}: {e!s}"
                            logger.error(error_msg)
                            migration_results["errors"].append(error_msg)

        migration_results["end_time"] = datetime.now()
        duration = migration_results["end_time"] - migration_results["start_time"]
        migration_results["duration_seconds"] = duration.total_seconds()

        logger.info(f"Migration completed in {duration.total_seconds():.2f} seconds")
        logger.info(
            f"Migrated {migration_results['total_records']} records across {migration_results['tables_migrated']} tables"
        )

        return migration_results

    async def validate_migration(self) -> dict[str, Any]:
        """Validate data integrity after migration"""
        logger.info("Validating migration data integrity")

        validation_results = {
            "table_counts_match": True,
            "data_integrity_checks": [],
            "validation_errors": [],
        }

        async with aiosqlite.connect(
            self.sqlite_url.replace("sqlite:///", "")
        ) as sqlite_conn:
            async with asyncpg.create_pool(self.postgres_url) as postgres_pool:
                async with postgres_pool.acquire() as postgres_conn:
                    tables_to_check = ["users", "cases", "transactions", "evidence"]

                    for table_name in tables_to_check:
                        try:
                            # Get counts from both databases
                            sqlite_count = await sqlite_conn.execute_fetchall(
                                f"SELECT COUNT(*) FROM {table_name}"
                            )
                            postgres_count = await postgres_conn.fetchval(
                                f"SELECT COUNT(*) FROM {table_name}"
                            )

                            sqlite_count = sqlite_count[0][0] if sqlite_count else 0

                            if sqlite_count != postgres_count:
                                validation_results["table_counts_match"] = False
                                validation_results["validation_errors"].append(
                                    f"Count mismatch for {table_name}: SQLite={sqlite_count}, PostgreSQL={postgres_count}"
                                )

                            validation_results["data_integrity_checks"].append(
                                {
                                    "table": table_name,
                                    "sqlite_count": sqlite_count,
                                    "postgres_count": postgres_count,
                                    "match": sqlite_count == postgres_count,
                                }
                            )

                        except Exception as e:
                            validation_results["validation_errors"].append(
                                f"Validation failed for {table_name}: {e!s}"
                            )

        return validation_results

    async def switch_to_postgres(self) -> None:
        """Switch application to use PostgreSQL (zero-downtime switch)"""
        logger.info("Switching application to PostgreSQL")

        # Update environment configuration
        env_file = Path(".env")
        if env_file.exists():
            content = env_file.read_text()

            # Update DATABASE_URL to PostgreSQL
            if "DATABASE_URL=" in content:
                content = content.replace(
                    "DATABASE_URL=sqlite:///./test_fraud_detection.db",
                    f"DATABASE_URL={self.postgres_url}",
                )
            else:
                content += f"\nDATABASE_URL={self.postgres_url}\n"

            env_file.write_text(content)

        logger.info("Application switched to PostgreSQL successfully")

    async def perform_full_migration(self) -> dict[str, Any]:
        """Execute complete migration workflow"""
        logger.info("Starting full PostgreSQL migration workflow")

        results = {
            "schema_creation": None,
            "data_migration": None,
            "validation": None,
            "switch_over": None,
            "overall_success": False,
        }

        try:
            # Step 1: Create PostgreSQL schema
            await self.initialize_postgres_schema()
            results["schema_creation"] = {"status": "success"}

            # Step 2: Migrate data
            migration_result = await self.perform_data_migration()
            results["data_migration"] = migration_result

            # Step 3: Validate migration
            validation_result = await self.validate_migration()
            results["validation"] = validation_result

            # Step 4: Switch to PostgreSQL (if validation passes)
            if (
                validation_result["table_counts_match"]
                and not validation_result["validation_errors"]
            ):
                await self.switch_to_postgres()
                results["switch_over"] = {"status": "success"}
                results["overall_success"] = True
            else:
                results["switch_over"] = {
                    "status": "skipped",
                    "reason": "validation_failed",
                }
                logger.warning(
                    "Switch to PostgreSQL skipped due to validation failures"
                )

        except Exception as e:
            logger.error(f"Migration failed: {e}")
            results["error"] = str(e)

        return results


async def main():
    """Main migration execution"""
    if not os.getenv("POSTGRESQL_URL"):
        logger.error("POSTGRESQL_URL environment variable is required")
        return

    migrator = PostgreSQLMigrationManager()
    results = await migrator.perform_full_migration()

    # Print results
    print(json.dumps(results, indent=2, default=str))


if __name__ == "__main__":
    asyncio.run(main())
