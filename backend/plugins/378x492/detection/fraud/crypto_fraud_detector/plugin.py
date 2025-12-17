from core.plugin_system import PluginInterface, PluginMetadata, PluginContext
from typing import Dict, Any, List, Tuple
from dataclasses import dataclass
import logging

logger = logging.getLogger(__name__)

@dataclass
class CryptoFraudDetectorConfig:
    """Type-safe configuration"""
    threshold: float
    min_confirmations: int
    supported_blockchains: List[str]
    mixer_detection_enabled: bool

class CryptoFraudDetectorPlugin(PluginInterface):
    """
    Plugin version of crypto fraud detector
    """
    
    @property
    def metadata(self) -> PluginMetadata:
        return PluginMetadata(
            name="crypto_fraud_detector",
            version="1.0.0",
            namespace="378x492/detection/fraud/crypto_fraud_detector",
            author="378x492 Team",
            description="Detects fraud in cryptocurrency transactions",
            dependencies={},  
            capabilities=["fraud_detection", "crypto_analysis"],
            security_level="official",
            api_version="v1"
        )
    
    async def initialize(self, context: PluginContext) -> bool:
        """Initialize with injected dependencies"""
        self.context = context
        # Handle config dict safely
        config_dict = context.config if context.config else {
            "threshold": 0.75,
            "min_confirmations": 3,
            "supported_blockchains": ["bitcoin", "ethereum"],
            "mixer_detection_enabled": True
        }
        self.config = CryptoFraudDetectorConfig(**config_dict)
        return True
    
    async def execute(self, transaction_data: Dict[str, Any]) -> Dict[str, Any]:
        """
        Main execution method
        """
        # Validate input
        if not transaction_data or 'hash' not in transaction_data:
             return {"is_fraud": False, "score": 0.0, "reason": "Invalid input"}

        # Blockchain-specific analysis (Mocking the logic for Pilot)
        blockchain = transaction_data.get('blockchain', 'bitcoin').lower()
        
        risk_score = 0.0
        details = {}

        if blockchain == 'bitcoin':
            risk_score, details = self._analyze_bitcoin(transaction_data)
        elif blockchain == 'ethereum':
            risk_score, details = self._analyze_ethereum(transaction_data)
        else:
            # Default risk
            risk_score = 0.1
            details = {"note": "Unsupported blockchain"}
        
        result = {
            'is_fraud': risk_score > self.config.threshold,
            'risk_score': risk_score,
            'confidence': 0.9,
            'reason': details.get('reason', 'Normal activity'),
            'details': details
        }
        
        return result
    
    async def cleanup(self) -> None:
        pass
    
    def validate_config(self, config: Dict[str, Any]) -> List[str]:
        errors = []
        if 'threshold' in config and not (0 <= config['threshold'] <= 1):
            errors.append("'threshold' must be between 0 and 1")
        return errors

    def _analyze_bitcoin(self, tx: Dict) -> Tuple[float, Dict]:
        # Mock logic: detection based on amount or specific hash patterns
        amount = float(tx.get('amount', 0))
        risk = 0.0
        reason = "Normal"
        
        if amount > 10.0: # High amount
            risk = 0.8
            reason = "High value transaction"
        
        if self.config.mixer_detection_enabled:
             pass
             
        return risk, {"blockchain": "bitcoin", "reason": reason}

    def _analyze_ethereum(self, tx: Dict) -> Tuple[float, Dict]:
        amount = float(tx.get('amount', 0))
        risk = 0.0
        reason = "Normal"
        
        if amount > 100.0:
            risk = 0.85
            reason = "Whale movement"
            
        return risk, {"blockchain": "ethereum", "reason": reason}
