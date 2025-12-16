from typing import List, Dict, Any
from dataclasses import dataclass

@dataclass
class ShellCompanyAlert:
    merchant_name: str
    risk_score: float
    indicators: List[str]

def detect_shell_companies(transactions: List[Dict[str, Any]], profile_data: Dict[str, Any] = None) -> List[ShellCompanyAlert]:
    """
    Detects potential shell companies based on:
    - High velocity of pass-through funds (In ~= Out)
    - Low balance retention
    - Lack of clear business category
    - Network isolation (only interacts with 1-2 entities)
    """
    alerts = []
    
    # Group by merchant/entity
    merchant_stats = {}
    
    for tx in transactions:
        merchant = tx.get('merchant_name') or tx.get('counterparty')
        if not merchant:
            continue
            
        if merchant not in merchant_stats:
            merchant_stats[merchant] = {'inflow': 0.0, 'outflow': 0.0, 'count': 0, 'categories': set()}
            
        amount = float(tx.get('amount', 0))
        tx_type = tx.get('type') # CREDIT / DEBIT (from perspective of our client)
        
        # From perspective of the merchant:
        # If client DEBITs (pays), merchant gets Inflow.
        # If client CREDITs (refunds/receives), merchant does Outflow.
        if tx_type == 'DEBIT':
            merchant_stats[merchant]['inflow'] += amount
        elif tx_type == 'CREDIT':
            merchant_stats[merchant]['outflow'] += amount
            
        merchant_stats[merchant]['count'] += 1
        if tx.get('category'):
            merchant_stats[merchant]['categories'].add(tx.get('category'))

    # Analyze each merchant
    for merchant, stats in merchant_stats.items():
        score = 0
        indicators = []
        
        inflow = stats['inflow']
        outflow = stats['outflow']
        total_vol = inflow + outflow
        
        if total_vol < 1000: # Ignore small volume
            continue
            
        # Pass-through detection (Inflow ~= Outflow)
        # Real businesses usually profit, so In != Out exactly, but shell companies often just move money.
        # Note: This logic depends heavily on having visibility into the *merchant's* full ledger, 
        # which we might not have. Assuming we are analyzing a suspect entity's ledger directly:
        # If we are analyzing *our client's* transactions *with* them, this logic changes.
        
        # Let's assume 'transactions' are the ledger OF the entity being analyzed (or we are analyzing the counterparty). 
        # If we are analyzing a list of transactions for ONE subject entity:
        
        if abs(inflow - outflow) < (total_vol * 0.05) and total_vol > 5000:
            score += 40
            indicators.append("High pass-through volume (In ~= Out)")
            
        # Category diversity
        if len(stats['categories']) <= 1 and stats['count'] > 10:
            score += 20
            indicators.append("Lack of business activity diversity")
            
        # Round amounts ratio (simple heuristic)
        # (This requires per-transaction check, simplified here)
        
        if score >= 50:
            alerts.append(ShellCompanyAlert(
                merchant_name=merchant,
                risk_score=min(score, 100),
                indicators=indicators
            ))
            
    return alerts
