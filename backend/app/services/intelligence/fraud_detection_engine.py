"""
Fraud Detection Engine - Rule-Based Detection System
Task 4.1 from Orchestration Plan

This module implements pattern-based fraud detection algorithms:
- Structuring detection (transactions split to avoid reporting thresholds)
- Round-trip transactions (circular money flow)
- Velocity checks (rapid transaction patterns)
- Risk scoring system (0-100)
"""

from typing import List, Dict, Any, Tuple
from datetime import datetime, timedelta
from dataclasses import dataclass
from enum import Enum


class FraudType(Enum):
    """Types of fraud patterns detected"""
    STRUCTURING = "structuring"
    ROUND_TRIP = "round_trip"
    VELOCITY = "velocity"
    UNUSUAL_PATTERN = "unusual_pattern"
    HIGH_RISK_JURISDICTION = "high_risk_jurisdiction"


@dataclass
class Transaction:
    """Transaction data model"""
    id: str
    amount: float
    timestamp: datetime
    source_account: str
    destination_account: str
    description: str
    merchant: str = ""
    category: str = ""
    metadata: Dict[str, Any] = None


@dataclass
class FraudAlert:
    """Fraud detection alert"""
    alert_id: str
    fraud_type: FraudType
    risk_score: int  # 0-100
    confidence: float  # 0.0-1.0
    transactions: List[str]  # Transaction IDs
    description: str
    detected_at: datetime
    details: Dict[str, Any]


class FraudDetectionEngine:
    """
    Rule-based fraud detection engine
    
    Detects common fraud patterns in transaction data:
    - Structuring: Multiple transactions just below reporting threshold
    - Round-trip: Money flowing in a circle back to origin
    - Velocity: Too many transactions in short time period
    """
    
    # Detection thresholds
    STRUCTURING_THRESHOLD = 10000  # $10,000 reporting threshold
    STRUCTURING_WINDOW_HOURS = 24
    STRUCTURING_MIN_TRANSACTIONS = 3
    
    VELOCITY_MAX_TRANSACTIONS = 10
    VELOCITY_WINDOW_MINUTES = 60
    
    ROUND_TRIP_MAX_HOPS = 5
    ROUND_TRIP_TIME_WINDOW_HOURS = 72
    
    def __init__(self):
        self.alerts: List[FraudAlert] = []
        
    def analyze_transactions(self, transactions: List[Transaction]) -> List[FraudAlert]:
        """
        Analyze a batch of transactions for fraud patterns
        
        Args:
            transactions: List of transactions to analyze
            
        Returns:
            List of fraud alerts detected
            
        Raises:
            ValueError: If transactions is empty or None
            TypeError: If transactions is not a list or contains invalid items
        """
        # Input validation
        if transactions is None:
            raise ValueError("Transactions list cannot be None")
        
        if not isinstance(transactions, list):
            raise TypeError(f"Transactions must be a list, got {type(transactions).__name__}")
        
        if len(transactions) == 0:
            raise ValueError("Transactions list cannot be empty")
        
        # Validate each transaction
        for i, tx in enumerate(transactions):
            if not isinstance(tx, Transaction):
                raise TypeError(f"Transaction at index {i} must be a Transaction instance, got {type(tx).__name__}")
        
        self.alerts = []
        
        # Run all detection algorithms
        self.alerts.extend(self._detect_structuring(transactions))
        self.alerts.extend(self._detect_velocity(transactions))
        self.alerts.extend(self._detect_round_trips(transactions))
        
        return self.alerts
    
    def _detect_structuring(self, transactions: List[Transaction]) -> List[FraudAlert]:
        """
        Detect structuring: Multiple transactions just below reporting threshold
        
        Pattern: Criminal splits large amount into smaller transactions to avoid
        triggering $10,000 reporting requirement (CTR - Currency Transaction Report)
        
        Example:
        - $9,900 + $9,800 + $9,700 = $29,400 (would be one $29,400 transaction)
        - All within 24 hours
        - Same account pairs or related accounts
        """
        alerts = []
        
        # Group transactions by account pairs within time window
        account_groups: Dict[Tuple[str, str], List[Transaction]] = {}
        
        for tx in transactions:
            # Create sorted account pair key (order doesn't matter)
            account_pair = tuple(sorted([tx.source_account, tx.destination_account]))
            
            if account_pair not in account_groups:
                account_groups[account_pair] = []
            account_groups[account_pair].append(tx)
        
        # Analyze each account pair for structuring
        for account_pair, txs in account_groups.items():
            # Sort by timestamp
            txs.sort(key=lambda x: x.timestamp)
            
            # Look for clusters of transactions just below threshold
            for i in range(len(txs)):
                window_txs = []
                window_start = txs[i].timestamp
                total_amount = 0
                
                # Collect transactions within time window
                for tx in txs[i:]:
                    if (tx.timestamp - window_start).total_seconds() / 3600 <= self.STRUCTURING_WINDOW_HOURS:
                        # Check if amount is suspiciously close to threshold
                        if 0.8 * self.STRUCTURING_THRESHOLD <= tx.amount < self.STRUCTURING_THRESHOLD:
                            window_txs.append(tx)
                            total_amount += tx.amount
                    else:
                        break
                
                # Alert if multiple transactions just below threshold
                if len(window_txs) >= self.STRUCTURING_MIN_TRANSACTIONS:
                    # Calculate risk score
                    avg_amount = total_amount / len(window_txs)
                    proximity_to_threshold = avg_amount / self.STRUCTURING_THRESHOLD
                    
                    # Higher score if amounts are very close to threshold
                    base_score = 60
                    proximity_bonus = int((proximity_to_threshold - 0.8) * 200)  # 0-40 points
                    count_bonus = min(len(window_txs) * 5, 30)  # Up to 30 points
                    
                    risk_score = min(base_score + proximity_bonus + count_bonus, 100)
                    
                    alert = FraudAlert(
                        alert_id=f"STRUCT_{window_txs[0].id}_{len(window_txs)}",
                        fraud_type=FraudType.STRUCTURING,
                        risk_score=risk_score,
                        confidence=0.85,
                        transactions=[tx.id for tx in window_txs],
                        description=f"Possible structuring: {len(window_txs)} transactions totaling ${total_amount:,.2f} "
                                  f"within {self.STRUCTURING_WINDOW_HOURS}h, avg ${avg_amount:,.2f} (just below ${self.STRUCTURING_THRESHOLD:,} threshold)",
                        detected_at=datetime.now(),
                        details={
                            "total_amount": total_amount,
                            "transaction_count": len(window_txs),
                            "avg_amount": avg_amount,
                            "time_window_hours": self.STRUCTURING_WINDOW_HOURS,
                            "threshold": self.STRUCTURING_THRESHOLD,
                            "account_pair": account_pair
                        }
                    )
                    alerts.append(alert)
                    break  # Don't create multiple alerts for same cluster
        
        return alerts
    
    def _detect_velocity(self, transactions: List[Transaction]) -> List[FraudAlert]:
        """
        Detect velocity fraud: Too many transactions in short time period
        
        Pattern: Unusual burst of transaction activity that may indicate:
        - Account takeover
        - Card testing
        - Automated fraud
        """
        alerts = []
        
        # Group by source account
        account_txs: Dict[str, List[Transaction]] = {}
        for tx in transactions:
            if tx.source_account not in account_txs:
                account_txs[tx.source_account] = []
            account_txs[tx.source_account].append(tx)
        
        # Check each account for velocity issues
        for account, txs in account_txs.items():
            txs.sort(key=lambda x: x.timestamp)
            
            # Sliding window to detect bursts
            for i in range(len(txs)):
                window_start = txs[i].timestamp
                window_txs = []
                
                for tx in txs[i:]:
                    if (tx.timestamp - window_start).total_seconds() / 60 <= self.VELOCITY_WINDOW_MINUTES:
                        window_txs.append(tx)
                    else:
                        break
                
                # Alert if too many transactions in window
                if len(window_txs) >= self.VELOCITY_MAX_TRANSACTIONS:
                    # Calculate risk score based on velocity
                    base_score = 50
                    velocity_bonus = min((len(window_txs) - self.VELOCITY_MAX_TRANSACTIONS) * 5, 40)
                    
                    # Bonus for very short time window
                    actual_window_minutes = (window_txs[-1].timestamp - window_txs[0].timestamp).total_seconds() / 60
                    time_bonus = int((1 - actual_window_minutes / self.VELOCITY_WINDOW_MINUTES) * 10)
                    
                    risk_score = min(base_score + velocity_bonus + time_bonus, 100)
                    
                    alert = FraudAlert(
                        alert_id=f"VEL_{account}_{window_txs[0].id}",
                        fraud_type=FraudType.VELOCITY,
                        risk_score=risk_score,
                        confidence=0.75,
                        transactions=[tx.id for tx in window_txs],
                        description=f"High velocity detected: {len(window_txs)} transactions from account {account} "
                                  f"in {actual_window_minutes:.1f} minutes",
                        detected_at=datetime.now(),
                        details={
                            "account": account,
                            "transaction_count": len(window_txs),
                            "window_minutes": actual_window_minutes,
                            "threshold": self.VELOCITY_MAX_TRANSACTIONS
                        }
                    )
                    alerts.append(alert)
                    break  # One alert per account per window
        
        return alerts
    
    def _detect_round_trips(self, transactions: List[Transaction]) -> List[FraudAlert]:
        """
        Detect round-trip transactions: Money flowing in a circle
        
        Pattern: A → B → C → A (money returns to origin)
        Often used for:
        - Money laundering (layering phase)
        - Creating false business activity
        - Tax evasion
        """
        alerts = []
        
        # Build transaction graph
        graph: Dict[str, List[Tuple[str, Transaction]]] = {}
        for tx in transactions:
            if tx.source_account not in graph:
                graph[tx.source_account] = []
            graph[tx.source_account].append((tx.destination_account, tx))
        
        # Find cycles using DFS
        def find_cycle(start: str, current: str, path: List[Transaction], visited: set) -> List[Transaction]:
            """Find cycle from current node back to start"""
            if current == start and len(path) > 1:
                return path  # Found cycle!
            
            if current in visited or len(path) > self.ROUND_TRIP_MAX_HOPS:
                return []
            
            visited.add(current)
            
            if current in graph:
                for next_account, tx in graph[current]:
                    # Check if within time window
                    if path and (tx.timestamp - path[0].timestamp).total_seconds() / 3600 > self.ROUND_TRIP_TIME_WINDOW_HOURS:
                        continue
                    
                    result = find_cycle(start, next_account, path + [tx], visited.copy())
                    if result:
                        return result
            
            return []
        
        # Check each account for round trips
        checked_cycles = set()
        for start_account in graph.keys():
            cycle = find_cycle(start_account, start_account, [], set())
            
            if cycle:
                # Create unique cycle identifier
                cycle_id = "_".join(sorted([tx.id for tx in cycle]))
                
                if cycle_id not in checked_cycles:
                    checked_cycles.add(cycle_id)
                    
                    total_amount = sum(tx.amount for tx in cycle)
                    
                    # Calculate risk score
                    base_score = 70  # Round trips are inherently suspicious
                    hop_bonus = len(cycle) * 5  # More hops = more suspicious
                    amount_bonus = min(int(total_amount / 10000) * 5, 20)
                    
                    risk_score = min(base_score + hop_bonus + amount_bonus, 100)
                    
                    # Build path description
                    path_desc = " → ".join([cycle[0].source_account] + [tx.destination_account for tx in cycle])
                    
                    alert = FraudAlert(
                        alert_id=f"ROUND_{cycle_id}",
                        fraud_type=FraudType.ROUND_TRIP,
                        risk_score=risk_score,
                        confidence=0.90,
                        transactions=[tx.id for tx in cycle],
                        description=f"Round-trip detected: {len(cycle)} transactions forming cycle {path_desc}, "
                                  f"total amount: ${total_amount:,.2f}",
                        detected_at=datetime.now(),
                        details={
                            "cycle_length": len(cycle),
                            "total_amount": total_amount,
                            "path": path_desc,
                            "time_span_hours": (cycle[-1].timestamp - cycle[0].timestamp).total_seconds() / 3600
                        }
                    )
                    alerts.append(alert)
        
        return alerts
    
    def calculate_overall_risk(self, account: str, transactions: List[Transaction]) -> int:
        """
        Calculate overall risk score for an account (0-100)
        
        Considers:
        - Number of fraud alerts
        - Severity of alerts
        - Transaction patterns
        """
        account_txs = [tx for tx in transactions if tx.source_account == account or tx.destination_account == account]
        
        if not account_txs:
            return 0
        
        # Analyze account's transactions
        alerts = self.analyze_transactions(account_txs)
        account_alerts = [a for a in alerts if account in str(a.details)]
        
        if not account_alerts:
            return 10  # Base risk for any active account
        
        # Weighted average of alert scores
        total_score = sum(alert.risk_score * alert.confidence for alert in account_alerts)
        avg_score = int(total_score / len(account_alerts))
        
        # Bonus for multiple different fraud types
        fraud_types = len(set(a.fraud_type for a in account_alerts))
        diversity_bonus = min(fraud_types * 10, 30)
        
        return min(avg_score + diversity_bonus, 100)


# Example usage and testing
if __name__ == "__main__":
    # Create test transactions
    test_txs = [
        # Structuring example: 3 transactions just below $10k threshold
        Transaction("tx1", 9900, datetime.now() - timedelta(hours=2), "ACC001", "ACC002", "Payment 1"),
        Transaction("tx2", 9800, datetime.now() - timedelta(hours=1), "ACC001", "ACC002", "Payment 2"),
        Transaction("tx3", 9700, datetime.now(), "ACC001", "ACC002", "Payment 3"),
        
        # Velocity example: 12 transactions in 30 minutes
        *[Transaction(f"vtx{i}", 100, datetime.now() - timedelta(minutes=30-i*2), "ACC003", f"SHOP{i}", f"Purchase {i}") 
          for i in range(12)],
        
        # Round trip example: A → B → C → A
        Transaction("rtx1", 5000, datetime.now() - timedelta(hours=48), "ACC004", "ACC005", "Transfer"),
        Transaction("rtx2", 4800, datetime.now() - timedelta(hours=24), "ACC005", "ACC006", "Payment"),
        Transaction("rtx3", 4600, datetime.now(), "ACC006", "ACC004", "Return"),
    ]
    
    # Run detection
    engine = FraudDetectionEngine()
    alerts = engine.analyze_transactions(test_txs)
    
    print(f"\n🚨 Detected {len(alerts)} fraud alerts:\n")
    for alert in alerts:
        print(f"Alert ID: {alert.alert_id}")
        print(f"Type: {alert.fraud_type.value}")
        print(f"Risk Score: {alert.risk_score}/100")
        print(f"Confidence: {alert.confidence:.0%}")
        print(f"Description: {alert.description}")
        print(f"Transactions: {len(alert.transactions)}")
        print("-" * 80)
