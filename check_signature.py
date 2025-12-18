
from fastapi.testclient import TestClient
import inspect
try:
    print(f"Signature: {inspect.signature(TestClient.__init__)}")
except Exception as e:
    print(f"Error: {e}")
