"""
API Integration Hub
Centralized management of third-party API integrations with webhook support,
rate limiting, and partner ecosystem management.
"""

import asyncio
import aiohttp
import json
import logging
from typing import Dict, List, Any, Optional, Callable, Union
from dataclasses import dataclass, field
from datetime import datetime, timedelta
from enum import Enum
import hashlib
import hmac
import base64

logger = logging.getLogger(__name__)

class IntegrationStatus(Enum):
    ACTIVE = "active"
    INACTIVE = "inactive"
    ERROR = "error"
    MAINTENANCE = "maintenance"

class IntegrationType(Enum):
    WEBHOOK = "webhook"
    REST_API = "rest_api"
    GRAPHQL = "graphql"
    SOAP = "soap"
    DATABASE = "database"
    FILE_UPLOAD = "file_upload"

class AuthenticationType(Enum):
    NONE = "none"
    API_KEY = "api_key"
    OAUTH2 = "oauth2"
    JWT = "jwt"
    BASIC_AUTH = "basic_auth"
    CERTIFICATE = "certificate"

@dataclass
class IntegrationConfig:
    """Configuration for a third-party integration"""
    integration_id: str
    name: str
    type: IntegrationType
    status: IntegrationStatus
    endpoint_url: str
    authentication: AuthenticationType
    auth_config: Dict[str, Any] = field(default_factory=dict)
    rate_limit: int = 100  # requests per minute
    timeout_seconds: int = 30
    retry_attempts: int = 3
    headers: Dict[str, str] = field(default_factory=dict)
    query_params: Dict[str, str] = field(default_factory=dict)
    webhook_secret: Optional[str] = None
    created_at: datetime = field(default_factory=datetime.now)
    last_used: Optional[datetime] = None
    error_count: int = 0
    success_count: int = 0

@dataclass
class IntegrationCall:
    """Record of an integration API call"""
    call_id: str
    integration_id: str
    method: str
    endpoint: str
    request_data: Optional[Dict[str, Any]] = None
    response_data: Optional[Dict[str, Any]] = None
    status_code: Optional[int] = None
    duration_ms: Optional[int] = None
    error_message: Optional[str] = None
    timestamp: datetime = field(default_factory=datetime.now)

@dataclass
class WebhookEvent:
    """Incoming webhook event"""
    event_id: str
    integration_id: str
    event_type: str
    payload: Dict[str, Any]
    headers: Dict[str, str]
    signature: Optional[str] = None
    verified: bool = False
    processed_at: Optional[datetime] = None
    timestamp: datetime = field(default_factory=datetime.now)

class APIIntegrationHub:
    """Centralized API integration management system"""

    def __init__(self):
        self.integrations: Dict[str, IntegrationConfig] = {}
        self.call_history: List[IntegrationCall] = []
        self.webhook_handlers: Dict[str, Callable] = {}
        self.rate_limiters: Dict[str, Dict[str, List[datetime]]] = {}
        self.session_pool: Dict[str, aiohttp.ClientSession] = {}

    async def register_integration(self, config: IntegrationConfig) -> bool:
        """
        Register a new third-party integration

        Args:
            config: Integration configuration

        Returns:
            Success status
        """
        try:
            # Validate configuration
            await self._validate_integration_config(config)

            # Store configuration
            self.integrations[config.integration_id] = config

            # Initialize session pool for REST APIs
            if config.type in [IntegrationType.REST_API, IntegrationType.GRAPHQL]:
                await self._create_session(config)

            # Initialize rate limiter
            self.rate_limiters[config.integration_id] = {
                'calls': [],
                'last_reset': datetime.now()
            }

            logger.info(f"Registered integration: {config.name} ({config.integration_id})")
            return True

        except Exception as e:
            logger.error(f"Failed to register integration {config.integration_id}: {e}")
            return False

    async def call_integration(self, integration_id: str, method: str = "GET",
                             endpoint: str = "", data: Optional[Dict[str, Any]] = None,
                             headers: Optional[Dict[str, str]] = None) -> Dict[str, Any]:
        """
        Make an API call to a registered integration

        Args:
            integration_id: Integration identifier
            method: HTTP method
            endpoint: API endpoint path
            data: Request data
            headers: Additional headers

        Returns:
            API response
        """
        if integration_id not in self.integrations:
            raise ValueError(f"Integration not found: {integration_id}")

        config = self.integrations[integration_id]

        # Check rate limits
        if not await self._check_rate_limit(config):
            raise Exception(f"Rate limit exceeded for integration: {integration_id}")

        # Prepare request
        start_time = datetime.now()
        call_id = f"call_{integration_id}_{int(start_time.timestamp() * 1000)}"

        try:
            # Build full URL
            base_url = config.endpoint_url.rstrip('/')
            full_url = f"{base_url}/{endpoint.lstrip('/')}" if endpoint else base_url

            # Add query parameters
            if config.query_params:
                from urllib.parse import urlencode
                query_string = urlencode(config.query_params)
                full_url += f"?{query_string}"

            # Prepare headers
            request_headers = dict(config.headers)
            if headers:
                request_headers.update(headers)

            # Add authentication
            await self._add_authentication(config, request_headers, method, full_url, data)

            # Make request based on integration type
            if config.type == IntegrationType.REST_API:
                response = await self._make_rest_call(config, method, full_url, data, request_headers)
            elif config.type == IntegrationType.GRAPHQL:
                response = await self._make_graphql_call(config, full_url, data, request_headers)
            else:
                raise ValueError(f"Unsupported integration type: {config.type}")

            # Record successful call
            duration = int((datetime.now() - start_time).total_seconds() * 1000)
            call_record = IntegrationCall(
                call_id=call_id,
                integration_id=integration_id,
                method=method,
                endpoint=endpoint,
                request_data=data,
                response_data=response.get('data'),
                status_code=response.get('status_code'),
                duration_ms=duration
            )
            self.call_history.append(call_record)
            config.success_count += 1
            config.last_used = datetime.now()

            # Keep only recent history
            self.call_history = self.call_history[-1000:]

            return response

        except Exception as e:
            # Record failed call
            duration = int((datetime.now() - start_time).total_seconds() * 1000)
            call_record = IntegrationCall(
                call_id=call_id,
                integration_id=integration_id,
                method=method,
                endpoint=endpoint,
                request_data=data,
                error_message=str(e),
                duration_ms=duration
            )
            self.call_history.append(call_record)
            config.error_count += 1

            logger.error(f"Integration call failed: {integration_id} - {e}")
            raise

    async def register_webhook_handler(self, integration_id: str,
                                     event_type: str, handler: Callable) -> bool:
        """
        Register a webhook event handler

        Args:
            integration_id: Integration identifier
            event_type: Webhook event type
            handler: Async function to handle the event

        Returns:
            Registration success
        """
        handler_key = f"{integration_id}:{event_type}"
        self.webhook_handlers[handler_key] = handler
        logger.info(f"Registered webhook handler: {handler_key}")
        return True

    async def process_webhook_event(self, integration_id: str, event_type: str,
                                  payload: Dict[str, Any], headers: Dict[str, str],
                                  raw_body: bytes) -> Dict[str, Any]:
        """
        Process an incoming webhook event

        Args:
            integration_id: Integration identifier
            event_type: Event type
            payload: Event payload
            headers: Request headers
            raw_body: Raw request body for signature verification

        Returns:
            Processing result
        """
        if integration_id not in self.integrations:
            raise ValueError(f"Integration not found: {integration_id}")

        config = self.integrations[integration_id]

        # Create webhook event record
        event_id = f"webhook_{integration_id}_{int(datetime.now().timestamp() * 1000)}"
        webhook_event = WebhookEvent(
            event_id=event_id,
            integration_id=integration_id,
            event_type=event_type,
            payload=payload,
            headers=headers
        )

        # Verify webhook signature if configured
        if config.webhook_secret:
            signature = headers.get('X-Signature', headers.get('X-Hub-Signature'))
            if signature:
                webhook_event.verified = self._verify_webhook_signature(
                    raw_body, signature, config.webhook_secret
                )
            else:
                logger.warning(f"No signature provided for webhook: {event_id}")

        # Find and execute handler
        handler_key = f"{integration_id}:{event_type}"
        if handler_key in self.webhook_handlers:
            try:
                handler = self.webhook_handlers[handler_key]
                result = await handler(webhook_event)

                webhook_event.processed_at = datetime.now()

                return {
                    'success': True,
                    'event_id': event_id,
                    'result': result,
                    'verified': webhook_event.verified
                }

            except Exception as e:
                logger.error(f"Webhook handler failed: {handler_key} - {e}")
                return {
                    'success': False,
                    'event_id': event_id,
                    'error': str(e),
                    'verified': webhook_event.verified
                }
        else:
            logger.warning(f"No handler found for webhook: {handler_key}")
            return {
                'success': False,
                'event_id': event_id,
                'error': 'No handler registered for event type',
                'verified': webhook_event.verified
            }

    async def get_integration_status(self, integration_id: str) -> Optional[Dict[str, Any]]:
        """Get detailed status of an integration"""
        if integration_id not in self.integrations:
            return None

        config = self.integrations[integration_id]
        rate_limiter = self.rate_limiters.get(integration_id, {})

        # Calculate current rate limit status
        calls_last_minute = len([
            call_time for call_time in rate_limiter.get('calls', [])
            if datetime.now() - call_time < timedelta(minutes=1)
        ])

        return {
            'integration_id': config.integration_id,
            'name': config.name,
            'type': config.type.value,
            'status': config.status.value,
            'endpoint_url': config.endpoint_url,
            'rate_limit': config.rate_limit,
            'current_usage': calls_last_minute,
            'success_count': config.success_count,
            'error_count': config.error_count,
            'last_used': config.last_used.isoformat() if config.last_used else None,
            'uptime_percentage': self._calculate_uptime_percentage(config)
        }

    def get_integration_metrics(self) -> Dict[str, Any]:
        """Get overall integration hub metrics"""
        total_integrations = len(self.integrations)
        active_integrations = len([
            config for config in self.integrations.values()
            if config.status == IntegrationStatus.ACTIVE
        ])

        total_calls = len(self.call_history)
        successful_calls = len([
            call for call in self.call_history
            if call.status_code and 200 <= call.status_code < 300
        ])

        avg_response_time = 0
        if self.call_history:
            response_times = [call.duration_ms for call in self.call_history if call.duration_ms]
            if response_times:
                avg_response_time = sum(response_times) / len(response_times)

        return {
            'total_integrations': total_integrations,
            'active_integrations': active_integrations,
            'total_api_calls': total_calls,
            'successful_calls': successful_calls,
            'success_rate': (successful_calls / total_calls * 100) if total_calls > 0 else 0,
            'average_response_time_ms': avg_response_time,
            'integrations_by_type': self._count_integrations_by_type(),
            'integrations_by_status': self._count_integrations_by_status()
        }

    async def _validate_integration_config(self, config: IntegrationConfig) -> None:
        """Validate integration configuration"""
        if not config.integration_id or not config.name:
            raise ValueError("Integration ID and name are required")

        if config.type in [IntegrationType.REST_API, IntegrationType.GRAPHQL, IntegrationType.SOAP]:
            if not config.endpoint_url:
                raise ValueError("Endpoint URL is required for API integrations")

        # Test authentication configuration
        if config.authentication != AuthenticationType.NONE:
            required_fields = self._get_auth_required_fields(config.authentication)
            missing_fields = [field for field in required_fields if field not in config.auth_config]
            if missing_fields:
                raise ValueError(f"Missing authentication fields: {missing_fields}")

    def _get_auth_required_fields(self, auth_type: AuthenticationType) -> List[str]:
        """Get required fields for authentication type"""
        auth_fields = {
            AuthenticationType.API_KEY: ['api_key'],
            AuthenticationType.OAUTH2: ['client_id', 'client_secret', 'token_url'],
            AuthenticationType.JWT: ['secret_key'],
            AuthenticationType.BASIC_AUTH: ['username', 'password'],
            AuthenticationType.CERTIFICATE: ['cert_path', 'key_path']
        }
        return auth_fields.get(auth_type, [])

    async def _create_session(self, config: IntegrationConfig) -> None:
        """Create HTTP session for integration"""
        connector = aiohttp.TCPConnector(limit=10, ttl_dns_cache=300)
        timeout = aiohttp.ClientTimeout(total=config.timeout_seconds)

        session = aiohttp.ClientSession(
            connector=connector,
            timeout=timeout,
            headers=config.headers
        )

        self.session_pool[config.integration_id] = session

    async def _add_authentication(self, config: IntegrationConfig, headers: Dict[str, str],
                                method: str, url: str, data: Optional[Dict[str, Any]]) -> None:
        """Add authentication to request headers"""
        if config.authentication == AuthenticationType.API_KEY:
            api_key = config.auth_config.get('api_key')
            if api_key:
                headers['Authorization'] = f"Bearer {api_key}"

        elif config.authentication == AuthenticationType.BASIC_AUTH:
            import base64
            username = config.auth_config.get('username', '')
            password = config.auth_config.get('password', '')
            credentials = base64.b64encode(f"{username}:{password}".encode()).decode()
            headers['Authorization'] = f"Basic {credentials}"

        elif config.authentication == AuthenticationType.OAUTH2:
            # Implement OAuth2 token refresh logic
            token = await self._get_oauth_token(config)
            if token:
                headers['Authorization'] = f"Bearer {token}"

    async def _get_oauth_token(self, config: IntegrationConfig) -> Optional[str]:
        """Get OAuth2 access token"""
        # Simplified OAuth2 implementation
        # In production, this would handle token refresh, caching, etc.
        auth_config = config.auth_config
        token_url = auth_config.get('token_url')

        if not token_url:
            return None

        payload = {
            'grant_type': 'client_credentials',
            'client_id': auth_config.get('client_id'),
            'client_secret': auth_config.get('client_secret')
        }

        try:
            async with aiohttp.ClientSession() as session:
                async with session.post(token_url, data=payload) as response:
                    if response.status == 200:
                        data = await response.json()
                        return data.get('access_token')
        except Exception as e:
            logger.error(f"OAuth2 token request failed: {e}")

        return None

    async def _check_rate_limit(self, config: IntegrationConfig) -> bool:
        """Check if request is within rate limits"""
        rate_limiter = self.rate_limiters.get(config.integration_id)
        if not rate_limiter:
            return True

        now = datetime.now()
        calls = rate_limiter['calls']

        # Clean old calls (older than 1 minute)
        calls[:] = [call_time for call_time in calls if now - call_time < timedelta(minutes=1)]

        # Check if under limit
        if len(calls) >= config.rate_limit:
            return False

        # Add current call
        calls.append(now)
        return True

    async def _make_rest_call(self, config: IntegrationConfig, method: str, url: str,
                            data: Optional[Dict[str, Any]], headers: Dict[str, str]) -> Dict[str, Any]:
        """Make REST API call"""
        session = self.session_pool.get(config.integration_id)
        if not session:
            raise Exception(f"No session available for integration: {config.integration_id}")

        # Prepare request data
        json_data = json.dumps(data) if data else None

        async with session.request(method, url, data=json_data, headers=headers) as response:
            response_data = await response.json() if response.content_type == 'application/json' else await response.text()

            return {
                'status_code': response.status,
                'headers': dict(response.headers),
                'data': response_data if isinstance(response_data, dict) else {'text': response_data}
            }

    async def _make_graphql_call(self, config: IntegrationConfig, url: str,
                               data: Optional[Dict[str, Any]], headers: Dict[str, str]) -> Dict[str, Any]:
        """Make GraphQL API call"""
        if not data or 'query' not in data:
            raise ValueError("GraphQL request must include 'query' field")

        graphql_payload = {
            'query': data['query'],
            'variables': data.get('variables', {}),
            'operationName': data.get('operationName')
        }

        return await self._make_rest_call(config, 'POST', url, graphql_payload, headers)

    def _verify_webhook_signature(self, body: bytes, signature: str, secret: str) -> bool:
        """Verify webhook signature"""
        try:
            # GitHub-style signature verification
            if signature.startswith('sha256='):
                expected_signature = hmac.new(
                    secret.encode(),
                    body,
                    hashlib.sha256
                ).hexdigest()
                provided_signature = signature[7:]  # Remove 'sha256=' prefix
                return hmac.compare_digest(expected_signature, provided_signature)
            else:
                # Simple HMAC verification
                expected_signature = hmac.new(
                    secret.encode(),
                    body,
                    hashlib.sha256
                ).hexdigest()
                return hmac.compare_digest(expected_signature, signature)

        except Exception as e:
            logger.error(f"Webhook signature verification failed: {e}")
            return False

    def _calculate_uptime_percentage(self, config: IntegrationConfig) -> float:
        """Calculate integration uptime percentage"""
        total_calls = config.success_count + config.error_count
        if total_calls == 0:
            return 100.0

        return (config.success_count / total_calls) * 100

    def _count_integrations_by_type(self) -> Dict[str, int]:
        """Count integrations by type"""
        type_counts = {}
        for config in self.integrations.values():
            type_name = config.type.value
            type_counts[type_name] = type_counts.get(type_name, 0) + 1
        return type_counts

    def _count_integrations_by_status(self) -> Dict[str, int]:
        """Count integrations by status"""
        status_counts = {}
        for config in self.integrations.values():
            status_name = config.status.value
            status_counts[status_name] = status_counts.get(status_name, 0) + 1
        return status_counts

# Global instance
api_integration_hub = APIIntegrationHub()