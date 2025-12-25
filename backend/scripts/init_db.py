import sys
import os

sys.path.append(os.path.join(os.path.dirname(__file__), ".."))

# Import new models to ensure registration
from core.plugin_system import models as plugin_models
from core.feature_flags import models as feature_flag_models
from core.eav import models as eav_models
from core.database import create_tables

if __name__ == "__main__":
    print("Initializing database tables...")
    create_tables()
    print("Database initialization complete.")
