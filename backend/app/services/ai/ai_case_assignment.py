"""
AI-Powered Case Assignment System
Recommends optimal analyst assignments based on expertise, workload, and case characteristics.
"""

import logging
from dataclasses import dataclass
from datetime import datetime, timedelta
from enum import Enum
from typing import Any

logger = logging.getLogger(__name__)


class ExpertiseLevel(Enum):
    NOVICE = 1
    INTERMEDIATE = 2
    ADVANCED = 3
    EXPERT = 4


@dataclass
class AnalystProfile:
    """Analyst expertise and workload profile"""

    analyst_id: str
    name: str
    expertise_areas: dict[str, ExpertiseLevel]
    current_workload: int
    max_capacity: int
    performance_score: float
    specializations: list[str]
    availability_score: float  # 0.0 to 1.0


@dataclass
class CaseCharacteristics:
    """Case attributes for matching"""

    case_id: str
    priority: str
    case_type: str
    complexity_score: float
    required_expertise: list[str]
    estimated_hours: int
    deadline: datetime | None
    tags: list[str]


@dataclass
class AssignmentRecommendation:
    """AI-powered assignment recommendation"""

    analyst_id: str
    confidence_score: float
    reasoning: list[str]
    workload_balance_score: float
    expertise_match_score: float
    estimated_completion_time: datetime
    alternative_analysts: list[tuple[str, float]]


class AICaseAssignmentEngine:
    """AI-powered case assignment recommendation system"""

    def __init__(self):
        self.analyst_profiles: dict[str, AnalystProfile] = {}
        self.assignment_history: list[dict[str, Any]] = []
        self.learning_model = self._initialize_learning_model()

    def _initialize_learning_model(self) -> dict[str, Any]:
        """Initialize simple ML model for assignment optimization"""
        return {
            "expertise_weights": {
                "HIGH": 0.4,
                "MEDIUM": 0.3,
                "LOW": 0.2,
                "CRITICAL": 0.5,
            },
            "workload_penalty": 0.2,
            "deadline_bonus": 0.15,
            "specialization_bonus": 0.25,
        }

    async def recommend_assignment(self, case: CaseCharacteristics) -> AssignmentRecommendation:
        """
        Recommend the best analyst for a case using AI-powered analysis

        Args:
            case: Case characteristics for assignment

        Returns:
            AssignmentRecommendation with optimal analyst and reasoning
        """
        if not self.analyst_profiles:
            await self._load_analyst_profiles()

        # Calculate scores for all available analysts
        analyst_scores = {}
        reasoning_log = {}

        for analyst_id, profile in self.analyst_profiles.items():
            if profile.availability_score < 0.3:  # Skip unavailable analysts
                continue

            expertise_score = self._calculate_expertise_match(profile, case)
            workload_score = self._calculate_workload_balance(profile, case)
            specialization_score = self._calculate_specialization_match(profile, case)
            deadline_score = self._calculate_deadline_compatibility(profile, case)

            # Weighted total score
            total_score = expertise_score * 0.4 + workload_score * 0.25 + specialization_score * 0.2 + deadline_score * 0.15

            analyst_scores[analyst_id] = total_score
            reasoning_log[analyst_id] = {
                "expertise": expertise_score,
                "workload": workload_score,
                "specialization": specialization_score,
                "deadline": deadline_score,
                "total": total_score,
            }

        if not analyst_scores:
            # Fallback to random available analyst
            available_analysts = [aid for aid, profile in self.analyst_profiles.items() if profile.availability_score >= 0.5]
            if available_analysts:
                fallback_id = available_analysts[0]
                return AssignmentRecommendation(
                    analyst_id=fallback_id,
                    confidence_score=0.3,
                    reasoning=["Fallback assignment - limited analyst availability"],
                    workload_balance_score=0.5,
                    expertise_match_score=0.3,
                    estimated_completion_time=self._estimate_completion(case, self.analyst_profiles[fallback_id]),
                    alternative_analysts=[],
                )
            else:
                raise ValueError("No available analysts for case assignment")

        # Get top recommendation
        best_analyst = max(analyst_scores.items(), key=lambda x: x[1])
        best_profile = self.analyst_profiles[best_analyst[0]]

        # Get alternative recommendations
        sorted_analysts = sorted(analyst_scores.items(), key=lambda x: x[1], reverse=True)
        alternatives = [(aid, score) for aid, score in sorted_analysts[1:4]]  # Top 3 alternatives

        # Generate reasoning
        reasoning = self._generate_reasoning(best_profile, case, reasoning_log[best_analyst[0]])

        return AssignmentRecommendation(
            analyst_id=best_analyst[0],
            confidence_score=min(best_analyst[1], 1.0),
            reasoning=reasoning,
            workload_balance_score=reasoning_log[best_analyst[0]]["workload"],
            expertise_match_score=reasoning_log[best_analyst[0]]["expertise"],
            estimated_completion_time=self._estimate_completion(case, best_profile),
            alternative_analysts=alternatives,
        )

    def _calculate_expertise_match(self, profile: AnalystProfile, case: CaseCharacteristics) -> float:
        """Calculate how well analyst expertise matches case requirements"""
        if not case.required_expertise:
            return 0.7  # Neutral score if no specific expertise required

        expertise_scores = []
        for expertise in case.required_expertise:
            level = profile.expertise_areas.get(expertise, ExpertiseLevel.NOVICE)
            # Convert enum to score (1-4) and normalize to 0-1
            score = level.value / 4.0
            expertise_scores.append(score)

        return sum(expertise_scores) / len(expertise_scores) if expertise_scores else 0.5

    def _calculate_workload_balance(self, profile: AnalystProfile, case: CaseCharacteristics) -> float:
        """Calculate workload balance score (higher is better balance)"""
        capacity_used = profile.current_workload / profile.max_capacity
        case_load = case.estimated_hours / profile.max_capacity

        # Penalize if adding this case would exceed capacity
        if capacity_used + case_load > 1.0:
            return max(0.1, 1.0 - (capacity_used + case_load - 1.0))

        # Reward balanced workload
        return 1.0 - capacity_used

    def _calculate_specialization_match(self, profile: AnalystProfile, case: CaseCharacteristics) -> float:
        """Calculate specialization match score"""
        if not profile.specializations:
            return 0.5

        # Check for tag matches
        tag_matches = len(set(profile.specializations) & set(case.tags))
        specialization_ratio = tag_matches / len(profile.specializations)

        return min(1.0, specialization_ratio + 0.3)  # Base score + bonus

    def _calculate_deadline_compatibility(self, profile: AnalystProfile, case: CaseCharacteristics) -> float:
        """Calculate deadline compatibility score"""
        if not case.deadline:
            return 0.7  # Neutral if no deadline

        # Estimate completion time
        self._estimate_completion(case, profile)

        # Calculate time pressure
        time_available = (case.deadline - datetime.now()).total_seconds() / 3600  # hours
        time_needed = case.estimated_hours

        if time_available <= 0:
            return 0.1  # Overdue

        time_ratio = time_needed / time_available

        if time_ratio > 1.5:
            return 0.3  # High pressure
        elif time_ratio > 1.0:
            return 0.6  # Moderate pressure
        else:
            return 0.9  # Comfortable timeline

    def _estimate_completion(self, case: CaseCharacteristics, profile: AnalystProfile) -> datetime:
        """Estimate case completion time based on analyst profile"""
        # Base time plus complexity factor
        base_hours = case.estimated_hours
        complexity_factor = case.complexity_score

        # Adjust for analyst performance
        performance_factor = profile.performance_score

        # Adjust for current workload
        workload_factor = 1.0 + (profile.current_workload / profile.max_capacity)

        estimated_hours = base_hours * complexity_factor * workload_factor / performance_factor

        return datetime.now() + timedelta(hours=estimated_hours)

    def _generate_reasoning(
        self,
        profile: AnalystProfile,
        case: CaseCharacteristics,
        scores: dict[str, float],
    ) -> list[str]:
        """Generate human-readable reasoning for assignment"""
        reasoning = []

        # Expertise reasoning
        if scores["expertise"] > 0.8:
            reasoning.append(f"Excellent expertise match in {case.required_expertise}")
        elif scores["expertise"] > 0.6:
            reasoning.append(f"Good expertise match for {case.case_type} cases")
        else:
            reasoning.append("General expertise suitable for case complexity")

        # Workload reasoning
        if scores["workload"] > 0.7:
            reasoning.append("Optimal workload balance")
        elif scores["workload"] > 0.4:
            reasoning.append("Acceptable workload balance")
        else:
            reasoning.append("High workload - may impact timeline")

        # Specialization reasoning
        if scores["specialization"] > 0.7:
            matching_specs = set(profile.specializations) & set(case.tags)
            reasoning.append(f"Specializes in: {', '.join(matching_specs)}")

        # Deadline reasoning
        if case.deadline:
            if scores["deadline"] > 0.7:
                reasoning.append("Comfortable timeline for completion")
            elif scores["deadline"] > 0.4:
                reasoning.append("Manageable timeline with focus")
            else:
                reasoning.append("Tight deadline - requires priority attention")

        return reasoning

    async def _load_analyst_profiles(self):
        """Load analyst profiles from database/service"""
        # This would typically load from a database or service
        # For now, create sample profiles
        self.analyst_profiles = {
            "analyst_001": AnalystProfile(
                analyst_id="analyst_001",
                name="Sarah Johnson",
                expertise_areas={
                    "fraud_investigation": ExpertiseLevel.EXPERT,
                    "money_laundering": ExpertiseLevel.ADVANCED,
                    "cyber_crime": ExpertiseLevel.INTERMEDIATE,
                },
                current_workload=3,
                max_capacity=5,
                performance_score=0.95,
                specializations=["bank_fraud", "wire_transfers"],
                availability_score=0.9,
            ),
            "analyst_002": AnalystProfile(
                analyst_id="analyst_002",
                name="Mike Chen",
                expertise_areas={
                    "fraud_investigation": ExpertiseLevel.ADVANCED,
                    "money_laundering": ExpertiseLevel.EXPERT,
                    "cyber_crime": ExpertiseLevel.ADVANCED,
                },
                current_workload=2,
                max_capacity=4,
                performance_score=0.88,
                specializations=["aml_compliance", "international_transfers"],
                availability_score=0.8,
            ),
            "analyst_003": AnalystProfile(
                analyst_id="analyst_003",
                name="Emily Rodriguez",
                expertise_areas={
                    "fraud_investigation": ExpertiseLevel.INTERMEDIATE,
                    "money_laundering": ExpertiseLevel.INTERMEDIATE,
                    "cyber_crime": ExpertiseLevel.EXPERT,
                },
                current_workload=4,
                max_capacity=6,
                performance_score=0.92,
                specializations=["cyber_fraud", "digital_forensics"],
                availability_score=0.7,
            ),
        }

    def update_analyst_workload(self, analyst_id: str, new_workload: int):
        """Update analyst workload after assignment"""
        if analyst_id in self.analyst_profiles:
            self.analyst_profiles[analyst_id].current_workload = new_workload

    def record_assignment(self, case_id: str, analyst_id: str, recommendation: AssignmentRecommendation):
        """Record assignment for learning"""
        self.assignment_history.append(
            {
                "case_id": case_id,
                "analyst_id": analyst_id,
                "confidence": recommendation.confidence_score,
                "timestamp": datetime.now(),
                "scores": {
                    "workload_balance": recommendation.workload_balance_score,
                    "expertise_match": recommendation.expertise_match_score,
                },
            }
        )


# Global instance
ai_case_assignment = AICaseAssignmentEngine()
