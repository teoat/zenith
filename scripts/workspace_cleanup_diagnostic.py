#!/usr/bin/env python3
"""
Workspace Duplication and Unused Files Diagnostic System
Comprehensive analysis of duplications, unused files, and cleanup opportunities
"""

import ast
import hashlib
import json
import re
from collections import defaultdict
from pathlib import Path
from typing import Any, Dict, List, Set, Tuple


class WorkspaceDiagnostic:
    """Comprehensive workspace diagnostic system"""

    def __init__(self):
        self.file_hashes: dict[str, list[str]] = defaultdict(list)
        self.duplicate_files: list[tuple[str, list[str]]] = []
        self.unused_imports: dict[str, list[str]] = {}
        self.orphaned_files: list[str] = []
        self.redundant_configs: list[dict[str, Any]] = []
        self.similar_files: list[tuple[str, str, float]] = []
        self.file_references: dict[str, set[str]] = defaultdict(set)

    def calculate_file_hash(self, filepath: Path) -> str:
        """Calculate SHA256 hash of file content"""
        try:
            with open(filepath, "rb") as f:
                return hashlib.sha256(f.read()).hexdigest()
        except Exception:
            return ""

    def find_exact_duplicates(
        self, directories: list[str]
    ) -> list[tuple[str, list[str]]]:
        """Find files with identical content"""
        print("🔍 Scanning for exact duplicate files...")

        file_hashes = defaultdict(list)

        for directory in directories:
            dir_path = Path(directory)
            if not dir_path.exists():
                continue

            for filepath in dir_path.rglob("*"):
                if filepath.is_file() and not self._is_excluded_file(filepath):
                    file_hash = self.calculate_file_hash(filepath)
                    if file_hash:
                        file_hashes[file_hash].append(str(filepath))

        # Find duplicates (more than one file with same hash)
        duplicates = []
        for file_hash, files in file_hashes.items():
            if len(files) > 1:
                duplicates.append((file_hash, files))

        print(f"📊 Found {len(duplicates)} sets of exact duplicate files")
        return duplicates

    def find_similar_files(
        self, directories: list[str], threshold: float = 0.8
    ) -> list[tuple[str, str, float]]:
        """Find files with similar names (potential duplicates)"""
        print("🔍 Scanning for files with similar names...")

        similar_pairs = []

        # Group files by similar names
        name_groups = defaultdict(list)

        for directory in directories:
            dir_path = Path(directory)
            if not dir_path.exists():
                continue

            for filepath in dir_path.rglob("*"):
                if filepath.is_file() and not self._is_excluded_file(filepath):
                    # Normalize filename for comparison
                    name = self._normalize_filename(filepath.name)
                    name_groups[name].append(str(filepath))

        # Find groups with multiple files
        for name, files in name_groups.items():
            if len(files) > 1:
                # Calculate similarity between files in group
                for i, file1 in enumerate(files):
                    for file2 in files[i + 1 :]:
                        similarity = self._calculate_name_similarity(
                            Path(file1).name, Path(file2).name
                        )
                        if similarity >= threshold:
                            similar_pairs.append((file1, file2, similarity))

        print(f"📊 Found {len(similar_pairs)} pairs of similar files")
        return similar_pairs

    def _normalize_filename(self, filename: str) -> str:
        """Normalize filename for comparison"""
        # Remove extensions, numbers, and common suffixes
        name = filename.lower()
        name = re.sub(r"\d+", "", name)  # Remove numbers
        name = re.sub(r"\.(py|json|md|txt|yml|yaml)$", "", name)  # Remove extensions
        name = re.sub(
            r"(copy|backup|old|new|v\d+)$", "", name
        )  # Remove common suffixes
        name = re.sub(r"[-_\s]+", "", name)  # Remove separators
        return name.strip()

    def _calculate_name_similarity(self, name1: str, name2: str) -> float:
        """Calculate similarity between two filenames"""
        # Simple similarity based on common characters
        set1 = set(name1.lower())
        set2 = set(name2.lower())

        if not set1 or not set2:
            return 0.0

        intersection = len(set1.intersection(set2))
        union = len(set1.union(set2))

        return intersection / union if union > 0 else 0.0

    def analyze_unused_imports(self, directories: list[str]) -> dict[str, list[str]]:
        """Analyze Python files for unused imports"""
        print("🔍 Analyzing unused imports in Python files...")

        unused_imports = {}

        for directory in directories:
            dir_path = Path(directory)
            if not dir_path.exists():
                continue

            for filepath in dir_path.rglob("*.py"):
                if self._is_excluded_file(filepath):
                    continue

                try:
                    unused = self._find_unused_imports(filepath)
                    if unused:
                        unused_imports[str(filepath)] = unused
                except Exception as e:
                    print(f"⚠️ Error analyzing {filepath}: {e}")

        print(f"📊 Found unused imports in {len(unused_imports)} files")
        return unused_imports

    def _find_unused_imports(self, filepath: Path) -> list[str]:
        """Find unused imports in a Python file"""
        try:
            with open(filepath, encoding="utf-8") as f:
                content = f.read()

            # Parse AST
            tree = ast.parse(content)

            # Collect all imports
            imports = set()
            for node in ast.walk(tree):
                if isinstance(node, ast.Import):
                    for alias in node.names:
                        imports.add(alias.name.split(".")[0])
                elif isinstance(node, ast.ImportFrom) and node.module:
                    imports.add(node.module.split(".")[0])

            # Collect all used names
            used_names = set()
            for node in ast.walk(tree):
                if isinstance(node, ast.Name):
                    used_names.add(node.id)
                elif isinstance(node, ast.Attribute):
                    if isinstance(node.value, ast.Name):
                        used_names.add(node.value.id)

            # Find unused imports
            unused = []
            for imp in imports:
                if imp not in used_names and imp not in [
                    "os",
                    "sys",
                    "json",
                    "re",
                ]:  # Common standard library
                    unused.append(imp)

            return unused

        except Exception:
            return []

    def find_orphaned_files(self, directories: list[str]) -> list[str]:
        """Find files that are not referenced anywhere"""
        print("🔍 Searching for orphaned files...")

        # Build reference map
        self._build_reference_map(directories)

        orphaned = []

        for directory in directories:
            dir_path = Path(directory)
            if not dir_path.exists():
                continue

            for filepath in dir_path.rglob("*"):
                if filepath.is_file() and not self._is_excluded_file(filepath):
                    file_str = str(filepath)

                    # Check if file is referenced
                    if file_str not in self.file_references:
                        # Additional check: look for filename references
                        filename = filepath.name
                        found_reference = False

                        for references in self.file_references.values():
                            if filename in references:
                                found_reference = True
                                break

                        if not found_reference:
                            orphaned.append(file_str)

        print(f"📊 Found {len(orphaned)} potentially orphaned files")
        return orphaned

    def _build_reference_map(self, directories: list[str]):
        """Build map of file references"""
        for directory in directories:
            dir_path = Path(directory)
            if not dir_path.exists():
                continue

            for filepath in dir_path.rglob("*"):
                if filepath.is_file() and self._is_code_file(filepath):
                    try:
                        with open(filepath, encoding="utf-8") as f:
                            content = f.read()

                        # Find import statements and file references
                        imports = re.findall(r"(?:import|from)\s+([\w.]+)", content)
                        file_refs = re.findall(
                            r"[\w\-_]+\.(?:py|json|md|yml|yaml)", content
                        )

                        self.file_references[str(filepath)].update(imports)
                        self.file_references[str(filepath)].update(file_refs)

                    except Exception:
                        pass

    def analyze_redundant_configurations(
        self, directories: list[str]
    ) -> list[dict[str, Any]]:
        """Analyze redundant configuration files"""
        print("🔍 Analyzing redundant configurations...")

        redundant_configs = []

        # Look for multiple similar config files
        config_patterns = [
            ("requirements*.txt", "Python requirements files"),
            ("Dockerfile*", "Docker configuration files"),
            ("docker-compose*.yml", "Docker Compose files"),
            ("*.env*", "Environment configuration files"),
            ("*config*.json", "JSON configuration files"),
            ("*config*.yml", "YAML configuration files"),
        ]

        for pattern, description in config_patterns:
            config_files = []
            for directory in directories:
                dir_path = Path(directory)
                if dir_path.exists():
                    config_files.extend(list(dir_path.rglob(pattern)))

            if len(config_files) > 1:
                redundant_configs.append(
                    {
                        "type": description,
                        "pattern": pattern,
                        "files": [str(f) for f in config_files],
                        "count": len(config_files),
                        "recommendation": f"Consider consolidating {len(config_files)} {description.lower()}",
                    }
                )

        print(f"📊 Found {len(redundant_configs)} types of redundant configurations")
        return redundant_configs

    def analyze_duplicate_documentation(self) -> list[dict[str, Any]]:
        """Analyze duplicate or redundant documentation"""
        print("🔍 Analyzing duplicate documentation...")

        docs_dir = Path("docs")
        if not docs_dir.exists():
            return []

        duplicate_docs = []

        # Check for README files
        readme_files = list(docs_dir.rglob("README*"))
        if len(readme_files) > 1:
            duplicate_docs.append(
                {
                    "type": "README files",
                    "files": [str(f) for f in readme_files],
                    "issue": "Multiple README files found",
                    "recommendation": "Consolidate into single comprehensive README",
                }
            )

        # Check for similar documentation files
        doc_files = list(docs_dir.rglob("*.md"))
        similar_groups = defaultdict(list)

        for doc_file in doc_files:
            # Simple content-based similarity check
            try:
                with open(doc_file) as f:
                    content = f.read()[:1000]  # First 1000 chars
                    content_hash = hashlib.md5(content.encode()).hexdigest()[:8]
                    similar_groups[content_hash].append(str(doc_file))
            except Exception:
                pass

        for content_hash, files in similar_groups.items():
            if len(files) > 1:
                duplicate_docs.append(
                    {
                        "type": "Similar content documentation",
                        "files": files,
                        "issue": f"{len(files)} files with similar content",
                        "recommendation": "Review and consolidate duplicate documentation",
                    }
                )

        print(f"📊 Found {len(duplicate_docs)} documentation duplication issues")
        return duplicate_docs

    def _is_excluded_file(self, filepath: Path) -> bool:
        """Check if file should be excluded from analysis"""
        excluded_patterns = [
            "__pycache__",
            ".git",
            "node_modules",
            "venv",
            ".pytest_cache",
            "*.pyc",
            "*.pyo",
            "*.tmp",
            "logs/",
            "data/",
            "uploads/",
            "*.log",
        ]

        path_str = str(filepath)
        return any(pattern in path_str for pattern in excluded_patterns)

    def _is_code_file(self, filepath: Path) -> bool:
        """Check if file is a code file that can contain references"""
        return filepath.suffix in [".py", ".js", ".ts", ".json", ".yml", ".yaml", ".md"]

    def generate_cleanup_report(self) -> dict[str, Any]:
        """Generate comprehensive cleanup report"""

        print("📋 GENERATING COMPREHENSIVE CLEANUP REPORT")

        report = {
            "diagnostic_timestamp": "2025-12-17T05:14:00Z",
            "analysis_scope": ["scripts", "backend", "docs"],
            "findings": {
                "exact_duplicates": len(self.duplicate_files),
                "similar_files": len(self.similar_files),
                "files_with_unused_imports": len(self.unused_imports),
                "orphaned_files": len(self.orphaned_files),
                "redundant_configurations": len(self.redundant_configs),
            },
            "duplicate_files": self.duplicate_files[:10],  # Show first 10
            "similar_files": self.similar_files[:10],  # Show first 10
            "unused_imports_sample": dict(
                list(self.unused_imports.items())[:5]
            ),  # Show first 5
            "orphaned_files_sample": self.orphaned_files[:10],  # Show first 10
            "redundant_configurations": self.redundant_configs,
            "cleanup_priorities": {
                "critical": [
                    "Remove exact duplicate files immediately",
                    "Fix critical unused imports that may cause runtime errors",
                ],
                "high": [
                    "Review and consolidate redundant configuration files",
                    "Remove obviously orphaned files (logs, temp files, etc.)",
                ],
                "medium": [
                    "Clean up unused imports in non-critical files",
                    "Review similar files for consolidation opportunities",
                ],
                "low": [
                    "Archive old documentation versions",
                    "Remove development artifacts no longer needed",
                ],
            },
            "estimated_cleanup_effort": {
                "exact_duplicates": f"{len(self.duplicate_files) * 5} minutes (review and remove)",
                "unused_imports": f"{len(self.unused_imports) * 2} minutes (automated cleanup)",
                "orphaned_files": f"{len(self.orphaned_files) * 1} minutes (review and remove)",
                "redundant_configs": f"{len(self.redundant_configs) * 15} minutes (consolidation effort)",
                "total_estimated": f"{(len(self.duplicate_files) * 5 + len(self.unused_imports) * 2 + len(self.orphaned_files) * 1 + len(self.redundant_configs) * 15)} minutes",
            },
            "safe_removal_candidates": [
                "Log files in logs/ directory",
                "Temporary files with .tmp extension",
                "Cache files in __pycache__ directories",
                "Old backup files with 'backup' in name",
                "Duplicate documentation files",
            ],
            "risk_assessment": {
                "low_risk": [
                    "Removing log files and temporary files",
                    "Cleaning up __pycache__ directories",
                    "Removing duplicate documentation",
                ],
                "medium_risk": [
                    "Removing orphaned Python files",
                    "Consolidating configuration files",
                    "Removing unused imports",
                ],
                "high_risk": [
                    "Removing files that might be referenced dynamically",
                    "Consolidating configuration files used by external systems",
                ],
            },
        }

        # Save detailed reports
        self._save_detailed_reports()

        return report

    def _save_detailed_reports(self):
        """Save detailed analysis reports"""

        # Save duplicate files report
        with open("duplicate_files_report.json", "w") as f:
            json.dump(
                {
                    "exact_duplicates": self.duplicate_files,
                    "similar_files": self.similar_files,
                },
                f,
                indent=2,
            )

        # Save unused imports report
        with open("unused_imports_report.json", "w") as f:
            json.dump(self.unused_imports, f, indent=2)

        # Save orphaned files report
        with open("orphaned_files_report.json", "w") as f:
            json.dump(
                {
                    "orphaned_files": self.orphaned_files,
                    "total_count": len(self.orphaned_files),
                },
                f,
                indent=2,
            )

        # Save redundant configurations report
        with open("redundant_configurations_report.json", "w") as f:
            json.dump(self.redundant_configs, f, indent=2)

    def run_full_diagnostic(self) -> dict[str, Any]:
        """Run complete workspace diagnostic"""

        directories_to_scan = ["scripts", "backend", "docs"]

        print("🔬 COMPREHENSIVE WORKSPACE DIAGNOSTIC")
        print("=" * 50)

        # Run all diagnostic checks
        self.duplicate_files = self.find_exact_duplicates(directories_to_scan)
        self.similar_files = self.find_similar_files(directories_to_scan)
        self.unused_imports = self.analyze_unused_imports(directories_to_scan)
        self.orphaned_files = self.find_orphaned_files(directories_to_scan)
        self.redundant_configs = self.analyze_redundant_configurations(
            directories_to_scan
        )

        # Generate comprehensive report
        report = self.generate_cleanup_report()

        print("\n📊 DIAGNOSTIC SUMMARY")
        print(f"Exact Duplicate Files: {len(self.duplicate_files)}")
        print(f"Similar Files: {len(self.similar_files)}")
        print(f"Files with Unused Imports: {len(self.unused_imports)}")
        print(f"Orphaned Files: {len(self.orphaned_files)}")
        print(f"Redundant Configurations: {len(self.redundant_configs)}")
        print(
            f"\nEstimated Cleanup Time: {report['estimated_cleanup_effort']['total_estimated']}"
        )

        return report


def main():
    """Main diagnostic function"""

    diagnostic = WorkspaceDiagnostic()
    report = diagnostic.run_full_diagnostic()

    # Generate human-readable summary
    summary = f"""# 🧹 WORKSPACE CLEANUP DIAGNOSTIC REPORT

**Diagnostic Date:** {report["diagnostic_timestamp"]}
**Analysis Scope:** {", ".join(report["analysis_scope"])}

## 📊 FINDINGS SUMMARY

| Category | Count | Status |
|----------|-------|--------|
| Exact Duplicate Files | {report["findings"]["exact_duplicates"]} | {"❌ Action Required" if report["findings"]["exact_duplicates"] > 0 else "✅ Clean"} |
| Similar Files | {report["findings"]["similar_files"]} | {"⚠️ Review Needed" if report["findings"]["similar_files"] > 0 else "✅ Clean"} |
| Files with Unused Imports | {report["findings"]["files_with_unused_imports"]} | {"🔧 Cleanup Needed" if report["findings"]["files_with_unused_imports"] > 0 else "✅ Clean"} |
| Orphaned Files | {report["findings"]["orphaned_files"]} | {"🗑️ Removal Candidates" if report["findings"]["orphaned_files"] > 0 else "✅ Clean"} |
| Redundant Configurations | {report["findings"]["redundant_configurations"]} | {"📋 Consolidation Needed" if report["findings"]["redundant_configurations"] > 0 else "✅ Clean"} |

## ⏱️ ESTIMATED CLEANUP EFFORT

- **Exact Duplicates:** {report["estimated_cleanup_effort"]["exact_duplicates"]}
- **Unused Imports:** {report["estimated_cleanup_effort"]["unused_imports"]}
- **Orphaned Files:** {report["estimated_cleanup_effort"]["orphaned_files"]}
- **Redundant Configs:** {report["estimated_cleanup_effort"]["redundant_configurations"]}
- **Total Estimated:** {report["estimated_cleanup_effort"]["total_estimated"]}

## 🎯 CLEANUP PRIORITIES

### 🚨 CRITICAL
{chr(10).join(f"- {item}" for item in report["cleanup_priorities"]["critical"])}

### ⚠️ HIGH
{chr(10).join(f"- {item}" for item in report["cleanup_priorities"]["high"])}

### 📋 MEDIUM
{chr(10).join(f"- {item}" for item in report["cleanup_priorities"]["medium"])}

### 📁 LOW
{chr(10).join(f"- {item}" for item in report["cleanup_priorities"]["low"])}

## 🛡️ SAFE REMOVAL CANDIDATES

{chr(10).join(f"- ✅ {item}" for item in report["safe_removal_candidates"])}

## ⚠️ RISK ASSESSMENT

### 🟢 LOW RISK
{chr(10).join(f"- {item}" for item in report["risk_assessment"]["low_risk"])}

### 🟡 MEDIUM RISK
{chr(10).join(f"- {item}" for item in report["risk_assessment"]["medium_risk"])}

### 🔴 HIGH RISK
{chr(10).join(f"- {item}" for item in report["risk_assessment"]["high_risk"])}

## 📁 GENERATED REPORTS

- `duplicate_files_report.json` - Detailed duplicate file analysis
- `unused_imports_report.json` - Unused import findings
- `orphaned_files_report.json` - Orphaned file list
- `redundant_configurations_report.json` - Configuration redundancy analysis

---
*Run cleanup operations carefully and backup important files before removal.*
"""

    with open("WORKSPACE_CLEANUP_DIAGNOSTIC.md", "w") as f:
        f.write(summary)

    print("\n📋 Summary report saved to: WORKSPACE_CLEANUP_DIAGNOSTIC.md")
    print("🎯 Diagnostic complete - review reports for cleanup actions")


if __name__ == "__main__":
    main()
