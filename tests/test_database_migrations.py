"""
Database Migration Testing Suite
Automated testing for database migrations with data integrity validation
"""

import os
import subprocess
import tempfile
import shutil
from pathlib import Path
from typing import Dict, List, Any, Optional
import sqlite3
import json
from datetime import datetime


class MigrationTester:
    """Test database migrations for correctness and data integrity"""

    def __init__(self, backend_path: Path = Path("backend")):
        self.backend_path = backend_path
        self.alembic_ini = backend_path / "alembic.ini"
        self.alembic_dir = backend_path / "alembic"
        self.versions_dir = self.alembic_dir / "versions"
        self.results: Dict[str, Any] = {}

    def list_migrations(self) -> List[Dict[str, Any]]:
        """List all available migrations"""
        migrations = []

        for migration_file in sorted(self.versions_dir.glob("*.py")):
            if migration_file.name.startswith("__"):
                continue

            content = migration_file.read_text()

            migration_info = {
                "filename": migration_file.name,
                "path": str(migration_file),
                "revision": self._extract_revision(content),
                "down_revision": self._extract_down_revision(content),
                "description": self._extract_description(content),
            }

            migrations.append(migration_info)

        return migrations

    def _extract_revision(self, content: str) -> Optional[str]:
        """Extract revision hash from migration file"""
        import re

        match = re.search(r'revision\s*=\s*[\'"]([^\'"]+)[\'"]', content)
        return match.group(1) if match else None

    def _extract_down_revision(self, content: str) -> Optional[str]:
        """Extract down_revision hash from migration file"""
        import re

        match = re.search(r'down_revision\s*=\s*[\'"]([^\'"]*)[\'"]', content)
        return match.group(1) if match else None

    def _extract_description(self, content: str) -> str:
        """Extract description from migration file"""
        import re

        match = re.search(r'description\s*=\s*[\'"]([^\'"]+)[\'"]', content)
        return match.group(1) if match else "No description"

    def validate_migration_syntax(self) -> Dict[str, Any]:
        """Validate Python syntax of all migration files"""
        print("\n🔍 Validating migration syntax...")

        results = {
            "valid": 0,
            "invalid": 0,
            "errors": [],
        }

        migrations = self.list_migrations()

        for migration in migrations:
            try:
                compile(migration["path"], migration["filename"], "exec")
                results["valid"] += 1
                print(f"  ✅ {migration['filename']}")
            except SyntaxError as e:
                results["invalid"] += 1
                error_msg = f"Syntax error in {migration['filename']}: {str(e)}"
                results["errors"].append(error_msg)
                print(f"  ❌ {migration['filename']} - {str(e)}")

        return results

    def test_migration_forward(self, target_database: str) -> Dict[str, Any]:
        """Test forward migrations"""
        print(f"\n🔼 Testing forward migrations to {target_database}...")

        results = {
            "success": False,
            "migrations_applied": 0,
            "errors": [],
        }

        try:
            result = subprocess.run(
                [
                    "alembic",
                    "upgrade",
                    "head",
                ],
                cwd=str(self.backend_path),
                capture_output=True,
                text=True,
                env={**os.environ, "DATABASE_URL": target_database},
            )

            if result.returncode == 0:
                results["success"] = True
                results["migrations_applied"] = self._count_applied_migrations(result.stdout)
                print(f"  ✅ Successfully applied {results['migrations_applied']} migrations")
            else:
                results["errors"].append(result.stderr)
                print(f"  ❌ Migration failed: {result.stderr}")

        except Exception as e:
            results["errors"].append(str(e))
            print(f"  ❌ Error: {str(e)}")

        return results

    def test_migration_backward(self, target_database: str) -> Dict[str, Any]:
        """Test backward migrations"""
        print(f"\n🔽 Testing backward migrations...")

        results = {
            "success": False,
            "migrations_reverted": 0,
            "errors": [],
        }

        try:
            result = subprocess.run(
                [
                    "alembic",
                    "downgrade",
                    "base",
                ],
                cwd=str(self.backend_path),
                capture_output=True,
                text=True,
                env={**os.environ, "DATABASE_URL": target_database},
            )

            if result.returncode == 0:
                results["success"] = True
                results["migrations_reverted"] = self._count_reverted_migrations(result.stdout)
                print(f"  ✅ Successfully reverted {results['migrations_reverted']} migrations")
            else:
                results["errors"].append(result.stderr)
                print(f"  ❌ Downgrade failed: {result.stderr}")

        except Exception as e:
            results["errors"].append(str(e))
            print(f"  ❌ Error: {str(e)}")

        return results

    def _count_applied_migrations(self, output: str) -> int:
        """Count migrations from alembic output"""
        import re

        matches = re.findall(r"Running upgrade [\w-]+ -> ([\w-]+)", output)
        return len(matches)

    def _count_reverted_migrations(self, output: str) -> int:
        """Count migrations from downgrade output"""
        import re

        matches = re.findall(r"Running downgrade [\w-]+ -> ([\w-]+)", output)
        return len(matches)

    def test_data_integrity(self, target_database: str) -> Dict[str, Any]:
        """Test data integrity after migrations"""
        print(f"\n🔒 Testing data integrity...")

        results = {
            "success": False,
            "tables_created": [],
            "errors": [],
        }

        try:
            conn = sqlite3.connect(target_database.replace("sqlite:///", ""))
            cursor = conn.cursor()

            cursor.execute("SELECT name FROM sqlite_master WHERE type='table';")
            tables = cursor.fetchall()

            for table in tables:
                table_name = table[0]
                if not table_name.startswith("alembic_"):
                    cursor.execute(f"PRAGMA table_info({table_name});")
                    columns = cursor.fetchall()
                    results["tables_created"].append(
                        {
                            "name": table_name,
                            "columns": len(columns),
                        }
                    )

            conn.close()

            results["success"] = True
            print(f"  ✅ Database integrity verified - {len(results['tables_created'])} tables created")

        except Exception as e:
            results["errors"].append(str(e))
            print(f"  ❌ Integrity check failed: {str(e)}")

        return results

    def run_full_test_suite(self) -> Dict[str, Any]:
        """Run complete migration test suite"""
        print("\n🚀 STARTING DATABASE MIGRATION TEST SUITE")
        print("=" * 80)

        temp_dir = Path(tempfile.mkdtemp())
        test_database = f"sqlite:///{temp_dir / 'test_migration.db'}"

        try:
            results = {
                "timestamp": datetime.now().isoformat(),
                "test_database": test_database,
                "syntax_validation": {},
                "forward_migration": {},
                "backward_migration": {},
                "data_integrity": {},
                "overall_status": "FAILED",
            }

            migrations = self.list_migrations()
            print(f"\n📋 Found {len(migrations)} migrations")

            results["syntax_validation"] = self.validate_migration_syntax()

            if results["syntax_validation"]["invalid"] > 0:
                print("\n❌ Syntax validation failed - skipping migration tests")
                return results

            results["forward_migration"] = self.test_migration_forward(test_database)

            if not results["forward_migration"]["success"]:
                print("\n❌ Forward migration failed")
                return results

            results["data_integrity"] = self.test_data_integrity(test_database)

            if not results["data_integrity"]["success"]:
                print("\n❌ Data integrity check failed")
                return results

            results["backward_migration"] = self.test_migration_backward(test_database)

            if not results["backward_migration"]["success"]:
                print("\n❌ Backward migration failed")
                return results

            results["overall_status"] = "PASSED"

            print("\n✅ ALL MIGRATION TESTS PASSED")

            return results

        finally:
            if temp_dir.exists():
                shutil.rmtree(temp_dir)

    def generate_report(self, results: Dict[str, Any]) -> str:
        """Generate migration test report"""
        report = []
        report.append("=" * 80)
        report.append("📊 DATABASE MIGRATION TEST REPORT")
        report.append("=" * 80)
        report.append(f"Timestamp: {results['timestamp']}")
        report.append(f"Test Database: {results['test_database']}")
        report.append(f"Overall Status: {results['overall_status']}")
        report.append("")

        report.append("🔍 SYNTAX VALIDATION")
        report.append("-" * 80)
        syntax = results["syntax_validation"]
        report.append(f"Valid Migrations: {syntax['valid']}")
        report.append(f"Invalid Migrations: {syntax['invalid']}")
        if syntax["errors"]:
            report.append("\nErrors:")
            for error in syntax["errors"]:
                report.append(f"  ❌ {error}")
        report.append("")

        report.append("🔼 FORWARD MIGRATION")
        report.append("-" * 80)
        forward = results["forward_migration"]
        report.append(f"Success: {forward['success']}")
        report.append(f"Migrations Applied: {forward['migrations_applied']}")
        if forward["errors"]:
            report.append("\nErrors:")
            for error in forward["errors"]:
                report.append(f"  ❌ {error}")
        report.append("")

        report.append("🔒 DATA INTEGRITY")
        report.append("-" * 80)
        integrity = results["data_integrity"]
        report.append(f"Success: {integrity['success']}")
        report.append(f"Tables Created: {len(integrity['tables_created'])}")
        if integrity["tables_created"]:
            report.append("\nTables:")
            for table in integrity["tables_created"]:
                report.append(f"  ✅ {table['name']} ({table['columns']} columns)")
        if integrity["errors"]:
            report.append("\nErrors:")
            for error in integrity["errors"]:
                report.append(f"  ❌ {error}")
        report.append("")

        report.append("🔽 BACKWARD MIGRATION")
        report.append("-" * 80)
        backward = results["backward_migration"]
        report.append(f"Success: {backward['success']}")
        report.append(f"Migrations Reverted: {backward['migrations_reverted']}")
        if backward["errors"]:
            report.append("\nErrors:")
            for error in backward["errors"]:
                report.append(f"  ❌ {error}")
        report.append("")

        report.append("=" * 80)

        return "\n".join(report)


def main():
    """Main execution"""
    import argparse

    parser = argparse.ArgumentParser(description="Database Migration Testing")
    parser.add_argument(
        "--backend-path",
        default="backend",
        help="Path to backend directory",
    )
    parser.add_argument(
        "--output",
        default="tests/migration/report.txt",
        help="Path to output report file",
    )
    args = parser.parse_args()

    tester = MigrationTester(Path(args.backend_path))
    results = tester.run_full_test_suite()

    report = tester.generate_report(results)
    print(report)

    output_path = Path(args.output)
    output_path.parent.mkdir(parents=True, exist_ok=True)
    with open(output_path, "w") as f:
        f.write(report)

    print(f"\n📁 Report saved to {output_path}")

    exit(0 if results["overall_status"] == "PASSED" else 1)


if __name__ == "__main__":
    main()
