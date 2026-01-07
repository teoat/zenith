"""
Performance Regression Testing Suite
Automated performance testing with baseline comparison
"""

import json
import time
import statistics
from datetime import datetime
from pathlib import Path
from typing import Dict, List, Any
import httpx
import asyncio


class PerformanceRegressionTest:
    """Performance regression testing with baseline comparison"""

    def __init__(self, base_url: str = "http://localhost:8000"):
        self.base_url = base_url
        self.results: Dict[str, Any] = {}
        self.baseline_path = Path("tests/performance/baseline.json")
        self.current_path = Path("tests/performance/current.json")
        self.history_path = Path("tests/performance/history.json")
        self.thresholds = {
            "response_time_p95_increase_percent": 20,
            "response_time_mean_increase_percent": 15,
            "error_rate_increase_percent": 50,
        }

    async def run_endpoint_tests(self) -> Dict[str, Any]:
        """Test all critical endpoints with performance metrics"""
        endpoints = [
            {"method": "GET", "path": "/health", "expected_status": 200},
            {"method": "POST", "path": "/api/auth/login", "expected_status": 200},
            {"method": "GET", "path": "/api/cases", "expected_status": 200},
            {"method": "GET", "path": "/api/dashboard/metrics", "expected_status": 200},
            {"method": "POST", "path": "/api/ai/analyze", "expected_status": 200},
        ]

        results = {}

        for endpoint in endpoints:
            print(f"\n🧪 Testing {endpoint['method']} {endpoint['path']}")
            endpoint_result = await self.test_endpoint(
                endpoint["method"],
                endpoint["path"],
                endpoint["expected_status"],
            )
            results[endpoint["path"]] = endpoint_result

        return results

    async def test_endpoint(
        self, method: str, path: str, expected_status: int, iterations: int = 50
    ) -> Dict[str, Any]:
        """Test single endpoint with multiple iterations for metrics"""
        response_times = []
        errors = 0

        for i in range(iterations):
            start_time = time.time()
            try:
                url = f"{self.base_url}{path}"
                async with httpx.AsyncClient(timeout=30.0) as client:
                    if method == "GET":
                        response = await client.get(url)
                    elif method == "POST":
                        if path == "/api/auth/login":
                            payload = {
                                "username": "test_user",
                                "password": "test_password",
                            }
                        else:
                            payload = {"test": "data"}
                        response = await client.post(url, json=payload)

                    if response.status_code != expected_status:
                        errors += 1

                    end_time = time.time()
                    response_times.append((end_time - start_time) * 1000)

                    if (i + 1) % 10 == 0:
                        print(f"  Completed {i+1}/{iterations} iterations")

            except Exception as e:
                errors += 1
                print(f"  ⚠️  Error on iteration {i+1}: {str(e)}")

        if not response_times:
            return {"error": "All requests failed"}

        return {
            "method": method,
            "path": path,
            "iterations": iterations,
            "errors": errors,
            "error_rate": (errors / iterations) * 100,
            "response_time_mean_ms": statistics.mean(response_times),
            "response_time_median_ms": statistics.median(response_times),
            "response_time_p50_ms": statistics.quantiles(response_times, n=2)[0],
            "response_time_p95_ms": statistics.quantiles(response_times, n=20)[18]
            if len(response_times) > 20
            else max(response_times),
            "response_time_p99_ms": statistics.quantiles(response_times, n=100)[98]
            if len(response_times) > 100
            else max(response_times),
            "response_time_min_ms": min(response_times),
            "response_time_max_ms": max(response_times),
        }

    def load_baseline(self) -> Dict[str, Any]:
        """Load baseline performance metrics"""
        if not self.baseline_path.exists():
            return {}

        with open(self.baseline_path, "r") as f:
            return json.load(f)

    def save_baseline(self, results: Dict[str, Any]):
        """Save results as new baseline"""
        self.baseline_path.parent.mkdir(parents=True, exist_ok=True)

        with open(self.baseline_path, "w") as f:
            json.dump(
                {
                    "timestamp": datetime.now().isoformat(),
                    "results": results,
                },
                f,
                indent=2,
            )
        print(f"✅ Baseline saved to {self.baseline_path}")

    def save_current_results(self, results: Dict[str, Any]):
        """Save current test results"""
        self.current_path.parent.mkdir(parents=True, exist_ok=True)

        with open(self.current_path, "w") as f:
            json.dump(
                {
                    "timestamp": datetime.now().isoformat(),
                    "results": results,
                },
                f,
                indent=2,
            )
        print(f"✅ Current results saved to {self.current_path}")

    def append_to_history(self, results: Dict[str, Any]):
        """Append results to performance history"""
        history = []
        if self.history_path.exists():
            with open(self.history_path, "r") as f:
                history = json.load(f)

        history.append(
            {
                "timestamp": datetime.now().isoformat(),
                "results": results,
            }
        )

        self.history_path.parent.mkdir(parents=True, exist_ok=True)

        with open(self.history_path, "w") as f:
            json.dump(history, f, indent=2)
        print(f"✅ Results appended to {self.history_path}")

    def compare_with_baseline(
        self, current: Dict[str, Any], baseline: Dict[str, Any]
    ) -> Dict[str, Any]:
        """Compare current results with baseline and detect regressions"""
        regression_report = {
            "summary": {"regressions_found": 0, "improvements_found": 0},
            "details": {},
        }

        if not baseline:
            return {"message": "No baseline available for comparison"}

        for endpoint, current_metrics in current["results"].items():
            if endpoint not in baseline["results"]:
                continue

            baseline_metrics = baseline["results"][endpoint]
            endpoint_report = {
                "regressions": [],
                "improvements": [],
                "warnings": [],
            }

            response_time_p95_increase = (
                (current_metrics["response_time_p95_ms"] - baseline_metrics["response_time_p95_ms"])
                / baseline_metrics["response_time_p95_ms"]
                * 100
                if baseline_metrics["response_time_p95_ms"] > 0
                else 0
            )

            response_time_mean_increase = (
                (current_metrics["response_time_mean_ms"] - baseline_metrics["response_time_mean_ms"])
                / baseline_metrics["response_time_mean_ms"]
                * 100
                if baseline_metrics["response_time_mean_ms"] > 0
                else 0
            )

            error_rate_increase = (
                current_metrics["error_rate"] - baseline_metrics["error_rate"]
                if baseline_metrics["error_rate"] > 0
                else current_metrics["error_rate"]
            )

            if response_time_p95_increase > self.thresholds["response_time_p95_increase_percent"]:
                endpoint_report["regressions"].append(
                    f"P95 response time increased by {response_time_p95_increase:.1f}% "
                    f"(current: {current_metrics['response_time_p95_ms']:.2f}ms, "
                    f"baseline: {baseline_metrics['response_time_p95_ms']:.2f}ms)"
                )
            elif response_time_p95_increase < -10:
                endpoint_report["improvements"].append(
                    f"P95 response time improved by {abs(response_time_p95_increase):.1f}%"
                )

            if response_time_mean_increase > self.thresholds["response_time_mean_increase_percent"]:
                endpoint_report["regressions"].append(
                    f"Mean response time increased by {response_time_mean_increase:.1f}% "
                    f"(current: {current_metrics['response_time_mean_ms']:.2f}ms, "
                    f"baseline: {baseline_metrics['response_time_mean_ms']:.2f}ms)"
                )
            elif response_time_mean_increase < -10:
                endpoint_report["improvements"].append(
                    f"Mean response time improved by {abs(response_time_mean_increase):.1f}%"
                )

            if (
                error_rate_increase > 0
                and current_metrics["error_rate"] > baseline_metrics["error_rate"]
            ):
                endpoint_report["regressions"].append(
                    f"Error rate increased by {error_rate_increase:.1f}% "
                    f"(current: {current_metrics['error_rate']:.2f}%, "
                    f"baseline: {baseline_metrics['error_rate']:.2f}%)"
                )

            if current_metrics["error_rate"] > 5:
                endpoint_report["warnings"].append(
                    f"High error rate detected: {current_metrics['error_rate']:.2f}%"
                )

            if endpoint_report["regressions"] or endpoint_report["improvements"] or endpoint_report["warnings"]:
                regression_report["details"][endpoint] = endpoint_report
                regression_report["summary"]["regressions_found"] += len(endpoint_report["regressions"])
                regression_report["summary"]["improvements_found"] += len(endpoint_report["improvements"])

        return regression_report

    def generate_report(self, results: Dict[str, Any], comparison: Dict[str, Any]) -> str:
        """Generate comprehensive performance regression report"""
        report = []
        report.append("=" * 80)
        report.append("📊 PERFORMANCE REGRESSION TEST REPORT")
        report.append("=" * 80)
        report.append(f"Timestamp: {datetime.now().isoformat()}")
        report.append("")

        if comparison.get("message"):
            report.append(f"ℹ️  {comparison['message']}")
            report.append("")
            report.append("🎯 SETTING NEW BASELINE")
            return "\n".join(report)

        report.append("📈 SUMMARY")
        report.append("-" * 80)
        report.append(
            f"Regressions Found: {comparison['summary']['regressions_found']}"
        )
        report.append(
            f"Improvements Found: {comparison['summary']['improvements_found']}"
        )
        report.append("")

        if comparison["details"]:
            report.append("⚠️  REGRESSIONS AND IMPROVEMENTS")
            report.append("-" * 80)

            for endpoint, details in comparison["details"].items():
                report.append(f"\n🔗 {endpoint}")

                if details["regressions"]:
                    report.append("  🚨 REGRESSIONS:")
                    for regression in details["regressions"]:
                        report.append(f"    - {regression}")

                if details["improvements"]:
                    report.append("  ✅ IMPROVEMENTS:")
                    for improvement in details["improvements"]:
                        report.append(f"    - {improvement}")

                if details["warnings"]:
                    report.append("  ⚠️  WARNINGS:")
                    for warning in details["warnings"]:
                        report.append(f"    - {warning}")
        else:
            report.append("✅ NO REGRESSIONS DETECTED - PERFORMANCE STABLE")
            report.append("")

        report.append("\n📋 DETAILED METRICS")
        report.append("-" * 80)

        for endpoint, metrics in results["results"].items():
            report.append(f"\n🔗 {endpoint}")
            report.append(f"  Method: {metrics['method']}")
            report.append(f"  Iterations: {metrics['iterations']}")
            report.append(f"  Errors: {metrics['errors']}")
            report.append(f"  Error Rate: {metrics['error_rate']:.2f}%")
            report.append(f"  Response Times (ms):")
            report.append(f"    Mean: {metrics['response_time_mean_ms']:.2f}")
            report.append(f"    Median: {metrics['response_time_median_ms']:.2f}")
            report.append(f"    P50: {metrics['response_time_p50_ms']:.2f}")
            report.append(f"    P95: {metrics['response_time_p95_ms']:.2f}")
            report.append(f"    P99: {metrics['response_time_p99_ms']:.2f}")
            report.append(f"    Min: {metrics['response_time_min_ms']:.2f}")
            report.append(f"    Max: {metrics['response_time_max_ms']:.2f}")

        report.append("\n" + "=" * 80)

        return "\n".join(report)

    async def run(self, save_baseline: bool = False) -> bool:
        """Run complete performance regression test"""
        print("\n🚀 STARTING PERFORMANCE REGRESSION TEST")
        print("=" * 80)

        results = await self.run_endpoint_tests()

        test_results = {
            "timestamp": datetime.now().isoformat(),
            "results": results,
        }

        self.save_current_results(test_results)
        self.append_to_history(test_results)

        baseline = self.load_baseline()

        if save_baseline or not baseline:
            print("\n💾 Saving as baseline...")
            self.save_baseline(test_results)
            print("✅ New baseline established")
            return True

        comparison = self.compare_with_baseline(test_results, baseline)
        report = self.generate_report(test_results, comparison)

        print(report)

        report_path = Path("tests/performance/report.txt")
        report_path.parent.mkdir(parents=True, exist_ok=True)
        with open(report_path, "w") as f:
            f.write(report)

        if comparison["summary"]["regressions_found"] > 0:
            print("\n❌ PERFORMANCE REGRESSION DETECTED")
            print(f"Regressions: {comparison['summary']['regressions_found']}")
            return False
        else:
            print("\n✅ NO PERFORMANCE REGRESSIONS DETECTED")
            return True


async def main():
    """Main execution"""
    import argparse

    parser = argparse.ArgumentParser(description="Performance Regression Testing")
    parser.add_argument(
        "--base-url",
        default="http://localhost:8000",
        help="Base URL for API testing",
    )
    parser.add_argument(
        "--save-baseline",
        action="store_true",
        help="Save current results as new baseline",
    )
    args = parser.parse_args()

    tester = PerformanceRegressionTest(base_url=args.base_url)
    success = await tester.run(save_baseline=args.save_baseline)

    exit(0 if success else 1)


if __name__ == "__main__":
    asyncio.run(main())
