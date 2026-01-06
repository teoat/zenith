#!/usr/bin/env python3
"""
E2E Test Runner Script
Runs comprehensive end-to-end tests for the Simple378 Fraud Detection Platform
"""

import argparse
import asyncio
import os
import sys
from datetime import datetime

# Add the tests directory to Python path
sys.path.insert(0, os.path.dirname(__file__))

from e2e_test_framework import E2ETestFramework


async def run_tests(
    base_url: str = "http://localhost:8000",
    ws_url: str = "ws://localhost:8080",
    output_file: str | None = None,
    verbose: bool = False,
):
    """Run E2E tests with specified configuration"""

    print("🚀 Simple378 E2E Test Suite")
    print("=" * 50)
    print(f"Base URL: {base_url}")
    print(f"WebSocket URL: {ws_url}")
    print(f"Output File: {output_file or 'e2e_test_results.json'}")
    print(f"Verbose: {verbose}")
    print()

    async with E2ETestFramework(base_url=base_url, ws_url=ws_url) as framework:
        try:
            results = await framework.run_all_tests()

            # Save results
            output_path = output_file or "e2e_test_results.json"
            framework.save_results(results, output_path)

            # Print summary
            print("\n" + "=" * 50)
            print("🎯 TEST RESULTS SUMMARY")
            print("=" * 50)
            print(f"Total Tests: {results['total_tests']}")
            print(f"Passed: {results['total_passed']}")
            print(f"Failed: {results['total_failed']}")
            print(".2f")
            print(f"Timestamp: {results['test_run_timestamp']}")

            # Detailed results if verbose
            if verbose:
                print("\n📋 DETAILED RESULTS:")
                for suite in results["test_suites"]:
                    if "results" in suite:
                        suite_results = suite["results"]
                        print(f"\n{suite['name']}:")
                        print(
                            f"  Passed: {suite_results['passed']}/{suite_results['total']}"
                        )

                        if suite_results["failed"] > 0:
                            print("  Failed tests:")
                            for detail in suite_results["details"]:
                                if detail["status"] == "failed":
                                    print(
                                        f"    ❌ {detail['test']}: {detail.get('error', 'Unknown error')}"
                                    )

            # Exit with appropriate code
            success_rate = results.get("success_rate", 0)
            if success_rate >= 95:
                print("\n✅ E2E Tests PASSED (95%+ success rate)")
                return 0
            elif success_rate >= 80:
                print("\n⚠️  E2E Tests PARTIALLY PASSED (80-95% success rate)")
                return 1
            else:
                print("\n❌ E2E Tests FAILED (<80% success rate)")
                return 2

        except Exception as e:
            print(f"\n❌ E2E Test Suite failed with error: {e!s}")
            return 3


def main():
    parser = argparse.ArgumentParser(
        description="Run E2E tests for Simple378 Fraud Detection Platform"
    )
    parser.add_argument(
        "--base-url",
        default="http://localhost:8000",
        help="Base URL for the API server (default: http://localhost:8000)",
    )
    parser.add_argument(
        "--ws-url",
        default="ws://localhost:8080",
        help="WebSocket URL for real-time features (default: ws://localhost:8080)",
    )
    parser.add_argument(
        "--output",
        "-o",
        default=None,
        help="Output file for test results (default: e2e_test_results.json)",
    )
    parser.add_argument(
        "--verbose", "-v", action="store_true", help="Enable verbose output"
    )
    parser.add_argument(
        "--ci",
        action="store_true",
        help="CI mode - exit with code based on test results",
    )

    args = parser.parse_args()

    # Set default output file with timestamp if not specified
    if not args.output:
        timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
        args.output = f"e2e_test_results_{timestamp}.json"

    exit_code = asyncio.run(
        run_tests(
            base_url=args.base_url,
            ws_url=args.ws_url,
            output_file=args.output,
            verbose=args.verbose,
        )
    )

    if args.ci:
        sys.exit(exit_code)
    else:
        sys.exit(0)


if __name__ == "__main__":
    main()
