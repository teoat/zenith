#!/usr/bin/env python3
"""
Load Test Results Analyzer
Analyzes load test results and generates performance reports
"""

import argparse
import json
import statistics
from pathlib import Path
from typing import Any, Dict


def analyze_load_test(results_file: str) -> dict[str, Any]:
    """Analyze a single load test results file"""

    with open(results_file) as f:
        data = json.load(f)

    summary = data["summary"]
    detailed = data["detailed_results"]

    # Calculate additional metrics
    analysis = {
        "test_file": results_file,
        "total_requests": summary["total_requests"],
        "successful_requests": summary["successful_requests"],
        "failed_requests": summary["failed_requests"],
        "success_rate": summary["success_rate"],
        "avg_response_time": summary["avg_response_time"],
        "median_response_time": summary["median_response_time"],
        "min_response_time": summary["min_response_time"],
        "max_response_time": summary["max_response_time"],
        "requests_per_second": summary["requests_per_second"],
        "p95_response_time": None,
        "p99_response_time": None,
        "endpoint_analysis": {},
        "performance_rating": "Unknown",
    }

    # Calculate percentiles
    if detailed:
        response_times = sorted([r["response_time"] for r in detailed])
        analysis["p95_response_time"] = response_times[int(len(response_times) * 0.95)]
        analysis["p99_response_time"] = response_times[int(len(response_times) * 0.99)]

    # Per-endpoint analysis
    endpoints = {}
    for result in detailed:
        endpoint = result["endpoint"]
        if endpoint not in endpoints:
            endpoints[endpoint] = []
        endpoints[endpoint].append(result)

    for endpoint, results in endpoints.items():
        success_count = sum(1 for r in results if r["success"])
        response_times = [r["response_time"] for r in results]

        analysis["endpoint_analysis"][endpoint] = {
            "requests": len(results),
            "success_rate": success_count / len(results) * 100,
            "avg_response_time": statistics.mean(response_times),
            "median_response_time": statistics.median(response_times),
            "min_response_time": min(response_times),
            "max_response_time": max(response_times),
        }

    # Performance rating
    if analysis["success_rate"] >= 99 and analysis["avg_response_time"] < 0.5:
        analysis["performance_rating"] = "Excellent"
    elif analysis["success_rate"] >= 95 and analysis["avg_response_time"] < 1.0:
        analysis["performance_rating"] = "Good"
    elif analysis["success_rate"] >= 90 and analysis["avg_response_time"] < 2.0:
        analysis["performance_rating"] = "Acceptable"
    elif analysis["success_rate"] >= 80:
        analysis["performance_rating"] = "Poor"
    else:
        analysis["performance_rating"] = "Critical"

    return analysis


def print_analysis(analysis: dict[str, Any]):
    """Print a formatted analysis report"""

    print(f"\n📊 Load Test Analysis: {analysis['test_file']}")
    print("=" * 60)
    print(f"Total Requests: {analysis['total_requests']}")
    print(
        f"Successful: {analysis['successful_requests']} ({analysis['success_rate']:.1f}%)"
    )
    print(f"Failed: {analysis['failed_requests']}")
    print(f"Requests/sec: {analysis['requests_per_second']:.2f}")
    print()

    print("Response Time Statistics:")
    print(".3f")
    print(".3f")
    print(".3f")
    print(".3f")
    if analysis["p95_response_time"]:
        print(".3f")
        print(".3f")
    print()

    print(f"Performance Rating: {analysis['performance_rating']}")
    print()

    print("Per-Endpoint Analysis:")
    for endpoint in analysis["endpoint_analysis"]:
        print(f"  {endpoint}:")
        print(".1f")
        print(".3f")


def main():
    parser = argparse.ArgumentParser(description="Analyze load test results")
    parser.add_argument("files", nargs="+", help="Load test result files to analyze")

    args = parser.parse_args()

    for file_path in args.files:
        if not Path(file_path).exists():
            print(f"❌ File not found: {file_path}")
            continue

        try:
            analysis = analyze_load_test(file_path)
            print_analysis(analysis)
        except Exception as e:
            print(f"❌ Error analyzing {file_path}: {e}")


if __name__ == "__main__":
    main()
