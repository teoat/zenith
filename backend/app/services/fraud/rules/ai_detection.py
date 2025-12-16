# services/fraud/rules/ai_detection.py
from typing import List, Dict, Any
from dataclasses import dataclass
import logging
from datetime import datetime

from app.services.ai_fraud_detector import AIFraudDetector

logger = logging.getLogger(__name__)

@dataclass
class AIDetectionAlert:
    transaction_id: str
    fraud_score: float
    confidence: float
    is_fraud: bool
    explanation: str
    anomaly_score: float

def detect_ai_fraud(transactions: List[Dict[str, Any]], 
                   ai_detector: AIFraudDetector = None,
                   score_threshold: float = 60.0) -> List[AIDetectionAlert]:
    """
    Detect fraud using AI/ML models (Isolation Forest)
    
    Args:
        transactions: List of transactions to analyze
        ai_detector: Trained AI detector instance
        score_threshold: Minimum fraud score to generate alert
        
    Returns:
        List of AI detection alerts
    """
    alerts = []
    
    if not transactions:
        return alerts
    
    # Initialize AI detector if not provided
    if ai_detector is None:
        ai_detector = AIFraudDetector()
    
    # Check if model is trained
    if not ai_detector.is_trained:
        logger.warning("AI model not trained, skipping AI detection")
        return alerts
    
    logger.info(f"Running AI fraud detection on {len(transactions)} transactions")
    
    # Analyze each transaction
    for tx in transactions:
        try:
            # Get historical context (excluding current transaction)
            historical_data = [t for t in transactions if t.get('id') != tx.get('id')]
            
            # Get AI prediction
            prediction = ai_detector.predict_fraud_score(tx, historical_data)
            
            # Generate alert if score exceeds threshold
            if prediction['score'] >= score_threshold:
                alert = AIDetectionAlert(
                    transaction_id=tx.get('id'),
                    fraud_score=prediction['score'],
                    confidence=prediction['confidence'],
                    is_fraud=prediction['is_fraud'],
                    explanation=prediction['explanation'],
                    anomaly_score=prediction.get('anomaly_score', 0.0)
                )
                alerts.append(alert)
                
                logger.debug(f"AI alert generated for transaction {tx.get('id')}: score={prediction['score']}")
            
        except Exception as e:
            logger.error(f"Error analyzing transaction {tx.get('id')} with AI: {str(e)}")
            continue
    
    logger.info(f"AI detection completed: {len(alerts)} alerts generated")
    
    return alerts

def batch_train_ai_model(transactions: List[Dict[str, Any]], 
                       contamination: float = 0.1,
                       model_path: str = None) -> Dict[str, Any]:
    """
    Train AI model on transaction data
    
    Args:
        transactions: Training data
        contamination: Expected proportion of anomalies
        model_path: Path to save model
        
    Returns:
        Training results
    """
    if not transactions:
        raise ValueError("No training data provided")
    
    logger.info(f"Training AI model with {len(transactions)} transactions")
    
    # Initialize AI detector
    ai_detector = AIFraudDetector(model_path=model_path)
    
    # Train model
    result = ai_detector.train_model(transactions, contamination)
    
    logger.info(f"AI model training completed: {result}")
    
    return result

def get_ai_model_status(model_path: str = None) -> Dict[str, Any]:
    """Get status of AI model"""
    ai_detector = AIFraudDetector(model_path=model_path)
    return ai_detector.get_model_info()