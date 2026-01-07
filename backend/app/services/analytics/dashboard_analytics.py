"""
Analytics & Insights Dashboard - Real-time investigation performance metrics
"""

import logging
import random
from datetime import datetime, timedelta
from typing import Any

from pydantic import BaseModel

logger = logging.getLogger(__name__)


class InvestigationMetrics(BaseModel):
    """Key performance metrics for investigations"""

    total_cases: int
    active_cases: int
    completed_cases: int
    average_resolution_time: float  # hours
    success_rate: float  # percentage
    fraud_detection_rate: float  # percentage
    false_positive_rate: float  # percentage
    ai_assist_rate: float  # percentage
    user_satisfaction_score: float  # 1-5 scale
    compliance_rate: float  # percentage


class PerformanceTrend(BaseModel):
    """Performance trend data point"""

    date: datetime
    total_cases: int
    resolution_time_avg: float
    success_rate: float
    ai_effectiveness: float
    fraud_prevention_rate: float


class InvestigationInsight(BaseModel):
    """AI-generated investigation insight"""

    id: str
    insight_type: str  # "pattern", "anomaly", "trend", "efficiency"
    title: str
    description: str
    confidence_score: float
    impact_level: str  # "low", "medium", "high"
    recommendations: list[str]
    created_at: datetime


class DashboardConfiguration(BaseModel):
    """Dashboard configuration"""

    time_range: int  # days
    auto_refresh: bool
    displayed_metrics: list[str]
    alert_thresholds: dict[str, float]


class AnalyticsDashboard:
    """Real-time analytics and insights dashboard for fraud investigation platform"""

    def __init__(self):
        self.metrics_history = []
        self.insights = []
        self.alerts = []
        self.configuration = DashboardConfiguration(
            time_range=30,
            auto_refresh=True,
            displayed_metrics=[
                "total_cases",
                "success_rate",
                "ai_assist_rate",
                "fraud_detection_rate",
            ],
            alert_thresholds={
                "success_rate_below": 80.0,
                "false_positive_rate_above": 10.0,
                "resolution_time_above": 48.0,
            },
        )

        # Initial data setup
        self._setup_initial_data()

    def _setup_initial_data(self):
        """Set up initial dashboard data"""
        # Sample historical data for demonstration
        import random

        base_date = datetime.now() - timedelta(days=90)

        # Generate sample metrics history
        for i in range(30):
            date = base_date + timedelta(days=i)

            # Simulate improving performance over time
            success_rate = 75.0 + (i * 0.8)  # Improving success rate
            ai_assist_rate = 0.0 + (i * 1.2)  # Increasing AI usage
            resolution_time = 72.0 - (i * 0.5)  # Improving resolution time
            fraud_detection_rate = 85.0 + (i * 0.3)  # Improving detection
            15.0 - (i * 0.2)  # Reducing false positives

            self.metrics_history.append(
                PerformanceTrend(
                    date=date,
                    total_cases=random.randint(15, 25),
                    resolution_time_avg=resolution_time,
                    success_rate=success_rate,
                    ai_effectiveness=ai_assist_rate,
                    fraud_prevention_rate=fraud_detection_rate,
                )
            )

    async def get_current_metrics(self) -> InvestigationMetrics:
        """Get current investigation performance metrics"""
        try:
            if not self.metrics_history:
                return InvestigationMetrics(
                    total_cases=0,
                    active_cases=0,
                    completed_cases=0,
                    average_resolution_time=0.0,
                    success_rate=0.0,
                    fraud_detection_rate=0.0,
                    false_positive_rate=0.0,
                    ai_assist_rate=0.0,
                    user_satisfaction_score=0.0,
                    compliance_rate=0.0,
                )

            # Get most recent metrics
            latest_metrics = self.metrics_history[-1]

            # Calculate current metrics
            return InvestigationMetrics(
                total_cases=latest_metrics.total_cases,
                active_cases=random.randint(8, 12),  # Simulated active cases
                completed_cases=latest_metrics.total_cases - random.randint(8, 12),
                average_resolution_time=latest_metrics.resolution_time_avg,
                success_rate=latest_metrics.success_rate,
                fraud_detection_rate=latest_metrics.fraud_prevention_rate,
                false_positive_rate=latest_metrics.false_positive_rate,
                ai_assist_rate=latest_metrics.ai_effectiveness,
                user_satisfaction_score=self._calculate_satisfaction(latest_metrics),
                compliance_rate=self._calculate_compliance_rate(latest_metrics),
            )

        except Exception as e:
            logger.error(f"Error getting current metrics: {e}")
            return InvestigationMetrics()

    async def get_performance_trends(self, time_range_days: int = 30) -> list[PerformanceTrend]:
        """Get performance trends over specified time range"""
        try:
            cutoff_date = datetime.now() - timedelta(days=time_range_days)

            recent_trends = [trend for trend in self.metrics_history if trend.date >= cutoff_date]

            return recent_trends

        except Exception as e:
            logger.error(f"Error getting performance trends: {e}")
            return []

    async def generate_investigation_insights(
        self,
        metrics: InvestigationMetrics,
        alert_conditions: dict[str, Any] | None = None,
    ) -> list[InvestigationInsight]:
        """Generate AI-powered investigation insights"""
        insights = []

        try:
            # Analyze performance trends
            recent_trends = await self.get_performance_trends(7)

            if len(recent_trends) >= 2:
                # Trend analysis
                latest = recent_trends[-1]
                previous = recent_trends[-2]

                # Success rate trend
                success_trend = latest.success_rate - previous.success_rate
                if success_trend < -5:
                    insights.append(
                        InvestigationInsight(
                            id=f"insight_success_decline_{datetime.now().strftime('%Y%m%d%H%M%S')}",
                            insight_type="trend",
                            title="Investigation Success Rate Declining",
                            description=f"Success rate has decreased by {abs(success_trend):.1f}% over the past week",
                            confidence_score=0.85,
                            impact_level="high",
                            recommendations=[
                                "Review case management practices",
                                "Provide additional training to investigators",
                                "Investigate root causes of declining performance",
                            ],
                            created_at=datetime.now(),
                        )
                    )
                elif success_trend > 5:
                    insights.append(
                        InvestigationInsight(
                            id=f"insight_success_improve_{datetime.now().strftime('%Y%m%d%H%M%S')}",
                            insight_type="trend",
                            title="Investigation Success Rate Improving",
                            description=f"Success rate has increased by {success_trend:.1f}% over the past week",
                            confidence_score=0.90,
                            impact_level="positive",
                            recommendations=[
                                "Document successful practices",
                                "Share winning strategies across team",
                                "Consider scaling successful approaches",
                            ],
                            created_at=datetime.now(),
                        )
                    )

                # AI effectiveness trend
                ai_trend = latest.ai_effectiveness - previous.ai_effectiveness
                if ai_trend < -3:
                    insights.append(
                        InvestigationInsight(
                            id=f"insight_ai_effectiveness_decline_{datetime.now().strftime('%Y%m%d%H%M%S')}",
                            insight_type="efficiency",
                            title="AI Assistant Effectiveness Declining",
                            description=f"AI assistant effectiveness has decreased by {abs(ai_trend):.1f}% over the past week",
                            confidence_score=0.88,
                            impact_level="medium",
                            recommendations=[
                                "Review AI persona performance",
                                "Check for persona-context mismatches",
                                "Update AI training data",
                            ],
                            created_at=datetime.now(),
                        )
                    )

                # False positive rate trend
                fp_trend = latest.false_positive_rate - previous.false_positive_rate
                if fp_trend > 2:
                    insights.append(
                        InvestigationInsight(
                            id=f"insight_false_positive_increase_{datetime.now().strftime('%Y%m%d%H%M%S')}",
                            insight_type="quality",
                            title="False Positive Rate Increasing",
                            description=f"False positive rate has increased by {fp_trend:.1f}% over the past week",
                            confidence_score=0.92,
                            impact_level="high",
                            recommendations=[
                                "Review investigation criteria",
                                "Enhance fraud detection model",
                                "Provide refresher training on pattern recognition",
                            ],
                            created_at=datetime.now(),
                        )
                    )

                # Resolution time trend
                time_trend = latest.resolution_time_avg - previous.resolution_time_avg
                if time_trend > 3:
                    insights.append(
                        InvestigationInsight(
                            id=f"insight_resolution_time_increase_{datetime.now().strftime('%Y%m%d%H%M%S')}",
                            insight_type="efficiency",
                            title="Investigation Resolution Time Increasing",
                            description=f"Average resolution time has increased by {time_trend:.1f} hours over the past week",
                            confidence_score=0.87,
                            impact_level="medium",
                            recommendations=[
                                "Analyze bottlenecks in investigation process",
                                "Review resource allocation",
                                "Consider automation for time-consuming tasks",
                            ],
                            created_at=datetime.now(),
                        )
                    )
                elif time_trend < -3:
                    insights.append(
                        InvestigationInsight(
                            id=f"insight_resolution_time_decrease_{datetime.now().strftime('%Y%m%d%H%M%S')}",
                            insight_type="efficiency",
                            title="Investigation Resolution Time Improving",
                            description=f"Average resolution time has improved by {abs(time_trend):.1f} hours over the past week",
                            confidence_score=0.91,
                            impact_level="positive",
                            recommendations=[
                                "Document efficiency improvements",
                                "Scale successful time reduction strategies",
                                "Recognize top performers",
                            ],
                            created_at=datetime.now(),
                        )
                    )

            # Pattern analysis insights
            if metrics.fraud_detection_rate < 80:
                insights.append(
                    InvestigationInsight(
                        id=f"insight_low_detection_{datetime.now().strftime('%Y%m%d%H%M%S')}",
                        insight_type="pattern",
                        title="Low Fraud Detection Rate Identified",
                        description=f"Fraud detection rate ({metrics.fraud_detection_rate:.1f}%) is below target threshold of 80%",
                        confidence_score=0.94,
                        impact_level="high",
                        recommendations=[
                            "Review fraud detection model parameters",
                            "Increase investigation of false negative cases",
                            "Consider model retraining with recent data",
                        ],
                        created_at=datetime.now(),
                    )
                )

            if metrics.false_positive_rate > 12:
                insights.append(
                    InvestigationInsight(
                        id=f"insight_high_false_positives_{datetime.now().strftime('%Y%m%d%H%M%S')}",
                        insight_type="quality",
                        title="High False Positive Rate Identified",
                        description=f"False positive rate ({metrics.false_positive_rate:.1f}%) exceeds acceptable threshold of 10%",
                        confidence_score=0.95,
                        impact_level="high",
                        recommendations=[
                            "Implement stricter investigation criteria",
                            "Review model confidence thresholds",
                            "Enhance pattern recognition training",
                        ],
                        created_at=datetime.now(),
                    )
                )

            # AI effectiveness insights
            if metrics.ai_assist_rate < 50:
                insights.append(
                    InvestigationInsight(
                        id=f"insight_low_ai_adoption_{datetime.now().strftime('%Y%m%d%H%M%S')}",
                        insight_type="efficiency",
                        title="Low AI Assistant Adoption",
                        description=f"AI assistant usage rate ({metrics.ai_assist_rate:.1f}%) indicates low adoption by investigators",
                        confidence_score=0.89,
                        impact_level="medium",
                        recommendations=[
                            "Improve AI interface usability",
                            "Provide AI training sessions",
                            "Demonstrate AI effectiveness through case studies",
                        ],
                        created_at=datetime.now(),
                    )
                )

            # Check alert conditions
            if alert_conditions:
                if alert_conditions.get("backlog_size", 0) > 50:
                    insights.append(
                        InvestigationInsight(
                            id=f"insight_backlog_alert_{datetime.now().strftime('%Y%m%d%H%M%S')}",
                            insight_type="efficiency",
                            title="Large Investigation Backlog",
                            description=f"Investigation backlog has grown to {alert_conditions['backlog_size']} cases",
                            confidence_score=0.93,
                            impact_level="high",
                            recommendations=[
                                "Prioritize high-risk cases",
                                "Allocate additional resources",
                                "Consider automated case triage",
                            ],
                            created_at=datetime.now(),
                        )
                    )

                if alert_conditions.get("staff_workload", 0) > 1.2:  # 20% above normal
                    insights.append(
                        InvestigationInsight(
                            id=f"insight_workload_alert_{datetime.now().strftime('%Y%m%d%H%M%S')}",
                            insight_type="efficiency",
                            title="Investigator Workload High",
                            description="Investigator workload is 20% above normal levels",
                            confidence_score=0.88,
                            impact_level="medium",
                            recommendations=[
                                "Balance workload distribution",
                                "Consider temporary staff augmentation",
                                "Implement time management strategies",
                            ],
                            created_at=datetime.now(),
                        )
                    )

            return insights

        except Exception as e:
            logger.error(f"Error generating insights: {e}")
            return []

    def _calculate_satisfaction(self, metrics: InvestigationMetrics) -> float:
        """Calculate user satisfaction score based on multiple metrics"""
        base_satisfaction = 3.5  # Neutral starting point

        # Adjust based on success rate
        if metrics.success_rate > 90:
            base_satisfaction += 1.0
        elif metrics.success_rate < 70:
            base_satisfaction -= 0.8

        # Adjust based on resolution time
        if metrics.average_resolution_time < 24:
            base_satisfaction += 0.5
        elif metrics.average_resolution_time > 72:
            base_satisfaction -= 0.5

        # Adjust based on AI effectiveness
        if metrics.ai_assist_rate > 75:
            base_satisfaction += 0.3
        elif metrics.ai_assist_rate < 30:
            base_satisfaction -= 0.3

        return max(1.0, min(5.0, base_satisfaction))

    def _calculate_compliance_rate(self, metrics: InvestigationMetrics) -> float:
        """Calculate compliance rate based on key metrics"""
        base_compliance = 95.0  # Starting compliance assumption

        # Adjust based on success rate
        if metrics.success_rate < 80:
            base_compliance -= 5.0
        elif metrics.success_rate > 95:
            base_compliance += 2.0

        # Adjust based on false positives
        if metrics.false_positive_rate > 10:
            base_compliance -= 3.0
        elif metrics.false_positive_rate < 5:
            base_compliance += 2.0

        # Adjust based on fraud detection
        if metrics.fraud_detection_rate < 80:
            base_compliance -= 4.0
        elif metrics.fraud_detection_rate > 95:
            base_compliance += 1.0

        return max(0.0, min(100.0, base_compliance))

    async def get_dashboard_data(self, time_range_days: int = 30) -> dict[str, Any]:
        """Get comprehensive dashboard data"""
        try:
            current_metrics = await self.get_current_metrics()
            performance_trends = await self.get_performance_trends(time_range_days)
            insights = await self.generate_investigation_insights(current_metrics)

            return {
                "current_metrics": current_metrics.dict(),
                "performance_trends": [trend.dict() for trend in performance_trends],
                "insights": [insight.dict() for insight in insights],
                "configuration": self.configuration.dict(),
                "data_timestamp": datetime.now().isoformat(),
                "time_range_days": time_range_days,
            }

        except Exception as e:
            logger.error(f"Error getting dashboard data: {e}")
            return {
                "error": str(e),
                "current_metrics": InvestigationMetrics().dict(),
                "performance_trends": [],
                "insights": [],
                "configuration": self.configuration.dict(),
            }

    async def update_configuration(self, updates: dict[str, Any]) -> bool:
        """Update dashboard configuration"""
        try:
            for key, value in updates.items():
                if hasattr(self.configuration, key):
                    setattr(self.configuration, key, value)
                else:
                    logger.warning(f"Unknown configuration key: {key}")

            logger.info(f"Dashboard configuration updated: {updates}")
            return True

        except Exception as e:
            logger.error(f"Error updating configuration: {e}")
            return False

    async def add_metric_sample(self, metrics: InvestigationMetrics) -> None:
        """Add new metrics sample for tracking"""
        try:
            trend = PerformanceTrend(
                date=datetime.now(),
                total_cases=metrics.total_cases,
                resolution_time_avg=metrics.average_resolution_time,
                success_rate=metrics.success_rate,
                ai_effectiveness=metrics.ai_assist_rate,
                fraud_prevention_rate=metrics.fraud_detection_rate,
            )

            self.metrics_history.append(trend)

            # Keep only last 90 days of data
            cutoff_date = datetime.now() - timedelta(days=90)
            self.metrics_history = [trend for trend in self.metrics_history if trend.date >= cutoff_date]

            logger.info(f"New metrics sample added for {metrics.total_cases} cases")

        except Exception as e:
            logger.error(f"Error adding metric sample: {e}")

    async def generate_performance_report(self, format_type: str = "summary") -> dict[str, Any]:
        """Generate comprehensive performance report"""
        try:
            current_metrics = await self.get_current_metrics()

            report_data = {
                "report_id": f"perf_report_{datetime.now().strftime('%Y%m%d_%H%M%S')}",
                "generated_at": datetime.now().isoformat(),
                "format_type": format_type,
                "current_metrics": current_metrics.dict(),
                "period": self.configuration.time_range_days,
                "summary": self._generate_performance_summary(current_metrics),
                "recommendations": self._generate_performance_recommendations(current_metrics),
            }

            if format_type == "detailed":
                report_data["performance_trends"] = await self.get_performance_trends(self.configuration.time_range_days)
                report_data["insights"] = await self.generate_investigation_insights(current_metrics)

            logger.info(f"Performance report generated: {format_type}")
            return report_data

        except Exception as e:
            logger.error(f"Error generating performance report: {e}")
            return {"error": str(e)}

    def _generate_performance_summary(self, metrics: InvestigationMetrics) -> str:
        """Generate performance summary text"""
        return f"""
        Investigation Platform Performance Summary
        ==========================================
        Total Cases: {metrics.total_cases}
        Success Rate: {metrics.success_rate:.1f}%
        Average Resolution Time: {metrics.average_resolution_time:.1f} hours
        Fraud Detection Rate: {metrics.fraud_detection_rate:.1f}%
        False Positive Rate: {metrics.false_positive_rate:.1f}%
        AI Assistant Effectiveness: {metrics.ai_assist_rate:.1f}%
        User Satisfaction: {metrics.user_satisfaction_score:.1f}/5.0
        Compliance Rate: {metrics.compliance_rate:.1f}%

        Overall Status: {self._get_overall_status(metrics)}
        """

    def _generate_performance_recommendations(self, metrics: InvestigationMetrics) -> list[str]:
        """Generate performance improvement recommendations"""
        recommendations = []

        if metrics.success_rate < 80:
            recommendations.append("Focus on improving investigation success rate through training and better case management")

        if metrics.average_resolution_time > 48:
            recommendations.append("Investigate bottlenecks in investigation process and consider automation for time-consuming tasks")

        if metrics.fraud_detection_rate < 80:
            recommendations.append("Review and enhance fraud detection models with recent data")

        if metrics.false_positive_rate > 10:
            recommendations.append("Implement stricter investigation criteria and improve pattern recognition to reduce false positives")

        if metrics.ai_assist_rate < 50:
            recommendations.append("Improve AI assistant usability and provide training to increase adoption")

        if metrics.compliance_rate < 90:
            recommendations.append("Strengthen compliance procedures and documentation to improve regulatory compliance")

        return recommendations

    def _get_overall_status(self, metrics: InvestigationMetrics) -> str:
        """Determine overall platform status"""
        if metrics.success_rate >= 90 and metrics.fraud_detection_rate >= 90:
            return "EXCELLENT"
        elif metrics.success_rate >= 80 and metrics.fraud_detection_rate >= 80:
            return "GOOD"
        elif metrics.success_rate >= 70 and metrics.fraud_detection_rate >= 70:
            return "NEEDS IMPROVEMENT"
        elif metrics.success_rate >= 60 and metrics.fraud_detection_rate >= 60:
            return "POOR"
        else:
            return "CRITICAL"
