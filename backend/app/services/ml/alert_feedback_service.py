# Alert Feedback Loop and Model Retraining Service
import asyncio
import uuid
from dataclasses import asdict, dataclass
from datetime import UTC, datetime, timedelta
from typing import Any, Dict, List, Optional

from core.logging import logger


@dataclass
class AlertFeedback:
    """Alert feedback data structure"""

    id: str
    alert_id: str
    user_id: str
    feedback_type: str  # 'true_positive', 'false_positive', 'needs_investigation'
    confidence_score: float  # User's confidence in their assessment
    comments: Optional[str]
    corrected_labels: Optional[Dict[str, Any]]  # Corrected feature values
    created_at: datetime
    model_version: Optional[str]  # Which model version generated this alert


@dataclass
class ModelVersion:
    """Model version information"""

    id: str
    version: str
    created_at: datetime
    training_data_size: int
    accuracy_score: float
    precision_score: float
    recall_score: float
    f1_score: float
    is_active: bool
    feedback_incorporated: int  # Number of feedback items used


@dataclass
class RetrainingJob:
    """Model retraining job"""

    id: str
    status: str  # 'pending', 'running', 'completed', 'failed'
    started_at: Optional[datetime]
    completed_at: Optional[datetime]
    feedback_count: int
    new_model_version: Optional[str]
    accuracy_improvement: Optional[float]
    error_message: Optional[str]


class FeedbackCollectionService:
    """Collects and manages alert feedback"""

    def __init__(self):
        self.feedback_store = []  # In production, this would be a database
        self.minimum_feedback_threshold = 100  # Minimum feedback items for retraining

    async def submit_feedback(self, feedback: AlertFeedback) -> bool:
        """Submit feedback for an alert"""
        try:
            # Validate feedback
            if feedback.feedback_type not in ["true_positive", "false_positive", "needs_investigation"]:
                raise ValueError(f"Invalid feedback type: {feedback.feedback_type}")

            if not (0 <= feedback.confidence_score <= 1):
                raise ValueError(f"Confidence score must be between 0 and 1: {feedback.confidence_score}")

            # Store feedback
            self.feedback_store.append(feedback)

            logger.info(f"Alert feedback submitted: {feedback.id} for alert {feedback.alert_id}")

            # Check if we should trigger retraining
            await self._check_retraining_trigger()

            return True

        except Exception as e:
            logger.error(f"Feedback submission failed: {e}")
            return False

    async def get_feedback_stats(self) -> Dict[str, Any]:
        """Get feedback statistics"""
        if not self.feedback_store:
            return {"total_feedback": 0, "feedback_types": {}, "average_confidence": 0, "recent_feedback": []}

        # Calculate statistics
        feedback_types = {}
        confidences = []
        recent_feedback = []

        for fb in self.feedback_store[-100:]:  # Last 100 feedback items
            feedback_types[fb.feedback_type] = feedback_types.get(fb.feedback_type, 0) + 1
            confidences.append(fb.confidence_score)

            if len(recent_feedback) < 10:
                recent_feedback.append(
                    {
                        "id": fb.id,
                        "alert_id": fb.alert_id,
                        "type": fb.feedback_type,
                        "confidence": fb.confidence_score,
                        "created_at": fb.created_at.isoformat(),
                    }
                )

        return {
            "total_feedback": len(self.feedback_store),
            "feedback_types": feedback_types,
            "average_confidence": sum(confidences) / len(confidences) if confidences else 0,
            "recent_feedback": recent_feedback,
        }

    async def _check_retraining_trigger(self):
        """Check if we should trigger model retraining"""
        recent_feedback = [fb for fb in self.feedback_store if fb.created_at > datetime.now(UTC) - timedelta(hours=24)]

        if len(recent_feedback) >= 50:  # 50 feedback items in 24 hours
            logger.info("Retraining threshold reached, triggering model retraining")
            # In production, this would trigger the retraining service
            # await retraining_service.start_retraining(recent_feedback)


class ModelRetrainingService:
    """Handles model retraining based on feedback"""

    def __init__(self):
        self.active_jobs = []
        self.model_versions = []
        self.current_model_version = "v1.0.0"

        # Initialize with a base model version
        base_version = ModelVersion(
            id=str(uuid.uuid4()),
            version="v1.0.0",
            created_at=datetime.now(UTC),
            training_data_size=10000,
            accuracy_score=0.85,
            precision_score=0.82,
            recall_score=0.88,
            f1_score=0.85,
            is_active=True,
            feedback_incorporated=0,
        )
        self.model_versions.append(base_version)

    async def start_retraining(self, feedback_data: List[AlertFeedback]) -> str:
        """Start a model retraining job"""
        job_id = str(uuid.uuid4())

        job = RetrainingJob(
            id=job_id,
            status="pending",
            started_at=None,
            completed_at=None,
            feedback_count=len(feedback_data),
            new_model_version=None,
            accuracy_improvement=None,
            error_message=None,
        )

        self.active_jobs.append(job)
        logger.info(f"Model retraining job started: {job_id} with {len(feedback_data)} feedback items")

        # Start retraining in background
        asyncio.create_task(self._run_retraining(job, feedback_data))

        return job_id

    async def _run_retraining(self, job: RetrainingJob, feedback_data: List[AlertFeedback]):
        """Run the actual retraining process"""
        try:
            job.status = "running"
            job.started_at = datetime.now(UTC)

            # Simulate retraining process
            await asyncio.sleep(30)  # Simulate 30 seconds of training

            # Generate new model version
            version_parts = self.current_model_version.split(".")
            new_version = f"v{version_parts[0]}.{int(version_parts[1]) + 1}.0"
            self.current_model_version = new_version

            # Create new model version record
            new_model = ModelVersion(
                id=str(uuid.uuid4()),
                version=new_version,
                created_at=datetime.now(UTC),
                training_data_size=10000 + len(feedback_data),
                accuracy_score=0.87,  # Simulated improvement
                precision_score=0.85,
                recall_score=0.89,
                f1_score=0.87,
                is_active=False,  # Will be activated after validation
                feedback_incorporated=len(feedback_data),
            )

            self.model_versions.append(new_model)

            # Complete job
            job.status = "completed"
            job.completed_at = datetime.now(UTC)
            job.new_model_version = new_version
            job.accuracy_improvement = 0.02  # 2% improvement

            logger.info(f"Model retraining completed: {job.id}, new version {new_version}")

        except Exception as e:
            job.status = "failed"
            job.error_message = str(e)
            logger.error(f"Model retraining failed: {job.id}, error: {e}")

    async def get_retraining_jobs(self) -> List[Dict]:
        """Get all retraining jobs"""
        return [asdict(job) for job in self.active_jobs]

    async def get_model_versions(self) -> List[Dict]:
        """Get all model versions"""
        return [asdict(version) for version in self.model_versions]

    async def activate_model_version(self, version_id: str) -> bool:
        """Activate a specific model version"""
        for version in self.model_versions:
            if version.id == version_id:
                # Deactivate current active version
                for v in self.model_versions:
                    v.is_active = False

                # Activate new version
                version.is_active = True
                logger.info(f"Model version activated: {version.version}")
                return True

        return False


class ABTestingService:
    """A/B testing framework for model versions"""

    def __init__(self):
        self.test_configs = []
        self.test_results = []

    async def create_ab_test(self, model_a: str, model_b: str, traffic_split: float = 0.5) -> str:
        """Create an A/B test between two model versions"""
        test_id = str(uuid.uuid4())

        test_config = {
            "id": test_id,
            "model_a": model_a,
            "model_b": model_b,
            "traffic_split": traffic_split,  # % of traffic to model A
            "created_at": datetime.now(UTC),
            "status": "active",
            "results": {
                "model_a": {"alerts": 0, "true_positives": 0, "false_positives": 0},
                "model_b": {"alerts": 0, "true_positives": 0, "false_positives": 0},
            },
        }

        self.test_configs.append(test_config)
        logger.info(f"A/B test created: {test_id} between {model_a} and {model_b}")
        return test_id

    async def record_test_result(self, test_id: str, model_version: str, alert_id: str, is_true_positive: bool):
        """Record a test result"""
        for test in self.test_configs:
            if test["id"] == test_id and test["status"] == "active":
                results = test["results"][model_version]
                results["alerts"] += 1
                if is_true_positive:
                    results["true_positives"] += 1
                else:
                    results["false_positives"] += 1
                break

    async def get_ab_test_results(self) -> List[Dict]:
        """Get A/B test results"""
        results = []

        for test in self.test_configs:
            if test["status"] == "active":
                model_a_results = test["results"]["model_a"]
                model_b_results = test["results"]["model_b"]

                # Calculate precision for each model
                a_precision = model_a_results["true_positives"] / model_a_results["alerts"] if model_a_results["alerts"] > 0 else 0
                b_precision = model_b_results["true_positives"] / model_b_results["alerts"] if model_b_results["alerts"] > 0 else 0

                results.append(
                    {
                        "test_id": test["id"],
                        "model_a": test["model_a"],
                        "model_b": test["model_b"],
                        "traffic_split": test["traffic_split"],
                        "model_a_precision": a_precision,
                        "model_b_precision": b_precision,
                        "winner": "model_a" if a_precision > b_precision else "model_b" if b_precision > a_precision else "tie",
                        "confidence": abs(a_precision - b_precision),
                    }
                )

        return results


class AlertFeedbackLoop:
    """Main service coordinating feedback collection and model improvement"""

    def __init__(self):
        self.feedback_service = FeedbackCollectionService()
        self.retraining_service = ModelRetrainingService()
        self.ab_testing_service = ABTestingService()

    async def submit_alert_feedback(self, feedback_data: Dict[str, Any]) -> bool:
        """Submit feedback for an alert"""
        feedback = AlertFeedback(
            id=str(uuid.uuid4()),
            alert_id=feedback_data["alert_id"],
            user_id=feedback_data["user_id"],
            feedback_type=feedback_data["feedback_type"],
            confidence_score=feedback_data["confidence_score"],
            comments=feedback_data.get("comments"),
            corrected_labels=feedback_data.get("corrected_labels"),
            created_at=datetime.now(UTC),
            model_version=feedback_data.get("model_version"),
        )

        return await self.feedback_service.submit_feedback(feedback)

    async def get_system_status(self) -> Dict[str, Any]:
        """Get overall feedback loop status"""
        feedback_stats = await self.feedback_service.get_feedback_stats()
        retraining_jobs = await self.retraining_service.get_retraining_jobs()
        ab_results = await self.ab_testing_service.get_ab_test_results()

        active_jobs = [job for job in retraining_jobs if job["status"] in ["pending", "running"]]

        return {
            "feedback_stats": feedback_stats,
            "active_retraining_jobs": len(active_jobs),
            "completed_retraining_jobs": len([job for job in retraining_jobs if job["status"] == "completed"]),
            "ab_tests_active": len([test for test in ab_results if test.get("status") == "active"]),
            "model_versions": len(await self.retraining_service.get_model_versions()),
            "last_retraining": max([job["completed_at"] for job in retraining_jobs if job["completed_at"]] or [None]),
        }


# Global instances
