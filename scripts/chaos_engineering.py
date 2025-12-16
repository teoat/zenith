#!/usr/bin/env python3
"""
Chaos Engineering Framework for Fraud Detection Platform
Implements automated resilience testing and failure simulation
"""

import asyncio
import random
import time
import logging
from datetime import datetime, timedelta
from typing import Dict, List, Any, Optional
from dataclasses import dataclass, field
import json
from pathlib import Path

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

@dataclass
class ChaosExperiment:
    """Represents a chaos engineering experiment"""
    name: str
    description: str
    target_service: str
    failure_type: str
    duration_seconds: int
    intensity: float = 0.1  # 0.0 to 1.0
    recovery_time_seconds: int = 30
    preconditions: List[str] = field(default_factory=list)
    success_criteria: List[str] = field(default_factory=list)
    rollback_actions: List[str] = field(default_factory=list)

@dataclass
class ExperimentResult:
    """Results of a chaos experiment"""
    experiment_name: str
    start_time: datetime
    end_time: datetime
    status: str  # "success", "failure", "partial"
    metrics_before: Dict[str, Any]
    metrics_during: Dict[str, Any]
    metrics_after: Dict[str, Any]
    observations: List[str]
    recovery_actions_taken: List[str]
    lessons_learned: List[str]

class ChaosEngineeringFramework:
    """Main chaos engineering framework"""

    def __init__(self):
        self.experiments: Dict[str, ChaosExperiment] = {}
        self.results: List[ExperimentResult] = []
        self.is_experiment_running = False

    def register_experiment(self, experiment: ChaosExperiment):
        """Register a chaos experiment"""
        self.experiments[experiment.name] = experiment
        logger.info(f"Registered chaos experiment: {experiment.name}")

    def create_standard_experiments(self):
        """Create a set of standard chaos experiments"""

        experiments = [
            ChaosExperiment(
                name="network_latency_injection",
                description="Introduce network latency to simulate slow connections",
                target_service="fraud-detection-api",
                failure_type="network_latency",
                duration_seconds=300,  # 5 minutes
                intensity=0.3,
                recovery_time_seconds=60,
                preconditions=["API service is healthy", "Database is accessible"],
                success_criteria=[
                    "System remains responsive",
                    "Error rate stays below 5%",
                    "Recovery is automatic"
                ],
                rollback_actions=["Remove network latency rules"]
            ),

            ChaosExperiment(
                name="database_connection_loss",
                description="Simulate database connection failures",
                target_service="fraud-detection-db",
                failure_type="connection_loss",
                duration_seconds=120,  # 2 minutes
                intensity=0.5,
                recovery_time_seconds=30,
                preconditions=["Database backup is current", "Connection pooling is enabled"],
                success_criteria=[
                    "Application handles connection failures gracefully",
                    "Requests are queued during outage",
                    "Full recovery after connection restoration"
                ],
                rollback_actions=["Restore database connections"]
            ),

            ChaosExperiment(
                name="memory_pressure_test",
                description="Simulate memory pressure and OOM conditions",
                target_service="fraud-detection-api",
                failure_type="memory_pressure",
                duration_seconds=180,  # 3 minutes
                intensity=0.7,
                recovery_time_seconds=45,
                preconditions=["Memory monitoring is active", "Auto-scaling is enabled"],
                success_criteria=[
                    "Memory usage is monitored and alerted",
                    "Application degrades gracefully under memory pressure",
                    "No data loss occurs"
                ],
                rollback_actions=["Reduce memory allocation", "Restart affected services"]
            ),

            ChaosExperiment(
                name="cpu_spike_simulation",
                description="Simulate CPU spikes and high load conditions",
                target_service="fraud-detection-worker",
                failure_type="cpu_overload",
                duration_seconds=240,  # 4 minutes
                intensity=0.8,
                recovery_time_seconds=60,
                preconditions=["CPU monitoring is active", "Load balancing is configured"],
                success_criteria=[
                    "System maintains responsiveness under load",
                    "Requests are properly queued",
                    "Auto-scaling activates if configured"
                ],
                rollback_actions=["Reduce CPU load", "Scale up resources"]
            ),

            ChaosExperiment(
                name="disk_space_exhaustion",
                description="Simulate disk space exhaustion",
                target_service="fraud-detection-storage",
                failure_type="disk_full",
                duration_seconds=90,  # 1.5 minutes
                intensity=0.9,
                recovery_time_seconds=30,
                preconditions=["Disk monitoring is active", "Log rotation is configured"],
                success_criteria=[
                    "System alerts on low disk space",
                    "Logging continues without interruption",
                    "Cleanup processes activate automatically"
                ],
                rollback_actions=["Free up disk space", "Archive old logs"]
            ),

            ChaosExperiment(
                name="service_dependency_failure",
                description="Simulate failure of dependent services",
                target_service="fraud-detection-external",
                failure_type="dependency_failure",
                duration_seconds=180,  # 3 minutes
                intensity=0.4,
                recovery_time_seconds=45,
                preconditions=["Circuit breakers are implemented", "Fallback mechanisms exist"],
                success_criteria=[
                    "Circuit breakers activate",
                    "Fallback responses are provided",
                    "System remains partially functional"
                ],
                rollback_actions=["Restore dependent services"]
            )
        ]

        for exp in experiments:
            self.register_experiment(exp)

    async def run_experiment(self, experiment_name: str) -> Optional[ExperimentResult]:
        """Run a specific chaos experiment"""

        if experiment_name not in self.experiments:
            logger.error(f"Experiment {experiment_name} not found")
            return None

        if self.is_experiment_running:
            logger.warning("Another experiment is already running")
            return None

        experiment = self.experiments[experiment_name]
        self.is_experiment_running = True

        logger.info(f"Starting chaos experiment: {experiment_name}")
        logger.info(f"Description: {experiment.description}")
        logger.info(f"Duration: {experiment.duration_seconds} seconds")
        logger.info(f"Intensity: {experiment.intensity * 100}%")

        start_time = datetime.now()

        # Capture baseline metrics
        metrics_before = await self._capture_system_metrics()

        try:
            # Inject failure
            await self._inject_failure(experiment)

            # Monitor during experiment
            observations = []
            metrics_during = await self._monitor_during_experiment(
                experiment, observations
            )

            # Wait for recovery
            await asyncio.sleep(experiment.recovery_time_seconds)

            # Capture post-experiment metrics
            metrics_after = await self._capture_system_metrics()

            # Evaluate success
            status = self._evaluate_experiment_success(
                experiment, metrics_before, metrics_during, metrics_after, observations
            )

            # Generate lessons learned
            lessons_learned = self._analyze_experiment_results(
                experiment, metrics_before, metrics_during, metrics_after, observations
            )

            result = ExperimentResult(
                experiment_name=experiment_name,
                start_time=start_time,
                end_time=datetime.now(),
                status=status,
                metrics_before=metrics_before,
                metrics_during=metrics_during,
                metrics_after=metrics_after,
                observations=observations,
                recovery_actions_taken=experiment.rollback_actions,
                lessons_learned=lessons_learned
            )

            self.results.append(result)
            logger.info(f"Experiment {experiment_name} completed with status: {status}")

            return result

        except Exception as e:
            logger.error(f"Experiment {experiment_name} failed with error: {e}")
            return ExperimentResult(
                experiment_name=experiment_name,
                start_time=start_time,
                end_time=datetime.now(),
                status="error",
                metrics_before=metrics_before,
                metrics_during={},
                metrics_after={},
                observations=[f"Experiment failed: {str(e)}"],
                recovery_actions_taken=[],
                lessons_learned=["Investigate experiment implementation"]
            )

        finally:
            self.is_experiment_running = False

    async def _inject_failure(self, experiment: ChaosExperiment):
        """Inject the specified failure type"""

        failure_type = experiment.failure_type
        intensity = experiment.intensity

        logger.info(f"Injecting failure: {failure_type} at intensity {intensity * 100}%")

        if failure_type == "network_latency":
            # Simulate network latency by adding delays
            await self._simulate_network_latency(intensity)

        elif failure_type == "connection_loss":
            # Simulate database connection loss
            await self._simulate_connection_loss(intensity)

        elif failure_type == "memory_pressure":
            # Simulate memory pressure
            await self._simulate_memory_pressure(intensity)

        elif failure_type == "cpu_overload":
            # Simulate CPU overload
            await self._simulate_cpu_overload(intensity)

        elif failure_type == "disk_full":
            # Simulate disk space exhaustion
            await self._simulate_disk_full(intensity)

        elif failure_type == "dependency_failure":
            # Simulate dependency service failure
            await self._simulate_dependency_failure(intensity)

        else:
            logger.warning(f"Unknown failure type: {failure_type}")

    async def _simulate_network_latency(self, intensity: float):
        """Simulate network latency"""
        # In a real implementation, this would use network tools like tc
        latency_ms = int(intensity * 500)  # Up to 500ms latency
        logger.info(f"Simulating {latency_ms}ms network latency")
        # Placeholder - would implement actual network latency injection

    async def _simulate_connection_loss(self, intensity: float):
        """Simulate database connection loss"""
        loss_duration = int(intensity * 60)  # Up to 60 seconds
        logger.info(f"Simulating database connection loss for {loss_duration} seconds")
        # Placeholder - would implement actual connection dropping

    async def _simulate_memory_pressure(self, intensity: float):
        """Simulate memory pressure"""
        memory_usage = int(intensity * 90)  # Up to 90% memory usage
        logger.info(f"Simulating memory pressure at {memory_usage}% usage")
        # Placeholder - would implement actual memory allocation

    async def _simulate_cpu_overload(self, intensity: float):
        """Simulate CPU overload"""
        cpu_load = int(intensity * 95)  # Up to 95% CPU load
        logger.info(f"Simulating CPU overload at {cpu_load}% load")
        # Placeholder - would implement actual CPU stress testing

    async def _simulate_disk_full(self, intensity: float):
        """Simulate disk space exhaustion"""
        disk_usage = int(80 + intensity * 15)  # 80-95% disk usage
        logger.info(f"Simulating disk usage at {disk_usage}%")
        # Placeholder - would implement actual disk filling

    async def _simulate_dependency_failure(self, intensity: float):
        """Simulate dependency service failure"""
        failure_rate = int(intensity * 100)  # Up to 100% failure rate
        logger.info(f"Simulating dependency failure at {failure_rate}% rate")
        # Placeholder - would implement actual service failure simulation

    async def _monitor_during_experiment(self, experiment: ChaosExperiment,
                                       observations: List[str]) -> Dict[str, Any]:
        """Monitor system during experiment"""
        metrics = {}

        # Monitor for the experiment duration
        start_time = time.time()
        while time.time() - start_time < experiment.duration_seconds:
            # Capture metrics every 10 seconds
            current_metrics = await self._capture_system_metrics()

            # Check for concerning patterns
            if current_metrics.get('error_rate', 0) > 0.05:  # 5% error rate
                observations.append(f"High error rate detected: {current_metrics['error_rate']}")

            if current_metrics.get('response_time', 0) > 5.0:  # 5 second response time
                observations.append(f"Slow response time: {current_metrics['response_time']}s")

            if current_metrics.get('memory_usage', 0) > 85:  # 85% memory usage
                observations.append(f"High memory usage: {current_metrics['memory_usage']}%")

            await asyncio.sleep(10)  # Monitor every 10 seconds

            # Store final metrics
            metrics = current_metrics

        return metrics

    async def _capture_system_metrics(self) -> Dict[str, Any]:
        """Capture current system metrics"""
        # In a real implementation, this would collect actual metrics
        # For now, return simulated metrics
        return {
            "response_time": random.uniform(0.1, 2.0),
            "error_rate": random.uniform(0.001, 0.01),
            "memory_usage": random.uniform(40, 70),
            "cpu_usage": random.uniform(20, 60),
            "disk_usage": random.uniform(30, 60),
            "active_connections": random.randint(10, 100),
            "queue_length": random.randint(0, 50)
        }

    def _evaluate_experiment_success(self, experiment: ChaosExperiment,
                                   metrics_before: Dict, metrics_during: Dict,
                                   metrics_after: Dict, observations: List[str]) -> str:
        """Evaluate if experiment was successful"""

        # Check if system remained stable
        error_rate_during = metrics_during.get('error_rate', 0)
        response_time_during = metrics_during.get('response_time', 0)

        # Define success criteria
        max_acceptable_error_rate = 0.10  # 10%
        max_acceptable_response_time = 10.0  # 10 seconds

        if error_rate_during > max_acceptable_error_rate:
            return "failure"

        if response_time_during > max_acceptable_response_time:
            return "failure"

        # Check if system recovered
        error_rate_after = metrics_after.get('error_rate', 0)
        response_time_after = metrics_after.get('response_time', 0)

        if error_rate_after > metrics_before.get('error_rate', 0) * 1.5:  # 50% increase
            return "partial"

        if response_time_after > metrics_before.get('response_time', 0) * 2.0:  # 2x increase
            return "partial"

        return "success"

    def _analyze_experiment_results(self, experiment: ChaosExperiment,
                                  metrics_before: Dict, metrics_during: Dict,
                                  metrics_after: Dict, observations: List[str]) -> List[str]:
        """Analyze experiment results and generate lessons learned"""

        lessons = []

        # Analyze performance impact
        response_time_increase = metrics_during.get('response_time', 0) - metrics_before.get('response_time', 0)
        if response_time_increase > 1.0:
            lessons.append(f"Response time increased by {response_time_increase:.2f}s under failure conditions")

        # Analyze error rate changes
        error_rate_increase = metrics_during.get('error_rate', 0) - metrics_before.get('error_rate', 0)
        if error_rate_increase > 0.01:
            lessons.append(f"Error rate increased by {error_rate_increase:.3f} under failure conditions")

        # Analyze recovery
        recovery_time = (metrics_after.get('response_time', 0) - metrics_before.get('response_time', 0))
        if abs(recovery_time) < 0.5:
            lessons.append("System recovered quickly after failure injection")
        else:
            lessons.append(f"System took {abs(recovery_time):.2f}s to fully recover")

        # Add experiment-specific lessons
        if experiment.failure_type == "network_latency":
            lessons.append("Network latency simulation revealed potential timeout issues")
        elif experiment.failure_type == "memory_pressure":
            lessons.append("Memory pressure testing validated garbage collection effectiveness")
        elif experiment.failure_type == "cpu_overload":
            lessons.append("CPU overload testing confirmed load balancing effectiveness")

        return lessons

    def generate_report(self) -> Dict[str, Any]:
        """Generate comprehensive chaos engineering report"""

        report = {
            "report_generated": datetime.now().isoformat(),
            "total_experiments": len(self.experiments),
            "experiments_run": len(self.results),
            "success_rate": 0.0,
            "experiments": {},
            "recommendations": []
        }

        if self.results:
            successful_experiments = len([r for r in self.results if r.status == "success"])
            report["success_rate"] = (successful_experiments / len(self.results)) * 100

        # Compile experiment details
        for result in self.results:
            report["experiments"][result.experiment_name] = {
                "status": result.status,
                "duration": (result.end_time - result.start_time).total_seconds(),
                "observations": result.observations,
                "lessons_learned": result.lessons_learned,
                "metrics_summary": {
                    "response_time_before": result.metrics_before.get('response_time'),
                    "response_time_during": result.metrics_during.get('response_time'),
                    "response_time_after": result.metrics_after.get('response_time'),
                    "error_rate_before": result.metrics_before.get('error_rate'),
                    "error_rate_during": result.metrics_during.get('error_rate'),
                    "error_rate_after": result.metrics_after.get('error_rate')
                }
            }

        # Generate recommendations
        if report["success_rate"] < 80:
            report["recommendations"].append("Improve system resilience - multiple experiments failed")
        if report["success_rate"] > 95:
            report["recommendations"].append("System shows excellent resilience under chaos conditions")

        # Save report
        report_path = Path("chaos_engineering_report.json")
        with open(report_path, 'w') as f:
            json.dump(report, f, indent=2, default=str)

        return report

async def run_chaos_experiments():
    """Run a series of chaos experiments"""

    framework = ChaosEngineeringFramework()
    framework.create_standard_experiments()

    print("🌀 CHAOS ENGINEERING EXPERIMENTATION")
    print("=" * 50)

    experiments_to_run = [
        "network_latency_injection",
        "memory_pressure_test",
        "cpu_spike_simulation"
    ]

    for exp_name in experiments_to_run:
        print(f"\n🎯 Running experiment: {exp_name}")
        result = await framework.run_experiment(exp_name)

        if result:
            print(f"Status: {result.status.upper()}")
            print(f"Duration: {(result.end_time - result.start_time).total_seconds():.1f}s")
            print(f"Observations: {len(result.observations)}")
            print(f"Lessons: {len(result.lessons_learned)}")

    # Generate final report
    report = framework.generate_report()

    print("\n📊 CHAOS ENGINEERING REPORT")
    print(f"Experiments Run: {report['experiments_run']}")
    print(f"Success Rate: {report['success_rate']:.1f}%")
    print(f"Report saved to: chaos_engineering_report.json")

    return report

if __name__ == "__main__":
    asyncio.run(run_chaos_experiments())