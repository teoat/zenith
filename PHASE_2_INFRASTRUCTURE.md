#se Phase 2: Production Infrastructure (Post-Deployment)

Now that the application is deploying, follow these steps to achieve **100/100 Production Readiness**.

## 1. 🗄️ Migrate to PostgreSQL (P1 - Critical)

SQLite is not suitable for production. We must move to PostgreSQL.

### Steps

1. **Add PostgreSQL Service in Railway**:
    * Go to Railway Dashboard.
    * Click "New" -> "Database" -> "PostgreSQL".
    * Wait for it to provision.

2. **Connect Backend to Database**:
    * Railway usually auto-injects `DATABASE_URL`, `PGHOST`, `PGUSER`, etc.
    * Verify this in the "Variables" tab of your backend service.

3. **Run Migrations**:
    * The `railway.toml` already has `preDeployCommand = "alembic upgrade head"`.
    * This will run automatically on the next deploy!

4. **Verify**:
    * Logs should show `INFO  [alembic.runtime.migration] Context impl PostgresqlImpl.`

## 2. ⚡ Implement Redis Caching (P1 - High)

Add Redis for session management and caching.

### Steps

1. **Add Redis Service in Railway**:
    * Click "New" -> "Database" -> "Redis".

2. **Configure Backend**:
    * Railway auto-injects `REDIS_URL`.
    * Update `backend/core/config.py` to use `os.getenv("REDIS_URL")`.

3. **Verify**:
    * Check application logs for successful Redis connection.

## 3. 🛡️ Final Security Hardening (P2 - Medium)

1. **Delete Local Secrets**: Ensure `.env` is not in git (Done).
2. **Rotate Keys Periodically**: Set a calendar reminder.

## 4. 🧪 Deployment Verification

Run the following checks after deployment:

* [ ] `/health` endpoint returns 200 OK.
* [ ] Login works (returns valid JWT).
* [ ] Database writes persist (create a test user/case).
