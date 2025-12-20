import sqlite3
import os

# Expand user path manually to match the app logic
db_path = os.path.expanduser("~/.zenith/fraud_detection.db")

print(f"Migrating database at: {db_path}")

if not os.path.exists(db_path):
    print("Database file not found. Skipping migration (tables will be created by app startup).")
    exit(0)

conn = sqlite3.connect(db_path)
cursor = conn.cursor()

# 1. Create projects table if it doesn't exist
try:
    cursor.execute("SELECT id FROM projects LIMIT 1")
    print("Projects table exists.")
except sqlite3.OperationalError:
    print("Creating projects table...")
    cursor.execute("""
    CREATE TABLE projects (
        id VARCHAR PRIMARY KEY,
        name VARCHAR NOT NULL,
        description TEXT,
        created_at DATETIME,
        created_by VARCHAR,
        FOREIGN KEY(created_by) REFERENCES users(id)
    );
    """)
    cursor.execute("CREATE INDEX ix_projects_name ON projects (name)")
    
    # Add default project
    import uuid
    from datetime import datetime
    
    print("Seeding default project...")
    cursor.execute(
        "INSERT INTO projects (id, name, description, created_at) VALUES (?, ?, ?, ?)",
        ("default", "Default Project", "Auto-generated during migration", datetime.utcnow())
    )

# 2. Add project_id to cases
try:
    cursor.execute("SELECT project_id FROM cases LIMIT 1")
    print("Cases table already has project_id.")
except sqlite3.OperationalError:
    print("Adding project_id to cases...")
    cursor.execute("ALTER TABLE cases ADD COLUMN project_id VARCHAR DEFAULT 'default'")
    cursor.execute("CREATE INDEX ix_cases_project_id ON cases (project_id)")

# 2.1 Add fraud_amount to cases
try:
    cursor.execute("SELECT fraud_amount FROM cases LIMIT 1")
    print("Cases table already has fraud_amount.")
except sqlite3.OperationalError:
    print("Adding fraud_amount to cases...")
    cursor.execute("ALTER TABLE cases ADD COLUMN fraud_amount FLOAT DEFAULT 0.0")

# 2.2 Add customer_name to cases
try:
    cursor.execute("SELECT customer_name FROM cases LIMIT 1")
    print("Cases table already has customer_name.")
except sqlite3.OperationalError:
    print("Adding customer_name to cases...")
    cursor.execute("ALTER TABLE cases ADD COLUMN customer_name VARCHAR DEFAULT 'Unknown'")

# 3. Add status to fraud_alerts
try:
    cursor.execute("SELECT status FROM fraud_alerts LIMIT 1")
    print("Fraud_alerts table already has status.")
except sqlite3.OperationalError:
    print("Adding status to fraud_alerts...")
    cursor.execute("ALTER TABLE fraud_alerts ADD COLUMN status VARCHAR DEFAULT 'pending'")
    cursor.execute("CREATE INDEX ix_fraud_alerts_status ON fraud_alerts (status)")

conn.commit()
conn.close()
print("Migration complete.")
