#!/usr/bin/env python3
"""
Documentation Validation Script
Validates documentation quality, completeness, and accuracy
"""

import json
import re
import sys
from pathlib import Path
from typing import Any, Dict


class DocumentationValidator:
    """Comprehensive documentation validation"""

    def __init__(self, docs_root: Path):
        self.docs_root = docs_root
        self.issues = []
        self.stats = {
            "files_checked": 0,
            "links_checked": 0,
            "broken_links": 0,
            "api_endpoints_validated": 0,
            "missing_docs": 0,
            "warnings": 0,
            "errors": 0,
        }

    def validate_all(self) -> dict[str, Any]:
        """Run comprehensive validation"""
        print("🔍 Starting Documentation Validation...")

        # Validate structure
        self.validate_structure()

        # Validate links
        self.validate_links()

        # Validate API documentation
        self.validate_api_documentation()

        # Check for missing documentation
        self.check_missing_documentation()

        # Validate markdown quality
        self.validate_markdown_quality()

        return self.generate_report()

    def validate_structure(self):
        """Validate documentation structure"""
        print("📁 Validating documentation structure...")

        required_dirs = ["api", "build", "operate", "learn", "plan"]

        for dir_name in required_dirs:
            dir_path = self.docs_root / dir_name
            if not dir_path.exists():
                self.add_issue(f"Missing required directory: {dir_name}", "error")
            else:
                print(f"✅ Found directory: {dir_name}")

    def validate_links(self):
        """Validate internal and external links"""
        print("🔗 Validating links...")

        markdown_files = list(self.docs_root.rglob("*.md"))

        for md_file in markdown_files:
            self.validate_file_links(md_file)

    def validate_file_links(self, file_path: Path):
        """Validate links in a single file"""
        try:
            with open(file_path, encoding="utf-8") as f:
                content = f.read()

            self.stats["files_checked"] += 1

            # Find markdown links
            link_pattern = r"\[([^\]]+)\]\(([^)]+)\)"
            matches = re.findall(link_pattern, content)

            for link_text, link_url in matches:
                self.stats["links_checked"] += 1
                self.validate_single_link(file_path, link_text, link_url)

        except Exception as e:
            self.add_issue(f"Error reading {file_path}: {e}", "error")

    def validate_single_link(self, source_file: Path, link_text: str, link_url: str):
        """Validate a single link"""
        # Skip external links for now (can be added later)
        if link_url.startswith(("http://", "https://")):
            return

        # Skip anchor links
        if link_url.startswith("#"):
            return

        # Handle relative links
        if link_url.startswith(("./", "../")):
            target_path = (source_file.parent / link_url).resolve()
        else:
            target_path = (source_file.parent / link_url).resolve()

        # Check if target exists
        if not target_path.exists():
            self.add_issue(
                f"Broken link in {source_file.name}: '{link_text}' -> {link_url}",
                "error",
            )
            self.stats["broken_links"] += 1

    def validate_api_documentation(self):
        """Validate API documentation completeness"""
        print("📋 Validating API documentation...")

        api_dir = self.docs_root / "api"
        if not api_dir.exists():
            self.add_issue("API documentation directory missing", "error")
            return

        # Check for required files
        required_files = ["README.md", "api_analysis.json"]

        for req_file in required_files:
            file_path = api_dir / req_file
            if not file_path.exists():
                self.add_issue(f"Missing API documentation file: {req_file}", "error")
            else:
                print(f"✅ Found API documentation: {req_file}")

        # Validate API analysis
        api_analysis_path = api_dir / "api_analysis.json"
        if api_analysis_path.exists():
            self.validate_api_analysis(api_analysis_path)

    def validate_api_analysis(self, api_analysis_path: Path):
        """Validate API analysis file"""
        try:
            with open(api_analysis_path) as f:
                api_data = json.load(f)

            # Check required fields
            required_fields = ["metadata", "statistics", "endpoints_by_router"]
            for field in required_fields:
                if field not in api_data:
                    self.add_issue(f"Missing field in API analysis: {field}", "error")

            # Validate endpoint coverage
            total_endpoints = api_data.get("metadata", {}).get("total_endpoints", 0)
            if total_endpoints < 100:
                self.add_issue(
                    f"Low endpoint coverage: {total_endpoints} endpoints found",
                    "warning",
                )

            self.stats["api_endpoints_validated"] = total_endpoints
            print(f"✅ Validated {total_endpoints} API endpoints")

        except json.JSONDecodeError as e:
            self.add_issue(f"Invalid JSON in API analysis: {e}", "error")

    def check_missing_documentation(self):
        """Check for missing critical documentation"""
        print("🔍 Checking for missing documentation...")

        # Check for build section
        build_dir = self.docs_root / "build"
        if not build_dir.exists():
            self.add_issue("Build documentation section missing", "error")
            self.stats["missing_docs"] += 1

        # Check for architecture docs
        arch_files = list(self.docs_root.rglob("*architecture*"))
        if not arch_files:
            self.add_issue("Architecture documentation missing", "warning")
            self.stats["missing_docs"] += 1

        # Check for testing docs
        test_files = list(self.docs_root.rglob("*test*"))
        if not test_files:
            self.add_issue("Testing documentation missing", "warning")
            self.stats["missing_docs"] += 1

    def validate_markdown_quality(self):
        """Validate markdown file quality"""
        print("📝 Validating markdown quality...")

        markdown_files = list(self.docs_root.rglob("*.md"))

        for md_file in markdown_files:
            self.validate_markdown_file(md_file)

    def validate_markdown_file(self, file_path: Path):
        """Validate a single markdown file"""
        try:
            with open(file_path, encoding="utf-8") as f:
                content = f.read()

            issues = []

            # Check for proper heading structure
            lines = content.split("\n")
            heading_levels = []

            for line in lines:
                if line.startswith("#"):
                    level = len(line) - len(line.lstrip("#"))
                    heading_levels.append(level)

            # Check for heading level skips
            for i in range(1, len(heading_levels)):
                if heading_levels[i] > heading_levels[i - 1] + 1:
                    issues.append("Heading level skip detected")
                    break

            # Check for empty sections
            if len(content.strip()) < 50:
                issues.append("File appears to be empty or minimal")

            # Report issues
            for issue in issues:
                self.add_issue(
                    f"Markdown quality issue in {file_path.name}: {issue}", "warning"
                )

        except Exception as e:
            self.add_issue(f"Error validating {file_path}: {e}", "error")

    def add_issue(self, message: str, severity: str):
        """Add a validation issue"""
        self.issues.append({"message": message, "severity": severity})

        if severity == "error":
            self.stats["errors"] += 1
        elif severity == "warning":
            self.stats["warnings"] += 1

    def generate_report(self) -> dict[str, Any]:
        """Generate validation report"""
        status = "PASS" if self.stats["errors"] == 0 else "FAIL"

        report = {
            "summary": {
                "total_issues": len(self.issues),
                "errors": self.stats["errors"],
                "warnings": self.stats["warnings"],
                "files_checked": self.stats["files_checked"],
                "links_checked": self.stats["links_checked"],
                "broken_links": self.stats["broken_links"],
                "api_endpoints_validated": self.stats["api_endpoints_validated"],
                "status": status,
            },
            "issues": self.issues,
            "status": status,
        }

        return report


def save_validation_report(report: dict[str, Any], output_path: Path):
    """Save validation report"""

    # Save JSON report
    with open(output_path, "w") as f:
        json.dump(report, f, indent=2)

    # Generate markdown summary
    md_report = generate_markdown_report(report)

    # Save markdown report
    md_path = output_path.with_suffix(".md")
    with open(md_path, "w") as f:
        f.write(md_report)

    print(f"📊 Validation report saved to {output_path}")
    print(f"📝 Markdown report saved to {md_path}")


def generate_markdown_report(report: dict[str, Any]) -> str:
    """Generate markdown validation report"""

    md = []

    # Header
    md.append("# Documentation Validation Report")
    md.append("")

    # Summary
    summary = report["summary"]
    md.append("## Summary")
    md.append("")
    md.append(f"**Status**: {summary['status']}")
    md.append(f"**Total Issues**: {summary['total_issues']}")
    md.append(f"**Errors**: {summary['errors']}")
    md.append(f"**Warnings**: {summary['warnings']}")
    md.append("")

    # Statistics
    md.append("## Statistics")
    md.append("")
    md.append(f"- Files Checked: {summary['files_checked']}")
    md.append(f"- Links Checked: {summary['links_checked']}")
    md.append(f"- Broken Links: {summary['broken_links']}")
    md.append(f"- API Endpoints Validated: {summary['api_endpoints_validated']}")
    md.append("")

    # Issues
    if report["issues"]:
        md.append("## Issues")
        md.append("")

        for issue in report["issues"]:
            severity_emoji = "❌" if issue["severity"] == "error" else "⚠️"
            md.append(
                f"{severity_emoji} **{issue['severity'].upper()}**: {issue['message']}"
            )
            md.append("")

    return "\n".join(md)


def main():
    """Main validation process"""
    print("🔍 Starting Documentation Validation...")

    docs_root = Path(__file__).parent.parent.parent / "docs"

    if not docs_root.exists():
        print(f"❌ Documentation directory not found: {docs_root}")
        sys.exit(1)

    # Run validation
    validator = DocumentationValidator(docs_root)
    report = validator.validate_all()

    # Save report
    output_dir = Path(__file__).parent / "validation_reports"
    output_dir.mkdir(exist_ok=True)

    timestamp = Path(__file__).stat().st_mtime
    report_path = output_dir / f"validation_report_{int(timestamp)}.json"

    save_validation_report(report, report_path)

    # Print summary
    print("\n📊 Validation Summary:")
    print(f"   Status: {report['summary']['status']}")
    print(f"   Issues: {report['summary']['total_issues']}")
    print(f"   Errors: {report['summary']['errors']}")
    print(f"   Warnings: {report['summary']['warnings']}")

    # Exit with error code if validation failed
    if report["summary"]["errors"] > 0:
        print("\n❌ Validation failed!")
        sys.exit(1)
    else:
        print("\n✅ Validation passed!")
        sys.exit(0)


if __name__ == "__main__":
    main()
