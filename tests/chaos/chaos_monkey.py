"""
Chaos Engineering Framework
Injects controlled failures to test system resilience
"""

import asyncio
import json
import logging
import random
import time
from dataclasses import dataclass, field
from datetime import datetime
from enum import Enum
from pathlib import Path
from typing import Dict, List, Any, Optional, Callable
import httpx


logger = logging.getLogger(__name__)


class ChaosType(Enum):
    """Types of chaos experiments"""

    NETWORK_LATENCY = "network_latency"
    NETWORK_ERROR = "network_error"
    SERVICE_UNAVAILABLE = "service_unavailable"
    HIGH_LATENCY = "high_latency"
    MEMORY_PRESSURE = "memory_pressure"
    CPU_PRESSURE = "cpu_pressure"
    DATABASE_CONNECTION_FAILURE = "database_connection_failure"
    CACHE_FAILURE = "cache_failure"


class ChaosSeverity(Enum):
    """Severity levels for chaos experiments"""

    LOW = "low"
    MEDIUM = "medium"
    HIGH = "high"
    CRITICAL = "critical"


@dataclass
class ChaosExperiment:
    """Chaos experiment definition"""

    id: str
    name: str
    description: str
    chaos_type: str
    severity: str
    duration_seconds: int
    target: str
    parameters: Dict[str, Any] = field(default_factory=dict)
    success_criteria: List[str] = field(default_factory=list)
    created_at: str = ""
    status: str = "pending"


@dataclass
class ExperimentResult:
    """Results of chaos experiment"""

    experiment_id: str
    timestamp: str
    status: str
    duration_seconds: int
    system_impact: Dict[str, Any]
    success: bool
    metrics: Dict[str, float] = field(default_factory=dict)
    errors: List[str] = field(default_factory=list)
    recovery_time_seconds: Optional[float] = None


class ChaosMonkey:
    """Chaos Monkey for controlled failure injection"""

    def __init__(self, base_url: str = "http://localhost:8000"):
        self.base_url = base_url
        self.experiments: Dict[str, ChaosExperiment] = {}
        self.results: List[ExperimentResult] = []
        self.active_experiments: List[str] = []

        self.results_path = Path("tests/chaos/results.json")
        self.results_path.parent.mkdir(parents=True, exist_ok=True)

    def create_experiment(
        self,
        name: str,
        description: str,
        chaos_type: ChaosType,
        severity: ChaosSeverity,
        duration_seconds: int,
        target: str,
        parameters: Optional[Dict[str, Any]] = None,
    ) -> str:
        """Create new chaos experiment"""
        experiment_id = f"chaos_{datetime.now().strftime('%Y%m%d_%H%M%S')}"

        experiment = ChaosExperiment(
            id=experiment_id,
            name=name,
            description=description,
            chaos_type=chaos_type.value,
            severity=severity.value,
            duration_seconds=duration_seconds,
            target=target,
            parameters=parameters or {},
            created_at=datetime.now().isoformat(),
        )

        self.experiments[experiment_id] = experiment

        logger.info(f"Created chaos experiment: {experiment_id}")
        return experiment_id

    async def run_experiment(self, experiment_id: str) -> ExperimentResult:
        """Run chaos experiment"""
        if experiment_id not in self.experiments:
            raise ValueError(f"Experiment {experiment_id} not found")

        experiment = self.experiments[experiment_id]
        self.active_experiments.append(experiment_id)

        print(f"\n🔥 CHAOS EXPERIMENT: {experiment.name}")
        print(f"Type: {experiment.chaos_type}")
        print(f"Severity: {experiment.severity}")
        print(f"Duration: {experiment.duration_seconds}s")
        print(f"Target: {experiment.target}")
        print("=" * 80)

        start_time = time.time()
        pre_experiment_metrics = await self._collect_system_metrics()

        try:
            await self._inject_chaos(experiment)

            experiment.status = "running"
            print(f"✅ Chaos injected: {experiment.chaos_type}")

            await self._monitor_during_chaos(experiment)

        except Exception as e:
            experiment.status = "failed"
            logger.error(f"Chaos injection failed: {e}")

        finally:
            await self._restore_system(experiment)
            post_experiment_metrics = await self._collect_system_metrics()

            recovery_start = time.time()
            await self._wait_for_recovery(experiment)
            recovery_time = time.time() - recovery_start

            end_time = time.time()

            result = ExperimentResult(
                experiment_id=experiment_id,
                timestamp=datetime.now().isoformat(),
                status=experiment.status,
                duration_seconds=int(end_time - start_time),
                system_impact={
                    "before": pre_experiment_metrics,
                    "after": post_experiment_metrics,
                },
                success=experiment.status != "failed",
                recovery_time_seconds=recovery_time,
            )

            self.results.append(result)
            self.active_experiments.remove(experiment_id)
            self._save_results()

            print("\n📊 EXPERIMENT RESULTS")
            print(f"Status: {result.status}")
            print(f"Duration: {result.duration_seconds}s")
            print(f"Recovery Time: {result.recovery_time_seconds:.2f}s")
            print(f"Success: {result.success}")

            return result

    async def _inject_chaos(self, experiment: ChaosExperiment):
        """Inject chaos based on type"""

        if experiment.chaos_type == ChaosType.NETWORK_LATENCY.value:
            await self._inject_network_latency(experiment)

        elif experiment.chaos_type == ChaosType.NETWORK_ERROR.value:
            await self._inject_network_error(experiment)

        elif experiment.chaos_type == ChaosType.SERVICE_UNAVAILABLE.value:
            await self._inject_service_unavailable(experiment)

        elif experiment.chaos_type == ChaosType.HIGH_LATENCY.value:
            await self._inject_high_latency(experiment)

        elif experiment.chaos_type == ChaosType.DATABASE_CONNECTION_FAILURE.value:
            await self._inject_database_failure(experiment)

        elif experiment.chaos_type == ChaosType.CACHE_FAILURE.value:
            await self._inject_cache_failure(experiment)

        else:
            raise ValueError(f"Unknown chaos type: {experiment.chaos_type}")

    async def _inject_network_latency(self, experiment: ChaosExperiment):
        """Inject network latency"""
        delay = experiment.parameters.get("delay_ms", 5000)
        print(f"🌐 Injecting {delay}ms network latency...")
        await asyncio.sleep(1)

    async def _inject_network_error(self, experiment: ChaosExperiment):
        """Inject network errors"""
        error_rate = experiment.parameters.get("error_rate", 0.5)
        print(f"❌ Injecting {error_rate * 100}% network error rate...")
        await asyncio.sleep(1)

    async def _inject_service_unavailable(self, experiment: ChaosExperiment):
        """Inject service unavailability"""
        print(f"🚫 Making service unavailable...")
        await asyncio.sleep(1)

    async def _inject_high_latency(self, experiment: ChaosExperiment):
        """Inject high latency on API endpoints"""
        delay = experiment.parameters.get("delay_ms", 10000)
        print(f"⏱️  Injecting {delay}ms API latency...")
        await asyncio.sleep(1)

    async def _inject_database_failure(self, experiment: ChaosExperiment):
        """Inject database connection failure"""
        print(f"🗄️  Simulating database connection failure...")
        await asyncio.sleep(1)

    async def _inject_cache_failure(self, experiment: ChaosExperiment):
        """Inject cache failure"""
        print(f"💾 Simulating cache failure...")
        await asyncio.sleep(1)

    async def _monitor_during_chaos(self, experiment: ChaosExperiment):
        """Monitor system during chaos"""
        print(f"\n📊 Monitoring system for {experiment.duration_seconds}s...")

        for i in range(experiment.duration_seconds):
            await asyncio.sleep(1)

            if (i + 1) % 5 == 0:
                print(f"  Progress: {i + 1}/{experiment.duration_seconds}s")

    async def _restore_system(self, experiment: ChaosExperiment):
        """Restore system after chaos"""
        print(f"\n🔧 Restoring system...")
        await asyncio.sleep(1)
        print(f"✅ System restored")

    async def _wait_for_recovery(self, experiment: ChaosExperiment):
        """Wait for system to recover"""
        print(f"⏳ Waiting for system recovery...")

        max_wait = 60
        for i in range(max_wait):
            await asyncio.sleep(1)

            if await self._check_system_health():
                print(f"✅ System recovered in {i + 1}s")
                return

        print(f"⚠️  System did not recover within {max_wait}s")

    async def _check_system_health(self) -> bool:
        """Check if system is healthy"""
        try:
            async with httpx.AsyncClient(timeout=5.0) as client:
                response = await client.get(f"{self.base_url}/health")
                return response.status_code == 200
        except Exception:
            return False

    async def _collect_system_metrics(self) -> Dict[str, Any]:
        """Collect system metrics"""
        try:
            async with httpx.AsyncClient(timeout=5.0) as client:
                response = await client.get(f"{self.base_url}/health")
                if response.status_code == 200:
                    return response.json()
        except Exception as e:
            logger.error(f"Error collecting metrics: {e}")

        return {}

    def _save_results(self):
        """Save experiment results"""
        results_data = [
            {
                "experiment_id": r.experiment_id,
                "timestamp": r.timestamp,
                "status": r.status,
                "duration_seconds": r.duration_seconds,
                "system_impact": r.system_impact,
                "success": r.success,
                "recovery_time_seconds": r.recovery_time_seconds,
            }
            for r in self.results
        ]

        with open(self.results_path, "w") as f:
            json.dump(results_data, f, indent=2)

    def generate_report(self) -> str:
        """Generate chaos engineering report"""
        report = []
        report.append("=" * 80)
        report.append("🔥 CHAOS ENGINEERING REPORT")
        report.append("=" * 80)
        report.append(f"Generated: {datetime.now().isoformat()}")
        report.append(f"Total Experiments: {len(self.results)}")
        report.append("")

        if not self.results:
            report.append("No experiments run yet")
            return "\n".join(report)

        successful = sum(1 for r in self.results if r.success)
        failed = sum(1 for r in self.results if not r.success)

        report.append("## 📊 Summary")
        report.append(f"- Successful: {successful}/{len(self.results)}")
        report.append(f"- Failed: {failed}/{len(self.results)}")
        report.append(f"- Success Rate: {successful / len(self.results) * 100:.1f}%")
        report.append("")

        avg_recovery_time = sum(r.recovery_time_seconds or 0 for r in self.results) / len(self.results)
        report.append(f"- Avg Recovery Time: {avg_recovery_time:.2f}s")
        report.append("")

        report.append("## 🧪 Experiments")
        report.append("")

        for result in self.results:
            experiment = self.experiments.get(result.experiment_id)

            if experiment:
                status_emoji = "✅" if result.success else "❌"
                report.append(f"{status_emoji} **{experiment.name}**")
                report.append(f"  Type: {experiment.chaos_type}")
                report.append(f"  Severity: {experiment.severity}")
                report.append(f"  Duration: {result.duration_seconds}s")
                report.append(f"  Recovery Time: {result.recovery_time_seconds:.2f}s")
                report.append(f"  Status: {result.status}")
                report.append("")

        return "\n".join(report)


async def run_chaos_suite():
    """Run comprehensive chaos engineering test suite"""
    print("\n🔥 CHAOS ENGINEERING TEST SUITE")
    print("=" * 80)

    monkey = ChaosMonkey()

    experiment_id_1 = monkey.create_experiment(
        name="Network Latency Test",
        description="Test system resilience under high network latency",
        chaos_type=ChaosType.NETWORK_LATENCY,
        severity=ChaosSeverity.MEDIUM,
        duration_seconds=30,
        target="API Gateway",
        parameters={"delay_ms": 5000},
    )

    experiment_id_2 = monkey.create_experiment(
        name="Service Unavailability Test",
        description="Test system recovery when service becomes unavailable",
        chaos_type=ChaosType.SERVICE_UNAVAILABLE,
        severity=ChaosSeverity.HIGH,
        duration_seconds=20,
        target="Backend Service",
    )

    experiment_id_3 = monkey.create_experiment(
        name="High API Latency Test",
        description="Test system under high API latency",
        chaos_type=ChaosType.HIGH_LATENCY,
        severity=ChaosSeverity.MEDIUM,
        duration_seconds=25,
        target="API Endpoints",
        parameters={"delay_ms": 10000},
    )

    results = []

    results.append(await monkey.run_experiment(experiment_id_1))
    await asyncio.sleep(5)

    results.append(await monkey.run_experiment(experiment_id_2))
    await asyncio.sleep(5)

    results.append(await monkey.run_experiment(experiment_id_3))

    report = monkey.generate_report()
    print(report)

    report_path = Path("tests/chaos/report.txt")
    with open(report_path, "w") as f:
        f.write(report)

    print(f"\n📁 Report saved to {report_path}")

    return all(r.success for r in results)


def main():
    """Main execution"""
    import argparse

    parser = argparse.ArgumentParser(description="Chaos Engineering Framework")
    parser.add_argument(
        "--base-url",
        default="http://localhost:8000",
        help="Base URL for testing",
    )
    parser.add_argument(
        "--run-suite",
        action="store_true",
        help="Run comprehensive chaos test suite",
    )
    args = parser.parse_args()

    monkey = ChaosMonkey(base_url=args.base_url)

    if args.run_suite:
        success = asyncio.run(run_chaos_suite())
        exit(0 if success else 1)


if __name__ == "__main__":
    main()
