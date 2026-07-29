#!/usr/bin/env bash
# Forward arguments to the AMA/AMDL CLI using the ama-python venv when present.
set -euo pipefail
cd "$(dirname "$0")/.."
AMA_DIR="packages/ama-python"
PY="${AMA_PYTHON:-$AMA_DIR/.venv/bin/python}"
if [ ! -x "$PY" ]; then PY="python3"; fi
export PYTHONPATH="$AMA_DIR/src"
exec "$PY" -m amdl "$@"
