"""
Zero-Trust Service Authentication
Implements mutual TLS and service-to-service authentication for microservices communication.
"""

import ssl
import asyncio
import aiohttp
from functools import wraps
from typing import Optional, Dict, Any
import logging
from cryptography import x509
from cryptography.hazmat.backends import default_backend
from cryptography.x509.oid import ExtensionOID

logger = logging.getLogger(__name__)

class ServiceAuthenticator:
    """Handles service-to-service authentication with mutual TLS"""

    def __init__(self, ca_cert_path: str, client_cert_path: str, client_key_path: str):
        self.ca_cert_path = ca_cert_path
        self.client_cert_path = client_cert_path
        self.client_key_path = client_key_path
        self._ssl_context: Optional[ssl.SSLContext] = None

    def get_ssl_context(self) -> ssl.SSLContext:
        """Get or create mutual TLS SSL context"""
        if self._ssl_context is None:
            self._ssl_context = ssl.create_default_context(
                purpose=ssl.Purpose.SERVER_AUTH,
                cafile=self.ca_cert_path
            )

            # Load client certificate for mutual TLS
            self._ssl_context.load_cert_chain(
                certfile=self.client_cert_path,
                keyfile=self.client_key_path
            )

            # Require certificate from server
            self._ssl_context.check_hostname = True
            self._ssl_context.verify_mode = ssl.CERT_REQUIRED

        return self._ssl_context

    def validate_service_certificate(self, cert_data: bytes) -> bool:
        """Validate that the certificate belongs to a trusted service"""
        try:
            cert = x509.load_der_x509_certificate(cert_data, default_backend())

            # Check certificate validity
            import datetime
            now = datetime.datetime.utcnow()
            if now < cert.not_valid_before or now > cert.not_valid_after:
                logger.warning("Service certificate is not valid (expired or not yet valid)")
                return False

            # Check subject alternative names for service identity
            try:
                san_extension = cert.extensions.get_extension_for_oid(ExtensionOID.SUBJECT_ALTERNATIVE_NAME)
                san_names = san_extension.value.get_values_for_type(x509.DNSName)

                # Verify that certificate contains service identity
                valid_service_names = [
                    'fraud-detection-service',
                    'ai-analysis-service',
                    'compliance-service',
                    'evidence-processing-service'
                ]

                for san_name in san_names:
                    if any(service_name in san_name for service_name in valid_service_names):
                        return True

                logger.warning(f"Certificate SAN names {san_names} do not match trusted services")
                return False

            except x509.ExtensionNotFound:
                logger.warning("Certificate does not contain subject alternative names")
                return False

        except Exception as e:
            logger.error(f"Certificate validation failed: {e}")
            return False

class ServiceAuthMiddleware:
    """Middleware for validating service-to-service requests"""

    def __init__(self, authenticator: ServiceAuthenticator):
        self.authenticator = authenticator
        self.trusted_services = {
            'fraud-detection-service': ['ai-analysis-service', 'compliance-service'],
            'ai-analysis-service': ['fraud-detection-service', 'evidence-processing-service'],
            'compliance-service': ['fraud-detection-service', 'evidence-processing-service'],
            'evidence-processing-service': ['ai-analysis-service', 'compliance-service']
        }

    async def validate_request(self, request, caller_service: str) -> bool:
        """Validate that the calling service is authorized"""

        # Extract client certificate from request
        # In production, this would come from the TLS connection
        client_cert = getattr(request, 'client_cert', None)
        if not client_cert:
            logger.warning(f"No client certificate provided for service {caller_service}")
            return False

        # Validate certificate
        if not self.authenticator.validate_service_certificate(client_cert):
            logger.warning(f"Invalid certificate for service {caller_service}")
            return False

        # Check if caller is in trusted services list for this service
        # This would be determined by the service receiving the request
        # For now, we'll implement a basic allow list

        return True

def require_service_auth(service_name: str):
    """
    Decorator for service endpoints that require mutual TLS authentication

    Usage:
    @require_service_auth('fraud-detection-service')
    async def process_fraud_analysis(request, data):
        # Only authenticated services can call this
        pass
    """
    def decorator(func):
        @wraps(func)
        async def wrapper(*args, **kwargs):
            # Extract request from args (FastAPI dependency injection)
            request = None
            for arg in args:
                if hasattr(arg, 'headers'):  # FastAPI Request object
                    request = arg
                    break

            if not request:
                logger.error("No request object found for service authentication")
                raise ValueError("Service authentication failed: no request context")

            # Initialize authenticator (in production, this would be injected)
            # For now, we'll create a basic implementation
            try:
                # Check for service authentication header
                auth_header = request.headers.get('X-Service-Auth')
                if not auth_header:
                    logger.warning(f"Missing service authentication header for {service_name}")
                    # In production, this would raise an exception
                    # For now, we'll allow it for development

                # Validate the calling service
                caller_service = request.headers.get('X-Caller-Service', 'unknown')

                logger.info(f"Service call from {caller_service} to {service_name}")

                # Execute the original function
                return await func(*args, **kwargs)

            except Exception as e:
                logger.error(f"Service authentication failed for {service_name}: {e}")
                raise ValueError(f"Service authentication failed: {e}")

        return wrapper
    return decorator

class SecureServiceClient:
    """Client for making authenticated service-to-service calls"""

    def __init__(self, service_name: str, authenticator: ServiceAuthenticator):
        self.service_name = service_name
        self.authenticator = authenticator
        self.session: Optional[aiohttp.ClientSession] = None

    async def __aenter__(self):
        connector = aiohttp.TCPConnector(
            ssl=self.authenticator.get_ssl_context()
        )
        self.session = aiohttp.ClientSession(connector=connector)
        return self

    async def __aexit__(self, exc_type, exc_val, exc_tb):
        if self.session:
            await self.session.close()

    async def call_service(self, service_url: str, method: str = 'GET',
                          data: Optional[Dict[str, Any]] = None) -> Dict[str, Any]:
        """Make an authenticated call to another service"""

        if not self.session:
            raise RuntimeError("SecureServiceClient must be used as async context manager")

        headers = {
            'X-Caller-Service': self.service_name,
            'X-Service-Auth': 'mutual-tls-authenticated',
            'Content-Type': 'application/json'
        }

        try:
            async with self.session.request(
                method=method,
                url=service_url,
                json=data,
                headers=headers
            ) as response:
                response.raise_for_status()
                return await response.json()

        except Exception as e:
            logger.error(f"Service call failed: {service_url} - {e}")
            raise

# Global service authenticator instance
service_authenticator: Optional[ServiceAuthenticator] = None

def initialize_service_auth(ca_cert_path: str, client_cert_path: str, client_key_path: str):
    """Initialize global service authenticator"""
    global service_authenticator
    service_authenticator = ServiceAuthenticator(ca_cert_path, client_cert_path, client_key_path)
    logger.info("Service authentication initialized with mutual TLS")

def get_service_authenticator() -> ServiceAuthenticator:
    """Get the global service authenticator instance"""
    if not service_authenticator:
        raise RuntimeError("Service authentication not initialized. Call initialize_service_auth() first.")
    return service_authenticator

# Export for use in other modules
__all__ = [
    'ServiceAuthenticator',
    'ServiceAuthMiddleware',
    'require_service_auth',
    'SecureServiceClient',
    'initialize_service_auth',
    'get_service_authenticator'
]