import asyncio
import contextlib
import logging
import uuid
from abc import ABC, abstractmethod
from collections.abc import Callable
from datetime import datetime
from typing import Any

logger = logging.getLogger(__name__)


class MessageQueueInterface(ABC):
    """Abstract interface for Message Queue implementations (RabbitMQ, Kafka, etc.)"""

    @abstractmethod
    async def connect(self) -> bool:
        """Establish connection to the message broker."""

    @abstractmethod
    async def publish(self, topic: str, message: dict[str, Any]) -> bool:
        """Publish a message to a topic/queue."""

    @abstractmethod
    async def subscribe(
        self, topic: str, handler: Callable[[dict[str, Any]], None]
    ) -> bool:
        """Subscribe to a topic with a handler function."""

    @abstractmethod
    async def close(self):
        """Close connection."""


class InMemoryMessageQueue(MessageQueueInterface):
    """
    In-memory implementation for development/testing.
    Simulates a message broker without external dependencies.
    """

    def __init__(self):
        self._subscribers: dict[str, list[Callable]] = {}
        self._connected = False
        self._queue: asyncio.Queue = asyncio.Queue()
        self._worker_task: asyncio.Task | None = None

    async def connect(self) -> bool:
        self._connected = True
        logger.info("[MQ] In-memory message queue connected")
        self._worker_task = asyncio.create_task(self._process_queue())
        return True

    async def publish(self, topic: str, message: dict[str, Any]) -> bool:
        if not self._connected:
            logger.warning("[MQ] Cannot publish, not connected")
            return False

        payload = {
            "id": str(uuid.uuid4()),
            "topic": topic,
            "timestamp": datetime.utcnow().isoformat(),
            "data": message,
        }
        await self._queue.put(payload)
        logger.debug(f"[MQ] Published to {topic}: {message.keys()}")
        return True

    async def subscribe(
        self, topic: str, handler: Callable[[dict[str, Any]], None]
    ) -> bool:
        if topic not in self._subscribers:
            self._subscribers[topic] = []
        self._subscribers[topic].append(handler)
        logger.info(f"[MQ] Subscribed to {topic}")
        return True

    async def _process_queue(self):
        """Background worker to process messages"""
        while self._connected:
            try:
                payload = await self._queue.get()
                topic = payload["topic"]
                data = payload["data"]

                if topic in self._subscribers:
                    for handler in self._subscribers[topic]:
                        try:
                            # Support both async and sync handlers
                            if asyncio.iscoroutinefunction(handler):
                                await handler(data)
                            else:
                                handler(data)
                        except Exception as e:
                            logger.error(f"[MQ] Handler error for {topic}: {e}")

                self._queue.task_done()
            except asyncio.CancelledError:
                break
            except Exception as e:
                logger.error(f"[MQ] Worker error: {e}")

    async def close(self):
        self._connected = False
        if self._worker_task:
            self._worker_task.cancel()
            with contextlib.suppress(asyncio.CancelledError):
                await self._worker_task
        logger.info("[MQ] In-memory MQ closed")


# Singleton instance
mq_service = InMemoryMessageQueue()
