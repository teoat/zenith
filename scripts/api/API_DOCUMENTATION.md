# Zenith Fraud Detection Platform - API Documentation

**Generated on:** 2025-12-17 13:26:17
**Total Routers:** 35
**Total Endpoints:** 25

## API Overview

This API provides comprehensive fraud detection and investigation capabilities for the Zenith platform.

### Base URL
```
http://localhost:8000/api/v1
```

### Authentication
All endpoints require Bearer token authentication:
```
Authorization: Bearer <jwt_token>
```

## API Endpoints by Router

### ADMIN Router
**Endpoints:** 0
**Tags:** None

⚠️ **Error loading router:** No module named 'app.services.audit_service'
Traceback (most recent call last):
  File "/Users/Arief/Desktop/Zenith/scripts/generate_api_docs.py", line 23, in get_router_info
    module = importlib.import_module(f"app.routers.{module_name}")
             ^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^
  File "/Users/Arief/anaconda3/lib/python3.11/importlib/__init__.py", line 126, in import_module
    return _bootstrap._gcd_import(name[level:], package, level)
           ^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^
  File "<frozen importlib._bootstrap>", line 1204, in _gcd_import
  File "<frozen importlib._bootstrap>", line 1176, in _find_and_load
  File "<frozen importlib._bootstrap>", line 1147, in _find_and_load_unlocked
  File "<frozen importlib._bootstrap>", line 690, in _load_unlocked
  File "<frozen importlib._bootstrap_external>", line 940, in exec_module
  File "<frozen importlib._bootstrap>", line 241, in _call_with_frames_removed
  File "/Users/Arief/Desktop/Zenith/backend/app/routers/admin.py", line 6, in <module>
    from app.services.audit_service import audit_service
ModuleNotFoundError: No module named 'app.services.audit_service'


### ADVANCED_AI Router
**Endpoints:** 6
**Tags:** None

#### POST /advanced-ai/rag/query
**Route Name:** local_rag_query
**Summary:** None

Retrieve documents using Local RAG (TF-IDF/Cosine Similarity).

Retrieve documents using Local RAG (TF-IDF/Cosine Similarity).

**Parameters:**
- Path parameters as defined in route
- Query parameters as applicable
- Request body for POST/PUT requests

**Responses:**
- `200`: Success
- `400`: Bad Request
- `401`: Unauthorized
- `403`: Forbidden
- `404`: Not Found
- `500`: Internal Server Error

---

#### POST /advanced-ai/rag/add
**Route Name:** local_rag_add
**Summary:** None

Add a document to the local vector store.

Add a document to the local vector store.

**Parameters:**
- Path parameters as defined in route
- Query parameters as applicable
- Request body for POST/PUT requests

**Responses:**
- `200`: Success
- `400`: Bad Request
- `401`: Unauthorized
- `403`: Forbidden
- `404`: Not Found
- `500`: Internal Server Error

---

#### POST /advanced-ai/multimodal/image
**Route Name:** analyze_image
**Summary:** None

Analyze an image for metadata and text (OCR).

Analyze an image for metadata and text (OCR).

**Parameters:**
- Path parameters as defined in route
- Query parameters as applicable
- Request body for POST/PUT requests

**Responses:**
- `200`: Success
- `400`: Bad Request
- `401`: Unauthorized
- `403`: Forbidden
- `404`: Not Found
- `500`: Internal Server Error

---

#### POST /advanced-ai/multimodal/text
**Route Name:** analyze_text
**Summary:** None

Analyze text for fraud indicators.

Analyze text for fraud indicators.

**Parameters:**
- Path parameters as defined in route
- Query parameters as applicable
- Request body for POST/PUT requests

**Responses:**
- `200`: Success
- `400`: Bad Request
- `401`: Unauthorized
- `403`: Forbidden
- `404`: Not Found
- `500`: Internal Server Error

---

#### POST /advanced-ai/red-team/generate
**Route Name:** generate_red_team_prompts
**Summary:** None

Generate adversarial prompts to test a feature.

Generate adversarial prompts to test a feature.

**Parameters:**
- Path parameters as defined in route
- Query parameters as applicable
- Request body for POST/PUT requests

**Responses:**
- `200`: Success
- `400`: Bad Request
- `401`: Unauthorized
- `403`: Forbidden
- `404`: Not Found
- `500`: Internal Server Error

---

#### GET /advanced-ai/stats
**Route Name:** ai_stats
**Summary:** None

Get statistics about the advanced AI services.

Get statistics about the advanced AI services.

**Parameters:**
- Path parameters as defined in route
- Query parameters as applicable
- Request body for POST/PUT requests

**Responses:**
- `200`: Success
- `400`: Bad Request
- `401`: Unauthorized
- `403`: Forbidden
- `404`: Not Found
- `500`: Internal Server Error

---

### AI Router
**Endpoints:** 0
**Tags:** None

⚠️ **Error loading router:** No module named 'app.services.cache_service'
Traceback (most recent call last):
  File "/Users/Arief/Desktop/Zenith/scripts/generate_api_docs.py", line 23, in get_router_info
    module = importlib.import_module(f"app.routers.{module_name}")
             ^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^
  File "/Users/Arief/anaconda3/lib/python3.11/importlib/__init__.py", line 126, in import_module
    return _bootstrap._gcd_import(name[level:], package, level)
           ^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^
  File "<frozen importlib._bootstrap>", line 1204, in _gcd_import
  File "<frozen importlib._bootstrap>", line 1176, in _find_and_load
  File "<frozen importlib._bootstrap>", line 1147, in _find_and_load_unlocked
  File "<frozen importlib._bootstrap>", line 690, in _load_unlocked
  File "<frozen importlib._bootstrap_external>", line 940, in exec_module
  File "<frozen importlib._bootstrap>", line 241, in _call_with_frames_removed
  File "/Users/Arief/Desktop/Zenith/backend/app/routers/ai.py", line 26, in <module>
    from app.services.infrastructure.auth_service import auth_service
  File "/Users/Arief/Desktop/Zenith/backend/app/services/infrastructure/auth_service.py", line 13, in <module>
    from app.services.infrastructure.storage.database_service import db_service
  File "/Users/Arief/Desktop/Zenith/backend/app/services/infrastructure/storage/database_service.py", line 8, in <module>
    from app.services.cache_service import cache_manager, cached
ModuleNotFoundError: No module named 'app.services.cache_service'


### ANALYTICS Router
**Endpoints:** 0
**Tags:** None

⚠️ **Error loading router:** No module named 'app.services.cache_service'
Traceback (most recent call last):
  File "/Users/Arief/Desktop/Zenith/scripts/generate_api_docs.py", line 23, in get_router_info
    module = importlib.import_module(f"app.routers.{module_name}")
             ^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^
  File "/Users/Arief/anaconda3/lib/python3.11/importlib/__init__.py", line 126, in import_module
    return _bootstrap._gcd_import(name[level:], package, level)
           ^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^
  File "<frozen importlib._bootstrap>", line 1204, in _gcd_import
  File "<frozen importlib._bootstrap>", line 1176, in _find_and_load
  File "<frozen importlib._bootstrap>", line 1147, in _find_and_load_unlocked
  File "<frozen importlib._bootstrap>", line 690, in _load_unlocked
  File "<frozen importlib._bootstrap_external>", line 940, in exec_module
  File "<frozen importlib._bootstrap>", line 241, in _call_with_frames_removed
  File "/Users/Arief/Desktop/Zenith/backend/app/routers/analytics.py", line 10, in <module>
    from app.services.infrastructure.auth_service import auth_service
  File "/Users/Arief/Desktop/Zenith/backend/app/services/infrastructure/auth_service.py", line 13, in <module>
    from app.services.infrastructure.storage.database_service import db_service
  File "/Users/Arief/Desktop/Zenith/backend/app/services/infrastructure/storage/database_service.py", line 8, in <module>
    from app.services.cache_service import cache_manager, cached
ModuleNotFoundError: No module named 'app.services.cache_service'


### APM Router
**Endpoints:** 0
**Tags:** None

⚠️ **Error loading router:** No module named 'app.services.apm_service'
Traceback (most recent call last):
  File "/Users/Arief/Desktop/Zenith/scripts/generate_api_docs.py", line 23, in get_router_info
    module = importlib.import_module(f"app.routers.{module_name}")
             ^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^
  File "/Users/Arief/anaconda3/lib/python3.11/importlib/__init__.py", line 126, in import_module
    return _bootstrap._gcd_import(name[level:], package, level)
           ^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^
  File "<frozen importlib._bootstrap>", line 1204, in _gcd_import
  File "<frozen importlib._bootstrap>", line 1176, in _find_and_load
  File "<frozen importlib._bootstrap>", line 1147, in _find_and_load_unlocked
  File "<frozen importlib._bootstrap>", line 690, in _load_unlocked
  File "<frozen importlib._bootstrap_external>", line 940, in exec_module
  File "<frozen importlib._bootstrap>", line 241, in _call_with_frames_removed
  File "/Users/Arief/Desktop/Zenith/backend/app/routers/apm.py", line 9, in <module>
    from app.services.apm_service import (
ModuleNotFoundError: No module named 'app.services.apm_service'


### AUDIT Router
**Endpoints:** 1
**Tags:** None

#### GET /
**Route Name:** get_audit_logs
**Summary:** None

Returns paginated audit logs

Returns paginated audit logs

**Parameters:**
- Path parameters as defined in route
- Query parameters as applicable
- Request body for POST/PUT requests

**Responses:**
- `200`: Success
- `400`: Bad Request
- `401`: Unauthorized
- `403`: Forbidden
- `404`: Not Found
- `500`: Internal Server Error

---

### AUTH Router
**Endpoints:** 0
**Tags:** None

⚠️ **Error loading router:** No module named 'app.services.cache_service'
Traceback (most recent call last):
  File "/Users/Arief/Desktop/Zenith/scripts/generate_api_docs.py", line 23, in get_router_info
    module = importlib.import_module(f"app.routers.{module_name}")
             ^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^
  File "/Users/Arief/anaconda3/lib/python3.11/importlib/__init__.py", line 126, in import_module
    return _bootstrap._gcd_import(name[level:], package, level)
           ^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^
  File "<frozen importlib._bootstrap>", line 1204, in _gcd_import
  File "<frozen importlib._bootstrap>", line 1176, in _find_and_load
  File "<frozen importlib._bootstrap>", line 1147, in _find_and_load_unlocked
  File "<frozen importlib._bootstrap>", line 690, in _load_unlocked
  File "<frozen importlib._bootstrap_external>", line 940, in exec_module
  File "<frozen importlib._bootstrap>", line 241, in _call_with_frames_removed
  File "/Users/Arief/Desktop/Zenith/backend/app/routers/auth.py", line 7, in <module>
    from app.services.infrastructure.auth_service import auth_service
  File "/Users/Arief/Desktop/Zenith/backend/app/services/infrastructure/auth_service.py", line 13, in <module>
    from app.services.infrastructure.storage.database_service import db_service
  File "/Users/Arief/Desktop/Zenith/backend/app/services/infrastructure/storage/database_service.py", line 8, in <module>
    from app.services.cache_service import cache_manager, cached
ModuleNotFoundError: No module named 'app.services.cache_service'


### BACKUP Router
**Endpoints:** 0
**Tags:** None

⚠️ **Error loading router:** No module named 'app.services.audit_service'
Traceback (most recent call last):
  File "/Users/Arief/Desktop/Zenith/scripts/generate_api_docs.py", line 23, in get_router_info
    module = importlib.import_module(f"app.routers.{module_name}")
             ^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^
  File "/Users/Arief/anaconda3/lib/python3.11/importlib/__init__.py", line 126, in import_module
    return _bootstrap._gcd_import(name[level:], package, level)
           ^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^
  File "<frozen importlib._bootstrap>", line 1204, in _gcd_import
  File "<frozen importlib._bootstrap>", line 1176, in _find_and_load
  File "<frozen importlib._bootstrap>", line 1147, in _find_and_load_unlocked
  File "<frozen importlib._bootstrap>", line 690, in _load_unlocked
  File "<frozen importlib._bootstrap_external>", line 940, in exec_module
  File "<frozen importlib._bootstrap>", line 241, in _call_with_frames_removed
  File "/Users/Arief/Desktop/Zenith/backend/app/routers/backup.py", line 16, in <module>
    from app.services.audit_service import audit_service
ModuleNotFoundError: No module named 'app.services.audit_service'


### CASES Router
**Endpoints:** 0
**Tags:** None

⚠️ **Error loading router:** No module named 'app.services.cache_service'
Traceback (most recent call last):
  File "/Users/Arief/Desktop/Zenith/scripts/generate_api_docs.py", line 23, in get_router_info
    module = importlib.import_module(f"app.routers.{module_name}")
             ^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^
  File "/Users/Arief/anaconda3/lib/python3.11/importlib/__init__.py", line 126, in import_module
    return _bootstrap._gcd_import(name[level:], package, level)
           ^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^
  File "<frozen importlib._bootstrap>", line 1204, in _gcd_import
  File "<frozen importlib._bootstrap>", line 1176, in _find_and_load
  File "<frozen importlib._bootstrap>", line 1147, in _find_and_load_unlocked
  File "<frozen importlib._bootstrap>", line 690, in _load_unlocked
  File "<frozen importlib._bootstrap_external>", line 940, in exec_module
  File "<frozen importlib._bootstrap>", line 241, in _call_with_frames_removed
  File "/Users/Arief/Desktop/Zenith/backend/app/routers/cases.py", line 11, in <module>
    from app.services.infrastructure.auth_service import auth_service
  File "/Users/Arief/Desktop/Zenith/backend/app/services/infrastructure/auth_service.py", line 13, in <module>
    from app.services.infrastructure.storage.database_service import db_service
  File "/Users/Arief/Desktop/Zenith/backend/app/services/infrastructure/storage/database_service.py", line 8, in <module>
    from app.services.cache_service import cache_manager, cached
ModuleNotFoundError: No module named 'app.services.cache_service'


### COLLABORATION Router
**Endpoints:** 0
**Tags:** None

⚠️ **Error loading router:** No module named 'app.services.collaboration_service'
Traceback (most recent call last):
  File "/Users/Arief/Desktop/Zenith/scripts/generate_api_docs.py", line 23, in get_router_info
    module = importlib.import_module(f"app.routers.{module_name}")
             ^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^
  File "/Users/Arief/anaconda3/lib/python3.11/importlib/__init__.py", line 126, in import_module
    return _bootstrap._gcd_import(name[level:], package, level)
           ^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^
  File "<frozen importlib._bootstrap>", line 1204, in _gcd_import
  File "<frozen importlib._bootstrap>", line 1176, in _find_and_load
  File "<frozen importlib._bootstrap>", line 1147, in _find_and_load_unlocked
  File "<frozen importlib._bootstrap>", line 690, in _load_unlocked
  File "<frozen importlib._bootstrap_external>", line 940, in exec_module
  File "<frozen importlib._bootstrap>", line 241, in _call_with_frames_removed
  File "/Users/Arief/Desktop/Zenith/backend/app/routers/collaboration.py", line 10, in <module>
    from app.services.collaboration_service import (
ModuleNotFoundError: No module named 'app.services.collaboration_service'


### COMPLIANCE Router
**Endpoints:** 0
**Tags:** None

⚠️ **Error loading router:** No module named 'app.services.compliance_service'
Traceback (most recent call last):
  File "/Users/Arief/Desktop/Zenith/scripts/generate_api_docs.py", line 23, in get_router_info
    module = importlib.import_module(f"app.routers.{module_name}")
             ^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^
  File "/Users/Arief/anaconda3/lib/python3.11/importlib/__init__.py", line 126, in import_module
    return _bootstrap._gcd_import(name[level:], package, level)
           ^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^
  File "<frozen importlib._bootstrap>", line 1204, in _gcd_import
  File "<frozen importlib._bootstrap>", line 1176, in _find_and_load
  File "<frozen importlib._bootstrap>", line 1147, in _find_and_load_unlocked
  File "<frozen importlib._bootstrap>", line 690, in _load_unlocked
  File "<frozen importlib._bootstrap_external>", line 940, in exec_module
  File "<frozen importlib._bootstrap>", line 241, in _call_with_frames_removed
  File "/Users/Arief/Desktop/Zenith/backend/app/routers/compliance.py", line 7, in <module>
    from app.services.compliance_service import ComplianceService
ModuleNotFoundError: No module named 'app.services.compliance_service'


### DIAGNOSTICS Router
**Endpoints:** 0
**Tags:** None

⚠️ **Error loading router:** No module named 'app.services.core.auth_service'
Traceback (most recent call last):
  File "/Users/Arief/Desktop/Zenith/scripts/generate_api_docs.py", line 23, in get_router_info
    module = importlib.import_module(f"app.routers.{module_name}")
             ^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^
  File "/Users/Arief/anaconda3/lib/python3.11/importlib/__init__.py", line 126, in import_module
    return _bootstrap._gcd_import(name[level:], package, level)
           ^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^
  File "<frozen importlib._bootstrap>", line 1204, in _gcd_import
  File "<frozen importlib._bootstrap>", line 1176, in _find_and_load
  File "<frozen importlib._bootstrap>", line 1147, in _find_and_load_unlocked
  File "<frozen importlib._bootstrap>", line 690, in _load_unlocked
  File "<frozen importlib._bootstrap_external>", line 940, in exec_module
  File "<frozen importlib._bootstrap>", line 241, in _call_with_frames_removed
  File "/Users/Arief/Desktop/Zenith/backend/app/routers/diagnostics.py", line 6, in <module>
    from app.services.core.auth_service import auth_service
ModuleNotFoundError: No module named 'app.services.core.auth_service'


### EVIDENCE Router
**Endpoints:** 0
**Tags:** None

⚠️ **Error loading router:** No module named 'app.services.cache_service'
Traceback (most recent call last):
  File "/Users/Arief/Desktop/Zenith/scripts/generate_api_docs.py", line 23, in get_router_info
    module = importlib.import_module(f"app.routers.{module_name}")
             ^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^
  File "/Users/Arief/anaconda3/lib/python3.11/importlib/__init__.py", line 126, in import_module
    return _bootstrap._gcd_import(name[level:], package, level)
           ^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^
  File "<frozen importlib._bootstrap>", line 1204, in _gcd_import
  File "<frozen importlib._bootstrap>", line 1176, in _find_and_load
  File "<frozen importlib._bootstrap>", line 1147, in _find_and_load_unlocked
  File "<frozen importlib._bootstrap>", line 690, in _load_unlocked
  File "<frozen importlib._bootstrap_external>", line 940, in exec_module
  File "<frozen importlib._bootstrap>", line 241, in _call_with_frames_removed
  File "/Users/Arief/Desktop/Zenith/backend/app/routers/evidence.py", line 23, in <module>
    from app.services.infrastructure.auth_service import auth_service
  File "/Users/Arief/Desktop/Zenith/backend/app/services/infrastructure/auth_service.py", line 13, in <module>
    from app.services.infrastructure.storage.database_service import db_service
  File "/Users/Arief/Desktop/Zenith/backend/app/services/infrastructure/storage/database_service.py", line 8, in <module>
    from app.services.cache_service import cache_manager, cached
ModuleNotFoundError: No module named 'app.services.cache_service'


### FRAUD Router
**Endpoints:** 0
**Tags:** None

⚠️ **Error loading router:** No module named 'app.services.cache_service'
Traceback (most recent call last):
  File "/Users/Arief/Desktop/Zenith/scripts/generate_api_docs.py", line 23, in get_router_info
    module = importlib.import_module(f"app.routers.{module_name}")
             ^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^
  File "/Users/Arief/anaconda3/lib/python3.11/importlib/__init__.py", line 126, in import_module
    return _bootstrap._gcd_import(name[level:], package, level)
           ^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^
  File "<frozen importlib._bootstrap>", line 1204, in _gcd_import
  File "<frozen importlib._bootstrap>", line 1176, in _find_and_load
  File "<frozen importlib._bootstrap>", line 1147, in _find_and_load_unlocked
  File "<frozen importlib._bootstrap>", line 690, in _load_unlocked
  File "<frozen importlib._bootstrap_external>", line 940, in exec_module
  File "<frozen importlib._bootstrap>", line 241, in _call_with_frames_removed
  File "/Users/Arief/Desktop/Zenith/backend/app/routers/fraud.py", line 9, in <module>
    from app.services.infrastructure.auth_service import auth_service
  File "/Users/Arief/Desktop/Zenith/backend/app/services/infrastructure/auth_service.py", line 13, in <module>
    from app.services.infrastructure.storage.database_service import db_service
  File "/Users/Arief/Desktop/Zenith/backend/app/services/infrastructure/storage/database_service.py", line 8, in <module>
    from app.services.cache_service import cache_manager, cached
ModuleNotFoundError: No module named 'app.services.cache_service'


### FRAUD_RULES Router
**Endpoints:** 0
**Tags:** None

⚠️ **Error loading router:** No module named 'app.services.fraud_rules_engine'
Traceback (most recent call last):
  File "/Users/Arief/Desktop/Zenith/scripts/generate_api_docs.py", line 23, in get_router_info
    module = importlib.import_module(f"app.routers.{module_name}")
             ^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^
  File "/Users/Arief/anaconda3/lib/python3.11/importlib/__init__.py", line 126, in import_module
    return _bootstrap._gcd_import(name[level:], package, level)
           ^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^
  File "<frozen importlib._bootstrap>", line 1204, in _gcd_import
  File "<frozen importlib._bootstrap>", line 1176, in _find_and_load
  File "<frozen importlib._bootstrap>", line 1147, in _find_and_load_unlocked
  File "<frozen importlib._bootstrap>", line 690, in _load_unlocked
  File "<frozen importlib._bootstrap_external>", line 940, in exec_module
  File "<frozen importlib._bootstrap>", line 241, in _call_with_frames_removed
  File "/Users/Arief/Desktop/Zenith/backend/app/routers/fraud_rules.py", line 14, in <module>
    from app.services.fraud_rules_engine import get_fraud_engine
ModuleNotFoundError: No module named 'app.services.fraud_rules_engine'


### GRAPH Router
**Endpoints:** 0
**Tags:** None

⚠️ **Error loading router:** No module named 'app.services.cache_service'
Traceback (most recent call last):
  File "/Users/Arief/Desktop/Zenith/scripts/generate_api_docs.py", line 23, in get_router_info
    module = importlib.import_module(f"app.routers.{module_name}")
             ^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^
  File "/Users/Arief/anaconda3/lib/python3.11/importlib/__init__.py", line 126, in import_module
    return _bootstrap._gcd_import(name[level:], package, level)
           ^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^
  File "<frozen importlib._bootstrap>", line 1204, in _gcd_import
  File "<frozen importlib._bootstrap>", line 1176, in _find_and_load
  File "<frozen importlib._bootstrap>", line 1147, in _find_and_load_unlocked
  File "<frozen importlib._bootstrap>", line 690, in _load_unlocked
  File "<frozen importlib._bootstrap_external>", line 940, in exec_module
  File "<frozen importlib._bootstrap>", line 241, in _call_with_frames_removed
  File "/Users/Arief/Desktop/Zenith/backend/app/routers/graph.py", line 11, in <module>
    from app.services.infrastructure.auth_service import auth_service
  File "/Users/Arief/Desktop/Zenith/backend/app/services/infrastructure/auth_service.py", line 13, in <module>
    from app.services.infrastructure.storage.database_service import db_service
  File "/Users/Arief/Desktop/Zenith/backend/app/services/infrastructure/storage/database_service.py", line 8, in <module>
    from app.services.cache_service import cache_manager, cached
ModuleNotFoundError: No module named 'app.services.cache_service'


### IDENTITY Router
**Endpoints:** 0
**Tags:** None

⚠️ **Error loading router:** No module named 'app.services.cache_service'
Traceback (most recent call last):
  File "/Users/Arief/Desktop/Zenith/scripts/generate_api_docs.py", line 23, in get_router_info
    module = importlib.import_module(f"app.routers.{module_name}")
             ^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^
  File "/Users/Arief/anaconda3/lib/python3.11/importlib/__init__.py", line 126, in import_module
    return _bootstrap._gcd_import(name[level:], package, level)
           ^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^
  File "<frozen importlib._bootstrap>", line 1204, in _gcd_import
  File "<frozen importlib._bootstrap>", line 1176, in _find_and_load
  File "<frozen importlib._bootstrap>", line 1147, in _find_and_load_unlocked
  File "<frozen importlib._bootstrap>", line 690, in _load_unlocked
  File "<frozen importlib._bootstrap_external>", line 940, in exec_module
  File "<frozen importlib._bootstrap>", line 241, in _call_with_frames_removed
  File "/Users/Arief/Desktop/Zenith/backend/app/routers/identity.py", line 16, in <module>
    from app.services.infrastructure.auth_service import auth_service
  File "/Users/Arief/Desktop/Zenith/backend/app/services/infrastructure/auth_service.py", line 13, in <module>
    from app.services.infrastructure.storage.database_service import db_service
  File "/Users/Arief/Desktop/Zenith/backend/app/services/infrastructure/storage/database_service.py", line 8, in <module>
    from app.services.cache_service import cache_manager, cached
ModuleNotFoundError: No module named 'app.services.cache_service'


### INTELLIGENCE Router
**Endpoints:** 0
**Tags:** None

⚠️ **Error loading router:** cannot import name 'FraudAlert' from 'app.services.intelligence' (/Users/Arief/Desktop/Zenith/backend/app/services/intelligence/__init__.py)
Traceback (most recent call last):
  File "/Users/Arief/Desktop/Zenith/scripts/generate_api_docs.py", line 23, in get_router_info
    module = importlib.import_module(f"app.routers.{module_name}")
             ^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^
  File "/Users/Arief/anaconda3/lib/python3.11/importlib/__init__.py", line 126, in import_module
    return _bootstrap._gcd_import(name[level:], package, level)
           ^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^
  File "<frozen importlib._bootstrap>", line 1204, in _gcd_import
  File "<frozen importlib._bootstrap>", line 1176, in _find_and_load
  File "<frozen importlib._bootstrap>", line 1147, in _find_and_load_unlocked
  File "<frozen importlib._bootstrap>", line 690, in _load_unlocked
  File "<frozen importlib._bootstrap_external>", line 940, in exec_module
  File "<frozen importlib._bootstrap>", line 241, in _call_with_frames_removed
  File "/Users/Arief/Desktop/Zenith/backend/app/routers/intelligence.py", line 19, in <module>
    from app.services.intelligence import (
ImportError: cannot import name 'FraudAlert' from 'app.services.intelligence' (/Users/Arief/Desktop/Zenith/backend/app/services/intelligence/__init__.py)


### LOGGING Router
**Endpoints:** 0
**Tags:** None

⚠️ **Error loading router:** No module named 'app.services.cache_service'
Traceback (most recent call last):
  File "/Users/Arief/Desktop/Zenith/scripts/generate_api_docs.py", line 23, in get_router_info
    module = importlib.import_module(f"app.routers.{module_name}")
             ^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^
  File "/Users/Arief/anaconda3/lib/python3.11/importlib/__init__.py", line 126, in import_module
    return _bootstrap._gcd_import(name[level:], package, level)
           ^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^
  File "<frozen importlib._bootstrap>", line 1204, in _gcd_import
  File "<frozen importlib._bootstrap>", line 1176, in _find_and_load
  File "<frozen importlib._bootstrap>", line 1147, in _find_and_load_unlocked
  File "<frozen importlib._bootstrap>", line 690, in _load_unlocked
  File "<frozen importlib._bootstrap_external>", line 940, in exec_module
  File "<frozen importlib._bootstrap>", line 241, in _call_with_frames_removed
  File "/Users/Arief/Desktop/Zenith/backend/app/routers/logging.py", line 9, in <module>
    from app.services.infrastructure.auth_service import auth_service
  File "/Users/Arief/Desktop/Zenith/backend/app/services/infrastructure/auth_service.py", line 13, in <module>
    from app.services.infrastructure.storage.database_service import db_service
  File "/Users/Arief/Desktop/Zenith/backend/app/services/infrastructure/storage/database_service.py", line 8, in <module>
    from app.services.cache_service import cache_manager, cached
ModuleNotFoundError: No module named 'app.services.cache_service'


### METADATA Router
**Endpoints:** 0
**Tags:** None

⚠️ **Error loading router:** No module named 'app.services.metadata_extraction_service'
Traceback (most recent call last):
  File "/Users/Arief/Desktop/Zenith/scripts/generate_api_docs.py", line 23, in get_router_info
    module = importlib.import_module(f"app.routers.{module_name}")
             ^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^
  File "/Users/Arief/anaconda3/lib/python3.11/importlib/__init__.py", line 126, in import_module
    return _bootstrap._gcd_import(name[level:], package, level)
           ^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^
  File "<frozen importlib._bootstrap>", line 1204, in _gcd_import
  File "<frozen importlib._bootstrap>", line 1176, in _find_and_load
  File "<frozen importlib._bootstrap>", line 1147, in _find_and_load_unlocked
  File "<frozen importlib._bootstrap>", line 690, in _load_unlocked
  File "<frozen importlib._bootstrap_external>", line 940, in exec_module
  File "<frozen importlib._bootstrap>", line 241, in _call_with_frames_removed
  File "/Users/Arief/Desktop/Zenith/backend/app/routers/metadata.py", line 13, in <module>
    from app.services.metadata_extraction_service import (
ModuleNotFoundError: No module named 'app.services.metadata_extraction_service'


### METRICS Router
**Endpoints:** 2
**Tags:** None

Backend Metrics Endpoint
Exposes Prometheus-compatible metrics for monitoring

#### GET /metrics
**Route Name:** metrics
**Summary:** None

Prometheus metrics endpoint
Returns metrics in Prometheus text format

Prometheus metrics endpoint
    Returns metrics in Prometheus text format

**Parameters:**
- Path parameters as defined in route
- Query parameters as applicable
- Request body for POST/PUT requests

**Responses:**
- `200`: Success
- `400`: Bad Request
- `401`: Unauthorized
- `403`: Forbidden
- `404`: Not Found
- `500`: Internal Server Error

---

#### GET /health/detailed
**Route Name:** detailed_health
**Summary:** None

Detailed health check with system metrics

Detailed health check with system metrics

**Parameters:**
- Path parameters as defined in route
- Query parameters as applicable
- Request body for POST/PUT requests

**Responses:**
- `200`: Success
- `400`: Bad Request
- `401`: Unauthorized
- `403`: Forbidden
- `404`: Not Found
- `500`: Internal Server Error

---

### MULTIMODAL Router
**Endpoints:** 0
**Tags:** None

⚠️ **Error loading router:** No module named 'app.services.search_service'
Traceback (most recent call last):
  File "/Users/Arief/Desktop/Zenith/backend/app/services/intelligence/evidence_service.py", line 17, in <module>
    from app.services.search_service import evidence_search_index
ModuleNotFoundError: No module named 'app.services.search_service'

During handling of the above exception, another exception occurred:

Traceback (most recent call last):
  File "/Users/Arief/Desktop/Zenith/scripts/generate_api_docs.py", line 23, in get_router_info
    module = importlib.import_module(f"app.routers.{module_name}")
             ^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^
  File "/Users/Arief/anaconda3/lib/python3.11/importlib/__init__.py", line 126, in import_module
    return _bootstrap._gcd_import(name[level:], package, level)
           ^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^
  File "<frozen importlib._bootstrap>", line 1204, in _gcd_import
  File "<frozen importlib._bootstrap>", line 1176, in _find_and_load
  File "<frozen importlib._bootstrap>", line 1147, in _find_and_load_unlocked
  File "<frozen importlib._bootstrap>", line 690, in _load_unlocked
  File "<frozen importlib._bootstrap_external>", line 940, in exec_module
  File "<frozen importlib._bootstrap>", line 241, in _call_with_frames_removed
  File "/Users/Arief/Desktop/Zenith/backend/app/routers/multimodal.py", line 11, in <module>
    from app.services.intelligence.evidence_service import EvidenceProcessor, ProcessingResult
  File "/Users/Arief/Desktop/Zenith/backend/app/services/intelligence/evidence_service.py", line 22, in <module>
    from app.services.search_service import evidence_search_index
ModuleNotFoundError: No module named 'app.services.search_service'


### NOTIFICATIONS Router
**Endpoints:** 0
**Tags:** None

⚠️ **Error loading router:** No module named 'app.services.cache_service'
Traceback (most recent call last):
  File "/Users/Arief/Desktop/Zenith/scripts/generate_api_docs.py", line 23, in get_router_info
    module = importlib.import_module(f"app.routers.{module_name}")
             ^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^
  File "/Users/Arief/anaconda3/lib/python3.11/importlib/__init__.py", line 126, in import_module
    return _bootstrap._gcd_import(name[level:], package, level)
           ^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^
  File "<frozen importlib._bootstrap>", line 1204, in _gcd_import
  File "<frozen importlib._bootstrap>", line 1176, in _find_and_load
  File "<frozen importlib._bootstrap>", line 1147, in _find_and_load_unlocked
  File "<frozen importlib._bootstrap>", line 690, in _load_unlocked
  File "<frozen importlib._bootstrap_external>", line 940, in exec_module
  File "<frozen importlib._bootstrap>", line 241, in _call_with_frames_removed
  File "/Users/Arief/Desktop/Zenith/backend/app/routers/notifications.py", line 7, in <module>
    from app.services.infrastructure.auth_service import auth_service
  File "/Users/Arief/Desktop/Zenith/backend/app/services/infrastructure/auth_service.py", line 13, in <module>
    from app.services.infrastructure.storage.database_service import db_service
  File "/Users/Arief/Desktop/Zenith/backend/app/services/infrastructure/storage/database_service.py", line 8, in <module>
    from app.services.cache_service import cache_manager, cached
ModuleNotFoundError: No module named 'app.services.cache_service'


### ONBOARDING Router
**Endpoints:** 0
**Tags:** None

⚠️ **Error loading router:** No module named 'backend.core'
Traceback (most recent call last):
  File "/Users/Arief/Desktop/Zenith/scripts/generate_api_docs.py", line 23, in get_router_info
    module = importlib.import_module(f"app.routers.{module_name}")
             ^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^
  File "/Users/Arief/anaconda3/lib/python3.11/importlib/__init__.py", line 126, in import_module
    return _bootstrap._gcd_import(name[level:], package, level)
           ^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^
  File "<frozen importlib._bootstrap>", line 1204, in _gcd_import
  File "<frozen importlib._bootstrap>", line 1176, in _find_and_load
  File "<frozen importlib._bootstrap>", line 1147, in _find_and_load_unlocked
  File "<frozen importlib._bootstrap>", line 690, in _load_unlocked
  File "<frozen importlib._bootstrap_external>", line 940, in exec_module
  File "<frozen importlib._bootstrap>", line 241, in _call_with_frames_removed
  File "/Users/Arief/Desktop/Zenith/backend/app/routers/onboarding.py", line 14, in <module>
    from backend.core.database import RookieChecklist, get_db
ModuleNotFoundError: No module named 'backend.core'


### PHASE6B Router
**Endpoints:** 2
**Tags:** None

#### POST /phase6b/metadata-correlation
**Route Name:** metadata_correlation
**Summary:** None





**Parameters:**
- Path parameters as defined in route
- Query parameters as applicable
- Request body for POST/PUT requests

**Responses:**
- `200`: Success
- `400`: Bad Request
- `401`: Unauthorized
- `403`: Forbidden
- `404`: Not Found
- `500`: Internal Server Error

---

#### POST /phase6b/temporal-burst
**Route Name:** temporal_burst
**Summary:** None





**Parameters:**
- Path parameters as defined in route
- Query parameters as applicable
- Request body for POST/PUT requests

**Responses:**
- `200`: Success
- `400`: Bad Request
- `401`: Unauthorized
- `403`: Forbidden
- `404`: Not Found
- `500`: Internal Server Error

---

### PROOF Router
**Endpoints:** 0
**Tags:** None

⚠️ **Error loading router:** No module named 'app.services.graph_service'
Traceback (most recent call last):
  File "/Users/Arief/Desktop/Zenith/scripts/generate_api_docs.py", line 23, in get_router_info
    module = importlib.import_module(f"app.routers.{module_name}")
             ^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^
  File "/Users/Arief/anaconda3/lib/python3.11/importlib/__init__.py", line 126, in import_module
    return _bootstrap._gcd_import(name[level:], package, level)
           ^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^
  File "<frozen importlib._bootstrap>", line 1204, in _gcd_import
  File "<frozen importlib._bootstrap>", line 1176, in _find_and_load
  File "<frozen importlib._bootstrap>", line 1147, in _find_and_load_unlocked
  File "<frozen importlib._bootstrap>", line 690, in _load_unlocked
  File "<frozen importlib._bootstrap_external>", line 940, in exec_module
  File "<frozen importlib._bootstrap>", line 241, in _call_with_frames_removed
  File "/Users/Arief/Desktop/Zenith/backend/app/routers/proof.py", line 18, in <module>
    from app.services.graph_service import relationship_graph
ModuleNotFoundError: No module named 'app.services.graph_service'


### REALTIME_SYNC Router
**Endpoints:** 8
**Tags:** realtime-sync

####  /sync/ws/{user_id}
**Route Name:** websocket_endpoint
**Summary:** 



WebSocket endpoint for real-time collaboration

**Parameters:**
- Path parameters as defined in route
- Query parameters as applicable
- Request body for POST/PUT requests

**Responses:**
- `200`: Success
- `400`: Bad Request
- `401`: Unauthorized
- `403`: Forbidden
- `404`: Not Found
- `500`: Internal Server Error

---

#### GET /sync/status
**Route Name:** get_service_status
**Summary:** None

Get sync service status

Get sync service status

**Parameters:**
- Path parameters as defined in route
- Query parameters as applicable
- Request body for POST/PUT requests

**Responses:**
- `200`: Success
- `400`: Bad Request
- `401`: Unauthorized
- `403`: Forbidden
- `404`: Not Found
- `500`: Internal Server Error

---

#### GET /sync/documents
**Route Name:** get_documents
**Summary:** None

Get list of all collaborative documents

Get list of all collaborative documents

**Parameters:**
- Path parameters as defined in route
- Query parameters as applicable
- Request body for POST/PUT requests

**Responses:**
- `200`: Success
- `400`: Bad Request
- `401`: Unauthorized
- `403`: Forbidden
- `404`: Not Found
- `500`: Internal Server Error

---

#### GET /sync/documents/{document_id}
**Route Name:** get_document
**Summary:** None

Get specific document details

Get specific document details

**Parameters:**
- Path parameters as defined in route
- Query parameters as applicable
- Request body for POST/PUT requests

**Responses:**
- `200`: Success
- `400`: Bad Request
- `401`: Unauthorized
- `403`: Forbidden
- `404`: Not Found
- `500`: Internal Server Error

---

#### POST /sync/documents/{document_id}/operations
**Route Name:** create_operation
**Summary:** None

Create and apply an operation to a document (HTTP fallback)

Create and apply an operation to a document (HTTP fallback)

**Parameters:**
- Path parameters as defined in route
- Query parameters as applicable
- Request body for POST/PUT requests

**Responses:**
- `200`: Success
- `400`: Bad Request
- `401`: Unauthorized
- `403`: Forbidden
- `404`: Not Found
- `500`: Internal Server Error

---

#### GET /sync/stats
**Route Name:** get_sync_stats
**Summary:** None

Get real-time sync statistics

Get real-time sync statistics

**Parameters:**
- Path parameters as defined in route
- Query parameters as applicable
- Request body for POST/PUT requests

**Responses:**
- `200`: Success
- `400`: Bad Request
- `401`: Unauthorized
- `403`: Forbidden
- `404`: Not Found
- `500`: Internal Server Error

---

#### POST /sync/broadcast
**Route Name:** broadcast_message
**Summary:** None

Broadcast message to all connected clients

Broadcast message to all connected clients

**Parameters:**
- Path parameters as defined in route
- Query parameters as applicable
- Request body for POST/PUT requests

**Responses:**
- `200`: Success
- `400`: Bad Request
- `401`: Unauthorized
- `403`: Forbidden
- `404`: Not Found
- `500`: Internal Server Error

---

#### DELETE /sync/documents/{document_id}
**Route Name:** delete_document
**Summary:** None

Delete a collaborative document

Delete a collaborative document

**Parameters:**
- Path parameters as defined in route
- Query parameters as applicable
- Request body for POST/PUT requests

**Responses:**
- `200`: Success
- `400`: Bad Request
- `401`: Unauthorized
- `403`: Forbidden
- `404`: Not Found
- `500`: Internal Server Error

---

### RECONCILIATION Router
**Endpoints:** 0
**Tags:** None

⚠️ **Error loading router:** No module named 'app.services.cache_service'
Traceback (most recent call last):
  File "/Users/Arief/Desktop/Zenith/scripts/generate_api_docs.py", line 23, in get_router_info
    module = importlib.import_module(f"app.routers.{module_name}")
             ^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^
  File "/Users/Arief/anaconda3/lib/python3.11/importlib/__init__.py", line 126, in import_module
    return _bootstrap._gcd_import(name[level:], package, level)
           ^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^
  File "<frozen importlib._bootstrap>", line 1204, in _gcd_import
  File "<frozen importlib._bootstrap>", line 1176, in _find_and_load
  File "<frozen importlib._bootstrap>", line 1147, in _find_and_load_unlocked
  File "<frozen importlib._bootstrap>", line 690, in _load_unlocked
  File "<frozen importlib._bootstrap_external>", line 940, in exec_module
  File "<frozen importlib._bootstrap>", line 241, in _call_with_frames_removed
  File "/Users/Arief/Desktop/Zenith/backend/app/routers/reconciliation.py", line 8, in <module>
    from app.services.infrastructure.auth_service import auth_service
  File "/Users/Arief/Desktop/Zenith/backend/app/services/infrastructure/auth_service.py", line 13, in <module>
    from app.services.infrastructure.storage.database_service import db_service
  File "/Users/Arief/Desktop/Zenith/backend/app/services/infrastructure/storage/database_service.py", line 8, in <module>
    from app.services.cache_service import cache_manager, cached
ModuleNotFoundError: No module named 'app.services.cache_service'


### REPORTING Router
**Endpoints:** 0
**Tags:** None

⚠️ **Error loading router:** No module named 'app.services.cache_service'
Traceback (most recent call last):
  File "/Users/Arief/Desktop/Zenith/scripts/generate_api_docs.py", line 23, in get_router_info
    module = importlib.import_module(f"app.routers.{module_name}")
             ^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^
  File "/Users/Arief/anaconda3/lib/python3.11/importlib/__init__.py", line 126, in import_module
    return _bootstrap._gcd_import(name[level:], package, level)
           ^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^
  File "<frozen importlib._bootstrap>", line 1204, in _gcd_import
  File "<frozen importlib._bootstrap>", line 1176, in _find_and_load
  File "<frozen importlib._bootstrap>", line 1147, in _find_and_load_unlocked
  File "<frozen importlib._bootstrap>", line 690, in _load_unlocked
  File "<frozen importlib._bootstrap_external>", line 940, in exec_module
  File "<frozen importlib._bootstrap>", line 241, in _call_with_frames_removed
  File "/Users/Arief/Desktop/Zenith/backend/app/routers/reporting.py", line 9, in <module>
    from app.services.infrastructure.auth_service import auth_service
  File "/Users/Arief/Desktop/Zenith/backend/app/services/infrastructure/auth_service.py", line 13, in <module>
    from app.services.infrastructure.storage.database_service import db_service
  File "/Users/Arief/Desktop/Zenith/backend/app/services/infrastructure/storage/database_service.py", line 8, in <module>
    from app.services.cache_service import cache_manager, cached
ModuleNotFoundError: No module named 'app.services.cache_service'


### SEARCH Router
**Endpoints:** 0
**Tags:** None

⚠️ **Error loading router:** No module named 'app.services.search_service'
Traceback (most recent call last):
  File "/Users/Arief/Desktop/Zenith/scripts/generate_api_docs.py", line 23, in get_router_info
    module = importlib.import_module(f"app.routers.{module_name}")
             ^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^
  File "/Users/Arief/anaconda3/lib/python3.11/importlib/__init__.py", line 126, in import_module
    return _bootstrap._gcd_import(name[level:], package, level)
           ^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^
  File "<frozen importlib._bootstrap>", line 1204, in _gcd_import
  File "<frozen importlib._bootstrap>", line 1176, in _find_and_load
  File "<frozen importlib._bootstrap>", line 1147, in _find_and_load_unlocked
  File "<frozen importlib._bootstrap>", line 690, in _load_unlocked
  File "<frozen importlib._bootstrap_external>", line 940, in exec_module
  File "<frozen importlib._bootstrap>", line 241, in _call_with_frames_removed
  File "/Users/Arief/Desktop/Zenith/backend/app/routers/search.py", line 6, in <module>
    from app.services.search_service import evidence_search_index
ModuleNotFoundError: No module named 'app.services.search_service'


### SEMANTIC_SEARCH Router
**Endpoints:** 0
**Tags:** None

⚠️ **Error loading router:** No module named 'app.services.semantic_search_service'
Traceback (most recent call last):
  File "/Users/Arief/Desktop/Zenith/scripts/generate_api_docs.py", line 23, in get_router_info
    module = importlib.import_module(f"app.routers.{module_name}")
             ^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^
  File "/Users/Arief/anaconda3/lib/python3.11/importlib/__init__.py", line 126, in import_module
    return _bootstrap._gcd_import(name[level:], package, level)
           ^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^
  File "<frozen importlib._bootstrap>", line 1204, in _gcd_import
  File "<frozen importlib._bootstrap>", line 1176, in _find_and_load
  File "<frozen importlib._bootstrap>", line 1147, in _find_and_load_unlocked
  File "<frozen importlib._bootstrap>", line 690, in _load_unlocked
  File "<frozen importlib._bootstrap_external>", line 940, in exec_module
  File "<frozen importlib._bootstrap>", line 241, in _call_with_frames_removed
  File "/Users/Arief/Desktop/Zenith/backend/app/routers/semantic_search.py", line 9, in <module>
    from app.services.semantic_search_service import SemanticSearchEngine
ModuleNotFoundError: No module named 'app.services.semantic_search_service'


### STATS Router
**Endpoints:** 0
**Tags:** None

⚠️ **Error loading router:** No module named 'app.services.cache_service'
Traceback (most recent call last):
  File "/Users/Arief/Desktop/Zenith/scripts/generate_api_docs.py", line 23, in get_router_info
    module = importlib.import_module(f"app.routers.{module_name}")
             ^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^
  File "/Users/Arief/anaconda3/lib/python3.11/importlib/__init__.py", line 126, in import_module
    return _bootstrap._gcd_import(name[level:], package, level)
           ^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^
  File "<frozen importlib._bootstrap>", line 1204, in _gcd_import
  File "<frozen importlib._bootstrap>", line 1176, in _find_and_load
  File "<frozen importlib._bootstrap>", line 1147, in _find_and_load_unlocked
  File "<frozen importlib._bootstrap>", line 690, in _load_unlocked
  File "<frozen importlib._bootstrap_external>", line 940, in exec_module
  File "<frozen importlib._bootstrap>", line 241, in _call_with_frames_removed
  File "/Users/Arief/Desktop/Zenith/backend/app/routers/stats.py", line 9, in <module>
    from app.services.infrastructure.auth_service import auth_service
  File "/Users/Arief/Desktop/Zenith/backend/app/services/infrastructure/auth_service.py", line 13, in <module>
    from app.services.infrastructure.storage.database_service import db_service
  File "/Users/Arief/Desktop/Zenith/backend/app/services/infrastructure/storage/database_service.py", line 8, in <module>
    from app.services.cache_service import cache_manager, cached
ModuleNotFoundError: No module named 'app.services.cache_service'


### STREAMING Router
**Endpoints:** 3
**Tags:** None

Server-Sent Events (SSE) Streaming for AI Responses
Enables token-by-token streaming of AI responses to frontend

#### POST /ai/stream
**Route Name:** stream_ai_response
**Summary:** None

Stream AI response using Server-Sent Events

Request body:
{
    "message": "User message",
    "context": {
        "caseId": "optional",
        "persona": "frenly|skeptical|thorough"
    }
}

Stream AI response using Server-Sent Events

    Request body:
    {
        "message": "User message",
        "context": {
            "caseId": "optional",
            "persona": "frenly|skeptical|thorough"
        }
    }

**Parameters:**
- Path parameters as defined in route
- Query parameters as applicable
- Request body for POST/PUT requests

**Responses:**
- `200`: Success
- `400`: Bad Request
- `401`: Unauthorized
- `403`: Forbidden
- `404`: Not Found
- `500`: Internal Server Error

---

#### POST /ai/analyze/stream
**Route Name:** stream_transaction_analysis
**Summary:** None

Stream transaction analysis results

Request body:
{
    "transaction_id": "txn_123",
    "amount": 15000.00,
    "currency": "USD",
    ...
}

Stream transaction analysis results

    Request body:
    {
        "transaction_id": "txn_123",
        "amount": 15000.00,
        "currency": "USD",
        ...
    }

**Parameters:**
- Path parameters as defined in route
- Query parameters as applicable
- Request body for POST/PUT requests

**Responses:**
- `200`: Success
- `400`: Bad Request
- `401`: Unauthorized
- `403`: Forbidden
- `404`: Not Found
- `500`: Internal Server Error

---

#### GET /ai/stream/test
**Route Name:** test_stream
**Summary:** None

Test SSE streaming endpoint

Test SSE streaming endpoint

**Parameters:**
- Path parameters as defined in route
- Query parameters as applicable
- Request body for POST/PUT requests

**Responses:**
- `200`: Success
- `400`: Bad Request
- `401`: Unauthorized
- `403`: Forbidden
- `404`: Not Found
- `500`: Internal Server Error

---

### USERS Router
**Endpoints:** 0
**Tags:** None

⚠️ **Error loading router:** No module named 'app.services.cache_service'
Traceback (most recent call last):
  File "/Users/Arief/Desktop/Zenith/scripts/generate_api_docs.py", line 23, in get_router_info
    module = importlib.import_module(f"app.routers.{module_name}")
             ^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^
  File "/Users/Arief/anaconda3/lib/python3.11/importlib/__init__.py", line 126, in import_module
    return _bootstrap._gcd_import(name[level:], package, level)
           ^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^
  File "<frozen importlib._bootstrap>", line 1204, in _gcd_import
  File "<frozen importlib._bootstrap>", line 1176, in _find_and_load
  File "<frozen importlib._bootstrap>", line 1147, in _find_and_load_unlocked
  File "<frozen importlib._bootstrap>", line 690, in _load_unlocked
  File "<frozen importlib._bootstrap_external>", line 940, in exec_module
  File "<frozen importlib._bootstrap>", line 241, in _call_with_frames_removed
  File "/Users/Arief/Desktop/Zenith/backend/app/routers/users.py", line 5, in <module>
    from app.services.infrastructure.storage.database_service import db_service
  File "/Users/Arief/Desktop/Zenith/backend/app/services/infrastructure/storage/database_service.py", line 8, in <module>
    from app.services.cache_service import cache_manager, cached
ModuleNotFoundError: No module named 'app.services.cache_service'


### WEBSOCKET Router
**Endpoints:** 3
**Tags:** None

Enhanced WebSocket Handlers
Supports real-time case updates, notifications, and collaboration

####  /ws/case/{case_id}
**Route Name:** websocket_case_endpoint
**Summary:** 



WebSocket endpoint for real-time case updates
    Clients subscribe to specific case changes

**Parameters:**
- Path parameters as defined in route
- Query parameters as applicable
- Request body for POST/PUT requests

**Responses:**
- `200`: Success
- `400`: Bad Request
- `401`: Unauthorized
- `403`: Forbidden
- `404`: Not Found
- `500`: Internal Server Error

---

####  /ws/notifications/{user_id}
**Route Name:** websocket_notifications_endpoint
**Summary:** 



WebSocket endpoint for user notifications
    Real-time alerts, approvals, and system notifications

**Parameters:**
- Path parameters as defined in route
- Query parameters as applicable
- Request body for POST/PUT requests

**Responses:**
- `200`: Success
- `400`: Bad Request
- `401`: Unauthorized
- `403`: Forbidden
- `404`: Not Found
- `500`: Internal Server Error

---

####  /ws/collaboration/{session_id}
**Route Name:** websocket_collaboration_endpoint
**Summary:** 



WebSocket endpoint for real-time collaboration
    Supports cursor positions, edits, and presence

**Parameters:**
- Path parameters as defined in route
- Query parameters as applicable
- Request body for POST/PUT requests

**Responses:**
- `200`: Success
- `400`: Bad Request
- `401`: Unauthorized
- `403`: Forbidden
- `404`: Not Found
- `500`: Internal Server Error

---

