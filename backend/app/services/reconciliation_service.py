
class ReconciliationService:
    """Mock Reconciliation Service"""
    def __init__(self, db):
        self.db = db

    def reconcile_cash_float(self, entity_name, start_date, end_date):
        return {
            "entity": entity_name,
            "period": f"{start_date} - {end_date}",
            "status": "balanced",
            "discrepancy": 0.0
        }

    def find_batch_matches(self, withdrawal_id, tolerance):
        return {
            "withdrawal_id": withdrawal_id,
            "matches": []
        }

    def save_batch_match(self, withdrawal_id, expense_ids):
        return {
            "success": True,
            "withdrawal_id": withdrawal_id,
            "matched_expenses": len(expense_ids)
        }
