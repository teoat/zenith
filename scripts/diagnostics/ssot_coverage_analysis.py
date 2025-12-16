#!/usr/bin/env python3
"""
Comprehensive File Analysis and SSOT Coverage Diagnostic
Analyzes all project files and evaluates SSOT/lockfile coverage
"""

import os
import sys
import json
import hashlib
from pathlib import Path
from typing import Dict, List, Any, Tuple, Set
from dataclasses import dataclass, field
from enum import Enum

# Add project root to path
project_root = Path(__file__).parent.parent.parent
sys.path.insert(0, str(project_root))

class FileCategory(Enum):
    """File criticality categories"""
    CRITICAL = "critical"          # Core business logic, security, API contracts
    HIGH = "high"                 # Important infrastructure, configuration
    MEDIUM = "medium"             # Supporting services, utilities
    LOW = "low"                   # Documentation, tests, examples
    IGNORE = "ignore"             # Generated files, dependencies, logs

class ProtectionStatus(Enum):
    """Current protection status"""
    SSOT_LOCKED = "ssot_locked"    # Currently protected by SSOT/lockfile
    SHOULD_LOCK = "should_lock"    # Should be protected but isn't
    NO_PROTECT = "no_protect"      # Doesn't need protection
    DEPRECATED = "deprecated"      # Old/unused files

@dataclass
class FileAnalysis:
    """Analysis result for a single file"""
    path: str
    category: FileCategory
    protection_status: ProtectionStatus
    size_bytes: int
    checksum: str
    last_modified: str
    dependencies: List[str] = field(default_factory=list)
    risk_score: int = 0
    reason: str = ""

@dataclass
class CoverageAnalysis:
    """Overall coverage analysis"""
    total_files: int = 0
    critical_files: int = 0
    high_files: int = 0
    medium_files: int = 0
    low_files: int = 0
    ignore_files: int = 0

    ssot_locked: int = 0
    should_lock: int = 0
    no_protect: int = 0
    deprecated: int = 0

    coverage_score: float = 0.0
    risk_score: int = 0

class ComprehensiveFileAnalyzer:
    """Comprehensive file analyzer for SSOT coverage"""

    def __init__(self):
        self.project_root = project_root
        self.analysis_results: Dict[str, FileAnalysis] = {}

        # Load existing SSOT/lockfile data
        self.existing_ssot_files = self._load_existing_ssot_files()
        self.existing_lockfiles = self._load_existing_lockfiles()

        # Define file patterns and their categories
        self.file_patterns = {
            # CRITICAL - Core business logic and security
            FileCategory.CRITICAL: [
                # Fraud detection core
                "data/fraud_rules.json",
                "backend/app/services/fraud_service.py",
                "backend/core/security/rbac.py",

                # Authentication & security
                "backend/app/services/auth_service.py",
                "backend/core/security/__init__.py",
                "backend/core/encryption.py",

                # API contracts
                "backend/main.py",
                "backend/app/routers/identity.py",
                "backend/app/routers/fraud.py",

                # Database schema
                "backend/core/database.py",
                "backend/app/services/database_service.py",

                # Critical frontend
                "frontend/src/pages/Dashboard.tsx",
                "frontend/src/utils/api.ts",
            ],

            # HIGH - Important infrastructure
            FileCategory.HIGH: [
                # Configuration files
                ".env.production",
                "config/production.py",
                "infrastructure/docker-compose.production.yml",

                # Core services
                "backend/app/services/*.py",
                "backend/core/*.py",
                "frontend/src/components/cases/*.tsx",
                "frontend/src/pages/*.tsx",

                # Security configurations
                "backend/core/security/*.py",
                "scripts/security/*.sh",

                # Infrastructure
                "Dockerfile*",
                "infrastructure/*.yml",
                "scripts/setup-production.sh",
                "scripts/validate-production.sh",
            ],

            # MEDIUM - Supporting services
            FileCategory.MEDIUM: [
                # Additional routers
                "backend/app/routers/*.py",

                # Utilities
                "backend/core/*.py",
                "frontend/src/utils/*.ts",
                "frontend/src/components/ui/*.tsx",

                # Testing infrastructure
                "scripts/testing/*.py",
                "tests/**/*.py",
                "frontend/tests/**/*.ts",

                # Documentation
                "docs/**/*.md",
                "README.md",

                # Scripts
                "scripts/**/*.sh",
                "scripts/**/*.py",
            ],

            # LOW - Documentation and examples
            FileCategory.LOW: [
                # All other documentation
                "docs/**/*.md",
                "*.md",

                # Examples and templates
                "**/example*",
                "**/template*",
                "**/*.example",

                # Configuration examples
                "**/*.example.*",
                "**/*.template.*",
            ],

            # IGNORE - Generated files and artifacts
            FileCategory.IGNORE: [
                # Build artifacts
                "node_modules/**",
                "dist/**",
                "__pycache__/**",
                "*.pyc",
                "*.pyo",

                # Logs and temporary files
                "*.log",
                "*.tmp",
                "*.swp",
                ".DS_Store",

                # Generated files
                "scripts/diagnostics/*.lock",
                "scripts/diagnostics/*.json",
                "**/coverage/**",
                "**/.next/**",
                "**/build/**",

                # Test artifacts
                "**/test-results/**",
                "**/playwright-report/**",
                "**/.pytest_cache/**",
            ]
        }

    def _load_existing_ssot_files(self) -> Set[str]:
        """Load currently SSOT protected files"""
        ssot_files = set()

        # Load from SSOT master
        ssot_master = self.project_root / "scripts" / "diagnostics" / "ssot_master.json"
        if ssot_master.exists():
            try:
                with open(ssot_master, 'r') as f:
                    data = json.load(f)
                    # SSOT master contains system metrics, not file paths
                    pass
            except:
                pass

        # Load from lockfiles
        lockfile_dir = self.project_root / "scripts" / "diagnostics"
        for lockfile in lockfile_dir.glob("*.lock"):
            if lockfile.exists():
                try:
                    with open(lockfile, 'r') as f:
                        data = json.load(f)
                        if "files" in data:
                            for filename in data["files"].keys():
                                ssot_files.add(filename)
                except:
                    pass

        return ssot_files

    def _load_existing_lockfiles(self) -> Dict[str, Any]:
        """Load existing lockfile data"""
        lockfiles = {}

        lockfile_dir = self.project_root / "scripts" / "diagnostics"
        for lockfile in lockfile_dir.glob("*.lock"):
            try:
                with open(lockfile, 'r') as f:
                    lockfiles[lockfile.name] = json.load(f)
            except:
                pass

        return lockfiles

    def _calculate_file_category(self, file_path: Path) -> Tuple[FileCategory, str]:
        """Determine file category and reason"""
        file_str = str(file_path)

        # Check ignore patterns first
        for pattern in self.file_patterns[FileCategory.IGNORE]:
            if Path(file_str).match(pattern):
                return FileCategory.IGNORE, f"Matches ignore pattern: {pattern}"

        # Check critical patterns
        for pattern in self.file_patterns[FileCategory.CRITICAL]:
            if Path(file_str).match(pattern):
                return FileCategory.CRITICAL, f"Core business logic/security/API contract"

        # Check high priority patterns
        for pattern in self.file_patterns[FileCategory.HIGH]:
            if Path(file_str).match(pattern):
                return FileCategory.HIGH, f"Important infrastructure/configuration"

        # Check medium priority patterns
        for pattern in self.file_patterns[FileCategory.MEDIUM]:
            if Path(file_str).match(pattern):
                return FileCategory.MEDIUM, f"Supporting services/utilities"

        # Default to low priority
        return FileCategory.LOW, "Documentation/examples/supporting files"

    def _calculate_protection_status(self, file_path: Path, category: FileCategory) -> ProtectionStatus:
        """Determine if file should be protected"""
        filename = file_path.name

        # Check if already protected
        if filename in self.existing_ssot_files:
            return ProtectionStatus.SSOT_LOCKED

        # Critical files should always be protected
        if category == FileCategory.CRITICAL:
            return ProtectionStatus.SHOULD_LOCK

        # High priority files should be protected
        if category == FileCategory.HIGH:
            return ProtectionStatus.SHOULD_LOCK

        # Medium priority - selective protection
        if category == FileCategory.MEDIUM:
            # Protect key service files
            if any(keyword in str(file_path) for keyword in [
                "service", "router", "model", "config", "security", "auth"
            ]):
                return ProtectionStatus.SHOULD_LOCK

        # Others don't need protection
        return ProtectionStatus.NO_PROTECT

    def _calculate_risk_score(self, file_path: Path, category: FileCategory, protection: ProtectionStatus) -> int:
        """Calculate risk score for unprotected critical files"""
        base_score = 0

        # Category-based scoring
        if category == FileCategory.CRITICAL:
            base_score = 100
        elif category == FileCategory.HIGH:
            base_score = 75
        elif category == FileCategory.MEDIUM:
            base_score = 50
        elif category == FileCategory.LOW:
            base_score = 25

        # Protection status modifier
        if protection == ProtectionStatus.SSOT_LOCKED:
            base_score = max(0, base_score - 20)  # Reduce risk if protected
        elif protection == ProtectionStatus.SHOULD_LOCK:
            base_score += 25  # Increase risk if should be protected but isn't

        # File type modifiers
        if file_path.suffix in ['.py', '.ts', '.tsx', '.js']:
            base_score += 10  # Code files higher risk

        if any(keyword in str(file_path) for keyword in [
            'security', 'auth', 'encryption', 'database', 'api'
        ]):
            base_score += 15  # Security-related higher risk

        return min(100, base_score)

    def analyze_file(self, file_path: Path) -> FileAnalysis:
        """Analyze a single file"""
        try:
            stat = file_path.stat()
            category, reason = self._calculate_file_category(file_path)
            protection = self._calculate_protection_status(file_path, category)
            risk_score = self._calculate_risk_score(file_path, category, protection)

            # Calculate checksum
            checksum = ""
            try:
                with open(file_path, 'rb') as f:
                    checksum = hashlib.sha256(f.read()).hexdigest()
            except:
                checksum = "error_calculating"

            return FileAnalysis(
                path=str(file_path.relative_to(self.project_root)),
                category=category,
                protection_status=protection,
                size_bytes=stat.st_size,
                checksum=checksum,
                last_modified=str(stat.st_mtime),
                risk_score=risk_score,
                reason=reason
            )
        except Exception as e:
            return FileAnalysis(
                path=str(file_path.relative_to(self.project_root)),
                category=FileCategory.IGNORE,
                protection_status=ProtectionStatus.NO_PROTECT,
                size_bytes=0,
                checksum="",
                last_modified="",
                risk_score=0,
                reason=f"Error analyzing: {str(e)}"
            )

    def analyze_all_files(self) -> CoverageAnalysis:
        """Analyze all project files"""
        coverage = CoverageAnalysis()

        # Directories to scan
        scan_dirs = ["backend", "frontend", "scripts", "docs", "infrastructure"]

        for scan_dir in scan_dirs:
            dir_path = self.project_root / scan_dir
            if not dir_path.exists():
                continue

            for file_path in dir_path.rglob("*"):
                if not file_path.is_file():
                    continue

                # Skip unwanted files
                if any(skip in str(file_path) for skip in [
                    "node_modules", "__pycache__", ".git", "dist", ".next",
                    "build", "coverage", "test-results", ".pytest_cache"
                ]):
                    continue

                # Only analyze relevant file types
                if file_path.suffix.lower() not in [
                    '.py', '.ts', '.tsx', '.js', '.json', '.md', '.sh', '.yml', '.yaml'
                ] and not file_path.name.startswith('Dockerfile'):
                    continue

                analysis = self.analyze_file(file_path)
                self.analysis_results[analysis.path] = analysis
                coverage.total_files += 1

                # Update category counts
                if analysis.category == FileCategory.CRITICAL:
                    coverage.critical_files += 1
                elif analysis.category == FileCategory.HIGH:
                    coverage.high_files += 1
                elif analysis.category == FileCategory.MEDIUM:
                    coverage.medium_files += 1
                elif analysis.category == FileCategory.LOW:
                    coverage.low_files += 1
                else:
                    coverage.ignore_files += 1

                # Update protection counts
                if analysis.protection_status == ProtectionStatus.SSOT_LOCKED:
                    coverage.ssot_locked += 1
                elif analysis.protection_status == ProtectionStatus.SHOULD_LOCK:
                    coverage.should_lock += 1
                elif analysis.protection_status == ProtectionStatus.NO_PROTECT:
                    coverage.no_protect += 1
                else:
                    coverage.deprecated += 1

                # Accumulate risk score
                coverage.risk_score += analysis.risk_score

        # Calculate coverage score
        if coverage.critical_files + coverage.high_files > 0:
            protected_critical_high = sum(1 for analysis in self.analysis_results.values()
                                        if analysis.category in [FileCategory.CRITICAL, FileCategory.HIGH]
                                        and analysis.protection_status == ProtectionStatus.SSOT_LOCKED)
            total_critical_high = coverage.critical_files + coverage.high_files
            coverage.coverage_score = (protected_critical_high / total_critical_high) * 100 if total_critical_high > 0 else 100.0

        return coverage

    def generate_report(self, coverage: CoverageAnalysis) -> Dict[str, Any]:
        """Generate comprehensive analysis report"""
        report = {
            "timestamp": str(Path(__file__).stat().st_mtime),
            "coverage_analysis": {
                "total_files_analyzed": coverage.total_files,
                "category_breakdown": {
                    "critical": coverage.critical_files,
                    "high": coverage.high_files,
                    "medium": coverage.medium_files,
                    "low": coverage.low_files,
                    "ignore": coverage.ignore_files
                },
                "protection_breakdown": {
                    "ssot_locked": coverage.ssot_locked,
                    "should_lock": coverage.should_lock,
                    "no_protect": coverage.no_protect,
                    "deprecated": coverage.deprecated
                },
                "coverage_score": round(coverage.coverage_score, 2),
                "total_risk_score": coverage.risk_score,
                "average_risk_per_file": round(coverage.risk_score / coverage.total_files, 2) if coverage.total_files > 0 else 0
            },
            "recommendations": [],
            "critical_gaps": [],
            "file_analysis": {}
        }

        # Generate recommendations
        if coverage.should_lock > 0:
            report["recommendations"].append(
                f"🔴 CRITICAL: {coverage.should_lock} files should be SSOT protected but aren't"
            )

        critical_unprotected = [path for path, analysis in self.analysis_results.items()
                              if analysis.category == FileCategory.CRITICAL
                              and analysis.protection_status == ProtectionStatus.SHOULD_LOCK]

        if critical_unprotected:
            report["critical_gaps"].extend(critical_unprotected[:10])  # Top 10
            report["recommendations"].append(
                f"🚨 IMMEDIATE: {len(critical_unprotected)} critical files unprotected"
            )

        # Coverage scoring
        if coverage.coverage_score >= 90:
            report["recommendations"].append("✅ EXCELLENT: Critical file coverage >= 90%")
        elif coverage.coverage_score >= 75:
            report["recommendations"].append("🟡 GOOD: Critical file coverage >= 75%")
        else:
            report["recommendations"].append(f"🔴 POOR: Critical file coverage only {coverage.coverage_score}%")

        # Risk assessment
        avg_risk = coverage.risk_score / coverage.total_files if coverage.total_files > 0 else 0
        if avg_risk > 70:
            report["recommendations"].append(f"🚨 HIGH RISK: Average risk score {avg_risk:.1f}/100")
        elif avg_risk > 50:
            report["recommendations"].append(f"🟡 MEDIUM RISK: Average risk score {avg_risk:.1f}/100")
        else:
            report["recommendations"].append(f"✅ LOW RISK: Average risk score {avg_risk:.1f}/100")

        # Add top risk files
        high_risk_files = sorted(
            [(path, analysis) for path, analysis in self.analysis_results.items()],
            key=lambda x: x[1].risk_score,
            reverse=True
        )[:10]

        report["top_risk_files"] = [
            {
                "file": path,
                "category": analysis.category.value,
                "risk_score": analysis.risk_score,
                "reason": analysis.reason
            }
            for path, analysis in high_risk_files if analysis.risk_score > 0
        ]

        # Add detailed file analysis (summary only)
        report["file_analysis"] = {
            "total_analyzed": len(self.analysis_results),
            "by_category": {},
            "by_protection": {}
        }

        for analysis in self.analysis_results.values():
            cat = analysis.category.value
            prot = analysis.protection_status.value

            if cat not in report["file_analysis"]["by_category"]:
                report["file_analysis"]["by_category"][cat] = 0
            report["file_analysis"]["by_category"][cat] += 1

            if prot not in report["file_analysis"]["by_protection"]:
                report["file_analysis"]["by_protection"][prot] = 0
            report["file_analysis"]["by_protection"][prot] += 1

        return report

def main():
    """Main analysis function"""
    analyzer = ComprehensiveFileAnalyzer()

    print("🔍 Comprehensive SSOT Coverage Analysis")
    print("=" * 50)

    # Analyze all files
    print("📊 Analyzing project files...")
    coverage = analyzer.analyze_all_files()

    # Generate report
    print("📋 Generating analysis report...")
    report = analyzer.generate_report(coverage)

    # Display summary
    print("\n📈 ANALYSIS SUMMARY")
    print("=" * 30)
    print(f"Total Files Analyzed: {coverage.total_files}")
    print(f"Critical Files: {coverage.critical_files}")
    print(f"High Priority: {coverage.high_files}")
    print(f"Medium Priority: {coverage.medium_files}")
    print(f"Low Priority: {coverage.low_files}")
    print(f"Ignored: {coverage.ignore_files}")
    print()
    print(f"SSOT Protected: {coverage.ssot_locked}")
    print(f"Should Protect: {coverage.should_lock}")
    print(f"No Protection Needed: {coverage.no_protect}")
    print(f"Deprecated: {coverage.deprecated}")
    print()
    print(f"Coverage Score: {coverage.coverage_score:.1f}%")
    print(f"Total Risk Score: {coverage.risk_score}")
    print(f"Average Risk/File: {coverage.risk_score / coverage.total_files:.1f}" if coverage.total_files > 0 else "N/A")

    # Display recommendations
    print("\n🔧 RECOMMENDATIONS")
    print("=" * 20)
    for rec in report["recommendations"]:
        print(f"• {rec}")

    # Display critical gaps
    if report["critical_gaps"]:
        print("\n🚨 CRITICAL GAPS")
        print("=" * 18)
        for gap in report["critical_gaps"][:5]:  # Show first 5
            analysis = analyzer.analysis_results.get(gap)
            if analysis:
                print(f"• {gap} (Risk: {analysis.risk_score})")

    # Display top risk files
    if report["top_risk_files"]:
        print("\n⚠️ TOP RISK FILES")
        print("=" * 17)
        for risk_file in report["top_risk_files"][:5]:  # Show top 5
            print(f"• {risk_file['file']} (Risk: {risk_file['risk_score']})")

    # Save detailed report
    output_file = project_root / "scripts" / "diagnostics" / "ssot_coverage_analysis.json"
    with open(output_file, 'w') as f:
        json.dump(report, f, indent=2, default=str)

    print(f"\n💾 Detailed report saved to: {output_file}")

    # Exit with appropriate code
    if coverage.should_lock > 0 or coverage.coverage_score < 75:
        sys.exit(1)  # Issues found
    else:
        sys.exit(0)  # All good

if __name__ == "__main__":
    main()