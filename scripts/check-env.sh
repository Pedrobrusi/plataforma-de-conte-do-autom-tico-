#!/usr/bin/env bash
# Static environment-safety checks. Fails on the classic footguns:
#   - a secret concept exposed through a NEXT_PUBLIC_* variable;
#   - a real value committed in an *.env.example file.
set -euo pipefail
cd "$(dirname "$0")/.."
fail=0

# 1. No NEXT_PUBLIC_* variable may carry a secret concept.
if git grep -nEI 'NEXT_PUBLIC_[A-Z0-9_]*(SERVICE_ROLE|SECRET|PRIVATE_KEY|PASSWORD|ACCESS_TOKEN)' \
    -- . ':(exclude)scripts/check-env.sh' > /tmp/env_pub 2>/dev/null; then
  echo "FAIL: secret concept exposed via NEXT_PUBLIC_*:"
  cat /tmp/env_pub
  fail=1
fi

# 2. *.env.example files must not contain real-looking values (16+ char run).
while IFS= read -r f; do
  [ -n "$f" ] || continue
  if grep -nEq '=[[:space:]]*["'"'"']?[A-Za-z0-9]{16,}' "$f"; then
    echo "FAIL: $f appears to contain a real value:"
    grep -nE '=[[:space:]]*["'"'"']?[A-Za-z0-9]{16,}' "$f"
    fail=1
  fi
done < <(git ls-files '*.env.example')

if [ "$fail" -ne 0 ]; then
  exit 1
fi
echo "Env safety check clean."
