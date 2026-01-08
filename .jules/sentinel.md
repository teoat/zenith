## 2025-12-17 - Duplicate Routes & Shim Confusion
**Vulnerability:** Found duplicate `register` routes in `backend/app/routers/auth.py` where the second one (less secure, leaking errors) overwrote the first (secure). Also found `create_user` ignoring provided passwords.
**Learning:** In FastAPI, if multiple routes match the same path/method, the last one defined takes precedence. This can accidentally expose insecure endpoints. Also, the project has a `app` shim at root that shadows `backend/app` if `PYTHONPATH` is not strictly managed, causing tests to run against stub implementations.
**Prevention:** Ensure strict linting for duplicate route definitions. Always verify which module is actually being imported in tests when directory structures are ambiguous (root `app` vs `backend/app`).

## 2025-12-19 - Missing Authentication on Evidence Endpoints
**Vulnerability:** Several sensitive endpoints in `backend/app/routers/evidence.py` (download, list, upload, highlights) were completely missing authentication checks, allowing unauthenticated access to sensitive case evidence.
**Learning:** Developers added authentication dependencies to some endpoints but missed others in the same file. It is easy to overlook `Depends(get_current_user)` when copying/pasting or iterating quickly. The `download_evidence` endpoint was particularly critical as it allowed file exfiltration.
**Prevention:**
1.  Apply authentication at the `APIRouter` level (using `dependencies=[Depends(get_current_user)]`) if all endpoints in a router require auth.
2.  Use a linter or security scanner (like `bandit` or custom scripts) to verify that sensitive routes have auth dependencies.
3.  Add integration tests that explicitly check for 401/403 responses for unauthenticated requests to all endpoints.

## 2024-05-23 - Critical: Secrets tracked in git
**Vulnerability:** The `.env` file containing secrets (potentially including API keys and database credentials) was being tracked by git.
**Learning:** Checking `.gitignore` is not enough; one must verify what is actually in the git index (`git ls-files`). Merge conflicts in `.gitignore` can hide missing exclusions.
**Prevention:**
1. Always add `.env` to `.gitignore` immediately upon project creation.
2. Use a pre-commit hook to scan for high-entropy strings or known secret filenames.
3. Periodically run `git ls-files` to audit tracked files.

## 2025-12-20 - [Rate Limiting Path Mismatch]
**Vulnerability:** Authentication endpoints (/auth/login) were configured for strict rate limiting, but the application served them under /api/v1/auth/login. This caused them to fall back to the default, much looser rate limit.
**Learning:** Middleware often sees the full path including prefixes. Configuration keys must match the runtime request path exactly.
**Prevention:** Always verify rate limit configurations with integration tests that check the effective limit on the full path.

## 2025-12-20 - Ghost User Refresh
**Vulnerability:** The `refresh_token` endpoint contained a fallback mechanism that issued valid access tokens for an "unknown" user (role: "analyst") if the user lookup failed (e.g., user deleted). This allowed malicious actors with a valid refresh token to maintain access even after their account was deleted.
**Learning:** Fallback mechanisms intended for robustness (like handling "unknown" states) can inadvertently introduce security holes by defaulting to an authorized state ("Fail Open"). Authentication logic must always "Fail Closed".
**Prevention:**
1. Never issue tokens if the user entity cannot be strictly verified.
2. Verify `user_id` against the database on every refresh.
3. Implement tests that specifically simulate deleted/banned user scenarios for all auth flows.
