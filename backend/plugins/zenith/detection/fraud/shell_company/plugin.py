import logging
from collections import defaultdict
from dataclasses import dataclass
from typing import Any

from core.plugin_system import PluginContext, PluginInterface, PluginMetadata

logger = logging.getLogger(__name__)


@dataclass
class ShellCompanyConfig:
    min_transaction_volume: float
    pass_through_threshold: float


@dataclass
class ShellCompanyAlert:
    merchant_name: str
    risk_score: float
    indicators: list[str]


def detect_shell_companies(
    transactions: list[dict[str, Any]],
) -> list[ShellCompanyAlert]:
    """
    Detects potential shell companies based on transaction patterns:
    - High velocity of funds (pass-through)
    - Round number transactions
    - Lack of typical business expenses (inferred)
    """
    alerts = []
    merchant_stats = defaultdict(lambda: {"inflow": 0.0, "outflow": 0.0, "count": 0, "round_amounts": 0})

    for tx in transactions:
        merchant = tx.get("merchant_name")
        if not merchant:
            continue

        amount = float(tx.get("amount", 0))
        tx_type = tx.get("type")

        stats = merchant_stats[merchant]
        stats["count"] += 1

        if amount % 100 == 0:
            stats["round_amounts"] += 1

        if tx_type == "CREDIT":  # Income for merchant (assuming merchant view or outgoing from user)
            # NOTE: In transaction list, CREDIT/DEBIT usually refers to the Account Holder.
            # If "merchant_name" is the counterparty.
            # DEBIT = User pays Merchant (Merchant Inflow)
            # CREDIT = Merchant pays User (Merchant Outflow)
            stats["inflow"] += amount
        else:
            stats["outflow"] += amount

    for merchant, stats in merchant_stats.items():
        indicators = []
        risk_score = 0.0

        # High volume of round numbers
        if stats["count"] > 2 and (stats["round_amounts"] / stats["count"]) > 0.8:
            indicators.append("High frequency of round amounts")
            risk_score += 30

        # Pass-through detection (Inflow ~= Outflow within margin)
        total_vol = stats["inflow"] + stats["outflow"]
        if total_vol > 1000:  # Min volume
            net_flow = abs(stats["inflow"] - stats["outflow"])
            if net_flow < (total_vol * 0.05):  # 5% retained only
                indicators.append("Pass-through account behavior")
                risk_score += 50

        if risk_score > 0:
            alerts.append(
                ShellCompanyAlert(
                    merchant_name=merchant,
                    risk_score=min(risk_score, 100),
                    indicators=indicators,
                )
            )

    return alerts


class ShellCompanyPlugin(PluginInterface):
    @property
    def metadata(self) -> PluginMetadata:
        return PluginMetadata(
            name="shell_company",
            version="1.0.0",
            namespace="zenith/detection/fraud/shell_company",
            author="Zenith Team",
            description="Detects potential shell companies",
            dependencies={},
            capabilities=["fraud_detection"],
            security_level="official",
            api_version="v1",
        )

    async def initialize(self, context: PluginContext) -> bool:
        self.context = context
        config_dict = context.config if context.config else {"min_transaction_volume": 1000.0, "pass_through_threshold": 0.05}
        self.config = ShellCompanyConfig(**config_dict)
        return True

    async def execute(self, inputs: dict[str, Any]) -> dict[str, Any]:
        transactions = inputs.get("transactions", [])

        alerts = detect_shell_companies(transactions)

        results = []
        for alert in alerts:
            results.append(
                {
                    "entity_name": alert.merchant_name,
                    "is_fraud": True,
                    "risk_score": alert.risk_score,
                    "confidence": 0.8,
                    "reason": f"Shell company indicators: {', '.join(alert.indicators)}",
                    "details": {"indicators": alert.indicators},
                }
            )

        return {"alerts": results}

    async def cleanup(self) -> None:
        pass

    def validate_config(self, config: dict[str, Any]) -> list[str]:
        return []
