#!/usr/bin/env python3
"""
Seed Demo Data Script
Creates realistic fraud investigation data for development/testing
"""

import os
import random
import sys
import uuid
from datetime import datetime, timedelta

# Add parent directory to path
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker

from core.database import (
    Base,
    Case,
    CaseActivity,
    CaseNote,
    CasePriority,
    CaseStatus,
    CaseType,
    Evidence,
    FraudAlert,
    Transaction,
    User,
    UserRole,
)

# Database path
DB_PATH = os.path.join(
    os.path.dirname(os.path.dirname(os.path.abspath(__file__))), "data", "simple378.db"
)
os.makedirs(os.path.dirname(DB_PATH), exist_ok=True)

engine = create_engine(f"sqlite:///{DB_PATH}", echo=False)
Session = sessionmaker(bind=engine)

# Create tables
Base.metadata.create_all(engine)

# Demo data generators
FIRST_NAMES = [
    "James",
    "Sarah",
    "Michael",
    "Emily",
    "David",
    "Jennifer",
    "Robert",
    "Lisa",
    "William",
    "Jessica",
]
LAST_NAMES = [
    "Smith",
    "Johnson",
    "Williams",
    "Brown",
    "Jones",
    "Garcia",
    "Miller",
    "Davis",
    "Rodriguez",
    "Martinez",
]
COMPANIES = [
    "Apex Trading Co",
    "Global Ventures LLC",
    "Premier Holdings",
    "Sterling Capital",
    "Titan Industries",
    "Nexus Corp",
    "Summit Enterprises",
    "Pacific Rim Traders",
    "Atlantic Financial",
    "Aurora Investments",
]
CITIES = [
    "Tokyo",
    "Singapore",
    "Hong Kong",
    "London",
    "New York",
    "Dubai",
    "Sydney",
    "Frankfurt",
    "Zurich",
    "Seoul",
]
CASE_TYPES = [
    CaseType.MONEY_LAUNDERING,
    CaseType.FRAUD_SUSPECTED,
    CaseType.IDENTITY_THEFT,
    CaseType.ACCOUNT_TAKEOVER,
]
STATUSES = [
    CaseStatus.OPEN,
    CaseStatus.INVESTIGATING,
    CaseStatus.PENDING_REVIEW,
    CaseStatus.ESCALATED,
]
PRIORITIES = [
    CasePriority.LOW,
    CasePriority.MEDIUM,
    CasePriority.HIGH,
    CasePriority.CRITICAL,
]


def random_date(start_days_ago=365, end_days_ago=0):
    """Generate random date within range"""
    start = datetime.now() - timedelta(days=start_days_ago)
    end = datetime.now() - timedelta(days=end_days_ago)
    delta = end - start
    return start + timedelta(seconds=random.randint(0, int(delta.total_seconds())))


def random_name():
    return f"{random.choice(FIRST_NAMES)} {random.choice(LAST_NAMES)}"


def random_company():
    return random.choice(COMPANIES)


def random_amount():
    return round(random.uniform(10000, 5000000), 2)


def seed_users(session):
    """Create demo users"""
    print("🔐 Creating demo users...")

    users = [
        User(
            id=str(uuid.uuid4()),
            username="admin",
            email="admin@zenith.com",
            full_name="System Administrator",
            role=UserRole.ADMIN,
            is_active=True,
            created_at=datetime.now(),
        ),
        User(
            id=str(uuid.uuid4()),
            username="investigator1",
            email="investigator1@zenith.com",
            full_name="John Chen",
            role=UserRole.INVESTIGATOR,
            is_active=True,
            created_at=datetime.now(),
        ),
        User(
            id=str(uuid.uuid4()),
            username="analyst1",
            email="analyst1@zenith.com",
            full_name="Maria Santos",
            role=UserRole.ANALYST,
            is_active=True,
            created_at=datetime.now(),
        ),
    ]

    for user in users:
        session.merge(user)

    session.commit()
    print(f"   ✓ Created {len(users)} users")
    return users


def seed_cases(session, users):
    """Create demo cases"""
    print("📁 Creating demo cases...")

    cases = []
    case_titles = [
        "Suspicious Wire Transfers - Apex Trading",
        "Shell Company Network Investigation",
        "Invoice Fraud - Premier Holdings",
        "Layering Scheme Detection",
        "Cross-Border Transaction Analysis",
        "Vendor Kickback Investigation",
        "Cryptocurrency Conversion Pattern",
        "Circular Trading Alert",
        "Phantom Employee Payroll",
        "Trade-Based Money Laundering",
        "Ponzi Scheme Indicators",
        "Smurfing Activity Cluster",
        "Round-Trip Transaction Analysis",
        "Beneficial Ownership Obscured",
        "Structuring Pattern Detection",
    ]

    for i, title in enumerate(case_titles):
        case = Case(
            id=str(uuid.uuid4()),
            title=title,
            description=f"Investigation into suspicious activity patterns. Case involves multiple entities and complex transaction flows requiring detailed forensic analysis.",
            status=random.choice(STATUSES),
            priority=random.choice(PRIORITIES),
            case_type=random.choice(CASE_TYPES),
            risk_score=random.randint(20, 98),
            customer_name=random_company(),
            fraud_amount=random_amount(),
            assignee_id=random.choice(users).id if users else None,
            tags=random.sample(
                [
                    "urgent",
                    "cross-border",
                    "high-value",
                    "repeat-offender",
                    "vip-client",
                    "regulatory",
                ],
                k=random.randint(1, 3),
            ),
            created_at=random_date(180, 0),
            updated_at=datetime.now(),
            created_by="system",
        )
        cases.append(case)
        session.add(case)

    session.commit()
    print(f"   ✓ Created {len(cases)} cases")
    return cases


def seed_transactions(session, cases):
    """Create demo transactions for cases"""
    print("💸 Creating demo transactions...")

    tx_count = 0
    for case in cases:
        num_transactions = random.randint(5, 25)

        for _ in range(num_transactions):
            tx = Transaction(
                id=str(uuid.uuid4()),
                case_id=case.id,
                external_transaction_id=f"TXN-{random.randint(100000, 999999)}",
                amount=random_amount(),
                currency=random.choice(["USD", "EUR", "JPY", "GBP", "SGD"]),
                merchant_name=random_company(),
                merchant_category=random.choice(
                    ["Financial Services", "Retail", "Technology", "Consulting"]
                ),
                date=random_date(365, 0),
                transaction_type=random.choice(["DEBIT", "CREDIT", "TRANSFER", "WIRE"]),
                status=random.choice(["pending", "approved", "denied", "escalated"]),
                risk_score=random.randint(10, 95) / 100.0,
                is_flagged=random.choice([True, False]),
                country=random.choice(["US", "UK", "JP", "SG", "HK", "DE"]),
                city=random.choice(CITIES),
            )
            session.add(tx)
            tx_count += 1

    session.commit()
    print(f"   ✓ Created {tx_count} transactions")


def seed_evidence(session, cases):
    """Create demo evidence for cases"""
    print("📎 Creating demo evidence...")

    evidence_types = [
        ("Bank Statement - Q1 2024.pdf", "application/pdf", "document"),
        ("Wire Transfer Confirmation.pdf", "application/pdf", "document"),
        ("Email Correspondence.eml", "message/rfc822", "document"),
        ("Transaction Screenshot.png", "image/png", "image"),
        ("Account Opening Form.pdf", "application/pdf", "document"),
        ("KYC Documents.pdf", "application/pdf", "document"),
        ("Chat Logs Export.txt", "text/plain", "document"),
        ("Invoice #2024-0892.pdf", "application/pdf", "document"),
    ]

    ev_count = 0
    for case in cases:
        num_evidence = random.randint(2, 8)

        for _ in range(num_evidence):
            name, mime, category = random.choice(evidence_types)
            ev = Evidence(
                id=str(uuid.uuid4()),
                case_id=case.id,
                filename=name,
                original_filename=name,
                file_path=f"/evidence/{case.id}/{name}",
                size_bytes=random.randint(50000, 5000000),
                file_type=mime,
                file_category=category,
                hash=f"sha256:{uuid.uuid4().hex}",
                uploaded_by="system",
                uploaded_at=random_date(90, 0),
                processing_status="completed",
            )
            session.add(ev)
            ev_count += 1

    session.commit()
    print(f"   ✓ Created {ev_count} evidence files")


def seed_case_notes(session, cases):
    """Create demo notes for cases"""
    print("📝 Creating demo case notes...")

    note_templates = [
        "Initial review completed. Evidence suggests further investigation is warranted.",
        "Spoke with compliance team. Additional documents requested from client.",
        "Cross-referenced with previous cases. Found potential connection to Case #2023-456.",
        "Analysis of transaction patterns completed. Report attached.",
        "Escalated to senior investigator for review.",
        "Client provided additional documentation. Under review.",
        "Meeting scheduled with legal team to discuss findings.",
        "SAR filing prepared and submitted to FinCEN.",
    ]

    note_count = 0
    for case in cases:
        num_notes = random.randint(1, 5)

        for _ in range(num_notes):
            note = CaseNote(
                id=str(uuid.uuid4()),
                case_id=case.id,
                content=random.choice(note_templates),
                author_name=random_name(),
                note_type=random.choice(
                    ["general", "analysis", "action", "escalation"]
                ),
                is_internal=random.choice([True, False]),
                created_at=random_date(60, 0),
                updated_at=datetime.now(),
            )
            session.add(note)
            note_count += 1

    session.commit()
    print(f"   ✓ Created {note_count} case notes")


def seed_case_activities(session, cases, users):
    """Create demo case activities"""
    print("📋 Creating demo case activities...")

    activity_types = [
        "created",
        "updated",
        "assigned",
        "status_changed",
        "note_added",
        "evidence_uploaded",
        "escalated",
        "closed",
    ]

    activity_count = 0
    for case in cases:
        num_activities = random.randint(2, 8)
        for _ in range(num_activities):
            activity = CaseActivity(
                id=str(uuid.uuid4()),
                case_id=case.id,
                user_id=random.choice(users).id if users else None,
                user_name=random_name(),
                activity_type=random.choice(activity_types),
                description=f"Activity performed on case {case.title[:20]}...",
                timestamp=random_date(60, 0),
                old_value="previous_status",
                new_value="new_status",
            )
            session.add(activity)
            activity_count += 1

    session.commit()
    print(f"   ✓ Created {activity_count} case activities")


def main():
    print("\n" + "=" * 50)
    print("   Zenith Demo Data Seeder")
    print("=" * 50 + "\n")

    session = Session()

    try:
        # Clear existing data (optional - comment out to append)
        print("🗑️  Clearing existing data...")
        session.query(CaseActivity).delete()
        session.query(CaseNote).delete()
        session.query(Evidence).delete()
        session.query(Transaction).delete()
        session.query(Case).delete()
        session.query(User).delete()
        session.commit()

        # Seed data
        users = seed_users(session)
        cases = seed_cases(session, users)
        seed_transactions(session, cases)
        seed_evidence(session, cases)
        seed_case_notes(session, cases)
        seed_case_activities(session, cases, users)

        print("\n" + "=" * 50)
        print("   ✅ Demo data seeding complete!")
        print("=" * 50 + "\n")

    except Exception as e:
        session.rollback()
        print(f"\n❌ Error: {e}")
        raise
    finally:
        session.close()


if __name__ == "__main__":
    main()
