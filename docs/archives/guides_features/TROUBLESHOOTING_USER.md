# Troubleshooting Guide (User)

**Change impact (keep in sync):**
- When backend/API troubleshooting steps change, reflect them in `docs/deployment/TROUBLESHOOTING_DEPLOYMENT.md` and `docs/api/README.md` examples.
- Keep onboarding pointers in `docs/guides/GETTING_STARTED.md` aligned with these fixes.
- Rerun docs link check after edits.

## Common Issues and Solutions

### Database Issues

#### Connection Refused
**Problem**: Cannot connect to database
```
sqlalchemy.exc.OperationalError: could not connect to server
```

**Solutions**:
1. Check database is running: `docker-compose ps postgres`
2. Verify connection string in `.env`:
   ```bash
   DATABASE_URL=postgresql://user:password@localhost:5432/fraud_detection
   ```
3. Test connection manually:
   ```bash
   psql -h localhost -U user -d fraud_detection
   ```

#### Migration Errors
**Problem**: Alembic migration fails
```
alembic.util.exc.CommandError: Can't locate revision
```

**Solutions**:
1. Check migration history: `alembic history`
2. Reset to base: `alembic downgrade base`
3. Reapply migrations: `alembic upgrade head`
4. If corrupted, delete `alembic_version` table and restart

### Authentication Issues

#### JWT Token Expired
**Problem**: 401 Unauthorized on API calls

**Solutions**:
1. Check token expiration in response
2. Refresh token using `/auth/refresh` endpoint
3. Login again to get new token

#### CORS Errors
**Problem**: Browser blocks API requests
```
Access to fetch blocked by CORS policy
```

**Solutions**:
1. Add frontend URL to `ALLOWED_ORIGINS` in `.env`
2. Restart backend server
3. Clear browser cache

### Performance Issues

#### Slow API Responses
**Problem**: API endpoints taking \u003e 2 seconds

**Solutions**:
1. Check database query performance:
   ```sql
   EXPLAIN ANALYZE SELECT * FROM cases;
   ```
2. Enable Redis caching
3. Check database indexes exist
4. Monitor with `/metrics` endpoint

#### High Memory Usage
**Problem**: Server using \u003e 80% memory

**Solutions**:
1. Check for memory leaks in logs
2. Reduce `DB_POOL_SIZE` in environment
3. Restart services: `docker-compose restart`
4. Monitor with Prometheus metrics

### Frontend Issues

#### Blank Page
**Problem**: Frontend shows white screen

**Solutions**:
1. Check browser console for errors
2. Verify API backend is running
3. Check network tab for failed requests
4. Clear browser cache and reload

#### Build Failures
**Problem**: `npm run build` fails

**Solutions**:
1. Delete `node_modules` and reinstall:
   ```bash
   rm -rf node_modules
   npm install
   ```
2. Clear npm cache: `npm cache clean --force`
3. Check Node.js version: `node --version` (requires 18+)

### Redis Issues

#### Connection Timeout
**Problem**: Cannot connect to Redis
```
redis.exceptions.ConnectionError: Error connecting to Redis
```

**Solutions**:
1. Check Redis is running: `docker-compose ps redis`
2. Verify Redis host/port in `.env`
3. Test connection: `redis-cli ping`
4. Application will work without Redis (caching disabled)

### Docker Issues

#### Port Already in Use
**Problem**: Cannot start container
```
Error starting userland proxy: Bind for 0.0.0.0:8000 failed: port is already allocated
```

**Solutions**:
1. Find process using port:
   ```bash
   lsof -i :8000
   kill -9 <PID>
   ```
2. Change port in `docker-compose.yml`
3. Stop all containers: `docker-compose down`

#### Out of Disk Space
**Problem**: Docker build fails with disk space error

**Solutions**:
1. Clean up Docker:
   ```bash
   docker system prune -a --volumes
   ```
2. Remove unused images: `docker image prune -a`
3. Check disk space: `df -h`

## Getting Help

If you're still experiencing issues:

1. **Check logs**:
   ```bash
   docker-compose logs -f backend
   docker-compose logs -f frontend
   ```

2. **Enable debug mode**:
   Set `ENVIRONMENT=development` in `.env`

3. **Contact support**:
   - Create GitHub issue with logs
   - Include environment details
   - Describe steps to reproduce

## Health Check Commands

```bash
# Backend health
curl http://localhost:8000/health

# Database connectivity
curl http://localhost:8000/health/ready

# Prometheus metrics
curl http://localhost:8000/metrics
```
