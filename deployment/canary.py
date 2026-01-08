#!/usr/bin/env python3
"""
Canary Deployment Manager
Implements gradual rollout with automatic rollback
"""

import asyncio
import json
import logging
import time
from dataclasses import dataclass
from datetime import datetime
from enum import Enum
from typing import Any

import httpx

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)


class DeploymentStatus(Enum):
    STABLE = "stable"
    CANARY = "canary"
    ROLLING_BACK = "rolling_back"
    FAILED = "failed"


@dataclass
class CanaryConfig:
    service_name: str
    primary_url: str
    canary_url: str
    metric_endpoint: str
    traffic_percentage: int = 10
    evaluation_interval_seconds: int = 60
    success_threshold: float = 0.99
    error_rate_threshold: float = 0.01
    latency_threshold_ms: float = 1000.0
    rollback_threshold: float = 0.95


class CanaryDeployer:
    """
    Canary deployment manager with automatic rollback
    """

    def __init__(self, config: CanaryConfig):
        self.config = config
        self.status = DeploymentStatus.STABLE
        self.metrics_history: list[dict[str, Any]] = []
        self.start_time: datetime | None = None
        self.traffic_split = {"primary": 100, "canary": 0}

    async def start_canary(self, initial_traffic: int = 10):
        """Start canary deployment with initial traffic split"""
        logger.info(f"Starting canary deployment for {self.config.service_name}")
        self.start_time = datetime.now()
        self.traffic_split = {"primary": 100 - initial_traffic, "canary": initial_traffic}
        self.status = DeploymentStatus.CANARY

        await self._update_traffic_routing()

    async def evaluate_canary(self) -> dict[str, Any]:
        """Evaluate canary metrics and decide to promote or rollback"""
        if self.status != DeploymentStatus.CANARY:
            return {"action": "none", "reason": "Not in canary state"}

        metrics = await self._fetch_metrics()

        if not metrics:
            return {"action": "continue", "reason": "Waiting for metrics"}

        self.metrics_history.append(metrics)

        error_rate = metrics.get("error_rate", 0)
        latency_p95 = metrics.get("p95_latency_ms", 0)

        if error_rate > self.config.error_rate_threshold:
            logger.warning(f"Error rate {error_rate} exceeds threshold {self.config.error_rate_threshold}")
            await self.rollback()
            return {"action": "rollback", "reason": f"Error rate {error_rate} > {self.config.error_rate_threshold}"}

        if latency_p95 > self.config.latency_threshold_ms:
            logger.warning(f"P95 latency {latency_p95}ms exceeds threshold {self.config.latency_threshold_ms}ms")
            await self.rollback()
            return {"action": "rollback", "reason": f"Latency {latency_p95}ms > {self.config.latency_threshold_ms}ms"}

        success_rate = metrics.get("success_rate", 1.0)
        if success_rate >= self.config.success_threshold:
            if self.traffic_split["canary"] < 100:
                await self.promote_canary()
                return {"action": "promote", "new_traffic": self.traffic_split}
            else:
                await self.complete_canary()
                return {"action": "complete", "reason": "Full rollout complete"}

        return {"action": "continue", "reason": "Evaluation ongoing"}

    async def promote_canary(self):
        """Increase canary traffic"""
        new_canary = min(self.traffic_split["canary"] + 10, 100)
        self.traffic_split = {"primary": 100 - new_canary, "canary": new_canary}
        await self._update_traffic_routing()
        logger.info(f"Promoted canary to {new_canary}% traffic")

    async def rollback(self):
        """Rollback canary deployment"""
        logger.info(f"Rolling back canary for {self.config.service_name}")
        self.status = DeploymentStatus.ROLLING_BACK
        self.traffic_split = {"primary": 100, "canary": 0}
        await self._update_traffic_routing()
        self.status = DeploymentStatus.STABLE

    async def complete_canary(self):
        """Complete canary deployment"""
        logger.info(f"Canary deployment complete for {self.config.service_name}")
        self.status = DeploymentStatus.STABLE
        self.traffic_split = {"primary": 100, "canary": 0}

    async def _fetch_metrics(self) -> dict[str, Any]:
        """Fetch metrics from monitoring endpoint"""
        try:
            async with httpx.AsyncClient(timeout=30.0) as client:
                response = await client.get(self.config.metric_endpoint)
                if response.status_code == 200:
                    return response.json()
        except Exception as e:
            logger.error(f"Failed to fetch metrics: {e}")
        return {}

    async def _update_traffic_routing(self):
        """Update traffic routing configuration"""
        logger.info(
            f"Traffic split: Primary {self.traffic_split['primary']}%, "
            f"Canary {self.traffic_split['canary']}%"
        )

    def get_status(self) -> dict[str, Any]:
        """Get current canary status"""
        return {
            "service": self.config.service_name,
            "status": self.status.value,
            "traffic_split": self.traffic_split,
            "start_time": self.start_time.isoformat() if self.start_time else None,
            "metrics_evaluations": len(self.metrics_history),
            "last_metrics": self.metrics_history[-1] if self.metrics_history else None,
        }


async def run_canary_deployment(
    service_name: str,
    primary_url: str,
    canary_url: str,
    metric_endpoint: str,
    duration_minutes: int = 30,
):
    """Run a complete canary deployment workflow"""
    config = CanaryConfig(
        service_name=service_name,
        primary_url=primary_url,
        canary_url=canary_url,
        metric_endpoint=metric_endpoint,
        traffic_percentage=10,
    )

    deployer = CanaryDeployer(config)

    await deployer.start_canary(initial_traffic=10)

    start_time = time.time()
    timeout_seconds = duration_minutes * 60

    while time.time() - start_time < timeout_seconds:
        result = await deployer.evaluate_canary()
        logger.info(f"Canary evaluation: {result}")

        if result["action"] in ["complete", "rollback"]:
            break

        await asyncio.sleep(60)

    return deployer.get_status()


if __name__ == "__main__":
    import sys

    service = sys.argv[1] if len(sys.argv) > 1 else "api-gateway"

    result = asyncio.run(
        run_canary_deployment(
            service_name=service,
            primary_url=f"https://{service}.railway.app",
            canary_url=f"https://{service}-new.railway.app",
            metric_endpoint=f"https://{service}.railway.app/health/stats",
            duration_minutes=30,
        )
    )

    print(json.dumps(result, indent=2))
