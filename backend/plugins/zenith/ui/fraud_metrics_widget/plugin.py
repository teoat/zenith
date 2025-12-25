from core.plugin_system import PluginInterface, PluginMetadata, PluginContext
from typing import Dict, Any, List

class FraudMetricsWidgetPlugin(PluginInterface):
    """
    Returns configuration for rendering a Fraud Metrics widget on the frontend.
    """
    
    @property
    def metadata(self) -> PluginMetadata:
        return PluginMetadata( # Metadata is defined in json usually but interface requires property
            name="fraud_metrics_widget",
            version="1.0.0",
            namespace="zenith/ui/fraud_metrics_widget",
            author="Zenith Team",
            description="Dashboard widget configuration for displaying fraud trends",
            dependencies={},
            capabilities=["ui_widget", "dashboard"],
            security_level="official",
            api_version="v1"
        )
    
    async def initialize(self, context: PluginContext) -> bool:
        self.context = context
        self.config = context.config or {"refresh_interval": 300, "chart_type": "line"}
        return True
    
    async def execute(self, inputs: Dict[str, Any]) -> Dict[str, Any]:
        """
        Returns the Widget Definition JSON.
        Inputs: {"user_role": "admin", ...}
        """
        # We could customize the widget based on user role here
        
        return {
            "widget_id": "fraud_trends_v1",
            "title": "Fraud Detection Trends",
            "type": self.config.get("chart_type", "line"),
            "data_source": "/api/metrics/fraud",
            "layout": {
                "w": 6,
                "h": 4,
                "minW": 3,
                "minH": 3
            },
            "props": {
                "color": "#FF4444",
                "legend": True,
                "refresh_interval_ms": self.config.get("refresh_interval", 300) * 1000
            }
        }

    async def cleanup(self) -> None:
        pass

    def validate_config(self, config: Dict[str, Any]) -> List[str]:
        return []
