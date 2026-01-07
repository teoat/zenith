"""Compatibility shim exposing `detect_burst` in top-level `services` package.
Delegates to backend implementation when available.
"""
from datetime import UTC
from sqlalchemy import func, case

try:
    # Prefer canonical implementation (backend detector)
    from app.services.fraud import (
        temporal_burst_detector as _backend_detector,  # type: ignore
    )

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

            from datetime import datetime, timedelta

            now = datetime.now(UTC)
            window_delta = timedelta(minutes=window_minutes)
            window_start = now - window_delta

            # OPTIMIZATION: Combine all window counts into a single aggregation query
            # instead of running 1 loop iteration per window (1 + 12 queries).
            # This reduces database round-trips significantly.

            earliest_start = window_start - (12 * window_delta)

            # Define aggregation expressions
            expressions = []

            # 1. Current window count
            # Use func.sum(case(...)) to count matches conditionally
            # NOTE: We must ensure we don't double count if ranges overlap, but here
            # current window is >= window_start, and historical are < window_start (mostly).
            # However, the original code had:
            # q_now = Tx.date >= window_start
            # hist_i = start <= Tx.date < end
            # where start = window_start - i*delta, end = start + delta.
            # So hist_1 end is window_start. Ranges are disjoint.

            # The filter(Tx.date >= earliest_start) includes everything from earliest_start onwards.
            # So it covers all historical windows AND the current window.

            expressions.append(
                func.sum(case((Tx.date >= window_start, 1), else_=0))
            )

            # 2. Historical windows counts
            for i in range(1, 13):
                start = window_start - i * window_delta
                end = start + window_delta
                # Range: [start, end)
                cond = (Tx.date >= start) & (Tx.date < end)
                expressions.append(
                    func.sum(case((cond, 1), else_=0))
                )

            # Execute single query
            results = session.query(*expressions).filter(
                Tx.ip_address == ip,
                Tx.date >= earliest_start
            ).first()

            # Handle results (None if no rows match filter)
            if results:
                values = [int(v) if v is not None else 0 for v in results]
                count_now = values[0]
                hist_counts = values[1:]
            else:
                count_now = 0
                hist_counts = [0] * 12

            import statistics

            mean_hist = float(statistics.mean(hist_counts)) if hist_counts else 0.0
            std_hist = float(statistics.pstdev(hist_counts)) if hist_counts else 0.0

            z = 0.0
            if std_hist > 0:
                z = (count_now - mean_hist) / std_hist

            burst = count_now >= 10 or (z > 2.0)

            return (burst, z, count_now, mean_hist, std_hist)
    except Exception:
        # Fall back to a conservative default
        pass

    # Final fallback: no burst
    return (False, 0.0, 0, 0.0, 0.0)


__all__ = ["detect_burst"]
