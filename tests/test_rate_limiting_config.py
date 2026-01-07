from backend.core.rate_limiting import get_rate_limit_for_path


def test_auth_rate_limits_configuration():
    """
    Verify that authentication endpoints have strict rate limits applied correctly
    via the API V1 path prefix.
    """
    # Test paths
    login_path = "/api/v1/auth/login"
    register_path = "/api/v1/auth/register"
    token_path = "/api/v1/auth/token"

    # Get limits
    login_limits = get_rate_limit_for_path(login_path)
    register_limits = get_rate_limit_for_path(register_path)
    token_limits = get_rate_limit_for_path(token_path)

    # Verify Login Limits (5 requests per 300s)
    assert login_limits["requests"] == 5, (
        f"Expected 5 requests for login, got {login_limits['requests']}"
    )
    assert login_limits["window"] == 300, (
        f"Expected 300s window for login, got {login_limits['window']}"
    )

    # Verify Register Limits (3 requests per 3600s)
    assert register_limits["requests"] == 3, (
        f"Expected 3 requests for register, got {register_limits['requests']}"
    )
    assert register_limits["window"] == 3600, (
        f"Expected 3600s window for register, got {register_limits['window']}"
    )

    # Verify Token Limits (10 requests per 300s)
    assert token_limits["requests"] == 10, (
        f"Expected 10 requests for token, got {token_limits['requests']}"
    )
    assert token_limits["window"] == 300, (
        f"Expected 300s window for token, got {token_limits['window']}"
    )


def test_default_rate_limits():
    """
    Verify that other endpoints get the default or specific moderate limits.
    """
    # Test generic API path
    api_path = "/api/v1/some/random/endpoint"
    limits = get_rate_limit_for_path(api_path)

    # Should fall back to /api/v1 prefix limit (100 requests per 60s)
    assert limits["requests"] == 100
    assert limits["window"] == 60
