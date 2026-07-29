# Runbook — Local Development

## Prerequisites

- Node.js 20+ and npm 10+
- Python 3.11+
- (For e2e only) a live Supabase project and `apps/web/.env.local`

## First-time setup

```bash
# JS/TS workspaces
npm install

# AMA/AMDL (Python) venv
python -m venv packages/ama-python/.venv
packages/ama-python/.venv/bin/pip install -e "packages/ama-python[dev]"
```

## Run the app

```bash
npm run dev            # http://localhost:3000
```

Environment: copy `apps/web/.env.example` to `apps/web/.env.local` and fill it
(Supabase URL/keys, `TOKEN_ENCRYPTION_KEY`, Meta/Instagram, …). See the root and
app `.env.example` for the classification of each variable. Never commit real
values.

## Common tasks

```bash
npm run build          # production build of apps/web
npm run lint           # eslint
npm run typecheck      # apps/web + architecture-contracts
npm run test:unit      # unit tests (no network)
npm run test:e2e       # Playwright — needs a live env; not part of CI

npm run ama:validate   # validate the AMDL spec
npm run ama:compile    # regenerate contracts after editing the spec
npm run ama:test       # AMA/AMDL Python tests
npm run ama:drift      # check contracts are up to date
```

## Editing the architecture

1. Change `specifications/averro/**`.
2. `npm run ama:compile`.
3. Commit `generated/` and `packages/architecture-contracts/src/generated/`.
4. `npm run verify`.

## Do NOT (locally or in CI)

- Apply Supabase migrations or run destructive SQL.
- Change any Supabase or Vercel remote project.
- Commit secrets or `.env.local`.
- Edit anything under `generated/`.
