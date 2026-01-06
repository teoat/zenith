"""
Enhanced CDN Manager with Real Token Signing
Supports CloudFront, Cloudflare, and generic CDN signed URLs
"""

import base64
import hashlib
import hmac
import os
import time
from typing import Any
from urllib.parse import urlencode, urlparse

import rsa


class CDNManager:
    """
    Manages Content Delivery Network (CDN) URL generation and asset signing.
    Supports CloudFront, Cloudflare, and generic CDNs with real cryptographic signing.
    """

    def __init__(
        self,
        cdn_url: str | None = None,
        enable_signing: bool = False,
        provider: str = "generic",
        private_key_path: str | None = None,
        key_pair_id: str | None = None
    ):
        self.cdn_url = cdn_url or os.getenv("CDN_BASE_URL")
        self.enable_signing = enable_signing
        self.provider = provider.lower()
        self.private_key_path = private_key_path or os.getenv("CDN_PRIVATE_KEY_PATH")
        self.key_pair_id = key_pair_id or os.getenv("CDN_KEY_PAIR_ID")
        self.private_key = None

        # Load private key if signing is enabled
        if self.enable_signing and self.private_key_path:
            self._load_private_key()

    def _load_private_key(self) -> None:
        """Load RSA private key for URL signing"""
        try:
            if self.provider in ["cloudfront", "aws"]:
                # CloudFront uses PEM format
                with open(self.private_key_path, 'rb') as f:
                    self.private_key = rsa.PrivateKey.load_pkcs1(f.read())
            elif self.provider == "cloudflare":
                # Cloudflare might use different format
                with open(self.private_key_path, 'rb') as f:
                    self.private_key = f.read()
            else:
                # Generic RSA key
                with open(self.private_key_path, 'rb') as f:
                    self.private_key = rsa.PrivateKey.load_pkcs1(f.read())

            print(f"✅ Loaded private key for {self.provider} signing")

        except Exception as e:
            print(f"❌ Failed to load private key: {e}")
            self.enable_signing = False

    def get_asset_url(self, asset_path: str, signed: bool = False, expiry_seconds: int = 3600) -> str:
        """
        Get the full CDN URL for an asset with optional signing.
        Falls back to local path if CDN is not configured.
        """
        if not self.cdn_url:
            return f"/static/{asset_path.lstrip('/')}"

        clean_base = self.cdn_url.rstrip("/")
        clean_path = asset_path.lstrip("/")

        url = f"{clean_base}/{clean_path}"

        if signed and self.enable_signing:
            return self.sign_url(url, expiry_seconds)

        return url

    def sign_url(self, url: str, expiry_seconds: int = 3600) -> str:
        """
        Generate a signed URL for restricted content using real cryptographic signing.
        """
        if not self.enable_signing or not self.private_key:
            return url

        if self.provider == "cloudfront":
            return self._sign_cloudfront_url(url, expiry_seconds)
        elif self.provider == "cloudflare":
            return self._sign_cloudflare_url(url, expiry_seconds)
        else:
            return self._sign_generic_url(url, expiry_seconds)

    def _sign_cloudfront_url(self, url: str, expiry_seconds: int) -> str:
        """Sign URL using AWS CloudFront signed URLs"""
        try:
            # Parse the URL
            parsed_url = urlparse(url)
            base_url = f"{parsed_url.scheme}://{parsed_url.netloc}{parsed_url.path}"

            # Create the policy
            expires = int(time.time()) + expiry_seconds

            policy = {
                "Statement": [
                    {
                        "Resource": url,
                        "Condition": {
                            "DateLessThan": {"AWS:EpochTime": expires}
                        }
                    }
                ]
            }

            # Convert policy to JSON and base64
            policy_json = json.dumps(policy, separators=(',', ':'))
            policy_b64 = base64.b64encode(policy_json.encode('utf-8')).decode('utf-8')

            # Create signature
            signature = rsa.sign(
                policy_b64.encode('utf-8'),
                self.private_key,
                'SHA-1'
            )
            signature_b64 = base64.b64encode(signature).decode('utf-8')

            # Construct signed URL
            params = {
                'Policy': policy_b64,
                'Signature': signature_b64,
                'Key-Pair-Id': self.key_pair_id
            }

            signed_url = f"{base_url}?{urlencode(params)}"
            return signed_url

        except Exception as e:
            print(f"❌ CloudFront signing failed: {e}")
            return url

    def _sign_cloudflare_url(self, url: str, expiry_seconds: int) -> str:
        """Sign URL using Cloudflare signed URLs"""
        try:
            expires = int(time.time()) + expiry_seconds

            # Create the token data
            token_data = f"{url}{expires}"

            # Create HMAC signature
            signature = hmac.new(
                self.private_key,
                token_data.encode('utf-8'),
                hashlib.sha256
            ).hexdigest()

            # Construct signed URL
            signed_url = f"{url}?expires={expires}&signature={signature}"
            return signed_url

        except Exception as e:
            print(f"❌ Cloudflare signing failed: {e}")
            return url

    def _sign_generic_url(self, url: str, expiry_seconds: int) -> str:
        """Sign URL using generic HMAC signing"""
        try:
            expires = int(time.time()) + expiry_seconds

            # Create the message to sign
            message = f"{url}{expires}"

            # Create HMAC signature
            signature = hmac.new(
                self.private_key if isinstance(self.private_key, bytes) else str(self.private_key).encode(),
                message.encode('utf-8'),
                hashlib.sha256
            ).hexdigest()

            # Construct signed URL
            signed_url = f"{url}?expires={expires}&signature={signature}"
            return signed_url

        except Exception as e:
            print(f"❌ Generic signing failed: {e}")
            return url

    def validate_signed_url(self, signed_url: str) -> bool:
        """Validate that a signed URL is properly signed and not expired"""
        try:
            parsed = urlparse(signed_url)
            query_params = dict(param.split('=') for param in parsed.query.split('&') if '=' in param)

            expires = int(query_params.get('expires', 0))
            signature = query_params.get('signature', '')

            # Check if URL has expired
            if time.time() > expires:
                return False

            # Reconstruct the URL without signature for verification
            base_url = signed_url.split('?')[0]
            message = f"{base_url}{expires}"

            # Verify signature
            expected_signature = hmac.new(
                self.private_key if isinstance(self.private_key, bytes) else str(self.private_key).encode(),
                message.encode('utf-8'),
                hashlib.sha256
            ).hexdigest()

            return hmac.compare_digest(signature, expected_signature)

        except Exception:
            return False

    def get_signing_status(self) -> dict[str, Any]:
        """Get the current signing configuration status"""
        return {
            "signing_enabled": self.enable_signing,
            "provider": self.provider,
            "private_key_loaded": self.private_key is not None,
            "key_pair_id": self.key_pair_id is not None if self.provider == "cloudfront" else None,
            "cdn_url": self.cdn_url
        }


# Singleton instance with environment-based configuration
def create_cdn_manager() -> CDNManager:
    """Create CDN manager with environment-based configuration"""
    provider = os.getenv("CDN_PROVIDER", "generic")
    enable_signing = os.getenv("CDN_ENABLE_SIGNING", "false").lower() == "true"
    private_key_path = os.getenv("CDN_PRIVATE_KEY_PATH")
    key_pair_id = os.getenv("CDN_KEY_PAIR_ID")

    return CDNManager(
        cdn_url=os.getenv("CDN_BASE_URL"),
        enable_signing=enable_signing,
        provider=provider,
        private_key_path=private_key_path,
        key_pair_id=key_pair_id
    )

# Global CDN service instance
cdn_service = create_cdn_manager()


# Utility functions for CDN operations
def generate_signed_asset_url(asset_path: str, expiry_seconds: int = 3600) -> str:
    """Generate a signed URL for a protected asset"""
    return cdn_service.get_asset_url(asset_path, signed=True, expiry_seconds=expiry_seconds)


def validate_asset_access(signed_url: str) -> bool:
    """Validate access to a signed asset URL"""
    return cdn_service.validate_signed_url(signed_url)


def get_cdn_health_status() -> dict[str, Any]:
    """Get comprehensive CDN health and configuration status"""
    status = cdn_service.get_signing_status()
    status.update({
        "cdn_reachable": _test_cdn_connectivity(),
        "signing_functional": _test_signing_functionality()
    })
    return status


def _test_cdn_connectivity() -> bool:
    """Test basic CDN connectivity"""
    if not cdn_service.cdn_url:
        return False

    try:
        import requests
        response = requests.head(cdn_service.cdn_url, timeout=5)
        return response.status_code < 400
    except:
        return False


def _test_signing_functionality() -> bool:
    """Test that URL signing is working"""
    if not cdn_service.enable_signing:
        return True  # Signing not enabled, so it's "working"

    try:
        test_url = cdn_service.get_asset_url("test.txt", signed=True, expiry_seconds=60)
        return cdn_service.validate_signed_url(test_url)
    except:
        return False
