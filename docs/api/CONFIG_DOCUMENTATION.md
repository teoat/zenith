# Configuration Documentation

**Generated on:** 2025-12-17T05:11:46.211299

## Configuration Options

### .env.example

**Type:** environment

#### Variables

- **SQLCIPHER_KEY**: Configuration for sqlcipher key
- **MASTER_PASSWORD**: Configuration for master password
- **IPC_SECRET**: Configuration for ipc secret
- **AUTH_ENCRYPTION_KEY**: Configuration for auth encryption key
- **NODE_ENV**: Configuration for node env
- **HOST**: Configuration for host
- **PORT**: Configuration for port

### backend/config/production.py

**Type:** python

#### Variables

- **jwt_secret_key: str **: Configuration for jwt secret key: str 
- **jwt_algorithm: str **: Configuration for jwt algorithm: str 
- **access_token_expire_minutes: int **: Configuration for access token expire minutes: int 
- **refresh_token_expire_days: int **: Configuration for refresh token expire days: int 
- **session_timeout_minutes: int **: Configuration for session timeout minutes: int 
- **admin_session_timeout_minutes: int **: Configuration for admin session timeout minutes: int 
- **max_sessions_per_user: int **: Configuration for max sessions per user: int 
- **rate_limit_per_minute: int **: Configuration for rate limit per minute: int 
- **rate_limit_per_hour: int **: Configuration for rate limit per hour: int 
- **admin_rate_limit_per_minute: int **: Configuration for admin rate limit per minute: int 
- **max_failed_attempts: int **: Configuration for max failed attempts: int 
- **lockout_duration_minutes: int **: Configuration for lockout duration minutes: int 
- **lockout_after_attempts: int **: Configuration for lockout after attempts: int 
- **audit_log_retention_days: int **: Configuration for audit log retention days: int 
- **enable_audit_logging: bool **: Configuration for enable audit logging: bool 
- **log_level: str **: Configuration for log level: str 
- **mfa_enabled: bool **: Configuration for mfa enabled: bool 
- **mfa_required_for_admin: bool **: Configuration for mfa required for admin: bool 
- **mfa_required_for_restore: bool **: Configuration for mfa required for restore: bool 
- **allowed_origins: list **: Configuration for allowed origins: list 
- **allow_credentials: bool **: Configuration for allow credentials: bool 
- **enable_hsts: bool **: Configuration for enable hsts: bool 
- **hsts_max_age: int **: Configuration for hsts max age: int 
- **enable_csp: bool **: Configuration for enable csp: bool 
- **enable_xframe_deny: bool **: Configuration for enable xframe deny: bool 
- **db_connection_timeout: int **: Configuration for db connection timeout: int 
- **db_pool_size: int **: Configuration for db pool size: int 
- **db_max_overflow: int **: Configuration for db max overflow: int 
- **db_pool_recycle: int **: Configuration for db pool recycle: int 
- **enable_prometheus: bool **: Configuration for enable prometheus: bool 
- **enable_sentry: bool **: Configuration for enable sentry: bool 
- **sentry_dsn: Optional[str] **: Configuration for sentry dsn: optional[str] 
- **alert_email: str **: Configuration for alert email: str 
- **slack_webhook: Optional[str] **: Configuration for slack webhook: optional[str] 
- **pagerduty_key: Optional[str] **: Configuration for pagerduty key: optional[str] 
- **environment: str **: Configuration for environment: str 
- **debug: bool **: Configuration for debug: bool 
- **testing: bool **: Configuration for testing: bool 
- **app_name: str **: Configuration for app name: str 
- **app_version: str **: Configuration for app version: str 
- **api_prefix: str **: Configuration for api prefix: str 
- **database_url: str **: Configuration for database url: str 
- **database_echo: bool **: Configuration for database echo: bool 
- **redis_url: str **: Configuration for redis url: str 
- **cache_ttl: int **: Configuration for cache ttl: int 
- **max_upload_size_mb: int **: Configuration for max upload size mb: int 
- **allowed_file_types: list **: Configuration for allowed file types: list 
- **upload_directory: str **: Configuration for upload directory: str 
- **backup_directory: str **: Configuration for backup directory: str 
- **backup_retention_days: int **: Configuration for backup retention days: int 
- **auto_backup_enabled: bool **: Configuration for auto backup enabled: bool 
- **auto_backup_schedule: str **: Configuration for auto backup schedule: str 
- **log_file: str **: Configuration for log file: str 
- **log_max_bytes: int **: Configuration for log max bytes: int 
- **log_backup_count: int **: Configuration for log backup count: int 
- **workers: int **: Configuration for workers: int 
- **worker_class: str **: Configuration for worker class: str 
- **worker_connections: int **: Configuration for worker connections: int 
- **max_requests: int **: Configuration for max requests: int 
- **max_requests_jitter: int **: Configuration for max requests jitter: int 
- **security: SecurityConfig **: Configuration for security: securityconfig 
- **config **: Configuration for config 
- **issues **: Configuration for issues 
- **if config.security.jwt_secret_key **: Configuration for if config.security.jwt secret key 
- **if len(config.security.allowed_origins) **: Configuration for if len(config.security.allowed origins) 
- **if __name__ **: Configuration for if   name   

