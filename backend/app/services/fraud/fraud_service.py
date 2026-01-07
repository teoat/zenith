# backend/app/services/fraud_service.py
import logging
from datetime import UTC, datetime
from typing import Any

from sqlalchemy.orm import Session

from app.services.fraud.engine import rule_engine
from core.database import Case, Transaction
from core.database import FraudAlert as FraudAlertModel

logger = logging.getLogger(__name__)


class FraudDetectionService:
    """Main service for fraud detection and alert management"""

    def __init__(self, db: Session):
        self.db = db
        self.rule_engine = rule_engine  # Use shared instance

    async def analyze_case(self, case_id: str, transaction_ids: list[str] | None = None) -> dict[str, Any]:
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
            rule_alerts = await self.rule_engine.execute_rules(transaction_dicts)

            saved_alerts = []

            for result in rule_alerts:
                # Convert Engine Alert to Database Model
                # Prepare metadata
                alert_metadata = {
                    "transaction_ids": result.transaction_ids,
                    "confidence": result.confidence,
                    "risk_score": result.risk_score,
                    "recommendations": result.recommendations,
                    "rule_name": result.rule_name,
                    "status": "open",
                }

                alert = FraudAlertModel(
                    case_id=case_id,
                    alert_type="fraud_rule",
                    title=f"Fraud Alert: {result.rule_name}",
                    severity=result.severity.value,
                    description=result.description,
                    alert_metadata=alert_metadata,
                    created_at=datetime.now(UTC),
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
                        # Fallback to metadata if column doesn't exist
                        "rule_name": a.alert_metadata.get("rule_name") if hasattr(a, "alert_metadata") and a.alert_metadata else None,
                        "severity": a.severity,
                        "risk_score": a.alert_metadata.get("risk_score") if hasattr(a, "alert_metadata") and a.alert_metadata else 0.0,
                    }
                    for a in saved_alerts
                ],
            }

        except Exception as e:
            logger.error(f"Error analyzing case {case_id}: {e}")
            self.db.rollback()
            return {"error": str(e), "alerts": []}

    def get_case_alerts(self, case_id: str) -> list[dict[str, Any]]:
        """Get all alerts for a case"""
        try:
            alerts = (
                self.db.query(FraudAlertModel).filter(FraudAlertModel.case_id == case_id).order_by(FraudAlertModel.created_at.desc()).all()
            )

            return [
                {
                    "id": alert.id,
                    "rule_name": alert.rule_name,
                    "severity": alert.severity,
                    "confidence": alert.confidence,
                    "risk_score": alert.risk_score,
                    "status": alert.status,
                    "created_at": (alert.created_at.isoformat() if alert.created_at else None),
                    "details": alert.details or {},
                }
                for alert in alerts
            ]

        except Exception as e:
            logger.error(f"Error getting alerts for case {case_id}: {e}")
            return []

    def update_alert_status(self, alert_id: str, status: str, reviewed_by: str | None = None) -> bool:
        """Update the status of a fraud alert"""
        try:
            alert = self.db.query(FraudAlertModel).filter(FraudAlertModel.id == alert_id).first()
            if not alert:
                return False

            alert.status = status
            if reviewed_by:
                alert.reviewed_by = reviewed_by
                alert.reviewed_at = datetime.now(UTC)

            self.db.commit()
            return True

        except Exception as e:
            logger.error(f"Error updating alert {alert_id}: {e}")
            self.db.rollback()
            return False

    def get_fraud_stats(self) -> dict[str, Any]:
        """Get aggregate fraud statistics"""
        try:
            total_cases = self.db.query(Case).count()
            total_alerts = self.db.query(FraudAlertModel).count()
            high_risk = self.db.query(FraudAlertModel).filter(FraudAlertModel.severity.in_(["high", "critical"])).count()
            resolved = self.db.query(FraudAlertModel).filter(FraudAlertModel.status == "resolved").count()

            return {
                "total_cases_analyzed": total_cases,
                "total_alerts_generated": total_alerts,
                "high_risk_alerts": high_risk,
                "resolved_alerts": resolved,
                "average_response_time": "1.2h",
            }
        except Exception as e:
            logger.error(f"Error getting fraud stats: {e}")
            return {
                "total_cases_analyzed": 0,
                "total_alerts_generated": 0,
                "high_risk_alerts": 0,
                "resolved_alerts": 0,
                "average_response_time": "0s",
            }
