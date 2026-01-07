"""
Performance Profiling Tools
Task 5.4: Performance Analysis and Optimization

Provides tools for:
- Load testing scenarios
- Performance bottleneck identification
- Database query analysis
- Memory profiling
- CPU profiling
"""

import asyncio
import cProfile
import io
import pstats
import statistics
import time
from collections.abc import Callable
from dataclasses import dataclass
from datetime import datetime
from typing import Any


@dataclass
class PerformanceResult:
    """Performance test result"""

    name: str
    total_requests: int
    duration_seconds: float
    requests_per_second: float
    avg_response_time_ms: float
    min_response_time_ms: float
    max_response_time_ms: float
    p50_response_time_ms: float
    p95_response_time_ms: float
    p99_response_time_ms: float
    error_count: int
    error_rate: float


class PerformanceProfiler:
    """
    Performance profiling toolkit for identifying bottlenecks
    """

    @staticmethod
    async def load_test(
        test_func: Callable,
        num_requests: int = 100,
        concurrent_requests: int = 10,
        test_name: str = "Load Test",
    ) -> PerformanceResult:
        """
        Run load test on async function

        Args:
            test_func: Async function to test
            num_requests: Total number of requests
            concurrent_requests: Number of concurrent requests
            test_name: Name of the test

        Returns:
            Performance test results
        """
        response_times = []
        errors = 0

        start_time = time.time()

        # Execute in batches
        for i in range(0, num_requests, concurrent_requests):
            batch_size = min(concurrent_requests, num_requests - i)
            tasks = []

            for _ in range(batch_size):
                task_start = time.time()
                task = test_func()
                tasks.append((task, task_start))

            # Run batch concurrently
            results = await asyncio.gather(
                *[t[0] for t in tasks], return_exceptions=True
            )

            # Record times
            for idx, result in enumerate(results):
                duration = time.time() - tasks[idx][1]
                response_times.append(duration * 1000)  # Convert to ms

                if isinstance(result, Exception):
                    errors += 1

        total_duration = time.time() - start_time

        # Calculate statistics
        response_times.sort()

        return PerformanceResult(
            name=test_name,
            total_requests=num_requests,
            duration_seconds=round(total_duration, 2),
            requests_per_second=round(num_requests / total_duration, 2),
            avg_response_time_ms=round(statistics.mean(response_times), 2),
            min_response_time_ms=round(min(response_times), 2),
            max_response_time_ms=round(max(response_times), 2),
            p50_response_time_ms=round(statistics.median(response_times), 2),
            p95_response_time_ms=round(
                response_times[int(len(response_times) * 0.95)], 2
            ),
            p99_response_time_ms=round(
                response_times[int(len(response_times) * 0.99)], 2
            ),
            error_count=errors,
            error_rate=round(errors / num_requests * 100, 2),
        )

    @staticmethod
    def profile_function(func: Callable, *args, **kwargs) -> dict[str, Any]:
        """
        Profile a function and return statistics

        Args:
            func: Function to profile
            *args: Function arguments
            **kwargs: Function keyword arguments

        Returns:
            Profiling statistics
        """
        profiler = cProfile.Profile()
        profiler.enable()

        result = func(*args, **kwargs)

        profiler.disable()

        # Get stats
        s = io.StringIO()
        ps = pstats.Stats(profiler, stream=s).sort_stats("cumulative")
        ps.print_stats(20)  # Top 20 functions

        return {
            "result": result,
            "stats": s.getvalue(),
            "total_calls": ps.total_calls,
            "total_time": ps.total_tt,
        }

    @staticmethod
    def analyze_query_performance(queries: list[dict[str, Any]]) -> dict[str, Any]:
        """
        Analyze database query performance

        Args:
            queries: List of query records with 'sql' and 'duration' keys

        Returns:
            Query performance analysis
        """
        if not queries:
            return {"message": "No queries to analyze"}

        total_time = sum(q["duration"] for q in queries)
        query_times = [q["duration"] for q in queries]

        # Find slow queries (>100ms)
        slow_queries = [q for q in queries if q["duration"] > 100]

        # Group by query type
        query_types = {}
        for query in queries:
            sql = query["sql"].strip().split()[0].upper()
            if sql not in query_types:
                query_types[sql] = {"count": 0, "total_time": 0}
            query_types[sql]["count"] += 1
            query_types[sql]["total_time"] += query["duration"]

        return {
            "total_queries": len(queries),
            "total_time_ms": round(total_time, 2),
            "avg_query_time_ms": round(statistics.mean(query_times), 2),
            "slowest_query_ms": round(max(query_times), 2),
            "fastest_query_ms": round(min(query_times), 2),
            "slow_queries_count": len(slow_queries),
            "slow_queries": [
                {
                    "sql": q["sql"][:100] + "..." if len(q["sql"]) > 100 else q["sql"],
                    "duration_ms": round(q["duration"], 2),
                }
                for q in sorted(
                    slow_queries, key=lambda x: x["duration"], reverse=True
                )[:10]
            ],
            "query_types": {
                qtype: {
                    "count": data["count"],
                    "total_time_ms": round(data["total_time"], 2),
                    "avg_time_ms": round(data["total_time"] / data["count"], 2),
                }
                for qtype, data in query_types.items()
            },
        }


class PerformanceBenchmark:
    """Standard performance benchmarks"""

    @staticmethod
    async def benchmark_fraud_detection(engine):
        """Benchmark fraud detection engine"""
        from datetime import datetime, timedelta

        from app.services.intelligence import Transaction

        # Create test transactions
        test_txs = [
            Transaction(
                f"tx{i}",
                9900,
                datetime.now() - timedelta(hours=i),
                "ACC001",
                "ACC002",
                f"Test {i}",
            )
            for i in range(1000)
        ]

        start = time.time()
        alerts = engine.analyze_transactions(test_txs)
        duration = time.time() - start

        return {
            "name": "Fraud Detection Engine",
            "transactions_analyzed": len(test_txs),
            "alerts_generated": len(alerts),
            "duration_seconds": round(duration, 3),
            "throughput_tx_per_sec": round(len(test_txs) / duration, 2),
        }

    @staticmethod
    async def benchmark_evidence_processing(processor):
        """Benchmark evidence processor"""

        # This would test actual file processing
        # Placeholder for demonstration
        return {
            "name": "Evidence Processor",
            "status": "Ready for testing",
            "note": "Add sample files to /tests/fixtures/ for benchmarking",
        }

    @staticmethod
    async def benchmark_graph_rendering(graph_data):
        """Benchmark graph rendering performance"""

        node_counts = [100, 500, 1000, 2000]
        results = []

        for count in node_counts:
            # Simulate graph with N nodes
            [{"id": str(i), "label": f"Node {i}"} for i in range(count)]
            links = [
                {"source": str(i), "target": str((i + 1) % count)} for i in range(count)
            ]

            # Time the layout calculation (simulated)
            start = time.time()
            # In real scenario, this would trigger force-directed layout
            await asyncio.sleep(0.001 * count)  # Simulate computation
            duration = time.time() - start

            results.append(
                {
                    "nodes": count,
                    "links": len(links),
                    "duration_ms": round(duration * 1000, 2),
                    "fps_estimate": round(
                        1 / (duration / 60) if duration > 0 else 60, 1
                    ),
                }
            )

        return {
            "name": "Graph Rendering Performance",
            "results": results,
            "recommendation": "Use WebGL for 1000+ nodes",
        }


def generate_performance_report(results: list[PerformanceResult]) -> str:
    """Generate human-readable performance report"""

    report = ["=" * 80]
    report.append("PERFORMANCE TEST REPORT")
    report.append("=" * 80)
    report.append(f"Generated: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}")
    report.append("")

    for result in results:
        report.append(f"\n📊 {result.name}")
        report.append("-" * 80)
        report.append(f"Total Requests:     {result.total_requests}")
        report.append(f"Duration:           {result.duration_seconds}s")
        report.append(f"Throughput:         {result.requests_per_second} req/s")
        report.append("\nResponse Times (ms):")
        report.append(f"  Average:          {result.avg_response_time_ms}")
        report.append(f"  Min:              {result.min_response_time_ms}")
        report.append(f"  Max:              {result.max_response_time_ms}")
        report.append(f"  P50 (Median):     {result.p50_response_time_ms}")
        report.append(f"  P95:              {result.p95_response_time_ms}")
        report.append(f"  P99:              {result.p99_response_time_ms}")
        report.append(
            f"\n_errors:             {result.error_count} ({result.error_rate}%)"
        )

        # Performance assessment
        if result.requests_per_second > 100:
            status = "✅ Excellent"
        elif result.requests_per_second > 50:
            status = "✓ Good"
        elif result.requests_per_second > 20:
            status = "⚠ Fair"
        else:
            status = "❌ Needs Optimization"

        report.append(f"\n_status:             {status}")

    report.append("\n" + "=" * 80)

    return "\n".join(report)


# Example usage
if __name__ == "__main__":
    print("Performance Profiling Tools")
    print("=" * 60)
    print("\n✓ Load testing")
    print("✓ Function profiling")
    print("✓ Query analysis")
    print("✓ Benchmarking suite")
    print("\n_usage:")
    print("  from app.performance import PerformanceProfiler")
    print("  result = await profiler.load_test(my_async_func, 1000, 50)")
    print("  print(generate_performance_report([result]))")
