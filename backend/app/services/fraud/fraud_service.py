# backend/app/services/fraud_service.py
import logging
from datetime import datetime, timezone
from typing import Any, Dict, List, Optional

from sqlalchemy.orm import Session

from app.services.fraud.engine import RuleEngine
from core.database import Case
from core.database import FraudAlert as FraudAlertModel
from core.database import Transaction

logger = logging.getLogger(__name__)


class FraudDetectionService:
    """Main service for fraud detection and alert management"""

    def __init__(self, db: Session):
        self.db = db
        self.rule_engine = RuleEngine()  # Real engine, no mocks

    def analyze_case(
        self, case_id: str, transaction_ids: Optional[List[str]] = None
    ) -> Dict[str, Any]:
        """Analyze a case for fraud patterns"""
        try:
            # Get case and related transactions
            case = self.db.query(Case).filter(Case.id == case_id).first()
            if not case:
                return {"error": "Case not found", "alerts": []}

            # Get transactions for this case
            query = self.db.query(Transaction).filter(Transaction.case_id == case_id)
            if transaction_ids:
                query = query.filter(Transaction.id.in_(transaction_ids))

            transactions = query.all()
            
            # Convert SQLAlchemy models to dicts for the engine
            transaction_dicts = []
            for t in transactions:
                t_dict = {
                    "id": t.id,
                    "amount": float(t.amount) if t.amount else 0.0,
                    "timestamp": t.timestamp.isoformat() if t.timestamp else "",
                    "description": t.description,
                    "merchant": t.merchant,
                    # Add other fields as needed by rules
                }
                transaction_dicts.append(t_dict)

            # Execute fraud rules
            logger.info(f"Running fraud rules on {len(transactions)} transactions for case {case_id}")
            rule_alerts = self.rule_engine.execute_rules(transaction_dicts)
            
            saved_alerts = []

            for result in rule_alerts:
                # Convert Engine Alert to Database Model
                alert = FraudAlertModel(
                    case_id=case_id,
                    transaction_id=result.transaction_ids[0] if result.transaction_ids else None,
                    rule_name=result.rule_name,
                    severity=result.severity.value,
                    confidence=result.confidence,
                    risk_score=result.risk_score,
                    details={"description": result.description, "recommendations": result.recommendations},
                    status="open",
                    created_at=datetime.now(timezone.utc)
                )
                self.db.add(alert)
                saved_alerts.append(alert)
            
            self.db.commit()
            
            # Refresh to get IDs
            for a in saved_alerts:
                self.db.refresh(a)

            return {
                "case_id": case_id,
                "transactions_analyzed": len(transactions),
                "alerts_generated": len(saved_alerts),
                "alerts": [
                    {
                        "id": a.id,
                        "rule_name": a.rule_name,
                        "severity": a.severity,
                        "risk_score": a.risk_score
                    } for a in saved_alerts
                ],
            }

        except Exception as e:
            logger.error(f"Error analyzing case {case_id}: {e}")
            self.db.rollback()
            return {"error": str(e), "alerts": []}

    def get_case_alerts(self, case_id: str) -> List[Dict[str, Any]]:
        """Get all alerts for a case"""
        try:
            alerts = (
                self.db.query(FraudAlertModel)
                .filter(FraudAlertModel.case_id == case_id)
                .order_by(FraudAlertModel.created_at.desc())
                .all()
            )

            return [
                {
                    "id": alert.id,
                    "rule_name": alert.rule_name,
                    "severity": alert.severity,
                    "confidence": alert.confidence,
                    "risk_score": alert.risk_score,
                    "status": alert.status,
                    "created_at": (
                        alert.created_at.isoformat() if alert.created_at else None
                    ),
                    "details": alert.details or {},
                }
                for alert in alerts
            ]

        except Exception as e:
            logger.error(f"Error getting alerts for case {case_id}: {e}")
            return []

    def update_alert_status(
        self, alert_id: str, status: str, reviewed_by: Optional[str] = None
    ) -> bool:
        """Update the status of a fraud alert"""
        try:
            alert = (
                self.db.query(FraudAlertModel)
                .filter(FraudAlertModel.id == alert_id)
                .first()
            )
            if not alert:
                return False

            alert.status = status
            if reviewed_by:
                alert.reviewed_by = reviewed_by
                alert.reviewed_at = datetime.now(timezone.utc)

            self.db.commit()
            return True

        except Exception as e:
            logger.error(f"Error updating alert {alert_id}: {e}")
            self.db.rollback()
            return False