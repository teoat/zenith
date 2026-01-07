"""
Zenith Platform Autonomous Scaling System
Self-optimizing infrastructure and resource management
"""

import asyncio
import logging
from dataclasses import dataclass
from datetime import UTC, datetime, timedelta
from enum import Enum
from typing import Any

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)


class ScalingDecision(Enum):
    """Types of scaling decisions"""

    SCALE_UP = "scale_up"
    SCALE_DOWN = "scale_down"
    NO_CHANGE = "no_change"
    EMERGENCY_SCALE = "emergency_scale"


class ResourceType(Enum):
    """Types of resources that can be scaled"""

    COMPUTE_INSTANCES = "compute_instances"
    DATABASE_CONNECTIONS = "database_connections"
    CACHE_MEMORY = "cache_memory"
    WORKER_PROCESSES = "worker_processes"
    API_RATE_LIMITS = "api_rate_limits"


@dataclass
class ScalingEvent:
    """Scaling event record"""

    event_id: str
    resource_type: ResourceType
    decision: ScalingDecision
    current_capacity: float
    target_capacity: float
    reason: str
    confidence_score: float
    estimated_cost_impact: float
    timestamp: datetime
    success: bool = False
    execution_time: float | None = None

    def to_dict(self) -> dict[str, Any]:
        """Convert to dictionary"""
        return {
            "event_id": self.event_id,
            "resource_type": self.resource_type.value,
            "decision": self.decision.value,
            "current_capacity": self.current_capacity,
            "target_capacity": self.target_capacity,
            "reason": self.reason,
            "confidence_score": self.confidence_score,
            "estimated_cost_impact": self.estimated_cost_impact,
            "timestamp": self.timestamp.isoformat(),
            "success": self.success,
            "execution_time": self.execution_time,
        }


@dataclass
class ResourceMetrics:
    """Resource utilization metrics"""

    resource_type: ResourceType
    current_utilization: float
    target_utilization: float
    capacity: float
    max_capacity: float
    min_capacity: float
    cost_per_unit: float
    last_updated: datetime

    def utilization_percentage(self) -> float:
        """Get utilization as percentage"""
        return (self.current_utilization / self.capacity) * 100

    def headroom_percentage(self) -> float:
        """Get available headroom as percentage"""
        return ((self.max_capacity - self.current_utilization) / self.max_capacity) * 100


class AutonomousScalingEngine:
    """AI-powered autonomous scaling and resource optimization"""

    def __init__(self):
        self.scaling_events: list[ScalingEvent] = []
        self.resource_metrics: dict[ResourceType, ResourceMetrics] = {}
        self.scaling_policies: dict[ResourceType, dict[str, Any]] = {}

        # Scaling thresholds
        self.scale_up_threshold = 80.0  # Scale up when utilization > 80%
        self.scale_down_threshold = 30.0  # Scale down when utilization < 30%
        self.emergency_threshold = 95.0  # Emergency scaling when utilization > 95%

        # Cooldown periods (seconds)
        self.scale_up_cooldown = 300  # 5 minutes
        self.scale_down_cooldown = 1800  # 30 minutes
        self.last_scaling_actions: dict[ResourceType, datetime] = {}

        # Initialize resource monitoring
        self._initialize_resource_monitoring()

        # Load scaling policies
        self._load_scaling_policies()

    def _initialize_resource_monitoring(self):
        """Initialize monitoring for different resource types"""

        # Compute instances
        self.resource_metrics[ResourceType.COMPUTE_INSTANCES] = ResourceMetrics(
            resource_type=ResourceType.COMPUTE_INSTANCES,
            current_utilization=2,
            target_utilization=2,
            capacity=4,
            max_capacity=20,
            min_capacity=1,
            cost_per_unit=0.096,  # $ per hour for t3.medium
            last_updated=datetime.now(UTC),
        )

        # Database connections
        self.resource_metrics[ResourceType.DATABASE_CONNECTIONS] = ResourceMetrics(
            resource_type=ResourceType.DATABASE_CONNECTIONS,
            current_utilization=45,
            target_utilization=50,
            capacity=100,
            max_capacity=500,
            min_capacity=10,
            cost_per_unit=0.0,  # Connection costs are included in instance cost
            last_updated=datetime.now(UTC),
        )

        # Cache memory
        self.resource_metrics[ResourceType.CACHE_MEMORY] = ResourceMetrics(
            resource_type=ResourceType.CACHE_MEMORY,
            current_utilization=2.1,
            target_utilization=2.5,
            capacity=5,
            max_capacity=50,
            min_capacity=1,
            cost_per_unit=0.022,  # $ per GB per hour
            last_updated=datetime.now(UTC),
        )

        # Worker processes
        self.resource_metrics[ResourceType.WORKER_PROCESSES] = ResourceMetrics(
            resource_type=ResourceType.WORKER_PROCESSES,
            current_utilization=8,
            target_utilization=10,
            capacity=16,
            max_capacity=50,
            min_capacity=2,
            cost_per_unit=0.0,  # Process costs are included in instance cost
            last_updated=datetime.now(UTC),
        )

        logger.info("Initialized resource monitoring for all resource types")

    def _load_scaling_policies(self):
        """Load scaling policies from configuration"""

        # Compute instances policy
        self.scaling_policies[ResourceType.COMPUTE_INSTANCES] = {
            "scale_up_increment": 1,
            "scale_down_increment": 1,
            "max_scale_up_per_hour": 3,
            "max_scale_down_per_hour": 2,
            "predictive_scaling_enabled": True,
            "cost_optimization_priority": "balanced",
        }

        # Database connections policy
        self.scaling_policies[ResourceType.DATABASE_CONNECTIONS] = {
            "scale_up_increment": 25,
            "scale_down_increment": 10,
            "connection_pool_growth": 0.2,
            "max_connections_per_instance": 100,
            "read_replica_enabled": True,
        }

        # Cache memory policy
        self.scaling_policies[ResourceType.CACHE_MEMORY] = {
            "scale_up_increment": 1,  # GB
            "scale_down_increment": 0.5,  # GB
            "memory_efficiency_target": 0.8,
            "cache_hit_ratio_target": 0.95,
        }

        # Worker processes policy
        self.scaling_policies[ResourceType.WORKER_PROCESSES] = {
            "scale_up_increment": 2,
            "scale_down_increment": 1,
            "queue_length_target": 10,
            "processing_time_target": 30,  # seconds
        }

        logger.info("Loaded scaling policies for all resource types")

    async def monitor_resources(self) -> dict[ResourceType, ResourceMetrics]:
        """Monitor current resource utilization"""
        logger.info("Monitoring resource utilization...")

        # Update compute instances (simulated)
        compute_metrics = self.resource_metrics[ResourceType.COMPUTE_INSTANCES]
        compute_metrics.current_utilization = await self._get_compute_utilization()
        compute_metrics.last_updated = datetime.now(UTC)

        # Update database connections
        db_metrics = self.resource_metrics[ResourceType.DATABASE_CONNECTIONS]
        db_metrics.current_utilization = await self._get_database_connections()
        db_metrics.last_updated = datetime.now(UTC)

        # Update cache memory
        cache_metrics = self.resource_metrics[ResourceType.CACHE_MEMORY]
        cache_metrics.current_utilization = await self._get_cache_memory_usage()
        cache_metrics.last_updated = datetime.now(UTC)

        # Update worker processes
        worker_metrics = self.resource_metrics[ResourceType.WORKER_PROCESSES]
        worker_metrics.current_utilization = await self._get_worker_process_count()
        worker_metrics.last_updated = datetime.now(UTC)

        return self.resource_metrics.copy()

    async def _get_compute_utilization(self) -> float:
        """Get current compute instance count"""
        # In a real implementation, this would query cloud provider APIs
        # For simulation, return current value with some variance
        current = self.resource_metrics[ResourceType.COMPUTE_INSTANCES].current_utilization
        variance = 0.95 + 0.1 * (datetime.now().timestamp() % 10) / 10  # 95-105% variance
        return current * variance

    async def _get_database_connections(self) -> float:
        """Get current database connection count"""
        # Simulate database connection monitoring
        base_connections = 45
        time_factor = datetime.now().hour / 24  # Daily pattern
        load_factor = 0.8 + 0.4 * abs(time_factor - 0.5) * 2  # Peak during business hours
        return base_connections * load_factor

    async def _get_cache_memory_usage(self) -> float:
        """Get current cache memory usage"""
        # Simulate cache memory monitoring
        base_memory = 2.1
        variance = 0.9 + 0.2 * ((datetime.now().timestamp() % 3600) / 3600)  # Hourly variance
        return base_memory * variance

    async def _get_worker_process_count(self) -> float:
        """Get current worker process count"""
        # Simulate worker process monitoring
        base_workers = 8
        queue_length = await self._get_queue_length()
        utilization_factor = min(1.5, max(0.5, queue_length / 20))  # Adjust based on queue
        return base_workers * utilization_factor

    async def _get_queue_length(self) -> float:
        """Get current queue length (simulated)"""
        # Simulate queue monitoring
        base_queue = 15
        time_factor = datetime.now().minute / 60  # Minute-by-minute variance
        return base_queue * (0.5 + time_factor)

    async def evaluate_scaling_decisions(self) -> list[ScalingEvent]:
        """Evaluate and generate scaling decisions for all resources"""
        logger.info("Evaluating scaling decisions...")

        scaling_events = []

        for resource_type, metrics in self.resource_metrics.items():
            decision = await self._evaluate_resource_scaling(resource_type, metrics)

            if decision["decision"] != ScalingDecision.NO_CHANGE:
                event = ScalingEvent(
                    event_id=f"scale_{resource_type.value}_{int(datetime.now(UTC).timestamp())}",
                    resource_type=resource_type,
                    decision=decision["decision"],
                    current_capacity=metrics.current_utilization,
                    target_capacity=decision["target_capacity"],
                    reason=decision["reason"],
                    confidence_score=decision["confidence"],
                    estimated_cost_impact=decision["cost_impact"],
                    timestamp=datetime.now(UTC),
                )

                scaling_events.append(event)

        return scaling_events

    async def _evaluate_resource_scaling(self, resource_type: ResourceType, metrics: ResourceMetrics) -> dict[str, Any]:
        """Evaluate scaling decision for a specific resource"""

        utilization_pct = metrics.utilization_percentage()

        # Check cooldown periods
        last_action = self.last_scaling_actions.get(resource_type)
        if last_action:
            cooldown_period = self.scale_up_cooldown if "up" in str(last_action) else self.scale_down_cooldown
            if datetime.now(UTC) - last_action < timedelta(seconds=cooldown_period):
                return {
                    "decision": ScalingDecision.NO_CHANGE,
                    "target_capacity": metrics.current_utilization,
                    "reason": "Cooldown period active",
                    "confidence": 1.0,
                    "cost_impact": 0.0,
                }

        # Emergency scaling check
        if utilization_pct > self.emergency_threshold:
            return {
                "decision": ScalingDecision.EMERGENCY_SCALE,
                "target_capacity": min(metrics.current_utilization * 1.5, metrics.max_capacity),
                "reason": f"Emergency: Utilization at {utilization_pct:.1f}% exceeds threshold",
                "confidence": 0.95,
                "cost_impact": self._calculate_cost_impact(resource_type, metrics.current_utilization * 1.5),
            }

        # Normal scaling logic
        policy = self.scaling_policies.get(resource_type, {})

        if utilization_pct > self.scale_up_threshold:
            # Scale up
            increment = policy.get("scale_up_increment", 1)
            new_capacity = min(metrics.current_utilization + increment, metrics.max_capacity)

            return {
                "decision": ScalingDecision.SCALE_UP,
                "target_capacity": new_capacity,
                "reason": f"High utilization: {utilization_pct:.1f}% > {self.scale_up_threshold}%",
                "confidence": min(0.9, utilization_pct / 100),
                "cost_impact": self._calculate_cost_impact(resource_type, new_capacity),
            }

        elif utilization_pct < self.scale_down_threshold and metrics.current_utilization > metrics.min_capacity:
            # Scale down
            decrement = policy.get("scale_down_increment", 1)
            new_capacity = max(metrics.current_utilization - decrement, metrics.min_capacity)

            # Only scale down if we're significantly below target
            if utilization_pct < self.scale_down_threshold * 0.7:
                return {
                    "decision": ScalingDecision.SCALE_DOWN,
                    "target_capacity": new_capacity,
                    "reason": f"Low utilization: {utilization_pct:.1f}% < {self.scale_down_threshold}%",
                    "confidence": 0.7,
                    "cost_impact": self._calculate_cost_impact(resource_type, new_capacity),
                }

        return {
            "decision": ScalingDecision.NO_CHANGE,
            "target_capacity": metrics.current_utilization,
            "reason": f"Utilization within normal range: {utilization_pct:.1f}%",
            "confidence": 1.0,
            "cost_impact": 0.0,
        }

    def _calculate_cost_impact(self, resource_type: ResourceType, new_capacity: float) -> float:
        """Calculate cost impact of scaling decision"""
        metrics = self.resource_metrics[resource_type]
        capacity_change = new_capacity - metrics.current_utilization

        if capacity_change > 0:
            # Scaling up cost
            return capacity_change * metrics.cost_per_unit * 24  # Daily cost
        elif capacity_change < 0:
            # Scaling down savings
            return capacity_change * metrics.cost_per_unit * 24  # Daily savings (negative)
        else:
            return 0.0

    async def execute_scaling_decisions(self, scaling_events: list[ScalingEvent]) -> list[ScalingEvent]:
        """Execute approved scaling decisions"""
        logger.info(f"Executing {len(scaling_events)} scaling decisions...")

        executed_events = []

        for event in scaling_events:
            start_time = datetime.now(UTC)

            try:
                success = await self._execute_scaling_action(event)

                event.success = success
                event.execution_time = (datetime.now(UTC) - start_time).total_seconds()

                if success:
                    # Update last scaling action
                    self.last_scaling_actions[event.resource_type] = datetime.now(UTC)

                    # Update resource metrics
                    self.resource_metrics[event.resource_type].current_utilization = event.target_capacity

                    logger.info(f"Successfully executed scaling: {event.event_id}")
                else:
                    logger.error(f"Failed to execute scaling: {event.event_id}")

                executed_events.append(event)

            except Exception as e:
                logger.error(f"Error executing scaling {event.event_id}: {e}")
                event.success = False
                executed_events.append(event)

        return executed_events

    async def _execute_scaling_action(self, event: ScalingEvent) -> bool:
        """Execute a specific scaling action"""
        try:
            if event.resource_type == ResourceType.COMPUTE_INSTANCES:
                return await self._scale_compute_instances(event)
            elif event.resource_type == ResourceType.DATABASE_CONNECTIONS:
                return await self._scale_database_connections(event)
            elif event.resource_type == ResourceType.CACHE_MEMORY:
                return await self._scale_cache_memory(event)
            elif event.resource_type == ResourceType.WORKER_PROCESSES:
                return await self._scale_worker_processes(event)
            else:
                logger.warning(f"Unsupported resource type for scaling: {event.resource_type}")
                return False

        except Exception as e:
            logger.error(f"Error in scaling action: {e}")
            return False

    async def _scale_compute_instances(self, event: ScalingEvent) -> bool:
        """Scale compute instances (AWS EC2, etc.)"""
        # In a real implementation, this would call cloud provider APIs
        logger.info(f"Scaling compute instances from {event.current_capacity} to {event.target_capacity}")

        # Simulate scaling operation
        await asyncio.sleep(2)  # Simulate API call delay

        # Update internal tracking
        self.resource_metrics[ResourceType.COMPUTE_INSTANCES].capacity = event.target_capacity

        return True

    async def _scale_database_connections(self, event: ScalingEvent) -> bool:
        """Scale database connections"""
        logger.info(f"Scaling database connections from {event.current_capacity} to {event.target_capacity}")

        # Simulate connection pool adjustment
        await asyncio.sleep(1)

        # Update metrics
        self.resource_metrics[ResourceType.DATABASE_CONNECTIONS].capacity = event.target_capacity

        return True

    async def _scale_cache_memory(self, event: ScalingEvent) -> bool:
        """Scale cache memory"""
        logger.info(f"Scaling cache memory from {event.current_capacity}GB to {event.target_capacity}GB")

        # Simulate Redis/memory scaling
        await asyncio.sleep(1.5)

        # Update metrics
        self.resource_metrics[ResourceType.CACHE_MEMORY].capacity = event.target_capacity

        return True

    async def _scale_worker_processes(self, event: ScalingEvent) -> bool:
        """Scale worker processes"""
        logger.info(f"Scaling worker processes from {event.current_capacity} to {event.target_capacity}")

        # Simulate process scaling
        await asyncio.sleep(1)

        # Update metrics
        self.resource_metrics[ResourceType.WORKER_PROCESSES].capacity = event.target_capacity

        return True

    async def optimize_resource_allocation(self) -> dict[str, Any]:
        """Perform comprehensive resource optimization"""
        logger.info("Performing comprehensive resource optimization...")

        optimizations = {}

        # Analyze resource utilization patterns
        for resource_type, metrics in self.resource_metrics.items():
            optimization = await self._optimize_resource(resource_type, metrics)
            if optimization:
                optimizations[resource_type.value] = optimization

        # Cross-resource optimization
        cross_optimization = await self._optimize_cross_resources()
        if cross_optimization:
            optimizations["cross_resource"] = cross_optimization

        return optimizations

    async def _optimize_resource(self, resource_type: ResourceType, metrics: ResourceMetrics) -> dict[str, Any] | None:
        """Optimize a specific resource"""
        utilization = metrics.utilization_percentage()

        if utilization < 40 and metrics.current_utilization > metrics.min_capacity:
            # Under-utilized - consider rightsizing
            recommended_capacity = max(metrics.min_capacity, metrics.current_utilization * 0.8)

            return {
                "action": "rightsize",
                "current_capacity": metrics.current_utilization,
                "recommended_capacity": recommended_capacity,
                "estimated_savings": self._calculate_cost_impact(resource_type, recommended_capacity),
                "reason": f"Resource under-utilized at {utilization:.1f}%",
            }

        elif utilization > 85:
            # Over-utilized - consider scaling
            recommended_capacity = min(metrics.max_capacity, metrics.current_utilization * 1.2)

            return {
                "action": "scale_up",
                "current_capacity": metrics.current_utilization,
                "recommended_capacity": recommended_capacity,
                "estimated_cost": self._calculate_cost_impact(resource_type, recommended_capacity),
                "reason": f"Resource over-utilized at {utilization:.1f}%",
            }

        return None

    async def _optimize_cross_resources(self) -> dict[str, Any] | None:
        """Optimize across multiple resources"""
        # Analyze compute vs memory ratio
        compute_util = self.resource_metrics[ResourceType.COMPUTE_INSTANCES].utilization_percentage()
        memory_util = self.resource_metrics[ResourceType.CACHE_MEMORY].utilization_percentage()

        if compute_util > 80 and memory_util < 50:
            return {
                "action": "rebalance_compute_memory",
                "reason": "Compute over-utilized while memory under-utilized",
                "recommendation": "Consider memory-optimized instances or additional caching",
            }

        # Analyze worker vs queue ratio
        worker_util = self.resource_metrics[ResourceType.WORKER_PROCESSES].utilization_percentage()
        queue_length = await self._get_queue_length()

        if worker_util > 90 and queue_length > 50:
            return {
                "action": "optimize_worker_queue",
                "reason": "High worker utilization with long queues",
                "recommendation": "Consider async processing or additional workers",
            }

        return None

    def get_scaling_history(self, days: int = 7) -> list[ScalingEvent]:
        """Get scaling event history"""
        cutoff = datetime.now(UTC) - timedelta(days=days)
        return [e for e in self.scaling_events if e.timestamp >= cutoff]

    def get_resource_utilization_report(self) -> dict[str, Any]:
        """Get comprehensive resource utilization report"""
        report = {}

        for resource_type, metrics in self.resource_metrics.items():
            report[resource_type.value] = {
                "current_utilization": metrics.current_utilization,
                "capacity": metrics.capacity,
                "utilization_percentage": metrics.utilization_percentage(),
                "headroom_percentage": metrics.headroom_percentage(),
                "cost_per_unit": metrics.cost_per_unit,
                "last_updated": metrics.last_updated.isoformat(),
            }

        # Overall system health
        avg_utilization = sum(m.utilization_percentage() for m in self.resource_metrics.values()) / len(self.resource_metrics)
        report["system_health"] = {
            "average_utilization": avg_utilization,
            "overall_status": "healthy" if avg_utilization < 80 else "warning" if avg_utilization < 90 else "critical",
            "total_capacity": sum(m.capacity for m in self.resource_metrics.values()),
            "total_cost_per_hour": sum(m.current_utilization * m.cost_per_unit for m in self.resource_metrics.values()),
        }

        return report

    async def run_autonomous_scaling_cycle(self) -> dict[str, Any]:
        """Run a complete autonomous scaling cycle"""
        logger.info("🔄 Starting autonomous scaling cycle")

        # Monitor resources
        resource_metrics = await self.monitor_resources()

        # Evaluate scaling decisions
        scaling_events = await self.evaluate_scaling_decisions()

        # Execute scaling decisions
        executed_events = await self.execute_scaling_decisions(scaling_events)

        # Store successful events
        self.scaling_events.extend([e for e in executed_events if e.success])

        # Run optimization
        optimizations = await self.optimize_resource_allocation()

        # Generate report
        report = {
            "cycle_timestamp": datetime.now(UTC).isoformat(),
            "resource_metrics": {k.value: v.current_utilization for k, v in resource_metrics.items()},
            "scaling_actions": len(executed_events),
            "successful_scalings": sum(1 for e in executed_events if e.success),
            "optimizations": optimizations,
            "system_report": self.get_resource_utilization_report(),
        }

        logger.info(
            f"✅ Scaling cycle completed: {len(executed_events)} actions, " f"{sum(1 for e in executed_events if e.success)} successful"
        )

        return report


# Global autonomous scaling engine instance
scaling_engine = AutonomousScalingEngine()


async def demonstrate_autonomous_scaling():
    """Demonstrate autonomous scaling capabilities"""
    logger.info("🚀 Demonstrating Zenith Autonomous Scaling Engine")
    logger.info("=" * 55)

    # Run initial resource monitoring
    logger.info("Monitoring current resource utilization...")
    metrics = await scaling_engine.monitor_resources()

    for resource_type, metric in metrics.items():
        utilization = metric.utilization_percentage()
        logger.info(f"{resource_type.value}: {metric.current_utilization:.1f}/{metric.capacity:.1f} " f"({utilization:.1f}% utilization)")

    # Evaluate scaling decisions
    logger.info("\nEvaluating scaling decisions...")
    scaling_events = await scaling_engine.evaluate_scaling_decisions()

    logger.info(f"Generated {len(scaling_events)} scaling decisions:")
    for event in scaling_events:
        logger.info(f"  - {event.resource_type.value}: {event.decision.value}")
        logger.info(f"    Reason: {event.reason}")
        logger.info(f"    Confidence: {event.confidence_score:.1%}")
        logger.info(f"    Cost Impact: ${event.estimated_cost_impact:.2f}/day")
        logger.info("")

    # Execute scaling decisions
    if scaling_events:
        logger.info("Executing scaling decisions...")
        executed_events = await scaling_engine.execute_scaling_decisions(scaling_events)

        successful = sum(1 for e in executed_events if e.success)
        logger.info(f"Executed {successful}/{len(executed_events)} scaling actions successfully")
    else:
        logger.info("No scaling actions required at this time")

    # Run resource optimization
    logger.info("\nRunning resource optimization...")
    optimizations = await scaling_engine.optimize_resource_allocation()

    if optimizations:
        logger.info("Resource optimization recommendations:")
        for resource, optimization in optimizations.items():
            logger.info(f"  - {resource}: {optimization.get('action', 'unknown')}")
            logger.info(f"    Reason: {optimization.get('reason', 'N/A')}")
            if "estimated_savings" in optimization:
                logger.info(f"    Savings: ${optimization['estimated_savings']:.2f}/day")
            logger.info("")
    else:
        logger.info("No optimization recommendations at this time")

    # Run complete scaling cycle
    logger.info("Running complete autonomous scaling cycle...")
    cycle_report = await scaling_engine.run_autonomous_scaling_cycle()

    logger.info(f"Cycle completed with {cycle_report['successful_scalings']}/{cycle_report['scaling_actions']} successful scalings")

    # Show system health
    system_report = scaling_engine.get_resource_utilization_report()
    system_health = system_report["system_health"]

    logger.info("\nSystem Health Summary:")
    logger.info(f"  Average Utilization: {system_health['average_utilization']:.1f}%")
    logger.info(f"  Overall Status: {system_health['overall_status']}")
    logger.info(f"  Total Capacity: {system_health['total_capacity']:.1f}")
    logger.info(".2f")

    logger.info("\n✅ Autonomous scaling demonstration completed!")


if __name__ == "__main__":
    asyncio.run(demonstrate_autonomous_scaling())
