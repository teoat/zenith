import logging
from datetime import datetime, timedelta
from typing import Any

logger = logging.getLogger(__name__)


class TransactionPatternAnalyzer:
    """
    Analyzes transaction patterns using sliding windows for velocity checks (structuring, rapid movement).
    """

    def analyze_velocity(
        self,
        transactions: list[dict[str, Any]],
        window_minutes: int = 60,
        threshold_count: int = 5,
    ) -> list[dict[str, Any]]:
        """
        Detects high velocity of transactions within a sliding window.
        Assumes transactions are sorted by timestamp.
        """
        findings = []
        if not transactions:
            return findings

        # Ensure sorted by time
        sorted_txs = sorted(
            transactions, key=lambda x: x.get("timestamp", datetime.min)
        )

        for i, tx in enumerate(sorted_txs):
            current_time = tx.get("timestamp")
            if not current_time:
                continue

            window_end = current_time + timedelta(minutes=window_minutes)
            count = 0
            volume = 0.0
            related_txs = []

            for j in range(i, len(sorted_txs)):
                next_tx = sorted_txs[j]
                next_time = next_tx.get("timestamp")

                if next_time > window_end:
                    break

                count += 1
                volume += next_tx.get("amount", 0.0)
                related_txs.append(next_tx)

            if count >= threshold_count:
                findings.append(
                    {
                        "pattern": "high_velocity",
                        "timestamp": current_time,
                        "count": count,
                        "volume": volume,
                        "tx_ids": [t.get("id") for t in related_txs],
                    }
                )

        return findings

    def detect_structuring(
        self, transactions: list[dict[str, Any]], threshold_amount: float = 10000.0
    ) -> list[dict[str, Any]]:
        """
        Detects structuring (smurfing) - multiple transactions just below a reporting threshold.
        """
        findings = []
        just_below_threshold = threshold_amount * 0.9  # e.g. 9000

        candidates = [
            tx
            for tx in transactions
            if just_below_threshold <= tx.get("amount", 0.0) < threshold_amount
        ]

        # If we see multiple of these in a short period (e.g. 24h), it's suspicious
        if len(candidates) >= 2:
            findings.append(
                {
                    "pattern": "potential_structuring",
                    "count": len(candidates),
                    "tx_ids": [t.get("id") for t in candidates],
                }
            )

        return findings
