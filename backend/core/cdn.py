from typing import Optional
import os

class CDNManager:
    """
    Manages Content Delivery Network (CDN) URL generation and asset signing.
    Supports integration with Cloudflare, AWS CloudFront, or generic CDNs.
    """
    def __init__(self, cdn_url: Optional[str] = None, enable_signing: bool = False):
        self.cdn_url = cdn_url or os.getenv("CDN_BASE_URL")
        self.enable_signing = enable_signing

    def get_asset_url(self, asset_path: str) -> str:
        """
        Get the full CDN URL for an asset.
        Falls back to local path if CDN is not configured.
        """
        if not self.cdn_url:
            return f"/static/{asset_path.lstrip('/')}"
            
        clean_base = self.cdn_url.rstrip("/")
        clean_path = asset_path.lstrip("/")
        
        return f"{clean_base}/{clean_path}"

    def sign_url(self, url: str, expiry_seconds: int = 3600) -> str:
        """
        Generate a signed URL for restricted content.
        (Placeholder for CloudFront/Cloudflare signing logic)
        """
        if not self.enable_signing:
            return url
            
        # Implementation would use RSA private key to sign the URL
        # e.g., using boto3 for CloudFront or generic HMAC
        return f"{url}?token=signed_token_placeholder"

# Singleton instance
cdn_service = CDNManager()
