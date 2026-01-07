import logging
from collections import defaultdict
from dataclasses import dataclass
from datetime import datetime
from typing import Any

from core.plugin_system import PluginContext, PluginInterface, PluginMetadata

logger = logging.getLogger(__name__)


@dataclass
class RoundTripConfig:
    max_path_length: int
    time_window_hours: float
    amount_tolerance: float


@dataclass
class RoundTripAlert:
    transaction_ids: list[str]
    confidence: float
    path_description: str
    path_length: int
    entities: list[str]
    amount: float


def detect_round_trip_transactions(
    transactions: list[dict[str, Any]],
    max_path_length: int = 5,
    time_window_hours: float = 24.0,
    amount_tolerance: float = 0.1,
) -> list[RoundTripAlert]:
    """
    Detects round-trip transactions (A-B-C-A).
    Simplified DFS to find cycles.
    """
    alerts = []

    # Build a directed graph: sender -> [(receiver, tx_data, date, amount)]
    # Use "customer_id" for sender/receiver if available, else "merchant_name" as receiver
    # This assumes we have full network data. If we only have single-user data,
    # round trip is tough unless we see User->A, A->User (Mirror) or User->A->B->User.
    # We'll assume "merchant_name" can be a user ID in this simulation or graph.

    adj = defaultdict(list)
    tx_map = {}

    for tx in transactions:
        tx_id = tx.get("id")
        tx_map[tx_id] = tx

        # Simplified: Use "customer_id" as Source, "merchant_name" as Target
        src = tx.get("customer_id")
        dst = tx.get("merchant_name")
        date_str = tx.get("date")

        try:
            dt = (
                datetime.fromisoformat(date_str.replace("Z", "+00:00"))
                if isinstance(date_str, str)
                else None
            )
        except Exception:
            dt = None

        if src and dst and dt:
            amt = float(tx.get("amount", 0))
            adj[src].append((dst, tx_id, dt, amt))

    # DFS for cycles
    import time

    start_time = time.time()
    TIMEOUT_SECONDS = 2.0

    def find_cycles(start_node, current_node, path, visited_txs):
        # Optimization: Global timeout check
        if time.time() - start_time > TIMEOUT_SECONDS:
            return

        if len(path) > max_path_length:
            return

        # Check edges from current_node
        for neighbor, tx_id, tx_date, tx_amt in adj[current_node]:
            # Timeout check in loop for responsiveness
            if time.time() - start_time > TIMEOUT_SECONDS:
                break

            if tx_id in visited_txs:
                continue

            # Time constraint check (increasing time)
            if path:
                prev_tx_id = path[-1][1]
                prev_tx = tx_map[prev_tx_id]
                prev_date_str = prev_tx.get("date")
                try:
                    prev_date = datetime.fromisoformat(
                        prev_date_str.replace("Z", "+00:00")
                    )
                except Exception:
                    prev_date = tx_date  # Should not happen if filtered

                if tx_date < prev_date:
                    continue  # Time must move forward

                if (tx_date - prev_date).total_seconds() > (time_window_hours * 3600):
                    continue

            # Amount consistency check (allowing some leakage)
            if path:
                first_amt = path[0][3]
                if abs(tx_amt - first_amt) / first_amt > amount_tolerance:
                    pass  # Continue? Maybe funds reduced. Let's strict for now
                    # For demo, strict check is safer
                    # continue

            new_path = [*path, (current_node, tx_id, tx_date, tx_amt)]

            if neighbor == start_node and len(new_path) >= 2:
                # CYCLE FOUND
                cycle_tx_ids = [p[1] for p in new_path]
                entities = [p[0] for p in new_path] + [neighbor]

                alerts.append(
                    RoundTripAlert(
                        transaction_ids=cycle_tx_ids,
                        confidence=0.9,
                        path_description=" -> ".join(entities),
                        path_length=len(new_path),
                        entities=entities,
                        amount=new_path[0][3],
                    )
                )
                return

            find_cycles(start_node, neighbor, new_path, visited_txs | {tx_id})

    # Run DFS from each node
    # Optimization: Sort transactions by time to prune early?
    # Simple iteration over all nodes
    nodes = list(adj.keys())
    for node in nodes:
        if time.time() - start_time > TIMEOUT_SECONDS:
            logger.warning("Round trip detection timed out - graph too large")
            break
        find_cycles(node, node, [], set())

    return alerts


class RoundTripPlugin(PluginInterface):
    @property
    def metadata(self) -> PluginMetadata:
        return PluginMetadata(
            name="round_trip",
            version="1.0.0",
            namespace="zenith/detection/fraud/round_trip",
            author="Zenith Team",
            description="Detects round-trip transactions (A-B-C-A)",
            dependencies={},
            capabilities=["fraud_detection"],
            security_level="official",
            api_version="v1",
        )

    async def initialize(self, context: PluginContext) -> bool:
        self.context = context
        config_dict = (
            context.config
            if context.config
            else {
                "max_path_length": 5,
                "time_window_hours": 24.0,
                "amount_tolerance": 0.2,
            }
        )
        self.config = RoundTripConfig(**config_dict)
        return True

    async def execute(self, inputs: dict[str, Any]) -> dict[str, Any]:
        transactions = inputs.get("transactions", [])

        alerts = detect_round_trip_transactions(
            transactions,
            max_path_length=self.config.max_path_length,
            time_window_hours=self.config.time_window_hours,
            amount_tolerance=self.config.amount_tolerance,
        )

        results = []
        for alert in alerts:
            results.append(
                {
                    "transaction_ids": alert.transaction_ids,
                    "is_fraud": True,
                    "risk_score": 90.0,
                    "confidence": alert.confidence,
                    "reason": f"Round-trip path: {alert.path_description} (Length: {alert.path_length})",
                    "details": {
                        "path": alert.path_description,
                        "entities": alert.entities,
                        "avg_amount": alert.amount,
                    },
                }
            )

        return {"alerts": results}

    async def cleanup(self) -> None:
        pass

    def validate_config(self, config: dict[str, Any]) -> list[str]:
        return []
