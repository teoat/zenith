from dataclasses import dataclass
from datetime import datetime, timedelta
from typing import Any, Dict, List


@dataclass
class MirrorTransactionAlert:
    transaction_ids: List[str]
    amount: float
    time_diff_seconds: float
    confidence: float


def detect_mirror_transactions(
    transactions: List[Dict[str, Any]],
    time_window_minutes: int = 60,
    amount_tolerance: float = 0.01,
) -> List[MirrorTransactionAlert]:
    """
    Detects mirror transactions: A -> B followed by B -> A (or similar flow reversing)
    within a short time window with similar amounts.
    """
    alerts = []
    sorted_tx = sorted(transactions, key=lambda x: x.get("date", ""))

    for i in range(len(sorted_tx)):
        tx1 = sorted_tx[i]

        # Parse date safely (assuming ISO strings or datetime objects)
        date1 = tx1.get("date")
        if isinstance(date1, str):
            try:
                date1 = datetime.fromisoformat(date1.replace("Z", "+00:00"))
            except ValueError:
                continue
        if not isinstance(date1, datetime):
            continue

        for j in range(i + 1, len(sorted_tx)):
            tx2 = sorted_tx[j]
            date2 = tx2.get("date")
            if isinstance(date2, str):
                try:
                    date2 = datetime.fromisoformat(date2.replace("Z", "+00:00"))
                except ValueError:
                    continue
            if not isinstance(date2, datetime):
                continue

            # Check time window
            time_diff = (date2 - date1).total_seconds()
            if time_diff > time_window_minutes * 60:
                break  # Sorted, so we can stop

            # Check amount similarity
            amt1 = float(tx1.get("amount", 0))
            amt2 = float(tx2.get("amount", 0))

            if amt1 == 0:
                continue

            amount_diff_percent = abs(amt1 - amt2) / amt1
            if amount_diff_percent > amount_tolerance:
                continue

            # Check for reversal pattern (simplified for single ledger view: Credit vs Debit)
            # Or distinct parties swapping back.
            # Assuming 'type' is CREDIT/DEBIT. Mirroring often means In then Out.
            type1 = tx1.get("type")
            type2 = tx2.get("type")

            if type1 and type2 and type1 != type2:
                # Potential mirror: Money came in (CREDIT) then went out (DEBIT) or vice-versa
                alerts.append(
                    MirrorTransactionAlert(
                        transaction_ids=[tx1.get("id"), tx2.get("id")],
                        amount=amt1,
                        time_diff_seconds=time_diff,
                        confidence=0.9
                        - (
                            amount_diff_percent * 10
                        ),  # Higher confidence for exact matches
                    )
                )

    return alerts
