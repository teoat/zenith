#!/usr/bin/env python3
"""
Load Testing Script for Fraud Detection API
Provides basic load testing capabilities with configurable concurrent users and test duration.
"""

import asyncio
import aiohttp
import time
import statistics
from typing import List, Dict, Any
import argparse
import json
from datetime import datetime

class LoadTester:
    def __init__(self, base_url: str, concurrent_users: int = 10, duration: int = 60):
        self.base_url = base_url.rstrip('/')
        self.concurrent_users = concurrent_users
        self.duration = duration
        self.results: List[Dict[str, Any]] = []

    async def make_request(self, session: aiohttp.ClientSession, endpoint: str, user_id: int) -> Dict[str, Any]:
        """Make a single request and measure performance"""
        start_time = time.time()

        try:
            url = f"{self.base_url}{endpoint}"
            async with session.get(url) as response:
                response_time = time.time() - start_time
                return {
                    "user_id": user_id,
                    "endpoint": endpoint,
                    "status_code": response.status,
                    "response_time": response_time,
                    "success": response.status < 400,
                    "timestamp": datetime.now().isoformat()
                }
        except Exception as e:
            response_time = time.time() - start_time
            return {
                "user_id": user_id,
                "endpoint": endpoint,
                "status_code": None,
                "response_time": response_time,
                "success": False,
                "error": str(e),
                "timestamp": datetime.now().isoformat()
            }

    async def user_worker(self, user_id: int):
        """Simulate a single user making requests"""
        endpoints = ["/health", "/api/v1/ai/health", "/metrics"]

        async with aiohttp.ClientSession() as session:
            end_time = time.time() + self.duration

            while time.time() < end_time:
                for endpoint in endpoints:
                    result = await self.make_request(session, endpoint, user_id)
                    self.results.append(result)

                    # Small delay between requests to simulate realistic usage
                    await asyncio.sleep(0.1)

                # Delay between cycles
                await asyncio.sleep(1)

    async def run_test(self) -> Dict[str, Any]:
        """Run the load test"""
        print(f"🚀 Starting load test: {self.concurrent_users} users for {self.duration}s")
        print(f"Target: {self.base_url}")

        start_time = time.time()

        # Create concurrent user tasks
        tasks = [self.user_worker(i) for i in range(self.concurrent_users)]
        await asyncio.gather(*tasks)

        end_time = time.time()
        total_time = end_time - start_time

        # Analyze results
        successful_requests = [r for r in self.results if r["success"]]
        failed_requests = [r for r in self.results if not r["success"]]

        response_times = [r["response_time"] for r in self.results]

        analysis = {
            "test_duration": total_time,
            "total_requests": len(self.results),
            "successful_requests": len(successful_requests),
            "failed_requests": len(failed_requests),
            "success_rate": len(successful_requests) / len(self.results) * 100 if self.results else 0,
            "avg_response_time": statistics.mean(response_times) if response_times else 0,
            "median_response_time": statistics.median(response_times) if response_times else 0,
            "min_response_time": min(response_times) if response_times else 0,
            "max_response_time": max(response_times) if response_times else 0,
            "requests_per_second": len(self.results) / total_time,
            "endpoint_breakdown": {}
        }

        # Per-endpoint analysis
        endpoints = set(r["endpoint"] for r in self.results)
        for endpoint in endpoints:
            endpoint_results = [r for r in self.results if r["endpoint"] == endpoint]
            endpoint_times = [r["response_time"] for r in endpoint_results]
            endpoint_success = [r for r in endpoint_results if r["success"]]

            analysis["endpoint_breakdown"][endpoint] = {
                "requests": len(endpoint_results),
                "success_rate": len(endpoint_success) / len(endpoint_results) * 100,
                "avg_response_time": statistics.mean(endpoint_times),
                "median_response_time": statistics.median(endpoint_times)
            }

        return analysis

def main():
    parser = argparse.ArgumentParser(description="Load test the Fraud Detection API")
    parser.add_argument("--url", default="http://localhost:8000", help="Base URL of the API")
    parser.add_argument("--users", type=int, default=5, help="Number of concurrent users")
    parser.add_argument("--duration", type=int, default=30, help="Test duration in seconds")
    parser.add_argument("--output", help="Output file for detailed results")

    args = parser.parse_args()

    tester = LoadTester(args.url, args.users, args.duration)
    results = asyncio.run(tester.run_test())

    # Print summary
    print("\n" + "="*60)
    print("LOAD TEST RESULTS")
    print("="*60)
    print(f"Duration: {results['test_duration']:.2f}s")
    print(f"Concurrent Users: {args.users}")
    print(f"Total Requests: {results['total_requests']}")
    print(f"Successful: {results['successful_requests']}")
    print(f"Failed: {results['failed_requests']}")
    print(".2f")
    print(".2f")
    print(".4f")
    print("\nPer-Endpoint Results:")
    for endpoint, stats in results["endpoint_breakdown"].items():
        print(f"  {endpoint}:")
        print(".2f")
        print(".3f")

    # Save detailed results if requested
    if args.output:
        with open(args.output, 'w') as f:
            json.dump({
                "summary": results,
                "detailed_results": tester.results
            }, f, indent=2)
        print(f"\nDetailed results saved to {args.output}")

if __name__ == "__main__":
    main()