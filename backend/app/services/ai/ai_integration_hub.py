"""
Integration Architecture for AI/ML Intelligence Enhancement
Shows how federated learning, real-time adaptation, and multi-modal learning
integrate with existing fraud detection services.
"""

# backend/app/services/ai_integration_hub.py
from typing import Any, Dict, List, Optional

from app.services.ai.ai_service import AIService
from app.services.federated_learning import FederatedLearningCoordinator
from app.services.fraud.fraud_service import FraudDetectionService
from app.services.multimodal_learning_integrator import MultiModalLearningIntegrator
from app.services.realtime_model_adapter import RealTimeModelAdapter


class AIIntegrationHub:
    """Central integration point for all AI/ML enhancements"""

    def __init__(self):
        self.federated_coordinator = FederatedLearningCoordinator()
        self.realtime_adapter = RealTimeModelAdapter()
        self.multimodal_integrator = MultiModalLearningIntegrator()
        self.ai_service = AIService()
        self.fraud_service = FraudDetectionService()

        # Integration mappings
        self.integration_routes = {
            "federated_learning": self._handle_federated_request,
            "realtime_adaptation": self._handle_realtime_request,
            "multimodal_analysis": self._handle_multimodal_request,
            "legacy_ai": self._handle_legacy_request,
        }

    async def process_ai_request(
        self, request_type: str, request_data: Dict[str, Any]
    ) -> Dict[str, Any]:
        """Main entry point for AI requests - routes to appropriate handler"""

        if request_type not in self.integration_routes:
            raise ValueError(f"Unknown AI request type: {request_type}")

        handler = self.integration_routes[request_type]
        return await handler(request_data)

    async def _handle_federated_request(
        self, request_data: Dict[str, Any]
    ) -> Dict[str, Any]:
        """Handle federated learning requests"""
        action = request_data.get("action")

        if action == "join_federation":
            return await self.federated_coordinator.register_participant(
                participant_id=request_data["participant_id"],
                capabilities=request_data["capabilities"],
            )
        elif action == "submit_update":
            return await self.federated_coordinator.submit_model_update(
                participant_id=request_data["participant_id"],
                model_update=request_data["model_update"],
            )
        elif action == "get_global_model":
            return await self.federated_coordinator.get_global_model()

        raise ValueError(f"Unknown federated action: {action}")

    async def _handle_realtime_request(
        self, request_data: Dict[str, Any]
    ) -> Dict[str, Any]:
        """Handle real-time adaptation requests"""
        transaction_data = request_data.get("transaction_data", {})
        context_data = request_data.get("context_data", {})

        # Get current prediction
        current_prediction = await self.ai_service.analyze_transaction(transaction_data)

        # Apply real-time adaptation
        adapted_result = await self.realtime_adapter.monitor_and_adapt(
            transaction_data, current_prediction
        )

        return {
            "original_prediction": current_prediction,
            "adapted_prediction": adapted_result,
            "adaptation_applied": adapted_result.adaptation_performed,
            "model_version": adapted_result.model_version,
        }

    async def _handle_multimodal_request(
        self, request_data: Dict[str, Any]
    ) -> Dict[str, Any]:
        """Handle multi-modal analysis requests"""
        entity_id = request_data.get("entity_id")
        modalities_data = request_data.get("modalities", {})

        # Convert to MultiModalInput format
        multimodal_input = {
            "entity_id": entity_id,
            "modalities": modalities_data,
            "timestamp": request_data.get("timestamp"),
        }

        # Process through multimodal integrator
        result = await self.multimodal_integrator.process_multimodal_input(
            multimodal_input
        )

        return {
            "entity_id": entity_id,
            "final_risk_score": result.final_prediction.get("fraud_probability", 0),
            "modality_contributions": result.modality_contributions,
            "fusion_confidence": result.fusion_confidence,
            "recommendations": self._generate_multimodal_recommendations(result),
        }

    async def _handle_legacy_request(
        self, request_data: Dict[str, Any]
    ) -> Dict[str, Any]:
        """Handle legacy AI service requests for backward compatibility"""
        return await self.ai_service.analyze_transaction(request_data)

    def _generate_multimodal_recommendations(self, result) -> List[str]:
        """Generate recommendations based on multimodal analysis"""
        recommendations = []

        # Analyze modality contributions
        for modality, contribution in result.modality_contributions.items():
            if contribution.get("risk_score", 0) > 0.7:
                if modality == "behavioral_biometrics":
                    recommendations.append("Investigate unusual user behavior patterns")
                elif modality == "social_network":
                    recommendations.append("Review entity's network connections")
                elif modality == "transaction_sequence":
                    recommendations.append("Analyze transaction timing patterns")

        return recommendations


# Global integration hub
ai_integration_hub = AIIntegrationHub()
