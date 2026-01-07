PROJECT_NAME = "Zenith Fraud Detection API"
DESCRIPTION = "Backend API for desktop fraud detection application"
VERSION = "1.0.0"
API_VERSION = "v1"

DEPRECATED_ENDPOINTS = {
    "/api/v1/old_endpoint": {
        "deprecated_since": "v1.2.0",
        "removal_version": "v2.0.0",
        "migration_guide": "/docs/migration/v1-to-v2",
        "replacement": "/api/v1/new_endpoint",
    }
}
