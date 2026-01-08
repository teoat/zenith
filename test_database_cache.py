#!/usr/bin/env python3
"""
Test script for Database Pool and Redis Stack
Verifies connection pooling, caching, and health monitoring
"""

import asyncio
import sys
import time


def test_cache_manager():
    """Test the multi-layer cache manager"""
    print("\n" + "=" * 60)
    print("TESTING MULTI-LAYER CACHE MANAGER")
    print("=" * 60)

    try:
        from services.shared.infrastructure.cache_manager import (
            MultiLayerCacheManager,
            get_cache_stats,
            clear_all_cache,
        )

        cache = MultiLayerCacheManager(
            max_memory_entries=100,
            default_ttl_seconds=60,
            namespace="test",
        )

        print("\n1. Testing basic get/set operations...")
        cache.set("user:1", {"name": "John", "age": 30})
        result = cache.get("user:1")
        assert result == {"name": "John", "age": 30}, "Cache get/set failed"
        print("   ✓ Basic get/set operations work")

        print("\n2. Testing cache hit/miss...")
        stats_before = cache.metrics.hits
        _ = cache.get("user:1")
        stats_after = cache.metrics.hits
        assert stats_after > stats_before, "Cache hit not recorded"
        print("   ✓ Cache hit tracking works")

        miss = cache.get("nonexistent")
        assert miss is None, "Cache miss should return None"
        print("   ✓ Cache miss returns None")

        print("\n3. Testing cache deletion...")
        cache.set("temp:1", "value")
        assert cache.get("temp:1") == "value"
        cache.delete("temp:1")
        assert cache.get("temp:1") is None
        print("   ✓ Cache deletion works")

        print("\n4. Testing cache statistics...")
        stats = cache.get_stats()
        assert "l1_cache" in stats
        assert "l2_cache" in stats
        assert "metrics" in stats
        print(
            f"   ✓ Cache stats: L1={stats['l1_cache']['entries']}, L2={stats['l2_cache']['entries']}"
        )

        print("\n5. Testing namespace clear...")
        cache.set("ns1:key1", "value1")
        cache.set("ns2:key1", "value2")
        cleared = cache.clear_namespace("ns1")
        assert cache.get("ns1:key1") is None
        assert cache.get("ns2:key1") == "value2"
        print(f"   ✓ Namespace clear: {cleared} entries removed")

        cache.clear_all()
        assert cache.get_stats()["l1_cache"]["entries"] == 0
        print("   ✓ Clear all cache works")

        print("\n✅ All cache manager tests passed!")
        return True

    except Exception as e:
        print(f"\n❌ Cache manager test failed: {e}")
        import traceback

        traceback.print_exc()
        return False


async def test_database_health():
    """Test database health monitoring"""
    print("\n" + "=" * 60)
    print("TESTING DATABASE HEALTH MONITORING")
    print("=" * 60)

    try:
        from services.shared.infrastructure.database_health import (
            DatabaseHealthMonitor,
            create_health_monitor,
        )

        postgres_url = (
            "postgresql://zenith_user:zenith_password@localhost:5432/zenith_db"
        )

        print("\n1. Creating health monitor...")
        monitor = create_health_monitor(
            database_url=postgres_url,
            pool_min_size=2,
            pool_max_size=10,
        )
        print("   ✓ Health monitor created")

        print("\n2. Initializing connection pool...")
        await monitor.initialize()
        print("   ✓ Connection pool initialized")

        print("\n3. Running health check...")
        health = await monitor.check_health()
        print(f"   Status: {health.status.value}")
        print(f"   Latency: {health.latency_ms:.2f}ms")
        if health.version:
            print(f"   PostgreSQL Version: {health.version}")
        print("   ✓ Health check completed")

        print("\n4. Testing connection quality...")
        quality = await monitor.check_connection_quality()
        print(f"   Success Rate: {quality['success_rate'] * 100:.0f}%")
        if quality.get("avg_latency_ms"):
            print(f"   Avg Latency: {quality['avg_latency_ms']:.2f}ms")
        print("   ✓ Connection quality tested")

        print("\n5. Getting pool status...")
        pool_status = await monitor.get_pool_status()
        print(
            f"   Pool Config: min={pool_status['pool_config']['min_size']}, max={pool_status['pool_config']['max_size']}"
        )
        print("   ✓ Pool status retrieved")

        print("\n6. Converting to dict...")
        health_dict = monitor.to_dict()
        assert "status" in health_dict
        assert "connections" in health_dict
        assert "database" in health_dict
        print("   ✓ Dict conversion works")

        await monitor.close()
        print("\n✅ All database health tests passed!")
        return True

    except Exception as e:
        print(f"\n❌ Database health test failed: {e}")
        import traceback

        traceback.print_exc()
        return False


async def test_pgbouncer():
    """Test PGBouncer monitoring"""
    print("\n" + "=" * 60)
    print("TESTING PGBOUNCER MONITORING")
    print("=" * 60)

    try:
        from services.shared.infrastructure.database_health import (
            PGBouncerHealthMonitor,
        )

        pgbouncer_url = (
            "postgresql://zenith_user:zenith_password@localhost:6432/zenith_db"
        )

        print("\n1. Creating PGBouncer monitor...")
        monitor = PGBouncerHealthMonitor(pgbouncer_url)
        print("   ✓ PGBouncer monitor created")

        print("\n2. Getting pool configuration...")
        config = await monitor.get_pool_configuration()
        if config.get("connected"):
            print(f"   ✓ Connected to PGBouncer")
            print(f"   Pool Mode: {config['configuration'].get('pool_mode', 'N/A')}")
        else:
            print("   ⚠️ PGBouncer not available (expected if not running locally)")

        print("\n✅ PGBouncer tests completed!")
        return True

    except Exception as e:
        print(f"\n❌ PGBouncer test failed: {e}")
        import traceback

        traceback.print_exc()
        return False


async def test_integration():
    """Integration test with actual services"""
    print("\n" + "=" * 60)
    print("INTEGRATION TEST")
    print("=" * 60)

    try:
        import redis

        print("\n1. Testing Redis connection...")
        r = redis.Redis(host="localhost", port=6379, decode_responses=True)
        r.ping()
        print("   ✓ Redis connected")

        print("\n2. Testing Redis operations...")
        r.set("test:key", "test_value")
        value = r.get("test:key")
        assert value == "test_value"
        r.delete("test:key")
        print("   ✓ Redis operations work")

        print("\n3. Testing cache manager with Redis...")
        from services.shared.infrastructure.cache_manager import cache_manager

        if cache_manager.redis_available:
            cache_manager.set("integration:test", {"data": "test"})
            result = cache_manager.get("integration:test")
            assert result == {"data": "test"}
            cache_manager.delete("integration:test")
            print("   ✓ Cache manager with Redis works")
        else:
            print("   ⚠️ Redis not available for cache manager")

        print("\n✅ Integration tests completed!")
        return True

    except Exception as e:
        print(f"\n❌ Integration test failed: {e}")
        import traceback

        traceback.print_exc()
        return False


async def main():
    """Run all tests"""
    print("\n" + "=" * 60)
    print("ZENITH PLATFORM - DATABASE & CACHE TEST SUITE")
    print("=" * 60)

    results = []

    print("\nRunning tests...")
    results.append(("Cache Manager", test_cache_manager()))

    print("\nRunning async tests...")
    results.append(("Database Health", await test_database_health()))
    results.append(("PGBouncer", await test_pgbouncer()))
    results.append(("Integration", await test_integration()))

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
    sys.exit(asyncio.run(main()))
