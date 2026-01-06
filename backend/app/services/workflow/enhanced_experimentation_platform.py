#!/usr/bin/env python3
"""
Enhanced Experimentation Framework
Comprehensive platform for running controlled experiments and accelerating innovation
"""

import asyncio
import logging
import random
import time
from collections.abc import Callable
from dataclasses import dataclass, field
from datetime import datetime
from enum import Enum
from typing import Any

logger = logging.getLogger(__name__)


class ExperimentStatus(Enum):
    PROPOSED = "proposed"
    APPROVED = "approved"
    RUNNING = "running"
    COMPLETED = "completed"
    FAILED = "failed"
    CANCELLED = "cancelled"


class ExperimentType(Enum):
    A_B_TEST = "a_b_test"
    MULTIVARIATE = "multivariate"
    FEATURE_FLAG = "feature_flag"
    CANARY_DEPLOYMENT = "canary_deployment"
    CHAOS_ENGINEERING = "chaos_engineering"
    PERFORMANCE_TEST = "performance_test"


@dataclass
class ExperimentVariant:
    """A/B test variant"""

    variant_id: str
    name: str
    configuration: dict[str, Any]
    traffic_percentage: float
    metrics: dict[str, float] = field(default_factory=dict)


@dataclass
class Experiment:
    """Enhanced experiment representation"""

    experiment_id: str
    title: str
    hypothesis: str
    type: ExperimentType
    variants: list[ExperimentVariant]
    success_criteria: list[str]
    status: ExperimentStatus
    owner: str
    created_at: datetime
    started_at: datetime | None = None
    completed_at: datetime | None = None
    results: dict[str, Any] | None = None
    lessons_learned: list[str] = field(default_factory=list)
    statistical_significance: float | None = None
    confidence_interval: tuple[float, float] | None = None


class EnhancedExperimentationPlatform:
    """Comprehensive experimentation platform with advanced features"""

    def __init__(self):
        self.experiments: dict[str, Experiment] = {}
        self._background_tasks: list[asyncio.Task] = []
        self.experiment_templates: dict[str, dict] = {}
        self.metrics_collectors: dict[str, Callable] = {}
        self.auto_scaling_enabled = True
        self.confidence_threshold = 0.95
        self.min_sample_size = 1000

        self._initialize_experiment_templates()
        self._setup_metrics_collection()

    def _initialize_experiment_templates(self):
        """Initialize experiment templates for rapid experimentation"""
        self.experiment_templates = {
            "a_b_feature_rollout": {
                "type": ExperimentType.A_B_TEST,
                "description": "Standard A/B test for feature rollout",
                "variants": [
                    {"name": "control", "percentage": 50},
                    {"name": "treatment", "percentage": 50},
                ],
                "metrics": ["conversion_rate", "user_engagement", "error_rate"],
                "duration_days": 14,
                "min_sample_size": 5000,
            },
            "canary_deployment": {
                "type": ExperimentType.CANARY_DEPLOYMENT,
                "description": "Gradual rollout with automated rollback",
                "variants": [
                    {"name": "baseline", "percentage": 95},
                    {"name": "canary", "percentage": 5},
                ],
                "metrics": ["response_time", "error_rate", "resource_usage"],
                "duration_days": 7,
                "auto_rollback_triggers": ["error_rate > 0.05", "response_time > 2.0"],
            },
            "chaos_experiment": {
                "type": ExperimentType.CHAOS_ENGINEERING,
                "description": "Controlled failure injection testing",
                "variants": [{"name": "baseline", "percentage": 100}],
                "metrics": ["system_stability", "recovery_time", "error_handling"],
                "duration_minutes": 30,
                "failure_types": ["cpu_stress", "memory_pressure", "network_partition"],
            },
        }

    def _setup_metrics_collection(self):
        """Setup automated metrics collection"""
        self.metrics_collectors = {
            "conversion_rate": self._collect_conversion_metrics,
            "user_engagement": self._collect_engagement_metrics,
            "error_rate": self._collect_error_metrics,
            "response_time": self._collect_performance_metrics,
            "resource_usage": self._collect_resource_metrics,
            "system_stability": self._collect_stability_metrics,
        }

    async def create_experiment_from_template(
        self, template_name: str, title: str, hypothesis: str, owner: str
    ) -> Experiment:
        """Rapid experiment creation from template"""
        if template_name not in self.experiment_templates:
            raise ValueError(f"Template {template_name} not found")

        template = self.experiment_templates[template_name]
        experiment_id = f"exp_{int(time.time())}_{template_name}"

        # Create variants from template
        variants = []
        for i, variant_config in enumerate(template["variants"]):
            variant = ExperimentVariant(
                variant_id=f"{experiment_id}_v{i}",
                name=variant_config["name"],
                configuration={},
                traffic_percentage=variant_config["percentage"],
            )
            variants.append(variant)

        experiment = Experiment(
            experiment_id=experiment_id,
            title=title,
            hypothesis=hypothesis,
            type=template["type"],
            variants=variants,
            success_criteria=template.get("success_criteria", []),
            status=ExperimentStatus.PROPOSED,
            owner=owner,
            created_at=datetime.now(),
        )

        self.experiments[experiment_id] = experiment
        logger.info(f"Created experiment {experiment_id} from template {template_name}")
        return experiment

    async def start_experiment(self, experiment_id: str) -> bool:
        """Start experiment with automated setup"""
        if experiment_id not in self.experiments:
            return False

        experiment = self.experiments[experiment_id]

        # Auto-approve for rapid experimentation
        if experiment.status == ExperimentStatus.PROPOSED:
            experiment.status = ExperimentStatus.APPROVED

        experiment.status = ExperimentStatus.RUNNING
        experiment.started_at = datetime.now()

        # Setup automated monitoring
        monitor_task = asyncio.create_task(self._monitor_experiment(experiment_id))
        self._background_tasks.append(monitor_task)

        logger.info(f"Started experiment: {experiment_id}")
        return True

    async def _monitor_experiment(self, experiment_id: str):
        """Automated experiment monitoring and analysis"""
        experiment = self.experiments[experiment_id]

        while experiment.status == ExperimentStatus.RUNNING:
            await asyncio.sleep(300)  # Check every 5 minutes

            # Collect metrics for all variants
            for variant in experiment.variants:
                for metric_name in self.metrics_collectors:
                    if metric_name in experiment.results.get("target_metrics", []):
                        try:
                            value = await self.metrics_collectors[metric_name](
                                variant.variant_id
                            )
                            variant.metrics[metric_name] = value
                        except Exception as e:
                            logger.error(
                                f"Failed to collect {metric_name} for {variant.variant_id}: {e}"
                            )

            # Check for statistical significance
            if self._check_statistical_significance(experiment):
                await self._complete_experiment(
                    experiment_id, "Statistical significance achieved"
                )
                break

            # Check auto-rollback conditions for canary deployments
            if experiment.type == ExperimentType.CANARY_DEPLOYMENT:
                if self._should_rollback(experiment):
                    await self._rollback_experiment(
                        experiment_id, "Auto-rollback triggered"
                    )
                    break

    def _check_statistical_significance(self, experiment: Experiment) -> bool:
        """Check if experiment results are statistically significant"""
        if len(experiment.variants) < 2:
            return False

        # Simplified statistical significance check
        # In production, use proper statistical tests (t-test, chi-square, etc.)
        control_variant = next(
            (v for v in experiment.variants if v.name == "control"),
            experiment.variants[0],
        )
        treatment_variant = next(
            (v for v in experiment.variants if v.name != control_variant.name), None
        )

        if not treatment_variant:
            return False

        # Check if we have minimum sample size
        if sum(control_variant.metrics.values()) < self.min_sample_size:
            return False

        # Calculate effect size and confidence
        # This is a simplified implementation
        effect_size = abs(
            treatment_variant.metrics.get("conversion_rate", 0)
            - control_variant.metrics.get("conversion_rate", 0)
        )

        # Assume significance if effect size > 5% and confidence > threshold
        return effect_size > 0.05 and random.random() > (1 - self.confidence_threshold)

    def _should_rollback(self, experiment: Experiment) -> bool:
        """Check if canary deployment should be rolled back"""
        canary_variant = next(
            (v for v in experiment.variants if v.name == "canary"), None
        )
        if not canary_variant:
            return False

        # Check rollback triggers
        error_rate = canary_variant.metrics.get("error_rate", 0)
        response_time = canary_variant.metrics.get("response_time", 0)

        return error_rate > 0.05 or response_time > 2.0

    async def _complete_experiment(self, experiment_id: str, reason: str):
        """Complete experiment and analyze results"""
        experiment = self.experiments[experiment_id]
        experiment.status = ExperimentStatus.COMPLETED
        experiment.completed_at = datetime.now()

        # Analyze results
        results = self._analyze_experiment_results(experiment)
        experiment.results = results
        experiment.statistical_significance = results.get("significance", 0.0)

        logger.info(f"Completed experiment {experiment_id}: {reason}")

    async def _rollback_experiment(self, experiment_id: str, reason: str):
        """Rollback failed canary deployment"""
        experiment = self.experiments[experiment_id]
        experiment.status = ExperimentStatus.FAILED
        experiment.completed_at = datetime.now()
        experiment.lessons_learned.append(f"Auto-rollback: {reason}")

        logger.warning(f"Rolled back experiment {experiment_id}: {reason}")

    def _analyze_experiment_results(self, experiment: Experiment) -> dict[str, Any]:
        """Analyze experiment results and generate insights"""
        analysis = {
            "winner": None,
            "effect_size": 0.0,
            "significance": 0.0,
            "insights": [],
            "recommendations": [],
        }

        if len(experiment.variants) >= 2:
            # Find best performing variant
            best_variant = max(
                experiment.variants, key=lambda v: v.metrics.get("conversion_rate", 0)
            )
            analysis["winner"] = best_variant.name

            # Calculate effect size (simplified)
            control = next(
                (v for v in experiment.variants if v.name == "control"),
                experiment.variants[0],
            )
            analysis["effect_size"] = abs(
                best_variant.metrics.get("conversion_rate", 0)
                - control.metrics.get("conversion_rate", 0)
            )

            # Generate insights
            if analysis["effect_size"] > 0.1:
                analysis["insights"].append("Strong positive effect detected")
                analysis["recommendations"].append("Roll out winning variant to 100%")
            elif analysis["effect_size"] > 0.05:
                analysis["insights"].append("Moderate effect detected")
                analysis["recommendations"].append("Consider gradual rollout")
            else:
                analysis["insights"].append("No significant effect detected")
                analysis["recommendations"].append(
                    "Reconsider hypothesis or test different variants"
                )

        return analysis

    # Metrics collection methods (simplified implementations)
    async def _collect_conversion_metrics(self, variant_id: str) -> float:
        """Collect conversion rate metrics"""
        # In production, integrate with analytics platform
        return random.uniform(0.02, 0.08)

    async def _collect_engagement_metrics(self, variant_id: str) -> float:
        """Collect user engagement metrics"""
        return random.uniform(0.1, 0.5)

    async def _collect_error_metrics(self, variant_id: str) -> float:
        """Collect error rate metrics"""
        return random.uniform(0.001, 0.01)

    async def _collect_performance_metrics(self, variant_id: str) -> float:
        """Collect response time metrics"""
        return random.uniform(0.5, 2.5)

    async def _collect_resource_metrics(self, variant_id: str) -> float:
        """Collect resource usage metrics"""
        return random.uniform(0.3, 0.9)

    async def _collect_stability_metrics(self, variant_id: str) -> float:
        """Collect system stability metrics"""
        return random.uniform(0.85, 0.99)

    async def get_experiment_status(self, experiment_id: str) -> dict[str, Any]:
        """Get comprehensive experiment status"""
        if experiment_id not in self.experiments:
            return {"error": "Experiment not found"}

        experiment = self.experiments[experiment_id]

        return {
            "experiment_id": experiment.experiment_id,
            "title": experiment.title,
            "status": experiment.status.value,
            "progress": self._calculate_progress(experiment),
            "variants": [
                {
                    "name": v.name,
                    "traffic_percentage": v.traffic_percentage,
                    "metrics": v.metrics,
                }
                for v in experiment.variants
            ],
            "results": experiment.results,
            "statistical_significance": experiment.statistical_significance,
        }

    def _calculate_progress(self, experiment: Experiment) -> float:
        """Calculate experiment progress (0.0 to 1.0)"""
        if experiment.status != ExperimentStatus.RUNNING:
            return 1.0 if experiment.status == ExperimentStatus.COMPLETED else 0.0

        # Simplified progress calculation based on sample size
        total_samples = sum(sum(v.metrics.values()) for v in experiment.variants)
        target_samples = self.min_sample_size * len(experiment.variants)

        return min(1.0, total_samples / target_samples)


# Global instance
enhanced_experimentation_platform = EnhancedExperimentationPlatform()
