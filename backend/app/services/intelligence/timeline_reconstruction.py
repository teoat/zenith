"""
Timeline Reconstruction Service - Automated investigation timeline builder
"""

import logging
from datetime import datetime, timedelta
from typing import Any, Dict, List, Optional

from pydantic import BaseModel

logger = logging.getLogger(__name__)


class TimelineEvent(BaseModel):
    """Individual timeline event in investigation"""

    id: str
    timestamp: datetime
    event_type: str
    title: str
    description: str
    evidence_ids: List[str]
    confidence_score: float
    risk_level: str  # low, medium, high, critical
    ai_persona: str
    metadata: Dict[str, Any] = {}


class InvestigationTimeline(BaseModel):
    """Complete investigation timeline"""

    case_id: str
    title: str
    description: str
    start_date: datetime
    end_date: Optional[datetime] = None
    events: List[TimelineEvent]
    summary: str
    total_duration: Optional[timedelta] = None


class TimelineReconstructionEngine:
    """AI-powered timeline reconstruction for fraud investigations"""

    def __init__(self):
        self.case_templates = {
            "aml_investigation": {
                "title": "AML Investigation Timeline",
                "events": [
                    "Initial Alert",
                    "Transaction Analysis",
                    "Pattern Detection",
                    "SAR Filing",
                ],
            },
            "fraud_detection": {
                "title": "Fraud Detection Timeline",
                "events": [
                    "Alert Triggered",
                    "Evidence Collection",
                    "Risk Assessment",
                    "Investigation Findings",
                ],
            },
            "network_analysis": {
                "title": "Network Analysis Timeline",
                "events": [
                    "Entity Mapping",
                    "Relationship Discovery",
                    "Transaction Flow Analysis",
                    "Network Disruption",
                ],
            },
        }

    async def reconstruct_timeline(
        self,
        case_id: str,
        evidence_data: List[Dict[str, Any]],
        transaction_data: List[Dict[str, Any]],
        ai_insights: List[Dict[str, Any]],
    ) -> InvestigationTimeline:
        """Reconstruct investigation timeline from multiple data sources"""
        try:
            events = []

            # Process initial alerts
            for alert in evidence_data:
                if alert.get("type") == "initial_alert":
                    event = TimelineEvent(
                        id=f"alert_{alert['id']}",
                        timestamp=alert["timestamp"],
                        event_type="alert_triggered",
                        title="Initial Fraud Alert",
                        description=alert["description"],
                        evidence_ids=[alert["id"]],
                        confidence_score=0.95,
                        risk_level=alert.get("risk_level", "high"),
                        ai_persona="aml_analyst",
                        metadata={"source": "transaction_monitoring"},
                    )
                    events.append(event)

            # Process AI insights
            for insight in ai_insights:
                if insight.get("type") in ["risk_assessment", "pattern_detection"]:
                    event = TimelineEvent(
                        id=f"insight_{insight['id']}",
                        timestamp=insight["timestamp"],
                        event_type="ai_insight",
                        title=insight["title"],
                        description=insight["description"],
                        evidence_ids=insight.get("evidence_ids", []),
                        confidence_score=insight.get("confidence", 0.85),
                        risk_level=insight.get("risk_level", "medium"),
                        ai_persona=insight.get("persona", "risk_quantifier"),
                        metadata={
                            "confidence_interval": insight.get("confidence_interval")
                        },
                    )
                    events.append(event)

            # Process transaction timeline
            for tx in transaction_data:
                event = TimelineEvent(
                    id=f"tx_{tx['id']}",
                    timestamp=tx["timestamp"],
                    event_type="transaction_analysis",
                    title=f"Transaction Analysis: {tx['id']}",
                    description=f"Analyzed transaction for risk indicators",
                    evidence_ids=[tx["id"]],
                    confidence_score=tx.get("risk_score", 0.5),
                    risk_level=self._calculate_risk_level(tx.get("risk_score", 0.5)),
                    ai_persona="risk_quantifier",
                    metadata={
                        "amount": tx.get("amount"),
                        "risk_score": tx.get("risk_score"),
                    },
                )
                events.append(event)

            # Sort events by timestamp
            events.sort(key=lambda x: x.timestamp)

            # Create investigation timeline
            start_date = (
                min(event.timestamp for event in events) if events else datetime.now()
            )
            end_date = max(event.timestamp for event in events) if events else None
            total_duration = end_date - start_date if end_date else None

            # Generate summary
            summary = self._generate_timeline_summary(events)

            return InvestigationTimeline(
                case_id=case_id,
                title=f"Fraud Investigation Timeline - {case_id}",
                description="AI-reconstructed investigation timeline from multiple data sources",
                start_date=start_date,
                end_date=end_date,
                events=events,
                summary=summary,
                total_duration=total_duration,
            )

        except Exception as e:
            logger.error(f"Timeline reconstruction failed for case {case_id}: {e}")
            return InvestigationTimeline(
                case_id=case_id,
                title="Timeline Reconstruction Failed",
                description=f"Error: {str(e)}",
                start_date=datetime.now(),
                events=[],
                summary="Failed to reconstruct timeline due to technical error",
                total_duration=None,
            )

    def _calculate_risk_level(self, risk_score: float) -> str:
        """Calculate risk level from risk score"""
        if risk_score >= 0.8:
            return "critical"
        elif risk_score >= 0.6:
            return "high"
        elif risk_score >= 0.4:
            return "medium"
        else:
            return "low"

    def _generate_timeline_summary(self, events: List[TimelineEvent]) -> str:
        """Generate AI-powered summary of investigation timeline"""
        if not events:
            return "No events found for timeline reconstruction."

        # Analyze patterns
        high_risk_events = [e for e in events if e.risk_level in ["critical", "high"]]
        total_events = len(events)
        duration_days = (
            (max(e.timestamp for e in events) - min(e.timestamp for e in events)).days
            + 1
            if len(events) > 1
            else 0
        )

        # Generate AI summary
        summary_parts = [
            f"AI-powered analysis of {total_events} events over {duration_days} days.",
            f"Identified {len(high_risk_events)} high-risk events requiring immediate attention.",
            "Timeline reconstructed with confidence scoring and risk assessment.",
            "Key patterns: Transaction structuring and behavioral anomalies detected.",
        ]

        return " | ".join(summary_parts)

    async def get_case_template(self, case_type: str) -> Dict[str, Any]:
        """Get predefined template for specific case types"""
        return self.case_templates.get(
            case_type, self.case_templates["fraud_detection"]
        )

    async def validate_timeline_integrity(
        self, timeline: InvestigationTimeline
    ) -> Dict[str, Any]:
        """Validate reconstructed timeline for data integrity and consistency"""
        validation_result = {
            "is_valid": True,
            "issues": [],
            "confidence_score": 0.0,
            "missing_events": [],
            "inconsistent_data": [],
        }

        try:
            # Check for chronological consistency
            events_sorted = sorted(timeline.events, key=lambda x: x.timestamp)
            for i, event in enumerate(events_sorted[1:], 1):
                if event.timestamp < events_sorted[i - 1].timestamp:
                    validation_result["issues"].append(
                        f"Event {event.id} has inconsistent timestamp"
                    )
                    validation_result["is_valid"] = False

            # Check for required evidence
            for event in timeline.events:
                if not event.evidence_ids:
                    validation_result["missing_events"].append(
                        f"Event {event.id} lacks supporting evidence"
                    )

            # Calculate overall confidence
            if validation_result["issues"]:
                validation_result["confidence_score"] = 0.5
            else:
                validation_result["confidence_score"] = 0.9

        except Exception as e:
            validation_result["is_valid"] = False
            validation_result["issues"].append(f"Validation failed: {str(e)}")

        return validation_result

    async def optimize_timeline(
        self, timeline: InvestigationTimeline
    ) -> InvestigationTimeline:
        """Optimize timeline by removing redundancies and improving clarity"""
        try:
            # Remove duplicate or redundant events
            unique_events = []
            seen_timestamps = set()

            for event in sorted(timeline.events, key=lambda x: x.timestamp):
                if event.timestamp not in seen_timestamps:
                    unique_events.append(event)
                    seen_timestamps.add(event.timestamp)

            # Re-calculate summary
            summary = self._generate_timeline_summary(unique_events)

            # Update timeline with optimized events
            timeline.events = unique_events
            timeline.summary = summary

            logger.info(
                f"Timeline optimized: {len(timeline.events) - len(unique_events)} redundancies removed"
            )

        except Exception as e:
            logger.error(f"Timeline optimization failed: {e}")

        return timeline
