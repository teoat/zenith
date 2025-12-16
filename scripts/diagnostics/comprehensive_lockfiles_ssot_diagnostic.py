#!/usr/bin/env python3
"""
Comprehensive Lockfiles and SSOT Diagnostic System
Investigates and diagnoses the complete status of lockfiles and SSOT systems
"""

import json
import hashlib
from datetime import datetime
from pathlib import Path
from typing import Dict, List, Any, Tuple

class LockfilesSSOTDiagnostic:
    """Comprehensive diagnostic system for lockfiles and SSOT"""

    def __init__(self):
        self.diagnostic_results = {}
        self.lockfiles_found = []
        self.checksum_issues = []
        self.ssot_integrity_status = {}
        self.coverage_analysis = {}

    def generate_checksum(self, data: str) -> str:
        """Generate SHA256 checksum for data integrity"""
        return hashlib.sha256(data.encode()).hexdigest()

    def verify_checksum(self, file_path: Path, checksum_path: Path) -> Tuple[bool, str, str]:
        """Verify file checksum integrity"""
        try:
            # Read file content
            with open(file_path, 'r') as f:
                content = f.read()

            # Read expected checksum
            with open(checksum_path, 'r') as f:
                expected_checksum = f.read().strip()

            # Generate actual checksum
            actual_checksum = self.generate_checksum(content)

            # Compare
            is_valid = actual_checksum == expected_checksum

            return is_valid, actual_checksum, expected_checksum

        except Exception as e:
            return False, "", str(e)

    def scan_lockfiles(self) -> Dict[str, Any]:
        """Scan all lockfiles in the project"""
        lockfiles_scan = {
            "total_lockfiles": 0,
            "lockfiles_with_checksums": 0,
            "lockfiles_missing_checksums": 0,
            "checksum_validation_results": {},
            "missing_checksums": []
        }

        # Find all .lock files
        lockfiles = list(Path(".").glob("*.lock"))

        for lockfile in lockfiles:
            lockfiles_scan["total_lockfiles"] += 1
            self.lockfiles_found.append(lockfile.name)

            checksum_file = Path(f"{lockfile}.checksum")
            if checksum_file.exists():
                lockfiles_scan["lockfiles_with_checksums"] += 1

                is_valid, actual, expected = self.verify_checksum(lockfile, checksum_file)
                lockfiles_scan["checksum_validation_results"][lockfile.name] = {
                    "has_checksum": True,
                    "checksum_valid": is_valid,
                    "actual_checksum": actual,
                    "expected_checksum": expected
                }

                if not is_valid:
                    self.checksum_issues.append(lockfile.name)

            else:
                lockfiles_scan["lockfiles_missing_checksums"] += 1
                lockfiles_scan["missing_checksums"].append(lockfile.name)
                lockfiles_scan["checksum_validation_results"][lockfile.name] = {
                    "has_checksum": False,
                    "checksum_valid": False
                }

        return lockfiles_scan

    def analyze_ssot_integrity(self) -> Dict[str, Any]:
        """Analyze SSOT system integrity and coverage"""
        ssot_analysis = {
            "ssot_master_exists": False,
            "ssot_master_checksum_valid": False,
            "total_ssot_entries": 0,
            "ssot_categories": {},
            "critical_areas_coverage": {},
            "checksum_validation": {},
            "version_distribution": {},
            "dependency_analysis": {}
        }

        # Check SSOT master file
        ssot_master_path = Path("ssot_master.json")
        if ssot_master_path.exists():
            ssot_analysis["ssot_master_exists"] = True

            # Verify checksum
            checksum_path = Path("ssot_master.json.checksum")
            if checksum_path.exists():
                is_valid, actual, expected = self.verify_checksum(ssot_master_path, checksum_path)
                ssot_analysis["ssot_master_checksum_valid"] = is_valid
                ssot_analysis["checksum_validation"] = {
                    "valid": is_valid,
                    "actual": actual,
                    "expected": expected
                }

            # Analyze SSOT content
            with open(ssot_master_path, 'r') as f:
                ssot_data = json.load(f)

            ssot_analysis["total_ssot_entries"] = len(ssot_data)

            # Categorize entries
            categories = {}
            versions = {}
            critical_areas_found = []

            for key, entry in ssot_data.items():
                # Extract category from key
                category = key.split(".")[0] if "." in key else "general"
                categories[category] = categories.get(category, 0) + 1

                # Track versions
                version = entry.get("version", "unknown")
                versions[version] = versions.get(version, 0) + 1

                # Check for critical areas
                if "critical_areas" in key:
                    critical_areas_found.append(key)

                # Verify entry checksum
                entry_str = json.dumps(entry, sort_keys=True)
                expected_checksum = entry.get("checksum", "")
                actual_checksum = self.generate_checksum(entry_str)

                if actual_checksum != expected_checksum:
                    ssot_analysis["checksum_validation"][key] = {
                        "entry_checksum_valid": False,
                        "actual": actual_checksum,
                        "expected": expected_checksum
                    }

            ssot_analysis["ssot_categories"] = categories
            ssot_analysis["version_distribution"] = versions
            ssot_analysis["critical_areas_coverage"] = {
                "entries_found": len(critical_areas_found),
                "entries_list": critical_areas_found
            }

        return ssot_analysis

    def analyze_coverage_completeness(self) -> Dict[str, Any]:
        """Analyze completeness of coverage across all systems"""
        coverage_analysis = {
            "lockfiles_coverage": {},
            "ssot_coverage": {},
            "integration_status": {},
            "gaps_identified": [],
            "recommendations": []
        }

        # Check lockfiles coverage
        expected_lockfiles = [
            "api_schemas.lock",
            "configurations.lock",
            "critical_areas.lock",
            "database_schema.lock",
            "dependencies.lock",
            "environments.lock",
            "security_policies.lock"
        ]

        existing_lockfiles = [f for f in expected_lockfiles if Path(f).exists()]
        missing_lockfiles = [f for f in expected_lockfiles if not Path(f).exists()]

        coverage_analysis["lockfiles_coverage"] = {
            "expected": len(expected_lockfiles),
            "existing": len(existing_lockfiles),
            "missing": len(missing_lockfiles),
            "missing_files": missing_lockfiles,
            "coverage_percentage": (len(existing_lockfiles) / len(expected_lockfiles)) * 100
        }

        # Check SSOT coverage for critical areas
        critical_areas_expected = [
            "network_security",
            "ai_ml_governance",
            "incident_response",
            "data_pipeline_health",
            "third_party_risk"
        ]

        ssot_master_path = Path("ssot_master.json")
        ssot_covered_areas = []

        if ssot_master_path.exists():
            with open(ssot_master_path, 'r') as f:
                ssot_data = json.load(f)

            for area in critical_areas_expected:
                area_key = f"critical_areas.{area}.enabled"
                if area_key in ssot_data:
                    ssot_covered_areas.append(area)

        coverage_analysis["ssot_coverage"] = {
            "expected_critical_areas": len(critical_areas_expected),
            "ssot_covered_areas": len(ssot_covered_areas),
            "coverage_percentage": (len(ssot_covered_areas) / len(critical_areas_expected)) * 100,
            "uncovered_areas": [a for a in critical_areas_expected if a not in ssot_covered_areas]
        }

        # Integration status
        coverage_analysis["integration_status"] = {
            "ssot_lockfile_integration": Path("ssot_master.json.checksum").exists(),
            "critical_areas_lockfile_exists": Path("critical_areas.lock").exists(),
            "dependencies_lockfile_updated": Path("dependencies.lock").exists()
        }

        # Identify gaps
        if missing_lockfiles:
            coverage_analysis["gaps_identified"].append(f"Missing lockfiles: {missing_lockfiles}")

        if coverage_analysis["ssot_coverage"]["uncovered_areas"]:
            coverage_analysis["gaps_identified"].append(f"Uncovered SSOT areas: {coverage_analysis['ssot_coverage']['uncovered_areas']}")

        if self.checksum_issues:
            coverage_analysis["gaps_identified"].append(f"Checksum validation failures: {self.checksum_issues}")

        # Generate recommendations
        if missing_lockfiles:
            coverage_analysis["recommendations"].append("Create missing lockfiles with proper checksums")

        if coverage_analysis["ssot_coverage"]["uncovered_areas"]:
            coverage_analysis["recommendations"].append("Add SSOT configurations for uncovered critical areas")

        if self.checksum_issues:
            coverage_analysis["recommendations"].append("Fix checksum validation failures and regenerate checksums")

        coverage_analysis["recommendations"].append("Implement automated integrity monitoring for all lockfiles and SSOT")

        return coverage_analysis

    def run_comprehensive_diagnostic(self) -> Dict[str, Any]:
        """Run complete diagnostic analysis"""
        print("🔬 COMPREHENSIVE LOCKFILES & SSOT DIAGNOSTIC")
        print("=" * 60)

        # Run all diagnostic components
        lockfiles_scan = self.scan_lockfiles()
        ssot_analysis = self.analyze_ssot_integrity()
        coverage_analysis = self.analyze_coverage_completeness()

        # Compile final results
        comprehensive_results = {
            "diagnostic_timestamp": datetime.now().isoformat(),
            "diagnostic_version": "1.0.0",
            "lockfiles_scan": lockfiles_scan,
            "ssot_analysis": ssot_analysis,
            "coverage_analysis": coverage_analysis,
            "overall_health_score": 0,
            "critical_issues": [],
            "recommendations": []
        }

        # Calculate overall health score
        health_components = [
            lockfiles_scan["lockfiles_with_checksums"] / lockfiles_scan["total_lockfiles"] * 100,
            100 if ssot_analysis["ssot_master_exists"] else 0,
            100 if ssot_analysis["ssot_master_checksum_valid"] else 0,
            coverage_analysis["lockfiles_coverage"]["coverage_percentage"],
            coverage_analysis["ssot_coverage"]["coverage_percentage"]
        ]

        comprehensive_results["overall_health_score"] = sum(health_components) / len(health_components)

        # Identify critical issues
        if lockfiles_scan["lockfiles_missing_checksums"] > 0:
            comprehensive_results["critical_issues"].append("Missing checksums for lockfiles")

        if not ssot_analysis["ssot_master_checksum_valid"]:
            comprehensive_results["critical_issues"].append("SSOT master checksum validation failed")

        if coverage_analysis["ssot_coverage"]["coverage_percentage"] < 100:
            comprehensive_results["critical_issues"].append("Incomplete SSOT coverage for critical areas")

        # Compile all recommendations
        comprehensive_results["recommendations"] = coverage_analysis["recommendations"]

        return comprehensive_results

    def generate_diagnostic_report(self, results: Dict[str, Any]) -> None:
        """Generate comprehensive diagnostic report"""

        report_path = Path("comprehensive_lockfiles_ssot_diagnostic_report.json")
        with open(report_path, 'w') as f:
            json.dump(results, f, indent=2)

        # Generate human-readable summary
        summary_path = Path("LOCKFILES_SSOT_DIAGNOSTIC_SUMMARY.md")
        with open(summary_path, 'w') as f:
            f.write("# 🔬 COMPREHENSIVE LOCKFILES & SSOT DIAGNOSTIC REPORT\n\n")
            f.write(f"**Diagnostic Timestamp:** {results['diagnostic_timestamp']}\n")
            f.write(f"**Overall Health Score:** {results['overall_health_score']:.1f}%\n\n")

            f.write("## 📊 LOCKFILES SCAN RESULTS\n\n")
            lockfiles = results['lockfiles_scan']
            f.write(f"- **Total Lockfiles:** {lockfiles['total_lockfiles']}\n")
            f.write(f"- **With Checksums:** {lockfiles['lockfiles_with_checksums']}\n")
            f.write(f"- **Missing Checksums:** {lockfiles['lockfiles_missing_checksums']}\n")
            if lockfiles['missing_checksums']:
                f.write(f"- **Missing Checksum Files:** {', '.join(lockfiles['missing_checksums'])}\n")
            f.write("\n")

            f.write("## 🔒 SSOT ANALYSIS RESULTS\n\n")
            ssot = results['ssot_analysis']
            f.write(f"- **SSOT Master Exists:** {'✅' if ssot['ssot_master_exists'] else '❌'}\n")
            f.write(f"- **Checksum Valid:** {'✅' if ssot['ssot_master_checksum_valid'] else '❌'}\n")
            f.write(f"- **Total SSOT Entries:** {ssot['total_ssot_entries']}\n")
            f.write(f"- **Critical Areas Coverage:** {ssot['critical_areas_coverage']['entries_found']} entries\n")
            f.write("\n")

            f.write("## 📈 COVERAGE ANALYSIS\n\n")
            coverage = results['coverage_analysis']
            f.write(f"- **Lockfiles Coverage:** {coverage['lockfiles_coverage']['coverage_percentage']:.1f}%\n")
            f.write(f"- **SSOT Coverage:** {coverage['ssot_coverage']['coverage_percentage']:.1f}%\n")
            if coverage['ssot_coverage']['uncovered_areas']:
                f.write(f"- **Uncovered Areas:** {', '.join(coverage['ssot_coverage']['uncovered_areas'])}\n")
            f.write("\n")

            f.write("## 🚨 CRITICAL ISSUES\n\n")
            if results['critical_issues']:
                for issue in results['critical_issues']:
                    f.write(f"- ❌ {issue}\n")
            else:
                f.write("✅ No critical issues identified\n")
            f.write("\n")

            f.write("## 💡 RECOMMENDATIONS\n\n")
            for rec in results['recommendations']:
                f.write(f"- 🔧 {rec}\n")
            f.write("\n")

            f.write("## 📁 FILES GENERATED\n\n")
            f.write(f"- `{report_path}` - Complete JSON diagnostic results\n")
            f.write(f"- `{summary_path}` - Human-readable summary (this file)\n")
            f.write("\n")

            if results['overall_health_score'] >= 95:
                f.write("## ✅ CONCLUSION: EXCELLENT HEALTH\n\n")
                f.write("Lockfiles and SSOT systems are in excellent condition with comprehensive coverage and integrity.\n")
            elif results['overall_health_score'] >= 80:
                f.write("## ⚠️ CONCLUSION: GOOD HEALTH WITH MINOR ISSUES\n\n")
                f.write("Systems are generally healthy but require attention to identified issues.\n")
            else:
                f.write("## 🚨 CONCLUSION: REQUIRES IMMEDIATE ATTENTION\n\n")
                f.write("Critical issues identified that require immediate remediation.\n")

        print("✅ COMPREHENSIVE DIAGNOSTIC COMPLETED")
        print(f"📊 Overall Health Score: {results['overall_health_score']:.1f}%")
        print(f"📁 Reports saved to: {report_path} and {summary_path}")

def main():
    diagnostic = LockfilesSSOTDiagnostic()
    results = diagnostic.run_comprehensive_diagnostic()
    diagnostic.generate_diagnostic_report(results)

    return results

if __name__ == "__main__":
    main()