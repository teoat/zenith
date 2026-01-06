import logging
from typing import Any

from core.plugin_system import PluginContext, PluginInterface, PluginMetadata

logger = logging.getLogger(__name__)


class EmailNotifierPlugin(PluginInterface):
    """
    Sends email notifications.
    """

    @property
    def metadata(self) -> PluginMetadata:
        return PluginMetadata(
            name="email_notifier",
            version="1.0.0",
            namespace="zenith/integration/email_notifier",
            author="Zenith Team",
            description="Standard SMTP email notification provider",
            dependencies={},
            capabilities=["integration", "notification"],
            security_level="official",
            api_version="v1",
        )

    async def initialize(self, context: PluginContext) -> bool:
        self.context = context
        self.config = context.config or {}
        return True

    async def execute(self, inputs: dict[str, Any]) -> dict[str, Any]:
        """
        Sends an email.
        Inputs: {"to": "user@example.com", "subject": "Alert", "body": "..."}
        """
        recipient = inputs.get("to")
        subject = inputs.get("subject")
        body = inputs.get("body")

        if not recipient or not subject:
            return {"status": "error", "message": "Missing recipient or subject"}

        # In a real implementation, we would use aiosmtplib here.
        # For now, we log the action to prove connectivity.
        logger.info(f"📧 [EmailPlugin] Sending to {recipient} | Subject: {subject}")
        logger.info(f"📧 [EmailPlugin] Body: {body[:50]}...")

        return {
            "status": "success",
            "provider": "smtp (mock)",
            "message_id": "mock-12345",
        }

    async def cleanup(self) -> None:
        pass

    def validate_config(self, config: dict[str, Any]) -> list[str]:
        return []
