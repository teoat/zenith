#!/usr/bin/env python3
"""
Load Testing Configuration
Tests system performance under various load conditions
"""

import asyncio
import json
import statistics
import time
from dataclasses import dataclass, field
from datetime import datetime
from typing import Any

import httpx


@dataclass
class LoadTestConfig:
    base_url: str
    endpoints: list[dict]
    virtual_users: int = 10
    duration_seconds: int = 60
    ramp_up_seconds: int = 10
    think_time_ms: int = 100


@dataclass
class RequestResult:
    endpoint: str
    method: str
    status_code: int
    latency_ms: float
    timestamp: datetime
    success: bool
    error: str | None = None


@dataclass
class LoadTestResult:
    test_name: str
    duration_seconds: float
    total_requests: int
    successful_requests: int
    failed_requests: int
    requests_per_second: float
    avg_latency_ms: float
    p50_latency_ms: float
    p95_latency_ms: float
    p99_latency_ms: float
    min_latency_ms: float
    max_latency_ms: float
    error_rate: float
    endpoint_results: dict[str, Any]
    timestamp: datetime


class LoadTester:
    """
    Load testing tool for performance validation
    """

    def __init__(self, config: LoadTestConfig):
        self.config = config
        self.results: list[RequestResult] = []
        self.running = False

    async def _make_request(
        self,
        client: httpx.AsyncClient,
        endpoint: dict,
    ) -> RequestResult:
        """Make a single HTTP request"""
        url = f"{self.config.base_url}{endpoint['path']}"
        method = endpoint.get("method", "GET")
        payload = endpoint.get("payload", {})

        start_time = time.perf_counter()

        try:
            response = await client.request(
                method,
                url,
                json=payload if payload else None,
                timeout=30.0,
            )

            latency_ms = (time.perf_counter() - start_time) * 1000

            return RequestResult(
                endpoint=endpoint["path"],
                method=method,
                status_code=response.status_code,
                latency_ms=latency_ms,
                timestamp=datetime.now(),
                success=response.status_code < 400,
            )

        except Exception as e:
            latency_ms = (time.perf_counter() - start_time) * 1000

            return RequestResult(
                endpoint=endpoint["path"],
                method=method,
                status_code=0,
                latency_ms=latency_ms,
                timestamp=datetime.now(),
                success=False,
                error=str(e),
            )

    async def _worker(self, worker_id: int):
        """Worker that makes requests"""
        async with httpx.AsyncClient() as client:
            while self.running:
                for endpoint in self.config.endpoints:
                    if not self.running:
                        break

                    result = await self._make_request(client, endpoint)
                    self.results.append(result)

                    await asyncio.sleep(self.config.think_time_ms / 1000)

    async def run_test(self, test_name: str = "load-test") -> LoadTestResult:
        """Run load test"""
        self.running = True
        self.results = []

        start_time = time.time()

        workers = []
        for i in range(self.config.virtual_users):
            worker = asyncio.create_task(self._worker(i))
            workers.append(worker)

        await asyncio.sleep(self.config.duration_seconds)

        self.running = False
        await asyncio.gather(*workers, return_exceptions=True)

        duration = time.time() - start_time

        return self._calculate_results(test_name, duration)

    def _calculate_results(self, test_name: str, duration: float) -> LoadTestResult:
        """Calculate test results"""
        successful = [r for r in self.results if r.success]
        failed = [r for r in self.results if not r.success]

        latencies = [r.latency_ms for r in self.results]

        endpoint_stats = {}
        for endpoint in self.config.endpoints:
            endpoint_results = [r for r in self.results if r.endpoint == endpoint["path"]]
            if endpoint_results:
                endpoint_latencies = [r.latency_ms for r in endpoint_results]
                endpoint_stats[endpoint["path"]] = {
                    "requests": len(endpoint_results),
                    "success": len([r for r in endpoint_results if r.success]),
                    "avg_latency_ms": statistics.mean(endpoint_latencies),
                    "p95_latency_ms": self._percentile(endpoint_latencies, 95),
                }

        return LoadTestResult(
            test_name=test_name,
            duration_seconds=duration,
            total_requests=len(self.results),
            successful_requests=len(successful),
            failed_requests=len(failed),
            requests_per_second=len(self.results) / duration,
            avg_latency_ms=statistics.mean(latencies) if latencies else 0,
            p50_latency_ms=self._percentile(latencies, 50),
            p95_latency_ms=self._percentile(latencies, 95),
            p99_latency_ms=self._percentile(latencies, 99),
            min_latency_ms=min(latencies) if latencies else 0,
            max_latency_ms=max(latencies) if latencies else 0,
            error_rate=len(failed) / len(self.results) if self.results else 0,
            endpoint_results=endpoint_stats,
            timestamp=datetime.now(),
        )

    def _percentile(self, data: list[float], percentile: int) -> float:
        """Calculate percentile"""
        if not data:
            return 0
        sorted_data = sorted(data)
        index = int(len(sorted_data) * percentile / 100)
        return sorted_data[min(index, len(sorted_data) - 1)]

    def format_results(self, result: LoadTestResult) -> str:
        """Format results as pretty string"""
        lines = [
            f"Load Test Results: {result.test_name}",
            f"Timestamp: {result.timestamp.isoformat()}",
            "-" * 50,
            f"Duration: {result.duration_seconds:.2f}s",
            f"Total Requests: {result.total_requests}",
            f"Requests/sec: {result.requests_per_second:.2f}",
            "-" * 50,
            f"Successful: {result.successful_requests}",
            f"Failed: {result.failed_requests}",
            f"Error Rate: {result.error_rate * 100:.2f}%",
            "-" * 50,
            f"Avg Latency: {result.avg_latency_ms:.2f}ms",
            f"P50 Latency: {result.p50_latency_ms:.2f}ms",
            f"P95 Latency: {result.p95_latency_ms:.2f}ms",
            f"P99 Latency: {result.p99_latency_ms:.2f}ms",
            "-" * 50,
            "Endpoint Results:",
        ]

        for endpoint, stats in result.endpoint_results.items():
            lines.append(f"  {endpoint}:")
            lines.append(f"    Requests: {stats['requests']}")
            lines.append(f"    Success: {stats['success']}")
            lines.append(f"    Avg Latency: {stats['avg_latency_ms']:.2f}ms")

        return "\n".join(lines)


async def run_scenario_tests():
    """Run various load testing scenarios"""

    scenarios = [
        {
            "name": "baseline-10vu-1m",
            "config": LoadTestConfig(
                base_url="http://localhost:8000",
                endpoints=[
                    {"path": "/health", "method": "GET"},
                    {"path": "/api/v1/cases", "method": "GET"},
                    {"path": "/api/v1/cases", "method": "POST", "payload": {"title": "Test", "description": "Load test"}},
                ],
                virtual_users=10,
                duration_seconds=60,
                think_time_ms=100,
            ),
        },
        {
            "name": "stress-50vu-2m",
            "config": LoadTestConfig(
                base_url="http://localhost:8000",
                endpoints=[
                    {"path": "/api/v1/cases", "method": "GET"},
                    {"path": "/api/v1/cases/{id}", "method": "GET"},
                    {"path": "/api/v1/ai/fraud-score", "method": "POST", "payload": {"amount": 100}},
                ],
                virtual_users=50,
                duration_seconds=120,
                think_time_ms=50,
            ),
        },
        {
            "name": "spike-100vu-30s",
            "config": LoadTestConfig(
                base_url="http://localhost:8000",
                endpoints=[
                    {"path": "/api/v1/cases", "method": "GET"},
                    {"path": "/api/v1/fraud/scan", "method": "POST", "payload": {"entity_type": "account"}},
                ],
                virtual_users=100,
                duration_seconds=30,
                think_time_ms=0,
            ),
        },
    ]

    results = []
    for scenario in scenarios:
        print(f"\nRunning scenario: {scenario['name']}")
        tester = LoadTester(scenario["config"])
        result = await tester.run_test(scenario["name"])
        results.append(result)
        print(tester.format_results(result))

    return results


if __name__ == "__main__":
    results = asyncio.run(run_scenario_tests())

    print("\n" + "=" * 50)
    print("SUMMARY")
    print("=" * 50)
    for result in results:
        print(f"{result.test_name}:")
        print(f"  RPS: {result.requests_per_second:.2f}")
        print(f"  Error Rate: {result.error_rate * 100:.2f}%")
        print(f"  P95 Latency: {result.p95_latency_ms:.2f}ms")
