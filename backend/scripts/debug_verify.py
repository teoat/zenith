import os
import sys

sys.path.insert(0, os.path.abspath("backend"))
import sys

from core.database import AuditLog, create_engine_and_session, utc_now
from services.audit_verifier import _verify_hmac, verify_entry

sys.path.insert(0, os.path.abspath("../tests"))
from test_config import setup_test_environment

setup_test_environment()

engine, SessionLocal = create_engine_and_session()
session = SessionLocal()
try:
    session.query(AuditLog).delete()
    session.commit()

    entry = AuditLog(
        id="a1", action="test", user_id="u1", timestamp=utc_now(), signature=""
    )
    import hashlib
    import hmac

    payload = f"{entry.id}|{entry.action}|{entry.user_id}|{entry.timestamp}".encode()
    sig = hmac.new(
        os.environ["AUTH_ENCRYPTION_KEY"].encode("utf-8"), payload, hashlib.sha256
    ).hexdigest()
    entry.signature = sig
    session.add(entry)
    session.commit()

    print("entry.signature:", entry.signature)
    expected = hmac.new(
        os.environ["AUTH_ENCRYPTION_KEY"].encode("utf-8"), payload, hashlib.sha256
    ).hexdigest()
    print("expected:", expected)
    print("expected==entry.signature", expected == entry.signature)
    ok = verify_entry(entry)
    print("verify_entry result:", ok)
    # Direct test of internal _verify_hmac
    ok_hmac = _verify_hmac(os.environ["AUTH_ENCRYPTION_KEY"], entry.signature, payload)
    print("_verify_hmac result:", ok_hmac)
finally:
    session.close()
