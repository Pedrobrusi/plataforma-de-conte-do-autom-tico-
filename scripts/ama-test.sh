#!/usr/bin/env bash
# Run the AMA/AMDL Python test-suite (unit + determinism + governance).
set -euo pipefail
cd "$(dirname "$0")/../packages/ama-python"
PY="${AMA_PYTHON:-.venv/bin/python}"
if [ ! -x "$PY" ]; then PY="python3"; fi
exec "$PY" -m pytest -q
