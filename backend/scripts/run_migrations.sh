#!/usr/bin/env bash
set -euo pipefail

# Run Alembic migrations for backend
HERE="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "$HERE/.."

if ! command -v alembic >/dev/null 2>&1; then
  echo "alembic not found. Install dependencies in your Python venv: pip install alembic"
  exit 1
fi

echo "Running Alembic migrations..."
alembic -c backend/alembic.ini upgrade head
echo "Migrations complete."
