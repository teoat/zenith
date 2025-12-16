# services/fraud/rules/round_trip.py
from typing import List, Dict, Any, Set, Tuple
from dataclasses import dataclass
from datetime import datetime, timezone, timedelta
from collections import defaultdict, deque

@dataclass
class RoundTripAlert:
    transaction_ids: List[str]
    entities: List[str]
    amount: float
    path_length: int
    total_time_hours: float
    path_description: str
    confidence: float

def detect_round_trip_transactions(transactions: List[Dict[str, Any]],
                                  max_path_length: int = 5,
                                  time_window_hours: float = 24.0,
                                  amount_tolerance: float = 0.1) -> List[RoundTripAlert]:
    """
    Detect round-trip transactions where funds flow through multiple entities
    and eventually return to the originator, indicating potential money laundering.
    
    Round-trip patterns:
    1. A -> B -> A (simple round-trip)
    2. A -> B -> C -> A (triangular round-trip)
    3. A -> B -> C -> D -> A (complex round-trip)
    """
    alerts = []
    
    if not transactions or len(transactions) < 3:
        return alerts
    
    # Build transaction graph
    graph = _build_transaction_graph(transactions, time_window_hours, amount_tolerance)
    
    # Find round-trip paths for each entity
    for start_entity in graph:
        round_trips = _find_round_trip_paths(graph, start_entity, max_path_length)
        
        for trip_path in round_trips:
            alert = _create_round_trip_alert(trip_path, transactions)
            if alert:
                alerts.append(alert)
    
    # Remove duplicate alerts (same entities, similar timeframes)
    alerts = _deduplicate_alerts(alerts)
    
    return alerts

def _build_transaction_graph(transactions: List[Dict[str, Any]], 
                            time_window_hours: float,
                            amount_tolerance: float) -> Dict[str, List[Dict]]:
    """Build a directed graph of transaction flows"""
    graph = defaultdict(list)
    
    # Process transactions in chronological order
    sorted_tx = sorted(transactions, key=lambda x: _parse_date(x.get('date')))
    
    for tx in sorted_tx:
        from_entity = _extract_from_entity(tx)
        to_entity = _extract_to_entity(tx)
        
        if not from_entity or not to_entity or from_entity == to_entity:
            continue
        
        amount = float(tx.get('amount', 0))
        if amount <= 0:
            continue
        
        # Add edge to graph
        graph[from_entity].append({
            'to_entity': to_entity,
            'amount': amount,
            'transaction': tx,
            'timestamp': _parse_date(tx.get('date'))
        })
    
    return graph

def _extract_from_entity(tx: Dict[str, Any]) -> str:
    """Extract originating entity from transaction"""
    # For DEBIT transactions, customer is sending money
    if tx.get('transaction_type') == 'DEBIT':
        return tx.get('customer_id') or tx.get('customer_name')
    # For CREDIT transactions, merchant is sending money
    elif tx.get('transaction_type') == 'CREDIT':
        return tx.get('merchant_name')
    return None

def _extract_to_entity(tx: Dict[str, Any]) -> str:
    """Extract destination entity from transaction"""
    # For DEBIT transactions, merchant is receiving money
    if tx.get('transaction_type') == 'DEBIT':
        return tx.get('merchant_name')
    # For CREDIT transactions, customer is receiving money
    elif tx.get('transaction_type') == 'CREDIT':
        return tx.get('customer_id') or tx.get('customer_name')
    return None

def _parse_date(date_val) -> datetime:
    """Parse date value safely"""
    if isinstance(date_val, datetime):
        return date_val
    elif isinstance(date_val, str):
        try:
            return datetime.fromisoformat(date_val.replace('Z', '+00:00'))
        except ValueError:
            pass
    return datetime.now(timezone.utc)

def _find_round_trip_paths(graph: Dict[str, List[Dict]], 
                          start_entity: str,
                          max_path_length: int) -> List[List[Dict]]:
    """Find round-trip paths using DFS with cycle detection"""
    round_trips = []
    
    def dfs(current_entity: str, path: List[Dict], visited: Set[str]):
        # Check if we found a round-trip back to start
        if (len(path) >= 2 and current_entity == start_entity and 
            len(path) <= max_path_length):
            round_trips.append(path.copy())
            return
        
        # Stop if path too long or we've visited too many entities
        if len(path) >= max_path_length or len(visited) > max_path_length:
            return
        
        # Explore outgoing edges
        for edge in graph.get(current_entity, []):
            next_entity = edge['to_entity']
            
            # Skip if we've already visited this entity in current path (avoid simple loops)
            if next_entity in visited and next_entity != start_entity:
                continue
            
            # Add to path and continue
            path.append(edge)
            visited.add(next_entity)
            
            dfs(next_entity, path, visited)
            
            # Backtrack
            path.pop()
            visited.discard(next_entity)
    
    # Start DFS from the start entity
    dfs(start_entity, [], {start_entity})
    
    return round_trips

def _create_round_trip_alert(trip_path: List[Dict], 
                           all_transactions: List[Dict[str, Any]]) -> RoundTripAlert:
    """Create alert from round-trip path"""
    if not trip_path:
        return None
    
    # Extract path information
    entities = [trip_path[0]['to_entity']]  # Start with first destination
    transaction_ids = []
    amounts = []
    timestamps = []
    
    for edge in trip_path:
        entities.append(edge['to_entity'])
        transaction_ids.append(edge['transaction'].get('id'))
        amounts.append(edge['amount'])
        timestamps.append(edge['timestamp'])
    
    # Calculate path metrics
    total_time = (max(timestamps) - min(timestamps)).total_seconds() / 3600  # hours
    avg_amount = sum(amounts) / len(amounts)
    
    # Check amount consistency (round-trips usually have similar amounts)
    amount_variance = sum((amt - avg_amount) ** 2 for amt in amounts) / len(amounts)
    amount_consistency = 1.0 - min(amount_variance / (avg_amount ** 2), 1.0)
    
    # Create path description
    path_desc = " → ".join(entities[:len(entities)-1])  # Exclude final return to start
    
    # Calculate confidence based on path characteristics
    confidence = 0.5  # Base confidence
    confidence += 0.2 * (1.0 - min(len(trip_path) / 5.0, 1.0))  # Shorter paths = higher confidence
    confidence += 0.2 * amount_consistency  # Amount consistency
    confidence += 0.1 * (1.0 - min(total_time / 24.0, 1.0))  # Faster completion = higher confidence
    
    confidence = min(confidence, 1.0)
    
    return RoundTripAlert(
        transaction_ids=transaction_ids,
        entities=list(set(entities)),  # Remove duplicates
        amount=avg_amount,
        path_length=len(trip_path),
        total_time_hours=total_time,
        path_description=path_desc,
        confidence=confidence
    )

def _deduplicate_alerts(alerts: List[RoundTripAlert]) -> List[RoundTripAlert]:
    """Remove duplicate alerts based on entity sets and timeframes"""
    if not alerts:
        return alerts
    
    unique_alerts = []
    seen_entity_sets = []
    
    for alert in alerts:
        # Create normalized entity set for comparison
        entity_set = frozenset(sorted(alert.entities))
        
        # Check if we've seen similar entity set
        is_duplicate = False
        for seen_set in seen_entity_sets:
            # High overlap (>80%) indicates duplicate
            overlap = len(entity_set & seen_set) / len(entity_set | seen_set)
            if overlap > 0.8:
                is_duplicate = True
                break
        
        if not is_duplicate:
            unique_alerts.append(alert)
            seen_entity_sets.append(entity_set)
    
    return unique_alerts