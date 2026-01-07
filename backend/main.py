import os
import uvicorn
from app.factory import create_app

# Create the application instance using the factory
app = create_app()

if __name__ == "__main__":
    import asyncio
    from core.logging import logger

    # Security: Only enable reload in development
    reload_enabled = os.getenv("ENVIRONMENT", "production").lower() == "development"

    # Start AI training pipeline in background (only in production)
    # if not reload_enabled:
    #     logger.info("Starting AI training pipeline...")
    #     asyncio.create_task(training_pipeline.start_automated_training())

    uvicorn.run(
        "main:app",
        host=os.getenv("HOST", "127.0.0.1"),
        port=int(os.getenv("PORT", "8000")),
        reload=reload_enabled,  # Only reload in development
        log_level="info",
    )
