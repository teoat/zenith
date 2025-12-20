## 2025-12-17 - Duplicate Routes & Shim Confusion
**Vulnerability:** Found duplicate `register` routes in `backend/app/routers/auth.py` where the second one (less secure, leaking errors) overwrote the first (secure). Also found `create_user` ignoring provided passwords.
**Learning:** In FastAPI, if multiple routes match the same path/method, the last one defined takes precedence. This can accidentally expose insecure endpoints. Also, the project has a `app` shim at root that shadows `backend/app` if `PYTHONPATH` is not strictly managed, causing tests to run against stub implementations.
**Prevention:** Ensure strict linting for duplicate route definitions. Always verify which module is actually being imported in tests when directory structures are ambiguous (root `app` vs `backend/app`).
