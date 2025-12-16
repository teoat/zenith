#!/bin/bash
# Redis Setup and Configuration Script
# Sets up Redis for development and production

set -e

echo "🔧 Redis Setup for 378x492 Fraud Detection"
echo "==========================================="
echo ""

# Check if Redis is installed
if command -v redis-server &> /dev/null; then
    echo "✅ Redis is already installed"
    REDIS_VERSION=$(redis-server --version | head -n 1)
    echo "   Version: $REDIS_VERSION"
else
    echo "❌ Redis is not installed"
    echo ""
    echo "📥 Installation instructions:"
    echo ""
    echo "macOS (Homebrew):"
    echo "  brew install redis"
    echo ""
    echo "Ubuntu/Debian:"
    echo "  sudo apt-get update"
    echo "  sudo apt-get install redis-server"
    echo ""
    echo "Docker:"
    echo "  docker run -d -p 6379:6379 --name fraud-redis redis:alpine"
    echo ""
    exit 1
fi

echo ""
echo "🚀 Starting Redis..."

# Check OS
if [[ "$OSTYPE" == "darwin"* ]]; then
    # macOS
    if command -v brew &> /dev/null; then
        brew services start redis
        echo "✅ Redis started via Homebrew services"
    else
        redis-server --daemonize yes
        echo "✅ Redis started in daemon mode"
    fi
elif [[ "$OSTYPE" == "linux-gnu"* ]]; then
    # Linux
    sudo systemctl start redis-server
    echo "✅ Redis started via systemctl"
else
    # Generic
    redis-server --daemonize yes
    echo "✅ Redis started in daemon mode"
fi

echo ""
echo "🔍 Checking Redis connection..."
sleep 2

if redis-cli ping > /dev/null 2>&1; then
    echo "✅ Redis is running and responding to PING"
    echo ""
    echo "📊 Redis Info:"
    redis-cli INFO server | grep redis_version
    redis-cli INFO memory | grep used_memory_human
else
    echo "❌ Redis is not responding"
    echo "   Please check the logs or try starting manually:"
    echo "   redis-server"
    exit 1
fi

echo ""
echo "⚙️  Configuring Redis for production..."

# Create Redis configuration
cat > redis.conf << 'EOF'
# Redis Configuration for 378x492 Fraud Detection
# Production-ready settings

# Network
bind 127.0.0.1
port 6379
protected-mode yes

# Security
requirepass __REPLACE_WITH_REDIS_PASSWORD__

# Performance
maxmemory 256mb
maxmemory-policy allkeys-lru

# Persistence
save 900 1
save 300 10
save 60 10000

# Logging
loglevel notice
logfile /var/log/redis/redis-server.log

# Append-only file
appendonly yes
appendfilename "appendonly.aof"

# Slow log
slowlog-log-slower-than 10000
slowlog-max-len 128
EOF

echo "✅ Redis configuration created: redis.conf"
echo ""
echo "⚠️  IMPORTANT: Update requirepass in redis.conf with a secure password"
echo ""
echo "🔧 To use this configuration:"
echo "   redis-server redis.conf"
echo ""
echo "📊 Redis Status:"
echo "   Check: redis-cli ping"
echo "   Monitor: redis-cli monitor"
echo "   Info: redis-cli info"
echo ""
echo "✅ Redis setup complete!"
