from datetime import UTC, datetime


def utc_now():
    return datetime.now(UTC)


# Note: Models moved to core/database.py to avoid duplication
# These models are already defined in core/database.py
