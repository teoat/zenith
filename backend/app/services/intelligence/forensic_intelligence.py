import logging
import uuid
from typing import Dict, List, Any, Optional
from datetime import datetime
import json

logger = logging.getLogger(__name__)

class TriangulationEngine:
    """
    Probabilistic unmasking of redacted transaction names using multi-source triangulation.
    Ref: VISION_10_10 Section 6
    """
    def __init__(self, db_session):
        self.db = db_session

    async def unmask_redaction(self, transaction_id: str, masked_name: str) -> Dict[str, Any]:
        """
        Attempts to resolve '*' or partial names by looking at:
        1. Similar amounts in other transactions.
        2. Merchant frequency for the specific account.
        3. External metadata linkages.
        """
        logger.info(f"Triangulating redacted merchant for txn {transaction_id}: {masked_name}")
        
        # Simulate probabilistic logic
        # In a real system, this would query the DB for similar patterns
        
        # Mock results
        suggestions = [
            {"candidate": "Amazon Prime *Member", "confidence": 0.92, "source": "Amount-Pattern Match"},
            {"candidate": "AMZN Mktp US", "confidence": 0.85, "source": "Account-History Sync"},
            {"candidate": "Whole Foods Market", "confidence": 0.45, "source": "Geographic Proximity"}
        ]
        
        best_match = suggestions[0] if suggestions else None
        
        return {
            "transaction_id": transaction_id,
            "original_masked": masked_name,
            "resolved_name": best_match["candidate"] if best_match else None,
            "confidence_score": best_match["confidence"] if best_match else 0.0,
            "triangulation_logic": [s["source"] for s in suggestions],
            "timestamp": datetime.now().isoformat()
        }

class LIBRAlgorithm:
    """
    Lowest Intermediate Balance Rule (LIBR) for tracking mixed funds.
    Used to detect illicit float in personal/business accounts.
    Ref: VISION_10_10 Section 6
    """
    def __init__(self, db_session):
        self.db = db_session

    def analyze_mixed_funds(self, account_id: str, start_date: datetime, end_date: datetime) -> Dict[str, Any]:
        """
        Applies LIBR to distinguish between legitimate funds and illicit injections.
        """
        logger.info(f"Applying LIBR Algorithm to account {account_id}")
        
        # LIBR Logic:
        # The lowest balance reached between the time of an illicit deposit 
        # and the time of a withdrawal represents the maximum amount of illicit funds 
        # that can be attributed to that withdrawal.
        
        # Mock data/calculation
        return {
            "account_id": account_id,
            "commingling_ratio": 0.65, # 65% of funds are mixed
            "illicit_float_detected": 15400.00,
            "libr_violation_count": 4,
            "status": "HIGH_RISK",
            "findings": "Illicit deposits followed by immediate low-balance withdrawals suggest structuring."
        }

class MensReaEngine:
    """
    Theory of Intent (Mens Rea) Engine.
    AI classifiers that map evidence to Knowledge, Intent, or Willful Blindness.
    Ref: VISION_10_10 Section 5
    """
    def __init__(self, ai_service=None):
        self.ai_service = ai_service
        self.legal_lexicon = {
            "avoidance": ["bypass", "limit", "threshold", "split", "smurf"],
            "obfuscation": ["hide", "mask", "proxy", "nominee", "shell"],
            "knowledge": ["aware", "understand", "policy", "regulation", "illegal"]
        }

    async def attribute_intent(self, evidence_id: str, content: str) -> Dict[str, Any]:
        """
        Analyzes text/metadata to classify legal intent with detailed justification.
        """
        logger.info(f"Running Advanced Mens Rea analysis on evidence {evidence_id}")
        
        content_lower = content.lower()
        found_markers = []
        for category, keywords in self.legal_lexicon.items():
            matches = [kw for kw in keywords if kw in content_lower]
            if matches:
                found_markers.append({"category": category, "keywords": matches})

        # Calculate intent probabilities based on markers (simulated)
        knowledge_score = 0.85 if "knowledge" in [m["category"] for m in found_markers] else 0.4
        intent_score = 0.72 if "avoidance" in [m["category"] for m in found_markers] else 0.3
        
        intent_map = {
            "KNOWLEDGE": round(knowledge_score, 2),
            "INTENT": round(intent_score, 2),
            "WILLFUL_BLINDNESS": 0.15,
            "NEGLIGENCE": 0.10
        }
        
        primary_intent = "KNOWLEDGE" if knowledge_score >= intent_score else "INTENT"
        
        return {
            "evidence_id": evidence_id,
            "primary_intent": primary_intent,
            "confidence": intent_map[primary_intent],
            "justification": {
                "summary": "Communication patterns show direct awareness of regulatory bypasses.",
                "evidence_markers": found_markers,
                "legal_theory": "The proximity of 'avoidance' keywords to 'knowledge' keywords suggests a calculated attempt to circumvent AML controls."
            },
            "mens_rea_matrix": intent_map,
            "litigation_readiness": "HIGH" if intent_map[primary_intent] > 0.7 else "MODERATE",
            "admissibility_context": "Ref: Rule 403 (Probative value vs. Prejudice)"
        }

class TemporalPairMatcher:
    """
    Detects Mirror/Wash transactions (Equal & Opposite movements).
    Ref: VISION_10_10 Section 6 (Mirror Detection)
    """
    def __init__(self, db_session):
        self.db = db_session

    async def find_mirror_pairs(self, account_id: str, threshold_seconds: int = 3600) -> List[Dict[str, Any]]:
        """
        Identifies pairs of transactions that appear to 'cancel' each other out
        to artificially inflate volume or hide fund source.
        """
        logger.info(f"Running Mirror Detection for account {account_id}")
        
        # Mock logic
        return [
            {
                "pair_id": "pair_001",
                "tx1": {"id": "tx_abc", "amount": 5000.0, "type": "DEBIT", "time": "10:05:01"},
                "tx2": {"id": "tx_def", "amount": 5000.0, "type": "CREDIT", "time": "10:05:45"},
                "score": 0.98,
                "label": "Potential Wash Trade"
            }
        ]

# Global accessibility for services
def get_forensic_intelligence(db):
    return {
        "triangulation": TriangulationEngine(db),
        "libr": LIBRAlgorithm(db),
        "mens_rea": MensReaEngine(),
        "mirror_matcher": TemporalPairMatcher(db)
    }
