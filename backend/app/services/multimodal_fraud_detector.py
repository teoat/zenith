"""
Multi-modal Fraud Detection System
Combines behavioral biometrics, social network analysis, and cross-channel correlation
for advanced fraud pattern detection.
"""

import asyncio
import logging
from collections import defaultdict
from dataclasses import dataclass
from datetime import datetime, timedelta
from enum import Enum
from typing import Any, Dict, List, Optional, Set, Tuple

import networkx as nx
import numpy as np

logger = logging.getLogger(__name__)


class ModalityType(Enum):
    BEHAVIORAL_BIOMETRICS = "behavioral_biometrics"
    SOCIAL_NETWORK = "social_network"
    TRANSACTION_SEQUENCE = "transaction_sequence"
    DEVICE_FINGERPRINT = "device_fingerprint"
    GEOSPATIAL_PATTERN = "geospatial_pattern"
    TEMPORAL_PATTERN = "temporal_pattern"


@dataclass
class BehavioralProfile:
    """User behavioral biometrics profile"""

    user_id: str
    keystroke_patterns: Dict[str, float]
    mouse_movement_patterns: Dict[str, float]
    session_duration_patterns: Dict[str, float]
    time_of_day_patterns: Dict[str, float]
    device_consistency_score: float
    last_updated: datetime


@dataclass
class SocialConnection:
    """Social network connection between entities"""

    source_entity: str
    target_entity: str
    connection_type: str
    strength: float
    evidence_count: int
    first_seen: datetime
    last_seen: datetime


@dataclass
class FraudPattern:
    """Detected fraud pattern across modalities"""

    pattern_id: str
    pattern_type: str
    confidence_score: float
    involved_entities: Set[str]
    temporal_span: Tuple[datetime, datetime]
    modalities_contributing: Set[ModalityType]
    risk_indicators: List[str]
    recommended_actions: List[str]
    detected_at: datetime


class MultiModalFraudDetector:
    """Advanced multi-modal fraud detection system"""

    def __init__(self):
        self.behavioral_profiles: Dict[str, BehavioralProfile] = {}
        self.social_graph = nx.DiGraph()
        self.fraud_patterns: List[FraudPattern] = []
        self.modality_weights = self._initialize_modality_weights()

    def _initialize_modality_weights(self) -> Dict[ModalityType, float]:
        """Initialize weights for different detection modalities"""
        return {
            ModalityType.BEHAVIORAL_BIOMETRICS: 0.25,
            ModalityType.SOCIAL_NETWORK: 0.30,
            ModalityType.TRANSACTION_SEQUENCE: 0.20,
            ModalityType.DEVICE_FINGERPRINT: 0.15,
            ModalityType.GEOSPATIAL_PATTERN: 0.05,
            ModalityType.TEMPORAL_PATTERN: 0.05,
        }

    async def analyze_entity(
        self, entity_id: str, context_data: Dict[str, Any]
    ) -> Dict[str, Any]:
        """
        Perform multi-modal fraud analysis on an entity

        Args:
            entity_id: Entity identifier to analyze
            context_data: Contextual data including transactions, behavioral data, etc.

        Returns:
            Comprehensive fraud analysis result
        """
        analysis_results = {}

        # Analyze each modality concurrently
        modality_tasks = [
            self._analyze_behavioral_biometrics(entity_id, context_data),
            self._analyze_social_network(entity_id, context_data),
            self._analyze_transaction_sequences(entity_id, context_data),
            self._analyze_device_fingerprints(entity_id, context_data),
            self._analyze_geospatial_patterns(entity_id, context_data),
            self._analyze_temporal_patterns(entity_id, context_data),
        ]

        modality_results = await asyncio.gather(*modality_tasks, return_exceptions=True)

        # Process results and handle exceptions
        for i, result in enumerate(modality_results):
            modality = list(ModalityType)[i]
            if isinstance(result, Exception):
                logger.error(f"Error in {modality.value} analysis: {result}")
                analysis_results[modality.value] = {
                    "error": str(result),
                    "risk_score": 0.0,
                    "confidence": 0.0,
                }
            else:
                analysis_results[modality.value] = result

        # Combine results using weighted ensemble
        combined_risk_score = self._combine_modality_scores(analysis_results)
        overall_confidence = self._calculate_overall_confidence(analysis_results)

        # Detect fraud patterns
        detected_patterns = await self._detect_fraud_patterns(
            entity_id, analysis_results
        )

        # Generate recommendations
        recommendations = self._generate_recommendations(
            combined_risk_score, detected_patterns
        )

        return {
            "entity_id": entity_id,
            "overall_risk_score": combined_risk_score,
            "overall_confidence": overall_confidence,
            "modality_breakdown": analysis_results,
            "detected_patterns": detected_patterns,
            "recommendations": recommendations,
            "analysis_timestamp": datetime.now().isoformat(),
        }

    async def _analyze_behavioral_biometrics(
        self, entity_id: str, context_data: Dict[str, Any]
    ) -> Dict[str, Any]:
        """Analyze behavioral biometrics for fraud detection"""
        behavioral_data = context_data.get("behavioral_data", {})

        if not behavioral_data:
            return {
                "risk_score": 0.0,
                "confidence": 0.0,
                "indicators": [],
                "reason": "No behavioral data available",
            }

        # Get or create behavioral profile
        profile = self.behavioral_profiles.get(entity_id)
        if not profile:
            profile = await self._build_behavioral_profile(entity_id, behavioral_data)
            self.behavioral_profiles[entity_id] = profile

        # Compare current behavior with profile
        anomalies = self._detect_behavioral_anomalies(profile, behavioral_data)

        # Calculate risk score based on anomalies
        risk_score = min(1.0, len(anomalies) * 0.2)
        confidence = 0.8 if len(anomalies) > 0 else 0.6

        return {
            "risk_score": risk_score,
            "confidence": confidence,
            "indicators": anomalies,
            "profile_age_days": (datetime.now() - profile.last_updated).days,
        }

    async def _build_behavioral_profile(
        self, entity_id: str, behavioral_data: Dict[str, Any]
    ) -> BehavioralProfile:
        """Build behavioral profile from historical data"""
        # This would analyze historical behavioral data
        # For now, create a basic profile
        return BehavioralProfile(
            user_id=entity_id,
            keystroke_patterns={"avg_wpm": 60, "consistency": 0.8},
            mouse_movement_patterns={"avg_speed": 500, "smoothness": 0.7},
            session_duration_patterns={"avg_minutes": 25, "variability": 0.3},
            time_of_day_patterns={"peak_hour": 14, "consistency": 0.9},
            device_consistency_score=0.85,
            last_updated=datetime.now(),
        )

    def _detect_behavioral_anomalies(
        self, profile: BehavioralProfile, current_data: Dict[str, Any]
    ) -> List[str]:
        """Detect behavioral anomalies"""
        anomalies = []

        # Check session timing
        current_hour = current_data.get("hour_of_day", 12)
        profile_peak = profile.time_of_day_patterns.get("peak_hour", 14)
        if abs(current_hour - profile_peak) > 6:  # More than 6 hours off
            anomalies.append("Unusual login time")

        # Check session duration
        current_duration = current_data.get("session_minutes", 30)
        profile_avg = profile.session_duration_patterns.get("avg_minutes", 25)
        if abs(current_duration - profile_avg) > profile_avg * 0.5:
            anomalies.append("Abnormal session duration")

        # Check device consistency
        device_fingerprint = current_data.get("device_fingerprint")
        if device_fingerprint and profile.device_consistency_score < 0.7:
            anomalies.append("Inconsistent device usage")

        return anomalies

    async def _analyze_social_network(
        self, entity_id: str, context_data: Dict[str, Any]
    ) -> Dict[str, Any]:
        """Analyze social network connections for fraud patterns"""
        # Build social graph from transaction relationships
        transactions = context_data.get("transactions", [])

        # Add entity to graph if not present
        if entity_id not in self.social_graph:
            self.social_graph.add_node(entity_id, type="entity")

        # Analyze connections
        direct_connections = set()
        indirect_connections = set()

        for tx in transactions:
            if tx.get("from_entity") == entity_id:
                connected_entity = tx.get("to_entity")
                if connected_entity:
                    direct_connections.add(connected_entity)
                    self._add_social_connection(
                        entity_id, connected_entity, "transaction", tx
                    )
            elif tx.get("to_entity") == entity_id:
                connected_entity = tx.get("from_entity")
                if connected_entity:
                    direct_connections.add(connected_entity)
                    self._add_social_connection(
                        connected_entity, entity_id, "transaction", tx
                    )

        # Find indirect connections (friends of friends)
        for connection in direct_connections:
            if connection in self.social_graph:
                neighbors = list(self.social_graph.neighbors(connection))
                indirect_connections.update(neighbors)

        indirect_connections -= direct_connections
        indirect_connections.discard(entity_id)

        # Calculate network risk metrics
        clustering_coefficient = (
            nx.clustering(self.social_graph, entity_id)
            if entity_id in self.social_graph
            else 0
        )
        degree_centrality = nx.degree_centrality(self.social_graph).get(entity_id, 0)

        # Detect suspicious network patterns
        risk_indicators = []

        if len(direct_connections) > 20:  # High number of connections
            risk_indicators.append("Extensive network connections")

        if clustering_coefficient > 0.8:  # Highly clustered connections
            risk_indicators.append("Highly clustered social network")

        if degree_centrality > 0.1:  # Central position in network
            risk_indicators.append("Central network position")

        # Check for connections to known high-risk entities
        high_risk_connections = self._find_high_risk_connections(entity_id)
        if high_risk_connections:
            risk_indicators.append(
                f"Connections to {len(high_risk_connections)} high-risk entities"
            )

        risk_score = min(1.0, (len(risk_indicators) * 0.15) + (degree_centrality * 2))

        return {
            "risk_score": risk_score,
            "confidence": 0.75,
            "network_metrics": {
                "direct_connections": len(direct_connections),
                "indirect_connections": len(indirect_connections),
                "clustering_coefficient": clustering_coefficient,
                "degree_centrality": degree_centrality,
            },
            "indicators": risk_indicators,
        }

    def _add_social_connection(
        self, source: str, target: str, connection_type: str, evidence: Dict[str, Any]
    ):
        """Add or strengthen social connection"""
        if not self.social_graph.has_edge(source, target):
            self.social_graph.add_edge(
                source,
                target,
                connection_type=connection_type,
                strength=1.0,
                evidence_count=1,
                first_seen=datetime.now(),
                last_seen=datetime.now(),
            )
        else:
            # Strengthen existing connection
            edge_data = self.social_graph[source][target]
            edge_data["strength"] = min(1.0, edge_data["strength"] + 0.1)
            edge_data["evidence_count"] += 1
            edge_data["last_seen"] = datetime.now()

    def _find_high_risk_connections(self, entity_id: str) -> List[str]:
        """Find connections to known high-risk entities"""
        # This would query a risk database
        # For now, return empty list
        return []

    async def _analyze_transaction_sequences(
        self, entity_id: str, context_data: Dict[str, Any]
    ) -> Dict[str, Any]:
        """Analyze transaction sequences for suspicious patterns"""
        transactions = sorted(
            context_data.get("transactions", []), key=lambda x: x.get("date", "")
        )

        if len(transactions) < 3:
            return {
                "risk_score": 0.0,
                "confidence": 0.3,
                "indicators": [],
                "reason": "Insufficient transaction history",
            }

        # Analyze sequence patterns
        patterns = self._detect_sequence_patterns(transactions)

        # Calculate risk based on suspicious patterns
        risk_score = min(1.0, len(patterns) * 0.25)
        confidence = min(0.9, 0.5 + (len(transactions) / 50))

        return {
            "risk_score": risk_score,
            "confidence": confidence,
            "patterns_detected": patterns,
            "sequence_length": len(transactions),
        }

    def _detect_sequence_patterns(
        self, transactions: List[Dict[str, Any]]
    ) -> List[str]:
        """Detect suspicious patterns in transaction sequences"""
        patterns = []

        # Check for structuring (amounts just below reporting threshold)
        amounts = [tx.get("amount", 0) for tx in transactions]
        threshold = 10000  # Reporting threshold
        structuring_count = sum(
            1 for amt in amounts if threshold * 0.8 <= amt < threshold
        )

        if structuring_count >= 3:
            patterns.append(
                f"Structuring pattern detected ({structuring_count} transactions)"
            )

        # Check for round-trip transactions
        round_trips = self._detect_round_trip_patterns(transactions)
        if round_trips:
            patterns.append(
                f"Round-trip transactions detected ({len(round_trips)} patterns)"
            )

        # Check for velocity patterns
        velocity_issues = self._detect_velocity_patterns(transactions)
        if velocity_issues:
            patterns.extend(velocity_issues)

        # Check for merchant concentration
        merchant_patterns = self._detect_merchant_concentration(transactions)
        if merchant_patterns:
            patterns.extend(merchant_patterns)

        return patterns

    def _detect_round_trip_patterns(
        self, transactions: List[Dict[str, Any]]
    ) -> List[Dict[str, Any]]:
        """Detect round-trip transaction patterns (A->B->A)"""
        patterns = []

        # Group transactions by amount and time window
        amount_groups = defaultdict(list)
        for tx in transactions:
            amount_groups[tx.get("amount", 0)].append(tx)

        for amount, tx_group in amount_groups.items():
            if len(tx_group) >= 3:  # Need at least 3 transactions for a pattern
                # Look for alternating from/to patterns
                entities = set()
                for tx in tx_group:
                    entities.add(tx.get("from_entity"))
                    entities.add(tx.get("to_entity"))

                if len(entities) == 2:  # Only two entities involved
                    patterns.append(
                        {
                            "amount": amount,
                            "entity_count": len(entities),
                            "transaction_count": len(tx_group),
                        }
                    )

        return patterns

    def _detect_velocity_patterns(
        self, transactions: List[Dict[str, Any]]
    ) -> List[str]:
        """Detect unusual transaction velocity"""
        patterns = []

        # Group by time windows
        hourly_counts = defaultdict(int)
        daily_counts = defaultdict(int)

        for tx in transactions:
            tx_date = tx.get("date")
            if tx_date:
                # Simple hourly/daily grouping (would use proper datetime parsing)
                hour_key = tx_date[:13]  # YYYY-MM-DDTHH
                day_key = tx_date[:10]  # YYYY-MM-DD

                hourly_counts[hour_key] += 1
                daily_counts[day_key] += 1

        # Check for unusual spikes
        avg_hourly = (
            sum(hourly_counts.values()) / len(hourly_counts) if hourly_counts else 0
        )
        max_hourly = max(hourly_counts.values()) if hourly_counts else 0

        if max_hourly > avg_hourly * 3 and max_hourly > 10:
            patterns.append(
                f"Unusual transaction velocity: {max_hourly} transactions in one hour"
            )

        return patterns

    def _detect_merchant_concentration(
        self, transactions: List[Dict[str, Any]]
    ) -> List[str]:
        """Detect concentration with specific merchants"""
        patterns = []

        merchant_counts = defaultdict(int)
        for tx in transactions:
            merchant = tx.get("merchant_name") or tx.get("description", "").split()[0]
            merchant_counts[merchant] += 1

        total_transactions = len(transactions)
        for merchant, count in merchant_counts.items():
            percentage = (count / total_transactions) * 100
            if percentage > 50:  # More than 50% of transactions with one merchant
                patterns.append(
                    f"High concentration with merchant '{merchant}': {percentage:.1f}% of transactions"
                )

        return patterns

    async def _analyze_device_fingerprints(
        self, entity_id: str, context_data: Dict[str, Any]
    ) -> Dict[str, Any]:
        """Analyze device fingerprint consistency"""
        device_data = context_data.get("device_fingerprints", [])

        if len(device_data) < 2:
            return {
                "risk_score": 0.0,
                "confidence": 0.3,
                "indicators": [],
                "reason": "Insufficient device data",
            }

        # Analyze device consistency
        consistency_score = self._calculate_device_consistency(device_data)
        risk_indicators = []

        if consistency_score < 0.5:
            risk_indicators.append("Inconsistent device usage patterns")
        if consistency_score < 0.3:
            risk_indicators.append("Multiple different devices detected")

        # Check for known compromised devices
        compromised_devices = self._check_compromised_devices(device_data)
        if compromised_devices:
            risk_indicators.append(
                f"Known compromised devices: {len(compromised_devices)}"
            )

        risk_score = max(0, (1 - consistency_score) * 0.8)

        return {
            "risk_score": risk_score,
            "confidence": 0.7,
            "consistency_score": consistency_score,
            "device_count": len(set(d.get("fingerprint") for d in device_data)),
            "indicators": risk_indicators,
        }

    def _calculate_device_consistency(self, device_data: List[Dict[str, Any]]) -> float:
        """Calculate device usage consistency score"""
        if not device_data:
            return 0.0

        fingerprints = [
            d.get("fingerprint") for d in device_data if d.get("fingerprint")
        ]
        unique_fingerprints = set(fingerprints)

        # Perfect consistency = 1.0
        if len(unique_fingerprints) == 1:
            return 1.0

        # Calculate based on primary device usage
        primary_device = max(set(fingerprints), key=fingerprints.count)
        primary_usage = fingerprints.count(primary_device) / len(fingerprints)

        return primary_usage

    def _check_compromised_devices(
        self, device_data: List[Dict[str, Any]]
    ) -> List[str]:
        """Check for known compromised devices"""
        # This would query a device reputation database
        return []

    async def _analyze_geospatial_patterns(
        self, entity_id: str, context_data: Dict[str, Any]
    ) -> Dict[str, Any]:
        """Analyze geospatial patterns in transactions"""
        locations = context_data.get("transaction_locations", [])

        if len(locations) < 3:
            return {
                "risk_score": 0.0,
                "confidence": 0.4,
                "indicators": [],
                "reason": "Insufficient location data",
            }

        # Analyze location patterns
        patterns = self._detect_geospatial_anomalies(locations)
        risk_score = min(1.0, len(patterns) * 0.2)

        return {
            "risk_score": risk_score,
            "confidence": 0.6,
            "location_count": len(locations),
            "unique_countries": len(set(loc.get("country") for loc in locations)),
            "indicators": patterns,
        }

    def _detect_geospatial_anomalies(
        self, locations: List[Dict[str, Any]]
    ) -> List[str]:
        """Detect anomalous geospatial patterns"""
        patterns = []

        countries = [loc.get("country") for loc in locations if loc.get("country")]
        country_counts = defaultdict(int)

        for country in countries:
            country_counts[country] += 1

        # Check for high-risk country concentration
        high_risk_countries = {"North Korea", "Iran", "Syria", "Venezuela"}  # Example
        high_risk_transactions = sum(
            country_counts.get(country, 0) for country in high_risk_countries
        )

        if high_risk_transactions > 0:
            patterns.append(
                f"Transactions involving high-risk countries: {high_risk_transactions}"
            )

        # Check for geographic spread
        unique_countries = len(country_counts)
        if unique_countries > 10:  # Transactions in many countries
            patterns.append(f"Wide geographic spread: {unique_countries} countries")

        return patterns

    async def _analyze_temporal_patterns(
        self, entity_id: str, context_data: Dict[str, Any]
    ) -> Dict[str, Any]:
        """Analyze temporal patterns in activity"""
        transactions = context_data.get("transactions", [])

        if len(transactions) < 5:
            return {
                "risk_score": 0.0,
                "confidence": 0.3,
                "indicators": [],
                "reason": "Insufficient temporal data",
            }

        # Analyze timing patterns
        patterns = self._detect_temporal_anomalies(transactions)
        risk_score = min(1.0, len(patterns) * 0.15)

        return {
            "risk_score": risk_score,
            "confidence": 0.65,
            "transaction_count": len(transactions),
            "indicators": patterns,
        }

    def _detect_temporal_anomalies(
        self, transactions: List[Dict[str, Any]]
    ) -> List[str]:
        """Detect anomalous temporal patterns"""
        patterns = []

        # Extract timestamps (simplified - would use proper datetime parsing)
        timestamps = []
        for tx in transactions:
            date_str = tx.get("date", "")
            if date_str:
                # Simple extraction - would use proper parsing
                try:
                    # Assume ISO format or similar
                    timestamps.append(
                        datetime.fromisoformat(date_str.replace("Z", "+00:00"))
                    )
                except:
                    continue

        if len(timestamps) < 5:
            return patterns

        # Check for burst patterns
        time_diffs = []
        for i in range(1, len(timestamps)):
            diff = (timestamps[i] - timestamps[i - 1]).total_seconds() / 60  # minutes
            time_diffs.append(diff)

        if time_diffs:
            avg_interval = sum(time_diffs) / len(time_diffs)
            burst_count = sum(
                1 for diff in time_diffs if diff < avg_interval * 0.1
            )  # Much faster than average

            if burst_count > len(time_diffs) * 0.3:  # More than 30% are bursts
                patterns.append(
                    f"Transaction burst patterns detected: {burst_count} rapid transactions"
                )

        # Check for unusual timing
        hour_counts = defaultdict(int)
        for ts in timestamps:
            hour_counts[ts.hour] += 1

        unusual_hours = [
            hour for hour, count in hour_counts.items() if count > len(timestamps) * 0.4
        ]
        if unusual_hours:
            patterns.append(
                f"Unusual transaction timing: concentrated in hours {unusual_hours}"
            )

        return patterns

    def _combine_modality_scores(
        self, modality_results: Dict[str, Dict[str, Any]]
    ) -> float:
        """Combine risk scores from all modalities using weighted average"""
        total_weight = 0
        weighted_sum = 0

        for modality_name, result in modality_results.items():
            if "error" not in result:
                modality = ModalityType(modality_name)
                weight = self.modality_weights[modality]
                risk_score = result.get("risk_score", 0)

                weighted_sum += risk_score * weight
                total_weight += weight

        return weighted_sum / total_weight if total_weight > 0 else 0.0

    def _calculate_overall_confidence(
        self, modality_results: Dict[str, Dict[str, Any]]
    ) -> float:
        """Calculate overall confidence in the analysis"""
        confidences = []

        for result in modality_results.values():
            if "error" not in result:
                confidence = result.get("confidence", 0)
                if confidence > 0:
                    confidences.append(confidence)

        if not confidences:
            return 0.0

        # Return harmonic mean for conservative confidence estimate
        return len(confidences) / sum(1 / c for c in confidences if c > 0)

    async def _detect_fraud_patterns(
        self, entity_id: str, modality_results: Dict[str, Dict[str, Any]]
    ) -> List[Dict[str, Any]]:
        """Detect complex fraud patterns across modalities"""
        patterns = []

        # Check for multi-modal fraud indicators
        social_risk = modality_results.get("social_network", {}).get("risk_score", 0)
        behavioral_risk = modality_results.get("behavioral_biometrics", {}).get(
            "risk_score", 0
        )
        sequence_risk = modality_results.get("transaction_sequence", {}).get(
            "risk_score", 0
        )

        # Mule network pattern: High social connections + suspicious sequences
        if social_risk > 0.6 and sequence_risk > 0.5:
            patterns.append(
                {
                    "pattern_type": "mule_network",
                    "confidence": min(social_risk, sequence_risk) * 0.9,
                    "description": "Entity appears to be part of a money mule network",
                    "involved_modalities": ["social_network", "transaction_sequence"],
                }
            )

        # Account takeover pattern: Behavioral anomalies + device changes
        device_risk = modality_results.get("device_fingerprint", {}).get(
            "risk_score", 0
        )
        if behavioral_risk > 0.7 and device_risk > 0.6:
            patterns.append(
                {
                    "pattern_type": "account_takeover",
                    "confidence": min(behavioral_risk, device_risk) * 0.85,
                    "description": "Possible account takeover with behavioral and device changes",
                    "involved_modalities": [
                        "behavioral_biometrics",
                        "device_fingerprint",
                    ],
                }
            )

        # Structuring pattern: Sequence anomalies + amount patterns
        if sequence_risk > 0.8:
            patterns.append(
                {
                    "pattern_type": "structuring",
                    "confidence": sequence_risk * 0.95,
                    "description": "Transaction structuring to avoid reporting thresholds",
                    "involved_modalities": ["transaction_sequence"],
                }
            )

        return patterns

    def _generate_recommendations(
        self, risk_score: float, detected_patterns: List[Dict[str, Any]]
    ) -> List[str]:
        """Generate actionable recommendations based on analysis"""
        recommendations = []

        if risk_score > 0.8:
            recommendations.extend(
                [
                    "Immediate case escalation required",
                    "Enhanced monitoring and transaction blocking",
                    "Contact law enforcement if applicable",
                ]
            )
        elif risk_score > 0.6:
            recommendations.extend(
                [
                    "Increase monitoring frequency",
                    "Require additional verification for high-value transactions",
                    "Review account access patterns",
                ]
            )
        elif risk_score > 0.4:
            recommendations.extend(
                [
                    "Enhanced due diligence recommended",
                    "Monitor for pattern evolution",
                    "Consider additional authentication requirements",
                ]
            )

        # Pattern-specific recommendations
        for pattern in detected_patterns:
            pattern_type = pattern.get("pattern_type")
            if pattern_type == "mule_network":
                recommendations.append(
                    "Investigate connections to other flagged accounts"
                )
            elif pattern_type == "account_takeover":
                recommendations.append("Force password reset and device verification")
            elif pattern_type == "structuring":
                recommendations.append(
                    "Review transaction patterns for SAR filing consideration"
                )

        return recommendations


# Global instance
multimodal_detector = MultiModalFraudDetector()
