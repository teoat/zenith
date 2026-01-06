"""
Production Configuration
Environment-specific settings for production deployment
"""

import os

from pydantic import BaseModel


class SecurityConfig(BaseModel):
    """Security configuration for production"""

    # JWT Settings
    jwt_secret_key: str = os.getenv(
        "JWT_SECRET_KEY", "development-jwt-key-replace-in-production"
    )
    jwt_algorithm: str = "HS256"
    access_token_expire_minutes: int = 30  # Short-lived tokens
    refresh_token_expire_days: int = 7

    # Session Settings
    session_timeout_minutes: int = 15  # Auto-logout after 15 min inactivity
    admin_session_timeout_minutes: int = 10  # Shorter timeout for admins
    max_sessions_per_user: int = 3  # Prevent session hijacking

    # Rate Limiting
    rate_limit_per_minute: int = 60
    rate_limit_per_hour: int = 1000
    admin_rate_limit_per_minute: int = 30  # Stricter for admin ops

    # Failed Auth Protection
    max_failed_attempts: int = 5
    lockout_duration_minutes: int = 15
    lockout_after_attempts: int = 10  # Permanent lock after 10 fails

    # Audit Logging
    audit_log_retention_days: int = 365  # 1 year retention
    enable_audit_logging: bool = True
    log_level: str = "INFO"  # INFO, WARNING, ERROR, CRITICAL

    # MFA Settings
    mfa_enabled: bool = False  # TODO: Enable when MFA system ready
    mfa_required_for_admin: bool = True
    mfa_required_for_restore: bool = True

    # CORS Settings
    allowed_origins: list = ["https://yourdomain.com"]  # Production domains only
    allow_credentials: bool = True

    # Security Headers
    enable_hsts: bool = True
    hsts_max_age: int = 31536000  # 1 year
    enable_csp: bool = True
    enable_xframe_deny: bool = True

    # Database Security
    db_connection_timeout: int = 30
    db_pool_size: int = 20
    db_max_overflow: int = 10
    db_pool_recycle: int = 3600  # Recycle connections every hour

    # Monitoring
    enable_prometheus: bool = True
    enable_sentry: bool = True
    sentry_dsn: str | None = os.getenv("SENTRY_DSN")

    # Alerting
    alert_email: str = os.getenv("SECURITY_ALERT_EMAIL", "security@example.com")
    slack_webhook: str | None = os.getenv("SLACK_WEBHOOK_URL")
    pagerduty_key: str | None = os.getenv("PAGERDUTY_KEY")


class ProductionConfig(BaseModel):
    """General production configuration"""

    environment: str = "production"
    debug: bool = False
    testing: bool = False

    # Application
    app_name: str = "Fraud Detection System"
    app_version: str = "1.0.0"
    api_prefix: str = "/api/v1"

    # Database
    database_url: str = os.getenv(
        "DATABASE_URL", "postgresql://user:pass@localhost/fraud_db"
    )
    database_echo: bool = False  # Disable SQL logging in production

    # Redis Cache
    redis_url: str = os.getenv("REDIS_URL", "redis://localhost:6379/0")
    cache_ttl: int = 300  # 5 minutes default

    # File Upload
    max_upload_size_mb: int = 50
    allowed_file_types: list = [".pdf", ".jpg", ".png", ".jpeg", ".csv", ".xlsx"]
    upload_directory: str = "/var/app/uploads"

    # Backup
    backup_directory: str = "/var/app/backups"
    backup_retention_days: int = 30
    auto_backup_enabled: bool = True
    auto_backup_schedule: str = "0 2 * * *"  # 2 AM daily

    # Logging
    log_file: str = "/var/log/fraud-detection/app.log"
    log_max_bytes: int = 10485760  # 10MB
    log_backup_count: int = 10

    # Performance
    workers: int = 4  # Gunicorn workers
    worker_class: str = "uvicorn.workers.UvicornWorker"
    worker_connections: int = 1000
    max_requests: int = 10000  # Restart worker after 10k requests
    max_requests_jitter: int = 1000

    # Security
    security: SecurityConfig = SecurityConfig()


# Singleton configuration instance
config = ProductionConfig()


# Environment validation
def validate_production_config():
    """Validate production configuration is secure"""
    issues = []

    if config.security.jwt_secret_key == "production_secure_value":
        issues.append("⚠️ JWT_SECRET_KEY not set - using default (INSECURE)")

    if config.debug:
        issues.append("⚠️ DEBUG mode enabled in production (INSECURE)")

    if len(config.security.allowed_origins) == 0:
        issues.append("⚠️ No CORS origins configured")

    if not config.security.enable_hsts:
        issues.append("⚠️ HSTS not enabled")

    if not config.security.enable_audit_logging:
        issues.append("⚠️ Audit logging disabled")

    if config.database_echo:
        issues.append("⚠️ Database SQL logging enabled (performance impact)")

    if issues:
        print("\\n🔴 PRODUCTION CONFIGURATION ISSUES:")
        for issue in issues:
            print(f"  {issue}")
        print("\\n⚠️ Fix these issues before deploying to production!\\n")
        return False

    print("✅ Production configuration validated - all security checks passed")
    return True


if __name__ == "__main__":
    validate_production_config()
