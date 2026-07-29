#!/usr/bin/env bash
# Full local quality gate for the Averro monorepo. Mirrors CI (quality.yml).
# Never runs remote/destructive tests (no e2e, no migrations, no deploy).
set -euo pipefail
cd "$(dirname "$0")/.."

echo "==> Secret + env safety checks"
bash scripts/scan-secrets.sh
bash scripts/check-env.sh

echo "==> AMA/AMDL validate + tests"
bash scripts/ama.sh validate specifications/averro/system.amdl.yaml
bash scripts/ama-test.sh

echo "==> Compile architecture contracts"
bash scripts/compile-architecture.sh

echo "==> Architecture drift check"
bash scripts/check-architecture-drift.sh

echo "==> Lint (apps/web)"
npm run lint

echo "==> Typecheck (apps/web + architecture-contracts)"
npm run typecheck

echo "==> Unit tests (apps/web + architecture-contracts)"
npm run test:unit

echo "==> Build (apps/web)"
npm run build

echo ""
echo "Monorepo verification passed."
