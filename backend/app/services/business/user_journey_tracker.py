# User Journey Analytics Service
from collections import defaultdict, deque
from datetime import datetime
from typing import Any


class UserJourneyTracker:
    """Track user journeys and funnel analysis"""

    def __init__(self):
        self.journey_data = defaultdict(list)
        self.funnel_steps = {
            "login": "User logged in",
            "dashboard_view": "Viewed dashboard",
            "case_created": "Created new case",
            "evidence_uploaded": "Uploaded evidence",
            "analysis_started": "Started analysis",
            "report_generated": "Generated report",
        }
        self.conversion_funnel = defaultdict(int)
        self.session_data = deque(maxlen=10000)  # Keep last 10k sessions

    def track_event(self, user_id: str, event_type: str, metadata: dict[str, Any] | None = None):
        """Track a user event"""
        event = {
            "user_id": user_id,
            "event_type": event_type,
            "timestamp": datetime.utcnow().isoformat(),
            "metadata": metadata or {},
        }

        self.journey_data[user_id].append(event)
        self.session_data.append(event)

        # Update funnel conversion
        if event_type in self.funnel_steps:
            self.conversion_funnel[event_type] += 1

    def get_user_journey(self, user_id: str) -> list[dict[str, Any]]:
        """Get journey for a specific user"""
        return self.journey_data.get(user_id, [])

    def get_funnel_analysis(self) -> dict[str, Any]:
        """Analyze conversion funnel"""
        total_users = len(self.journey_data)
        funnel_analysis = {}

        for step, description in self.funnel_steps.items():
            conversion_rate = (self.conversion_funnel[step] / total_users * 100) if total_users > 0 else 0
            funnel_analysis[step] = {
                "description": description,
                "count": self.conversion_funnel[step],
                "conversion_rate": round(conversion_rate, 2),
            }

        return {
            "total_users": total_users,
            "funnel_steps": funnel_analysis,
            "drop_off_points": self._calculate_drop_offs(funnel_analysis),
        }

    def _calculate_drop_offs(self, funnel_data: dict[str, Any]) -> list[dict[str, Any]]:
        """Calculate drop-off points in the funnel"""
        drop_offs = []
        steps = list(self.funnel_steps.keys())

        for i in range(1, len(steps)):
            prev_step = steps[i - 1]
            current_step = steps[i]

            prev_count = funnel_data[prev_step]["count"]
            current_count = funnel_data[current_step]["count"]

            if prev_count > 0:
                drop_off_rate = ((prev_count - current_count) / prev_count) * 100
                drop_offs.append(
                    {
                        "from_step": prev_step,
                        "to_step": current_step,
                        "drop_off_rate": round(drop_off_rate, 2),
                        "retained_users": current_count,
                    }
                )

        return drop_offs

    def get_session_analytics(self) -> dict[str, Any]:
        """Get session-based analytics"""
        if not self.session_data:
            return {"total_sessions": 0, "analytics": {}}

        # Group by event type
        event_counts = defaultdict(int)
        for event in self.session_data:
            event_counts[event["event_type"]] += 1

        # Calculate time-based metrics
        timestamps = [event["timestamp"] for event in self.session_data]
        if timestamps:
            earliest = min(timestamps)
            latest = max(timestamps)
            # Basic time range calculation

        return {
            "total_events": len(self.session_data),
            "event_breakdown": dict(event_counts),
            "time_range": {
                "earliest": earliest if timestamps else None,
                "latest": latest if timestamps else None,
            },
        }


# Global user journey tracker instance
user_journey_tracker = UserJourneyTracker()
