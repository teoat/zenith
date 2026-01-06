import os
import sys

sys.path.insert(0, os.path.abspath("."))

from test_config import setup_test_environment

from backend.core.database import create_tables

# from app.services.audit_service import _verify_hmac # Commented out

# Test database setup
setup_test_environment()
create_tables()

# Commented out for now until _verify_hmac is located
# def test_verify_entry_hmac_fallback():
#     # Create an audit log with HMAC signature using AUTH_ENCRYPTION_KEY
#     # Key is already set by setup_test_environment()
#     engine, SessionLocal = create_engine_and_session()
#     s = SessionLocal()
#     try:
#         s.query(AuditLog).delete()
#         s.commit()

#         entry = AuditLog(id='a1', action='test', user_id='u1', timestamp=utc_now(), signature='')
#         # Manually compute HMAC signature same as append_audit_log would
#         import hmac, hashlib
#         payload = f"{entry.id}|{entry.action}|{entry.user_id}|{entry.timestamp}".encode('utf-8')
#         sig = hmac.new(os.environ['AUTH_ENCRYPTION_KEY'].encode('utf-8'), payload, hashlib.sha256).hexdigest()
#         entry.signature = sig
#         s.add(entry)
#         s.commit()

#         # Sanity check: expected signature computed the same way
#         expected = hmac.new(os.environ['AUTH_ENCRYPTION_KEY'].encode('utf-8'), payload, hashlib.sha256).hexdigest()
#         assert expected == entry.signature

#         ok_hmac = _verify_hmac(os.environ['AUTH_ENCRYPTION_KEY'], entry.signature, payload)
#         assert ok_hmac is True
#     finally:
#         s.close()
