# services/fraud/rules/structuring.py
from collections import defaultdict
from dataclasses import dataclass
from datetime import datetime, timedelta
from typing import Any, Dict, List


@dataclass
class StructuringAlert:
    entity_name: str
    transaction_ids: List[str]
    total_amount: float
    transaction_count: int
    pattern_type: str  # 'daily_limit', 'monthly_limit', 'multiple_entities'
    confidence: float


def detect_structuring(
    transactions: List[Dict[str, Any]],
    reporting_limit: float = 10000.0,
    structuring_threshold: float = 0.9,
    time_window_days: int = 30,
) -> List[StructuringAlert]:
    """
    Detect transaction structuring patterns where entities deliberately keep
    transactions just below reporting thresholds to avoid detection.

    Common structuring patterns:
    1. Daily limit avoidance (multiple transactions just under daily limit)
    2. Monthly limit avoidance (spreading across month)
    3. Multiple entity structuring (using related accounts)
    """
    alerts = []

    if not transactions:
        return alerts

    # Group transactions by entity (customer/account)
    entity_transactions = defaultdict(list)

    for tx in transactions:
        entity = (
            tx.get("customer_id") or tx.get("account_id") or tx.get("customer_name")
        )
        if not entity:
            continue

        amount = float(tx.get("amount", 0))
        if amount <= 0:
            continue

        tx_date = tx.get("date")
        if isinstance(tx_date, str):
            try:
                tx_date = datetime.fromisoformat(tx_date.replace("Z", "+00:00"))
            except ValueError:
                continue
        elif not isinstance(tx_date, datetime):
            continue

        entity_transactions[entity].append(
            {
                "id": tx.get("id"),
                "amount": amount,
                "date": tx_date,
                "merchant": tx.get("merchant_name"),
                "type": tx.get("transaction_type"),
            }
        )

    # Analyze each entity for structuring patterns
    for entity, txs in entity_transactions.items():
        if len(txs) < 3:  # Need at least 3 transactions to detect pattern
            continue

        # Sort by date
        txs.sort(key=lambda x: x["date"])

        # Pattern 1: Daily limit avoidance
        daily_alerts = _detect_daily_structuring(
            entity, txs, reporting_limit, structuring_threshold
        )
        alerts.extend(daily_alerts)

        # Pattern 2: Monthly limit avoidance
        monthly_alerts = _detect_monthly_structuring(
            entity, txs, reporting_limit, structuring_threshold
        )
        alerts.extend(monthly_alerts)

        # Pattern 3: Frequent small transactions (smurfing)
        smurfing_alerts = _detect_smurfing_pattern(
            entity, txs, reporting_limit, structuring_threshold
        )
        alerts.extend(smurfing_alerts)

    return alerts


def _detect_daily_structuring(
    entity: str, transactions: List[Dict], reporting_limit: float, threshold: float
) -> List[StructuringAlert]:
    """Detect multiple transactions in single day just under reporting limit"""
    alerts = []

    # Group by date
    daily_groups = defaultdict(list)
    for tx in transactions:
        date_key = tx["date"].date()
        daily_groups[date_key].append(tx)

    # Check each day for structuring
    for date, day_txs in daily_groups.items():
        if len(day_txs) < 2:  # Need at least 2 transactions
            continue

        total_amount = sum(tx["amount"] for tx in day_txs)

        # Check if total exceeds reporting limit but individual transactions are under
        if total_amount >= reporting_limit:
            # Check if most transactions are just under the limit
            under_limit_count = sum(
                1 for tx in day_txs if tx["amount"] < reporting_limit * threshold
            )

            if (
                under_limit_count >= len(day_txs) * 0.8
            ):  # 80% of transactions under threshold
                alerts.append(
                    StructuringAlert(
                        entity_name=entity,
                        transaction_ids=[tx["id"] for tx in day_txs],
                        total_amount=total_amount,
                        transaction_count=len(day_txs),
                        pattern_type="daily_limit",
                        confidence=0.85,
                    )
                )

    return alerts


def _detect_monthly_structuring(
    entity: str, transactions: List[Dict], reporting_limit: float, threshold: float
) -> List[StructuringAlert]:
    """Detect transactions spread across month to avoid monthly reporting"""
    alerts = []

    # Group by month
    monthly_groups = defaultdict(list)
    for tx in transactions:
        month_key = (tx["date"].year, tx["date"].month)
        monthly_groups[month_key].append(tx)

    # Check each month for structuring
    for (year, month), month_txs in monthly_groups.items():
        if len(month_txs) < 3:  # Need at least 3 transactions
            continue

        total_amount = sum(tx["amount"] for tx in month_txs)

        # Check if total significantly exceeds reporting limit
        if total_amount >= reporting_limit * 2:
            # Check if transactions are consistently sized (indicating deliberate structuring)
            amounts = [tx["amount"] for tx in month_txs]
            avg_amount = sum(amounts) / len(amounts)

            # Check if most transactions are similar in size and under threshold
            similar_count = sum(
                1
                for amount in amounts
                if amount < reporting_limit * threshold
                and abs(amount - avg_amount) / avg_amount < 0.2
            )  # Within 20% of average

            if similar_count >= len(month_txs) * 0.7:  # 70% similar
                alerts.append(
                    StructuringAlert(
                        entity_name=entity,
                        transaction_ids=[tx["id"] for tx in month_txs],
                        total_amount=total_amount,
                        transaction_count=len(month_txs),
                        pattern_type="monthly_limit",
                        confidence=0.80,
                    )
                )

    return alerts


def _detect_smurfing_pattern(
    entity: str, transactions: List[Dict], reporting_limit: float, threshold: float
) -> List[StructuringAlert]:
    """Detect smurfing pattern: many small transactions that add up to large amounts"""
    alerts = []

    # Look for transactions significantly under the limit
    small_txs = [tx for tx in transactions if tx["amount"] < reporting_limit * 0.5]

    if len(small_txs) < 5:  # Need at least 5 small transactions
        return alerts

    # Check time window (should be relatively close together)
    if len(small_txs) > 1:
        time_span = (small_txs[-1]["date"] - small_txs[0]["date"]).days
        if time_span > 30:  # Too spread out
            return alerts

    total_amount = sum(tx["amount"] for tx in small_txs)

    # If small transactions add up to significant amount
    if total_amount >= reporting_limit:
        # Check for regular intervals (indicates deliberate pattern)
        if len(small_txs) >= 3:
            intervals = []
            for i in range(1, len(small_txs)):
                interval = (
                    small_txs[i]["date"] - small_txs[i - 1]["date"]
                ).total_seconds() / 3600  # hours
                intervals.append(interval)

            # Check if intervals are somewhat regular
            if intervals:
                avg_interval = sum(intervals) / len(intervals)
                regular_count = sum(
                    1
                    for interval in intervals
                    if abs(interval - avg_interval) / avg_interval < 0.5
                )

                if regular_count >= len(intervals) * 0.6:  # 60% regular intervals
                    alerts.append(
                        StructuringAlert(
                            entity_name=entity,
                            transaction_ids=[tx["id"] for tx in small_txs],
                            total_amount=total_amount,
                            transaction_count=len(small_txs),
                            pattern_type="smurfing",
                            confidence=0.90,
                        )
                    )

    return alerts
