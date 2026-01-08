#!/usr/bin/env python3
"""
Production Deployment Verification Script
Comprehensive checks for deployment validation
"""

import argparse
import asyncio
import json
import sys
from dataclasses import dataclass, field
from datetime import datetime
from enum import Enum
from typing import Any

import httpx


class CheckStatus(Enum):
    PASS = "pass"
    FAIL = "fail"
    WARN = "warn"
    SKIP = "skip"


@dataclass
class CheckResult:
    name: str
    status: CheckStatus
    message: str
    details: dict[str, Any] = field(default_factory=dict)
    duration_ms: float = 0.0


class DeploymentVerifier:
    """
    Comprehensive deployment verification
    """

    def __init__(self, railway_url: str, vercel_url: str):
        self.railway_url = railway_url
        self.vercel_url = vercel_url
        self.results: list[CheckResult] = []

    async def run_all_checks(self) -> bool:
        """Run all verification checks"""
        checks = [
            self.check_railway_services,
            self.check_vercel_edge,
            self.check_database_connectivity,
            self.check_redis_connectivity,
            self.check_inter_service_communication,
            self.check_rate_limiting,
            self.check_caching,
            self.check_security_headers,
            self.check_metrics_endpoint,
        ]

        for check in checks:
            try:
                await check()
            except Exception as e:
                self.results.append(
                    CheckResult(
                        name=check.__name__,
                        status=CheckStatus.FAIL,
                        message=f"Check failed with exception: {str(e)}",
                    )
                )

        return all(r.status != CheckStatus.FAIL for r in self.results)

    async def check_railway_services(self):
        """Check all Railway services are healthy"""
        services = [
            ("api-gateway", f"{self.railway_url}/health"),
            ("ai-service", f"{self.railway_url.replace('api-gateway', 'ai-service')}/health"),
            ("fraud-service", f"{self.railway_url.replace('api-gateway', 'fraud-service')}/health"),
            ("workflow-service", f"{self.railway_url.replace('api-gateway', 'workflow-service')}/health"),
        ]

        for name, url in services:
            start = datetime.now()
            try:
                async with httpx.AsyncClient(timeout=30.0) as client:
                    response = await client.get(url)
                    duration = (datetime.now() - start).total_seconds() * 1000

                    if response.status_code == 200:
                        self.results.append(
                            CheckResult(
                                name=f"railway-{name}",
                                status=CheckStatus.PASS,
                                message=f"Service healthy (latency: {duration:.0f}ms)",
                                details={"url": url, "latency_ms": duration},
                                duration_ms=duration,
                            )
                        )
                    else:
                        self.results.append(
                            CheckResult(
                                name=f"railway-{name}",
                                status=CheckStatus.FAIL,
                                message=f"Service returned status {response.status_code}",
                                details={"url": url, "status": response.status_code},
                                duration_ms=duration,
                            )
                        )
            except Exception as e:
                self.results.append(
                    CheckResult(
                        name=f"railway-{name}",
                        status=CheckStatus.FAIL,
                        message=f"Failed to connect: {str(e)}",
                        details={"url": url},
                    )
                )

    async def check_vercel_edge(self):
        """Check Vercel Edge gateway"""
        endpoints = [
            (f"{self.vercel_url}/api/health?action=health", "health"),
            (f"{self.vercel_url}/api/health?action=stats", "stats"),
            (f"{self.vercel_url}/api/health?action=metrics", "metrics"),
        ]

        for url, action in endpoints:
            try:
                async with httpx.AsyncClient(timeout=30.0) as client:
                    response = await client.get(url)
                    if response.status_code == 200:
                        self.results.append(
                            CheckResult(
                                name=f"vercel-{action}",
                                status=CheckStatus.PASS,
                                message=f"Edge endpoint {action} responding",
                            )
                        )
            except Exception as e:
                self.results.append(
                    CheckResult(
                        name=f"vercel-{action}",
                        status=CheckStatus.FAIL,
                        message=str(e),
                    )
                )

    async def check_database_connectivity(self):
        """Check database connectivity via API"""
        try:
            async with httpx.AsyncClient() as client:
                response = await client.get(
                    f"{self.railway_url}/health",
                    headers={"Authorization": "Bearer test"},
                )
                if response.status_code == 200:
                    data = response.json()
                    if data.get("dependencies", {}).get("database") == "healthy":
                        self.results.append(
                            CheckResult(
                                name="database",
                                status=CheckStatus.PASS,
                                message="Database connection healthy",
                            )
                        )
                    else:
                        self.results.append(
                            CheckResult(
                                name="database",
                                status=CheckStatus.WARN,
                                message="Database status unclear",
                                details=data,
                            )
                        )
        except Exception as e:
            self.results.append(
                CheckResult(
                    name="database",
                    status=CheckStatus.FAIL,
                    message=str(e),
                )
            )

    async def check_redis_connectivity(self):
        """Check Redis connectivity"""
        try:
            async with httpx.AsyncClient() as client:
                response = await client.get(
                    f"{self.railway_url}/health",
                )
                if response.status_code == 200:
                    data = response.json()
                    redis_status = data.get("dependencies", {}).get("redis", "unknown")
                    if redis_status == "healthy":
                        self.results.append(
                            CheckResult(
                                name="redis",
                                status=CheckStatus.PASS,
                                message="Redis connection healthy",
                            )
                        )
                    elif redis_status == "unhealthy":
                        self.results.append(
                            CheckResult(
                                name="redis",
                                status=CheckStatus.FAIL,
                                message="Redis connection unhealthy",
                            )
                        )
        except Exception as e:
            self.results.append(
                CheckResult(
                    name="redis",
                    status=CheckStatus.FAIL,
                    message=str(e),
                )
            )

    async def check_inter_service_communication(self):
        """Check services can communicate"""
        endpoints = [
            f"{self.railway_url}/api/v1/cases",
            f"{self.railway_url}/api/v1/auth/login",
        ]

        for url in endpoints:
            try:
                async with httpx.AsyncClient(timeout=30.0) as client:
                    response = await client.get(url)
                    if response.status_code in [200, 401, 403]:
                        self.results.append(
                            CheckResult(
                                name=f"inter-service-{url.split('/')[-1]}",
                                status=CheckStatus.PASS,
                                message=f"Endpoint accessible (status: {response.status_code})",
                            )
                        )
            except Exception as e:
                self.results.append(
                    CheckResult(
                        name=f"inter-service-{url.split('/')[-1]}",
                        status=CheckStatus.FAIL,
                        message=str(e),
                    )
                )

    async def check_rate_limiting(self):
        """Check rate limiting is working"""
        try:
            async with httpx.AsyncClient() as client:
                responses = []
                for _ in range(5):
                    response = await client.get(f"{self.vercel_url}/api/health")
                    responses.append(response.status_code)

                if 429 in responses:
                    self.results.append(
                        CheckResult(
                            name="rate-limiting",
                            status=CheckStatus.PASS,
                            message="Rate limiting is active",
                        )
                    )
                else:
                    self.results.append(
                        CheckResult(
                            name="rate-limiting",
                            status=CheckStatus.WARN,
                            message="Rate limiting may not be active",
                        )
                    )
        except Exception as e:
            self.results.append(
                CheckResult(
                    name="rate-limiting",
                    status=CheckStatus.FAIL,
                    message=str(e),
                )
            )

    async def check_caching(self):
        """Check caching is working"""
        try:
            async with httpx.AsyncClient() as client:
                url = f"{self.vercel_url}/api/health?action=stats"
                response = await client.get(url)
                if response.status_code == 200:
                    data = response.json()
                    if data.get("metrics", {}).get("cacheHits", 0) > 0:
                        self.results.append(
                            CheckResult(
                                name="caching",
                                status=CheckStatus.PASS,
                                message="Cache is working",
                                details=data.get("metrics", {}),
                            )
                        )
                    else:
                        self.results.append(
                            CheckResult(
                                name="caching",
                                status=CheckStatus.WARN,
                                message="Cache not yet populated",
                            )
                        )
        except Exception as e:
            self.results.append(
                CheckResult(
                    name="caching",
                    status=CheckStatus.FAIL,
                    message=str(e),
                )
            )

    async def check_security_headers(self):
        """Check security headers are present"""
        required_headers = [
            "x-content-type-options",
            "x-frame-options",
            "strict-transport-security",
        ]

        try:
            async with httpx.AsyncClient() as client:
                response = await client.get(self.vercel_url)
                headers = {k.lower(): v for k, v in response.headers.items()}

                missing = []
                for header in required_headers:
                    if header not in headers:
                        missing.append(header)

                if not missing:
                    self.results.append(
                        CheckResult(
                            name="security-headers",
                            status=CheckStatus.PASS,
                            message="All required security headers present",
                        )
                    )
                else:
                    self.results.append(
                        CheckResult(
                            name="security-headers",
                            status=CheckStatus.FAIL,
                            message=f"Missing headers: {', '.join(missing)}",
                            details={"present": list(headers.keys())},
                        )
                    )
        except Exception as e:
            self.results.append(
                CheckResult(
                    name="security-headers",
                    status=CheckStatus.FAIL,
                    message=str(e),
                )
            )

    async def check_metrics_endpoint(self):
        """Check metrics endpoint returns valid data"""
        try:
            async with httpx.AsyncClient() as client:
                response = await client.get(f"{self.vercel_url}/api/health?action=metrics")
                if response.status_code == 200:
                    content = response.text
                    if "zenith_edge" in content:
                        self.results.append(
                            CheckResult(
                                name="metrics",
                                status=CheckStatus.PASS,
                                message="Prometheus metrics available",
                            )
                        )
                    else:
                        self.results.append(
                            CheckResult(
                                name="metrics",
                                status=CheckStatus.FAIL,
                                message="Metrics not in Prometheus format",
                            )
                        )
        except Exception as e:
            self.results.append(
                CheckResult(
                    name="metrics",
                    status=CheckStatus.FAIL,
                    message=str(e),
                )
            )

    def print_report(self):
        """Print verification report"""
        print("\n" + "=" * 60)
        print("DEPLOYMENT VERIFICATION REPORT")
        print("=" * 60)
        print(f"Timestamp: {datetime.now().isoformat()}")
        print(f"Railway URL: {self.railway_url}")
        print(f"Vercel URL: {self.vercel_url}")
        print("-" * 60)

        passed = sum(1 for r in self.results if r.status == CheckStatus.PASS)
        failed = sum(1 for r in self.results if r.status == CheckStatus.FAIL)
        warnings = sum(1 for r in self.results if r.status == CheckStatus.WARN)
        skipped = sum(1 for r in self.results if r.status == CheckStatus.SKIP)

        print(f"\nResults: {passed} passed, {failed} failed, {warnings} warnings, {skipped} skipped")
        print("-" * 60)

        for result in self.results:
            icon = {"pass": "✓", "fail": "✗", "warn": "⚠", "skip": "○"}[result.status.value]
            print(f"{icon} {result.name}: {result.message}")

        print("-" * 60)
        print(f"\nOverall Status: {'✓ PASSED' if failed == 0 else '✗ FAILED'}")
        print("=" * 60 + "\n")


async def main():
    parser = argparse.ArgumentParser(description="Verify deployment")
    parser.add_argument("--railway", required=True, help="Railway API Gateway URL")
    parser.add_argument("--vercel", required=True, help="Vercel Edge URL")
    args = parser.parse_args()

    verifier = DeploymentVerifier(args.railway, args.vercel)
    success = await verifier.run_all_checks()
    verifier.print_report()

    sys.exit(0 if success else 1)


if __name__ == "__main__":
    asyncio.run(main())
