# Security Architecture - Versioned Encryption & Authentication

## Overview
The 378x492 Fraud Detection Platform implements advanced security measures including versioned encryption, circuit breaker monitoring, and WebSocket authentication.

## Versioned Encryption System

### Architecture
- **Multi-Key Support**: Maintains backward compatibility with legacy encrypted data
- **Version Prefixing**: Encrypted data includes version identifiers (`v1:data...`)
- **Migration Safety**: Supports gradual key rotation without data loss
- **Fallback Logic**: Attempts decryption with all known keys for legacy data

### Key Features
```python
class VersionedEncryptedString(TypeDecorator):
    KEY_VERSIONS = {
        "v1": settings.FIELD_ENCRYPTION_KEY,  # Current
        # Future: "v2": new_key_here
    }

    def process_bind_param(self, value, dialect):
        # Encrypt with version prefix: "v1:encrypted_data"
        encrypted = self._current_fernet.encrypt(value.encode()).decode()
        return f"{self._current_version}:{encrypted}"

    def process_result_value(self, value, dialect):
        # Handle versioned and legacy data
        if ":" in value and len(value.split(":", 1)) == 2:
            version, data = value.split(":", 1)
            return self._fernet_instances[version].decrypt(data.encode()).decode()
        # Fallback for legacy unversioned data
        for fernet in self._fernet_instances.values():
            try:
                return fernet.decrypt(value.encode()).decode()
            except:
                continue
```

### Security Benefits
- **Zero Downtime Migration**: New keys can be deployed without decrypting all data
- **Audit Trail**: Version tracking enables security incident investigation
- **Forward Compatibility**: Easy addition of new encryption algorithms
- **Data Integrity**: Prevents silent decryption failures

## WebSocket Authentication

### Implementation
- **JWT Token Validation**: Query parameter extraction and validation
- **User Verification**: Token user ID must match WebSocket path parameter
- **MFA Enforcement**: WebSocket connections require MFA-verified tokens
- **Error Handling**: Structured error messages before connection closure

### Security Flow
```
Client Request: ws://localhost:8000/api/v1/sync/ws/{user_id}?token=jwt_token
├── Extract token from query parameters
├── Decode and validate JWT
├── Verify user_id matches token.sub
├── Check mfa_verified flag
├── Accept connection or send error + close
└── Proceed with authenticated real-time communication
```

## Circuit Breaker Monitoring

### Architecture
- **Failure Detection**: Monitors consecutive metric collection failures
- **Graceful Degradation**: Continues operation when monitoring fails
- **Self-Healing**: Automatic reset after configurable timeout
- **Individual Error Handling**: Each metric collected with try/catch

### Configuration
```python
class PerformanceMonitor:
    _circuit_breaker_failures = 0
    _circuit_breaker_timeout = 300  # 5 minutes
    _max_consecutive_failures = 3

    def _collect_metrics_safe(self):
        # Individual error handling for each metric
        metrics = {"timestamp": datetime.now(timezone.utc).isoformat()}

        collectors = {
            "cpu_percent": lambda: psutil.cpu_percent(interval=1),
            "memory_percent": lambda: psutil.virtual_memory().percent,
            # ... other metrics
        }

        for name, collector in collectors.items():
            try:
                metrics[name] = collector()
            except Exception as e:
                logger.warning(f"Failed to collect {name}: {e}")
                metrics[name] = None  # Explicit None for failed metrics
```

### Resilience Features
- **Partial Data Collection**: System continues with available metrics
- **Automatic Recovery**: Circuit breaker resets on successful collections
- **Configurable Thresholds**: Adjustable failure tolerance
- **Logging Integration**: Detailed failure tracking for diagnostics

## Authentication Improvements

### Async Security Monitoring
- **Non-blocking**: Security events logged asynchronously to prevent auth delays
- **Event Buffering**: Failed auth attempts queued for processing
- **Error Isolation**: Monitoring failures don't break authentication flow

### Enhanced Token Validation
- **MFA Integration**: JWT payloads include MFA verification status
- **Expiration Handling**: Proper token lifetime management
- **Revocation Support**: Token blacklisting capabilities

## Deployment Considerations

### Environment Variables
```bash
# Encryption
FIELD_ENCRYPTION_KEY=v1_encryption_key_here

# Monitoring
CIRCUIT_BREAKER_TIMEOUT=300
MAX_CONSECUTIVE_FAILURES=3

# Authentication
JWT_SECRET_KEY=your_jwt_secret
JWT_ACCESS_TOKEN_EXPIRE_MINUTES=30
```

### Migration Strategy
1. **Encryption**: Deploy versioned encryption, maintain backward compatibility
2. **Monitoring**: Enable circuit breaker with conservative thresholds
3. **WebSocket**: Add authentication gradually with feature flags
4. **Testing**: Comprehensive testing in staging before production

### Monitoring & Alerting
- **Encryption Health**: Track decryption success/failure rates
- **Circuit Breaker Status**: Alert on breaker activation
- **WebSocket Auth**: Monitor authentication failure patterns
- **Performance Impact**: Measure auth/encryption overhead

## Security Compliance

### Standards Alignment
- **NIST CSF**: Identifies, Protects, Detects, Responds, Recovers
- **ISO 27001**: Information security management
- **PCI DSS**: Payment card industry security
- **GDPR**: Data protection and privacy

### Audit Trail
- **Encryption Events**: Key usage and rotation tracking
- **Authentication Events**: Login attempts, MFA verification
- **Monitoring Events**: Circuit breaker state changes
- **WebSocket Events**: Connection authentication attempts

This security architecture provides enterprise-grade protection while maintaining system availability and performance.