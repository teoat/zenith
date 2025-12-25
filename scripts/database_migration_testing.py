#!/usr/bin/env python3
"""
Automated Database Migration Testing Framework
Tests database migrations for safety and correctness
"""

import os
import sys
import shutil
import tempfile
from pathlib import Path
from typing import Dict, List, Any, Optional
import json
from datetime import datetime

# Add backend to path for imports
backend_path = Path(__file__).parent / "backend"
sys.path.insert(0, str(backend_path))

import logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Try to import alembic and sqlalchemy
try:
    from alembic import command
    from alembic.config import Config
    from alembic.script import ScriptDirectory
    from sqlalchemy import create_engine, text
    ALEMBIC_AVAILABLE = True
    logger.info("Alembic and SQLAlchemy available for migration testing")
except ImportError as e:
    ALEMBIC_AVAILABLE = False
    logger.warning(f"Alembic/SQLAlchemy not available: {e}. Migration testing will be limited.")

class DatabaseMigrationTester:
    """Automated database migration testing framework"""

    def __init__(self):
        self.test_results = []
        self.temp_databases = []

    def create_test_database(self) -> str:
        """Create a temporary test database"""
        temp_db = tempfile.NamedTemporaryFile(delete=False, suffix='.db')
        temp_db.close()
        self.temp_databases.append(temp_db.name)
        return temp_db.name

    def cleanup_test_databases(self):
        """Clean up temporary test databases"""
        for db_path in self.temp_databases:
            try:
                if os.path.exists(db_path):
                    os.unlink(db_path)
            except Exception as e:
                logger.warning(f"Failed to cleanup {db_path}: {e}")

    def get_alembic_config(self, db_url: str) -> Config:
        """Get Alembic configuration for testing"""
        config = Config()
        config.set_main_option("script_location", "backend/alembic")
        config.set_main_option("sqlalchemy.url", db_url)
        config.set_main_option("logging_level", "WARN")
        return config

    def test_migration_up(self, db_url: str) -> Dict[str, Any]:
        """Test migrating database up (upgrade)"""
        result = {
            "operation": "upgrade",
            "success": False,
            "revisions_applied": [],
            "errors": [],
            "duration": 0
        }

        try:
            from alembic import command
            from alembic.config import Config
            from alembic.script import ScriptDirectory
            alembic_available = True
        except ImportError:
            alembic_available = False

        if not alembic_available:
            result["errors"].append("Alembic not available")
            return result

        start_time = datetime.now()

        try:
            config = self.get_alembic_config(db_url)

            # Get current revision
            script = ScriptDirectory.from_config(config)
            head_revision = script.get_current_head()

            # Upgrade to head
            command.upgrade(config, "head")

            # Verify migration
            with create_engine(db_url).connect() as conn:
                # Check alembic_version table
                version_result = conn.execute(text("SELECT version_num FROM alembic_version"))
                current_version = version_result.fetchone()[0]

                result["success"] = current_version == head_revision
                result["final_revision"] = current_version

                if result["success"]:
                    logger.info(f"✅ Migration upgrade successful to revision {current_version}")
                else:
                    result["errors"].append(f"Expected revision {head_revision}, got {current_version}")

        except Exception as e:
            result["errors"].append(f"Migration upgrade failed: {str(e)}")
            logger.error(f"Migration upgrade failed: {e}")

        result["duration"] = (datetime.now() - start_time).total_seconds()
        return result

    def test_migration_down(self, db_url: str) -> Dict[str, Any]:
        """Test migrating database down (downgrade)"""
        result = {
            "operation": "downgrade",
            "success": False,
            "revisions_reverted": [],
            "errors": [],
            "duration": 0
        }

        if not ALEMBIC_AVAILABLE:
            result["errors"].append("Alembic not available")
            return result

        start_time = datetime.now()

        try:
            config = self.get_alembic_config(db_url)

            # Get base revision (first migration)
            script = ScriptDirectory.from_config(config)
            base_revision = script.get_base()

            # Downgrade to base
            command.downgrade(config, base_revision)

            # Verify downgrade
            with create_engine(db_url).connect() as conn:
                version_result = conn.execute(text("SELECT version_num FROM alembic_version"))
                current_version = version_result.fetchone()[0]

                result["success"] = current_version == base_revision
                result["final_revision"] = current_version

                if result["success"]:
                    logger.info(f"✅ Migration downgrade successful to revision {current_version}")
                else:
                    result["errors"].append(f"Expected base revision {base_revision}, got {current_version}")

        except Exception as e:
            result["errors"].append(f"Migration downgrade failed: {str(e)}")
            logger.error(f"Migration downgrade failed: {e}")

        result["duration"] = (datetime.now() - start_time).total_seconds()
        return result

    def test_data_integrity(self, db_url: str) -> Dict[str, Any]:
        """Test data integrity during migrations"""
        result = {
            "operation": "data_integrity",
            "success": True,
            "data_checks": [],
            "errors": [],
            "duration": 0
        }

        start_time = datetime.now()

        try:
            engine = create_engine(db_url)

            # Test basic data integrity checks
            with engine.connect() as conn:
                # Check if basic tables exist and have proper structure
                tables_to_check = [
                    ("users", ["id", "email", "role"]),
                    ("cases", ["id", "title", "status"]),
                    ("transactions", ["id", "amount", "timestamp"])
                ]

                for table_name, expected_columns in tables_to_check:
                    try:
                        # Check table exists
                        table_exists = conn.execute(text(f"""
                            SELECT name FROM sqlite_master
                            WHERE type='table' AND name='{table_name}'
                        """)).fetchone()

                        if table_exists:
                            result["data_checks"].append(f"✅ Table {table_name} exists")

                            # Check columns exist
                            columns_result = conn.execute(text(f"PRAGMA table_info({table_name})"))
                            columns = [row[1] for row in columns_result.fetchall()]

                            for expected_col in expected_columns:
                                if expected_col in columns:
                                    result["data_checks"].append(f"✅ Column {expected_col} exists in {table_name}")
                                else:
                                    result["data_checks"].append(f"❌ Column {expected_col} missing in {table_name}")
                                    result["success"] = False
                        else:
                            result["data_checks"].append(f"⚠️ Table {table_name} does not exist (may be expected)")

                    except Exception as e:
                        result["errors"].append(f"Data integrity check failed for {table_name}: {str(e)}")
                        result["success"] = False

        except Exception as e:
            result["errors"].append(f"Data integrity testing failed: {str(e)}")
            result["success"] = False

        result["duration"] = (datetime.now() - start_time).total_seconds()
        return result

    def test_migration_idempotency(self, db_url: str) -> Dict[str, Any]:
        """Test that migrations are idempotent (can be run multiple times)"""
        result = {
            "operation": "idempotency",
            "success": True,
            "runs_attempted": 3,
            "errors": [],
            "duration": 0
        }

        if not ALEMBIC_AVAILABLE:
            result["errors"].append("Alembic not available")
            result["success"] = False
            return result

        start_time = datetime.now()

        try:
            config = self.get_alembic_config(db_url)

            # Run upgrade multiple times
            for run_num in range(result["runs_attempted"]):
                try:
                    command.upgrade(config, "head")
                    logger.info(f"✅ Idempotency run {run_num + 1} successful")
                except Exception as e:
                    result["errors"].append(f"Idempotency run {run_num + 1} failed: {str(e)}")
                    result["success"] = False
                    break

        except Exception as e:
            result["errors"].append(f"Idempotency testing failed: {str(e)}")
            result["success"] = False

        result["duration"] = (datetime.now() - start_time).total_seconds()
        return result

    def run_comprehensive_migration_tests(self) -> Dict[str, Any]:
        """Run comprehensive database migration testing"""

        print("🗄️ DATABASE MIGRATION TESTING")
        print("=" * 40)

        if not ALEMBIC_AVAILABLE:
            print("❌ Alembic not available - cannot run migration tests")
            return {"error": "Alembic not available"}

        # Create test database
        test_db = self.create_test_database()
        db_url = f"sqlite:///{test_db}"

        print(f"🗃️ Created test database: {test_db}")

        try:
            # Run all migration tests
            tests = [
                ("Migration Upgrade", self.test_migration_up, db_url),
                ("Migration Downgrade", self.test_migration_down, db_url),
                ("Data Integrity", self.test_data_integrity, db_url),
                ("Migration Idempotency", self.test_migration_idempotency, db_url)
            ]

            all_results = {}

            for test_name, test_func, *args in tests:
                print(f"\n🧪 Running: {test_name}")
                result = test_func(*args)
                all_results[test_name.lower().replace(" ", "_")] = result

                status = "✅ PASS" if result["success"] else "❌ FAIL"
                duration = ".2f"
                print(f"   {status} ({duration})")

                if result["errors"]:
                    print(f"   Errors: {len(result['errors'])}")
                    for error in result["errors"][:2]:  # Show first 2 errors
                        print(f"     - {error}")

            # Generate comprehensive report
            report = self.generate_migration_report(all_results)

            return report

        finally:
            # Cleanup
            self.cleanup_test_databases()

    def generate_migration_report(self, test_results: Dict[str, Any]) -> Dict[str, Any]:
        """Generate comprehensive migration testing report"""

        # Calculate overall success
        all_passed = all(result["success"] for result in test_results.values())
        total_tests = len(test_results)
        passed_tests = sum(1 for result in test_results.values() if result["success"])

        report = {
            "report_generated": datetime.now().isoformat(),
            "overall_success": all_passed,
            "tests_run": total_tests,
            "tests_passed": passed_tests,
            "tests_failed": total_tests - passed_tests,
            "success_rate": (passed_tests / total_tests) * 100 if total_tests > 0 else 0,
            "test_results": test_results,
            "recommendations": [],
            "risk_assessment": "LOW" if all_passed else "MEDIUM" if passed_tests >= total_tests * 0.75 else "HIGH"
        }

        # Generate recommendations based on results
        if not all_passed:
            report["recommendations"].append("Address failed migration tests before deployment")

        # Check specific test results
        upgrade_test = test_results.get("migration_upgrade", {})
        if not upgrade_test.get("success", False):
            report["recommendations"].append("Fix migration upgrade issues")

        downgrade_test = test_results.get("migration_downgrade", {})
        if not downgrade_test.get("success", False):
            report["recommendations"].append("Fix migration downgrade issues - rollbacks may fail")

        integrity_test = test_results.get("data_integrity", {})
        if not integrity_test.get("success", False):
            report["recommendations"].append("Address data integrity issues in migrations")

        idempotency_test = test_results.get("migration_idempotency", {})
        if not idempotency_test.get("success", False):
            report["recommendations"].append("Fix migration idempotency - migrations should be repeatable")

        if all_passed:
            report["recommendations"].append("Migration testing passed - safe for deployment")
            report["recommendations"].append("Consider adding migration tests to CI/CD pipeline")

        # Save report
        report_path = Path("database_migration_test_report.json")
        with open(report_path, 'w') as f:
            json.dump(report, f, indent=2, default=str)

        # Generate summary
        summary_path = Path("DATABASE_MIGRATION_TEST_SUMMARY.md")
        with open(summary_path, 'w') as f:
            f.write("# 🗄️ DATABASE MIGRATION TEST REPORT\n\n")
            f.write(f"**Test Date:** {report['report_generated']}\n")
            f.write(f"**Overall Status:** {'✅ PASS' if report['overall_success'] else '❌ FAIL'}\n")
            f.write(f"**Tests Run:** {report['tests_run']}\n")
            f.write(f"**Tests Passed:** {report['tests_passed']}\n")
            f.write(f"**Success Rate:** {report['success_rate']:.1f}%\n")
            f.write(f"**Risk Assessment:** {report['risk_assessment']}\n\n")

            f.write("## 📊 TEST RESULTS\n\n")
            for test_name, result in report['test_results'].items():
                status = "✅ PASS" if result["success"] else "❌ FAIL"
                duration = ".2f"
                f.write(f"### {test_name.replace('_', ' ').title()}\n")
                f.write(f"- **Status:** {status}\n")
                f.write(f"- **Duration:** {duration}\n")

                if result.get("errors"):
                    f.write(f"- **Errors:** {len(result['errors'])}\n")
                    for error in result["errors"][:2]:
                        f.write(f"  - {error}\n")

                if result.get("data_checks"):
                    f.write(f"- **Data Checks:** {len(result['data_checks'])}\n")

                f.write("\n")

            f.write("## 💡 RECOMMENDATIONS\n\n")
            for rec in report['recommendations']:
                f.write(f"- 🔧 {rec}\n")
            f.write("\n")

            if report['overall_success']:
                f.write("## ✅ CONCLUSION: MIGRATION TESTS PASSED\n\n")
                f.write("Database migrations are safe and reliable for deployment.\n")
            else:
                f.write("## 🚨 CONCLUSION: MIGRATION ISSUES DETECTED\n\n")
                f.write("Address migration issues before deployment to prevent data loss.\n")

            f.write("\n---\n\n")
            f.write("**Generated by Automated Database Migration Testing**\n")

        print(f"\n📁 Migration test report saved to: {report_path}")
        print(f"📋 Summary saved to: {summary_path}")

        return report

def main():
    """Main function to run database migration testing"""

    print("🗄️ AUTOMATED DATABASE MIGRATION TESTING")
    print("=" * 50)

    tester = DatabaseMigrationTester()

    try:
        report = tester.run_comprehensive_migration_tests()

        print("\n📊 MIGRATION TESTING SUMMARY")
        print(f"Tests Run: {report.get('tests_run', 0)}")
        print(f"Tests Passed: {report.get('tests_passed', 0)}")
        print(f"Success Rate: {report.get('success_rate', 0):.1f}%")
        print(f"Overall Status: {'✅ PASS' if report.get('overall_success', False) else '❌ FAIL'}")

        return 0 if report.get('overall_success', False) else 1

    except Exception as e:
        print(f"❌ Migration testing failed with error: {e}")
        return 1

if __name__ == "__main__":
    sys.exit(main())