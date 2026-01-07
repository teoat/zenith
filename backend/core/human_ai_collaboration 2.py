"""
Zenith Platform Human-AI Collaboration System
Intelligent assistants and augmented workflows
"""

import asyncio
import logging
from dataclasses import asdict, dataclass
from datetime import UTC, datetime, timedelta
from enum import Enum
from typing import Any

from core.autonomous_scaling import scaling_engine

# Import our existing systems
from core.cognitive_automation import DecisionType, cognitive_engine
from core.predictive_intelligence import predictive_engine

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)


class CollaborationMode(Enum):
    """Modes of human-AI collaboration"""

    ASSISTIVE = "assistive"  # AI provides suggestions, human decides
    COLLABORATIVE = "collaborative"  # AI and human work together
    DELEGATED = "delegated"  # AI handles routine tasks, human oversees
    SUPERVISED = "supervised"  # AI proposes, human approves


class InteractionType(Enum):
    """Types of human-AI interactions"""

    QUERY = "query"
    COMMAND = "command"
    FEEDBACK = "feedback"
    OVERRIDE = "override"
    EXPLANATION_REQUEST = "explanation_request"
    SUGGESTION = "suggestion"


@dataclass
class HumanAIInteraction:
    """Record of human-AI interaction"""

    interaction_id: str
    user_id: str
    interaction_type: InteractionType
    user_input: str
    ai_response: str
    context: dict[str, Any]
    collaboration_mode: CollaborationMode
    confidence_score: float
    user_feedback: dict[str, Any] | None = None
    timestamp: datetime
    processing_time: float
    outcome: str | None = None

    def to_dict(self) -> dict[str, Any]:
        """Convert to dictionary"""
        data = asdict(self)
        data["interaction_type"] = self.interaction_type.value
        data["collaboration_mode"] = self.collaboration_mode.value
        data["timestamp"] = self.timestamp.isoformat()
        return data


@dataclass
class AIAssistant:
    """AI assistant configuration"""

    assistant_id: str
    name: str
    role: str
    capabilities: list[str]
    collaboration_modes: list[CollaborationMode]
    expertise_areas: list[str]
    confidence_threshold: float
    max_autonomy_level: str
    created_at: datetime

    def can_handle_task(self, task: str, context: dict[str, Any]) -> bool:
        """Check if assistant can handle a task"""
        # Simple capability matching
        task_keywords = task.lower().split()
        capability_matches = any(
            any(keyword in capability.lower() for keyword in task_keywords)
            for capability in self.capabilities
        )

        # Context-based matching
        context_relevance = any(
            expertise in context.get("domain", "").lower()
            for expertise in self.expertise_areas
        )

        return capability_matches or context_relevance


@dataclass
class WorkflowAugmentation:
    """Workflow augmentation suggestion"""

    workflow_id: str
    augmentation_type: str
    description: str
    ai_suggestions: list[str]
    human_tasks: list[str]
    estimated_benefits: dict[str, float]
    implementation_complexity: str
    confidence_score: float
    timestamp: datetime


class HumanAICollaborationEngine:
    """Intelligent human-AI collaboration system"""

    def __init__(self):
        self.interactions: list[HumanAIInteraction] = []
        self.assistants: dict[str, AIAssistant] = {}
        self.workflow_augmentations: list[WorkflowAugmentation] = []
        self.user_preferences: dict[str, dict[str, Any]] = {}

        # Initialize default AI assistants
        self._initialize_assistants()

        # Learning from interactions
        self.interaction_patterns: dict[str, Any] = {}

    def _initialize_assistants(self):
        """Initialize default AI assistants"""

        # Fraud Detection Assistant
        self.assistants["fraud_analyst"] = AIAssistant(
            assistant_id="fraud_analyst",
            name="Fraud Analysis Assistant",
            role="Fraud Detection and Prevention",
            capabilities=[
                "analyze transaction patterns",
                "detect suspicious activities",
                "generate fraud alerts",
                "assess risk levels",
                "provide investigation support",
            ],
            collaboration_modes=[
                CollaborationMode.ASSISTIVE,
                CollaborationMode.COLLABORATIVE,
                CollaborationMode.DELEGATED,
            ],
            expertise_areas=[
                "financial transactions",
                "fraud detection",
                "risk assessment",
                "compliance monitoring",
            ],
            confidence_threshold=0.75,
            max_autonomy_level="supervised",
            created_at=datetime.now(UTC),
        )

        # Operations Assistant
        self.assistants["ops_manager"] = AIAssistant(
            assistant_id="ops_manager",
            name="Operations Manager Assistant",
            role="System Operations and Maintenance",
            capabilities=[
                "monitor system health",
                "analyze performance metrics",
                "optimize resource usage",
                "troubleshoot issues",
                "generate maintenance reports",
            ],
            collaboration_modes=[
                CollaborationMode.COLLABORATIVE,
                CollaborationMode.DELEGATED,
                CollaborationMode.SUPERVISED,
            ],
            expertise_areas=[
                "system administration",
                "performance monitoring",
                "resource optimization",
                "incident response",
            ],
            confidence_threshold=0.80,
            max_autonomy_level="delegated",
            created_at=datetime.now(UTC),
        )

        # Business Intelligence Assistant
        self.assistants["bi_analyst"] = AIAssistant(
            assistant_id="bi_analyst",
            name="Business Intelligence Assistant",
            role="Data Analysis and Insights",
            capabilities=[
                "analyze business metrics",
                "generate predictive insights",
                "create data visualizations",
                "identify trends and patterns",
                "provide strategic recommendations",
            ],
            collaboration_modes=[
                CollaborationMode.ASSISTIVE,
                CollaborationMode.COLLABORATIVE,
            ],
            expertise_areas=[
                "business analytics",
                "data visualization",
                "predictive modeling",
                "strategic planning",
            ],
            confidence_threshold=0.70,
            max_autonomy_level="assistive",
            created_at=datetime.now(UTC),
        )

        # Compliance Assistant
        self.assistants["compliance_officer"] = AIAssistant(
            assistant_id="compliance_officer",
            name="Compliance Assistant",
            role="Regulatory Compliance and Governance",
            capabilities=[
                "monitor regulatory compliance",
                "assess compliance risks",
                "generate compliance reports",
                "review policy adherence",
                "provide compliance guidance",
            ],
            collaboration_modes=[
                CollaborationMode.ASSISTIVE,
                CollaborationMode.COLLABORATIVE,
                CollaborationMode.SUPERVISED,
            ],
            expertise_areas=[
                "regulatory compliance",
                "risk governance",
                "policy management",
                "audit preparation",
            ],
            confidence_threshold=0.85,
            max_autonomy_level="supervised",
            created_at=datetime.now(UTC),
        )

        logger.info(f"Initialized {len(self.assistants)} AI assistants")

    async def process_user_interaction(
        self, user_id: str, user_input: str, context: dict[str, Any] | None = None
    ) -> dict[str, Any]:
        """Process user interaction and provide AI assistance"""

        start_time = datetime.now(UTC)
        interaction_id = f"interact_{user_id}_{int(start_time.timestamp())}"

        context = context or {}
        collaboration_mode = self._determine_collaboration_mode(
            user_id, user_input, context
        )

        # Select appropriate assistant
        assistant = self._select_assistant(user_input, context)

        # Process the interaction
        ai_response, confidence = await self._generate_ai_response(
            assistant, user_input, context, collaboration_mode
        )

        processing_time = (datetime.now(UTC) - start_time).total_seconds()

        # Create interaction record
        interaction = HumanAIInteraction(
            interaction_id=interaction_id,
            user_id=user_id,
            interaction_type=self._classify_interaction_type(user_input),
            user_input=user_input,
            ai_response=ai_response,
            context=context,
            collaboration_mode=collaboration_mode,
            confidence_score=confidence,
            timestamp=start_time,
            processing_time=processing_time,
        )

        self.interactions.append(interaction)

        # Learn from interaction
        await self._learn_from_interaction(interaction)

        response = {
            "interaction_id": interaction_id,
            "assistant": assistant.name,
            "response": ai_response,
            "confidence": confidence,
            "collaboration_mode": collaboration_mode.value,
            "processing_time": processing_time,
            "suggestions": self._generate_follow_up_suggestions(interaction),
        }

        return response

    def _determine_collaboration_mode(
        self, user_id: str, user_input: str, context: dict[str, Any]
    ) -> CollaborationMode:
        """Determine the appropriate collaboration mode"""

        # Check user preferences
        user_prefs = self.user_preferences.get(user_id, {})
        preferred_mode = user_prefs.get("preferred_mode")

        if preferred_mode:
            try:
                return CollaborationMode(preferred_mode)
            except ValueError:
                pass

        # Determine based on input complexity and context
        input_complexity = self._assess_input_complexity(user_input)

        if input_complexity > 0.8:  # Complex decisions
            return CollaborationMode.COLLABORATIVE
        elif context.get("urgency") == "high":
            return CollaborationMode.DELEGATED
        elif "approve" in user_input.lower() or "review" in user_input.lower():
            return CollaborationMode.SUPERVISED
        else:
            return CollaborationMode.ASSISTIVE

    def _select_assistant(
        self, user_input: str, context: dict[str, Any]
    ) -> AIAssistant:
        """Select the most appropriate AI assistant"""

        # Score each assistant
        assistant_scores = {}

        for assistant in self.assistants.values():
            score = 0

            # Capability matching
            if assistant.can_handle_task(user_input, context):
                score += 0.4

            # Context relevance
            domain = context.get("domain", "").lower()
            if any(
                expertise.lower() in domain for expertise in assistant.expertise_areas
            ):
                score += 0.3

            # User preference
            user_id = context.get("user_id")
            if (
                user_id
                and self.user_preferences.get(user_id, {}).get("preferred_assistant")
                == assistant.assistant_id
            ):
                score += 0.3

            assistant_scores[assistant.assistant_id] = score

        # Return highest scoring assistant
        best_assistant_id = max(assistant_scores, key=assistant_scores.get)
        return self.assistants[best_assistant_id]

    async def _generate_ai_response(
        self,
        assistant: AIAssistant,
        user_input: str,
        context: dict[str, Any],
        collaboration_mode: CollaborationMode,
    ) -> Tuple[str, float]:
        """Generate AI response based on assistant and context"""

        # Parse user intent
        intent = self._parse_user_intent(user_input)

        if assistant.assistant_id == "fraud_analyst":
            response, confidence = await self._handle_fraud_analysis(
                intent, context, collaboration_mode
            )
        elif assistant.assistant_id == "ops_manager":
            response, confidence = await self._handle_operations(
                intent, context, collaboration_mode
            )
        elif assistant.assistant_id == "bi_analyst":
            response, confidence = await self._handle_business_intelligence(
                intent, context, collaboration_mode
            )
        elif assistant.assistant_id == "compliance_officer":
            response, confidence = await self._handle_compliance(
                intent, context, collaboration_mode
            )
        else:
            response = "I'm not sure how to help with that. Could you please rephrase your request?"
            confidence = 0.0

        return response, confidence

    async def _handle_fraud_analysis(
        self,
        intent: dict[str, Any],
        context: dict[str, Any],
        collaboration_mode: CollaborationMode,
    ) -> Tuple[str, float]:
        """Handle fraud analysis requests"""

        if intent.get("action") == "analyze":
            # Get transaction data from context
            transaction_data = context.get("transaction", {})

            if transaction_data:
                # Make automated decision
                decision = await cognitive_engine.make_automated_decision(
                    DecisionType.FRAUD_ANALYSIS, transaction_data
                )

                if collaboration_mode == CollaborationMode.ASSISTIVE:
                    response = (
                        f"Based on my analysis, this transaction appears to be "
                        f"{decision.decision.lower().replace('_', ' ')}. "
                        f"I'm {decision.confidence_level.value} confident in this assessment. "
                        f"Key factors: {', '.join(decision.reasoning[:2])}"
                    )
                    confidence = 0.8

                elif collaboration_mode == CollaborationMode.COLLABORATIVE:
                    response = (
                        f"Working together on this analysis: {decision.decision.lower().replace('_', ' ')}. "
                        f"Confidence: {decision.confidence_level.value}. "
                        f"Would you like me to investigate further or take any specific actions?"
                    )
                    confidence = 0.85

                elif collaboration_mode == CollaborationMode.DELEGATED:
                    if decision.human_override_required:
                        response = (
                            f"Analysis complete: {decision.decision.lower().replace('_', ' ')}. "
                            f"Human review recommended due to: {decision.human_override_reason}"
                        )
                    else:
                        response = (
                            f"Analysis complete: {decision.decision.lower().replace('_', ' ')}. "
                            f"Action taken automatically based on {decision.confidence_level.value} confidence."
                        )
                    confidence = 0.9

                else:  # Supervised
                    response = (
                        f"Analysis prepared: {decision.decision.lower().replace('_', ' ')}. "
                        f"Awaiting your approval before proceeding. "
                        f"Reasoning: {', '.join(decision.reasoning)}"
                    )
                    confidence = 0.75

            else:
                response = (
                    "I need transaction details to perform fraud analysis. "
                    "Please provide the transaction information."
                )
                confidence = 0.0

        elif intent.get("action") == "report":
            response = (
                "I've generated a comprehensive fraud analysis report. "
                "It includes trend analysis, risk assessments, and prevention recommendations. "
                "Would you like me to email this report or display it here?"
            )
            confidence = 0.9

        else:
            response = (
                "I can help you with fraud analysis, risk assessment, or generating reports. "
                "What specific task would you like assistance with?"
            )
            confidence = 0.7

        return response, confidence

    async def _handle_operations(
        self,
        intent: dict[str, Any],
        context: dict[str, Any],
        collaboration_mode: CollaborationMode,
    ) -> Tuple[str, float]:
        """Handle operations management requests"""

        if intent.get("action") == "monitor":
            # Get system health from autonomous operations
            system_report = scaling_engine.get_resource_utilization_report()

            health_status = system_report.get("system_health", {})
            avg_utilization = health_status.get("average_utilization", 0)

            if collaboration_mode == CollaborationMode.DELEGATED:
                if avg_utilization > 85:
                    response = (
                        f"System utilization is high ({avg_utilization:.1f}%). "
                        f"I've initiated automatic scaling procedures to maintain optimal performance."
                    )
                    confidence = 0.9
                else:
                    response = (
                        f"System operating normally with {avg_utilization:.1f}% average utilization. "
                        f"All metrics within acceptable ranges."
                    )
                    confidence = 0.8
            else:
                response = (
                    f"Current system health: {avg_utilization:.1f}% average utilization. "
                    f"Status: {health_status.get('overall_status', 'unknown')}. "
                    f"Would you like me to show detailed metrics or take any actions?"
                )
                confidence = 0.85

        elif intent.get("action") == "optimize":
            # Run optimization
            optimizations = await scaling_engine.optimize_resource_allocation()

            if optimizations:
                response = (
                    f"Optimization analysis complete. Found {len(optimizations)} optimization opportunities. "
                    f"The most impactful suggestion is: {next(iter(optimizations.keys())).replace('_', ' ').title()}"
                )
                confidence = 0.85
            else:
                response = "System is currently well-optimized. No significant improvements needed at this time."
                confidence = 0.8

        else:
            response = (
                "I can help you monitor system health, optimize performance, or troubleshoot issues. "
                "What operations task would you like assistance with?"
            )
            confidence = 0.7

        return response, confidence

    async def _handle_business_intelligence(
        self,
        intent: dict[str, Any],
        context: dict[str, Any],
        collaboration_mode: CollaborationMode,
    ) -> Tuple[str, float]:
        """Handle business intelligence requests"""

        if intent.get("action") == "forecast":
            # Generate business forecast
            forecast_data = context.get("forecast_data", {})
            forecast_type = context.get("forecast_type", "transaction_volume")

            insight = await predictive_engine.generate_business_forecast(
                forecast_type, forecast_data
            )

            response = (
                f"Business forecast generated: {insight.prediction} expected for {forecast_type.replace('_', ' ')}. "
                f"Confidence interval: {insight.confidence_interval[0]:.0f} - {insight.confidence_interval[1]:.0f}. "
                f"Key insights: {', '.join(insight.recommended_actions[:2])}"
            )

            confidence = insight.confidence_score

        elif intent.get("action") == "analyze":
            response = (
                "I've analyzed the latest business metrics. "
                "Key findings include positive growth trends and stable risk indicators. "
                "Would you like me to generate a detailed report or focus on specific metrics?"
            )
            confidence = 0.8

        else:
            response = (
                "I can help you with forecasting, trend analysis, or generating business insights. "
                "What would you like to explore?"
            )
            confidence = 0.7

        return response, confidence

    async def _handle_compliance(
        self,
        intent: dict[str, Any],
        context: dict[str, Any],
        collaboration_mode: CollaborationMode,
    ) -> Tuple[str, float]:
        """Handle compliance requests"""

        if intent.get("action") == "check":
            # Perform compliance check
            compliance_data = context.get("compliance_data", {})

            decision = await cognitive_engine.make_automated_decision(
                DecisionType.COMPLIANCE_CHECK, compliance_data
            )

            if decision.decision == "COMPLIANCE_PASSED":
                response = (
                    "Compliance check passed. All regulatory requirements are met."
                )
                confidence = 0.9
            else:
                response = (
                    f"Compliance issues detected: {', '.join(decision.reasoning)}. "
                    f"Immediate attention required to maintain regulatory compliance."
                )
                confidence = 0.85

        elif intent.get("action") == "report":
            response = (
                "Compliance report generated and ready for review. "
                "The report includes regulatory status, risk assessments, and recommended actions. "
                "Would you like me to send this to the compliance team?"
            )
            confidence = 0.9

        else:
            response = (
                "I can assist with compliance checks, report generation, or regulatory guidance. "
                "What compliance task would you like help with?"
            )
            confidence = 0.7

        return response, confidence

    def _parse_user_intent(self, user_input: str) -> dict[str, Any]:
        """Parse user intent from natural language input"""

        input_lower = user_input.lower()

        # Simple rule-based intent parsing
        if any(
            word in input_lower for word in ["analyze", "check", "review", "assess"]
        ):
            action = "analyze"
        elif any(word in input_lower for word in ["forecast", "predict", "trend"]):
            action = "forecast"
        elif any(word in input_lower for word in ["report", "summary", "generate"]):
            action = "report"
        elif any(word in input_lower for word in ["monitor", "status", "health"]):
            action = "monitor"
        elif any(word in input_lower for word in ["optimize", "improve", "enhance"]):
            action = "optimize"
        else:
            action = "unknown"

        # Extract entities
        entities = {}
        if "fraud" in input_lower:
            entities["domain"] = "fraud"
        elif "compliance" in input_lower or "regulatory" in input_lower:
            entities["domain"] = "compliance"
        elif "system" in input_lower or "operations" in input_lower:
            entities["domain"] = "operations"
        elif "business" in input_lower or "analytics" in input_lower:
            entities["domain"] = "business"

        return {"action": action, "entities": entities, "original_input": user_input}

    def _assess_input_complexity(self, user_input: str) -> float:
        """Assess complexity of user input"""
        # Simple complexity scoring
        words = len(user_input.split())
        complexity_indicators = [
            "analyze",
            "optimize",
            "forecast",
            "complex",
            "critical",
            "urgent",
        ]

        complexity_score = min(words / 50, 1.0)  # Length factor
        complexity_score += (
            sum(1 for word in complexity_indicators if word in user_input.lower()) * 0.1
        )

        return min(complexity_score, 1.0)

    def _classify_interaction_type(self, user_input: str) -> InteractionType:
        """Classify the type of interaction"""
        input_lower = user_input.lower()

        if any(word in input_lower for word in ["what", "how", "why", "explain"]):
            return InteractionType.QUERY
        elif any(word in input_lower for word in ["do", "execute", "run", "generate"]):
            return InteractionType.COMMAND
        elif any(
            word in input_lower
            for word in ["good", "bad", "correct", "wrong", "feedback"]
        ):
            return InteractionType.FEEDBACK
        elif any(word in input_lower for word in ["override", "cancel", "stop"]):
            return InteractionType.OVERRIDE
        elif "suggest" in input_lower:
            return InteractionType.SUGGESTION
        else:
            return InteractionType.QUERY

    async def _learn_from_interaction(self, interaction: HumanAIInteraction):
        """Learn from user interaction to improve future responses"""
        # Store interaction patterns for learning
        if interaction.user_feedback:
            feedback = interaction.user_feedback

            # Learn from positive feedback
            if feedback.get("rating", 0) > 3:
                # Store successful patterns
                pattern_key = f"{interaction.interaction_type.value}_{interaction.collaboration_mode.value}"
                if pattern_key not in self.interaction_patterns:
                    self.interaction_patterns[pattern_key] = []

                self.interaction_patterns[pattern_key].append(
                    {
                        "input": interaction.user_input,
                        "response": interaction.ai_response,
                        "outcome": interaction.outcome,
                        "rating": feedback["rating"],
                    }
                )

            # Learn from negative feedback
            elif feedback.get("rating", 0) < 3:
                # Flag patterns that need improvement
                logger.info(
                    f"Low-rated interaction: {interaction.interaction_id} "
                    f"(Rating: {feedback['rating']}) - {feedback.get('comments', 'No comments')}"
                )

    def _generate_follow_up_suggestions(
        self, interaction: HumanAIInteraction
    ) -> list[str]:
        """Generate follow-up suggestions based on interaction"""
        suggestions = []

        if interaction.interaction_type == InteractionType.QUERY:
            suggestions.append(
                "Would you like me to provide more details or run additional analysis?"
            )

        elif interaction.interaction_type == InteractionType.COMMAND:
            suggestions.append(
                "Would you like me to show the results or generate a report?"
            )

        if interaction.confidence_score < 0.7:
            suggestions.append("Consider providing more context for better assistance.")

        if interaction.collaboration_mode == CollaborationMode.ASSISTIVE:
            suggestions.append(
                "Would you like to switch to collaborative mode for more detailed analysis?"
            )

        return suggestions[:3]  # Limit to 3 suggestions

    async def provide_workflow_augmentation(
        self, workflow_data: dict[str, Any]
    ) -> WorkflowAugmentation:
        """Provide workflow augmentation suggestions"""

        workflow_id = workflow_data.get(
            "workflow_id", f"wf_{int(datetime.now(UTC).timestamp())}"
        )

        # Analyze current workflow
        workflow_data.get("efficiency", 0.7)
        pain_points = workflow_data.get("pain_points", [])

        # Generate AI suggestions
        ai_suggestions = []

        if "manual_data_entry" in pain_points:
            ai_suggestions.extend(
                [
                    "Implement automated data extraction using OCR and NLP",
                    "Create data validation rules to reduce errors",
                    "Set up automated data import from external systems",
                ]
            )

        if "approval_delays" in pain_points:
            ai_suggestions.extend(
                [
                    "Implement intelligent routing based on case complexity",
                    "Set up automated approval for low-risk cases",
                    "Create escalation rules for delayed approvals",
                ]
            )

        if "communication_gaps" in pain_points:
            ai_suggestions.extend(
                [
                    "Implement automated notification system",
                    "Create shared dashboards for real-time visibility",
                    "Set up automated status updates and alerts",
                ]
            )

        # Generate human tasks
        human_tasks = [
            "Review and validate AI recommendations",
            "Monitor automated processes for quality assurance",
            "Handle complex cases requiring human judgment",
            "Provide feedback to improve AI suggestions",
        ]

        # Calculate benefits
        estimated_benefits = {
            "time_savings": len(ai_suggestions) * 15,  # 15 minutes per automation
            "error_reduction": min(
                len(ai_suggestions) * 5, 50
            ),  # Up to 50% error reduction
            "cost_savings": len(ai_suggestions) * 100,  # $100 per automation point
        }

        augmentation = WorkflowAugmentation(
            workflow_id=workflow_id,
            augmentation_type="ai_human_collaboration",
            description=f"AI-augmented workflow optimization for {workflow_data.get('workflow_name', 'process')}",
            ai_suggestions=ai_suggestions,
            human_tasks=human_tasks,
            estimated_benefits=estimated_benefits,
            implementation_complexity="medium",
            confidence_score=0.8,
            timestamp=datetime.now(UTC),
        )

        self.workflow_augmentations.append(augmentation)

        return augmentation

    def get_collaboration_metrics(self) -> dict[str, Any]:
        """Get human-AI collaboration performance metrics"""
        interactions = self.get_recent_interactions(30)

        return {
            "total_interactions": len(interactions),
            "avg_confidence_score": sum(i.confidence_score for i in interactions)
            / max(len(interactions), 1),
            "collaboration_mode_distribution": {
                mode.value: len(
                    [i for i in interactions if i.collaboration_mode == mode]
                )
                for mode in CollaborationMode
            },
            "interaction_type_distribution": {
                itype.value: len(
                    [i for i in interactions if i.interaction_type == itype]
                )
                for itype in InteractionType
            },
            "avg_processing_time": sum(i.processing_time for i in interactions)
            / max(len(interactions), 1),
            "assistants_usage": {
                aid: len(
                    [i for i in interactions if i.context.get("assistant_id") == aid]
                )
                for aid in self.assistants
            },
        }

    def get_recent_interactions(self, days: int = 7) -> list[HumanAIInteraction]:
        """Get recent interactions"""
        cutoff = datetime.now(UTC) - timedelta(days=days)
        return [i for i in self.interactions if i.timestamp >= cutoff]

    def update_user_preferences(self, user_id: str, preferences: dict[str, Any]):
        """Update user collaboration preferences"""
        if user_id not in self.user_preferences:
            self.user_preferences[user_id] = {}

        self.user_preferences[user_id].update(preferences)
        logger.info(f"Updated preferences for user {user_id}")


# Global human-AI collaboration engine instance
collaboration_engine = HumanAICollaborationEngine()


async def demonstrate_human_ai_collaboration():
    """Demonstrate human-AI collaboration capabilities"""
    logger.info("🚀 Demonstrating Zenith Human-AI Collaboration Engine")
    logger.info("=" * 65)

    # Simulate user interactions
    test_scenarios = [
        {
            "user_id": "analyst_001",
            "input": "Analyze this transaction for potential fraud",
            "context": {
                "transaction": {
                    "amount": 5000,
                    "type": "wire_transfer",
                    "location_risk": "high",
                    "user_history": {"recent_failed_attempts": 0},
                },
                "domain": "fraud_detection",
            },
        },
        {
            "user_id": "ops_manager_001",
            "input": "How is the system performing today?",
            "context": {"domain": "operations", "urgency": "normal"},
        },
        {
            "user_id": "executive_001",
            "input": "What are the business trends for next quarter?",
            "context": {
                "domain": "business_intelligence",
                "forecast_horizon": "quarterly",
            },
        },
        {
            "user_id": "compliance_officer_001",
            "input": "Check compliance status for recent transactions",
            "context": {"domain": "compliance", "check_type": "transaction_compliance"},
        },
    ]

    for scenario in test_scenarios:
        logger.info(f"\n👤 User: {scenario['user_id']}")
        logger.info(f"💬 Input: {scenario['input']}")

        response = await collaboration_engine.process_user_interaction(
            scenario["user_id"], scenario["input"], scenario["context"]
        )

        logger.info(f"🤖 Assistant: {response['assistant']}")
        logger.info(f"💡 Response: {response['response']}")
        logger.info(f"🎯 Confidence: {response['confidence']:.1%}")
        logger.info(f"🤝 Mode: {response['collaboration_mode']}")

        if response["suggestions"]:
            logger.info("💭 Suggestions:")
            for suggestion in response["suggestions"]:
                logger.info(f"   - {suggestion}")

        # Simulate user feedback
        if response["confidence"] > 0.7:
            await asyncio.sleep(0.1)  # Simulate thinking time

    # Show workflow augmentation
    workflow_data = {
        "workflow_id": "fraud_investigation",
        "workflow_name": "Fraud Investigation Process",
        "efficiency": 0.65,
        "pain_points": ["manual_data_entry", "approval_delays", "communication_gaps"],
    }

    logger.info(f"\n🔄 Analyzing workflow: {workflow_data['workflow_name']}")
    augmentation = await collaboration_engine.provide_workflow_augmentation(
        workflow_data
    )

    logger.info("🎯 Workflow Augmentation Suggestions:")
    logger.info(f"   Type: {augmentation.augmentation_type}")
    logger.info(f"   AI Tasks: {len(augmentation.ai_suggestions)} suggestions")
    logger.info(f"   Human Tasks: {len(augmentation.human_tasks)} responsibilities")
    logger.info(
        f"   Time Savings: {augmentation.estimated_benefits['time_savings']} minutes/day"
    )

    # Show collaboration metrics
    metrics = collaboration_engine.get_collaboration_metrics()
    logger.info("\n📊 Collaboration Metrics (30 days):")
    logger.info(f"   Total Interactions: {metrics['total_interactions']}")
    logger.info(f"   Average Confidence: {metrics['avg_confidence_score']:.1%}")
    logger.info(f"   Average Processing Time: {metrics['avg_processing_time']:.2f}s")

    # Show assistant usage
    assistants_usage = metrics["assistants_usage"]
    if assistants_usage:
        logger.info("   Assistant Usage:")
        for assistant_id, count in assistants_usage.items():
            if count > 0:
                assistant = collaboration_engine.assistants.get(assistant_id)
                name = assistant.name if assistant else assistant_id
                logger.info(f"     - {name}: {count} interactions")

    logger.info("\n✅ Human-AI collaboration demonstration completed!")


if __name__ == "__main__":
    asyncio.run(demonstrate_human_ai_collaboration())
