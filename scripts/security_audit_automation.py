#!/usr/bin/env python3
"""
Automated Security Audit and Update Script
Performs regular security assessments and dependency updates
"""

import json
import subprocess
import sys
from datetime import datetime, timedelta
from pathlib import Path


def run_command(cmd, description, capture_output=True):
    """Run a command and return results"""
    print(f"\n🔧 {description}")
    print("-" * 50)

    try:
        if capture_output:
            result = subprocess.run(
                cmd, shell=True, capture_output=True, text=True, cwd="."
            )
        else:
            result = subprocess.run(cmd, shell=True, cwd=".")

        if result.returncode == 0:
            print("✅ SUCCESS")
            return True, result.stdout if capture_output else ""
        else:
            print("❌ FAILED")
            if capture_output and result.stderr:
                print("STDERR:", result.stderr.strip())
            return False, result.stderr if capture_output else ""

    except Exception as e:
        print(f"❌ ERROR: {e}")
        return False, str(e)


def security_dependency_check():
    """Check for security vulnerabilities in dependencies"""
    print("\n🔒 SECURITY DEPENDENCY AUDIT")
    print("=" * 40)

    try:
        # Install safety if not available
        subprocess.run(
            [sys.executable, "-m", "pip", "install", "safety"], capture_output=True
        )

        # Run safety check
        success, output = run_command(
            "safety check --full-report --output json",
            "Running dependency security scan",
        )

        if success:
            # Parse and analyze results
            try:
                results = json.loads(output)
                vulnerabilities = [
                    v
                    for v in results.get("vulnerabilities", [])
                    if v.get("severity") in ["high", "critical"]
                ]

                if vulnerabilities:
                    print(
                        f"🚨 Found {len(vulnerabilities)} high/critical vulnerabilities:"
                    )
                    for vuln in vulnerabilities[:5]:  # Show first 5
                        print(
                            f"  - {vuln['package']} {vuln['vulnerable_spec']}: {vuln['advisory']}"
                        )
                    return False
                else:
                    print("✅ No high/critical vulnerabilities found")
                    return True
            except json.JSONDecodeError:
                print("⚠️ Could not parse safety output")
                return False
        else:
            print("❌ Safety scan failed")
            return False

    except Exception as e:
        print(f"❌ Security audit error: {e}")
        return False


def update_dependencies():
    """Update dependencies safely"""
    print("\n📦 DEPENDENCY UPDATE CHECK")
    print("=" * 30)

    try:
        # Check for outdated packages
        success, output = run_command(
            "pip list --outdated --format json", "Checking for outdated packages"
        )

        if success and output.strip():
            try:
                outdated = json.loads(output)
                security_updates = []
                regular_updates = []

                for pkg in outdated:
                    name = pkg["name"]
                    current = pkg["version"]
                    latest = pkg["latest_version"]

                    # Check if this is a security-related package
                    security_packages = [
                        "cryptography",
                        "pyjwt",
                        "requests",
                        "urllib3",
                        "sqlalchemy",
                        "fastapi",
                        "uvicorn",
                        "aiohttp",
                    ]

                    if name.lower() in security_packages:
                        security_updates.append(f"{name}: {current} -> {latest}")
                    else:
                        regular_updates.append(f"{name}: {current} -> {latest}")

                if security_updates:
                    print("🔒 SECURITY UPDATES AVAILABLE:")
                    for update in security_updates:
                        print(f"  - {update}")

                if regular_updates:
                    print(f"📦 {len(regular_updates)} regular updates available")

                # Create update plan
                update_plan = {
                    "timestamp": datetime.now().isoformat(),
                    "security_updates": security_updates,
                    "regular_updates": len(regular_updates),
                    "recommendations": [],
                }

                if security_updates:
                    update_plan["recommendations"].append(
                        "URGENT: Update security-related packages immediately"
                    )
                if regular_updates:
                    update_plan["recommendations"].append(
                        "Consider updating regular packages in next deployment"
                    )

                # Save update plan
                plan_path = Path("security_update_plan.json")
                with open(plan_path, "w") as f:
                    json.dump(update_plan, f, indent=2)

                print(f"💾 Update plan saved to: {plan_path}")
                return True

            except json.JSONDecodeError:
                print("⚠️ Could not parse outdated packages output")
                return False
        else:
            print("✅ All packages are up to date")
            return True

    except Exception as e:
        print(f"❌ Dependency update check error: {e}")
        return False


def code_security_scan():
    """Run code security scanning"""
    print("\n🔍 CODE SECURITY SCAN")
    print("=" * 30)

    try:
        # Run bandit on codebase
        success, _output = run_command(
            "python -m bandit -r scripts/ backend/ -f json -o /tmp/bandit_results.json",
            "Running bandit code security scan",
        )

        if success:
            try:
                with open("/tmp/bandit_results.json") as f:
                    results = json.load(f)

                issues = results.get("results", [])
                high_severity = [i for i in issues if i.get("issue_severity") == "HIGH"]
                medium_severity = [
                    i for i in issues if i.get("issue_severity") == "MEDIUM"
                ]

                print("📊 Scan Results:")
                print(f"  - Total issues: {len(issues)}")
                print(f"  - High severity: {len(high_severity)}")
                print(f"  - Medium severity: {len(medium_severity)}")

                if high_severity:
                    print("🚨 HIGH SEVERITY ISSUES:")
                    for issue in high_severity[:3]:  # Show first 3
                        print(
                            f"  - {issue['filename']}:{issue['line_number']}: {issue['issue_text']}"
                        )

                # Save detailed results
                results_path = Path("code_security_scan_results.json")
                with open(results_path, "w") as f:
                    json.dump(results, f, indent=2)

                print(f"💾 Detailed results saved to: {results_path}")

                return len(high_severity) == 0

            except Exception as e:
                print(f"❌ Error parsing bandit results: {e}")
                return False
        else:
            print("❌ Bandit scan failed")
            return False

    except Exception as e:
        print(f"❌ Code security scan error: {e}")
        return False


def generate_security_report(dep_check, update_check, code_scan):
    """Generate comprehensive security audit report"""

    report = {
        "audit_timestamp": datetime.now().isoformat(),
        "audit_type": "automated_security_audit",
        "results": {
            "dependency_security_check": "PASSED" if dep_check else "FAILED",
            "dependency_update_check": "COMPLETED" if update_check else "FAILED",
            "code_security_scan": "PASSED" if code_scan else "FAILED",
        },
        "overall_status": "PASSED"
        if all([dep_check, update_check, code_scan])
        else "ISSUES_FOUND",
        "recommendations": [],
        "next_audit_due": (datetime.now() + timedelta(days=7)).isoformat(),
    }

    # Generate recommendations based on results
    if not dep_check:
        report["recommendations"].append(
            "Address dependency security vulnerabilities immediately"
        )
    if not code_scan:
        report["recommendations"].append("Fix high-severity code security issues")
    if update_check:
        report["recommendations"].append("Review and apply security updates")

    report["recommendations"].append(
        "Schedule next security audit for: " + report["next_audit_due"]
    )

    # Save report
    report_path = Path("security_audit_report.json")
    with open(report_path, "w") as f:
        json.dump(report, f, indent=2)

    # Generate summary
    summary_path = Path("SECURITY_AUDIT_SUMMARY.md")
    with open(summary_path, "w") as f:
        f.write("# 🔒 AUTOMATED SECURITY AUDIT REPORT\n\n")
        f.write(f"**Audit Date:** {report['audit_timestamp']}\n")
        f.write(f"**Overall Status:** {report['overall_status']}\n\n")

        f.write("## 📊 AUDIT RESULTS\n\n")
        for check, status in report["results"].items():
            emoji = "✅" if status == "PASSED" else "❌" if status == "FAILED" else "⚠️"
            f.write(f"- **{check.replace('_', ' ').title()}:** {emoji} {status}\n")
        f.write("\n")

        f.write("## 💡 RECOMMENDATIONS\n\n")
        for rec in report["recommendations"]:
            f.write(f"- 🔧 {rec}\n")
        f.write("\n")

        if report["overall_status"] == "PASSED":
            f.write("## ✅ CONCLUSION: SECURITY AUDIT PASSED\n\n")
            f.write(
                "No critical security issues found. Continue with regular monitoring.\n"
            )
        else:
            f.write("## 🚨 CONCLUSION: SECURITY ISSUES FOUND\n\n")
            f.write("Address identified security issues before deployment.\n")

        f.write("\n---\n\n")
        f.write("**Generated by Automated Security Audit System**\n")

    print(f"\n📁 Security audit report saved to: {report_path}")
    print(f"📋 Summary saved to: {summary_path}")

    return report


def main():
    print("🔒 AUTOMATED SECURITY AUDIT & UPDATE SYSTEM")
    print("=" * 55)

    # Run all security checks
    print("Running comprehensive security assessment...")

    dep_check = security_dependency_check()
    update_check = update_dependencies()
    code_scan = code_security_scan()

    # Generate comprehensive report
    report = generate_security_report(dep_check, update_check, code_scan)

    # Final status
    overall_success = all([dep_check, update_check, code_scan])

    print(f"\n🏆 AUDIT STATUS: {'PASSED' if overall_success else 'ISSUES FOUND'}")

    if overall_success:
        print("🎉 Security audit completed successfully!")
    else:
        print("⚠️ Security issues found - review reports for details")

    return 0 if overall_success else 1


if __name__ == "__main__":
    sys.exit(main())
