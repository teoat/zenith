#!/usr/bin/env python3
"""
JSX Error Diagnosis and Fix System
Comprehensive analysis and repair of JSX structural issues
"""

import re
import subprocess
from typing import Dict, List, Tuple


class JSXErrorDiagnoser:
    def __init__(self):
        self.jsx_error_patterns = {
            "unexpected_gt_token": r"Unexpected token.*Did you mean.*>|&gt;",
            "jsx_parent_element": r"JSX expressions must have one parent element",
            "missing_closing_tag": r"Expected corresponding.*closing tag",
            "jsx_fragment_closing": r"Expected corresponding.*JSX fragment",
            "malformed_jsx_element": r"JSX element.*no corresponding closing tag",
        }

        self.jsx_fix_patterns = [
            # Fix malformed JSX attributes with HTML entities
            (r'(\w+)="([^"]*)&gt;([^"]*)"(\s*/?>)', r'\1="\2>\3"\4'),
            # Fix missing JSX fragment wrappers
            (
                r"return\s*\(\s*(<\w+[^>]*>.*?</\w+>)\s*(<\w+[^>]*>.*?</\w+>)",
                r"return (\n<>\1\n\2\n</>\n)",
                re.DOTALL,
            ),
            # Fix incomplete JSX closing tags
            (r"(<\w+[^>]*>.*?)(?!</\1>)(\n\s*<|\n\s*$)", r"\1</\1>\2", re.DOTALL),
            # Fix malformed self-closing tags
            (r"<(\w+)([^>]*?)\s*/\s*>", r"<\1\2 />"),
            # Fix JSX attributes with extra quotes
            (r'(\w+)="([^"]*)"(\w+)="([^"]*)"', r'\1="\2" \3="\4"'),
        ]

    def diagnose_jsx_errors(self) -> dict[str, list[str]]:
        """Diagnose JSX errors by category."""
        try:
            result = subprocess.run(
                ["cd", "frontend", "&&", "npx", "tsc", "--noEmit"],
                capture_output=True,
                text=True,
                shell=True,
                timeout=30,
            )

            errors = result.stderr.split("\n")
            jsx_errors = {
                "unexpected_gt": [],
                "parent_element": [],
                "missing_closing": [],
                "fragment_closing": [],
                "malformed_element": [],
            }

            for error in errors:
                if "Unexpected token" in error and (">" in error or "&gt;" in error):
                    jsx_errors["unexpected_gt"].append(error)
                elif "JSX expressions must have one parent element" in error:
                    jsx_errors["parent_element"].append(error)
                elif "Expected corresponding" in error and "closing tag" in error:
                    jsx_errors["missing_closing"].append(error)
                elif "JSX fragment" in error:
                    jsx_errors["fragment_closing"].append(error)
                elif "JSX element" in error and "closing tag" in error:
                    jsx_errors["malformed_element"].append(error)

            return jsx_errors

        except subprocess.TimeoutExpired:
            print("TypeScript compilation timed out")
            return {}

    def analyze_error_patterns(
        self, jsx_errors: dict[str, list[str]]
    ) -> dict[str, dict[str, int]]:
        """Analyze JSX error patterns for frequency and impact."""
        analysis = {}

        for category, errors in jsx_errors.items():
            files = {}
            for error in errors:
                if "(" in error and ")" in error:
                    match = re.search(r"([^:]+)\(\d+,\d+\)", error)
                    if match:
                        file = match.group(1)
                        files[file] = files.get(file, 0) + 1

            analysis[category] = {
                "total_errors": len(errors),
                "affected_files": len(files),
                "top_files": sorted(files.items(), key=lambda x: x[1], reverse=True)[
                    :5
                ],
            }

        return analysis

    def create_fix_strategy(
        self, analysis: dict[str, dict[str, int]]
    ) -> list[tuple[str, str, list[str]]]:
        """Create targeted fix strategy based on error analysis."""
        strategy = []

        # Priority 1: Unexpected GT tokens (most common)
        if analysis.get("unexpected_gt", {}).get("total_errors", 0) > 0:
            strategy.append(
                (
                    "HIGH",
                    "Unexpected GT Tokens",
                    [
                        "Fix HTML entity encoding in JSX attributes",
                        "Replace &gt; with > in attribute values",
                    ],
                )
            )

        # Priority 2: Parent element issues
        if analysis.get("parent_element", {}).get("total_errors", 0) > 0:
            strategy.append(
                (
                    "HIGH",
                    "JSX Parent Element",
                    [
                        "Wrap adjacent JSX elements in React.Fragment",
                        "Add <>...</> wrappers",
                    ],
                )
            )

        # Priority 3: Missing closing tags
        if analysis.get("missing_closing", {}).get("total_errors", 0) > 0:
            strategy.append(
                (
                    "MEDIUM",
                    "Missing Closing Tags",
                    ["Add missing </componentName> tags", "Fix tag pairing"],
                )
            )

        # Priority 4: Fragment issues
        if analysis.get("fragment_closing", {}).get("total_errors", 0) > 0:
            strategy.append(
                (
                    "MEDIUM",
                    "JSX Fragment Issues",
                    ["Complete React.Fragment syntax", "Fix <></> usage"],
                )
            )

        return strategy


def main():
    """Main JSX diagnosis and fix workflow."""
    diagnoser = JSXErrorDiagnoser()

    print("🔍 JSX ERROR DIAGNOSIS SYSTEM")
    print("=" * 50)

    # Phase 1: Diagnose errors
    print("\n📊 Phase 1: Error Diagnosis")
    jsx_errors = diagnoser.diagnose_jsx_errors()
    analysis = diagnoser.analyze_error_patterns(jsx_errors)

    total_jsx_errors = sum(cat.get("total_errors", 0) for cat in analysis.values())
    print(f"Total JSX Errors: {total_jsx_errors}")

    for category, stats in analysis.items():
        if stats["total_errors"] > 0:
            print(f"\n{category.upper()}:")
            print(f"  Errors: {stats['total_errors']}")
            print(f"  Files: {stats['affected_files']}")
            if stats["top_files"]:
                print("  Top affected files:")
                for file, count in stats["top_files"][:3]:
                    print(f"    {file}: {count} errors")

    # Phase 2: Create fix strategy
    print("\n🎯 Phase 2: Fix Strategy")
    strategy = diagnoser.create_fix_strategy(analysis)

    print("Prioritized Fix Strategy:")
    for priority, issue, fixes in strategy:
        print(f"\n{priority}: {issue}")
        for fix in fixes:
            print(f"  • {fix}")

    # Phase 3: Implementation summary
    print("\n🚀 Phase 3: Implementation Summary")
    print(
        f"JSX Error Categories: {len([cat for cat in analysis.values() if cat['total_errors'] > 0])}"
    )
    print(
        f"Files Requiring Attention: {len({file for cat in analysis.values() for file, _ in cat.get('top_files', [])})}"
    )
    print(f"Estimated Fix Time: {len(strategy) * 15} minutes")

    if total_jsx_errors > 0:
        print("\n✅ Ready for JSX error resolution!")
    else:
        print("\n🎊 No JSX errors detected!")


if __name__ == "__main__":
    main()
