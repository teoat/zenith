#!/usr/bin/env python3
"""
Quick Workspace Cleanup Diagnostic
Focused analysis of duplications and unused files
"""

import json
import os
from pathlib import Path


def quick_duplicate_check():
    """Quick check for obvious duplicates"""
    print("🔍 QUICK DUPLICATE FILE ANALYSIS")

    duplicates = []

    # Check for common duplicate patterns
    patterns = [
        ("requirements*.txt", "Python requirements files"),
        ("Dockerfile*", "Docker files"),
        ("docker-compose*.yml", "Docker Compose files"),
        ("*.env*", "Environment files"),
        ("README*", "README files"),
        ("*report*.json", "Report files"),
        ("*diagnostic*.py", "Diagnostic scripts"),
    ]

    for pattern, description in patterns:
        files = list(Path(".").glob(pattern))
        if len(files) > 1:
            duplicates.append(
                {
                    "type": description,
                    "pattern": pattern,
                    "count": len(files),
                    "files": [str(f) for f in files],
                }
            )

    return duplicates


def check_unused_scripts():
    """Check for potentially unused scripts"""
    print("🔍 CHECKING FOR UNUSED SCRIPTS")

    script_dir = Path("scripts")
    if not script_dir.exists():
        return []

    unused_candidates = []

    # Scripts that might be unused
    potentially_unused = [
        "create_admin_user.py",
        "debug_auth.py",
        "ingest_knowledge_base.py",
        "run_tests.py",
        "secure_all_routers.py",
        "test_login.py",
        "verify_ai_integration.py",
    ]

    for script in potentially_unused:
        script_path = script_dir / script
        if script_path.exists():
            # Check if script is referenced in other files
            referenced = False
            for root, dirs, files in os.walk("."):
                if "frontend" in root or "node_modules" in root or ".git" in root:
                    continue
                for file in files:
                    if file.endswith((".py", ".md", ".yml", ".yaml")):
                        try:
                            with open(os.path.join(root, file)) as f:
                                content = f.read()
                                if script in content and os.path.join(
                                    root, file
                                ) != str(script_path):
                                    referenced = True
                                    break
                        except:
                            pass
                if referenced:
                    break

            if not referenced:
                unused_candidates.append(str(script_path))

    return unused_candidates


def check_large_files():
    """Check for unusually large files that might be duplicates or unnecessary"""
    print("🔍 CHECKING FOR LARGE FILES")

    large_files = []

    for root, dirs, files in os.walk("."):
        if any(
            skip in root for skip in ["node_modules", ".git", "venv", "__pycache__"]
        ):
            continue

        for file in files:
            filepath = os.path.join(root, file)
            try:
                size = os.path.getsize(filepath)
                if size > 10 * 1024 * 1024:  # 10MB
                    large_files.append(
                        {
                            "file": filepath,
                            "size_mb": size / (1024 * 1024),
                            "reason": "Unusually large file",
                        }
                    )
            except:
                pass

    return large_files


def check_empty_directories():
    """Check for empty directories"""
    print("🔍 CHECKING FOR EMPTY DIRECTORIES")

    empty_dirs = []

    for root, dirs, files in os.walk(".", topdown=False):
        if any(skip in root for skip in ["node_modules", ".git", "venv"]):
            continue

        try:
            if not os.listdir(root):
                empty_dirs.append(root)
        except:
            pass

    return empty_dirs


def generate_quick_report():
    """Generate quick cleanup report"""

    print("📋 GENERATING QUICK CLEANUP REPORT")

    duplicates = quick_duplicate_check()
    unused_scripts = check_unused_scripts()
    large_files = check_large_files()
    empty_dirs = check_empty_directories()

    report = {
        "timestamp": "2025-12-17T05:15:00Z",
        "duplicate_groups": len(duplicates),
        "unused_scripts": len(unused_scripts),
        "large_files": len(large_files),
        "empty_directories": len(empty_dirs),
        "duplicates": duplicates[:5],  # Show first 5
        "unused_scripts_list": unused_scripts[:10],  # Show first 10
        "large_files_list": large_files[:5],  # Show first 5
        "empty_directories_list": empty_dirs[:10],  # Show first 10
        "recommendations": [
            f"Review {len(duplicates)} groups of potential duplicate files",
            f"Consider removing {len(unused_scripts)} potentially unused scripts",
            f"Review {len(large_files)} large files for necessity",
            f"Remove {len(empty_dirs)} empty directories",
        ],
    }

    # Save report
    with open("quick_cleanup_report.json", "w") as f:
        json.dump(report, f, indent=2)

    # Generate summary
    summary = f"""# 🧹 QUICK WORKSPACE CLEANUP REPORT

**Analysis Date:** {report["timestamp"]}

## 📊 FINDINGS SUMMARY

| Category | Count | Action |
|----------|-------|--------|
| Duplicate File Groups | {report["duplicate_groups"]} | Review & Consolidate |
| Potentially Unused Scripts | {report["unused_scripts"]} | Verify & Remove |
| Large Files (>10MB) | {report["large_files"]} | Review & Archive |
| Empty Directories | {report["empty_directories"]} | Safe to Remove |

## 🔍 DETAILED FINDINGS

### 📋 Duplicate Files
{chr(10).join(f"- **{d['type']}**: {d['count']} files matching '{d['pattern']}'" for d in report["duplicates"])}

### 🗑️ Potentially Unused Scripts
{chr(10).join(f"- {script}" for script in report["unused_scripts_list"])}

### 📁 Large Files
{chr(10).join(f"- {f['file']}: {f['size_mb']:.1f}MB" for f in report["large_files_list"])}

### 📂 Empty Directories
{chr(10).join(f"- {dir}" for dir in report["empty_directories_list"])}

## 💡 RECOMMENDATIONS

{chr(10).join(f"- {rec}" for rec in report["recommendations"])}

## ⚠️ SAFE CLEANUP ACTIONS

### 🟢 SAFE (Low Risk)
- Remove empty directories
- Archive large log files
- Remove duplicate documentation files

### 🟡 REVIEW FIRST (Medium Risk)
- Check unused scripts for any references
- Review duplicate configuration files
- Verify large data files are still needed

### 🔴 CAUTION (High Risk)
- Do not remove files without checking references
- Backup before removing any files
- Test after cleanup to ensure nothing broke

## 📁 REPORTS GENERATED

- `quick_cleanup_report.json` - Detailed findings
- This summary report

---
*Always backup important files before cleanup operations.*
"""

    with open("QUICK_CLEANUP_REPORT.md", "w") as f:
        f.write(summary)

    print("\n📊 QUICK CLEANUP SUMMARY")
    print(f"Duplicate Groups: {len(duplicates)}")
    print(f"Unused Scripts: {len(unused_scripts)}")
    print(f"Large Files: {len(large_files)}")
    print(f"Empty Directories: {len(empty_dirs)}")
    print("\n📋 Report saved to: QUICK_CLEANUP_REPORT.md")

    return report


if __name__ == "__main__":
    generate_quick_report()
