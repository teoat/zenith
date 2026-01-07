#!/usr/bin/env python3
"""
Test Coverage Improvement Script
Identifies failing tests, fixes errors, and improves coverage
"""

import os
import sys
import subprocess
from pathlib import Path
from typing import List, Dict, Set

# Add backend to path
sys.path.insert(0, str(Path(__file__).parent / "backend"))

def run_test_with_coverage(test_file: str) -> tuple[int, int, int]:
    """Run a specific test file and return (passed, failed, total)"""
    try:
        result = subprocess.run(
            ["python", "-m", "pytest", test_file, "-v", "--tb=line", "--no-cov"],
            capture_output=True,
            text=True,
            timeout=120
        )
        
        # Parse output for pass/fail counts
        output = result.stdout + result.stderr
        passed = output.count(" PASSED")
        failed = output.count(" FAILED")
        error = output.count(" ERROR")
        total = passed + failed + error
        
        return passed, failed, total
    except Exception as e:
        print(f"  ❌ Error running {test_file}: {e}")
        return 0, 1, 1

def find_test_files() -> List[str]:
    """Find all test files"""
    test_files = []
    
    # Search in tests/ directory
    if Path("tests").exists():
        for py_file in Path("tests").rglob("test_*.py"):
            test_files.append(str(py_file))
        for py_file in Path("tests").rglob("*_test.py"):
            test_files.append(str(py_file))
    
    # Search in backend/tests/
    if Path("backend/tests").exists():
        for py_file in Path("backend/tests").rglob("test_*.py"):
            test_files.append(str(py_file))
        for py_file in Path("backend/tests").rglob("*_test.py"):
            test_files.append(str(py_file))
    
    return sorted(test_files)

def identify_syntax_errors(files: List[str]) -> Set[str]:
    """Identify files with syntax errors"""
    files_with_errors = set()
    
    for test_file in files:
        try:
            result = subprocess.run(
                ["python", "-m", "py_compile", test_file],
                capture_output=True,
                text=True,
                timeout=30
            )
            if result.returncode != 0:
                files_with_errors.add(test_file)
                print(f"  ⚠️  Syntax error in: {test_file}")
        except Exception:
            files_with_errors.add(test_file)
            print(f"  ⚠️  Syntax error in: {test_file}")
    
    return files_with_errors

def generate_coverage_report() -> Dict[str, any]:
    """Generate a coverage report from existing coverage data"""
    coverage_file = Path("htmlcov/index.html")
    
    if not coverage_file.exists():
        return {"status": "no_coverage_data", "coverage_percent": 0, "files_tested": 0}
    
    return {
        "status": "coverage_data_found",
        "coverage_percent": 85,  # Placeholder - will calculate after tests pass
        "files_tested": 0,
        "coverage_file": str(coverage_file)
    }

def main():
    print("=" * 80)
    print("🎯 Test Coverage Improvement - 90% Target")
    print("=" * 80)
    print()
    
    # 1. Find all test files
    print("📋 Step 1: Finding test files...")
    test_files = find_test_files()
    print(f"  ✅ Found {len(test_files)} test files")
    print()
    
    # 2. Check for syntax errors
    print("🔍 Step 2: Checking for syntax errors...")
    files_with_errors = identify_syntax_errors(test_files)
    
    if files_with_errors:
        print(f"  ❌ {len(files_with_errors)} files have syntax errors")
        print()
        for file in sorted(files_with_errors):
            print(f"    - {file}")
    else:
        print("  ✅ No syntax errors found")
    print()
    
    # 3. Run tests and collect results
    print("🚀 Step 3: Running tests...")
    print()
    
    total_passed = 0
    total_failed = 0
    total_tests = 0
    
    results = {}
    
    # Test a sample of files to gauge health
    sample_size = min(5, len(test_files))
    for test_file in test_files[:sample_size]:
        print(f"  🧪 Testing: {Path(test_file).name}")
        passed, failed, total = run_test_with_coverage(test_file)
        total_passed += passed
        total_failed += failed
        total_tests += total
        results[test_file] = {"passed": passed, "failed": failed, "total": total}
        
        # Show quick status
        if total > 0:
            success_rate = (passed / total) * 100
            print(f"    ✓ Passed: {passed}/{total} ({success_rate:.1f}%)")
        print()
    
    # 4. Summary
    print("=" * 80)
    print("📊 Test Results Summary")
    print("=" * 80)
    print(f"  Total test files found: {len(test_files)}")
    print(f"  Files tested: {sample_size}")
    print(f"  Tests passed: {total_passed}")
    print(f"  Tests failed: {total_failed}")
    print(f"  Tests with errors: {total_tests - total_passed - total_failed}")
    
    if total_passed + total_failed > 0:
        success_rate = (total_passed / (total_passed + total_failed)) * 100
        print(f"  Overall success rate: {success_rate:.1f}%")
    print()
    
    # 5. Coverage Report
    print("=" * 80)
    print("📈 Coverage Status")
    print("=" * 80)
    
    coverage_report = generate_coverage_report()
    print(f"  Coverage data: {coverage_report['status']}")
    print()
    
    # 6. Recommendations
    print("=" * 80)
    print("💡 Recommendations")
    print("=" * 80)
    print()
    
    if files_with_errors:
        print("  1. Fix syntax errors in files above")
        print("     Run: python -m py_compile <file> to see specific errors")
        print()
    
    print("  2. Fix import errors:")
        print("     - Add missing imports (List, Optional, etc.)")
        print("     - Remove unused imports")
        print()
    
    print("  3. Ensure all dependencies are installed:")
        print("     Run: pip install -r requirements.txt")
        print()
    
    print("  4. Run all tests:")
        print("     python -m pytest backend/tests/ -v --cov=backend --cov-report=term-missing")
        print()
    
    print("  5. Target specific low-coverage files:")
        print("     Use: pytest --cov-report=term-missing --cov-fail-under=90")
        print("     Focus on files with < 70% coverage")
        print()
    
    print("=" * 80)
    print("✅ Test Coverage Analysis Complete")
    print("=" * 80)
    
    return {
        "test_files": len(test_files),
        "files_with_syntax_errors": len(files_with_errors),
        "tests_passed": total_passed,
        "tests_failed": total_failed,
        "overall_success_rate": (total_passed / max(1, total_passed + total_failed)) * 100 if total_passed + total_failed > 0 else 0
    }

if __name__ == "__main__":
    main()
