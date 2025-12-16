from typing import Any, Dict

def batch_train_ai_model(data_batch) -> bool:
    """No-op training shim used in tests."""
    return True

def get_ai_model_status() -> Dict[str, Any]:
    return {
        'status': 'idle',
        'last_trained_at': None,
        'model_version': 'stub'
    }
