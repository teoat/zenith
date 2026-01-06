#!/usr/bin/env python3
"""
Comprehensive Platform Rediagnosis Runner
Executes advanced multi-dimensional platform analysis.
"""

import asyncio
import json
import os
import sys
from datetime import datetime

sys.path.append(os.path.join(os.path.dirname(__file__), "..", "..", "backend"))
from app.services.comprehensive_diagnostic_service import ComprehensiveDiagnosticService


def print_section_header(title: str, emoji: str = "🔍"):
    """Print a formatted section header."""
    print(f"\n{'=' * 80}")
    print(f" {emoji} {title}")
    print(f"{'=' * 80}")


def print_metric(title: str, value: any, unit: str = "", status: str = ""):
    """Print a formatted metric."""
    if isinstance(value, float) and value <= 1.0:
        value_str = f"{value:.1%}"
    elif isinstance(value, float):
        value_str = f"{value:.2f}"
    else:
        value_str = str(value)

    print(f"   • {title}: {value_str}{unit} {status}")


def print_area_diagnosis(area_name: str, diagnosis: dict):
    """Print comprehensive diagnosis for a specific area."""
    print(f"\n📊 {area_name}")

    # Print key metrics (top 5)
    if isinstance(diagnosis, dict):
        metrics_printed = 0
        for key, value in diagnosis.items():
            if metrics_printed >= 5:
                break
            if isinstance(value, (int, float)) and not isinstance(value, bool):
                status = ""
                if isinstance(value, float) and value <= 1.0:
                    if value >= 0.9:
                        status = "🟢"
                    elif value >= 0.8:
                        status = "🟡"
                    elif value >= 0.7:
                        status = "🟠"
                    else:
                        status = "🔴"
                print_metric(key.replace("_", " ").title(), value, "", status)
                metrics_printed += 1


def print_risk_assessment(risks: dict):
    """Print risk assessment summary."""
    print("\n🎯 Risk Assessment Summary")
    risk_summary = risks.get("risk_summary", {})

    print_metric("Total Risks Identified", risk_summary.get("total_risks", 0))
    print_metric("Critical Risks", risk_summary.get("critical_risks", 0))
    print_metric("High Risks", risk_summary.get("high_risks", 0))
    print_metric("Risk Exposure Score", risk_summary.get("risk_exposure_score", 0))
    print_metric(
        "Total Mitigation Cost", risk_summary.get("total_mitigation_cost", 0), " USD"
    )

    print("\n   Risk Distribution:")
    distribution = risk_summary.get("risk_distribution", {})
    for category, count in distribution.items():
        print(f"   • {category.title()}: {count} risks")


def print_strategic_recommendations(recommendations: list):
    """Print strategic recommendations."""
    print("\n🎯 Strategic Recommendations")
    for i, rec in enumerate(recommendations, 1):
        priority_emoji = {"HIGH": "🔴", "MEDIUM": "🟡", "LOW": "🟢"}.get(
            rec.get("priority", "MEDIUM"), "🟡"
        )
        print(
            f"\n   {priority_emoji} Priority {rec.get('priority', 'MEDIUM')}: {rec.get('title', 'Unknown')}"
        )
        print(f"   Category: {rec.get('category', 'General')}")
        print(f"   Description: {rec.get('description', 'No description available')}")
        print(f"   Timeline: {rec.get('timeline', 'Not specified')}")
        print(f"   Estimated Cost: ${rec.get('estimated_cost', 0):,}")
        print(f"   Expected Impact: {rec.get('expected_impact', 'Not specified')}")


async def main():
    """Main comprehensive diagnostic runner."""
    print_section_header("COMPREHENSIVE PLATFORM REDIAGNOSIS", "🔬")
    print(f"   Started at: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}")
    print("   Analysis Depth: Forensic + Strategic")

    try:
        # Initialize comprehensive diagnostic service
        diagnostic_service = ComprehensiveDiagnosticService()

        # Run comprehensive diagnosis
        print("\n🔬 Executing comprehensive multi-dimensional analysis...")
        diagnosis = await diagnostic_service.run_comprehensive_rediagnosis()

        # Extract comprehensive health score
        comprehensive_score = diagnosis.get("comprehensive_health_score", 0.0)

        # Print overall assessment
        print_section_header("OVERALL COMPREHENSIVE ASSESSMENT", "📈")

        if comprehensive_score >= 0.9:
            overall_status = "🟢 EXCEPTIONAL"
        elif comprehensive_score >= 0.8:
            overall_status = "🟢 EXCELLENT"
        elif comprehensive_score >= 0.7:
            overall_status = "🟡 GOOD"
        elif comprehensive_score >= 0.6:
            overall_status = "🟠 FAIR"
        else:
            overall_status = "🔴 NEEDS IMPROVEMENT"

        print(f"\n🏆 Comprehensive Platform Health: {overall_status}")
        print(f"   Overall Score: {comprehensive_score:.1%}")

        # Print detailed area diagnoses
        areas_to_analyze = [
            ("Core System Health", diagnosis.get("core_system_health", {})),
            ("Architecture Quality", diagnosis.get("architecture_quality", {})),
            ("Code Quality Assessment", diagnosis.get("code_quality_assessment", {})),
            ("Security Posture", diagnosis.get("security_posture", {})),
            (
                "Performance Characteristics",
                diagnosis.get("performance_characteristics", {}),
            ),
            ("Business Alignment", diagnosis.get("business_alignment", {})),
            ("Operational Excellence", diagnosis.get("operational_excellence", {})),
            ("Innovation Readiness", diagnosis.get("innovation_readiness", {})),
            ("Cost Optimization", diagnosis.get("cost_optimization", {})),
            ("Sustainability Metrics", diagnosis.get("sustainability_metrics", {})),
            ("Competitive Positioning", diagnosis.get("competitive_positioning", {})),
        ]

        for area_name, area_data in areas_to_analyze:
            print_area_diagnosis(area_name, area_data)

        # Print risk assessment
        risk_assessment = diagnosis.get("risk_assessment", {})
        if risk_assessment:
            print_risk_assessment(risk_assessment)

        # Print strategic recommendations
        recommendations = diagnosis.get("strategic_recommendations", [])
        if recommendations:
            print_strategic_recommendations(recommendations)

        # Print future roadmap summary
        roadmap = diagnosis.get("future_roadmap", {})
        if roadmap:
            print_section_header("FUTURE ROADMAP SUMMARY", "🗺️")
            for timeframe, details in roadmap.items():
                print(
                    f"\n   {timeframe.upper().replace('_', ' ')} ({details.get('estimated_investment', 0):,} USD):"
                )
                print(f"   Focus: {', '.join(details.get('focus_areas', []))}")
                print(
                    f"   Benefits: {details.get('expected_benefits', 'Not specified')}"
                )

        # Save comprehensive results
        output_file = (
            f"comprehensive_rediagnosis_{datetime.now().strftime('%Y%m%d_%H%M%S')}.json"
        )
        with open(output_file, "w") as f:
            json.dump(diagnosis, f, indent=2, default=str)

        print(f"\n💾 Comprehensive analysis saved to: {output_file}")

        print_section_header("REDIAGNOSIS COMPLETE", "✅")
        print("   Comprehensive platform analysis completed successfully.")
        print("   Results provide strategic insights for long-term platform evolution.")
        print(f"   Overall Health Score: {comprehensive_score:.1%}")

        # Exit with status based on comprehensive score
        exit_code = 0 if comprehensive_score >= 0.8 else 1
        exit(exit_code)

    except Exception as e:
        print(f"\n❌ Comprehensive rediagnosis failed: {e!s}")
        import traceback

        traceback.print_exc()
        exit(1)


if __name__ == "__main__":
    asyncio.run(main())
