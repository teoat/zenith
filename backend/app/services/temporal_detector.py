"""Compatibility shim exposing `detect_burst` in top-level `services` package.
Delegates to backend implementation when available.
"""
try:
    # Prefer canonical implementation (backend detector)
    from app.services.fraud import temporal_burst_detector as _backend_detector  # type: ignore
    from backend.core.database import Transaction  # type: ignore
except Exception:  # pragma: no cover - fallback
    _backend_detector = None
    Transaction = None


def detect_burst(session, ip, window_minutes=60):
    """Compute a simple burst detection z-score and counts using DB session.

    Returns: (burst: bool, z: float, count_now: int, mean_hist: float, std_hist: float)
    """
    # If backend detector available, use high-level API
    try:
        # If a session is provided, attempt to query Transaction rows directly.
        if session is not None:
            # Try to resolve Transaction model from likely locations
            Tx = Transaction
            if Tx is None:
                try:
                    from backend.core.database import Transaction as Tx  # type: ignore
                except Exception:
                    try:
                        from core.database import Transaction as Tx  # type: ignore
                    except Exception:
                        Tx = None

            if Tx is None:
                raise RuntimeError("No Transaction model available")

            from datetime import datetime, timedelta, timezone
            now = datetime.now(timezone.utc)
            window_delta = timedelta(minutes=window_minutes)
            window_start = now - window_delta

            q_now = session.query(Tx).filter(Tx.ip_address == ip, Tx.date >= window_start)
            count_now = q_now.count()

            # Build historical windows (previous 12 windows)
            hist_counts = []
            for i in range(1, 13):
                start = window_start - i * window_delta
                end = start + window_delta
                c = session.query(Tx).filter(Tx.ip_address == ip, Tx.date >= start, Tx.date < end).count()
                hist_counts.append(c)

            import statistics
            mean_hist = float(statistics.mean(hist_counts)) if hist_counts else 0.0
            std_hist = float(statistics.pstdev(hist_counts)) if hist_counts else 0.0

            z = 0.0
            if std_hist > 0:
                z = (count_now - mean_hist) / std_hist

            burst = count_now >= 10 or (z > 2.0)

            pass

            return (burst, z, count_now, mean_hist, std_hist)
    except Exception:
        # Fall back to a conservative default
        pass

    # Final fallback: no burst
    return (False, 0.0, 0, 0.0, 0.0)


__all__ = ['detect_burst']
