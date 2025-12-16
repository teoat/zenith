# API Security Quick Reference Guide

## For Developers: How to Secure Your Endpoints

---

## Basic Authentication Pattern

### Step 1: Import Dependencies

```python
from fastapi import Depends, HTTPException
from app.services.auth_service import auth_service
from core.database import User
```

### Step 2: Add to Endpoint

```python
@router.post("/your-endpoint")
async def your_function(
    request: YourRequest,
    current_user: User = Depends(auth_service.get_current_user)
):
    # Your endpoint logic here
    # current_user is now available with user details
    pass
```

---

## Admin-Only Endpoints

### Create Admin Dependency (One Time)

```python
# Add to your router file
async def require_admin(
    current_user: User = Depends(auth_service.get_current_user)
):
    if current_user.role != "admin":
        raise HTTPException(
            status_code=403, 
            detail="Admin access required"
        )
    return current_user
```

### Use in Endpoints

```python
@router.post("/admin/dangerous-operation")
async def dangerous_operation(
    admin: User = Depends(require_admin)
):
    # Only admins can access this
    pass
```

---

## User-Specific Resources

### Validate User Owns Resource

```python
@router.get("/users/{user_id}/data")
async def get_user_data(
    user_id: str,
    current_user: User = Depends(auth_service.get_current_user)
):
    # Ensure user can only access their own data
    if current_user.id != user_id and current_user.role != "admin":
        raise HTTPException(
            status_code=403,
            detail="Cannot access another user's data"
        )
    
    # Fetch and return data
    pass
```

---

## Case-Level Access Control

### Verify User Has Access to Case

```python
@router.get("/cases/{case_id}/evidence")
async def get_case_evidence(
    case_id: str,
    current_user: User = Depends(auth_service.get_current_user),
    db: Session = Depends(get_db)
):
    # Check if user has access to this case
    case = db.query(Case).filter(
        Case.id == case_id,
        Case.assigned_to == current_user.id
    ).first()
    
    if not case and current_user.role != "admin":
        raise HTTPException(
            status_code=404,
            detail="Case not found or access denied"
        )
    
    # User has access, proceed
    pass
```

---

## GET vs POST vs DELETE

### GET Endpoints (Read-Only)
```python
@router.get("/data")
async def get_data(current_user: User = Depends(auth_service.get_current_user)):
    # Still require auth for sensitive reads
    pass
```

### POST Endpoints (Create/Modify)
```python
@router.post("/data")
async def create_data(
    request: DataRequest,
    current_user: User = Depends(auth_service.get_current_user)
):
    # Log the action
    logger.info(f"User {current_user.id} creating data")
    pass
```

### DELETE Endpoints (Destructive)
```python
@router.delete("/data/{id}")
async def delete_data(
    id: str,
    admin: User = Depends(require_admin)  # Admin-only!
):
    # Log critical action
    logger.warning(f"Admin {admin.id} deleting data {id}")
    pass
```

---

## Testing Your Secured Endpoints

### Test: Unauthenticated Request Returns 401

```python
def test_endpoint_requires_auth():
    response = client.post("/api/v1/your-endpoint", json={...})
    assert response.status_code == 401
```

### Test: Invalid Token Returns 401

```python
def test_endpoint_rejects_invalid_token():
    headers = {"Authorization": "Bearer invalid_token"}
    response = client.post(
        "/api/v1/your-endpoint", 
        json={...},
        headers=headers
    )
    assert response.status_code == 401
```

### Test: Valid Auth Succeeds

```python
def test_endpoint_accepts_valid_token(auth_token):
    headers = {"Authorization": f"Bearer {auth_token}"}
    response = client.post(
        "/api/v1/your-endpoint",
        json={...},
        headers=headers
    )
    assert response.status_code == 200
```

### Test: Non-Admin Gets 403

```python
def test_admin_endpoint_rejects_non_admin(user_token):
    headers = {"Authorization": f"Bearer {user_token}"}
    response = client.post(
        "/api/v1/admin/endpoint",
        json={...},
        headers=headers
    )
    assert response.status_code == 403
```

---

## Common Mistakes to Avoid

### ❌ DON'T: Trust User Input for User ID

```python
# BAD - User can claim to be anyone
@router.get("/users/{user_id}/data")
async def get_data(user_id: str):
    return db.query(Data).filter(Data.user_id == user_id).all()
```

### ✅ DO: Use Authenticated User

```python
# GOOD - Use authenticated user
@router.get("/users/me/data")
async def get_data(current_user: User = Depends(auth_service.get_current_user)):
    return db.query(Data).filter(Data.user_id == current_user.id).all()
```

---

### ❌ DON'T: Skip Auth on "Internal" Endpoints

```python
# BAD - All endpoints should have auth
@router.post("/internal/sync")
async def sync_data():
    # Even internal endpoints need auth!
    pass
```

### ✅ DO: Secure All Endpoints

```python
# GOOD - Internal endpoints need auth too
@router.post("/internal/sync")
async def sync_data(admin: User = Depends(require_admin)):
    pass
```

---

### ❌ DON'T: Return Different Errors for Missing vs Unauthorized

```python
# BAD - Information disclosure
@router.get("/cases/{case_id}")
async def get_case(case_id: str, current_user: User = ...):
    case = db.query(Case).filter(Case.id == case_id).first()
    if not case:
        raise HTTPException(404, "Case not found")
    if case.owner_id != current_user.id:
        raise HTTPException(403, "Not authorized")
```

### ✅ DO: Return Same Error

```python
# GOOD - Don't leak existence
@router.get("/cases/{case_id}")
async def get_case(case_id: str, current_user: User = ...):
    case = db.query(Case).filter(
        Case.id == case_id,
        Case.owner_id == current_user.id
    ).first()
    
    if not case:
        # Could be missing OR unauthorized - don't tell which
        raise HTTPException(404, "Case not found")
```

---

## Audit Logging

### Log Sensitive Operations

```python
from core.logging import logger
from app.services.audit_service import audit_service

@router.post("/admin/critical-operation")
async def critical_operation(
    request: OperationRequest,
    admin: User = Depends(require_admin)
):
    # Log to audit trail
    audit_service.log_security_event(
        user_id=admin.id,
        action="CRITICAL_OPERATION",
        resource_type="system",
        details={"operation": request.operation}
    )
    
    # Also log to application logger
    logger.warning(
        f"Admin {admin.id} performed critical operation",
        extra={"admin_id": admin.id, "operation": request.operation}
    )
    
    # Perform operation
    pass
```

---

## Role Definitions

```python
# Based on your User model
class UserRole:
    VIEWER = "viewer"      # Read-only access
    ANALYST = "analyst"    # Can create cases, add evidence
    ADMIN = "admin"        # Full system access
    SUPER_ADMIN = "super_admin"  # Including user management
```

### Check Role in Endpoint

```python
@router.post("/cases/create")
async def create_case(
    request: CaseRequest,
    current_user: User = Depends(auth_service.get_current_user)
):
    # Only analysts and admins can create cases
    if current_user.role not in ["analyst", "admin", "super_admin"]:
        raise HTTPException(
            status_code=403,
            detail="Insufficient permissions to create cases"
        )
    
    # Create case
    pass
```

---

## Quick Checklist

Before merging your PR, verify:

- [ ] All endpoints have authentication (or documented reason why not)
- [ ] Admin operations require admin role
- [ ] User-specific operations validate user ownership
- [ ] Sensitive operations are audit logged
- [ ] Tests verify auth is enforced
- [ ] 401 for missing/invalid tokens
- [ ] 403 for insufficient permissions
- [ ] No information disclosure in error messages
- [ ] Documentation updated

---

## Examples from Codebase

### Good Example: AI Endpoints ✅

```python
# From backend/app/routers/ai.py

@router.post("/chat", response_model=ChatResponse)
async def ai_chat(
    request: ChatRequest, 
    current_user: User = Depends(auth_service.get_current_user)
):
    # Properly secured
    pass
```

### Good Example: Reconciliation Endpoints ✅

```python
# From backend/app/routers/reconciliation.py

@router.post("/cash-float", response_model=Dict[str, Any])
async def analyze_cash_float(
    request: CashFloatRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(auth_service.get_current_user)
):
    # Properly secured
    pass
```

---

## Need Help?

- **Security Questions:** Check `docs/security/API_SECURITY_AUDIT.md`
- **Implementation Guide:** See `docs/planning/api-security-implementation.md`
- **Code Examples:** Look at `backend/app/routers/ai.py` (fully secured)
- **Testing Examples:** See `backend/tests/integration/test_api.py`

---

**Last Updated:** 2025-12-12  
**Maintained By:** Security Team
