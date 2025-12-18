import sqlite3
import os
import uuid
from datetime import datetime, timedelta

# Database path
db_path = os.path.expanduser("~/.378x492/fraud_detection.db")

print(f"Seeding database at: {db_path}")

if not os.path.exists(db_path):
    print("Database file not found!")
    exit(1)

conn = sqlite3.connect(db_path)
cursor = conn.cursor()

# 1. Ensure Default Project
print("Checking Default Project...")
cursor.execute("SELECT id FROM projects WHERE id='default'")
if not cursor.fetchone():
    cursor.execute("""
        INSERT INTO projects (id, name, description, created_at, created_by)
        VALUES ('default', 'Default Project', 'Main demonstration project', ?, 'system')
    """, (datetime.utcnow(),))
    print("Created Default Project.")

# 2. Ensure Sample Case
case_id = "CASE-2024-001"
print(f"Checking Case {case_id}...")
cursor.execute("SELECT id FROM cases WHERE id=?", (case_id,))
if not cursor.fetchone():
    cursor.execute("""
        INSERT INTO cases (id, project_id, title, description, status, priority, fraud_amount, customer_name, created_at)
        VALUES (?, 'default', 'Suspicious Wire Transfer Investigation', 'Investigation into multiple rapid transfers', 'OPEN', 'critical', 45000.00, 'Acme Corp', ?)
    """, (case_id, datetime.utcnow(),))
    print(f"Created Case {case_id}.")
else:
    # Ensure it's in default project
    cursor.execute("UPDATE cases SET project_id='default' WHERE id=?", (case_id,))

# 3. Seed Fraud Alerts (for Adjudication Queue validation)
print("Seeding Fraud Alerts...")
alerts_data = [
    (str(uuid.uuid4()), case_id, "High Value Transfer Attempt", "Transfer of $45,000 exceeds typical threshold", "critical", "pending"),
    (str(uuid.uuid4()), case_id, "Velocity Rule Violation", "3 transactions in 10 minutes", "high", "pending"),
    (str(uuid.uuid4()), case_id, "New Device Login", "Login from unknown device in Lagos, NG", "medium", "pending"),
]

# Check if we have alerts already
cursor.execute("SELECT count(*) FROM fraud_alerts")
count = cursor.fetchone()[0]
if count < 3:
    for aid, cid, title, desc, sev, stat in alerts_data:
        # Note: 'status' column was added in migration. 
        # We need to assume the schema matches.
        try:
            cursor.execute("""
                INSERT INTO fraud_alerts (id, case_id, title, description, severity, status, created_at, is_acknowledged, alert_type)
                VALUES (?, ?, ?, ?, ?, ?, ?, 0, 'rule_based')
            """, (aid, cid, title, desc, sev, stat, datetime.utcnow()))
        except sqlite3.OperationalError as e:
            print(f"Error inserting alert (schema mismatch?): {e}")
            # Fallback if status column missing (shouldn't be if migration ran)
            pass
    print("Seeded sample alerts.")
else:
    print("Alerts already exist.")

# 4. Seed Evidence (for Forensics validation)
print("Seeding Evidence...")
evidence_data = [
    (str(uuid.uuid4()), case_id, "wire_transfer_receipt.pdf", "pdfs/wire_transfer_receipt.pdf", "application/pdf", "document", 10240, "pending"),
    (str(uuid.uuid4()), case_id, "email_logs.txt", "logs/email_logs.txt", "text/plain", "document", 2048, "pending"),
    (str(uuid.uuid4()), case_id, "surveillance_snapshot.jpg", "images/surveillance_snapshot.jpg", "image/jpeg", "image", 512000, "pending"),
]

cursor.execute("SELECT count(*) FROM evidence")
ev_count = cursor.fetchone()[0]

if ev_count < 3:
    for eid, cid, fname, fpath, ftype, fcat, size, stat in evidence_data:
        try:
             cursor.execute("""
                INSERT INTO evidence (id, case_id, filename, file_path, file_type, file_category, size_bytes, processing_status, uploaded_at)
                VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
            """, (eid, cid, fname, fpath, ftype, fcat, size, stat, datetime.utcnow()))
        except Exception as e:
            print(f"Error inserting evidence: {e}")
    print("Seeded sample evidence.")
else:
    print("Evidence already exists.")

conn.commit()
conn.close()
print("Seeding complete.")
