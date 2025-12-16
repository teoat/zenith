# API Versioning Strategy - Simple378 Fraud Detection System

## 🎯 Strategy Overview

This document defines the API versioning approach for the Simple378 Fraud Detection System API. Our strategy prioritizes **backward compatibility**, **clear deprecation policies**, and **smooth migration paths** for API consumers.

---

## 📐 Versioning Scheme

### Primary Approach: URL Path Versioning

**Format**: `/api/v{major}/resource`

**Examples**:
```
GET  /api/v1/cases
POST /api/v1/evidence
GET  /api/v2/fraud/analyze
```

**Rationale**:
- ✅ **Clear and visible**: Version immediately obvious in URL
- ✅ **Cache-friendly**: Different versions can be cached separately
- ✅ **Simple routing**: Easy to implement in API gateways
- ✅ **Browser-friendly**: Works with browser debugging tools
- ✅ **Documentation-friendly**: Easy to document and test

### Version Format Specification

**Version Number**: `v{major}`
- Major version only (v1, v2, v3, etc.)
- No minor or patch versions in public API
- Internal versioning tracked separately

**Current Version**: `v1`
**Latest Version**: `v1`

---

## 🔄 Versioning Strategy

### When to Increment Version

#### Major Version Change (v1 → v2)
A new major version is required when introducing **breaking changes**:

- **Response Schema Changes**:
  - Removing fields from response
  - Changing field types (string → number)
  - Renaming fields
  - Changing field semantics

- **Request Schema Changes**:
  - Removing support for request parameters
  - Making optional parameters required
  - Changing validation rules (stricter)
  - Changing authentication/authorization requirements

- **Behavior Changes**:
  - Changing default values
  - Changing sorting/pagination behavior
  - Changing error response formats
  - Removing endpoints

**Examples of Breaking Changes**:
```javascript
// v1: Returns user_id as string
{
  "user_id": "123",
  "name": "John Doe"
}

// v2: BREAKING - user_id now number
{
  "user_id": 123,
  "name": "John Doe"
}
```

#### Non-Breaking Changes (No Version Bump)
These changes do NOT require a new version:

- **Additive Changes**:
  - Adding new endpoints
  - Adding new optional parameters
  - Adding new fields to responses
  - Adding new enum values (if handled correctly by clients)
  - Adding new HTTP methods to existing resources

- **Internal Improvements**:
  - Performance optimizations
  - Bug fixes
  - Internal refactoring
  - Logging improvements

**Examples of Non-Breaking Changes**:
```javascript
// v1: Original response
{
  "user_id": "123",
  "name": "John Doe"
}

// v1: Non-breaking addition
{
  "user_id": "123",
  "name": "John Doe",
  "created_at": "2024-01-01T00:00:00Z"  // ✅ New field, backward compatible
}
```

---

## 🗂️ Version Management

### Version Header Support

In addition to URL versioning, support header-based version selection:

**Request Header**:
```http
GET /api/cases HTTP/1.1
Accept-Version: v1
```

**Response Headers**:
```http
HTTP/1.1 200 OK
API-Version: v1
```

### Version Negotiation Flow

```
1. Client requests /api/v1/cases
2. Server checks if v1 is supported
3. If yes → Process request with v1 logic
4. If no → Return 410 Gone (version sunset)
```

### Default Version Behavior

**No version specified** in URL or header:
```http
GET /api/cases  # No version specified
```

**Server Response**:
```http
HTTP/1.1 307 Temporary Redirect
Location: /api/v1/cases
API-Version: v1
Warning: "Unversioned API access is deprecated. Please specify version explicitly."
```

---

## 📅 Deprecation Policy

### Deprecation Timeline

| Phase | Duration | Description |
|-------|----------|-------------|
| **Announcement** | Day 0 | Deprecation announced, documentation updated |
| **Warning Period** | 6 months | API works, returns deprecation warnings |
| **Sunset Period** | 3 months | Final warning, clients must migrate |
| **End of Life** | 9 months total | API version removed |

### Deprecation Warning Headers

**Deprecated Endpoint Response**:
```http
HTTP/1.1 200 OK
Deprecation: true
Sunset: Sat, 31 Dec 2024 23:59:59 GMT
Link: </api/v2/cases>; rel="successor-version"
Warning: "299 - 'Deprecated API. Migrate to /api/v2/cases by 2024-12-31'"
```

### Deprecation Notice in Response Body

```json
{
  "data": { /* normal response */ },
  "meta": {
    "deprecated": true,
    "sunset_date": "2024-12-31T23:59:59Z",
    "migration_guide": "https://docs.example.com/api/v1-to-v2-migration",
    "successor_version": "v2"
  }
}
```

---

## 🛣️ Migration Path

### Migration Guide Structure

For each major version increment, provide:

1. **What's Changed**: List of breaking changes
2. **Migration Steps**: Step-by-step upgrade guide
3. **Code Examples**: Before/after comparison
4. **Timeline**: Deprecation and sunset dates
5. **Support**: How to get help with migration

### Example: v1 → v2 Migration Guide

```markdown
# Migrating from v1 to v2

## Breaking Changes

### 1. User ID Type Change
**v1**: User IDs returned as strings
**v2**: User IDs returned as integers

**Migration**:
- Update client code to parse user_id as number
- Check database queries for type mismatches

### 2. Pagination Changes
**v1**: `page` and `page_size` parameters
**v2**: `offset` and `limit` parameters

**Before (v1)**:
GET /api/v1/cases?page=2&page_size=20

**After (v2)**:
GET /api/v2/cases?offset=20&limit=20

### 3. Error Response Format
**v1**: Simple error messages
{
  "error": "User not found"
}

**v2**: Structured error responses
{
  "error": {
    "code": "USER_NOT_FOUND",
    "message": "User not found",
    "details": { "user_id": 123 }
  }
}

## Timeline
- **Announcement**: 2024-01-01
- **v1 Sunset**: 2024-12-31
- **v1 End of Life**: 2024-12-31
```

---

## 🔧 Implementation Details

### Backend Implementation (FastAPI)

```python
# backend/app/api/versions.py
from enum import Enum

class APIVersion(str, Enum):
    V1 = "v1"
    V2 = "v2"

SUPPORTED_VERSIONS = [APIVersion.V1]
DEPRECATED_VERSIONS = []
SUNSET_DATES = {}

# Check if version is supported
def validate_version(version: str) -> bool:
    return version in SUPPORTED_VERSIONS
```

### Router Configuration

```python
# backend/app/api/v1/__init__.py
from fastapi import APIRouter

router = APIRouter(prefix="/api/v1", tags=["v1"])

# Include sub-routers
from app.api.v1 import cases, evidence, fraud

router.include_router(cases.router)
router.include_router(evidence.router)
router.include_router(fraud.router)
```

### Main Application

```python
# backend/main.py
from app.api.v1 import router as v1_router

app = FastAPI(title="Simple378 API")

# Version routing
app.include_router(v1_router)

# Default redirect to latest version
@app.get("/api/cases")
async def redirect_to_versioned():
    return RedirectResponse(url="/api/v1/cases", status_code=307)
```

### Deprecation Middleware

```python
# backend/app/middleware/deprecation.py
from datetime import datetime
from fastapi import Request, Response
from starlette.middleware.base import BaseHTTPMiddleware

class DeprecationMiddleware(BaseHTTPMiddleware):
    async def dispatch(self, request: Request, call_next):
        response = await call_next(request)
        
        # Check if this version is deprecated
        version = extract_version(request.url.path)
        if version in DEPRECATED_VERSIONS:
            sunset_date = SUNSET_DATES.get(version)
            response.headers["Deprecation"] = "true"
            if sunset_date:
                response.headers["Sunset"] = sunset_date.strftime("%a, %d %b %Y %H:%M:%S GMT")
            response.headers["Warning"] = f"299 - 'API version {version} is deprecated'"
        
        # Always indicate current version
        response.headers["API-Version"] = version
        
        return response
```

---

## 📊 Version Support Matrix

| Version | Status | Released | Deprecated | Sunset | End of Life |
|---------|--------|----------|------------|--------|-------------|
| v1 | ✅ Current | 2024-01-01 | - | - | - |
| v2 | 🔄 Planned | 2025-Q2 | - | - | - |

---

## 📖 Documentation Strategy

### OpenAPI Specification

Maintain separate OpenAPI specs for each version:

```
docs/api-docs/
├── openapi-v1.yaml
├── openapi-v2.yaml
└── swagger-ui/
    ├── v1.html
    └── v2.html
```

### Versioned Documentation URLs

```
https://docs.example.com/api/v1/
https://docs.example.com/api/v2/
https://docs.example.com/api/migration/v1-to-v2/
```

### Changelog

Maintain detailed changelog with version tags:

```markdown
# API Changelog

## v1.1.0 (2024-06-01) - No version bump required
### Added
- New endpoint: `POST /api/v1/fraud/bulk-analyze`
- New optional field: `priority` in case creation

### Fixed
- Improved error messages for authentication failures

## v1.0.0 (2024-01-01) - Initial Release
### Added
- Authentication endpoints
- Case management endpoints
- Evidence management endpoints
- Fraud detection endpoints
```

---

## 🧪 Testing Strategy

### Version-Specific Tests

```python
# tests/api/test_v1_cases.py
def test_v1_list_cases():
    response = client.get("/api/v1/cases")
    assert response.status_code == 200
    assert "user_id" in response.json()[0]
    assert isinstance(response.json()[0]["user_id"], str)  # v1 returns strings

# tests/api/test_v2_cases.py
def test_v2_list_cases():
    response = client.get("/api/v2/cases")
    assert response.status_code == 200
    assert "user_id" in response.json()[0]
    assert isinstance(response.json()[0]["user_id"], int)  # v2 returns integers
```

### Compatibility Tests

```python
# Ensure v1 and v2 can coexist
def test_version_coexistence():
    v1_response = client.get("/api/v1/cases")
    v2_response = client.get("/api/v2/cases")
    assert v1_response.status_code == 200
    assert v2_response.status_code == 200
```

---

## 🚀 Rollout Strategy

### New Version Rollout Phases

#### Phase 1: Alpha (Internal Testing)
- Version deployed to staging environment
- Internal team testing
- Documentation review
- Performance benchmarking

#### Phase 2: Beta (Early Access)
- Invite select partners to beta test
- Gather feedback
- Fix critical issues
- Finalize breaking changes

#### Phase 3: Release Candidate
- Public documentation published
- Migration guide available
- Deprecation timeline announced
- Final testing period

#### Phase 4: General Availability
- Version marked as stable
- Old version marked as deprecated
- Monitoring and support

#### Phase 5: Sunset
- Old version removed
- Only new version supported

---

## 📞 Communication Plan

### Stakeholder Communication

**Version Announcement** (Day 0):
- ✉️ Email to all API consumers
- 📢 Blog post announcement
- 📝 Documentation update
- 🔔 In-app notification

**Deprecation Notice** (6 months before sunset):
- ✉️ Reminder email
- ⚠️ Warning in API responses
- 📊 Usage analytics review

**Final Warning** (3 months before sunset):
- ✉️ Urgent migration email
- 🔴 Critical warning in API responses
- 📞 Direct outreach to high-volume users

**End of Life** (Sunset date):
- 🚫 Version removed
- 📧 Confirmation email
- 📖 Documentation archived

---

## 🎯 Success Metrics

### Version Adoption Metrics
- **v1 Active Users**: Track daily/monthly active users on v1
- **v2 Adoption Rate**: % of users migrated to v2
- **Migration Velocity**: Users migrating per week
- **Support Tickets**: Version-related issues reported

### Quality Metrics
- **Breaking Changes**: Count per major version
- **Backward Compatibility**: % of non-breaking changes
- **Migration Success Rate**: % of users successfully migrated
- **Downtime During Migration**: Target 0 downtime

---

## 📚 Best Practices

### For API Developers

1. **Design for Extensibility**: Add fields carefully, anticipate future needs
2. **Never Remove Fields**: Mark as deprecated, but keep for backward compatibility
3. **Add Optional Fields**: New fields should be optional when possible
4. **Document Everything**: Every change, no matter how small
5. **Test Compatibility**: Ensure old clients work with new server

### For API Consumers

1. **Specify Version Explicitly**: Always use `/api/v1/` in production
2. **Handle New Fields Gracefully**: Ignore unknown fields
3. **Monitor Deprecation Headers**: Watch for `Deprecation` and `Sunset` headers
4. **Test Against Beta**: Participate in beta testing of new versions
5. **Plan for Migration**: Budget time for version upgrades

---

## 🔮 Future Considerations

### Potential Enhancements

- **GraphQL Support**: Consider GraphQL for more flexible versioning
- **API Gateway**: Centralized version management and routing
- **Auto-Generated Client Libraries**: Version-specific SDKs
- **Contract Testing**: Consumer-driven contract tests
- **Version Analytics Dashboard**: Real-time version usage metrics

---

## ✅ Implementation Checklist

### Initial Setup
- [x] URL path versioning implemented (v1)
- [ ] Version header support
- [ ] Deprecation middleware
- [ ] OpenAPI spec for v1
- [ ] Version documentation

### Processes
- [ ] Version increment decision tree
- [ ] Deprecation notification template
- [ ] Migration guide template
- [ ] Changelog maintenance process
- [ ] Stakeholder communication plan

### Monitoring
- [ ] Version usage analytics
- [ ] Deprecation warning tracking
- [ ] Migration progress dashboard
- [ ] API compatibility testing in CI/CD

---

## 📚 References

- [Semantic Versioning](https://semver.org/)
- [API Versioning Best Practices](https://restfulapi.net/versioning/)
- [RFC 8594 - Sunset Header](https://datatracker.ietf.org/doc/html/rfc8594)
- [Microsoft API Guidelines](https://github.com/microsoft/api-guidelines)
- [Stripe API Versioning](https://stripe.com/docs/api/versioning)
