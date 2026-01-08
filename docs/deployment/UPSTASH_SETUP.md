# Upstash Free Forever - Redis Setup

> **Serverless Redis with 10K commands/day, 256MB storage**

## 🆓 What You Get FREE Forever

| Resource | Amount |
|----------|--------|
| Commands | 10,000/day |
| Storage | 256 MB |
| Connections | Unlimited |
| Regions | Global edge |
| REST API | Included |

---

## 🚀 Quick Setup (3 minutes)

### Step 1: Create Account

1. Go to [upstash.com](https://upstash.com)
2. Click **"Sign Up"**
3. Use GitHub or Google login

### Step 2: Create Redis Database

1. Click **"Create Database"**
2. Configure:
   - **Name:** `zenith-cache`
   - **Type:** Regional (Free) or Global ($)
   - **Region:** Choose closest to Oracle Cloud
   - **TLS:** Enabled (recommended)

3. Click **"Create"**

### Step 3: Get Connection Details

After creation, you'll see:

```bash
# REST API (works everywhere including Cloudflare Workers)
UPSTASH_REDIS_REST_URL=https://[ID].upstash.io
UPSTASH_REDIS_REST_TOKEN=AX...your-token...

# Redis Protocol (for traditional clients)
REDIS_URL=rediss://default:[PASSWORD]@[ID].upstash.io:6379
```

### Step 4: Update Environment Variables

**Oracle VM (`~/zenith/.env`):**

```bash
REDIS_URL=rediss://default:[PASSWORD]@[ID].upstash.io:6379
```

**Cloudflare Workers (`wrangler.toml`):**

```toml
[vars]
UPSTASH_REDIS_REST_URL = "https://[ID].upstash.io"
UPSTASH_REDIS_REST_TOKEN = "AX...token..."
```

---

## 💡 Optimize for 10K/day Limit

### 1. Aggressive Local Caching

```python
# services/shared/infrastructure/cache_manager.py
class FreeTierCacheManager:
    def __init__(self):
        self.local_cache = {}  # L1: In-memory (FREE!)
        self.local_ttl = 300   # 5 minute local cache
    
    def get(self, key):
        # Check local first - saves Redis commands!
        if key in self.local_cache:
            entry = self.local_cache[key]
            if entry['expires'] > time.time():
                return entry['value']  # No Redis call needed
        
        # Only hit Redis if not in local cache
        value = self.redis.get(key)  # 1 command
        if value:
            self.local_cache[key] = {
                'value': value,
                'expires': time.time() + self.local_ttl
            }
        return value
```

### 2. Batch Operations

```python
# Use MGET instead of multiple GET
keys = ['user:1', 'user:2', 'user:3']
values = redis.mget(*keys)  # 1 command instead of 3!
```

### 3. Monitor Usage

In Upstash Console:

- **Usage** tab shows daily commands
- Set up alerts at 80% usage

---

## 📊 Command Budget (10K/day)

| Operation | Daily Budget | Per Minute |
|-----------|--------------|------------|
| Cache hits | 5,000 | ~3.5 |
| Cache misses | 2,000 | ~1.4 |
| Rate limiting | 2,000 | ~1.4 |
| Other | 1,000 | ~0.7 |

**With local caching, 10K/day is plenty!**

---

## ✅ Checklist

```
□ Created Upstash account
□ Created zenith-cache database
□ Copied REST URL and token
□ Copied Redis URL
□ Updated Oracle VM .env
□ Updated Cloudflare wrangler.toml
□ Tested connection
□ Implemented local caching layer
```
