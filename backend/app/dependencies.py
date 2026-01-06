from fastapi import Header, HTTPException


async def get_current_project_id(
    x_project_id: str | None = Header(None, alias="X-Project-ID"),
) -> str:
    """
    Extracts the X-Project-ID header.
    Defaults to 'default' if not present to maintain backward compatibility during migration.
    """
    if not x_project_id:
        return "default"
    return x_project_id


async def require_project_id(
    x_project_id: str | None = Header(None, alias="X-Project-ID"),
) -> str:
    """
    Strictly requires the X-Project-ID header.
    """
    if not x_project_id:
        raise HTTPException(status_code=400, detail="X-Project-ID header is required")
    return x_project_id
