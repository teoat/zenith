#!/usr/bin/env python3
"""
Simple Diagnostic Runner for Gaps and Duplicates
"""

import asyncio
import json
import os
import sys
from datetime import datetime

sys.path.append(os.path.join(os.path.dirname(__file__), "..", "..", "backend"))
from app.services.comprehensive_diagnostic_orchestrator import (
    comprehensive_diagnostic_orchestrator,
)


async def main():
    print("🔍 Running comprehensive diagnostics for gaps and duplicates...")

    # Run diagnostics
    report = await comprehensive_diagnostic_orchestrator.run_comprehensive_diagnostics()

    # Print summary
    print(f"\n🏆 Overall Score: {report.overall_score:.1f}% ({report.overall_grade})")
    print(f"\n📊 Critical Findings ({len(report.critical_findings)}):")
    for finding in report.critical_findings[:5]:  # Show top 5
        print(f"  • {finding['message']} (Score: {finding['score']:.1f}%)")

    print(f"\n💡 Recommendations ({len(report.recommendations)}):")
    for rec in report.recommendations[:5]:  # Show top 5
        print(f"  • [{rec['priority']}] {rec['title']}")

    # Print detailed scope results
    print("\n🔍 Detailed Scope Analysis:")
    for scope_name, score in sorted(report.scope_coverage.items(), key=lambda x: x[1]):
        status = "🟢" if score >= 90 else "🟡" if score >= 80 else "🔴"
        print(f"  {status} {scope_name}: {score:.1f}%")

        # Show individual results for low-scoring scopes
        if score < 85:
            scope_results = [
                r for r in report.detailed_results.get(scope_name, []) if r.score < 85
            ]
            for result in scope_results[:3]:  # Show top 3 issues per scope
                print(f"    • {result.message} (Score: {result.score:.1f}%)")

    # Save detailed results
    output_file = (
        f"diagnostic_detailed_gaps_{datetime.now().strftime('%Y%m%d_%H%M%S')}.json"
    )
    with open(output_file, "w") as f:
        json.dump(
            {
                "overall_score": report.overall_score,
                "overall_grade": report.overall_grade,
                "critical_findings": report.critical_findings,
                "recommendations": report.recommendations,
                "scope_coverage": {
                    k.value if hasattr(k, "value") else str(k): v
                    for k, v in report.scope_coverage.items()
                },
                "detailed_results": {
                    scope.value if hasattr(scope, "value") else str(scope): [
                        {
                            "diagnostic_id": r.diagnostic_id,
                            "status": r.status,
                            "score": r.score,
                            "message": r.message,
                            "recommendations": r.recommendations,
                        }
                        for r in results
                        if r.score < 90  # Only save issues
                    ]
                    for scope, results in report.detailed_results.items()
                },
            },
            f,
            indent=2,
            default=str,
        )

    print(f"\n💾 Detailed results saved to: {output_file}")


if __name__ == "__main__":
    asyncio.run(main())
