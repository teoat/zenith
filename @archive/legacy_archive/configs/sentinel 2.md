## 2026-01-03 - Critical Authentication Middleware Failure & IDOR

**Vulnerability:**
1. **Critical Service Failure:** `AuthenticationMiddleware` called a non-existent method `auth_service.validate_jwt_token`, causing 500 errors on all authenticated requests. This likely happened after a refactor of `AuthService` where the method was renamed or removed but middleware wasn't updated.
2. **IDOR:** The `download_evidence` endpoint lacked RBAC checks (commented out TODO), allowing any authenticated user to download any evidence file by ID.

**Learning:**
- **Middleware Coupling:** Middleware often relies on specific service implementations (like `AuthService`). When services are refactored, middleware can easily break if not covered by integration tests that actually spin up the full app stack.
- **Dead Code/TODOs:** Commented out security checks (TODOs) in production code are dangerous. They indicate known gaps that were left open.
- **Instance vs Class Patching:** Patching python objects in tests is tricky when modules import instances. Patching the *module attribute* where it is consumed (e.g. `backend.app.middleware.authentication.auth_service`) is often more reliable than patching the source definition.

**Prevention:**
1. **Contract Testing:** Enforce interfaces for services used by middleware.
2. **Security Linters:** Flag "TODO" comments in security-sensitive files (routers, auth).
3. **Integration Tests:** Ensure basic "happy path" login+request tests run in CI/CD to catch middleware regressions immediately.
