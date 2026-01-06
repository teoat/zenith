#!/usr/bin/env python3
"""
Comprehensive Diagnostic Runner for Fraud Detection Platform
Runs all diagnostic checks and provides scoring for each area.
"""

import asyncio
import json
import os
import sys
from datetime import datetime

sys.path.append(os.path.join(os.path.dirname(__file__), "..", "..", "backend"))
from app.services.diagnostics.diagnostic_service import DiagnosticService


def print_section_header(title: str):
    """Print a formatted section header."""
    print(f"\n{'=' * 60}")
    print(f" {title}")
    print(f"{'=' * 60}")


def print_area_diagnostics(area_name: str, diagnostics: dict):
    """Print diagnostics for a specific area with scoring."""
    health_score = diagnostics.get("health_score", 0.0)
    metrics = diagnostics.get("metrics", {})
    alerts = diagnostics.get("alerts", [])
    recommendations = diagnostics.get("recommendations", [])

    # Health score color coding
    if health_score >= 0.9:
        score_color = "🟢"
        score_text = "EXCELLENT"
    elif health_score >= 0.8:
        score_color = "🟡"
        score_text = "GOOD"
    elif health_score >= 0.7:
        score_color = "🟠"
        score_text = "FAIR"
    else:
        score_color = "🔴"
        score_text = "NEEDS ATTENTION"

    print(f"\n📊 {area_name}")
    print(f"   Health Score: {score_color} {health_score:.1%} ({score_text})")

    if metrics:
        print("   Key Metrics:")
        for key, value in list(metrics.items())[:5]:  # Show first 5 metrics
            if isinstance(value, float):
                print(f"   • {key}: {value:.3f}")
            else:
                print(f"   • {key}: {value}")

    if alerts:
        print("   ⚠️  Alerts:")
        for alert in alerts:
            print(f"   • {alert}")

    if recommendations:
        print("   💡 Recommendations:")
        for rec in recommendations:
            print(f"   • {rec}")


def print_overall_summary(diagnostics: dict):
    """Print overall diagnostic summary."""
    overall_score = diagnostics.get("overall_health_score", 0.0)
    recommendations = diagnostics.get("recommendations", [])

    print_section_header("OVERALL SYSTEM HEALTH SUMMARY")

    if overall_score >= 0.9:
        overall_status = "🟢 EXCELLENT"
    elif overall_score >= 0.8:
        overall_status = "🟡 GOOD"
    elif overall_score >= 0.7:
        overall_status = "🟠 FAIR"
    else:
        overall_status = "🔴 NEEDS IMPROVEMENT"

    print(f"\n🏆 Overall System Health: {overall_status}")
    print(f"   Composite Score: {overall_score:.1%}")

    # Area breakdown
    print("\n📈 Area-by-Area Scores:")
    areas = [
        "ai_ml_performance",
        "data_quality",
        "user_experience",
        "scalability",
        "compliance",
        "integration_health",
        "business_impact",
    ]

    for area in areas:
        if area in diagnostics:
            score = diagnostics[area].get("health_score", 0.0)
            area_name = area.replace("_", " ").title()
            status_icon = "🟢" if score >= 0.8 else "🟡" if score >= 0.7 else "🔴"
            print(f"   {status_icon} {area_name}: {score:.1%}")

    if recommendations:
        print("\n🎯 Priority Recommendations:")
        priority_order = {"HIGH": [], "MEDIUM": [], "LOW": []}

        for rec in recommendations:
            priority = rec.get("priority", "MEDIUM")
            priority_order[priority].append(rec)

        for priority in ["HIGH", "MEDIUM", "LOW"]:
            if priority_order[priority]:
                print(f"\n   {priority} PRIORITY:")
                for rec in priority_order[priority]:
                    area = rec.get("area", "Unknown")
                    issue = rec.get("issue", "Unknown issue")
                    effort = rec.get("estimated_effort", "Unknown effort")
                    print(f"   • [{area}] {issue} (Effort: {effort})")


async def main():
    """Main diagnostic runner function."""
    print_section_header("FRAUD DETECTION PLATFORM - COMPREHENSIVE DIAGNOSTICS")
    print(f"   Started at: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}")

    try:
        # Initialize diagnostic service
        diagnostic_service = DiagnosticService()

        # Run comprehensive diagnostics
        print("\n🔍 Running diagnostic checks...")
        diagnostics = await diagnostic_service.run_comprehensive_diagnostics()

        # Print individual area diagnostics
        areas = [
            ("AI/ML Performance & Intelligence", "ai_ml_performance"),
            ("Data Quality & Pipeline Health", "data_quality"),
            ("User Experience & Adoption Analytics", "user_experience"),
            ("Scalability & Infrastructure Resilience", "scalability"),
            ("Compliance & Regulatory Monitoring", "compliance"),
            ("Integration Ecosystem Health", "integration_health"),
            ("Business Impact & ROI Analytics", "business_impact"),
        ]

        for display_name, area_key in areas:
            if area_key in diagnostics:
                print_area_diagnostics(display_name, diagnostics[area_key])

        # Print overall summary
        print_overall_summary(diagnostics)

        # Save results to file
        output_file = (
            f"diagnostic_results_{datetime.now().strftime('%Y%m%d_%H%M%S')}.json"
        )
        with open(output_file, "w") as f:
            json.dump(diagnostics, f, indent=2, default=str)

        print(f"\n💾 Detailed results saved to: {output_file}")

        print_section_header("DIAGNOSTIC RUN COMPLETE")
        print("   Use the results above to prioritize improvements and monitoring.")

        # Exit with status code based on overall health
        overall_score = diagnostics.get("overall_health_score", 0.0)
        sys.exit(0 if overall_score >= 0.8 else 1)

    except Exception as e:
        print(f"\n❌ Diagnostic run failed: {e!s}")
        sys.exit(1)


if __name__ == "__main__":
    asyncio.run(main())
