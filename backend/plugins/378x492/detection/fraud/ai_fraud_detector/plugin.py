from core.plugin_system import PluginInterface, PluginMetadata, PluginContext
from typing import Dict, Any, List
from app.services.ai.ai_fraud_detector import AIFraudDetector
import logging
from dataclasses import dataclass

logger = logging.getLogger(__name__)

@dataclass
class AIFraudDetectorConfig:
    score_threshold: float
    model_path: str
    contamination: float

class AIFraudDetectorPlugin(PluginInterface):
    """
    AI-powered fraud detection plugin using Isolation Forest.
    Wraps existing AIFraudDetector logic.
    """
    
    @property
    def metadata(self) -> PluginMetadata:
        return PluginMetadata(
            name="ai_fraud_detector",
            version="1.0.0",
            namespace="378x492/detection/fraud/ai_fraud_detector",
            author="378x492 Team",
            description="AI-powered fraud detection utilizing Isolation Forest algorithms",
            dependencies={},
            capabilities=["fraud_detection", "ai_analysis"],
            security_level="official",
            api_version="v1"
        )
    
    async def initialize(self, context: PluginContext) -> bool:
        self.context = context
        config_dict = context.config if context.config else {
            "score_threshold": 60.0,
            "model_path": "models/isolation_forest.pkl",
            "contamination": 0.1
        }
        self.config = AIFraudDetectorConfig(**config_dict)
        
        try:
            self.ai_detector = AIFraudDetector(model_path=self.config.model_path)
        except Exception as e:
            logger.error(f"Failed to initialize AI Detector: {e}")
            return False
            
        return True
    
    async def execute(self, inputs: Dict[str, Any]) -> Dict[str, Any]:
        """
        Execute AI detection on a single transaction or a list of transactions.
        
        Expected inputs:
        {
            "transaction": {...},               # Single transaction
            "historical_data": [...]            # Optional history
        }
        OR
        {
            "transactions": [...]               # Batch mode
        }
        """
        transaction = inputs.get("transaction")
        transactions = inputs.get("transactions")
        
        results = []
        
        # Determine mode
        if transaction:
            target_txs = [transaction]
        elif transactions:
            target_txs = transactions
        else:
            return {"error": "No transaction data provided"}

        historical_data = inputs.get("historical_data", [])
        # If batch mode and no explicit history, use the batch itself as context
        if transactions and not historical_data:
             historical_data = transactions

        for tx in target_txs:
            try:
                # Filter current tx from history if present
                tx_history = [t for t in historical_data if t.get("id") != tx.get("id")]
                
                prediction = self.ai_detector.predict_fraud_score(tx, tx_history)
                
                if prediction["score"] >= self.config.score_threshold:
                    results.append({
                        "transaction_id": tx.get("id"),
                        "is_fraud": True,
                        "risk_score": prediction["score"],
                        "confidence": prediction["confidence"],
                        "reason": prediction["explanation"],
                        "details": {
                            "anomaly_score": prediction.get("anomaly_score"),
                            "ai_explanation": prediction["explanation"]
                        }
                    })
                else:
                    # Return non-fraud result as well for complete analysis transparency
                     results.append({
                        "transaction_id": tx.get("id"),
                        "is_fraud": False,
                        "risk_score": prediction["score"],
                        "confidence": prediction["confidence"],
                        "reason": "Score below threshold"
                    })

            except Exception as e:
                logger.error(f"AI Plugin execution error for tx {tx.get('id')}: {e}")
                results.append({"transaction_id": tx.get("id"), "error": str(e)})

        # Return format adaptation
        if transaction:
            return results[0]
        return {"alerts": [r for r in results if r.get("is_fraud")]}

    async def cleanup(self) -> None:
        self.ai_detector = None

    def validate_config(self, config: Dict[str, Any]) -> List[str]:
        errors = []
        if 'score_threshold' in config and not (0 <= config['score_threshold'] <= 100):
            errors.append("score_threshold must be between 0 and 100")
        return errors
