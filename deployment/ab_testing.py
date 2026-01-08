#!/usr/bin/env python3
"""
A/B Testing Infrastructure
Implements feature flags and traffic splitting for experiments
"""

import hashlib
import json
import logging
import random
from dataclasses import dataclass, field
from datetime import datetime
from enum import Enum
from typing import Any

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)


class ExperimentStatus(Enum):
    DRAFT = "draft"
    RUNNING = "running"
    PAUSED = "paused"
    COMPLETED = "completed"


@dataclass
class ExperimentVariant:
    name: str
    weight: int
    description: str = ""
    config: dict[str, Any] = field(default_factory=dict)


@dataclass
class Experiment:
    name: str
    description: str
    variants: list[ExperimentVariant]
    status: ExperimentStatus = ExperimentStatus.DRAFT
    start_date: datetime | None = None
    end_date: datetime | None = None
    target_metric: str = ""
    min_sample_size: int = 1000

    def get_variant_weights(self) -> dict[str, int]:
        return {v.name: v.weight for v in self.variants}


class ABTestManager:
    """
    A/B testing manager with feature flags and traffic splitting
    """

    def __init__(self, redis_url: str | None = None):
        self.experiments: dict[str, Experiment] = {}
        self.feature_flags: dict[str, bool] = {}
        self.assignments: dict[str, dict[str, str]] = {}
        self.metrics: dict[str, list[dict]] = {}

    def create_experiment(
        self,
        name: str,
        description: str,
        variants: list[dict],
        target_metric: str = "",
        min_sample_size: int = 1000,
    ) -> Experiment:
        """Create a new A/B test experiment"""
        experiment = Experiment(
            name=name,
            description=description,
            variants=[
                ExperimentVariant(
                    name=v["name"],
                    weight=v.get("weight", 50),
                    description=v.get("description", ""),
                    config=v.get("config", {}),
                )
                for v in variants
            ],
            target_metric=target_metric,
            min_sample_size=min_sample_size,
        )

        self.experiments[name] = experiment
        logger.info(f"Created experiment: {name}")
        return experiment

    def start_experiment(self, name: str):
        """Start an experiment"""
        if name in self.experiments:
            self.experiments[name].status = ExperimentStatus.RUNNING
            self.experiments[name].start_date = datetime.now()
            logger.info(f"Started experiment: {name}")

    def pause_experiment(self, name: str):
        """Pause an experiment"""
        if name in self.experiments:
            self.experiments[name].status = ExperimentStatus.PAUSED
            logger.info(f"Paused experiment: {name}")

    def complete_experiment(self, name: str):
        """Mark an experiment as completed"""
        if name in self.experiments:
            self.experiments[name].status = ExperimentStatus.COMPLETED
            self.experiments[name].end_date = datetime.now()
            logger.info(f"Completed experiment: {name}")

    def assign_variant(self, experiment_name: str, user_id: str) -> str | None:
        """
        Assign a user to a variant based on consistent hashing
        """
        if experiment_name not in self.experiments:
            return None

        experiment = self.experiments[experiment_name]
        if experiment.status != ExperimentStatus.RUNNING:
            return None

        assignment_key = f"{experiment_name}:{user_id}"
        if assignment_key in self.assignments:
            return self.assignments[assignment_key]

        consistent_hash = int(hashlib.md5(assignment_key.encode()).hexdigest(), 16)
        bucket = consistent_hash % 100

        cumulative = 0
        for variant in experiment.variants:
            cumulative += variant.weight
            if bucket < cumulative:
                self.assignments[assignment_key] = variant.name
                self._record_assignment(experiment_name, variant.name)
                return variant.name

        return experiment.variants[0].name

    def get_variant_config(self, experiment_name: str, user_id: str) -> dict[str, Any]:
        """Get the configuration for a user's variant"""
        variant_name = self.assign_variant(experiment_name, user_id)
        if not variant_name:
            return {}

        experiment = self.experiments.get(experiment_name)
        if not experiment:
            return {}

        for variant in experiment.variants:
            if variant.name == variant_name:
                return variant.config

        return {}

    def record_metric(self, experiment_name: str, user_id: str, metric: str, value: float):
        """Record a metric for a user in an experiment"""
        variant = self.assign_variant(experiment_name, user_id)
        if not variant:
            return

        if experiment_name not in self.metrics:
            self.metrics[experiment_name] = []

        self.metrics[experiment_name].append({
            "variant": variant,
            "metric": metric,
            "value": value,
            "timestamp": datetime.now().isoformat(),
        })

    def get_results(self, experiment_name: str) -> dict[str, Any]:
        """Get results for an experiment"""
        if experiment_name not in self.metrics:
            return {"error": "No metrics recorded"}

        metrics = self.metrics[experiment_name]
        variants = self.experiments[experiment_name].variants

        results = {}
        for variant in variants:
            variant_metrics = [m for m in metrics if m["variant"] == variant.name]
            if variant_metrics:
                results[variant.name] = {
                    "sample_size": len(variant_metrics),
                    "avg_value": sum(m["value"] for m in variant_metrics) / len(variant_metrics),
                }

        return results

    def _record_assignment(self, experiment_name: str, variant: str):
        """Record assignment for analytics"""
        logger.debug(f"Assigned {variant} for {experiment_name}")

    def set_feature_flag(self, flag_name: str, enabled: bool):
        """Set a feature flag"""
        self.feature_flags[flag_name] = enabled
        logger.info(f"Feature flag {flag_name}: {enabled}")

    def is_feature_enabled(self, flag_name: str, user_id: str | None = None) -> bool:
        """Check if a feature flag is enabled"""
        return self.feature_flags.get(flag_name, False)

    def get_all_experiments(self) -> list[dict]:
        """Get status of all experiments"""
        return [
            {
                "name": name,
                "status": exp.status.value,
                "variants": [v.name for v in exp.variants],
                "start_date": exp.start_date.isoformat() if exp.start_date else None,
            }
            for name, exp in self.experiments.items()
        ]


ab_manager = ABTestManager()


def create_default_experiments():
    """Create default experiments for the platform"""
    ab_manager.create_experiment(
        name="new-fraud-detection-model",
        description="Test new ML model vs current model",
        variants=[
            {"name": "control", "weight": 50, "description": "Current model"},
            {"name": "treatment", "weight": 50, "description": "New model v2"},
        ],
        target_metric="fraud_detection_accuracy",
        min_sample_size=5000,
    )

    ab_manager.create_experiment(
        name="case-queue-sorting",
        description="Test different case prioritization algorithms",
        variants=[
            {"name": "fifo", "weight": 33, "description": "First in, first out"},
            {"name": "priority", "weight": 33, "description": "Priority based"},
            {"name": "ai-scored", "weight": 34, "description": "AI risk score based"},
        ],
        target_metric="case_resolution_time",
        min_sample_size=1000,
    )

    ab_manager.start_experiment("new-fraud-detection-model")


if __name__ == "__main__":
    create_default_experiments()

    user_id = "user-12345"
    variant = ab_manager.assign_variant("new-fraud-detection-model", user_id)
    print(f"User {user_id} assigned to: {variant}")

    config = ab_manager.get_variant_config("new-fraud-detection-model", user_id)
    print(f"Variant config: {json.dumps(config, indent=2)}")

    print("\nAll experiments:")
    for exp in ab_manager.get_all_experiments():
        print(json.dumps(exp, indent=2))
