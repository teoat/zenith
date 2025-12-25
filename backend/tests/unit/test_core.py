"""Unit tests for core modules"""

from unittest.mock import MagicMock, patch

import pytest
from starlette.requests import Request
from starlette.responses import JSONResponse

from core.config import Settings
from core.logging import log_error, log_request, log_security_event, setup_logging
from core.metrics import PrometheusMiddleware
from core.validation import (
    InputValidationMiddleware,
    sanitize_string,
    validate_filename,
)


class TestSettings:
    """Test configuration settings"""

    def test_settings_initialization(self):
        """Test settings object creation"""
        settings = Settings()
        assert settings.PROJECT_NAME == "Zenith Fraud Detection"
        assert settings.API_V1_STR == "/api/v1"
        assert settings.JWT_ACCESS_TOKEN_EXPIRE_MINUTES == 30

    @patch.dict("os.environ", {"SECRET_KEY": "test-secret"})
    def test_settings_with_env(self):
        """Test settings with environment variables"""
        settings = Settings()
        assert settings.SECRET_KEY == "test-secret"


class TestLogging:
    """Test logging functionality"""

    def test_setup_logging(self):
        """Test logging setup"""
        logger = setup_logging(level="INFO", format_type="json")
        assert logger is not None
        assert logger.level == 20  # INFO level

    def test_log_request(self):
        """Test request logging"""
        with patch("core.logging.logger") as mock_logger:
            log_request("req-123", "GET", "/api/test", 200, 0.5, "user-123")
            mock_logger.info.assert_called_once()

    def test_log_error(self):
        """Test error logging"""
        with patch("core.logging.logger") as mock_logger:
            log_error("test_error", "Test error message", {"details": "test"})
            mock_logger.error.assert_called_once()

    def test_log_security_event(self):
        """Test security event logging"""
        with patch("core.logging.logger") as mock_logger:
            log_security_event("login_failed", "user-123", "192.168.1.1")
            mock_logger.warning.assert_called_once()


class TestValidation:
    """Test input validation"""

    @pytest.fixture
    def middleware(self):
        """Create validation middleware instance"""
        from unittest.mock import MagicMock

        mock_app = MagicMock()
        return InputValidationMiddleware(mock_app)

    def test_sanitize_string(self):
        """Test string sanitization"""
        result = sanitize_string("<script>alert('xss')</script>")
        assert result == "&lt;script&gt;alert(&#x27;xss&#x27;)&lt;/script&gt;"

    def test_validate_filename_valid(self):
        """Test valid filename validation"""
        assert validate_filename("test_file.pdf") == True
        assert validate_filename("my-document.docx") == True

    def test_validate_filename_invalid(self):
        """Test invalid filename validation"""
        assert validate_filename("../etc/passwd") == False
        assert validate_filename("file with spaces.txt") == False
        assert validate_filename("file<script>.txt") == False
        assert validate_filename("very_long_filename_" + "x" * 256) == False

    @pytest.mark.asyncio
    async def test_sql_injection_detection(self, middleware):
        """Test SQL injection pattern detection"""
        # Create mock request with SQL injection
        mock_request = MagicMock(spec=Request)
        mock_request.method = "POST"
        mock_request.headers = {"content-type": "application/json"}
        mock_request.body.return_value = (
            b'{"query": "SELECT * FROM users WHERE id = 1 OR 1=1"}'
        )

        with pytest.raises(Exception):  # Should raise HTTPException
            await middleware.dispatch(mock_request, lambda r: JSONResponse({}))

    @pytest.mark.asyncio
    async def test_xss_detection(self, middleware):
        """Test XSS pattern detection"""
        mock_request = MagicMock(spec=Request)
        mock_request.method = "POST"
        mock_request.headers = {"content-type": "application/json"}
        mock_request.body.return_value = b'{"data": "<script>alert(\'xss\')</script>"}'

        with pytest.raises(Exception):  # Should raise HTTPException
            await middleware.dispatch(mock_request, lambda r: JSONResponse({}))


class TestMetrics:
    """Test metrics collection"""

    @pytest.fixture
    def middleware(self):
        """Create metrics middleware instance"""
        return PrometheusMiddleware()

    @pytest.mark.asyncio
    async def test_metrics_middleware(self, middleware):
        """Test metrics middleware functionality"""
        mock_request = MagicMock(spec=Request)
        mock_request.method = "GET"
        mock_request.url = MagicMock()
        mock_request.url.path = "/api/test"

        response = JSONResponse({"status": "ok"})

        async def call_next(r):
            return response

        result = await middleware.dispatch(mock_request, call_next)
        assert result == response
