#!/usr/bin/env bash
# Basic secret scan over tracked files. Fails if a likely secret *value* is
# committed. Names/placeholders in .env.example and docs are allowed.
set -euo pipefail
cd "$(dirname "$0")/.."

PATTERN='-----BEGIN [A-Z ]*PRIVATE KEY-----|eyJ[A-Za-z0-9_-]{20,}\.[A-Za-z0-9_-]{20,}\.[A-Za-z0-9_-]{10,}|\bsk-[A-Za-z0-9]{20,}\b|(service_role|SERVICE_ROLE_KEY)["'"'"']?[[:space:]]*[:=][[:space:]]*["'"'"'][A-Za-z0-9._-]{20,}'

if git grep -nEI "$PATTERN" -- . \
    ':(exclude).env.example' \
    ':(exclude)apps/web/.env.example' \
    ':(exclude)scripts/scan-secrets.sh' \
    ':(exclude)packages/ama-python/src/amdl/security.py' \
    ':(exclude)**/*.md' > /tmp/secret_hits 2>/dev/null; then
  echo "Potential secret values found in tracked files:"
  cat /tmp/secret_hits
  exit 1
fi
echo "Secret scan clean (no committed secret values)."
