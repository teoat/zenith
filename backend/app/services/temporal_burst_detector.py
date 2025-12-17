
class TemporalBurstDetector:
    """Mock Temporal Burst Detector"""
    def __init__(self, **kwargs):
        pass

    def analyze_transactions(self, transactions, case_id=None):
        return {
            "alerts": [],
            "summary": {
                "overall_risk_score": 0,
                "burst_patterns": 0,
                "structuring_patterns": 0,
                "velocity_anomalies": 0
            }
        }

temporal_burst_detector = TemporalBurstDetector()
