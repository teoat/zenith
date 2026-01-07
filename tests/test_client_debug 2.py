from fastapi import FastAPI
from starlette.testclient import TestClient

app = FastAPI()

try:
    with TestClient(app) as client:
        print("Success: TestClient(app) works")
except TypeError as e:
    print(f"Error: {e}")
    # Inspect TestClient signature
    import inspect

    print(f"Signature: {inspect.signature(TestClient)}")
