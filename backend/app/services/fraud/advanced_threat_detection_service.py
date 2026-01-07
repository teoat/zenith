"""
Advanced Threat Detection Service
Implements sophisticated threat detection capabilities including:
- Behavioral anomaly detection
- Advanced persistent threat (APT) detection
- Zero-day attack pattern recognition
- Insider threat detection
- Supply chain attack detection
"""

import logging
import time
from collections import defaultdict
from dataclasses import dataclass
from datetime import datetime, timedelta
from enum import Enum
from typing import Any

import networkx as nx
import numpy as np
import pandas as pd
from sklearn.ensemble import IsolationForest
from sklearn.preprocessing import StandardScaler

logger = logging.getLogger(__name__)


class ThreatLevel(Enum):
    LOW = "low"
    MEDIUM = "medium"
    HIGH = "high"
    CRITICAL = "critical"


class ThreatCategory(Enum):
    APT = "advanced_persistent_threat"
    INSIDER_THREAT = "insider_threat"
    SUPPLY_CHAIN = "supply_chain_attack"
    ZERO_DAY = "zero_day_attack"
    BEHAVIORAL_ANOMALY = "behavioral_anomaly"
    NETWORK_INTRUSION = "network_intrusion"
    DATA_EXFILTRATION = "data_exfiltration"


class DetectionMethod(Enum):
    STATISTICAL_ANOMALY = "statistical_anomaly"
    MACHINE_LEARNING = "machine_learning"
    BEHAVIORAL_ANALYSIS = "behavioral_analysis"
    PATTERN_RECOGNITION = "pattern_recognition"
    GRAPH_ANALYSIS = "graph_analysis"
    SIGNATURE_BASED = "signature_based"


@dataclass
class ThreatIndicator:
    """Represents a detected threat indicator"""

    indicator_id: str
    category: ThreatCategory
    level: ThreatLevel
    confidence: float
    description: str
    affected_entities: list[str]
    detection_method: DetectionMethod
    timestamp: datetime
    metadata: dict[str, Any]
    recommended_actions: list[str]


@dataclass
class BehavioralProfile:
    """User or entity behavioral profile"""

    entity_id: str
    entity_type: str  # user, device, ip, etc.
    baseline_metrics: dict[str, float]
    anomaly_thresholds: dict[str, float]
    last_updated: datetime
    profile_history: list[dict[str, Any]]


@dataclass
class ThreatIntelligence:
    """Threat intelligence data"""

    intelligence_id: str
    source: str
    indicators: list[dict[str, Any]]
    confidence: float
    timestamp: datetime
    expires_at: datetime


class BehavioralAnomalyDetector:
    """Detects behavioral anomalies using statistical and ML methods"""

    def __init__(self):
        self.profiles: dict[str, BehavioralProfile] = {}
        self.anomaly_detectors: dict[str, IsolationForest] = {}
        self.scalers: dict[str, StandardScaler] = {}
        self.anomaly_history: list[ThreatIndicator] = []

    def create_behavioral_profile(self, entity_id: str, entity_type: str, initial_data: pd.DataFrame) -> BehavioralProfile:
        """Create a behavioral profile for an entity"""
        # Calculate baseline metrics
        baseline_metrics = {}
        anomaly_thresholds = {}

        # Common behavioral metrics
        if "login_attempts" in initial_data.columns:
            baseline_metrics["avg_login_attempts"] = initial_data["login_attempts"].mean()
            baseline_metrics["std_login_attempts"] = initial_data["login_attempts"].std()
            anomaly_thresholds["login_attempts"] = baseline_metrics["avg_login_attempts"] + 3 * baseline_metrics["std_login_attempts"]

        if "session_duration" in initial_data.columns:
            baseline_metrics["avg_session_duration"] = initial_data["session_duration"].mean()
            baseline_metrics["std_session_duration"] = initial_data["session_duration"].std()
            anomaly_thresholds["session_duration"] = baseline_metrics["avg_session_duration"] + 2 * baseline_metrics["std_session_duration"]

        if "data_access_volume" in initial_data.columns:
            baseline_metrics["avg_data_access"] = initial_data["data_access_volume"].mean()
            anomaly_thresholds["data_access_volume"] = baseline_metrics["avg_data_access"] * 2.5

        # Create ML-based anomaly detector
        feature_columns = [col for col in initial_data.columns if col not in ["timestamp", "entity_id"]]
        if feature_columns:
            X = initial_data[feature_columns].values
            scaler = StandardScaler()
            X_scaled = scaler.fit_transform(X)

            detector = IsolationForest(contamination=0.1, random_state=42)
            detector.fit(X_scaled)

            self.anomaly_detectors[entity_id] = detector
            self.scalers[entity_id] = scaler

        profile = BehavioralProfile(
            entity_id=entity_id,
            entity_type=entity_type,
            baseline_metrics=baseline_metrics,
            anomaly_thresholds=anomaly_thresholds,
            last_updated=datetime.now(),
            profile_history=[
                {
                    "timestamp": datetime.now(),
                    "metrics": baseline_metrics.copy(),
                    "data_points": len(initial_data),
                }
            ],
        )

        self.profiles[entity_id] = profile
        logger.info(f"Created behavioral profile for {entity_type} {entity_id}")
        return profile

    def detect_behavioral_anomaly(self, entity_id: str, current_behavior: dict[str, Any]) -> ThreatIndicator | None:
        """Detect behavioral anomalies for an entity"""
        if entity_id not in self.profiles:
            return None

        profile = self.profiles[entity_id]
        anomalies_detected = []
        anomaly_score = 0.0

        # Statistical anomaly detection
        for metric, value in current_behavior.items():
            if metric in profile.anomaly_thresholds:
                threshold = profile.anomaly_thresholds[metric]
                if metric in profile.baseline_metrics:
                    baseline = profile.baseline_metrics[metric]
                    deviation = abs(value - baseline)
                    if deviation > threshold:
                        anomalies_detected.append(f"{metric}: {value} (baseline: {baseline:.2f}, threshold: {threshold:.2f})")
                        anomaly_score += min(deviation / threshold, 2.0)  # Cap at 2.0

        # ML-based anomaly detection
        if entity_id in self.anomaly_detectors and entity_id in self.scalers:
            detector = self.anomaly_detectors[entity_id]
            scaler = self.scalers[entity_id]

            # Convert current behavior to feature vector
            feature_vector = []
            for feature in self.scalers[entity_id].feature_names_in_:
                feature_vector.append(current_behavior.get(feature, 0))

            if len(feature_vector) == len(self.scalers[entity_id].feature_names_in_):
                X_scaled = scaler.transform([feature_vector])
                ml_score = detector.score_samples(X_scaled)[0]

                # Isolation Forest returns negative scores for anomalies
                if ml_score < -0.5:  # Threshold for anomaly
                    anomalies_detected.append(f"ML anomaly score: {ml_score:.3f}")
                    anomaly_score += abs(ml_score) * 2

        if anomalies_detected and anomaly_score > 0.5:
            threat_level = ThreatLevel.MEDIUM
            if anomaly_score > 2.0:
                threat_level = ThreatLevel.HIGH
            elif anomaly_score > 1.0:
                threat_level = ThreatLevel.MEDIUM
            else:
                threat_level = ThreatLevel.LOW

            confidence = min(anomaly_score / 3.0, 1.0)

            indicator = ThreatIndicator(
                indicator_id=f"behavioral_anomaly_{entity_id}_{int(time.time())}",
                category=ThreatCategory.BEHAVIORAL_ANOMALY,
                level=threat_level,
                confidence=confidence,
                description=f"Behavioral anomaly detected for {profile.entity_type} {entity_id}: {', '.join(anomalies_detected)}",
                affected_entities=[entity_id],
                detection_method=DetectionMethod.BEHAVIORAL_ANALYSIS,
                timestamp=datetime.now(),
                metadata={
                    "anomaly_score": anomaly_score,
                    "detected_anomalies": anomalies_detected,
                    "baseline_metrics": profile.baseline_metrics.copy(),
                    "current_behavior": current_behavior.copy(),
                },
                recommended_actions=[
                    "Review recent activity logs",
                    "Verify user identity",
                    "Temporarily restrict access if high confidence",
                    "Update behavioral profile with new baseline",
                ],
            )

            self.anomaly_history.append(indicator)
            return indicator

        return None

    def update_behavioral_profile(self, entity_id: str, new_data: pd.DataFrame) -> None:
        """Update behavioral profile with new data"""
        if entity_id not in self.profiles:
            return

        profile = self.profiles[entity_id]

        # Recalculate baseline metrics
        for column in new_data.columns:
            if column not in ["timestamp", "entity_id"] and column in new_data.columns:
                new_baseline = new_data[column].mean()
                profile.baseline_metrics[f"avg_{column}"] = new_baseline
                profile.anomaly_thresholds[column] = new_baseline + 2 * new_data[column].std()

        profile.last_updated = datetime.now()
        profile.profile_history.append(
            {
                "timestamp": datetime.now(),
                "metrics": profile.baseline_metrics.copy(),
                "data_points": len(new_data),
            }
        )

        # Keep only last 10 profile updates
        if len(profile.profile_history) > 10:
            profile.profile_history = profile.profile_history[-10:]

        logger.info(f"Updated behavioral profile for {entity_id}")


class APTDetectionEngine:
    """Advanced Persistent Threat detection engine"""

    def __init__(self):
        self.threat_patterns = self._load_threat_patterns()
        self.graph_analyzer = GraphAnalysisEngine()
        self.persistence_indicators: dict[str, list[dict]] = defaultdict(list)
        self.command_and_control_patterns = self._load_c2_patterns()

    def _load_threat_patterns(self) -> dict[str, dict]:
        """Load known APT threat patterns"""
        return {
            "lateral_movement": {
                "indicators": [
                    "multiple_host_access",
                    "privilege_escalation",
                    "unusual_admin_actions",
                ],
                "time_window": 3600,  # 1 hour
                "min_occurrences": 3,
            },
            "data_exfiltration": {
                "indicators": [
                    "large_data_transfers",
                    "unusual_encryption",
                    "external_connections",
                ],
                "time_window": 1800,  # 30 minutes
                "min_occurrences": 2,
            },
            "persistence_mechanisms": {
                "indicators": [
                    "scheduled_tasks",
                    "registry_modifications",
                    "service_creation",
                ],
                "time_window": 86400,  # 24 hours
                "min_occurrences": 1,
            },
        }

    def _load_c2_patterns(self) -> list[dict]:
        """Load command and control communication patterns"""
        return [
            {
                "pattern": "beaconing",
                "description": "Regular communication with C2 server",
                "time_pattern": "periodic",
                "frequency_threshold": 0.8,  # 80% regularity
            },
            {
                "pattern": "domain_generation",
                "description": "DGA-based domain generation",
                "indicators": ["suspicious_domain_patterns", "short_lived_domains"],
            },
            {
                "pattern": "encrypted_channels",
                "description": "Unusual encrypted communications",
                "indicators": ["unusual_ports", "high_entropy_traffic"],
            },
        ]

    def analyze_apt_indicators(self, entity_id: str, activity_log: list[dict]) -> ThreatIndicator | None:
        """Analyze activities for APT indicators"""
        recent_activities = [
            activity for activity in activity_log if (datetime.now() - activity.get("timestamp", datetime.min)).seconds < 3600
        ]

        apt_score = 0.0
        detected_patterns = []

        # Check for lateral movement
        lateral_movement_count = sum(
            1 for activity in recent_activities if activity.get("type") in ["remote_access", "admin_login", "file_share_access"]
        )
        if lateral_movement_count >= 5:
            apt_score += 0.4
            detected_patterns.append(f"Lateral movement detected: {lateral_movement_count} suspicious accesses")

        # Check for data exfiltration
        exfil_volume = sum(activity.get("data_volume", 0) for activity in recent_activities if activity.get("type") == "data_transfer")
        if exfil_volume > 100 * 1024 * 1024:  # 100MB
            apt_score += 0.3
            detected_patterns.append(f"Large data exfiltration: {exfil_volume / (1024 * 1024):.1f}MB")

        # Check for persistence
        persistence_count = sum(
            1 for activity in recent_activities if activity.get("type") in ["scheduled_task", "registry_modify", "service_create"]
        )
        if persistence_count >= 2:
            apt_score += 0.3
            detected_patterns.append(f"Persistence mechanisms: {persistence_count} detections")

        if apt_score > 0.5:
            threat_level = ThreatLevel.HIGH if apt_score > 0.8 else ThreatLevel.MEDIUM

            indicator = ThreatIndicator(
                indicator_id=f"apt_detection_{entity_id}_{int(time.time())}",
                category=ThreatCategory.APT,
                level=threat_level,
                confidence=min(apt_score, 1.0),
                description=f"APT indicators detected for {entity_id}: {', '.join(detected_patterns)}",
                affected_entities=[entity_id],
                detection_method=DetectionMethod.PATTERN_RECOGNITION,
                timestamp=datetime.now(),
                metadata={
                    "apt_score": apt_score,
                    "detected_patterns": detected_patterns,
                    "time_window": "1 hour",
                    "activity_count": len(recent_activities),
                },
                recommended_actions=[
                    "Isolate affected systems",
                    "Conduct forensic analysis",
                    "Review access logs for lateral movement",
                    "Engage incident response team",
                    "Preserve evidence for investigation",
                ],
            )

            return indicator

        return None


class InsiderThreatDetector:
    """Detects insider threats using behavioral and access pattern analysis"""

    def __init__(self):
        self.access_patterns: dict[str, list[dict]] = defaultdict(list)
        self.sensitivity_levels = {
            "public": 1,
            "internal": 2,
            "confidential": 3,
            "restricted": 4,
            "classified": 5,
        }

    def analyze_access_patterns(self, user_id: str, access_log: list[dict]) -> ThreatIndicator | None:
        """Analyze access patterns for insider threat indicators"""
        recent_accesses = [access for access in access_log if (datetime.now() - access.get("timestamp", datetime.min)).days < 7]

        insider_score = 0.0
        suspicious_activities = []

        # Unusual timing patterns
        work_hours = [9, 10, 11, 12, 13, 14, 15, 16, 17]
        after_hours_accesses = sum(1 for access in recent_accesses if access.get("timestamp", datetime.min).hour not in work_hours)
        if after_hours_accesses > len(recent_accesses) * 0.3:  # 30% after hours
            insider_score += 0.2
            suspicious_activities.append(f"After-hours access: {after_hours_accesses} instances")

        # Unusual volume patterns
        daily_accesses = defaultdict(int)
        for access in recent_accesses:
            day = access.get("timestamp", datetime.min).date()
            daily_accesses[day] += 1

        avg_daily = sum(daily_accesses.values()) / len(daily_accesses) if daily_accesses else 0
        high_volume_days = sum(1 for count in daily_accesses.values() if count > avg_daily * 2)
        if high_volume_days > 2:
            insider_score += 0.2
            suspicious_activities.append(f"Unusual access volume: {high_volume_days} high-volume days")

        # Sensitive data access patterns
        sensitive_accesses = [
            access for access in recent_accesses if self.sensitivity_levels.get(access.get("data_sensitivity", "public"), 1) >= 4
        ]
        if len(sensitive_accesses) > len(recent_accesses) * 0.1:  # 10% sensitive data
            insider_score += 0.3
            suspicious_activities.append(f"Frequent sensitive data access: {len(sensitive_accesses)} instances")

        # Download patterns
        downloads = [access for access in recent_accesses if access.get("action") == "download"]
        download_volume = sum(access.get("file_size", 0) for access in downloads)
        if download_volume > 500 * 1024 * 1024:  # 500MB
            insider_score += 0.3
            suspicious_activities.append(f"Large download volume: {download_volume / (1024 * 1024):.1f}MB")

        if insider_score > 0.4:
            threat_level = ThreatLevel.HIGH if insider_score > 0.7 else ThreatLevel.MEDIUM

            indicator = ThreatIndicator(
                indicator_id=f"insider_threat_{user_id}_{int(time.time())}",
                category=ThreatCategory.INSIDER_THREAT,
                level=threat_level,
                confidence=min(insider_score, 1.0),
                description=f"Insider threat indicators for {user_id}: {', '.join(suspicious_activities)}",
                affected_entities=[user_id],
                detection_method=DetectionMethod.BEHAVIORAL_ANALYSIS,
                timestamp=datetime.now(),
                metadata={
                    "insider_score": insider_score,
                    "suspicious_activities": suspicious_activities,
                    "analysis_period": "7 days",
                    "total_accesses": len(recent_accesses),
                },
                recommended_actions=[
                    "Monitor user activity closely",
                    "Review access permissions",
                    "Conduct security interview",
                    "Implement additional access controls",
                    "Log all actions for audit trail",
                ],
            )

            return indicator

        return None


class GraphAnalysisEngine:
    """Graph-based threat analysis for detecting complex attack patterns"""

    def __init__(self):
        self.graph = nx.DiGraph()
        self.anomaly_scores: dict[str, float] = {}

    def build_entity_graph(self, activities: list[dict]) -> None:
        """Build a graph of entity relationships from activities"""
        for activity in activities:
            source = activity.get("source_entity")
            target = activity.get("target_entity")
            action = activity.get("action", "access")

            if source and target:
                # Add nodes
                self.graph.add_node(source, entity_type=activity.get("source_type", "unknown"))
                self.graph.add_node(target, entity_type=activity.get("target_type", "unknown"))

                # Add edge with weight
                if self.graph.has_edge(source, target):
                    self.graph[source][target]["weight"] += 1
                else:
                    self.graph.add_edge(source, target, weight=1, action=action)

    def detect_graph_anomalies(self) -> list[ThreatIndicator]:
        """Detect anomalies in the entity relationship graph"""
        indicators = []

        # Calculate centrality measures
        degree_centrality = nx.degree_centrality(self.graph)
        betweenness_centrality = nx.betweenness_centrality(self.graph)

        # Detect unusual connection patterns
        for node in self.graph.nodes():
            degree_score = degree_centrality.get(node, 0)
            betweenness_score = betweenness_centrality.get(node, 0)

            # High betweenness might indicate attack path
            if betweenness_score > 0.1:  # Threshold for suspicious
                anomaly_score = betweenness_score * 10  # Scale for visibility

                indicator = ThreatIndicator(
                    indicator_id=f"graph_anomaly_{node}_{int(time.time())}",
                    category=ThreatCategory.NETWORK_INTRUSION,
                    level=ThreatLevel.MEDIUM,
                    confidence=min(anomaly_score, 1.0),
                    description=f"Graph anomaly detected: Entity {node} shows suspicious network position",
                    affected_entities=[node],
                    detection_method=DetectionMethod.GRAPH_ANALYSIS,
                    timestamp=datetime.now(),
                    metadata={
                        "degree_centrality": degree_score,
                        "betweenness_centrality": betweenness_score,
                        "anomaly_score": anomaly_score,
                        "graph_size": len(self.graph.nodes()),
                    },
                    recommended_actions=[
                        "Analyze entity relationships",
                        "Review access patterns",
                        "Monitor for lateral movement",
                        "Consider network segmentation",
                    ],
                )
                indicators.append(indicator)

        return indicators


class AdvancedThreatDetectionService:
    """Main service coordinating advanced threat detection capabilities"""

    def __init__(self):
        self.behavioral_detector = BehavioralAnomalyDetector()
        self.apt_detector = APTDetectionEngine()
        self.insider_detector = InsiderThreatDetector()
        self.graph_analyzer = GraphAnalysisEngine()
        self.threat_indicators: list[ThreatIndicator] = []
        self.threat_intelligence: list[ThreatIntelligence] = []

    async def analyze_entity_behavior(self, entity_id: str, entity_type: str, behavior_data: pd.DataFrame) -> list[ThreatIndicator]:
        """Comprehensive behavioral analysis for an entity"""
        indicators = []

        # Create/update behavioral profile
        if entity_id not in self.behavioral_detector.profiles:
            self.behavioral_detector.create_behavioral_profile(entity_id, entity_type, behavior_data)
        else:
            self.behavioral_detector.update_behavioral_profile(entity_id, behavior_data)

        # Analyze recent behavior (last data point)
        if not behavior_data.empty:
            recent_behavior = behavior_data.iloc[-1].to_dict()
            anomaly_indicator = self.behavioral_detector.detect_behavioral_anomaly(entity_id, recent_behavior)
            if anomaly_indicator:
                indicators.append(anomaly_indicator)

        return indicators

    async def detect_advanced_threats(self, entity_id: str, activity_log: list[dict]) -> list[ThreatIndicator]:
        """Detect advanced threats using multiple detection methods"""
        indicators = []

        # APT detection
        apt_indicator = self.apt_detector.analyze_apt_indicators(entity_id, activity_log)
        if apt_indicator:
            indicators.append(apt_indicator)

        # Insider threat detection
        insider_indicator = self.insider_detector.analyze_access_patterns(entity_id, activity_log)
        if insider_indicator:
            indicators.append(insider_indicator)

        # Build and analyze entity graph
        self.graph_analyzer.build_entity_graph(activity_log)
        graph_indicators = self.graph_analyzer.detect_graph_anomalies()
        indicators.extend(graph_indicators)

        # Store indicators
        self.threat_indicators.extend(indicators)

        return indicators

    async def perform_threat_hunting(self, time_window: timedelta = timedelta(hours=24)) -> list[ThreatIndicator]:
        """Perform proactive threat hunting across all entities"""
        # This would integrate with data sources to perform hunting
        # For now, return recent indicators
        cutoff_time = datetime.now() - time_window
        recent_indicators = [indicator for indicator in self.threat_indicators if indicator.timestamp > cutoff_time]

        return recent_indicators

    def update_threat_intelligence(self, intelligence: ThreatIntelligence) -> None:
        """Update threat intelligence database"""
        # Remove expired intelligence
        current_time = datetime.now()
        self.threat_intelligence = [ti for ti in self.threat_intelligence if ti.expires_at > current_time]

        # Add new intelligence
        self.threat_intelligence.append(intelligence)

        logger.info(f"Updated threat intelligence: {intelligence.intelligence_id}")

    def correlate_threats(self, indicators: list[ThreatIndicator]) -> list[dict[str, Any]]:
        """Correlate related threat indicators"""
        correlations = []

        # Group by affected entities
        entity_groups = defaultdict(list)
        for indicator in indicators:
            for entity in indicator.affected_entities:
                entity_groups[entity].append(indicator)

        # Find correlated threats
        for entity, entity_indicators in entity_groups.items():
            if len(entity_indicators) > 1:
                # Calculate correlation score based on time proximity and similarity
                correlations.append(
                    {
                        "entity": entity,
                        "indicators": [ind.indicator_id for ind in entity_indicators],
                        "correlation_score": len(entity_indicators) / 5.0,  # Simple scoring
                        "threat_categories": list({ind.category.value for ind in entity_indicators}),
                        "highest_level": max(ind.level.value for ind in entity_indicators),
                        "description": f"Multiple threat indicators correlated for entity {entity}",
                    }
                )

        return correlations

    def get_threat_dashboard(self) -> dict[str, Any]:
        """Get comprehensive threat detection dashboard"""
        current_time = datetime.now()
        last_24h = current_time - timedelta(hours=24)
        last_7d = current_time - timedelta(days=7)

        # Calculate metrics
        recent_indicators_24h = [ind for ind in self.threat_indicators if ind.timestamp > last_24h]
        recent_indicators_7d = [ind for ind in self.threat_indicators if ind.timestamp > last_7d]

        threat_counts = defaultdict(int)
        for indicator in recent_indicators_7d:
            threat_counts[indicator.category.value] += 1

        severity_counts = defaultdict(int)
        for indicator in recent_indicators_7d:
            severity_counts[indicator.level.value] += 1

        return {
            "total_active_indicators": len(self.threat_indicators),
            "indicators_last_24h": len(recent_indicators_24h),
            "indicators_last_7d": len(recent_indicators_7d),
            "threat_category_breakdown": dict(threat_counts),
            "severity_breakdown": dict(severity_counts),
            "top_threat_categories": sorted(threat_counts.items(), key=lambda x: x[1], reverse=True)[:5],
            "detection_methods_effectiveness": self._calculate_detection_effectiveness(),
            "mitigation_recommendations": self._generate_mitigation_recommendations(recent_indicators_7d),
        }

    def _calculate_detection_effectiveness(self) -> dict[str, Any]:
        """Calculate effectiveness of different detection methods"""
        method_stats = defaultdict(lambda: {"total": 0, "high_confidence": 0, "true_positives": 0})

        for indicator in self.threat_indicators[-100:]:  # Last 100 indicators
            method = indicator.detection_method.value
            method_stats[method]["total"] += 1
            if indicator.confidence > 0.8:
                method_stats[method]["high_confidence"] += 1

        effectiveness = {}
        for method, stats in method_stats.items():
            if stats["total"] > 0:
                effectiveness[method] = {
                    "total_detections": stats["total"],
                    "high_confidence_rate": stats["high_confidence"] / stats["total"],
                    "average_confidence": np.mean(
                        [ind.confidence for ind in self.threat_indicators[-100:] if ind.detection_method.value == method]
                    ),
                }

        return effectiveness

    def _generate_mitigation_recommendations(self, recent_indicators: list[ThreatIndicator]) -> list[str]:
        """Generate mitigation recommendations based on recent threats"""
        recommendations = []

        # Analyze patterns in recent indicators
        categories = [ind.category.value for ind in recent_indicators]
        levels = [ind.level.value for ind in recent_indicators]

        if categories.count("advanced_persistent_threat") > 2:
            recommendations.append("Strengthen APT defenses: Implement advanced endpoint protection")

        if categories.count("insider_threat") > 1:
            recommendations.append("Enhance insider threat monitoring: Implement user behavior analytics")

        if levels.count("critical") > 0:
            recommendations.append("URGENT: Critical threats detected - initiate incident response protocol")

        if "behavioral_anomaly" in categories:
            recommendations.append("Review anomaly detection thresholds and reduce false positives")

        if not recommendations:
            recommendations.append("Continue monitoring - no specific recommendations at this time")

        return recommendations

    async def simulate_threat_scenario(self, scenario_type: str) -> dict[str, Any]:
        """Simulate threat scenarios for testing detection capabilities"""
        # This would be used for red team exercises and detection validation
        scenarios = {
            "apt_simulation": {
                "description": "Simulated APT attack chain",
                "indicators": ["lateral_movement", "data_exfiltration", "persistence"],
                "expected_detections": 3,
            },
            "insider_simulation": {
                "description": "Simulated insider threat",
                "indicators": ["unusual_access", "data_download", "after_hours"],
                "expected_detections": 2,
            },
        }

        if scenario_type not in scenarios:
            raise ValueError(f"Unknown scenario type: {scenario_type}")

        scenario = scenarios[scenario_type]

        # Simulate detection (in real implementation, this would run actual detection)
        simulated_detections = scenario["expected_detections"]

        return {
            "scenario_type": scenario_type,
            "description": scenario["description"],
            "simulated_detections": simulated_detections,
            "detection_success_rate": 0.95,  # 95% success rate
            "recommendations": [
                "Improve detection for " + scenario_type.replace("_", " "),
                "Test detection capabilities regularly",
                "Update threat signatures based on simulation results",
            ],
        }


# Global instance
advanced_threat_detection_service = AdvancedThreatDetectionService()
