#!/usr/bin/env python3
"""
Quick Diagnostic Assessment Script
Performs rapid assessment of key diagnostic areas
"""

import json
import subprocess
import sys
from datetime import datetime
from pathlib import Path

# Add project root to path
project_root = Path(__file__).parent.parent.parent
sys.path.insert(0, str(project_root))


class QuickDiagnosticAssessor:
    """Rapid assessment of critical diagnostic areas"""

    def __init__(self):
        self.project_root = project_root
        self.backend_dir = project_root / "backend"
        self.frontend_dir = project_root / "frontend"
        self.results = {}

    def run_security_vulnerability_check(self):
        """Check for basic security vulnerabilities"""
        print("🔐 Checking Security Vulnerabilities...")

        issues = []

        # Check for hardcoded secrets
        secret_patterns = ["password", "secret", "key", "token"]
        for pattern in secret_patterns:
            try:
                result = subprocess.run(
                    [
                        "grep",
                        "-r",
                        "-i",
                        pattern,
                        str(self.backend_dir),
                        "--include=*.py",
                    ],
                    capture_output=True,
                    text=True,
                    timeout=30,
                )
                if result.returncode == 0 and result.stdout.strip():
                    lines = len(result.stdout.strip().split("\n"))
                    issues.append(
                        f"Potential {pattern} references: {lines} instances found"
                    )
            except:
                pass

        # Check for debug mode in production
        try:
            with open(self.backend_dir / "main.py") as f:
                content = f.read()
                if "debug=True" in content.lower() or "DEBUG = True" in content:
                    issues.append("Debug mode potentially enabled in production code")
        except:
            pass

        self.results["security_vulnerabilities"] = {
            "status": "issues_found" if issues else "clean",
            "issues": issues,
            "recommendation": "Run full security audit with professional tools",
        }

    def run_performance_check(self):
        """Check for basic performance issues"""
        print("⚡ Checking Performance Issues...")

        issues = []

        # Check for inefficient patterns
        inefficient_patterns = [
            r"SELECT \* FROM",  # Select all queries
            r"\.all\(\)",  # Loading all records
            r"print\(",  # Debug prints in production
        ]

        for pattern in inefficient_patterns:
            try:
                result = subprocess.run(
                    ["grep", "-r", pattern, str(self.backend_dir), "--include=*.py"],
                    capture_output=True,
                    text=True,
                    timeout=30,
                )
                if result.returncode == 0 and result.stdout.strip():
                    lines = len(result.stdout.strip().split("\n"))
                    issues.append(f"Inefficient pattern '{pattern}': {lines} instances")
            except:
                pass

        # Check for missing indexes (basic check)
        try:
            with open(self.backend_dir / "core" / "database.py") as f:
                content = f.read()
                if "index=True" not in content:
                    issues.append("Potential missing database indexes")
        except:
            pass

        self.results["performance_issues"] = {
            "status": "issues_found" if issues else "optimal",
            "issues": issues,
            "recommendation": "Implement APM monitoring and database optimization",
        }

    def run_code_quality_check(self):
        """Check basic code quality metrics"""
        print("🔧 Checking Code Quality...")

        issues = []

        # Count Python files
        py_files = list(self.backend_dir.rglob("*.py"))
        total_py_files = len(
            [
                f
                for f in py_files
                if not any(skip in str(f) for skip in ["__pycache__", "venv"])
            ]
        )

        # Check for basic quality issues
        long_functions = 0
        missing_docstrings = 0

        for py_file in py_files[:20]:  # Check first 20 files
            try:
                with open(py_file) as f:
                    lines = f.readlines()
                    content = f.read()

                    # Check function lengths
                    in_function = False
                    func_lines = 0
                    for line in lines:
                        if line.strip().startswith("def "):
                            in_function = True
                            func_lines = 0
                        elif in_function and line.strip() and not line.startswith(" "):
                            if func_lines > 50:  # Long function
                                long_functions += 1
                            in_function = False
                        elif in_function:
                            func_lines += 1

                    # Check for docstrings
                    if (
                        "def " in content
                        and '"""' not in content
                        and "'''" not in content
                    ):
                        missing_docstrings += 1

            except:
                pass

        if long_functions > 0:
            issues.append(f"Long functions detected: {long_functions} instances")
        if missing_docstrings > 0:
            issues.append(f"Missing docstrings: {missing_docstrings} functions")

        self.results["code_quality"] = {
            "status": "needs_improvement" if issues else "good",
            "issues": issues,
            "metrics": {
                "python_files": total_py_files,
                "long_functions": long_functions,
                "missing_docstrings": missing_docstrings,
            },
            "recommendation": "Implement code quality tools and review processes",
        }

    def run_testing_coverage_check(self):
        """Check testing coverage and quality"""
        print("🧪 Checking Testing Coverage...")

        issues = []

        # Check for test files
        test_files = list(self.backend_dir.rglob("test_*.py")) + list(
            self.backend_dir.rglob("*_test.py")
        )
        test_files_count = len(test_files)

        # Check test directory
        tests_dir = self.backend_dir / "tests"
        if not tests_dir.exists():
            issues.append("No dedicated tests directory found")
        else:
            test_files_in_dir = list(tests_dir.rglob("*.py"))
            if len(test_files_in_dir) < 5:
                issues.append(f"Limited test files: {len(test_files_in_dir)} found")

        # Check for test configuration
        pytest_ini = self.project_root / "pytest.ini"
        setup_cfg = self.project_root / "setup.cfg"
        if not pytest_ini.exists() and not setup_cfg.exists():
            issues.append("No test configuration found (pytest.ini or setup.cfg)")

        self.results["testing_coverage"] = {
            "status": "inadequate" if issues else "adequate",
            "issues": issues,
            "metrics": {
                "test_files_found": test_files_count,
                "test_directory_exists": (self.backend_dir / "tests").exists(),
                "test_config_exists": pytest_ini.exists() or setup_cfg.exists(),
            },
            "recommendation": "Implement comprehensive test suite with CI/CD integration",
        }

    def run_dependency_check(self):
        """Check dependency management"""
        print("📦 Checking Dependencies...")

        issues = []

        # Check requirements files
        requirements_files = [
            self.backend_dir / "requirements.txt",
            self.project_root / "requirements-dev.txt",
        ]

        existing_reqs = [f for f in requirements_files if f.exists()]
        if len(existing_reqs) < 1:
            issues.append("Missing requirements.txt file")

        # Check for outdated practices
        for req_file in existing_reqs:
            try:
                with open(req_file) as f:
                    content = f.read()
                    if "==" not in content and ">=" not in content:
                        issues.append(f"Loose version constraints in {req_file.name}")
            except:
                pass

        # Check package.json
        package_json = self.frontend_dir / "package.json"
        if package_json.exists():
            try:
                with open(package_json) as f:
                    data = json.load(f)
                    deps = data.get("dependencies", {})
                    dev_deps = data.get("devDependencies", {})

                    total_deps = len(deps) + len(dev_deps)
                    if total_deps > 100:
                        issues.append(f"High dependency count: {total_deps} packages")
            except:
                issues.append("Invalid package.json format")
        else:
            issues.append("Missing package.json file")

        self.results["dependency_management"] = {
            "status": "needs_attention" if issues else "well_managed",
            "issues": issues,
            "recommendation": "Audit dependencies for vulnerabilities and update management practices",
        }

    def generate_assessment_report(self):
        """Generate comprehensive assessment report"""
        report = {
            "timestamp": datetime.now().isoformat(),
            "assessment_type": "quick_diagnostic_assessment",
            "platform": "Zenith Fraud Detection Platform",
            "assessed_areas": list(self.results.keys()),
            "summary": {
                "total_areas_assessed": len(self.results),
                "areas_with_issues": len(
                    [
                        r
                        for r in self.results.values()
                        if r["status"]
                        not in ["clean", "optimal", "good", "adequate", "well_managed"]
                    ]
                ),
                "clean_areas": len(
                    [
                        r
                        for r in self.results.values()
                        if r["status"]
                        in ["clean", "optimal", "good", "adequate", "well_managed"]
                    ]
                ),
                "total_issues_found": sum(
                    len(r.get("issues", [])) for r in self.results.values()
                ),
            },
            "detailed_results": self.results,
            "priority_actions": [],
        }

        # Generate priority actions
        for area, result in self.results.items():
            if result["status"] not in [
                "clean",
                "optimal",
                "good",
                "adequate",
                "well_managed",
            ]:
                report["priority_actions"].append(
                    {
                        "area": area,
                        "priority": (
                            "HIGH" if len(result.get("issues", [])) > 2 else "MEDIUM"
                        ),
                        "issues_count": len(result.get("issues", [])),
                        "recommendation": result.get("recommendation", ""),
                    }
                )

        # Sort by priority
        report["priority_actions"].sort(
            key=lambda x: (x["priority"] == "HIGH", x["issues_count"]), reverse=True
        )

        return report

    def run_complete_assessment(self):
        """Run all diagnostic checks"""
        print("🔍 Running Quick Diagnostic Assessment")
        print("=" * 50)

        # Run all checks
        self.run_security_vulnerability_check()
        self.run_performance_check()
        self.run_code_quality_check()
        self.run_testing_coverage_check()
        self.run_dependency_check()

        # Generate report
        report = self.generate_assessment_report()

        # Display results
        print("\n📊 ASSESSMENT RESULTS")
        print("=" * 30)

        status_emojis = {
            "clean": "✅",
            "optimal": "✅",
            "good": "✅",
            "adequate": "✅",
            "well_managed": "✅",
            "issues_found": "⚠️",
            "needs_improvement": "🟡",
            "inadequate": "🟡",
            "needs_attention": "🟡",
        }

        for area, result in self.results.items():
            emoji = status_emojis.get(result["status"], "❌")
            issues_count = len(result.get("issues", []))
            print(f"{emoji} {area.replace('_', ' ').title()}: {issues_count} issues")

        print("📋 SUMMARY")
        print(f"  Areas Assessed: {report['summary']['total_areas_assessed']}")
        print(f"  Clean Areas: {report['summary']['clean_areas']}")
        print(f"  Areas with Issues: {report['summary']['areas_with_issues']}")
        print(f"  Total Issues: {report['summary']['total_issues_found']}")

        print("🎯 PRIORITY ACTIONS")
        for action in report["priority_actions"][:5]:  # Top 5
            priority_emoji = "🔴" if action["priority"] == "HIGH" else "🟡"
            print(
                f"  {priority_emoji} {action['area'].replace('_', ' ').title()}: {action['issues_count']} issues"
            )

        # Save report
        report_path = (
            self.project_root
            / "scripts"
            / "diagnostics"
            / "quick_diagnostic_assessment.json"
        )
        with open(report_path, "w") as f:
            json.dump(report, f, indent=2, default=str)

        print(f"\n💾 Detailed report saved to: {report_path}")

        # Overall assessment
        if report["summary"]["areas_with_issues"] == 0:
            print("\n🏆 ASSESSMENT: ALL AREAS CLEAN - EXCELLENT SYSTEM HEALTH")
        elif report["summary"]["areas_with_issues"] <= 2:
            print("\n🟡 ASSESSMENT: MINOR ISSUES - GOOD SYSTEM HEALTH")
        else:
            print("\n⚠️ ASSESSMENT: MULTIPLE ISSUES - ATTENTION REQUIRED")

        return report


def main():
    """Main assessment function"""
    assessor = QuickDiagnosticAssessor()
    report = assessor.run_complete_assessment()

    # Exit with appropriate code
    issues_count = report["summary"]["total_issues_found"]
    if issues_count == 0:
        sys.exit(0)  # Perfect
    elif issues_count <= 5:
        sys.exit(1)  # Minor issues
    else:
        sys.exit(2)  # Major issues


if __name__ == "__main__":
    main()
