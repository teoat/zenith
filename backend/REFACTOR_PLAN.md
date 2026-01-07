# Refactoring Plan for main.py

## Objective

Reduce `backend/main.py` from ~1400 lines to <100 lines by modularizing concerns.

## New Structure

### 1. `backend/app/lifespan.py`

**Content**: The `lifespan` async context manager.

- **Why**: Currently occupies ~400 lines with complex startup phases (DB, Integrity, Monitoring, Circuit Breakers).
- **Benefit**: Easier to test startup logic in isolation.

### 2. `backend/app/middleware_setup.py`

**Content**: `setup_middleware(app: FastAPI)`

- **Why**: Currently occupies ~200 lines mixing CORS, Security, APM, RateLimiting, etc.
- **Benefit**: Centralized place to see the request processing pipeline.

### 3. `backend/app/router_setup.py`

**Content**: `setup_routers(app: FastAPI)`

- **Why**: Currently lists ~40 imports and inclusions.
- **Benefit**: Clean registration of API routes.

### 4. `backend/app/factory.py`

**Content**: `create_app() -> FastAPI`

- **Why**: The factory pattern allows creating app instances for testing with different configs (e.g., bypassing some middleware).
- **Structure**:

  ```python
  def create_app() -> FastAPI:
      app = FastAPI(lifespan=lifespan...)
      setup_middleware(app)
      setup_routers(app)
      return app
  ```

### 5. `backend/core/utils.py` (New or Update)

**Content**: Move `safe_call`, `log_security_event`, `log_auth_failure` from `main.py`.

- **Why**: These are generic utilities used across the app, not just in main.

## Execution Steps

1. Create the new files in `backend/app/`.
2. Copy logic from `main.py` to new files, adjusting imports.
3. Rewrite `main.py` to import and usage `create_app()`.
4. Verify application startup.

## Estimated Results

- `main.py` size: ~50 lines.
- Readability: Significantly improved.
- Testability: Startup logic and Middleware logic can be tested separately.
