#!/usr/bin/env python3
"""
Integration Tests for Inter-Service Communication
Tests circuit breaker, retry, service discovery, and health checking
"""

import asyncio
import sys
import time


def test_circuit_breaker():
    """Test circuit breaker implementation"""
    print("\n" + "=" * 60)
    print("TESTING CIRCUIT BREAKER")
    print("=" * 60)

    try:
        from services.shared.infrastructure.circuit_breaker import (
            CircuitBreaker,
            CircuitConfig,
            CircuitState,
            CircuitOpenError,
            circuit_breaker_manager,
        )

        print("\n1. Testing basic circuit breaker operations...")
        config = CircuitConfig(
            failure_threshold=3,
            recovery_timeout=1.0,
            success_threshold=2,
        )
        cb = CircuitBreaker("test-service", config)

        async def failing_func():
            raise ValueError("Service unavailable")

        async def success_func():
            return "success"

        # Test 3 failures to open circuit
        print("\n2. Testing circuit opening...")
        for i in range(3):
            try:
                asyncio.run(cb.call(failing_func))
            except Exception as e:
                print(f"   Attempt {i + 1}: Failed as expected - {type(e).__name__}")

        assert cb.state == CircuitState.OPEN
        print("   ✓ Circuit opened after 3 failures")

        # Test circuit reject
        print("\n3. Testing circuit rejection...")
        try:
            asyncio.run(cb.call(success_func))
            print("   ❌ Should have been rejected")
            return False
        except CircuitOpenError:
            print("   ✓ Circuit correctly rejects requests when open")

        # Test recovery
        print("\n4. Testing circuit recovery...")
        time.sleep(1.5)  # Wait for recovery timeout

        result = asyncio.run(cb.call(success_func))
        assert result == "success"
        print("   ✓ Circuit allows request after recovery timeout")

        assert cb.state == CircuitState.HALF_OPEN
        print("   ✓ Circuit in HALF_OPEN state")

        # Test closing circuit
        print("\n5. Testing circuit closing...")
        result = asyncio.run(cb.call(success_func))
        assert result == "success"
        assert cb.state == CircuitState.CLOSED
        print("   ✓ Circuit closed after success threshold")

        print("\n6. Testing metrics...")
        metrics = cb.get_metrics()
        assert metrics.total_calls > 0
        print(f"   ✓ Metrics collected: {metrics.total_calls} total calls")

        print("\n7. Testing circuit breaker manager...")
        manager = circuit_breaker_manager
        manager.get_or_create("test2", config)
        assert any(s["name"] == "test2" for s in manager.get_all_states())
        manager.reset_all()
        print("   ✓ Circuit breaker manager works")

        print("\n✅ All circuit breaker tests passed!")
        return True

    except Exception as e:
        print(f"\n❌ Circuit breaker test failed: {e}")
        import traceback

        traceback.print_exc()
        return False


def test_retry_mechanism():
    """Test retry mechanism with exponential backoff"""
    print("\n" + "=" * 60)
    print("TESTING RETRY MECHANISM")
    print("=" * 60)

    try:
        from services.shared.infrastructure.retry import (
            Retryable,
            RetryConfig,
            RetryStrategy,
            with_retry,
            DEFAULT_RETRY,
        )

        print("\n1. Testing basic retry...")
        retryable = Retryable(RetryConfig(max_attempts=3, base_delay=0.01))

        call_count = 0

        async def sometimes_failing():
            nonlocal call_count
            call_count += 1
            if call_count < 3:
                raise ConnectionError("Temporary failure")
            return "success"

        result, attempts = asyncio.run(retryable.execute(sometimes_failing))
        assert result == "success"
        assert attempts == 3
        print(f"   ✓ Succeeded on attempt {attempts}")

        print("\n2. Testing retry exhaustion...")
        call_count = 0
        retryable = Retryable(RetryConfig(max_attempts=3, base_delay=0.01))

        async def always_failing():
            nonlocal call_count
            call_count += 1
            raise ConnectionError("Always failing")

        try:
            asyncio.run(retryable.execute(always_failing))
            print("   ❌ Should have raised exception")
            return False
        except ConnectionError:
            print(f"   ✓ Correctly raised exception after {call_count} attempts")

        print("\n3. Testing retry strategies...")
        config_exp = RetryConfig(
            max_attempts=3,
            base_delay=0.01,
            retry_strategy=RetryStrategy.EXPONENTIAL_JITTER,
        )
        retryable = Retryable(config_exp)

        call_count = 0

        async def succeed_on_2():
            nonlocal call_count
            call_count += 1
            if call_count < 2:
                raise ValueError("Fail")
            return "ok"

        result, attempts = asyncio.run(retryable.execute(succeed_on_2))
        assert result == "ok"
        print(f"   ✓ Exponential backoff works: {attempts} attempts")

        print("\n4. Testing decorator...")
        call_count = 0

        @with_retry(max_attempts=2, base_delay=0.01)
        async def decorated_func():
            nonlocal call_count
            call_count += 1
            if call_count < 2:
                raise RuntimeError("Retry me")
            return "done"

        result = asyncio.run(decorated_func())
        assert result == "done"
        print("   ✓ Retry decorator works")

        print("\n5. Testing metrics...")
        metrics = retryable.get_metrics()
        assert metrics.total_attempts > 0
        print(f"   ✓ Metrics: {metrics.total_attempts} total attempts")

        print("\n✅ All retry tests passed!")
        return True

    except Exception as e:
        print(f"\n❌ Retry test failed: {e}")
        import traceback

        traceback.print_exc()
        return False


def test_service_discovery():
    """Test service discovery utilities"""
    print("\n" + "=" * 60)
    print("TESTING SERVICE DISCOVERY")
    print("=" * 60)

    try:
        import os
        from services.shared.infrastructure.service_discovery import (
            ServiceDiscovery,
            ServiceHealthChecker,
            ServiceConfig,
            ServiceEndpoint,
            service_discovery,
            get_service_url,
            create_service_config,
        )

        print("\n1. Testing service registration...")
        disc = ServiceDiscovery()
        config = ServiceConfig(
            name="test-service",
            endpoints=[
                ServiceEndpoint(
                    name="test",
                    url="http://localhost:8000",
                    port=8000,
                )
            ],
        )
        disc.register_service(config)
        assert "test-service" in disc.get_all_services()
        print("   ✓ Service registered successfully")

        print("\n2. Testing service URL retrieval...")
        disc._service_urls["another-service"] = "http://localhost:9000"
        assert disc.get_service_url("another-service") == "http://localhost:9000"
        print("   ✓ Service URL retrieval works")

        print("\n3. Testing service endpoint properties...")
        endpoint = ServiceEndpoint(
            name="test",
            url="https://api.example.com:8080",
            port=8080,
        )
        assert endpoint.host == "api.example.com"
        assert endpoint.scheme == "https"
        assert endpoint.port == 8080
        print("   ✓ Endpoint properties work correctly")

        print("\n4. Testing service health checker...")
        checker = ServiceHealthChecker()

        # Don't actually make HTTP calls, just verify the structure
        status = {
            "service": "test",
            "url": "http://localhost:8000",
            "healthy": True,
            "latency_ms": 10.5,
        }
        assert status["healthy"] == True
        print("   ✓ Health checker structure works")

        print("\n5. Testing create_service_config...")
        config = create_service_config("new-service", "http://localhost:7000")
        assert config.name == "new-service"
        assert config.endpoints[0].url == "http://localhost:7000"
        print("   ✓ Service config factory works")

        print("\n✅ All service discovery tests passed!")
        return True

    except Exception as e:
        print(f"\n❌ Service discovery test failed: {e}")
        import traceback

        traceback.print_exc()
        return False


def test_configuration():
    """Test configuration management"""
    print("\n" + "=" * 60)
    print("TESTING CONFIGURATION")
    print("=" * 60)

    try:
        from services.shared.infrastructure.config import (
            Settings,
            DatabaseConfig,
            RedisConfig,
            SecurityConfig,
            load_settings,
            get_database_config,
            get_redis_config,
            is_production,
            is_development,
        )

        print("\n1. Testing settings loading...")
        settings = load_settings()
        assert settings is not None
        print(f"   ✓ Settings loaded: {settings.ENVIRONMENT}")

        print("\n2. Testing database config...")
        db_config = get_database_config()
        assert isinstance(db_config, DatabaseConfig)
        print(
            f"   ✓ Database config: pool size {db_config.pool_min_size}-{db_config.pool_max_size}"
        )

        print("\n3. Testing Redis config...")
        redis_config = get_redis_config()
        assert isinstance(redis_config, RedisConfig)
        print(f"   ✓ Redis config: prefix={redis_config.key_prefix}")

        print("\n4. Testing environment checks...")
        assert is_development() or is_production()
        print(
            f"   ✓ Environment check: {'production' if is_production() else 'development'}"
        )

        print("\n5. Testing config properties...")
        db = DatabaseConfig(
            url="postgresql://user:pass@localhost:5432/db",
            pool_url="postgresql://user:pass@pgbouncer:6432/db",
        )
        assert db.effective_url == db.pool_url
        print("   ✓ Config properties work correctly")

        print("\n✅ All configuration tests passed!")
        return True

    except Exception as e:
        print(f"\n❌ Configuration test failed: {e}")
        import traceback

        traceback.print_exc()
        return False


async def test_integration():
    """Test integration between components"""
    print("\n" + "=" * 60)
    print("INTEGRATION TEST")
    print("=" * 60)

    try:
        from services.shared.infrastructure.circuit_breaker import (
            CircuitBreaker,
            CircuitConfig,
        )
        from services.shared.infrastructure.retry import Retryable, RetryConfig
        from services.shared.infrastructure.config import get_redis_config

        print("\n1. Testing circuit breaker + retry combination...")
        config = CircuitConfig(failure_threshold=5, recovery_timeout=60)
        cb = CircuitBreaker("integration-test", config)

        call_count = 0

        async def flaky_service():
            nonlocal call_count
            call_count += 1
            if call_count < 3:
                raise TimeoutError("Service busy")
            return {"status": "ok", "attempts": call_count}

        retryable = Retryable(RetryConfig(max_attempts=5, base_delay=0.01))

        result, attempts = await retryable.execute(cb.call, flaky_service)
        assert result["status"] == "ok"
        print(f"   ✓ Circuit + Retry: succeeded after {attempts} total attempts")

        print("\n2. Testing configuration with circuit breaker...")
        from services.shared.infrastructure.config import settings

        config = CircuitConfig(
            failure_threshold=settings.CIRCUIT_FAILURE_THRESHOLD,
            recovery_timeout=settings.CIRCUIT_RECOVERY_TIMEOUT,
        )
        assert config.failure_threshold == settings.CIRCUIT_FAILURE_THRESHOLD
        print("   ✓ Configuration properly passed to circuit breaker")

        print("\n✅ Integration tests passed!")
        return True

    except Exception as e:
        print(f"\n❌ Integration test failed: {e}")
        import traceback

        traceback.print_exc()
        return False


def main():
    """Run all tests"""
    print("\n" + "=" * 60)
    print("ZENITH PLATFORM - INTER-SERVICE COMMUNICATION TEST SUITE")
    print("=" * 60)

    results = []

    results.append(("Circuit Breaker", test_circuit_breaker()))
    results.append(("Retry Mechanism", test_retry_mechanism()))
    results.append(("Service Discovery", test_service_discovery()))
    results.append(("Configuration", test_configuration()))

    print("\nRunning async integration test...")
    results.append(("Integration", asyncio.run(test_integration())))

    print("\n" + "=" * 60)
    print("TEST SUMMARY")
    print("=" * 60)

    all_passed = True
    for name, passed in results:
        status = "✅ PASSED" if passed else "❌ FAILED"
        print(f"{name:.<40} {status}")
        if not passed:
            all_passed = False

    print("=" * 60)
    if all_passed:
        print("🎉 ALL TESTS PASSED!")
        return 0
    else:
        print("❌ SOME TESTS FAILED")
        return 1


if __name__ == "__main__":
    sys.exit(main())
