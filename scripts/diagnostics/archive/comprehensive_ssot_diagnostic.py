#!/usr/bin/env python3
"""
Comprehensive SSOT and Lockfile Diagnostic Suite for Zenith Fraud Detection Platform
Diagnoses all critical files to ensure they are error-free and properly locked
"""

import hashlib
import json
import subprocess
import sys
from datetime import datetime
from pathlib import Path
from typing import Any, Dict, Tuple

# Add project root to path
project_root = Path(__file__).parent.parent.parent
sys.path.insert(0, str(project_root))


class SSOTDiagnosticSuite:
    """Comprehensive diagnostic suite for SSOT and lockfile validation"""

    def __init__(self):
        self.project_root = project_root
        self.diagnostics_dir = self.project_root / "scripts" / "diagnostics"
        self.results = {
            "timestamp": datetime.now().isoformat(),
            "diagnostics_version": "1.0.0",
            "overall_status": "unknown",
            "categories": {},
            "recommendations": [],
            "critical_issues": [],
        }

    def calculate_file_hash(self, file_path: Path) -> str:
        """Calculate SHA256 hash of a file"""
        if not file_path.exists():
            return "file_missing"

        try:
            with open(file_path, "rb") as f:
                return hashlib.sha256(f.read()).hexdigest()
        except Exception as e:
            return f"error: {e!s}"

    def validate_json_file(self, file_path: Path) -> tuple[bool, str]:
        """Validate JSON file syntax and structure"""
        if not file_path.exists():
            return False, "File does not exist"

        try:
            with open(file_path, encoding="utf-8") as f:
                json.load(f)
            return True, "Valid JSON"
        except json.JSONDecodeError as e:
            return False, f"Invalid JSON: {e!s}"
        except Exception as e:
            return False, f"Error reading file: {e!s}"

    def validate_python_file(self, file_path: Path) -> tuple[bool, str]:
        """Validate Python file syntax"""
        if not file_path.exists():
            return False, "File does not exist"

        try:
            with open(file_path, encoding="utf-8") as f:
                compile(f.read(), str(file_path), "exec")
            return True, "Valid Python syntax"
        except SyntaxError as e:
            return False, f"Python syntax error: {e!s}"
        except Exception as e:
            return False, f"Error reading file: {e!s}"

    def validate_typescript_file(self, file_path: Path) -> tuple[bool, str]:
        """Validate TypeScript file (basic checks)"""
        if not file_path.exists():
            return False, "File does not exist"

        try:
            with open(file_path, encoding="utf-8") as f:
                content = f.read()

            # Basic validation - check for obvious syntax issues
            if content.count("{") != content.count("}"):
                return False, "Unmatched braces"

            if content.count("(") != content.count(")"):
                return False, "Unmatched parentheses"

            return True, "Basic TypeScript validation passed"
        except Exception as e:
            return False, f"Error reading file: {e!s}"

    def validate_shell_script(self, file_path: Path) -> tuple[bool, str]:
        """Validate shell script syntax"""
        if not file_path.exists():
            return False, "File does not exist"

        try:
            # Use bash -n for syntax checking
            result = subprocess.run(
                ["bash", "-n", str(file_path)],
                capture_output=True,
                text=True,
                timeout=10,
            )

            if result.returncode == 0:
                return True, "Valid shell script syntax"
            else:
                return False, f"Shell syntax error: {result.stderr.strip()}"
        except subprocess.TimeoutExpired:
            return False, "Script validation timed out"
        except Exception as e:
            return False, f"Error validating script: {e!s}"

    def diagnose_ssot_master(self) -> dict[str, Any]:
        """Diagnose SSOT master file"""
        ssot_file = self.diagnostics_dir / "ssot_master.json"

        result = {
            "file": "ssot_master.json",
            "status": "unknown",
            "issues": [],
            "recommendations": [],
        }

        # Check file existence
        if not ssot_file.exists():
            result["status"] = "critical"
            result["issues"].append("SSOT master file does not exist")
            result["recommendations"].append("Generate SSOT master file")
            return result

        # Validate JSON structure
        is_valid, message = self.validate_json_file(ssot_file)
        if not is_valid:
            result["status"] = "critical"
            result["issues"].append(f"Invalid JSON structure: {message}")
            return result

        # Load and analyze content
        try:
            with open(ssot_file) as f:
                data = json.load(f)

            # Check required fields
            required_fields = ["system.perfection_level", "system.zero_defects"]
            missing_fields = []
            for field in required_fields:
                if field not in data:
                    missing_fields.append(field)

            if missing_fields:
                result["issues"].append(
                    f"Missing required SSOT entries: {missing_fields}"
                )
                result["recommendations"].append("Add missing SSOT entries")

            # Check data integrity
            entries_count = len(data)
            if entries_count < 10:
                result["issues"].append(
                    f"SSOT has only {entries_count} entries, expected > 10"
                )

            # Check for infinite values (as per system design)
            infinite_values = 0
            for entry in data.values():
                if entry.get("value") == "infinite":
                    infinite_values += 1

            if infinite_values < 5:
                result["issues"].append(
                    f"Only {infinite_values} infinite values found, expected > 5"
                )

            if not result["issues"]:
                result["status"] = "healthy"
            else:
                result["status"] = "warning"

        except Exception as e:
            result["status"] = "critical"
            result["issues"].append(f"Error analyzing SSOT content: {e!s}")

        return result

    def diagnose_lockfiles(self) -> dict[str, Any]:
        """Diagnose all lockfiles"""
        lockfiles = {
            "dependencies.lock": "dependencies",
            "environments.lock": "environments",
            "configurations.lock": "configurations",
            "business_logic.lock": "business_logic",
            "security_config.lock": "security_config",
            "api_contracts.lock": "api_contracts",
            "test_fixtures.lock": "test_fixtures",
            "infrastructure.lock": "infrastructure",
        }

        result = {
            "category": "lockfiles",
            "status": "unknown",
            "files": {},
            "summary": {
                "total": len(lockfiles),
                "present": 0,
                "valid": 0,
                "corrupted": 0,
                "missing": 0,
            },
        }

        for lockfile_name, category in lockfiles.items():
            lockfile_path = self.diagnostics_dir / lockfile_name
            file_result = {
                "file": lockfile_name,
                "category": category,
                "status": "unknown",
                "issues": [],
            }

            if not lockfile_path.exists():
                file_result["status"] = "missing"
                result["summary"]["missing"] += 1
            else:
                result["summary"]["present"] += 1

                # Validate JSON structure
                is_valid, message = self.validate_json_file(lockfile_path)
                if is_valid:
                    file_result["status"] = "valid"
                    result["summary"]["valid"] += 1
                else:
                    file_result["status"] = "corrupted"
                    file_result["issues"].append(f"Invalid JSON: {message}")
                    result["summary"]["corrupted"] += 1

            result["files"][lockfile_name] = file_result

        # Overall status
        if result["summary"]["missing"] > 0:
            result["status"] = "critical"
        elif result["summary"]["corrupted"] > 0:
            result["status"] = "warning"
        elif result["summary"]["valid"] == result["summary"]["present"]:
            result["status"] = "healthy"
        else:
            result["status"] = "warning"

        return result

    def diagnose_critical_files(self) -> dict[str, Any]:
        """Diagnose critical system files"""
        critical_files = {
            # Core business logic
            "data/fraud_rules.json": ("json", "fraud_rules"),
            "backend/app/services/fraud_service.py": ("python", "fraud_service"),
            "backend/core/security/rbac.py": ("python", "rbac"),
            # Database and schemas
            "backend/core/database.py": ("python", "database_schema"),
            "backend/app/services/database_service.py": ("python", "database_service"),
            # Authentication & security
            "backend/app/services/auth_service.py": ("python", "auth_service"),
            "backend/core/security/__init__.py": ("python", "security_framework"),
            # API contracts
            "backend/main.py": ("python", "api_gateway"),
            "backend/app/routers/identity.py": ("python", "identity_api"),
            # Frontend core
            "frontend/src/pages/Dashboard.tsx": ("typescript", "dashboard"),
            "frontend/src/utils/api.ts": ("typescript", "api_client"),
            # Configuration
            ".env.production": ("text", "production_env"),
            "Dockerfile": ("dockerfile", "container_spec"),
            # Scripts
            "scripts/setup-production.sh": ("shell", "production_setup"),
            "scripts/validate-production.sh": ("shell", "production_validation"),
        }

        result = {
            "category": "critical_files",
            "status": "unknown",
            "files": {},
            "summary": {
                "total": len(critical_files),
                "present": 0,
                "valid": 0,
                "invalid": 0,
                "missing": 0,
            },
        }

        for file_path_str, (file_type, description) in critical_files.items():
            file_path = self.project_root / file_path_str
            file_result = {
                "file": file_path_str,
                "type": file_type,
                "description": description,
                "status": "unknown",
                "issues": [],
            }

            if not file_path.exists():
                file_result["status"] = "missing"
                result["summary"]["missing"] += 1
            else:
                result["summary"]["present"] += 1

                # Validate based on file type
                if file_type == "json":
                    is_valid, message = self.validate_json_file(file_path)
                elif file_type == "python":
                    is_valid, message = self.validate_python_file(file_path)
                elif file_type == "typescript":
                    is_valid, message = self.validate_typescript_file(file_path)
                elif file_type == "shell":
                    is_valid, message = self.validate_shell_script(file_path)
                else:
                    # For other file types, just check if readable
                    try:
                        with open(file_path) as f:
                            f.read(1024)  # Read first 1KB
                        is_valid, message = True, "File readable"
                    except Exception as e:
                        is_valid, message = False, str(e)

                if is_valid:
                    file_result["status"] = "valid"
                    result["summary"]["valid"] += 1
                else:
                    file_result["status"] = "invalid"
                    file_result["issues"].append(message)
                    result["summary"]["invalid"] += 1

            result["files"][file_path_str] = file_result

        # Overall status
        if result["summary"]["missing"] > 0 or result["summary"]["invalid"] > 0:
            result["status"] = "critical"
        elif result["summary"]["valid"] == result["summary"]["present"]:
            result["status"] = "healthy"
        else:
            result["status"] = "warning"

        return result

    def generate_recommendations(self):
        """Generate recommendations based on diagnostic results"""
        recommendations = []

        # Check SSOT master
        ssot_result = self.results["categories"].get("ssot_master", {})
        if ssot_result.get("status") == "critical":
            recommendations.append(
                "🔴 CRITICAL: Regenerate SSOT master file - system integrity compromised"
            )
        elif ssot_result.get("status") == "warning":
            recommendations.append("🟡 WARNING: Review and update SSOT master entries")

        # Check lockfiles
        lockfiles_result = self.results["categories"].get("lockfiles", {})
        if lockfiles_result.get("summary", {}).get("missing", 0) > 0:
            recommendations.append(
                f"🔴 CRITICAL: {lockfiles_result['summary']['missing']} lockfiles missing - regenerate all lockfiles"
            )
        if lockfiles_result.get("summary", {}).get("corrupted", 0) > 0:
            recommendations.append(
                f"🟡 WARNING: {lockfiles_result['summary']['corrupted']} lockfiles corrupted - verify and regenerate"
            )

        # Check critical files
        critical_result = self.results["categories"].get("critical_files", {})
        if critical_result.get("summary", {}).get("missing", 0) > 0:
            recommendations.append(
                f"🔴 CRITICAL: {critical_result['summary']['missing']} critical files missing - restore from backups"
            )
        if critical_result.get("summary", {}).get("invalid", 0) > 0:
            recommendations.append(
                f"🟡 WARNING: {critical_result['summary']['invalid']} critical files invalid - fix syntax errors"
            )

        # General recommendations
        recommendations.extend(
            [
                "✅ INFO: Run 'scripts/diagnostics/manage_ssot_lockfiles.sh generate' to create missing lockfiles",
                "✅ INFO: Run 'scripts/diagnostics/manage_ssot_lockfiles.sh verify' to verify integrity",
                "✅ INFO: Schedule daily lockfile verification in CI/CD pipeline",
                "✅ INFO: Implement automated SSOT backup and recovery procedures",
            ]
        )

        self.results["recommendations"] = recommendations

    def run_full_diagnostics(self) -> dict[str, Any]:
        """Run comprehensive diagnostics"""
        print("🔍 Running Comprehensive SSOT and Lockfile Diagnostics")
        print("=" * 60)

        # Diagnose SSOT master
        print("📋 Diagnosing SSOT Master...")
        self.results["categories"]["ssot_master"] = self.diagnose_ssot_master()

        # Diagnose lockfiles
        print("🔒 Diagnosing Lockfiles...")
        self.results["categories"]["lockfiles"] = self.diagnose_lockfiles()

        # Diagnose critical files
        print("🎯 Diagnosing Critical Files...")
        self.results["categories"]["critical_files"] = self.diagnose_critical_files()

        # Generate recommendations
        self.generate_recommendations()

        # Calculate overall status
        statuses = [cat["status"] for cat in self.results["categories"].values()]
        if "critical" in statuses:
            self.results["overall_status"] = "critical"
        elif "warning" in statuses:
            self.results["overall_status"] = "warning"
        elif all(s == "healthy" for s in statuses):
            self.results["overall_status"] = "healthy"
        else:
            self.results["overall_status"] = "unknown"

        return self.results

    def print_report(self):
        """Print diagnostic report"""
        status_colors = {
            "healthy": "\033[0;32m",  # Green
            "warning": "\033[1;33m",  # Yellow
            "critical": "\033[0;31m",  # Red
            "unknown": "\033[0;37m",  # White
        }
        NC = "\033[0m"

        print("\n" + "=" * 60)
        print("📊 SSOT AND LOCKFILE DIAGNOSTIC REPORT")
        print("=" * 60)

        overall_status = self.results["overall_status"]
        color = status_colors.get(overall_status, NC)
        print(f"Overall Status: {color}{overall_status.upper()}{NC}")
        print(f"Timestamp: {self.results['timestamp']}")

        print("\n📂 CATEGORY STATUS:")
        for category, data in self.results["categories"].items():
            status = data["status"]
            color = status_colors.get(status, NC)
            print(f"  • {category}: {color}{status.upper()}{NC}")

        print("\n🔧 RECOMMENDATIONS:")
        for rec in self.results.get("recommendations", []):
            print(f"  {rec}")

        print("\n📈 SUMMARY:")
        for category, data in self.results["categories"].items():
            if "summary" in data:
                summary = data["summary"]
                print(f"  {category.title()}: {summary}")

        # Critical issues
        critical_issues = []
        for category, data in self.results["categories"].items():
            if "files" in data:
                for file_data in data["files"].values():
                    if file_data.get("status") in [
                        "critical",
                        "missing",
                        "corrupted",
                        "invalid",
                    ]:
                        critical_issues.append(
                            f"{file_data['file']} ({file_data['status']})"
                        )

        if critical_issues:
            print("\n🚨 CRITICAL ISSUES:")
            for issue in critical_issues[:10]:  # Show first 10
                print(f"  • {issue}")
            if len(critical_issues) > 10:
                print(f"  ... and {len(critical_issues) - 10} more")

    def save_report(self, output_file: str | None = None):
        """Save diagnostic report to file"""
        if not output_file:
            timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
            output_file = f"ssot_diagnostic_report_{timestamp}.json"

        output_path = self.diagnostics_dir / output_file

        with open(output_path, "w") as f:
            json.dump(self.results, f, indent=2, default=str)

        print(f"\n💾 Report saved to: {output_path}")
        return output_path


def main():
    """Main diagnostic function"""
    suite = SSOTDiagnosticSuite()

    try:
        # Run diagnostics
        results = suite.run_full_diagnostics()

        # Print report
        suite.print_report()

        # Save report
        suite.save_report()

        # Exit with appropriate code
        if results["overall_status"] == "critical":
            sys.exit(1)
        elif results["overall_status"] == "warning":
            sys.exit(2)
        else:
            sys.exit(0)

    except Exception as e:
        print(f"❌ Diagnostic suite failed: {e!s}")
        import traceback

        traceback.print_exc()
        sys.exit(1)


if __name__ == "__main__":
    main()
