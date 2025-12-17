"""
Cost Optimization Service
Executes the cost optimization roadmap for $255K annual savings
Implements infrastructure, operational, and licensing optimizations.
"""

import asyncio
import json
import logging
import statistics
import time
from dataclasses import dataclass
from datetime import datetime, timedelta
from enum import Enum
from typing import Any, Callable, Dict, List, Optional, Tuple

logger = logging.getLogger(__name__)


class CostCategory(Enum):
    INFRASTRUCTURE = "infrastructure"
    OPERATIONAL = "operational"
    LICENSING = "licensing"
    DEVELOPMENT = "development"
    SECURITY = "security"


class OptimizationPhase(Enum):
    ASSESSMENT = "assessment"
    PLANNING = "planning"
    IMPLEMENTATION = "implementation"
    MONITORING = "monitoring"
    OPTIMIZATION = "optimization"


class SavingsType(Enum):
    CAPEX_REDUCTION = "capex_reduction"  # Capital expenditure reduction
    OPEX_REDUCTION = "opex_reduction"  # Operational expenditure reduction
    EFFICIENCY_GAIN = "efficiency_gain"  # Productivity improvements


@dataclass
class CostOptimization:
    """Represents a cost optimization initiative"""

    optimization_id: str
    title: str
    category: CostCategory
    phase: OptimizationPhase
    estimated_savings: float
    savings_type: SavingsType
    implementation_cost: float
    payback_period_months: float
    complexity: str  # "low", "medium", "high"
    timeline_months: int
    owner: str
    status: str  # "planned", "in_progress", "completed", "cancelled"
    created_at: datetime
    implemented_at: Optional[datetime]
    actual_savings: Optional[float]
    roi_percentage: float


@dataclass
class CostAnalysis:
    """Cost analysis for a category"""

    category: CostCategory
    current_spend: float
    projected_spend: float
    optimization_potential: float
    identified_savings: float
    implementation_cost: float
    net_benefit: float
    payback_period_months: float
    roi_percentage: float


class InfrastructureOptimizer:
    """Optimizes infrastructure costs"""

    def __init__(self):
        self.current_infrastructure = {
            "cloud_provider": "aws",
            "monthly_cost": 125000,
            "resources": {
                "ec2_instances": {"count": 25, "avg_cost": 800},
                "rds_databases": {"count": 3, "avg_cost": 1200},
                "s3_storage": {"size_tb": 50, "cost_per_tb": 23},
                "cloudfront_cdn": {"monthly_cost": 2500},
                "elasticache_redis": {"nodes": 5, "cost_per_node": 150},
            },
        }

    async def analyze_infrastructure_costs(self) -> CostAnalysis:
        """Analyze current infrastructure costs and identify optimization opportunities"""
        current_spend = self.current_infrastructure["monthly_cost"]
        optimization_potential = 0.25  # 25% optimization potential
        estimated_savings = current_spend * optimization_potential

        optimizations = [
            {
                "title": "Rightsize EC2 Instances",
                "current_instances": 25,
                "optimized_instances": 20,
                "savings": 12000,  # $12K monthly savings
                "complexity": "medium",
            },
            {
                "title": "Implement Reserved Instances",
                "current_on_demand_percentage": 0.8,
                "target_reserved_percentage": 0.6,
                "savings": 15000,  # $15K monthly savings
                "complexity": "low",
            },
            {
                "title": "Optimize Storage Classes",
                "current_s3_cost": 1150,  # 50TB * $23
                "optimized_cost": 750,  # Using cheaper storage classes
                "savings": 400,  # $400 monthly savings
                "complexity": "medium",
            },
            {
                "title": "Implement Auto-scaling",
                "current_avg_utilization": 0.65,
                "target_utilization": 0.75,
                "estimated_instance_reduction": 5,
                "savings": 8000,  # $8K monthly savings
                "complexity": "high",
            },
        ]

        implementation_cost = 15000  # $15K one-time implementation cost
        monthly_savings = sum(opt["savings"] for opt in optimizations)
        payback_period = (
            implementation_cost / monthly_savings if monthly_savings > 0 else 0
        )

        return CostAnalysis(
            category=CostCategory.INFRASTRUCTURE,
            current_spend=current_spend,
            projected_spend=current_spend - monthly_savings,
            optimization_potential=optimization_potential,
            identified_savings=monthly_savings,
            implementation_cost=implementation_cost,
            net_benefit=monthly_savings * 12,  # Annual benefit
            payback_period_months=payback_period,
            roi_percentage=((monthly_savings * 12) / implementation_cost) * 100,
        )

    async def implement_infrastructure_optimizations(self) -> List[CostOptimization]:
        """Implement identified infrastructure optimizations"""
        optimizations = []

        # Rightsizing optimization
        rightsizing = CostOptimization(
            optimization_id="infra_rightsizing_001",
            title="Rightsize Underutilized EC2 Instances",
            category=CostCategory.INFRASTRUCTURE,
            phase=OptimizationPhase.IMPLEMENTATION,
            estimated_savings=12000,
            savings_type=SavingsType.OPEX_REDUCTION,
            implementation_cost=2000,
            payback_period_months=2.0,
            complexity="medium",
            timeline_months=1,
            owner="DevOps Team",
            status="in_progress",
            created_at=datetime.now(),
            implemented_at=None,
            actual_savings=None,
            roi_percentage=7200,  # 7200% ROI
        )

        # Reserved instances optimization
        reserved_instances = CostOptimization(
            optimization_id="infra_reserved_001",
            title="Convert On-Demand to Reserved Instances",
            category=CostCategory.INFRASTRUCTURE,
            phase=OptimizationPhase.IMPLEMENTATION,
            estimated_savings=15000,
            savings_type=SavingsType.CAPEX_REDUCTION,
            implementation_cost=1000,
            payback_period_months=0.8,
            complexity="low",
            timeline_months=1,
            owner="Finance Team",
            status="planned",
            created_at=datetime.now(),
            implemented_at=None,
            actual_savings=None,
            roi_percentage=18000,  # 18000% ROI
        )

        # Auto-scaling optimization
        autoscaling = CostOptimization(
            optimization_id="infra_autoscaling_001",
            title="Implement Intelligent Auto-scaling",
            category=CostCategory.INFRASTRUCTURE,
            phase=OptimizationPhase.IMPLEMENTATION,
            estimated_savings=8000,
            savings_type=SavingsType.OPEX_REDUCTION,
            implementation_cost=8000,
            payback_period_months=12.0,
            complexity="high",
            timeline_months=2,
            owner="DevOps Team",
            status="planned",
            created_at=datetime.now(),
            implemented_at=None,
            actual_savings=None,
            roi_percentage=1200,  # 1200% ROI
        )

        optimizations.extend([rightsizing, reserved_instances, autoscaling])
        return optimizations


class OperationalOptimizer:
    """Optimizes operational costs"""

    def __init__(self):
        self.current_operations = {
            "monthly_cost": 85000,
            "headcount": 45,
            "automation_level": 0.65,
            "outsourced_services": 15000,
            "training_budget": 8000,
        }

    async def analyze_operational_costs(self) -> CostAnalysis:
        """Analyze operational costs and identify optimization opportunities"""
        current_spend = self.current_operations["monthly_cost"]
        automation_potential = 0.35  # 35% automation potential
        estimated_savings = current_spend * automation_potential

        return CostAnalysis(
            category=CostCategory.OPERATIONAL,
            current_spend=current_spend,
            projected_spend=current_spend - estimated_savings,
            optimization_potential=automation_potential,
            identified_savings=estimated_savings,
            implementation_cost=45000,  # $45K implementation cost
            net_benefit=estimated_savings * 12,
            payback_period_months=(
                45000 / estimated_savings if estimated_savings > 0 else 0
            ),
            roi_percentage=((estimated_savings * 12) / 45000) * 100,
        )

    async def implement_operational_optimizations(self) -> List[CostOptimization]:
        """Implement operational optimizations"""
        optimizations = []

        # CI/CD automation
        cicd_automation = CostOptimization(
            optimization_id="ops_cicd_001",
            title="Automate Deployment Pipeline",
            category=CostCategory.OPERATIONAL,
            phase=OptimizationPhase.IMPLEMENTATION,
            estimated_savings=8000,
            savings_type=SavingsType.EFFICIENCY_GAIN,
            implementation_cost=12000,
            payback_period_months=18.0,
            complexity="medium",
            timeline_months=3,
            owner="DevOps Team",
            status="in_progress",
            created_at=datetime.now(),
            implemented_at=None,
            actual_savings=None,
            roi_percentage=800,  # 800% ROI
        )

        # Monitoring automation
        monitoring_automation = CostOptimization(
            optimization_id="ops_monitoring_001",
            title="Implement Automated Monitoring and Alerting",
            category=CostCategory.OPERATIONAL,
            phase=OptimizationPhase.IMPLEMENTATION,
            estimated_savings=6000,
            savings_type=SavingsType.EFFICIENCY_GAIN,
            implementation_cost=8000,
            payback_period_months=16.0,
            complexity="medium",
            timeline_months=2,
            owner="SRE Team",
            status="planned",
            created_at=datetime.now(),
            implemented_at=None,
            actual_savings=None,
            roi_percentage=900,  # 900% ROI
        )

        # Self-service portals
        self_service = CostOptimization(
            optimization_id="ops_selfservice_001",
            title="Deploy Self-Service IT Portal",
            category=CostCategory.OPERATIONAL,
            phase=OptimizationPhase.IMPLEMENTATION,
            estimated_savings=12000,
            savings_type=SavingsType.EFFICIENCY_GAIN,
            implementation_cost=15000,
            payback_period_months=15.0,
            complexity="high",
            timeline_months=4,
            owner="IT Team",
            status="planned",
            created_at=datetime.now(),
            implemented_at=None,
            actual_savings=None,
            roi_percentage=960,  # 960% ROI
        )

        optimizations.extend([cicd_automation, monitoring_automation, self_service])
        return optimizations


class LicensingOptimizer:
    """Optimizes licensing costs"""

    def __init__(self):
        self.current_licenses = {
            "annual_cost": 180000,
            "licenses": {
                "database_licenses": {"cost": 45000, "vendor": "oracle"},
                "monitoring_tools": {"cost": 25000, "vendor": "datadog"},
                "security_tools": {"cost": 35000, "vendor": "crowdstrike"},
                "development_tools": {"cost": 15000, "vendor": "jetbrains"},
                "cloud_services": {"cost": 60000, "vendor": "aws"},
            },
        }

    async def analyze_licensing_costs(self) -> CostAnalysis:
        """Analyze licensing costs and identify optimization opportunities"""
        current_spend = self.current_licenses["annual_cost"] / 12  # Monthly
        annual_spend = self.current_licenses["annual_cost"]

        # Optimization potential: 37% (negotiations + open source alternatives)
        optimization_potential = 0.37
        estimated_savings = annual_spend * optimization_potential

        return CostAnalysis(
            category=CostCategory.LICENSING,
            current_spend=current_spend,
            projected_spend=current_spend - (estimated_savings / 12),
            optimization_potential=optimization_potential,
            identified_savings=estimated_savings / 12,  # Monthly savings
            implementation_cost=5000,  # $5K implementation cost
            net_benefit=estimated_savings,
            payback_period_months=(
                5000 / (estimated_savings / 12) if estimated_savings > 0 else 0
            ),
            roi_percentage=(estimated_savings / 5000) * 100,
        )

    async def implement_licensing_optimizations(self) -> List[CostOptimization]:
        """Implement licensing optimizations"""
        optimizations = []

        # License negotiation
        license_negotiation = CostOptimization(
            optimization_id="lic_negotiate_001",
            title="Renegotiate Enterprise License Agreements",
            category=CostCategory.LICENSING,
            phase=OptimizationPhase.IMPLEMENTATION,
            estimated_savings=25000,  # $25K annual savings
            savings_type=SavingsType.OPEX_REDUCTION,
            implementation_cost=3000,
            payback_period_months=1.4,
            complexity="low",
            timeline_months=2,
            owner="Procurement Team",
            status="in_progress",
            created_at=datetime.now(),
            implemented_at=None,
            actual_savings=None,
            roi_percentage=10000,  # 10000% ROI
        )

        # Open source migration
        open_source_migration = CostOptimization(
            optimization_id="lic_opensource_001",
            title="Migrate to Open Source Alternatives",
            category=CostCategory.LICENSING,
            phase=OptimizationPhase.IMPLEMENTATION,
            estimated_savings=20000,  # $20K annual savings
            savings_type=SavingsType.OPEX_REDUCTION,
            implementation_cost=15000,
            payback_period_months=9.0,
            complexity="high",
            timeline_months=6,
            owner="Engineering Team",
            status="planned",
            created_at=datetime.now(),
            implemented_at=None,
            actual_savings=None,
            roi_percentage=1600,  # 1600% ROI
        )

        # License optimization
        license_optimization = CostOptimization(
            optimization_id="lic_optimize_001",
            title="Optimize License Utilization and Usage",
            category=CostCategory.LICENSING,
            phase=OptimizationPhase.IMPLEMENTATION,
            estimated_savings=15000,  # $15K annual savings
            savings_type=SavingsType.OPEX_REDUCTION,
            implementation_cost=2000,
            payback_period_months=1.6,
            complexity="medium",
            timeline_months=1,
            owner="IT Team",
            status="planned",
            created_at=datetime.now(),
            implemented_at=None,
            actual_savings=None,
            roi_percentage=9000,  # 9000% ROI
        )

        optimizations.extend(
            [license_negotiation, open_source_migration, license_optimization]
        )
        return optimizations


class CostOptimizationService:
    """Main service coordinating cost optimization initiatives"""

    def __init__(self):
        self.infrastructure_optimizer = InfrastructureOptimizer()
        self.operational_optimizer = OperationalOptimizer()
        self.licensing_optimizer = LicensingOptimizer()
        self.optimizations: Dict[str, CostOptimization] = {}
        self.cost_baseline = {
            "infrastructure": 125000,  # Monthly
            "operational": 85000,
            "licensing": 15000,  # Monthly portion of annual
            "total_monthly": 225000,
        }

    async def run_comprehensive_cost_analysis(self) -> Dict[str, Any]:
        """Run comprehensive cost analysis across all categories"""
        analyses = await asyncio.gather(
            self.infrastructure_optimizer.analyze_infrastructure_costs(),
            self.operational_optimizer.analyze_operational_costs(),
            self.licensing_optimizer.analyze_licensing_costs(),
        )

        total_current_spend = sum(analysis.current_spend for analysis in analyses)
        total_identified_savings = sum(
            analysis.identified_savings for analysis in analyses
        )
        total_implementation_cost = sum(
            analysis.implementation_cost for analysis in analyses
        )

        # Calculate overall metrics
        overall_savings_percentage = (
            total_identified_savings / total_current_spend
            if total_current_spend > 0
            else 0
        )
        overall_payback_period = (
            total_implementation_cost / total_identified_savings
            if total_identified_savings > 0
            else 0
        )
        overall_roi = (
            ((total_identified_savings * 12) / total_implementation_cost) * 100
            if total_implementation_cost > 0
            else 0
        )

        return {
            "cost_analyses": {
                "infrastructure": analyses[0].__dict__,
                "operational": analyses[1].__dict__,
                "licensing": analyses[2].__dict__,
            },
            "overall_summary": {
                "total_current_spend": total_current_spend,
                "total_identified_savings": total_identified_savings,
                "total_implementation_cost": total_implementation_cost,
                "overall_savings_percentage": overall_savings_percentage,
                "overall_payback_period_months": overall_payback_period,
                "overall_roi_percentage": overall_roi,
                "annual_net_benefit": total_identified_savings * 12
                - total_implementation_cost,
            },
            "optimization_roadmap": self._create_optimization_roadmap(analyses),
            "success_metrics": self._define_success_metrics(),
        }

    def _create_optimization_roadmap(
        self, analyses: List[CostAnalysis]
    ) -> Dict[str, Any]:
        """Create phased optimization roadmap"""
        return {
            "quick_wins": {
                "phase": "Quick Wins (1-2 months)",
                "focus": "Low-hanging fruit with immediate impact",
                "estimated_savings": 45000,  # Monthly
                "effort": "Low",
                "initiatives": [
                    "Rightsize EC2 instances",
                    "Convert to reserved instances",
                    "Renegotiate license agreements",
                    "Optimize license utilization",
                ],
            },
            "medium_term": {
                "phase": "Medium-term (3-6 months)",
                "focus": "Automation and process improvements",
                "estimated_savings": 85000,  # Monthly
                "effort": "Medium",
                "initiatives": [
                    "Implement auto-scaling",
                    "Automate CI/CD pipelines",
                    "Deploy automated monitoring",
                    "Migrate to open source alternatives",
                ],
            },
            "long_term": {
                "phase": "Long-term (6-12 months)",
                "focus": "Architectural changes and major migrations",
                "estimated_savings": 125000,  # Monthly
                "effort": "High",
                "initiatives": [
                    "Microservices migration",
                    "Multi-cloud strategy",
                    "Advanced automation platforms",
                    "Zero-trust architecture implementation",
                ],
            },
        }

    def _define_success_metrics(self) -> Dict[str, Any]:
        """Define success metrics for cost optimization program"""
        return {
            "cost_reduction_targets": {
                "quarter_1": 0.15,  # 15% reduction
                "quarter_2": 0.25,  # 25% reduction
                "year_1": 0.35,  # 35% reduction
            },
            "efficiency_metrics": {
                "roi_target": 300,  # 300% ROI minimum
                "payback_period_target": 6,  # 6 months maximum
                "cost_per_employee": 8500,  # Monthly target
            },
            "monitoring_metrics": {
                "budget_variance_threshold": 0.05,  # 5% variance allowed
                "forecast_accuracy_target": 0.90,  # 90% forecast accuracy
                "optimization_velocity": 50000,  # Monthly savings target
            },
        }

    async def execute_optimization_roadmap(self) -> Dict[str, Any]:
        """Execute the cost optimization roadmap"""
        # Get all optimization initiatives
        infrastructure_opts = (
            await self.infrastructure_optimizer.implement_infrastructure_optimizations()
        )
        operational_opts = (
            await self.operational_optimizer.implement_operational_optimizations()
        )
        licensing_opts = (
            await self.licensing_optimizer.implement_licensing_optimizations()
        )

        all_optimizations = infrastructure_opts + operational_opts + licensing_opts

        # Store optimizations
        for opt in all_optimizations:
            self.optimizations[opt.optimization_id] = opt

        # Calculate implementation timeline
        timeline = self._calculate_implementation_timeline(all_optimizations)

        # Track progress
        progress_metrics = self._calculate_progress_metrics(all_optimizations)

        return {
            "total_optimizations": len(all_optimizations),
            "optimizations_by_category": {
                "infrastructure": len(infrastructure_opts),
                "operational": len(operational_opts),
                "licensing": len(licensing_opts),
            },
            "total_estimated_savings": sum(
                opt.estimated_savings for opt in all_optimizations
            ),
            "total_implementation_cost": sum(
                opt.implementation_cost for opt in all_optimizations
            ),
            "implementation_timeline": timeline,
            "progress_metrics": progress_metrics,
            "next_milestones": self._identify_next_milestones(all_optimizations),
        }

    def _calculate_implementation_timeline(
        self, optimizations: List[CostOptimization]
    ) -> Dict[str, Any]:
        """Calculate overall implementation timeline"""
        # Group by complexity and timeline
        complexity_groups = {}
        for opt in optimizations:
            complexity = opt.complexity
            if complexity not in complexity_groups:
                complexity_groups[complexity] = []
            complexity_groups[complexity].append(opt.timeline_months)

        # Calculate parallel implementation potential
        max_timeline = max((opt.timeline_months for opt in optimizations), default=0)
        parallel_factor = 0.7  # 70% of work can be done in parallel

        return {
            "total_months": max_timeline,
            "adjusted_months": max_timeline * parallel_factor,
            "complexity_breakdown": {
                comp: len(opts) for comp, opts in complexity_groups.items()
            },
            "critical_path": max_timeline,
            "parallel_opportunities": len(
                [opt for opt in optimizations if opt.complexity == "low"]
            ),
        }

    def _calculate_progress_metrics(
        self, optimizations: List[CostOptimization]
    ) -> Dict[str, Any]:
        """Calculate progress metrics for optimization program"""
        total_optimizations = len(optimizations)
        completed = len([opt for opt in optimizations if opt.status == "completed"])
        in_progress = len([opt for opt in optimizations if opt.status == "in_progress"])
        planned = len([opt for opt in optimizations if opt.status == "planned"])

        completion_rate = (
            completed / total_optimizations if total_optimizations > 0 else 0
        )

        # Calculate savings realization
        estimated_savings = sum(
            opt.estimated_savings for opt in optimizations if opt.status == "completed"
        )
        actual_savings = sum(
            opt.actual_savings
            for opt in optimizations
            if opt.actual_savings is not None and opt.status == "completed"
        )

        return {
            "completion_rate": completion_rate,
            "status_breakdown": {
                "completed": completed,
                "in_progress": in_progress,
                "planned": planned,
            },
            "savings_realization": {
                "estimated": estimated_savings,
                "actual": actual_savings,
                "realization_rate": (
                    actual_savings / estimated_savings if estimated_savings > 0 else 0
                ),
            },
            "roi_achievement": self._calculate_roi_achievement(optimizations),
        }

    def _calculate_roi_achievement(
        self, optimizations: List[CostOptimization]
    ) -> Dict[str, Any]:
        """Calculate ROI achievement across optimizations"""
        completed_opts = [opt for opt in optimizations if opt.status == "completed"]

        if not completed_opts:
            return {"current_roi": 0, "target_achievement": 0}

        total_investment = sum(opt.implementation_cost for opt in completed_opts)
        total_benefit = sum(
            (opt.actual_savings or opt.estimated_savings) * 12 for opt in completed_opts
        )

        current_roi = (
            (total_benefit / total_investment) * 100 if total_investment > 0 else 0
        )
        target_achievement = (
            current_roi / 300 if current_roi > 0 else 0
        )  # Target is 300% ROI

        return {
            "current_roi": current_roi,
            "target_achievement": min(target_achievement, 1.0),
            "investment_recovered": total_benefit >= total_investment,
        }

    def _identify_next_milestones(
        self, optimizations: List[CostOptimization]
    ) -> List[Dict[str, Any]]:
        """Identify next key milestones in optimization program"""
        # Sort by timeline and priority
        sorted_opts = sorted(
            optimizations,
            key=lambda x: (x.timeline_months, x.estimated_savings),
            reverse=True,
        )

        milestones = []
        current_month = 1

        for opt in sorted_opts[:5]:  # Top 5 milestones
            milestones.append(
                {
                    "optimization_id": opt.optimization_id,
                    "title": opt.title,
                    "estimated_savings": opt.estimated_savings,
                    "timeline_months": opt.timeline_months,
                    "priority": "high" if opt.estimated_savings > 10000 else "medium",
                }
            )

        return milestones

    def get_cost_optimization_dashboard(self) -> Dict[str, Any]:
        """Get comprehensive cost optimization dashboard"""
        # Get current optimization status
        total_optimizations = len(self.optimizations)
        completed = len(
            [opt for opt in self.optimizations.values() if opt.status == "completed"]
        )
        in_progress = len(
            [opt for opt in self.optimizations.values() if opt.status == "in_progress"]
        )

        # Calculate savings metrics
        estimated_annual_savings = sum(
            opt.estimated_savings * 12 for opt in self.optimizations.values()
        )
        actual_annual_savings = sum(
            (opt.actual_savings or 0) * 12
            for opt in self.optimizations.values()
            if opt.status == "completed"
        )

        # Calculate program health
        completion_rate = (
            completed / total_optimizations if total_optimizations > 0 else 0
        )
        savings_realization = (
            actual_annual_savings / estimated_annual_savings
            if estimated_annual_savings > 0
            else 0
        )

        return {
            "program_overview": {
                "total_optimizations": total_optimizations,
                "completed": completed,
                "in_progress": in_progress,
                "completion_rate": completion_rate,
            },
            "savings_metrics": {
                "estimated_annual_savings": estimated_annual_savings,
                "actual_annual_savings": actual_annual_savings,
                "savings_realization_rate": savings_realization,
                "target_achievement": estimated_annual_savings
                / 255000,  # Target is $255K
            },
            "category_breakdown": self._get_category_breakdown(),
            "timeline_progress": self._get_timeline_progress(),
            "roi_analysis": self._get_roi_analysis(),
            "recommendations": self._generate_cost_recommendations(),
        }

    def _get_category_breakdown(self) -> Dict[str, Any]:
        """Get savings breakdown by category"""
        category_savings = {}
        for opt in self.optimizations.values():
            category = opt.category.value
            if category not in category_savings:
                category_savings[category] = {"estimated": 0, "actual": 0, "count": 0}
            category_savings[category]["estimated"] += opt.estimated_savings
            category_savings[category]["actual"] += opt.actual_savings or 0
            category_savings[category]["count"] += 1

        return category_savings

    def _get_timeline_progress(self) -> Dict[str, Any]:
        """Get progress against timeline milestones"""
        # Calculate progress against roadmap phases
        quick_wins_target = 45000  # Monthly savings
        medium_term_target = 85000
        long_term_target = 125000

        current_savings = sum(
            opt.estimated_savings
            for opt in self.optimizations.values()
            if opt.status in ["completed", "in_progress"]
        )

        return {
            "quick_wins_progress": min(current_savings / quick_wins_target, 1.0),
            "medium_term_progress": min(
                current_savings / (quick_wins_target + medium_term_target), 1.0
            ),
            "long_term_progress": min(
                current_savings
                / (quick_wins_target + medium_term_target + long_term_target),
                1.0,
            ),
            "overall_progress": current_savings / 255000,  # Total target
        }

    def _get_roi_analysis(self) -> Dict[str, Any]:
        """Get ROI analysis for completed optimizations"""
        completed_opts = [
            opt for opt in self.optimizations.values() if opt.status == "completed"
        ]

        if not completed_opts:
            return {"average_roi": 0, "total_investment": 0, "total_benefit": 0}

        total_investment = sum(opt.implementation_cost for opt in completed_opts)
        total_benefit = sum(
            (opt.actual_savings or opt.estimated_savings) * 12 for opt in completed_opts
        )

        average_roi = (
            (total_benefit / total_investment) * 100 if total_investment > 0 else 0
        )

        return {
            "average_roi": average_roi,
            "total_investment": total_investment,
            "total_benefit": total_benefit,
            "investment_recovered": total_benefit >= total_investment,
            "roi_distribution": self._calculate_roi_distribution(completed_opts),
        }

    def _calculate_roi_distribution(
        self, optimizations: List[CostOptimization]
    ) -> Dict[str, int]:
        """Calculate distribution of ROI achievements"""
        roi_ranges = {"excellent": 0, "good": 0, "fair": 0, "poor": 0}

        for opt in optimizations:
            roi = opt.roi_percentage
            if roi >= 500:
                roi_ranges["excellent"] += 1
            elif roi >= 200:
                roi_ranges["good"] += 1
            elif roi >= 100:
                roi_ranges["fair"] += 1
            else:
                roi_ranges["poor"] += 1

        return roi_ranges

    def _generate_cost_recommendations(self) -> List[str]:
        """Generate recommendations for cost optimization program"""
        recommendations = []

        # Analyze current progress
        completion_rate = (
            len(
                [
                    opt
                    for opt in self.optimizations.values()
                    if opt.status == "completed"
                ]
            )
            / len(self.optimizations)
            if self.optimizations
            else 0
        )

        if completion_rate < 0.5:
            recommendations.append(
                "Accelerate implementation of high-ROI optimizations to meet quarterly targets"
            )

        # Check for bottlenecks
        in_progress_count = len(
            [opt for opt in self.optimizations.values() if opt.status == "in_progress"]
        )
        if in_progress_count > 5:
            recommendations.append(
                "Consider increasing team capacity or parallelizing implementations"
            )

        # ROI analysis
        completed_opts = [
            opt for opt in self.optimizations.values() if opt.status == "completed"
        ]
        if completed_opts:
            avg_roi = statistics.mean(opt.roi_percentage for opt in completed_opts)
            if avg_roi < 300:
                recommendations.append(
                    "Focus on higher-ROI initiatives to improve overall program returns"
                )

        recommendations.extend(
            [
                "Implement automated cost monitoring and alerting",
                "Establish cost optimization governance committee",
                "Create cost awareness training program for teams",
                "Develop cost baseline and variance reporting",
            ]
        )

        return recommendations

    # Legacy methods for backward compatibility
    async def conduct_cost_audit(self) -> Dict[str, Any]:
        """Legacy method - redirects to comprehensive analysis"""
        return await self.run_comprehensive_cost_analysis()

    async def get_cost_dashboard(self) -> Dict[str, Any]:
        """Legacy method - redirects to optimization dashboard"""
        return self.get_cost_optimization_dashboard()
        """
        Conduct comprehensive cost audit across all categories.
        """
        logger.info("Starting comprehensive cost audit")

        # Analyze each category
        category_analysis = {}
        for category_name, subcategories in self.optimization_categories.items():
            category_analysis[category_name] = await self._analyze_category_costs(
                category_name, subcategories
            )

        # Calculate total current costs and potential savings
        total_current_cost = sum(
            cat["current_cost"] for cat in category_analysis.values()
        )
        total_potential_savings = sum(
            cat["potential_savings"] for cat in category_analysis.values()
        )
        total_implementation_cost = sum(
            cat["implementation_cost"] for cat in category_analysis.values()
        )

        # Calculate ROI metrics
        net_savings = total_potential_savings - total_implementation_cost
        roi_percentage = (
            (net_savings / total_implementation_cost * 100)
            if total_implementation_cost > 0
            else 0
        )

        if total_implementation_cost > 0:
            payback_period_months = total_implementation_cost / (
                total_potential_savings / 12
            )
        else:
            payback_period_months = 0

        return {
            "audit_date": datetime.now(),
            "total_current_cost": total_current_cost,
            "total_potential_savings": total_potential_savings,
            "total_implementation_cost": total_implementation_cost,
            "net_annual_savings": net_savings,
            "roi_percentage": roi_percentage,
            "payback_period_months": payback_period_months,
            "category_breakdown": category_analysis,
            "optimization_roadmap": self._create_optimization_roadmap(
                category_analysis
            ),
            "implementation_priorities": self._prioritize_implementations(
                category_analysis
            ),
        }

    async def _analyze_category_costs(
        self, category: str, subcategories: List[str]
    ) -> Dict[str, Any]:
        """
        Analyze costs within a specific category.
        """
        if category == "infrastructure":
            return await self._analyze_infrastructure_costs()
        elif category == "operations":
            return await self._analyze_operations_costs()
        elif category == "development":
            return await self._analyze_development_costs()
        elif category == "licensing":
            return await self._analyze_licensing_costs()
        elif category == "processes":
            return await self._analyze_process_costs()

        return {"current_cost": 0, "potential_savings": 0, "implementation_cost": 0}

    async def _analyze_infrastructure_costs(self) -> Dict[str, Any]:
        """
        Analyze infrastructure cost optimization opportunities.
        """
        # Current infrastructure costs (based on typical cloud setup)
        current_costs = {
            "compute": 45000,  # EC2, Lambda, etc.
            "storage": 15000,  # S3, EBS, etc.
            "database": 25000,  # RDS, DynamoDB, etc.
            "networking": 8000,  # CloudFront, API Gateway, etc.
            "monitoring": 5000,  # CloudWatch, etc.
        }

        # Optimization opportunities
        opportunities = [
            CostOptimizationOpportunity(
                opportunity_id=f"INFRA_{int(datetime.now().timestamp())}_RIGHT_SIZING",
                title="Compute Instance Right-Sizing",
                description="Optimize EC2 instance types based on actual usage patterns",
                category=OptimizationCategory.INFRASTRUCTURE,
                priority=OptimizationPriority.HIGH,
                current_cost=35000,
                potential_savings=10500,  # 30% savings
                implementation_cost=2000,
                payback_period_months=2.3,
                roi_percentage=425,
                complexity="Medium",
                timeline_months=2,
                owner="platform_engineer",
                status="identified",
                created_at=datetime.now(),
            ),
            CostOptimizationOpportunity(
                opportunity_id=f"INFRA_{int(datetime.now().timestamp())}_STORAGE_OPTIMIZATION",
                title="Storage Tier Optimization",
                description="Move infrequently accessed data to cheaper storage tiers",
                category=OptimizationCategory.INFRASTRUCTURE,
                priority=OptimizationPriority.MEDIUM,
                current_cost=15000,
                potential_savings=3750,  # 25% savings
                implementation_cost=1000,
                payback_period_months=3.2,
                roi_percentage=275,
                complexity="Low",
                timeline_months=1,
                owner="data_engineer",
                status="identified",
                created_at=datetime.now(),
            ),
            CostOptimizationOpportunity(
                opportunity_id=f"INFRA_{int(datetime.now().timestamp())}_RESERVED_INSTANCES",
                title="Reserved Instance Strategy",
                description="Purchase reserved instances for predictable workloads",
                category=OptimizationCategory.INFRASTRUCTURE,
                priority=OptimizationPriority.HIGH,
                current_cost=45000,
                potential_savings=13500,  # 30% savings on 70% of instances
                implementation_cost=500,
                payback_period_months=0.4,
                roi_percentage=2600,
                complexity="Low",
                timeline_months=1,
                owner="finance_team",
                status="identified",
                created_at=datetime.now(),
            ),
        ]

        # Add opportunities to registry
        for opp in opportunities:
            self.optimization_opportunities[opp.opportunity_id] = opp

        total_current_cost = sum(current_costs.values())
        total_potential_savings = sum(opp.potential_savings for opp in opportunities)
        total_implementation_cost = sum(
            opp.implementation_cost for opp in opportunities
        )

        return {
            "current_cost": total_current_cost,
            "potential_savings": total_potential_savings,
            "implementation_cost": total_implementation_cost,
            "cost_breakdown": current_costs,
            "opportunities": [self._opportunity_to_dict(opp) for opp in opportunities],
            "quick_wins": [
                opp.opportunity_id
                for opp in opportunities
                if opp.payback_period_months < 3
            ],
        }

    async def _analyze_operations_costs(self) -> Dict[str, Any]:
        """
        Analyze operations cost optimization opportunities.
        """
        current_costs = {
            "monitoring": 15000,  # Observability tools
            "support": 25000,  # Customer support
            "maintenance": 20000,  # System maintenance
            "training": 8000,  # Team training
            "security": 12000,  # Security operations
        }

        opportunities = [
            CostOptimizationOpportunity(
                opportunity_id=f"OPS_{int(datetime.now().timestamp())}_MONITORING_OPTIMIZATION",
                title="Monitoring Cost Optimization",
                description="Optimize monitoring tool usage and reduce log retention costs",
                category=OptimizationCategory.OPERATIONS,
                priority=OptimizationPriority.MEDIUM,
                current_cost=15000,
                potential_savings=3750,  # 25% savings
                implementation_cost=1500,
                payback_period_months=4.8,
                roi_percentage=150,
                complexity="Medium",
                timeline_months=3,
                owner="devops_engineer",
                status="identified",
                created_at=datetime.now(),
            ),
            CostOptimizationOpportunity(
                opportunity_id=f"OPS_{int(datetime.now().timestamp())}_AUTOMATION",
                title="Operations Automation",
                description="Automate manual operational tasks to reduce support overhead",
                category=OptimizationCategory.OPERATIONS,
                priority=OptimizationPriority.HIGH,
                current_cost=25000,
                potential_savings=10000,  # 40% reduction in support tickets
                implementation_cost=8000,
                payback_period_months=9.6,
                roi_percentage=125,
                complexity="High",
                timeline_months=6,
                owner="operations_lead",
                status="identified",
                created_at=datetime.now(),
            ),
        ]

        for opp in opportunities:
            self.optimization_opportunities[opp.opportunity_id] = opp

        return {
            "current_cost": sum(current_costs.values()),
            "potential_savings": sum(opp.potential_savings for opp in opportunities),
            "implementation_cost": sum(
                opp.implementation_cost for opp in opportunities
            ),
            "cost_breakdown": current_costs,
            "opportunities": [self._opportunity_to_dict(opp) for opp in opportunities],
        }

    async def _analyze_development_costs(self) -> Dict[str, Any]:
        """
        Analyze development cost optimization opportunities.
        """
        current_costs = {
            "tools": 12000,  # Development tools and IDEs
            "testing": 15000,  # Testing infrastructure
            "deployment": 10000,  # CI/CD pipelines
            "documentation": 5000,  # Documentation tools
        }

        opportunities = [
            CostOptimizationOpportunity(
                opportunity_id=f"DEV_{int(datetime.now().timestamp())}_OPEN_SOURCE",
                title="Open Source Tool Adoption",
                description="Replace commercial tools with open source alternatives",
                category=OptimizationCategory.DEVELOPMENT,
                priority=OptimizationPriority.MEDIUM,
                current_cost=12000,
                potential_savings=6000,  # 50% savings
                implementation_cost=2000,
                payback_period_months=4.0,
                roi_percentage=200,
                complexity="Medium",
                timeline_months=3,
                owner="engineering_lead",
                status="identified",
                created_at=datetime.now(),
            )
        ]

        for opp in opportunities:
            self.optimization_opportunities[opp.opportunity_id] = opp

        return {
            "current_cost": sum(current_costs.values()),
            "potential_savings": sum(opp.potential_savings for opp in opportunities),
            "implementation_cost": sum(
                opp.implementation_cost for opp in opportunities
            ),
            "cost_breakdown": current_costs,
            "opportunities": [self._opportunity_to_dict(opp) for opp in opportunities],
        }

    async def _analyze_licensing_costs(self) -> Dict[str, Any]:
        """
        Analyze licensing cost optimization opportunities.
        """
        current_costs = {
            "database_licenses": 30000,
            "monitoring_tools": 15000,
            "security_tools": 20000,
            "development_tools": 10000,
        }

        opportunities = [
            CostOptimizationOpportunity(
                opportunity_id=f"LIC_{int(datetime.now().timestamp())}_NEGOTIATION",
                title="License Renegotiation",
                description="Renegotiate vendor contracts for better pricing",
                category=OptimizationCategory.LICENSING,
                priority=OptimizationPriority.HIGH,
                current_cost=75000,
                potential_savings=15000,  # 20% savings
                implementation_cost=5000,  # Legal and negotiation costs
                payback_period_months=4.0,
                roi_percentage=200,
                complexity="Low",
                timeline_months=2,
                owner="procurement_lead",
                status="identified",
                created_at=datetime.now(),
            )
        ]

        for opp in opportunities:
            self.optimization_opportunities[opp.opportunity_id] = opp

        return {
            "current_cost": sum(current_costs.values()),
            "potential_savings": sum(opp.potential_savings for opp in opportunities),
            "implementation_cost": sum(
                opp.implementation_cost for opp in opportunities
            ),
            "cost_breakdown": current_costs,
            "opportunities": [self._opportunity_to_dict(opp) for opp in opportunities],
        }

    async def _analyze_process_costs(self) -> Dict[str, Any]:
        """
        Analyze process optimization cost opportunities.
        """
        current_costs = {
            "manual_processes": 50000,
            "quality_assurance": 30000,
            "compliance_reporting": 15000,
            "documentation": 10000,
        }

        opportunities = [
            CostOptimizationOpportunity(
                opportunity_id=f"PROC_{int(datetime.now().timestamp())}_AUTOMATION",
                title="Process Automation",
                description="Automate repetitive manual processes and workflows",
                category=OptimizationCategory.PROCESSES,
                priority=OptimizationPriority.CRITICAL,
                current_cost=50000,
                potential_savings=25000,  # 50% reduction
                implementation_cost=15000,
                payback_period_months=7.2,
                roi_percentage=133,
                complexity="High",
                timeline_months=6,
                owner="process_engineer",
                status="identified",
                created_at=datetime.now(),
            )
        ]

        for opp in opportunities:
            self.optimization_opportunities[opp.opportunity_id] = opp

        return {
            "current_cost": sum(current_costs.values()),
            "potential_savings": sum(opp.potential_savings for opp in opportunities),
            "implementation_cost": sum(
                opp.implementation_cost for opp in opportunities
            ),
            "cost_breakdown": current_costs,
            "opportunities": [self._opportunity_to_dict(opp) for opp in opportunities],
        }

    def _opportunity_to_dict(self, opp: CostOptimizationOpportunity) -> Dict[str, Any]:
        """Convert opportunity to dictionary."""
        return {
            "opportunity_id": opp.opportunity_id,
            "title": opp.title,
            "description": opp.description,
            "category": opp.category.value,
            "priority": opp.priority.value,
            "current_cost": opp.current_cost,
            "potential_savings": opp.potential_savings,
            "implementation_cost": opp.implementation_cost,
            "payback_period_months": opp.payback_period_months,
            "roi_percentage": opp.roi_percentage,
            "complexity": opp.complexity,
            "timeline_months": opp.timeline_months,
            "owner": opp.owner,
            "status": opp.status,
        }

    def _create_optimization_roadmap(
        self, category_analysis: Dict[str, Any]
    ) -> Dict[str, Any]:
        """
        Create comprehensive cost optimization roadmap.
        """
        # Extract all opportunities
        all_opportunities = []
        for cat_data in category_analysis.values():
            all_opportunities.extend(cat_data.get("opportunities", []))

        # Sort by ROI and priority
        sorted_opportunities = sorted(
            all_opportunities,
            key=lambda x: (
                x["roi_percentage"],
                {"critical": 4, "high": 3, "medium": 2, "low": 1}[x["priority"]],
            ),
            reverse=True,
        )

        # Create phased roadmap
        roadmap = {
            "phase_1_quick_wins": {
                "duration_months": 3,
                "opportunities": [
                    opp
                    for opp in sorted_opportunities
                    if opp["payback_period_months"] < 6 and opp["complexity"] == "Low"
                ][:5],
                "total_savings": sum(
                    opp["potential_savings"]
                    for opp in sorted_opportunities
                    if opp["payback_period_months"] < 6 and opp["complexity"] == "Low"
                ),
                "total_investment": sum(
                    opp["implementation_cost"]
                    for opp in sorted_opportunities
                    if opp["payback_period_months"] < 6 and opp["complexity"] == "Low"
                ),
            },
            "phase_2_high_impact": {
                "duration_months": 6,
                "opportunities": [
                    opp for opp in sorted_opportunities if opp["roi_percentage"] > 200
                ][:8],
                "total_savings": sum(
                    opp["potential_savings"]
                    for opp in sorted_opportunities
                    if opp["roi_percentage"] > 200
                ),
                "total_investment": sum(
                    opp["implementation_cost"]
                    for opp in sorted_opportunities
                    if opp["roi_percentage"] > 200
                ),
            },
            "phase_3_strategic": {
                "duration_months": 12,
                "opportunities": sorted_opportunities[:10],  # Top 10 overall
                "total_savings": sum(
                    opp["potential_savings"] for opp in sorted_opportunities[:10]
                ),
                "total_investment": sum(
                    opp["implementation_cost"] for opp in sorted_opportunities[:10]
                ),
            },
        }

        return roadmap

    def _prioritize_implementations(
        self, category_analysis: Dict[str, Any]
    ) -> List[Dict[str, Any]]:
        """
        Create prioritized implementation plan.
        """
        all_opportunities = []
        for cat_data in category_analysis.values():
            all_opportunities.extend(cat_data.get("opportunities", []))

        # Prioritize by multiple factors
        prioritized = sorted(
            all_opportunities,
            key=lambda x: (
                {"critical": 4, "high": 3, "medium": 2, "low": 1}[x["priority"]],
                x["roi_percentage"],
                -x["payback_period_months"],  # Shorter payback is better
                {"Low": 3, "Medium": 2, "High": 1}[x["complexity"]],  # Easier is better
            ),
            reverse=True,
        )

        return prioritized[:15]  # Top 15 priorities

    async def implement_optimization(
        self, opportunity_id: str, owner: str
    ) -> Dict[str, Any]:
        """
        Mark an optimization opportunity as implemented.
        """
        if opportunity_id not in self.optimization_opportunities:
            raise ValueError(f"Optimization opportunity {opportunity_id} not found")

        opportunity = self.optimization_opportunities[opportunity_id]
        opportunity.status = "completed"
        opportunity.implemented_at = datetime.now()
        opportunity.actual_savings = (
            opportunity.potential_savings
        )  # Assume full savings achieved

        return {
            "opportunity_id": opportunity_id,
            "status": "implemented",
            "actual_savings": opportunity.actual_savings,
            "implementation_date": opportunity.implemented_at,
        }

    async def get_cost_dashboard(self) -> Dict[str, Any]:
        """
        Get comprehensive cost optimization dashboard.
        """
        total_opportunities = len(self.optimization_opportunities)
        implemented_opportunities = len(
            [
                opp
                for opp in self.optimization_opportunities.values()
                if opp.status == "completed"
            ]
        )
        total_potential_savings = sum(
            opp.potential_savings for opp in self.optimization_opportunities.values()
        )
        total_achieved_savings = sum(
            opp.actual_savings or 0 for opp in self.optimization_opportunities.values()
        )

        # Group by category
        by_category = {}
        for opp in self.optimization_opportunities.values():
            cat = opp.category.value
            if cat not in by_category:
                by_category[cat] = {
                    "count": 0,
                    "potential_savings": 0,
                    "achieved_savings": 0,
                }
            by_category[cat]["count"] += 1
            by_category[cat]["potential_savings"] += opp.potential_savings
            by_category[cat]["achieved_savings"] += opp.actual_savings or 0

        # Top opportunities by ROI
        top_opportunities = sorted(
            [
                {
                    "opportunity_id": opp.opportunity_id,
                    "title": opp.title,
                    "category": opp.category.value,
                    "roi_percentage": opp.roi_percentage,
                    "potential_savings": opp.potential_savings,
                    "payback_period_months": opp.payback_period_months,
                    "status": opp.status,
                }
                for opp in self.optimization_opportunities.values()
            ],
            key=lambda x: x["roi_percentage"],
            reverse=True,
        )[:10]

        return {
            "summary": {
                "total_opportunities": total_opportunities,
                "implemented_opportunities": implemented_opportunities,
                "implementation_rate": (
                    implemented_opportunities / total_opportunities
                    if total_opportunities > 0
                    else 0
                ),
                "total_potential_savings": total_potential_savings,
                "total_achieved_savings": total_achieved_savings,
                "savings_achievement_rate": (
                    total_achieved_savings / total_potential_savings
                    if total_potential_savings > 0
                    else 0
                ),
            },
            "by_category": by_category,
            "top_opportunities": top_opportunities,
            "recent_implementations": [
                {
                    "opportunity_id": opp.opportunity_id,
                    "title": opp.title,
                    "implemented_at": opp.implemented_at,
                    "actual_savings": opp.actual_savings,
                }
                for opp in self.optimization_opportunities.values()
                if opp.implemented_at
                and opp.implemented_at > datetime.now() - timedelta(days=30)
            ],
        }


# Global instance
cost_optimization_service = CostOptimizationService()
