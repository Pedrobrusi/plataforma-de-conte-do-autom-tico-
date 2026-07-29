#!/usr/bin/env bash
# Fail if the versioned architecture contracts differ from a fresh compile of
# the AMDL spec. Compiles into a temp dir, exports the stable artifacts over a
# copy of the working tree, and diffs the tracked contract paths.
set -euo pipefail
cd "$(dirname "$0")/.."
ROOT="$(pwd)"
AMA_DIR="packages/ama-python"
PY="${AMA_PYTHON:-$AMA_DIR/.venv/bin/python}"
if [ ! -x "$PY" ]; then PY="python3"; fi
export PYTHONPATH="$AMA_DIR/src"
export SOURCE_DATE_EPOCH="${SOURCE_DATE_EPOCH:-1700000000}"

TMP="$(mktemp -d)"
trap 'rm -rf "$TMP"' EXIT
mkdir -p "$TMP/generated" "$TMP/contracts"

"$PY" -m amdl compile specifications/averro/system.amdl.yaml -o "$TMP/architecture" >/dev/null
"$PY" "$AMA_DIR/scripts/export_contracts.py" \
  --architecture "$TMP/architecture" \
  --generated "$TMP/generated" \
  --contracts "$TMP/contracts" >/dev/null

STATUS=0
# Compare only the freshly-exported stable files against their tracked copies.
# (The raw generated/architecture/ tree is gitignored and intentionally skipped.)
for f in $(cd "$TMP/generated" && find . -type f); do
  if ! diff -q "$TMP/generated/$f" "$ROOT/generated/$f" >/dev/null 2>&1; then
    echo "DRIFT: generated/$f"
    STATUS=1
  fi
done
for f in $(cd "$TMP/contracts" && find . -type f); do
  if ! diff -q "$TMP/contracts/$f" "$ROOT/packages/architecture-contracts/src/generated/$f" >/dev/null 2>&1; then
    echo "DRIFT: packages/architecture-contracts/src/generated/$f"
    STATUS=1
  fi
done

if [ "$STATUS" -ne 0 ]; then
  echo ""
  echo "Architecture contracts are out of date. Regenerate with:"
  echo "  npm run ama:compile"
  echo "and commit the updated generated/ and packages/architecture-contracts/src/generated/."
  exit 1
fi
echo "Architecture contracts are in sync (fingerprint verified)."
