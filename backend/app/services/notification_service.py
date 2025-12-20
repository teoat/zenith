from typing import Dict, Any, List
import logging
from core.messaging import mq_service, MessageQueueInterface
from datetime import datetime

logger = logging.getLogger(__name__)

class NotificationService:
    """
    Decoupled Notification Service using Message Queue.
    Handles email, SMS, and push notifications via async messaging.
    """
    def __init__(self, mq: MessageQueueInterface = mq_service):
        self.mq = mq
        self._templates: Dict[str, str] = {
            "welcome": "Welcome {name} to 378x492 Platform!",
            "alert": "SECURITY ALERT: {details}",
            "case_update": "Case {case_id} has been updated."
        }
    
    async def initialize(self):
        """Subscribe to notification topics"""
        await self.mq.connect()
        await self.mq.subscribe("notifications.email", self._handle_email)
        await self.mq.subscribe("notifications.sms", self._handle_sms)
        logger.info("[NotificationService] Initialized and subscribed to topics")

    async def send_notification(self, type: str, recipient: str, template: str, context: Dict[str, Any]):
        """Publish notification request to MQ"""
        payload = {
            "type": type,
            "recipient": recipient,
            "template": template,
            "context": context,
            "timestamp": datetime.utcnow().isoformat()
        }
        await self.mq.publish(f"notifications.{type}", payload)

    async def _handle_email(self, data: Dict[str, Any]):
        """Process email notification from MQ using Plugins"""
        recipient = data.get("recipient")
        template_key = data.get("template")
        context = data.get("context", {})
        
        template = self._templates.get(template_key, "Notification: {details}")
        message = template.format(**context)
        
        logger.info(f"[EMAIL] Processing for {recipient}")

        # Integration with Plugin System
        from core.database import SessionLocal
        from core.plugin_system.registry import plugin_registry_service
        
        db = SessionLocal()
        try:
            plugins = await plugin_registry_service.get_plugins_by_capability("notification", db)
            
            if plugins:
                for plugin in plugins:
                    try:
                        # Assuming plugin interface expects 'execute' with relevant dict
                        # EmailNotifierPlugin expects: {"to": ..., "subject": ..., "body": ...}
                        # We map our internal data structure to the plugin contract
                        plugin_input = {
                            "to": recipient,
                            "subject": f"Notification: {template_key}",
                            "body": message
                        }
                        
                        result = await plugin.execute(plugin_input)
                        logger.info(f"Notification plugin {plugin.metadata.name} executed: {result}")
                    except Exception as pe:
                        logger.error(f"Plugin {plugin.metadata.name} failed to send email: {pe}")
            else:
                logger.warning("No notification plugins active. Fallback to basic logging.")
                logger.info(f"[EMAIL FALLBACK] Sending to {recipient}: {message}")
                
        except Exception as e:
            logger.error(f"Failed to process email plugins: {e}")
        finally:
            db.close()

    async def _handle_sms(self, data: Dict[str, Any]):
        """Process SMS notification from MQ"""
        recipient = data.get("recipient")
        context = data.get("context", {})
        logger.info(f"[SMS] Sending to {recipient}: {context}")
        # Integration with Twilio/SNS would go here

# Singleton
notification_service = NotificationService()
