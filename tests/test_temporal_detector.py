import os
import sys
from datetime import datetime, timedelta

sys.path.insert(0, os.path.abspath('backend'))

from core.database import create_tables, Transaction
from services.temporal_detector import detect_burst
from core.database import create_engine_and_session, utc_now
from test_config import setup_test_environment

setup_test_environment()
create_tables()

def insert_tx(session, tx_id, date, ip=None, device=None, ext=None, amount=1.0):
    t = Transaction(id=tx_id, case_id='c1', external_transaction_id=ext or tx_id, date=date, amount=amount, ip_address=ip, device_fingerprint=device)
    session.add(t)


def test_detect_burst_simple():
    engine, SessionLocal = create_engine_and_session()
    s = SessionLocal()
    try:
        # Clear any existing test transactions (best-effort)
        s.query(Transaction).delete()
        s.commit()

        now = utc_now()

        # Insert historical windows: low activity (0-1 per window)
        for i in range(1, 13):
            # earlier windows
            dt = now - timedelta(minutes=60 * (i + 1))
            insert_tx(s, f'hist_{i}', dt, ip='1.2.3.4')

        # Insert multiple transactions in current window
        for i in range(20):
            insert_tx(s, f'now_{i}', now - timedelta(minutes=1), ip='1.2.3.4')

        s.commit()

        burst, z, count_now, mean_hist, std_hist = detect_burst(s, '1.2.3.4', window_minutes=60)
        assert burst is True
        assert count_now >= 20
        assert z > 0
    finally:
        s.close()
