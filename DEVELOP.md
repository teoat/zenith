# Developer setup

Quick steps to set up a development environment (uses the project's virtualenv at `.venv`):

1. Create and activate a venv if you don't already have one:

```bash
python3 -m venv .venv
source .venv/bin/activate
```

2. Install the project in editable mode and dev dependencies:

```bash
pip install -e .
pip install -r requirements-dev.txt
```

3. Run the full test suite:

```bash
python -m pytest -q
```

Notes:
- If tests fail during collection due to missing system binaries (e.g., Tesseract), install those system deps separately.
- For production, do not rely on the dev fallback keys; use a proper KMS/HSM.
