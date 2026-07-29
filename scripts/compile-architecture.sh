#!/usr/bin/env bash
# Compile the canonical AMDL spec with AMA and export the stable, versioned
# TypeScript/JSON contract artifacts. Deterministic (SOURCE_DATE_EPOCH pinned).
set -euo pipefail
cd "$(dirname "$0")/.."

SPEC="specifications/averro/system.amdl.yaml"
ARCH_OUT="generated/architecture"
GENERATED="generated"
CONTRACTS="packages/architecture-contracts/src/generated"
AMA_DIR="packages/ama-python"

PY="${AMA_PYTHON:-$AMA_DIR/.venv/bin/python}"
if [ ! -x "$PY" ]; then PY="python3"; fi

export SOURCE_DATE_EPOCH="${SOURCE_DATE_EPOCH:-1700000000}"
export PYTHONPATH="$AMA_DIR/src"

echo "==> AMA validate"
"$PY" -m amdl validate "$SPEC"

echo "==> AMA compile ($SPEC -> $ARCH_OUT)"
"$PY" -m amdl compile "$SPEC" -o "$ARCH_OUT"

echo "==> Export stable contracts -> $GENERATED and $CONTRACTS"
"$PY" "$AMA_DIR/scripts/export_contracts.py" \
  --architecture "$ARCH_OUT" \
  --generated "$GENERATED" \
  --contracts "$CONTRACTS"

echo "Architecture compilation complete."
