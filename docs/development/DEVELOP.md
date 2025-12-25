# Developer setup

Quick steps to set up a development environment (uses the project's virtualenv at `backend/venv`):

1. The project uses a consolidated virtual environment. No need to create new venv.

2. Activate the existing virtual environment:

```bash
source backend/venv/bin/activate
```

3. Install/update dependencies (if needed):

```bash
# Dependencies are pre-installed in the venv
# For development updates, use pyproject.toml
pip install -e .
```

Note: The virtual environment was consolidated during optimization (removed duplicate .venv and venv directories).

3. Run the full test suite:

```bash
python -m pytest -q
```

Notes:
- If tests fail during collection due to missing system binaries (e.g., Tesseract), install those system deps separately.
- For production, do not rely on the dev fallback keys; use a proper KMS/HSM.
