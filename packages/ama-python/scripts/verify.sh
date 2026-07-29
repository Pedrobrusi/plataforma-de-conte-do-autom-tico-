#!/usr/bin/env bash
# Full local quality gate for AMA/AMDL. Mirrors `make verify`.
set -euo pipefail
cd "$(dirname "$0")/.."

PYTHON="${PYTHON:-python}"
export PYTHONPATH="${PYTHONPATH:-}:src"
SOURCE="examples/averro/system.amdl.yaml"

echo "==> ruff lint"
"$PYTHON" -m ruff check src tests scripts
"$PYTHON" -m ruff format --check src tests scripts

echo "==> mypy"
"$PYTHON" -m mypy src

echo "==> pytest"
"$PYTHON" -m pytest

echo "==> validate example"
"$PYTHON" -m amdl validate "$SOURCE"

echo "==> compile example"
"$PYTHON" -m amdl compile "$SOURCE" -o generated/averro

echo "==> determinism"
tmp_a="$(mktemp -d)"; tmp_b="$(mktemp -d)"
SOURCE_DATE_EPOCH=1700000000 "$PYTHON" -m amdl compile "$SOURCE" -o "$tmp_a" >/dev/null
SOURCE_DATE_EPOCH=1700000000 "$PYTHON" -m amdl compile "$SOURCE" -o "$tmp_b" >/dev/null
diff -r "$tmp_a" "$tmp_b" >/dev/null && echo "Determinism OK: byte-identical output"
rm -rf "$tmp_a" "$tmp_b"

printf '\nVerification passed. Open generated/averro/explorer/index.html\n'
