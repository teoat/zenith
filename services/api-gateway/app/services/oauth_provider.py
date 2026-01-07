"""
OAuth 2.0 Provider Implementation
"""

import secrets
import time
from typing import Dict, Optional, List
from dataclasses import dataclass
import structlog

logger = structlog.get_logger()


@dataclass
class OAuthClient:
    """OAuth client configuration"""

    client_id: str
    client_secret: str
    redirect_uris: List[str]
    scopes: List[str]
    grant_types: List[str]


@dataclass
class AuthorizationCode:
    """OAuth authorization code"""

    code: str
    client_id: str
    user_id: str
    redirect_uri: str
    scopes: List[str]
    expires_at: int
    code_challenge: Optional[str] = None
    code_challenge_method: Optional[str] = None


@dataclass
class AccessToken:
    """OAuth access token"""

    token: str
    token_type: str
    client_id: str
    user_id: str
    scopes: List[str]
    expires_at: int
    refresh_token: Optional[str] = None


@dataclass
class RefreshToken:
    """OAuth refresh token"""

    token: str
    client_id: str
    user_id: str
    scopes: List[str]
    expires_at: int


class OAuthProvider:
    """OAuth 2.0 Authorization Server Implementation"""

    def __init__(self):
        self.clients: Dict[str, OAuthClient] = {}
        self.auth_codes: Dict[str, AuthorizationCode] = {}
        self.access_tokens: Dict[str, AccessToken] = {}
        self.refresh_tokens: Dict[str, RefreshToken] = {}

        # Initialize with default client
        self._register_default_client()

    def _register_default_client(self):
        """Register default Zenith client"""
        default_client = OAuthClient(
            client_id="zenith-client",
            client_secret="zenith-secret-key-change-in-production",
            redirect_uris=[
                "http://localhost:3000/auth/callback",
                "https://zenith.vercel.app/auth/callback",
            ],
            scopes=["read", "write", "profile", "cases"],
            grant_types=["authorization_code", "refresh_token"],
        )
        self.clients[default_client.client_id] = default_client

    def register_client(
        self,
        client_id: str,
        client_secret: str,
        redirect_uris: List[str],
        scopes: List[str],
        grant_types: Optional[List[str]] = None,
    ) -> OAuthClient:
        """Register a new OAuth client"""
        if grant_types is None:
            grant_types = ["authorization_code", "refresh_token"]

        client = OAuthClient(
            client_id=client_id,
            client_secret=client_secret,
            redirect_uris=redirect_uris,
            scopes=scopes,
            grant_types=grant_types,
        )

        self.clients[client_id] = client
        logger.info("OAuth client registered", client_id=client_id)
        return client

    def validate_client(
        self, client_id: str, client_secret: Optional[str] = None
    ) -> bool:
        """Validate client credentials"""
        client = self.clients.get(client_id)
        if not client:
            return False

        if client_secret and client.client_secret != client_secret:
            return False

        return True

    def create_authorization_code(
        self,
        client_id: str,
        user_id: str,
        redirect_uri: str,
        scopes: List[str],
        code_challenge: Optional[str] = None,
        code_challenge_method: Optional[str] = None,
    ) -> str:
        """Create authorization code"""
        if not self.validate_client(client_id):
            raise ValueError("Invalid client")

        code = secrets.token_urlsafe(32)
        expires_at = int(time.time()) + 600  # 10 minutes

        auth_code = AuthorizationCode(
            code=code,
            client_id=client_id,
            user_id=user_id,
            redirect_uri=redirect_uri,
            scopes=scopes,
            expires_at=expires_at,
            code_challenge=code_challenge,
            code_challenge_method=code_challenge_method,
        )

        self.auth_codes[code] = auth_code
        logger.info("Authorization code created", client_id=client_id, user_id=user_id)
        return code

    def validate_authorization_code(
        self, code: str, client_id: str, redirect_uri: str
    ) -> Optional[AuthorizationCode]:
        """Validate authorization code"""
        auth_code = self.auth_codes.get(code)
        if not auth_code:
            return None

        # Check expiration
        if time.time() > auth_code.expires_at:
            del self.auth_codes[code]
            return None

        # Validate client and redirect URI
        if auth_code.client_id != client_id or auth_code.redirect_uri != redirect_uri:
            return None

        return auth_code

    def exchange_code_for_token(
        self,
        code: str,
        client_id: str,
        client_secret: str,
        redirect_uri: str,
        code_verifier: Optional[str] = None,
    ) -> AccessToken:
        """Exchange authorization code for access token"""
        # Validate client
        if not self.validate_client(client_id, client_secret):
            raise ValueError("Invalid client credentials")

        # Validate authorization code
        auth_code = self.validate_authorization_code(code, client_id, redirect_uri)
        if not auth_code:
            raise ValueError("Invalid authorization code")

        # Validate PKCE if present
        if auth_code.code_challenge:
            if not code_verifier:
                raise ValueError("Code verifier required")
            # In production, validate code challenge
            # self._validate_code_challenge(code_verifier, auth_code.code_challenge, auth_code.code_challenge_method)

        # Clean up used code
        del self.auth_codes[code]

        # Generate tokens
        access_token = self._generate_access_token(auth_code)
        refresh_token = self._generate_refresh_token(auth_code)

        access_token.refresh_token = refresh_token.token
        self.refresh_tokens[refresh_token.token] = refresh_token

        logger.info("Tokens issued", client_id=client_id, user_id=auth_code.user_id)
        return access_token

    def refresh_access_token(
        self, refresh_token_str: str, client_id: str, client_secret: str
    ) -> AccessToken:
        """Refresh access token using refresh token"""
        # Validate client
        if not self.validate_client(client_id, client_secret):
            raise ValueError("Invalid client credentials")

        # Validate refresh token
        refresh_token = self.refresh_tokens.get(refresh_token_str)
        if not refresh_token:
            raise ValueError("Invalid refresh token")

        if time.time() > refresh_token.expires_at:
            del self.refresh_tokens[refresh_token_str]
            raise ValueError("Refresh token expired")

        if refresh_token.client_id != client_id:
            raise ValueError("Client mismatch")

        # Create new access token
        access_token = self._generate_access_token_from_refresh(refresh_token)
        logger.info(
            "Access token refreshed", client_id=client_id, user_id=refresh_token.user_id
        )
        return access_token

    def validate_access_token(self, token: str) -> Optional[Dict[str, str]]:
        """Validate access token and return claims"""
        access_token = self.access_tokens.get(token)
        if not access_token:
            return None

        if time.time() > access_token.expires_at:
            del self.access_tokens[token]
            return None

        return {
            "client_id": access_token.client_id,
            "user_id": access_token.user_id,
            "scopes": ",".join(access_token.scopes),
            "token_type": access_token.token_type,
        }

    def revoke_token(self, token: str, token_type: str = "access_token"):
        """Revoke access or refresh token"""
        if token_type == "access_token":
            if token in self.access_tokens:
                del self.access_tokens[token]
                logger.info("Access token revoked")
        elif token_type == "refresh_token":
            if token in self.refresh_tokens:
                del self.refresh_tokens[token]
                logger.info("Refresh token revoked")

    def _generate_access_token(self, auth_code: AuthorizationCode) -> AccessToken:
        """Generate access token from authorization code"""
        token = secrets.token_urlsafe(32)
        expires_at = int(time.time()) + 3600  # 1 hour

        access_token = AccessToken(
            token=token,
            token_type="Bearer",
            client_id=auth_code.client_id,
            user_id=auth_code.user_id,
            scopes=auth_code.scopes,
            expires_at=expires_at,
        )

        self.access_tokens[token] = access_token
        return access_token

    def _generate_access_token_from_refresh(
        self, refresh_token: RefreshToken
    ) -> AccessToken:
        """Generate access token from refresh token"""
        token = secrets.token_urlsafe(32)
        expires_at = int(time.time()) + 3600  # 1 hour

        access_token = AccessToken(
            token=token,
            token_type="Bearer",
            client_id=refresh_token.client_id,
            user_id=refresh_token.user_id,
            scopes=refresh_token.scopes,
            expires_at=expires_at,
        )

        self.access_tokens[token] = access_token
        return access_token

    def _generate_refresh_token(self, auth_code: AuthorizationCode) -> RefreshToken:
        """Generate refresh token"""
        token = secrets.token_urlsafe(32)
        expires_at = int(time.time()) + 2592000  # 30 days

        refresh_token = RefreshToken(
            token=token,
            client_id=auth_code.client_id,
            user_id=auth_code.user_id,
            scopes=auth_code.scopes,
            expires_at=expires_at,
        )

        return refresh_token

    def get_authorization_url(
        self,
        client_id: str,
        redirect_uri: str,
        scope: str,
        state: Optional[str] = None,
        code_challenge: Optional[str] = None,
        code_challenge_method: Optional[str] = "S256",
    ) -> str:
        """Generate authorization URL"""
        base_url = "https://zenith.vercel.app/oauth/authorize"
        params = [
            f"client_id={client_id}",
            f"redirect_uri={redirect_uri}",
            f"scope={scope}",
            f"response_type=code",
        ]

        if state:
            params.append(f"state={state}")
        if code_challenge:
            params.append(f"code_challenge={code_challenge}")
            params.append(f"code_challenge_method={code_challenge_method}")

        return f"{base_url}?{'&'.join(params)}"
