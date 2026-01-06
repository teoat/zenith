#!/usr/bin/env python3
"""
Automated Scoring System for System Orchestration Framework
Runs continuous health scoring and trend analysis.
"""

import asyncio
import json
import logging
import sqlite3
from datetime import datetime, timedelta
from pathlib import Path
from typing import Any

from app.services.diagnostics.diagnostic_service import DiagnosticService

logger = logging.getLogger(__name__)


class AutomatedScoringSystem:
    """Automated scoring system for continuous health monitoring."""

    def __init__(self, db_path: str = "data/scoring.db"):
        self.db_path = Path(db_path)
        self.db_path.parent.mkdir(exist_ok=True)
        self.diagnostic_service = DiagnosticService()
        self._init_db()

    def _init_db(self):
        """Initialize scoring database."""
        with sqlite3.connect(self.db_path) as conn:
            conn.execute(
                """
                CREATE TABLE IF NOT EXISTS health_scores (
                    id INTEGER PRIMARY KEY,
                    timestamp TEXT NOT NULL,
                    dimension TEXT NOT NULL,
                    score REAL NOT NULL,
                    metrics TEXT,  -- JSON
                    alerts TEXT,  -- JSON
                    recommendations TEXT,  -- JSON
                    trend TEXT,  -- improving, declining, stable
                    created_at TEXT DEFAULT CURRENT_TIMESTAMP
                )
            """
            )

            conn.execute(
                """
                CREATE TABLE IF NOT EXISTS overall_scores (
                    id INTEGER PRIMARY KEY,
                    timestamp TEXT NOT NULL,
                    overall_score REAL NOT NULL,
                    dimensions_score TEXT,  -- JSON
                    recommendations TEXT,  -- JSON
                    trend TEXT,
                    created_at TEXT DEFAULT CURRENT_TIMESTAMP
                )
            """
            )

            # Indexes for performance
            conn.execute(
                "CREATE INDEX IF NOT EXISTS idx_timestamp ON health_scores(timestamp)"
            )
            conn.execute(
                "CREATE INDEX IF NOT EXISTS idx_dimension ON health_scores(dimension)"
            )
            conn.execute(
                "CREATE INDEX IF NOT EXISTS idx_overall_timestamp ON overall_scores(timestamp)"
            )

    async def run_scoring_cycle(self) -> dict[str, Any]:
        """Run a complete scoring cycle."""
        try:
            logger.info("Starting automated scoring cycle")

            # Run comprehensive diagnostics
            diagnostics = await self.diagnostic_service.run_comprehensive_diagnostics()

            # Calculate trends
            trends = await self._calculate_trends(diagnostics)

            # Store results
            await self._store_scoring_results(diagnostics, trends)

            # Generate alerts if needed
            alerts = self._generate_alerts(diagnostics, trends)

            result = {
                "timestamp": datetime.now().isoformat(),
                "overall_score": diagnostics.get("overall_health_score", 0),
                "dimensions": diagnostics,
                "trends": trends,
                "alerts": alerts,
                "recommendations": diagnostics.get("recommendations", []),
            }

            logger.info(f"Scoring cycle completed: {result['overall_score']:.1%}")
            return result

        except Exception as e:
            logger.error(f"Scoring cycle failed: {e}")
            return {"error": str(e), "timestamp": datetime.now().isoformat()}

    async def _calculate_trends(
        self, current_diagnostics: dict[str, Any]
    ) -> dict[str, Any]:
        """Calculate trends based on historical data."""
        trends = {}

        # Get previous scores (last 7 days)
        historical_data = self._get_historical_scores(days_back=7)

        for dimension, data in current_diagnostics.items():
            if not isinstance(data, dict) or "health_score" not in data:
                continue

            current_score = data["health_score"]
            dimension_trend = self._analyze_trend(
                dimension, current_score, historical_data
            )

            trends[dimension] = dimension_trend

        # Overall trend
        current_overall = current_diagnostics.get("overall_health_score", 0)
        overall_historical = [
            s["overall_score"] for s in historical_data.get("overall", [])
        ]
        trends["overall"] = self._analyze_trend(
            "overall", current_overall, {"overall": overall_historical}
        )

        return trends

    def _analyze_trend(
        self, dimension: str, current_score: float, historical: dict[str, list[float]]
    ) -> dict[str, Any]:
        """Analyze trend for a specific dimension."""
        historical_scores = historical.get(dimension, [])

        if len(historical_scores) < 2:
            return {"trend": "insufficient_data", "change": 0, "volatility": 0}

        # Calculate recent trend (last 3 scores)
        recent_scores = [*historical_scores[-3:], current_score]
        change = recent_scores[-1] - recent_scores[0]

        # Determine trend
        if abs(change) < 0.01:
            trend = "stable"
        elif change > 0.02:
            trend = "improving"
        elif change < -0.02:
            trend = "declining"
        else:
            trend = "stable"

        # Calculate volatility
        if len(recent_scores) > 1:
            volatility = sum(
                abs(recent_scores[i] - recent_scores[i - 1])
                for i in range(1, len(recent_scores))
            ) / len(recent_scores)
        else:
            volatility = 0

        return {
            "trend": trend,
            "change": change,
            "volatility": volatility,
            "confidence": min(
                len(historical_scores) / 10, 1.0
            ),  # More data = higher confidence
        }

    def _get_historical_scores(
        self, days_back: int = 7
    ) -> dict[str, list[dict[str, Any]]]:
        """Get historical scoring data."""
        cutoff_date = (datetime.now() - timedelta(days=days_back)).isoformat()

        historical = {"overall": [], "dimensions": {}}

        with sqlite3.connect(self.db_path) as conn:
            # Get overall scores
            cursor = conn.execute(
                "SELECT timestamp, overall_score FROM overall_scores WHERE timestamp >= ? ORDER BY timestamp",
                (cutoff_date,),
            )
            for row in cursor:
                historical["overall"].append(
                    {"timestamp": row[0], "overall_score": row[1]}
                )

            # Get dimension scores
            cursor = conn.execute(
                "SELECT dimension, score FROM health_scores WHERE timestamp >= ? ORDER BY timestamp",
                (cutoff_date,),
            )
            for row in cursor:
                dimension = row[0]
                if dimension not in historical["dimensions"]:
                    historical["dimensions"][dimension] = []
                historical["dimensions"][dimension].append(row[1])

        return historical

    async def _store_scoring_results(
        self, diagnostics: dict[str, Any], trends: dict[str, Any]
    ):
        """Store scoring results in database."""
        timestamp = datetime.now().isoformat()

        with sqlite3.connect(self.db_path) as conn:
            # Store dimension scores
            for dimension, data in diagnostics.items():
                if not isinstance(data, dict) or "health_score" not in data:
                    continue

                trend_info = trends.get(dimension, {})
                conn.execute(
                    """
                    INSERT INTO health_scores (timestamp, dimension, score, metrics, alerts, recommendations, trend)
                    VALUES (?, ?, ?, ?, ?, ?, ?)
                """,
                    (
                        timestamp,
                        dimension,
                        data["health_score"],
                        json.dumps(data.get("metrics", {})),
                        json.dumps(data.get("alerts", [])),
                        json.dumps(data.get("recommendations", [])),
                        trend_info.get("trend", "unknown"),
                    ),
                )

            # Store overall score
            overall_trend = trends.get("overall", {})
            conn.execute(
                """
                INSERT INTO overall_scores (timestamp, overall_score, dimensions_score, recommendations, trend)
                VALUES (?, ?, ?, ?, ?)
            """,
                (
                    timestamp,
                    diagnostics.get("overall_health_score", 0),
                    json.dumps(
                        {
                            k: v
                            for k, v in diagnostics.items()
                            if isinstance(v, dict) and "health_score" in v
                        }
                    ),
                    json.dumps(diagnostics.get("recommendations", [])),
                    overall_trend.get("trend", "unknown"),
                ),
            )

            conn.commit()

    def _generate_alerts(
        self, diagnostics: dict[str, Any], trends: dict[str, Any]
    ) -> list[dict[str, Any]]:
        """Generate alerts based on diagnostics and trends."""
        alerts = []

        overall_score = diagnostics.get("overall_health_score", 1.0)

        # Critical alerts
        if overall_score < 0.8:
            alerts.append(
                {
                    "severity": "critical",
                    "message": f"Overall system health critically low: {overall_score:.1%}",
                    "action_required": "Immediate investigation required",
                }
            )

        # Score drop alerts
        overall_trend = trends.get("overall", {})
        if (
            overall_trend.get("trend") == "declining"
            and abs(overall_trend.get("change", 0)) > 0.05
        ):
            alerts.append(
                {
                    "severity": "high",
                    "message": f"System health declining: {overall_trend['change']:.1%} change",
                    "action_required": "Investigate root causes",
                }
            )

        # Dimension-specific alerts
        for dimension, data in diagnostics.items():
            if not isinstance(data, dict):
                continue

            score = data.get("health_score", 1.0)
            dimension_trend = trends.get(dimension, {})

            if score < 0.7:
                alerts.append(
                    {
                        "severity": "high",
                        "message": f"{dimension.replace('_', ' ').title()} health critical: {score:.1%}",
                        "action_required": "Immediate attention required",
                    }
                )
            elif dimension_trend.get("trend") == "declining":
                alerts.append(
                    {
                        "severity": "medium",
                        "message": f"{dimension.replace('_', ' ').title()} trending downward",
                        "action_required": "Monitor closely",
                    }
                )

        return alerts

    async def get_scoring_history(self, days_back: int = 30) -> dict[str, Any]:
        """Get historical scoring data for dashboard."""
        cutoff_date = (datetime.now() - timedelta(days=days_back)).isoformat()

        history = {"overall_scores": [], "dimension_trends": {}, "alerts_summary": []}

        with sqlite3.connect(self.db_path) as conn:
            # Overall scores
            cursor = conn.execute(
                "SELECT timestamp, overall_score, trend FROM overall_scores WHERE timestamp >= ? ORDER BY timestamp",
                (cutoff_date,),
            )
            for row in cursor:
                history["overall_scores"].append(
                    {"timestamp": row[0], "score": row[1], "trend": row[2]}
                )

            # Dimension trends
            cursor = conn.execute(
                "SELECT dimension, timestamp, score, trend FROM health_scores WHERE timestamp >= ? ORDER BY timestamp",
                (cutoff_date,),
            )
            for row in cursor:
                dimension = row[0]
                if dimension not in history["dimension_trends"]:
                    history["dimension_trends"][dimension] = []

                history["dimension_trends"][dimension].append(
                    {"timestamp": row[1], "score": row[2], "trend": row[3]}
                )

        return history

    async def start_continuous_scoring(self, interval_minutes: int = 60):
        """Start continuous scoring in background."""
        logger.info(f"Starting continuous scoring every {interval_minutes} minutes")

        while True:
            try:
                await self.run_scoring_cycle()
            except Exception as e:
                logger.error(f"Continuous scoring cycle failed: {e}")

            await asyncio.sleep(interval_minutes * 60)


# Global scoring system instance
scoring_system = AutomatedScoringSystem()


async def main():
    """Main function for testing."""
    print("Starting Automated Scoring System test...")

    # Run a scoring cycle
    result = await scoring_system.run_scoring_cycle()
    print(f"Scoring cycle result: {result.get('overall_score', 0):.1%}")

    # Get history
    history = await scoring_system.get_scoring_history(days_back=1)
    print(f"Historical data points: {len(history.get('overall_scores', []))}")


if __name__ == "__main__":
    asyncio.run(main())
