#!/usr/bin/env python3
"""
Zenith Platform Comprehensive Diagnostic & Fix Tool
Diagnoses parsing errors, linting issues, bugs, and TypeScript errors
"""

import json
import logging
import os
import re
import subprocess
import sys
from pathlib import Path
from typing import Any, Dict, List

logging.basicConfig(
    level=logging.INFO, format="%(asctime)s - %(levelname)s - %(message)s"
)
logger = logging.getLogger(__name__)


class ZenithDiagnosticTool:
    """Comprehensive diagnostic tool for Zenith Platform"""

    def __init__(self):
        self.project_root = Path("/Users/Arief/Desktop/378x492")
        self.issues_found = []
        self.fixes_applied = []

    def run_full_diagnosis(self) -> dict[str, Any]:
        """Run complete platform diagnosis"""
        logger.info("🔍 Starting comprehensive Zenith Platform diagnosis...")

        results = {
            "python_syntax_errors": self.check_python_syntax(),
            "python_linting_issues": self.check_python_linting(),
            "typescript_errors": self.check_typescript_errors(),
            "test_failures": self.run_test_diagnosis(),
            "import_errors": self.check_import_issues(),
            "configuration_issues": self.check_configuration(),
            "security_issues": self.check_security_issues(),
            "performance_issues": self.check_performance_issues(),
        }

        # Generate summary
        total_issues = sum(
            len(issues) for issues in results.values() if isinstance(issues, list)
        )
        results["summary"] = {
            "total_issues_found": total_issues,
            "critical_issues": len(
                [i for i in self.issues_found if i.get("severity") == "critical"]
            ),
            "fixable_issues": len(
                [i for i in self.issues_found if i.get("fixable", False)]
            ),
            "recommendations": self.generate_recommendations(),
        }

        return results

    def check_python_syntax(self) -> list[dict[str, Any]]:
        """Check Python files for syntax errors"""
        logger.info("Checking Python syntax...")
        syntax_errors = []

        python_files = []
        for root, dirs, files in os.walk(self.project_root):
            # Skip node_modules and other irrelevant directories
            dirs[:] = [
                d for d in dirs if d not in ["node_modules", "__pycache__", ".git"]
            ]
            for file in files:
                if file.endswith(".py"):
                    python_files.append(os.path.join(root, file))

        for py_file in python_files[:100]:  # Limit to first 100 files for performance
            try:
                result = subprocess.run(
                    [sys.executable, "-m", "py_compile", py_file],
                    capture_output=True,
                    text=True,
                    timeout=10,
                )

                if result.returncode != 0:
                    error_info = self.parse_python_syntax_error(result.stderr, py_file)
                    if error_info:
                        syntax_errors.append(error_info)

            except subprocess.TimeoutExpired:
                logger.warning(f"Timeout checking {py_file}")
            except Exception as e:
                logger.error(f"Error checking {py_file}: {e}")

        logger.info(f"Found {len(syntax_errors)} Python syntax errors")
        return syntax_errors

    def parse_python_syntax_error(self, stderr: str, file_path: str) -> dict[str, Any]:
        """Parse Python syntax error output"""
        lines = stderr.strip().split("\n")
        if not lines:
            return None

        # Extract error information
        error_match = re.search(r'File "([^"]+)", line (\d+)', lines[0])
        if error_match:
            _file_name, line_num = error_match.groups()
            error_type = "SyntaxError" if "SyntaxError" in stderr else "Error"

            return {
                "file": file_path,
                "line": int(line_num),
                "type": error_type,
                "message": lines[-1] if lines else "Unknown error",
                "severity": "critical",
                "category": "python_syntax",
                "fixable": True,
            }

        return None

    def check_python_linting(self) -> list[dict[str, Any]]:
        """Check Python files for linting issues"""
        logger.info("Checking Python linting issues...")
        lint_issues = []

        try:
            # Check if flake8 is available
            result = subprocess.run(
                ["python", "-m", "flake8", "--version"], capture_output=True, text=True
            )

            if result.returncode == 0:
                # Run flake8 on backend directory
                backend_path = self.project_root / "backend"
                result = subprocess.run(
                    [
                        "python",
                        "-m",
                        "flake8",
                        "--max-line-length=120",
                        "--extend-ignore=E203,W503",
                        str(backend_path),
                    ],
                    capture_output=True,
                    text=True,
                    cwd=self.project_root,
                )

                # Parse flake8 output
                for line in result.stdout.split("\n"):
                    if ":" in line and len(line.split(":")) >= 3:
                        parts = line.split(":")
                        if len(parts) >= 3:
                            file_path, line_num, col_num, *error_parts = parts
                            error_code = error_parts[0] if error_parts else "Unknown"
                            message = (
                                ":".join(error_parts[1:])
                                if len(error_parts) > 1
                                else "Unknown"
                            )

                            lint_issues.append(
                                {
                                    "file": file_path,
                                    "line": int(line_num) if line_num.isdigit() else 0,
                                    "column": int(col_num) if col_num.isdigit() else 0,
                                    "type": error_code,
                                    "message": message.strip(),
                                    "severity": "medium"
                                    if error_code.startswith("E")
                                    else "low",
                                    "category": "python_linting",
                                    "fixable": True,
                                }
                            )

        except FileNotFoundError:
            logger.warning("flake8 not available for linting checks")
        except Exception as e:
            logger.error(f"Error running flake8: {e}")

        logger.info(f"Found {len(lint_issues)} Python linting issues")
        return lint_issues

    def check_typescript_errors(self) -> list[dict[str, Any]]:
        """Check TypeScript files for errors"""
        logger.info("Checking TypeScript errors...")
        ts_errors = []

        frontend_path = self.project_root / "frontend"

        try:
            # Run TypeScript compiler check
            result = subprocess.run(
                ["npm", "run", "type-check"],
                capture_output=True,
                text=True,
                cwd=frontend_path,
                timeout=60,
            )

            # Parse TypeScript errors
            for line in result.stdout.split("\n"):
                if "error TS" in line:
                    error_info = self.parse_typescript_error(line)
                    if error_info:
                        ts_errors.append(error_info)

        except subprocess.TimeoutExpired:
            logger.warning("TypeScript check timed out")
        except FileNotFoundError:
            logger.warning("TypeScript/npm not available")
        except Exception as e:
            logger.error(f"Error checking TypeScript: {e}")

        logger.info(f"Found {len(ts_errors)} TypeScript errors")
        return ts_errors

    def parse_typescript_error(self, error_line: str) -> dict[str, Any]:
        """Parse TypeScript error line"""
        # Example: src/components/Button.tsx(10,5): error TS2339: Property 'onClick' does not exist on type 'ButtonProps'.
        match = re.match(
            r"([^()]+)\((\d+),(\d+)\): error (TS\d+): (.+)", error_line.strip()
        )

        if match:
            file_path, line_num, col_num, error_code, message = match.groups()

            return {
                "file": f"frontend/{file_path}",
                "line": int(line_num),
                "column": int(col_num),
                "type": error_code,
                "message": message,
                "severity": "high" if error_code.startswith("TS23") else "medium",
                "category": "typescript",
                "fixable": True,
            }

        return {
            "file": "unknown",
            "line": 0,
            "column": 0,
            "type": "TS_UNKNOWN",
            "message": error_line,
            "severity": "medium",
            "category": "typescript",
            "fixable": False,
        }

    def run_test_diagnosis(self) -> list[dict[str, Any]]:
        """Run test diagnosis and identify failures"""
        logger.info("Running test diagnosis...")
        test_failures = []

        # Run key test suites
        test_commands = [
            (["python", "-m", "pytest", "tests/unit/test_auth.py", "-v"], "auth_tests"),
            (
                [
                    "python",
                    "-m",
                    "pytest",
                    "tests/unit/test_security_controls.py",
                    "-v",
                ],
                "security_tests",
            ),
            (
                [
                    "python",
                    "-m",
                    "pytest",
                    "tests/unit/test_analytics_metrics.py",
                    "-v",
                ],
                "analytics_tests",
            ),
        ]

        for cmd, test_suite in test_commands:
            try:
                result = subprocess.run(
                    cmd,
                    capture_output=True,
                    text=True,
                    cwd=self.project_root,
                    timeout=30,
                )

                if result.returncode != 0:
                    # Parse test failures
                    failures = self.parse_test_failures(
                        result.stdout + result.stderr, test_suite
                    )
                    test_failures.extend(failures)

            except subprocess.TimeoutExpired:
                test_failures.append(
                    {
                        "suite": test_suite,
                        "type": "timeout",
                        "message": "Test suite timed out",
                        "severity": "high",
                        "category": "test_failure",
                        "fixable": True,
                    }
                )
            except Exception as e:
                logger.error(f"Error running {test_suite}: {e}")

        logger.info(f"Found {len(test_failures)} test failures")
        return test_failures

    def parse_test_failures(self, output: str, suite: str) -> list[dict[str, Any]]:
        """Parse test failure output"""
        failures = []

        # Look for FAILED lines
        for line in output.split("\n"):
            if "FAILED" in line and "::" in line:
                # Extract test name
                parts = line.split("::")
                if len(parts) >= 2:
                    test_name = parts[-1].strip()

                    failures.append(
                        {
                            "suite": suite,
                            "test": test_name,
                            "type": "assertion_error",
                            "message": f"Test {test_name} failed",
                            "severity": "high",
                            "category": "test_failure",
                            "fixable": True,
                        }
                    )

        return failures

    def check_import_issues(self) -> list[dict[str, Any]]:
        """Check for import-related issues"""
        logger.info("Checking import issues...")
        import_issues = []

        # Common import patterns to check
        python_files = []
        for root, dirs, files in os.walk(self.project_root / "backend"):
            dirs[:] = [d for d in dirs if d not in ["__pycache__"]]
            for file in files:
                if file.endswith(".py"):
                    python_files.append(os.path.join(root, file))

        for py_file in python_files[:50]:  # Check first 50 files
            try:
                with open(py_file, encoding="utf-8", errors="ignore") as f:
                    content = f.read()

                # Check for common import issues
                lines = content.split("\n")
                for i, line in enumerate(lines, 1):
                    line = line.strip()

                    # Check for relative imports that might be broken
                    if line.startswith("from .") and ".." in line:
                        # Complex relative import
                        import_issues.append(
                            {
                                "file": py_file,
                                "line": i,
                                "type": "complex_relative_import",
                                "message": f"Complex relative import: {line}",
                                "severity": "medium",
                                "category": "import_issue",
                                "fixable": True,
                            }
                        )

                    # Check for missing __init__.py files
                    if "from " in line and not line.startswith("from ."):
                        # Could be absolute import issue
                        pass

            except Exception as e:
                logger.error(f"Error checking imports in {py_file}: {e}")

        logger.info(f"Found {len(import_issues)} import issues")
        return import_issues

    def check_configuration(self) -> list[dict[str, Any]]:
        """Check configuration-related issues"""
        logger.info("Checking configuration issues...")
        config_issues = []

        # Check for missing environment variables
        required_env_vars = [
            "DATABASE_URL",
            "SECRET_KEY",
            "JWT_SECRET_KEY",
            "REDIS_URL",
            "API_KEY",
        ]

        missing_vars = []
        for var in required_env_vars:
            if not os.getenv(var):
                missing_vars.append(var)

        if missing_vars:
            config_issues.append(
                {
                    "type": "missing_env_vars",
                    "message": f"Missing required environment variables: {', '.join(missing_vars)}",
                    "severity": "critical",
                    "category": "configuration",
                    "fixable": True,
                }
            )

        # Check for configuration file issues
        config_files = [
            "backend/pyproject.toml",
            "backend/requirements.txt",
            "frontend/package.json",
            "frontend/tsconfig.json",
        ]

        for config_file in config_files:
            config_path = self.project_root / config_file
            if not config_path.exists():
                config_issues.append(
                    {
                        "file": config_file,
                        "type": "missing_config_file",
                        "message": f"Configuration file missing: {config_file}",
                        "severity": "high",
                        "category": "configuration",
                        "fixable": True,
                    }
                )

        logger.info(f"Found {len(config_issues)} configuration issues")
        return config_issues

    def check_security_issues(self) -> list[dict[str, Any]]:
        """Check for security-related issues"""
        logger.info("Checking security issues...")
        security_issues = []

        # Check for hardcoded secrets
        secret_patterns = [
            r'password\s*=\s*["\'][^"\']*["\']',
            r'secret\s*=\s*["\'][^"\']*["\']',
            r'key\s*=\s*["\'][^"\']*["\']',
            r'token\s*=\s*["\'][^"\']*["\']',
        ]

        python_files = []
        for root, dirs, files in os.walk(self.project_root / "backend"):
            dirs[:] = [d for d in dirs if d not in ["__pycache__", "node_modules"]]
            for file in files:
                if file.endswith(".py"):
                    python_files.append(os.path.join(root, file))

        for py_file in python_files[:30]:  # Check first 30 files
            try:
                with open(py_file, encoding="utf-8", errors="ignore") as f:
                    content = f.read()

                lines = content.split("\n")
                for i, line in enumerate(lines, 1):
                    for pattern in secret_patterns:
                        if re.search(pattern, line, re.IGNORECASE):
                            # Check if it's not a test file or example
                            if (
                                "test" not in py_file.lower()
                                and "example" not in py_file.lower()
                            ):
                                security_issues.append(
                                    {
                                        "file": py_file,
                                        "line": i,
                                        "type": "potential_hardcoded_secret",
                                        "message": f"Potential hardcoded secret found: {line.strip()[:50]}...",
                                        "severity": "critical",
                                        "category": "security",
                                        "fixable": True,
                                    }
                                )
                                break

            except Exception as e:
                logger.error(f"Error checking security in {py_file}: {e}")

        logger.info(f"Found {len(security_issues)} security issues")
        return security_issues

    def check_performance_issues(self) -> list[dict[str, Any]]:
        """Check for performance-related issues"""
        logger.info("Checking performance issues...")
        performance_issues = []

        # Check for potential N+1 query issues
        python_files = []
        for root, dirs, files in os.walk(self.project_root / "backend"):
            dirs[:] = [d for d in dirs if d not in ["__pycache__"]]
            for file in files:
                if file.endswith(".py"):
                    python_files.append(os.path.join(root, file))

        for py_file in python_files[:20]:  # Check first 20 files
            try:
                with open(py_file, encoding="utf-8", errors="ignore") as f:
                    content = f.read()

                lines = content.split("\n")
                for i, line in enumerate(lines, 1):
                    # Check for loops with database queries
                    if "for " in line and ("session." in content or "db." in content):
                        # Look for query patterns inside loops
                        next_lines = lines[i : i + 10]  # Check next 10 lines
                        for next_line in next_lines:
                            if any(
                                pattern in next_line
                                for pattern in ["session.", "db.", "query(", "filter("]
                            ):
                                performance_issues.append(
                                    {
                                        "file": py_file,
                                        "line": i,
                                        "type": "potential_n_plus_one",
                                        "message": f"Potential N+1 query in loop at line {i}",
                                        "severity": "medium",
                                        "category": "performance",
                                        "fixable": True,
                                    }
                                )
                                break

            except Exception as e:
                logger.error(f"Error checking performance in {py_file}: {e}")

        logger.info(f"Found {len(performance_issues)} performance issues")
        return performance_issues

    def generate_recommendations(self) -> list[str]:
        """Generate recommendations based on findings"""
        recommendations = []

        if any(i.get("category") == "python_syntax" for i in self.issues_found):
            recommendations.append(
                "Fix Python syntax errors immediately - they prevent code execution"
            )

        if any(i.get("category") == "test_failure" for i in self.issues_found):
            recommendations.append(
                "Fix failing tests to ensure code reliability and prevent regressions"
            )

        if any(i.get("type") == "missing_env_vars" for i in self.issues_found):
            recommendations.append(
                "Configure all required environment variables for proper application startup"
            )

        if any(i.get("category") == "typescript" for i in self.issues_found):
            recommendations.append(
                "Fix TypeScript errors to ensure type safety and prevent runtime errors"
            )

        if any(i.get("category") == "security" for i in self.issues_found):
            recommendations.append(
                "Address security issues immediately to prevent vulnerabilities"
            )

        if not recommendations:
            recommendations.append(
                "Codebase appears healthy - continue with regular maintenance and testing"
            )

        return recommendations

    def apply_automated_fixes(self) -> dict[str, Any]:
        """Apply automated fixes for fixable issues"""
        logger.info("Applying automated fixes...")

        fixes_applied = []

        # Fix Python syntax errors that are fixable
        for issue in self.issues_found:
            if issue.get("fixable") and issue.get("category") == "python_syntax":
                if "unterminated string literal" in issue.get("message", ""):
                    success = self.fix_unterminated_string(issue["file"], issue["line"])
                    if success:
                        fixes_applied.append(
                            f"Fixed unterminated string in {issue['file']}"
                        )

                elif "leading zeros" in issue.get("message", ""):
                    success = self.fix_merge_conflicts(issue["file"])
                    if success:
                        fixes_applied.append(
                            f"Fixed merge conflict markers in {issue['file']}"
                        )

        return {"fixes_applied": fixes_applied, "total_fixes": len(fixes_applied)}

    def fix_unterminated_string(self, file_path: str, line_num: int) -> bool:
        """Fix unterminated string literals"""
        try:
            with open(file_path) as f:
                lines = f.readlines()

            if line_num <= len(lines):
                line = lines[line_num - 1]
                # Look for unterminated strings
                if line.strip().startswith(
                    'logger.info("'
                ) and not line.strip().endswith('")'):
                    # Fix by adding closing quotes and parentheses
                    fixed_line = line.rstrip() + '")\n'
                    lines[line_num - 1] = fixed_line

                    with open(file_path, "w") as f:
                        f.writelines(lines)

                    return True

        except Exception as e:
            logger.error(f"Error fixing string in {file_path}: {e}")

        return False

    def fix_merge_conflicts(self, file_path: str) -> bool:
        """Fix merge conflict markers"""
        try:
            with open(file_path) as f:
                content = f.read()

            # Remove merge conflict markers
            conflict_patterns = [r"<<<<<<< .*?\n", r"=======\n", r">>>>>>> .*?\n"]

            original_content = content
            for pattern in conflict_patterns:
                content = re.sub(pattern, "", content, flags=re.MULTILINE)

            if content != original_content:
                with open(file_path, "w") as f:
                    f.write(content)
                return True

        except Exception as e:
            logger.error(f"Error fixing merge conflicts in {file_path}: {e}")

        return False


def main():
    """Main diagnostic function"""
    tool = ZenithDiagnosticTool()

    print("🚀 Zenith Platform Comprehensive Diagnostic Tool")
    print("=" * 60)

    # Run full diagnosis
    results = tool.run_full_diagnosis()

    # Apply automated fixes
    fixes = tool.apply_automated_fixes()

    # Print summary
    summary = results["summary"]
    print("\n📊 Diagnostic Summary:")
    print(f"   Total Issues Found: {summary['total_issues_found']}")
    print(f"   Critical Issues: {summary['critical_issues']}")
    print(f"   Fixable Issues: {summary['fixable_issues']}")
    print(f"   Automated Fixes Applied: {fixes['total_fixes']}")

    print("\n💡 Recommendations:")
    for i, rec in enumerate(summary["recommendations"], 1):
        print(f"   {i}. {rec}")

    # Save detailed report
    report_file = "diagnostic_report.json"
    with open(report_file, "w") as f:
        # Convert results to JSON-serializable format
        json_results = {}
        for key, value in results.items():
            if isinstance(value, list):
                json_results[key] = value
            else:
                json_results[key] = value

        json.dump(json_results, f, indent=2, default=str)

    print(f"\n📄 Detailed report saved to: {report_file}")

    # Exit with appropriate code
    if summary["critical_issues"] > 0:
        print("\n❌ Critical issues found - manual intervention required")
        return 1
    else:
        print("\n✅ All critical checks passed")
        return 0


if __name__ == "__main__":
    sys.exit(main())
