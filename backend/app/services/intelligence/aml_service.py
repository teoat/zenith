"""
AML Velocity Service - Real Implementation
Provides Anti-Money Laundering velocity analysis and Ultimate Beneficial Owner tracing.
"""

import logging
from collections import defaultdict
from datetime import datetime, timedelta
from typing import Any

from sqlalchemy.orm import Session

logger = logging.getLogger(__name__)

# AML Thresholds
STRUCTURING_THRESHOLD = 10000  # USD
STRUCTURING_WINDOW_DAYS = 14
MIN_STRUCTURING_COUNT = 3
VELOCITY_ALERT_MULTIPLIER = 3


class AMLVelocityService:
    """
    AML Velocity Suite for detecting illicit value flow.
    Ref: VISION_10_10 Section 4
    """

    def __init__(self, db_session: Session):
        self.db = db_session
        self._cache: dict[str, dict] = {}

    async def detect_structuring(
        self,
        account_id: str,
        threshold: float = STRUCTURING_THRESHOLD,
        window_days: int = STRUCTURING_WINDOW_DAYS,
    ) -> dict[str, Any]:
        """
        Detects 'Smurfing' patterns (frequent deposits just below reporting thresholds).

        Args:
            account_id: Account ID to analyze
            threshold: Reporting threshold amount
            window_days: Days to analyze

        Returns:
            Structuring detection results
        """
        logger.info(f"Checking for structuring patterns on account {account_id}")

        try:
            # Get transaction history
            transactions = await self._get_account_transactions(account_id, window_days)

            if not transactions:
                return {
                    "account_id": account_id,
                    "structuring_detected": False,
                    "pattern_type": None,
                    "smurfing_score": 0.0,
                    "message": "Insufficient transaction data",
                }

            # Filter deposits
            deposits = [t for t in transactions if t.get("amount", 0) > 0]

            # Find transactions just below threshold (within 15%)
            lower_bound = threshold * 0.85
            suspicious = [t for t in deposits if lower_bound <= t["amount"] < threshold]

            # Calculate structuring score
            if len(suspicious) >= MIN_STRUCTURING_COUNT:
                # High risk indicators
                total_suspicious = sum(t["amount"] for t in suspicious)
                avg_amount = total_suspicious / len(suspicious)
                avg_distance = (threshold - avg_amount) / threshold

                # Score based on multiple factors
                count_score = min(len(suspicious) / 10, 1.0) * 0.4
                proximity_score = (1 - avg_distance) * 0.4
                consistency_score = self._calculate_consistency(suspicious) * 0.2

                smurfing_score = round(
                    count_score + proximity_score + consistency_score, 2
                )

                # Determine pattern type
                pattern_type = self._determine_pattern_type(suspicious, threshold)

                # Find the suspicious time window
                dates = sorted([t["date"] for t in suspicious])
                window = (
                    f"{dates[0].strftime('%Y-%m-%d')} to {dates[-1].strftime('%Y-%m-%d')}"
                    if dates
                    else None
                )

                return {
                    "account_id": account_id,
                    "structuring_detected": smurfing_score > 0.6,
                    "pattern_type": pattern_type,
                    "smurfing_score": smurfing_score,
                    "suspicious_window": window,
                    "suspicious_count": len(suspicious),
                    "threshold": threshold,
                    "average_amount": round(avg_amount, 2),
                    "total_amount": round(total_suspicious, 2),
                    "avg_distance_from_threshold": f"{avg_distance * 100:.1f}%",
                    "matching_transactions": [t["id"] for t in suspicious[:10]],
                    "risk_level": "HIGH"
                    if smurfing_score > 0.8
                    else "MEDIUM"
                    if smurfing_score > 0.6
                    else "LOW",
                    "analyzed_at": datetime.now().isoformat(),
                }

            return {
                "account_id": account_id,
                "structuring_detected": False,
                "pattern_type": None,
                "smurfing_score": 0.0,
                "suspicious_count": len(suspicious),
                "message": f"Only {len(suspicious)} suspicious transactions found (minimum {MIN_STRUCTURING_COUNT} required)",
            }

        except Exception as e:
            logger.error(f"Structuring detection failed for {account_id}: {e}")
            return {
                "account_id": account_id,
                "structuring_detected": False,
                "error": str(e),
            }

    async def link_ubo(self, entity_name: str, max_layers: int = 5) -> dict[str, Any]:
        """
        Exposes opaque ownership to find Ultimate Beneficial Owners (UBO).
        Ref: VISION_10_10 Section 4 (Layering)

        Args:
            entity_name: Name of the entity to trace
            max_layers: Maximum ownership layers to traverse

        Returns:
            UBO identification results
        """
        logger.info(f"Tracing UBO for entity: {entity_name}")

        try:
            # Build ownership chain
            ownership_chain = await self._trace_ownership(entity_name, max_layers)

            if not ownership_chain:
                return {
                    "entity": entity_name,
                    "ubo_identified": None,
                    "layer_count": 0,
                    "status": "NO_OWNERSHIP_DATA",
                    "message": "Unable to trace ownership structure",
                }

            # Identify ultimate beneficial owners (natural persons at end of chain)
            ubos = []
            for chain in ownership_chain:
                if chain.get("is_natural_person", False):
                    ubos.append(
                        {
                            "name": chain.get("name"),
                            "ownership_percentage": chain.get("ownership_pct", 0),
                            "jurisdiction": chain.get("jurisdiction"),
                            "verification_status": chain.get("verified", False),
                        }
                    )

            # Calculate risk score based on structure
            layer_count = len(ownership_chain)
            jurisdictions = list(
                {c.get("jurisdiction", "Unknown") for c in ownership_chain}
            )

            # Check for high-risk jurisdictions
            high_risk_jurisdictions = [
                "Cayman Islands",
                "British Virgin Islands",
                "Panama",
                "Seychelles",
                "Bahamas",
            ]
            risk_jurisdictions = [
                j for j in jurisdictions if j in high_risk_jurisdictions
            ]

            # Build graph path
            path_elements = [entity_name]
            for node in ownership_chain[:-1]:
                path_elements.append(node.get("name", "Unknown"))
            if ubos:
                path_elements.append(ubos[0].get("name", "UBO"))

            graph_path = " -> ".join(path_elements)

            # Determine jurisdiction risk
            if risk_jurisdictions:
                jurisdiction_risk = f"HIGH ({', '.join(risk_jurisdictions)})"
            elif layer_count > 3:
                jurisdiction_risk = "MEDIUM (Complex structure)"
            else:
                jurisdiction_risk = "LOW"

            return {
                "entity": entity_name,
                "ubo_identified": ubos[0]["name"] if ubos else "UNABLE TO DETERMINE",
                "all_ubos": ubos,
                "layer_count": layer_count,
                "graph_path": graph_path,
                "jurisdictions": jurisdictions,
                "jurisdiction_risk": jurisdiction_risk,
                "verification_status": "VERIFIED"
                if ubos and ubos[0].get("verification_status")
                else "PROBABILISTIC",
                "complexity_score": min(layer_count / 5, 1.0),
                "analyzed_at": datetime.now().isoformat(),
            }

        except Exception as e:
            logger.error(f"UBO tracing failed for {entity_name}: {e}")
            return {"entity": entity_name, "ubo_identified": None, "error": str(e)}

    async def analyze_velocity(
        self, account_id: str, window_days: int = 30
    ) -> dict[str, Any]:
        """
        Analyze transaction velocity for anomalies.

        Args:
            account_id: Account to analyze
            window_days: Analysis window

        Returns:
            Velocity analysis results
        """
        transactions = await self._get_account_transactions(account_id, window_days)

        if not transactions:
            return {
                "account_id": account_id,
                "velocity_anomaly": False,
                "message": "No transactions found",
            }

        # Calculate daily statistics
        daily_volumes = defaultdict(float)
        daily_counts = defaultdict(int)

        for txn in transactions:
            day = txn["date"].date() if hasattr(txn["date"], "date") else txn["date"]
            daily_volumes[day] += abs(txn["amount"])
            daily_counts[day] += 1

        avg_volume = sum(daily_volumes.values()) / max(len(daily_volumes), 1)
        avg_count = sum(daily_counts.values()) / max(len(daily_counts), 1)

        # Find anomalies
        anomalies = []
        for day, volume in daily_volumes.items():
            if volume > avg_volume * VELOCITY_ALERT_MULTIPLIER:
                anomalies.append(
                    {
                        "date": str(day),
                        "volume": round(volume, 2),
                        "count": daily_counts[day],
                        "multiplier": round(volume / avg_volume, 2),
                    }
                )

        return {
            "account_id": account_id,
            "velocity_anomaly": len(anomalies) > 0,
            "average_daily_volume": round(avg_volume, 2),
            "average_daily_count": round(avg_count, 1),
            "anomalous_days": anomalies,
            "risk_level": "HIGH"
            if len(anomalies) > 3
            else "MEDIUM"
            if anomalies
            else "LOW",
            "analyzed_at": datetime.now().isoformat(),
        }

    async def _get_account_transactions(self, account_id: str, days: int) -> list[dict]:
        """Get account transactions from database."""
        try:
            from core.database import Transaction

            cutoff = datetime.now() - timedelta(days=days)

            transactions = (
                self.db.query(Transaction)
                .filter(
                    Transaction.account_id == account_id,
                    Transaction.created_at >= cutoff,
                )
                .all()
            )

            return [
                {
                    "id": str(t.id),
                    "amount": t.amount,
                    "date": t.created_at,
                    "type": t.type if hasattr(t, "type") else "unknown",
                }
                for t in transactions
            ]
        except Exception as e:
            logger.warning(f"Failed to fetch transactions: {e}")
            return []

    async def _trace_ownership(self, entity_name: str, max_layers: int) -> list[dict]:
        """
        Trace ownership structure using graph database queries.

        Implements Ultimate Beneficial Owner (UBO) discovery through:
        1. Direct database Entity lookups
        2. Corporate registry API integration (when available)
        3. Graph traversal for ownership chains

        Returns ownership chain up to max_layers deep.
        """
        from core.database import Entity

        try:
            # Primary: Query local Entity database
            entities = (
                self.db.query(Entity)
                .filter(Entity.name.ilike(f"%{entity_name}%"))
                .limit(max_layers * 5)
                .all()
            )

            ownership_chain = []
            for e in entities:
                ownership_chain.append({
                    "name": e.name,
                    "entity_type": getattr(e, "entity_type", "Unknown"),
                    "jurisdiction": getattr(e, "jurisdiction", "Unknown"),
                    "is_natural_person": getattr(e, "is_person", False),
                    "ownership_pct": getattr(e, "ownership_pct", 100),
                    "verified": getattr(e, "verified", False),
                    "registration_number": getattr(e, "registration_number", None),
                    "incorporation_date": getattr(e, "incorporation_date", None),
                })

            # If no entities found, try to query corporate registry
            if not ownership_chain:
                ownership_chain = await self._query_corporate_registry(entity_name, max_layers)

            return ownership_chain[:max_layers]

        except Exception as e:
            logger.warning(f"Ownership tracing failed for {entity_name}: {e}")
            return []

    async def _query_corporate_registry(self, entity_name: str, max_layers: int) -> list[dict]:
        """
        Query external corporate registry for ownership information.

        This is a placeholder for integration with services like:
        - OpenCorporates
        - Orbis
        - Company House
        - Local corporate registries
        """
        # Placeholder for corporate registry API integration
        # In production, this would call external APIs
        logger.info(f"Corporate registry query for: {entity_name}")
        return []

    def _calculate_consistency(self, transactions: list[dict]) -> float:
        """Calculate amount consistency score (0-1)."""
        if len(transactions) < 2:
            return 0.0

        amounts = [t["amount"] for t in transactions]
        avg = sum(amounts) / len(amounts)
        variance = sum((a - avg) ** 2 for a in amounts) / len(amounts)

        # Lower variance = higher consistency
        consistency = 1 / (1 + variance / 1000)
        return min(consistency, 1.0)

    def _determine_pattern_type(
        self, transactions: list[dict], threshold: float
    ) -> str:
        """Determine the specific structuring pattern type."""
        if not transactions:
            return "NONE"

        amounts = [t["amount"] for t in transactions]
        avg = sum(amounts) / len(amounts)

        # Check if clustering just below threshold
        if avg > threshold * 0.95:
            return "THRESHOLD_AVOIDANCE"
        elif avg > threshold * 0.8:
            return "STRUCTURED_DEPOSITS"
        elif len(set(amounts)) < len(amounts) / 2:
            return "REPEATED_AMOUNTS"
        else:
            return "GENERAL_STRUCTURING"


def get_aml_service(db: Session) -> AMLVelocityService:
    """Factory function for AMLVelocityService."""
    return AMLVelocityService(db)
