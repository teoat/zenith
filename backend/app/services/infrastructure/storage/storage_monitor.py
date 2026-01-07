import logging
from datetime import datetime, timedelta
from typing import Any

import psutil

logger = logging.getLogger(__name__)


class StorageMonitor:
    """Monitor storage scalability and growth patterns"""

    def __init__(self):
        self.storage_metrics = []
        self.growth_predictions = {}
        self.alerts = []

    def monitor_storage_growth(self) -> dict[str, Any]:
        """Monitor storage usage and predict future requirements"""
        try:
            # Get current storage metrics
            disk = psutil.disk_usage("/")
            current_usage = {
                "timestamp": datetime.utcnow().isoformat(),
                "total_gb": disk.total / (1024**3),
                "used_gb": disk.used / (1024**3),
                "free_gb": disk.free / (1024**3),
                "usage_percent": disk.percent,
            }

            self.storage_metrics.append(current_usage)

            # Keep only last 100 measurements
            if len(self.storage_metrics) > 100:
                self.storage_metrics = self.storage_metrics[-100:]

            # Analyze growth trends
            growth_analysis = self._analyze_growth_trends()

            # Generate alerts if needed
            alerts = self._check_storage_thresholds(current_usage)

            return {
                "current_usage": current_usage,
                "growth_analysis": growth_analysis,
                "alerts": alerts,
                "recommendations": self._generate_storage_recommendations(current_usage, growth_analysis),
            }

        except Exception as e:
            logger.error(f"Storage monitoring failed: {e!s}")
            return {"error": str(e)}

    def _analyze_growth_trends(self) -> dict[str, Any]:
        """Analyze storage growth patterns"""
        if len(self.storage_metrics) < 7:
            return {
                "trend": "insufficient_data",
                "daily_growth_rate": 0,
                "predicted_full_date": None,
                "confidence": 0,
            }

        # Calculate daily growth rate
        recent_metrics = self.storage_metrics[-7:]  # Last 7 days
        daily_growth = []

        for i in range(1, len(recent_metrics)):
            growth = recent_metrics[i]["used_gb"] - recent_metrics[i - 1]["used_gb"]
            daily_growth.append(growth)

        avg_daily_growth = sum(daily_growth) / len(daily_growth) if daily_growth else 0

        # Predict when storage will be full
        current_free = recent_metrics[-1]["free_gb"]
        days_until_full = current_free / avg_daily_growth if avg_daily_growth > 0 else 999

        predicted_full_date = None
        if days_until_full < 365:  # Only predict if within a year
            predicted_full_date = (datetime.utcnow() + timedelta(days=days_until_full)).isoformat()

        # Determine trend
        if avg_daily_growth > 1:  # More than 1GB daily growth
            trend = "rapid_growth"
        elif avg_daily_growth > 0.1:  # More than 100MB daily growth
            trend = "moderate_growth"
        elif avg_daily_growth > 0:
            trend = "slow_growth"
        else:
            trend = "stable"

        return {
            "trend": trend,
            "daily_growth_rate_gb": avg_daily_growth,
            "predicted_full_date": predicted_full_date,
            "days_until_full": days_until_full,
            "confidence": min(len(recent_metrics) / 30, 1.0),  # Confidence based on data points
        }

    def _check_storage_thresholds(self, current_usage: dict[str, Any]) -> list[str]:
        """Check storage thresholds and generate alerts"""
        alerts = []

        usage_percent = current_usage["usage_percent"]
        free_gb = current_usage["free_gb"]

        if usage_percent > 95:
            alerts.append(f"Critical: Storage usage at {usage_percent:.1f}% - immediate action required")
        elif usage_percent > 90:
            alerts.append(f"Warning: Storage usage at {usage_percent:.1f}% - plan for expansion")
        elif usage_percent > 80:
            alerts.append(f"Notice: Storage usage at {usage_percent:.1f}% - monitor closely")

        if free_gb < 10:  # Less than 10GB free
            alerts.append(f"Critical: Only {free_gb:.1f}GB free space remaining")

        return alerts

    def _generate_storage_recommendations(self, current_usage: dict[str, Any], growth_analysis: dict[str, Any]) -> list[str]:
        """Generate storage management recommendations"""
        recommendations = []

        usage_percent = current_usage["usage_percent"]
        trend = growth_analysis.get("trend", "unknown")
        days_until_full = growth_analysis.get("days_until_full", 999)

        # Usage-based recommendations
        if usage_percent > 90:
            recommendations.append("Immediate: Implement data archiving and cleanup procedures")
            recommendations.append("Urgent: Plan for storage capacity expansion")

        elif usage_percent > 80:
            recommendations.append("Implement automated log rotation and temporary file cleanup")
            recommendations.append("Review data retention policies")

        # Growth-based recommendations
        if trend == "rapid_growth":
            recommendations.append("Investigate source of rapid data growth and implement controls")
            recommendations.append("Consider implementing data compression")

        if days_until_full < 90:  # Less than 3 months
            recommendations.append("Plan for storage expansion within the next month")

        elif days_until_full < 180:  # Less than 6 months
            recommendations.append("Begin planning for storage capacity increase")

        # General recommendations
        recommendations.extend(
            [
                "Implement automated monitoring alerts for storage usage",
                "Regularly review and clean up unnecessary data",
                "Consider data deduplication and compression technologies",
            ]
        )

        return recommendations

    def get_storage_report(self) -> dict[str, Any]:
        """Generate comprehensive storage report"""
        current_monitoring = self.monitor_storage_growth()

        report = {
            "generated_at": datetime.utcnow().isoformat(),
            "monitoring_period_days": len(self.storage_metrics),
            "current_status": current_monitoring,
            "historical_trends": self._get_historical_trends(),
            "capacity_planning": self._get_capacity_planning(),
            "optimization_opportunities": self._get_optimization_opportunities(),
        }

        return report

    def _get_historical_trends(self) -> dict[str, Any]:
        """Get historical storage usage trends"""
        if len(self.storage_metrics) < 7:
            return {"status": "insufficient_data"}

        # Calculate weekly averages
        weekly_usage = []
        for i in range(0, len(self.storage_metrics), 7):
            week_data = self.storage_metrics[i : i + 7]
            avg_usage = sum(m["usage_percent"] for m in week_data) / len(week_data)
            weekly_usage.append(avg_usage)

        trend_direction = "stable"
        if len(weekly_usage) >= 2:
            if weekly_usage[-1] > weekly_usage[0] + 5:
                trend_direction = "increasing"
            elif weekly_usage[-1] < weekly_usage[0] - 5:
                trend_direction = "decreasing"

        return {
            "weekly_averages": weekly_usage,
            "trend_direction": trend_direction,
            "total_growth_percent": (weekly_usage[-1] - weekly_usage[0] if len(weekly_usage) >= 2 else 0),
        }

    def _get_capacity_planning(self) -> dict[str, Any]:
        """Get capacity planning recommendations"""
        if not self.storage_metrics:
            return {"status": "no_data"}

        current = self.storage_metrics[-1]
        growth_analysis = self._analyze_growth_trends()

        planning = {
            "current_capacity_gb": current["total_gb"],
            "current_usage_gb": current["used_gb"],
            "recommended_buffer_gb": current["total_gb"] * 0.2,  # 20% buffer
            "growth_rate_daily_gb": growth_analysis.get("daily_growth_rate_gb", 0),
            "recommended_upgrade_timeline": None,
            "cost_estimate": None,
        }

        days_until_full = growth_analysis.get("days_until_full", 999)
        if days_until_full < 180:  # 6 months
            planning["recommended_upgrade_timeline"] = "immediate"
            planning["cost_estimate"] = "$50K-$100K for storage expansion"
        elif days_until_full < 365:  # 1 year
            planning["recommended_upgrade_timeline"] = "6_months"
            planning["cost_estimate"] = "$25K-$50K for planned expansion"

        return planning

    def _get_optimization_opportunities(self) -> list[str]:
        """Identify storage optimization opportunities"""
        opportunities = []

        if self.storage_metrics:
            current = self.storage_metrics[-1]
            usage_percent = current["usage_percent"]

            if usage_percent > 85:
                opportunities.append("Implement data deduplication to reduce storage footprint")
                opportunities.append("Set up automated archiving for old logs and temporary files")
                opportunities.append("Review backup retention policies for cleanup opportunities")

            opportunities.extend(
                [
                    "Enable storage compression for applicable data types",
                    "Implement thin provisioning for virtual environments",
                    "Set up automated cleanup of temporary and cache files",
                    "Consider tiered storage with SSD for hot data and HDD for archives",
                ]
            )

        return opportunities


# Global storage monitor instance
storage_monitor = StorageMonitor()
