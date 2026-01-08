# Supabase Free Forever - Database Setup

> **Free PostgreSQL database with 500MB storage, unlimited API calls**

## 🆓 What You Get FREE Forever

| Resource | Amount |
|----------|--------|
| Database Storage | 500 MB |
| API Requests | Unlimited |
| Auth Users | Unlimited |
| Realtime Connections | Unlimited |
| Edge Functions | 500K invocations/month |
| Projects | 2 |

---

## 🚀 Quick Setup (5 minutes)

### Step 1: Create Account

1. Go to [supabase.com](https://supabase.com)
2. Click **"Start your project"**
3. Sign in with GitHub (recommended) or email

### Step 2: Create Project

1. Click **"New Project"**
2. Enter details:
   - **Name:** `zenith-platform`
   - **Database Password:** Generate a strong one (SAVE THIS!)
   - **Region:** Choose closest to Oracle Cloud VM
   - **Plan:** Free

3. Click **"Create new project"**
4. Wait 2-3 minutes for provisioning

### Step 3: Get Connection String

1. Go to **Settings → Database**
2. Find **Connection String** section
3. Copy the **URI** (Connection pooling recommended):

```
postgresql://postgres.[PROJECT_REF]:[PASSWORD]@aws-0-[REGION].pooler.supabase.com:6543/postgres
```

### Step 4: Run Migrations

In the Supabase Dashboard:

1. Go to **SQL Editor**
2. Click **"New Query"**
3. Paste your schema:

```sql
-- Zenith Platform Schema

-- Cases table
CREATE TABLE IF NOT EXISTS cases (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    title VARCHAR(255) NOT NULL,
    description TEXT,
    status VARCHAR(50) DEFAULT 'open',
    priority VARCHAR(20) DEFAULT 'medium',
    assigned_to UUID,
    created_by UUID,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    metadata JSONB DEFAULT '{}'
);

-- Fraud alerts table
CREATE TABLE IF NOT EXISTS fraud_alerts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    case_id UUID REFERENCES cases(id),
    alert_type VARCHAR(100) NOT NULL,
    severity VARCHAR(20) NOT NULL,
    description TEXT,
    raw_data JSONB,
    status VARCHAR(50) DEFAULT 'new',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Users table (supplements Supabase Auth)
CREATE TABLE IF NOT EXISTS user_profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id),
    full_name VARCHAR(255),
    role VARCHAR(50) DEFAULT 'analyst',
    department VARCHAR(100),
    preferences JSONB DEFAULT '{}',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Audit log
CREATE TABLE IF NOT EXISTS audit_log (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID,
    action VARCHAR(100) NOT NULL,
    entity_type VARCHAR(50),
    entity_id UUID,
    old_data JSONB,
    new_data JSONB,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes for performance
CREATE INDEX idx_cases_status ON cases(status);
CREATE INDEX idx_cases_created ON cases(created_at DESC);
CREATE INDEX idx_fraud_alerts_case ON fraud_alerts(case_id);
CREATE INDEX idx_fraud_alerts_status ON fraud_alerts(status);
CREATE INDEX idx_audit_log_user ON audit_log(user_id);
CREATE INDEX idx_audit_log_created ON audit_log(created_at DESC);

-- Enable Row Level Security
ALTER TABLE cases ENABLE ROW LEVEL SECURITY;
ALTER TABLE fraud_alerts ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE audit_log ENABLE ROW LEVEL SECURITY;
```

1. Click **"Run"**

### Step 5: Update Environment Variables

Add to your `.env` files:

```bash
# Supabase Database
DATABASE_URL=postgresql://postgres.[PROJECT_REF]:[PASSWORD]@aws-0-[REGION].pooler.supabase.com:6543/postgres

# Supabase API (for direct access)
SUPABASE_URL=https://[PROJECT_REF].supabase.co
SUPABASE_ANON_KEY=eyJ...your-anon-key...
SUPABASE_SERVICE_KEY=eyJ...your-service-key...
```

---

## 🔗 Connection String Locations

| Location | Path |
|----------|------|
| Oracle VM | `~/zenith/.env` |
| Cloudflare Workers | `wrangler.toml` (secrets) |
| Local Dev | `.env.local` |

---

## 💡 Tips for 500MB Limit

1. **Implement data retention** - Archive old records
2. **Use JSONB sparingly** - Compress large objects
3. **Monitor usage** - Dashboard shows current usage
4. **Clean up logs** - Truncate audit_log periodically

```sql
-- Delete audit logs older than 30 days
DELETE FROM audit_log WHERE created_at < NOW() - INTERVAL '30 days';
```

---

## ✅ Checklist

```
□ Created Supabase account
□ Created zenith-platform project
□ Saved database password
□ Ran schema migrations
□ Copied connection string
□ Updated environment variables
□ Tested database connection
```
