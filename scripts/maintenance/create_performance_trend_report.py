"""
Performance Trend Report Generator
Analyzes performance history and generates trend reports
"""

import json
import argparse
from datetime import datetime
from pathlib import Path
from typing import Dict, List, Any, Tuple


class PerformanceTrendAnalyzer:
    """Analyze performance trends over time"""

    def __init__(self, history_path: Path):
        self.history_path = history_path
        self.history = self.load_history()

    def load_history(self) -> List[Dict[str, Any]]:
        """Load performance history"""
        if not self.history_path.exists():
            return []

        with open(self.history_path, "r") as f:
            return json.load(f)

    def analyze_endpoint_trend(self, endpoint: str) -> Dict[str, Any]:
        """Analyze performance trend for specific endpoint"""
        endpoint_data = []

        for run in self.history:
            if endpoint in run["results"]:
                endpoint_data.append(
                    {
                        "timestamp": run["timestamp"],
                        "metrics": run["results"][endpoint],
                    }
                )

        if len(endpoint_data) < 2:
            return {"error": "Insufficient data for trend analysis"}

        metrics_to_track = [
            "response_time_mean_ms",
            "response_time_p95_ms",
            "response_time_p99_ms",
            "error_rate",
        ]

        trend_analysis = {}

        for metric in metrics_to_track:
            values = [d["metrics"][metric] for d in endpoint_data]
            timestamps = [d["timestamp"] for d in endpoint_data]

            trend_analysis[metric] = {
                "first_value": values[0],
                "last_value": values[-1],
                "min_value": min(values),
                "max_value": max(values),
                "avg_value": sum(values) / len(values),
                "change": values[-1] - values[0],
                "change_percent": ((values[-1] - values[0]) / values[0] * 100) if values[0] > 0 else 0,
                "trend": self._determine_trend(values),
                "num_samples": len(values),
            }

        return trend_analysis

    def _determine_trend(self, values: List[float]) -> str:
        """Determine if metric is improving, degrading, or stable"""
        if len(values) < 2:
            return "insufficient_data"

        first_half = values[: len(values) // 2]
        second_half = values[len(values) // 2 :]

        first_avg = sum(first_half) / len(first_half)
        second_avg = sum(second_half) / len(second_half)

        change_percent = ((second_avg - first_avg) / first_avg * 100) if first_avg > 0 else 0

        if change_percent > 10:
            return "degrading"
        elif change_percent < -10:
            return "improving"
        else:
            return "stable"

    def generate_full_report(self) -> str:
        """Generate comprehensive performance trend report"""
        report = []
        report.append("# 📊 Performance Trend Analysis Report")
        report.append("")
        report.append(f"**Generated:** {datetime.now().isoformat()}")
        report.append(f"**Data Points:** {len(self.history)} runs")
        report.append("")

        if not self.history:
            report.append("⚠️  No performance data available")
            return "\n".join(report)

        all_endpoints = set()
        for run in self.history:
            all_endpoints.update(run["results"].keys())

        report.append("## 🔗 Endpoint Performance Trends")
        report.append("")

        for endpoint in sorted(all_endpoints):
            trend = self.analyze_endpoint_trend(endpoint)

            if "error" in trend:
                continue

            report.append(f"### {endpoint}")
            report.append("")

            report.append("**Response Time Trends:**")
            report.append("")

            report.append(f"- **Mean Response Time:**")
            report.append(f"  - Current: {trend['response_time_mean_ms']['last_value']:.2f}ms")
            report.append(f"  - Baseline: {trend['response_time_mean_ms']['first_value']:.2f}ms")
            report.append(f"  - Change: {trend['response_time_mean_ms']['change']:.2f}ms ({trend['response_time_mean_ms']['change_percent']:.1f}%)")
            report.append(f"  - Trend: {self._get_trend_emoji(trend['response_time_mean_ms']['trend'])} {trend['response_time_mean_ms']['trend'].upper()}")
            report.append("")

            report.append(f"- **P95 Response Time:**")
            report.append(f"  - Current: {trend['response_time_p95_ms']['last_value']:.2f}ms")
            report.append(f"  - Baseline: {trend['response_time_p95_ms']['first_value']:.2f}ms")
            report.append(f"  - Change: {trend['response_time_p95_ms']['change']:.2f}ms ({trend['response_time_p95_ms']['change_percent']:.1f}%)")
            report.append(f"  - Trend: {self._get_trend_emoji(trend['response_time_p95_ms']['trend'])} {trend['response_time_p95_ms']['trend'].upper()}")
            report.append("")

            report.append(f"- **P99 Response Time:**")
            report.append(f"  - Current: {trend['response_time_p99_ms']['last_value']:.2f}ms")
            report.append(f"  - Baseline: {trend['response_time_p99_ms']['first_value']:.2f}ms")
            report.append(f"  - Change: {trend['response_time_p99_ms']['change']:.2f}ms ({trend['response_time_p99_ms']['change_percent']:.1f}%)")
            report.append(f"  - Trend: {self._get_trend_emoji(trend['response_time_p99_ms']['trend'])} {trend['response_time_p99_ms']['trend'].upper()}")
            report.append("")

            report.append(f"**Error Rate:**")
            report.append(f"  - Current: {trend['error_rate']['last_value']:.2f}%")
            report.append(f"  - Baseline: {trend['error_rate']['first_value']:.2f}%")
            report.append(f"  - Change: {trend['error_rate']['change']:.2f}%")
            report.append(f"  - Trend: {self._get_trend_emoji(trend['error_rate']['trend'])} {trend['error_rate']['trend'].upper()}")
            report.append("")

        return "\n".join(report)

    def _get_trend_emoji(self, trend: str) -> str:
        """Get emoji for trend status"""
        emojis = {
            "improving": "✅",
            "stable": "📊",
            "degrading": "⚠️",
            "insufficient_data": "❓",
        }
        return emojis.get(trend, "❓")


def main():
    """Main execution"""
    parser = argparse.ArgumentParser(description="Generate performance trend report")
    parser.add_argument(
        "--input",
        required=True,
        help="Path to performance history JSON file",
    )
    parser.add_argument(
        "--output",
        default="performance_trend_report.md",
        help="Path to output report file",
    )
    args = parser.parse_args()

    analyzer = PerformanceTrendAnalyzer(Path(args.input))
    report = analyzer.generate_full_report()

    output_path = Path(args.output)
    output_path.parent.mkdir(parents=True, exist_ok=True)

    with open(output_path, "w") as f:
        f.write(report)

    print(f"✅ Performance trend report saved to {output_path}")
    print(f"📊 Analyzed {len(analyzer.history)} data points")


if __name__ == "__main__":
    main()
