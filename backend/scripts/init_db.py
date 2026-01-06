import os
import sys

sys.path.append(os.path.join(os.path.dirname(__file__), ".."))

# Import new models to ensure registration
from core.database import create_tables

if __name__ == "__main__":
    print("Initializing database tables...")
    create_tables()
    print("Database initialization complete.")
