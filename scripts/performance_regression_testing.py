#!/usr/bin/env python3
"""
Automated Performance Regression Testing Framework
Monitors and detects performance regressions in the fraud detection platform
"""

import time
import statistics
import json
from datetime import datetime, timedelta
from typing import Dict, List, Any, Optional
from dataclasses import dataclass, field
import asyncio
from pathlib import Path

@dataclass
class PerformanceBenchmark:
    """Performance benchmark result"""
    test_name: str
    timestamp: datetime
    response_time: float
    throughput: float
    memory_usage: float
    cpu_usage: float
    error_rate: float
    metadata: Dict[str, Any] = field(default_factory=dict)

@dataclass
class PerformanceRegression:
    """Detected performance regression"""
    metric: str
    baseline_value: float
    current_value: float
    degradation_percentage: float
    threshold_percentage: float
    severity: str
    description: str

class PerformanceRegressionTester:
    """Automated performance regression testing system"""

    def __init__(self):
        self.benchmarks: List[PerformanceBenchmark] = []
        self.baseline_metrics: Dict[str, Dict[str, float]] = {}
        self.regression_thresholds = {
            "response_time": 0.20,  # 20% degradation allowed
            "throughput": -0.15,    # 15% throughput drop allowed
            "memory_usage": 0.25,   # 25% memory increase allowed
            "cpu_usage": 0.30,      # 30% CPU increase allowed
            "error_rate": 0.10      # 10% error rate increase allowed
        }

    def load_baseline_metrics(self):
        """Load baseline performance metrics"""
        baseline_file = Path("performance_baseline.json")
        if baseline_file.exists():
            with open(baseline_file, 'r') as f:
                data = json.load(f)
                self.baseline_metrics = data.get("metrics", {})
                print(f"✅ Loaded baseline metrics from {len(self.baseline_metrics)} test runs")
        else:
            print("⚠️ No baseline metrics found. Run performance tests first.")

    def save_baseline_metrics(self):
        """Save current benchmarks as baseline"""
        if not self.benchmarks:
            print("❌ No benchmarks to save as baseline")
            return

        # Calculate averages for each test
        test_metrics = {}
        for benchmark in self.benchmarks:
            if benchmark.test_name not in test_metrics:
                test_metrics[benchmark.test_name] = {
                    "response_times": [],
                    "throughputs": [],
                    "memory_usages": [],
                    "cpu_usages": [],
                    "error_rates": []
                }

            test_metrics[benchmark.test_name]["response_times"].append(benchmark.response_time)
            test_metrics[benchmark.test_name]["throughputs"].append(benchmark.throughput)
            test_metrics[benchmark.test_name]["memory_usages"].append(benchmark.memory_usage)
            test_metrics[benchmark.test_name]["cpu_usages"].append(benchmark.cpu_usage)
            test_metrics[benchmark.test_name]["error_rates"].append(benchmark.error_rate)

        # Calculate averages
        baseline_data = {"timestamp": datetime.now().isoformat(), "metrics": {}}
        for test_name, metrics in test_metrics.items():
            baseline_data["metrics"][test_name] = {
                "avg_response_time": statistics.mean(metrics["response_times"]),
                "avg_throughput": statistics.mean(metrics["throughputs"]),
                "avg_memory_usage": statistics.mean(metrics["memory_usages"]),
                "avg_cpu_usage": statistics.mean(metrics["cpu_usages"]),
                "avg_error_rate": statistics.mean(metrics["error_rates"]),
                "sample_count": len(metrics["response_times"])
            }

        with open("performance_baseline.json", 'w') as f:
            json.dump(baseline_data, f, indent=2)

        print(f"✅ Saved baseline metrics for {len(test_metrics)} tests")

    async def run_performance_test(self, test_name: str, test_function, *args, **kwargs) -> PerformanceBenchmark:
        """Run a performance test and capture metrics"""

        print(f"🏃 Running performance test: {test_name}")

        # Start monitoring
        start_time = time.time()
        start_metrics = await self._capture_system_metrics()

        try:
            # Run the test function
            await test_function(*args, **kwargs)

            # Capture end metrics
            end_time = time.time()
            end_metrics = await self._capture_system_metrics()

            # Calculate performance metrics
            duration = end_time - start_time

            # Simulate metrics (in real implementation, would use actual monitoring)
            response_time = duration / 10  # Average response time
            throughput = 100 / duration    # Requests per second
            memory_usage = (start_metrics.get("memory", 50) + end_metrics.get("memory", 50)) / 2
            cpu_usage = (start_metrics.get("cpu", 30) + end_metrics.get("cpu", 30)) / 2
            error_rate = 0.001  # Very low error rate

            benchmark = PerformanceBenchmark(
                test_name=test_name,
                timestamp=datetime.now(),
                response_time=response_time,
                throughput=throughput,
                memory_usage=memory_usage,
                cpu_usage=cpu_usage,
                error_rate=error_rate,
                metadata={
                    "duration": duration,
                    "start_metrics": start_metrics,
                    "end_metrics": end_metrics
                }
            )

            self.benchmarks.append(benchmark)
            print(".3f")
            print(".1f")
            return benchmark

        except Exception as e:
            print(f"❌ Test {test_name} failed: {e}")
            # Return failed benchmark
            return PerformanceBenchmark(
                test_name=test_name,
                timestamp=datetime.now(),
                response_time=999,
                throughput=0,
                memory_usage=100,
                cpu_usage=100,
                error_rate=1.0,
                metadata={"error": str(e)}
            )

    async def _capture_system_metrics(self) -> Dict[str, float]:
        """Capture current system metrics"""
        # In a real implementation, this would use psutil, prometheus client, etc.
        # For demo purposes, return simulated metrics
        import random
        return {
            "memory": random.uniform(40, 80),
            "cpu": random.uniform(20, 70),
            "disk": random.uniform(30, 60),
            "network": random.uniform(10, 50)
        }

    def detect_regressions(self) -> List[PerformanceRegression]:
        """Detect performance regressions compared to baseline"""

        regressions = []

        if not self.baseline_metrics:
            print("⚠️ No baseline metrics available for comparison")
            return regressions

        for benchmark in self.benchmarks:
            test_name = benchmark.test_name
            if test_name not in self.baseline_metrics:
                continue

            baseline = self.baseline_metrics[test_name]

            # Check each metric for regression
            metrics_to_check = [
                ("response_time", benchmark.response_time, baseline["avg_response_time"]),
                ("throughput", benchmark.throughput, baseline["avg_throughput"]),
                ("memory_usage", benchmark.memory_usage, baseline["avg_memory_usage"]),
                ("cpu_usage", benchmark.cpu_usage, baseline["avg_cpu_usage"]),
                ("error_rate", benchmark.error_rate, baseline["avg_error_rate"])
            ]

            for metric_name, current_value, baseline_value in metrics_to_check:
                if baseline_value == 0:
                    continue

                # Calculate degradation (positive = worse performance)
                if metric_name in ["response_time", "memory_usage", "cpu_usage", "error_rate"]:
                    degradation = (current_value - baseline_value) / baseline_value
                else:  # throughput (negative = worse)
                    degradation = (baseline_value - current_value) / baseline_value

                threshold = self.regression_thresholds.get(metric_name, 0.10)

                if abs(degradation) > threshold:
                    severity = "HIGH" if abs(degradation) > threshold * 2 else "MEDIUM"

                    regression = PerformanceRegression(
                        metric=metric_name,
                        baseline_value=baseline_value,
                        current_value=current_value,
                        degradation_percentage=degradation * 100,
                        threshold_percentage=threshold * 100,
                        severity=severity,
                        description=".2f"
                    )

                    regressions.append(regression)

        return regressions

    def generate_regression_report(self, regressions: List[PerformanceRegression]) -> Dict[str, Any]:
        """Generate performance regression report"""

        report = {
            "report_generated": datetime.now().isoformat(),
            "benchmarks_run": len(self.benchmarks),
            "regressions_detected": len(regressions),
            "overall_status": "PASS" if len(regressions) == 0 else "FAIL",
            "regressions": [],
            "benchmarks": [],
            "recommendations": []
        }

        # Add regression details
        for regression in regressions:
            report["regressions"].append({
                "metric": regression.metric,
                "severity": regression.severity,
                "baseline_value": regression.baseline_value,
                "current_value": regression.current_value,
                "degradation_percentage": regression.degradation_percentage,
                "description": regression.description
            })

        # Add benchmark summaries
        for benchmark in self.benchmarks:
            report["benchmarks"].append({
                "test_name": benchmark.test_name,
                "timestamp": benchmark.timestamp.isoformat(),
                "response_time": benchmark.response_time,
                "throughput": benchmark.throughput,
                "memory_usage": benchmark.memory_usage,
                "cpu_usage": benchmark.cpu_usage,
                "error_rate": benchmark.error_rate
            })

        # Generate recommendations
        if regressions:
            high_severity = len([r for r in regressions if r.severity == "HIGH"])
            if high_severity > 0:
                report["recommendations"].append("URGENT: Address high-severity performance regressions before deployment")

            report["recommendations"].append("Investigate root causes of detected performance regressions")
            report["recommendations"].append("Consider performance optimizations for degraded metrics")
            report["recommendations"].append("Update baseline metrics if performance changes are intentional")
        else:
            report["recommendations"].append("Performance is within acceptable thresholds")
            report["recommendations"].append("Continue monitoring for future regressions")

        # Save report
        report_path = Path("performance_regression_report.json")
        with open(report_path, 'w') as f:
            json.dump(report, f, indent=2, default=str)

        return report

# Sample test functions
async def api_response_time_test():
    """Test API response times"""
    await asyncio.sleep(0.1)  # Simulate API call

async def fraud_detection_throughput_test():
    """Test fraud detection throughput"""
    await asyncio.sleep(0.05)  # Simulate processing

async def database_query_performance_test():
    """Test database query performance"""
    await asyncio.sleep(0.02)  # Simulate DB query

async def memory_intensive_operation_test():
    """Test memory-intensive operations"""
    # Simulate memory usage
    data = [i for i in range(10000)]  # Create some data
    await asyncio.sleep(0.03)

async def cpu_intensive_calculation_test():
    """Test CPU-intensive calculations"""
    # Simulate CPU work
    result = sum(i*i for i in range(1000))
    await asyncio.sleep(0.04)

async def run_performance_regression_tests():
    """Run comprehensive performance regression testing"""

    print("📈 PERFORMANCE REGRESSION TESTING")
    print("=" * 45)

    tester = PerformanceRegressionTester()

    # Load baseline metrics
    tester.load_baseline_metrics()

    # Define test suite
    test_suite = [
        ("API Response Time", api_response_time_test),
        ("Fraud Detection Throughput", fraud_detection_throughput_test),
        ("Database Query Performance", database_query_performance_test),
        ("Memory Intensive Operations", memory_intensive_operation_test),
        ("CPU Intensive Calculations", cpu_intensive_calculation_test)
    ]

    # Run all tests
    for test_name, test_function in test_suite:
        benchmark = await tester.run_performance_test(test_name, test_function)
        await asyncio.sleep(0.1)  # Brief pause between tests

    # Save baseline if no baseline exists
    if not tester.baseline_metrics:
        print("\n📊 Establishing baseline metrics...")
        tester.save_baseline_metrics()

    # Detect regressions
    print("\n🔍 Detecting performance regressions...")
    regressions = tester.detect_regressions()

    if regressions:
        print(f"🚨 Found {len(regressions)} performance regressions:")
        for regression in regressions:
            print(f"  {regression.severity}: {regression.description}")
    else:
        print("✅ No performance regressions detected")

    # Generate report
    report = tester.generate_regression_report(regressions)

    print("\n📊 PERFORMANCE REGRESSION REPORT")
    print(f"Tests Run: {report['benchmarks_run']}")
    print(f"Regressions Detected: {report['regressions_detected']}")
    print(f"Overall Status: {report['overall_status']}")
    print(f"Report saved to: performance_regression_report.json")

    return report

if __name__ == "__main__":
    asyncio.run(run_performance_regression_tests())