"""
Database Seed Data Generator

This script generates realistic test data for the fraud detection system,
including sample cases, evidence, transactions, and users.
"""

import os
import random
import sys
from datetime import datetime, timedelta

# Add parent directory to path for imports
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from app.services.infrastructure.auth_service import auth_service
from sqlalchemy.orm import Session

from core.database import (
    Base,
    Case,
    CaseNote,
    Evidence,
    Transaction,
    User,
    create_engine_and_session,
)

# Sample data
SAMPLE_COMPANIES = [
    "TechStart Solutions",
    "Global Trade Corp",
    "Pacific Imports",
    "Metro Construction",
    "Digital Services LLC",
    "Coastal Retail",
    "Summit Manufacturing",
    "Valley Logistics",
    "Urban Development",
    "Harbor Shipping Co",
]

SAMPLE_INVESTIGATORS = [
    "Sarah Chen",
    "Michael Rodriguez",
    "Emily Thompson",
    "David Park",
    "Jessica Williams",
    "Robert Kim",
]

FRAUD_INDICATORS = [
    "Unusual transaction pattern",
    "Duplicate invoices detected",
    "Vendor verification failed",
    "Timeline inconsistencies",
    "Document alterations found",
    "Suspicious bank transfers",
    "Shell company indicators",
    "Round number transactions",
    "Missing documentation",
    "Conflicting statements",
]

CASE_DESCRIPTIONS = [
    "Investigation into suspected invoice fraud scheme involving multiple vendors",
    "Analysis of potentially fraudulent expense reports submitted over 6-month period",
    "Review of suspicious wire transfers to overseas accounts",
    "Examination of construction project cost overruns and billing irregularities",
    "Investigation of employee embezzlement through falsified vendor payments",
    "Analysis of procurement fraud and kickback scheme",
    "Review of financial statement manipulation and revenue recognition issues",
    "Investigation of identity theft and fraudulent account access",
    "Examination of insurance claim fraud with fabricated evidence",
    "Analysis of cryptocurrency-related fraud and money laundering",
]


def generate_sample_users(db: Session, count: int = 5):
    """Generate sample users"""
    users = []
    for i in range(count):
        user = User(
            email=f"investigator{i + 1}@Zenith.com",
            username=f"investigator_{i + 1}",
            full_name=SAMPLE_INVESTIGATORS[i % len(SAMPLE_INVESTIGATORS)],
            password_hash=auth_service.hash_password("Test123!"),
            role="investigator" if i > 0 else "admin",
            is_active=True,
            created_at=datetime.now() - timedelta(days=random.randint(30, 365)),
        )
        users.append(user)
        db.add(user)

    db.commit()
    return users


def generate_sample_cases(db: Session, users: list, count: int = 20):
    """Generate sample fraud cases"""
    cases = []

    statuses = ["open", "in_progress", "under_review", "closed"]
    priorities = ["low", "medium", "high", "critical"]
    risk_levels = ["low", "medium", "high", "critical"]

    for i in range(count):
        # Random dates
        created_date = datetime.now() - timedelta(days=random.randint(1, 180))

        case_metadata = {
            "case_number": f"FR-2024-{str(i + 1).zfill(4)}",
            "company_name": SAMPLE_COMPANIES[i % len(SAMPLE_COMPANIES)],
            "risk_level": random.choice(risk_levels),
            "created_by": users[0].id,
            "amount_involved": random.uniform(5000, 500000),
            "currency": "USD",
        }

        case = Case(
            title=f"Investigation: {SAMPLE_COMPANIES[i % len(SAMPLE_COMPANIES)]}",
            description=random.choice(CASE_DESCRIPTIONS),
            status=random.choice(statuses),
            priority=random.choice(priorities),
            assignee_id=users[random.randint(0, len(users) - 1)].id,
            case_type=random.choice(
                [
                    "financial_fraud",
                    "procurement_fraud",
                    "embezzlement",
                    "identity_theft",
                ]
            ),
            created_at=created_date,
            updated_at=created_date + timedelta(days=random.randint(1, 30)),
            case_metadata=case_metadata,
        )

        cases.append(case)
        db.add(case)

    db.commit()
    return cases


def generate_sample_transactions(db: Session, cases: list, count_per_case: int = 5):
    """Generate sample transactions for cases"""
    transaction_types = ["debit", "credit", "transfer", "payment"]

    for case in cases:
        for i in range(random.randint(2, count_per_case)):
            tx_metadata = {
                "account_number": f"****{random.randint(1000, 9999)}",
                "is_suspicious": random.choice([True, False]),
                "fraud_score": random.uniform(0, 1) if random.random() > 0.5 else None,
            }
            transaction = Transaction(
                case_id=case.id,
                date=case.created_at + timedelta(days=random.randint(-30, 0)),
                amount=random.uniform(100, 50000),
                currency="USD",
                type=random.choice(transaction_types),
                description=f"Transaction {i + 1} - {random.choice(['Invoice payment', 'Wire transfer', 'Check payment', 'ACH transfer'])}",
                merchant_name=random.choice(SAMPLE_COMPANIES),
                transaction_metadata=tx_metadata,
            )
            db.add(transaction)

    db.commit()


def generate_sample_evidence(db: Session, cases: list):
    """Generate sample evidence entries"""
    evidence_types = ["document", "image", "video", "email", "financial_record"]

    for case in cases:
        for i in range(random.randint(1, 4)):
            import json

            tags_json = json.dumps(
                random.sample(FRAUD_INDICATORS, k=random.randint(1, 3))
            )
            metadata_json = json.dumps(
                {
                    "description": f"Evidence item {i + 1} - {random.choice(['Original invoice', 'Bank statement', 'Email correspondence', 'Photo evidence'])}"
                }
            )

            evidence = Evidence(
                case_id=case.id,
                filename=f"evidence_{i + 1}_{random.choice(['invoice', 'receipt', 'email', 'statement', 'photo'])}.pdf",
                file_type=random.choice(evidence_types),
                size_bytes=random.randint(100000, 5000000),
                uploaded_at=case.created_at + timedelta(days=random.randint(1, 20)),
                processing_status="processed",
                evidence_tags=tags_json,
                evidence_metadata=metadata_json,
            )
            db.add(evidence)

    db.commit()


def generate_sample_notes(db: Session, cases: list, users: list):
    """Generate sample case notes"""
    note_templates = [
        "Initial review completed. {indicator}",
        "Follow-up interview scheduled with subject.",
        "Additional documentation requested from {company}.",
        "Analysis reveals {indicator}",
        "Coordination with legal team regarding next steps.",
        "Updated fraud risk assessment based on new evidence.",
        "Case escalated to senior investigator for review.",
        "Witness statement obtained and documented.",
    ]

    for case in cases:
        # Since we moved company_name to metadata, access it from there
        company = case.case_metadata.get("company_name", "Unknown Company")
        for i in range(random.randint(2, 6)):
            note_content = random.choice(note_templates).format(
                indicator=random.choice(FRAUD_INDICATORS), company=company
            )

            note = CaseNote(
                case_id=case.id,
                user_id=users[random.randint(0, len(users) - 1)].id,
                content=note_content,
                created_at=case.created_at + timedelta(days=random.randint(1, 25)),
            )
            db.add(note)

    db.commit()


def seed_database(clear_existing: bool = False):
    """
    Seed the database with sample data.

    Args:
        clear_existing: If True, clear all existing data first
    """
    engine, SessionLocal = create_engine_and_session()
    db = SessionLocal()

    try:
        if clear_existing:
            print("⚠️  Clearing existing data...")
            # Clear all tables (be careful with this!)
            Base.metadata.drop_all(bind=engine)
            Base.metadata.create_all(bind=engine)
            print("✅ Tables recreated")

        print("📝 Generating sample data...")

        # Generate users
        print("  Creating users...")
        users = generate_sample_users(db, count=6)
        print(f"  ✅ Created {len(users)} users")

        # Generate cases
        print("  Creating cases...")
        cases = generate_sample_cases(db, users, count=150)
        print(f"  ✅ Created {len(cases)} cases")

        # Generate transactions
        print("  Creating transactions...")
        generate_sample_transactions(db, cases, count_per_case=5)
        print("  ✅ Created transactions")

        # Generate evidence
        print("  Creating evidence...")
        generate_sample_evidence(db, cases)
        print("  ✅ Created evidence entries")

        # Generate notes
        print("  Creating case notes...")
        generate_sample_notes(db, cases, users)
        print("  ✅ Created case notes")

        print("\n✅ Database seeding completed successfully!")

        # Print summary
        print("\n📊 Summary:")
        print(f"  Users: {len(users)}")
        print(f"  Cases: {len(cases)}")
        print("  Status breakdown:")
        for status in ["open", "in_progress", "under_review", "closed"]:
            count = len([c for c in cases if c.status == status])
            print(f"    - {status}: {count}")

    except Exception as e:
        print(f"\n❌ Error seeding database: {e}")
        db.rollback()
        raise
    finally:
        db.close()


if __name__ == "__main__":
    import argparse

    parser = argparse.ArgumentParser(description="Seed database with sample data")
    parser.add_argument(
        "--clear",
        action="store_true",
        help="Clear existing data before seeding (WARNING: destructive)",
    )

    args = parser.parse_args()

    if args.clear:
        confirm = input(
            "⚠️  This will DELETE all existing data. Are you sure? (yes/no): "
        )
        if confirm.lower() != "yes":
            print("Cancelled.")
            exit(0)

    seed_database(clear_existing=args.clear)
