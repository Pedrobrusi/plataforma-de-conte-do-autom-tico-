# Averro

Averro is an AI-native platform for creating, organizing, generating, editing,
scheduling and publishing social-media content — governed by a machine-checkable
architecture. This repository is a **monorepo**: the working product
(`apps/web`) plus the **AMA/AMDL** meta-architecture foundation that describes and
generates the platform's contracts.

- **AMDL — Averro Meta Definition Language:** the AMDL spec in
  `specifications/averro/` is the single source of truth for domains,
  capabilities, entities, events, policies, roles, agents, workflows, APIs and UI.
- **AMA — Averro Meta Architecture:** a deterministic compiler
  (`packages/ama-python`) that validates the spec and generates stable contracts
  consumed by TypeScript.

## Repository structure

```text
apps/
  web/                     The existing Next.js 16 application (unchanged behavior)
  mission-control/         Reserved placeholder (README only — no app yet)
packages/
  ama-python/              AMA/AMDL compiler + language (Python)
  architecture-contracts/  TS boundary over generated artifacts (types + fingerprint checks)
specifications/
  averro/                  Canonical AMDL specification (source of truth)
generated/                 Stable, versioned contract artifacts (derived — do not edit)
  architecture/            Raw AMA output (gitignored, regenerated)
supabase/                  Existing migrations (unchanged; never auto-applied)
scripts/                   compile-architecture, drift, verify, secret/env checks
docs/                      Audits, standards, architecture, runbooks
```

## Quick start

```bash
npm install                              # install the JS/TS workspaces
npm run build                            # build apps/web
npm run dev                              # run the app at http://localhost:3000

# AMA/AMDL (Python) — one-time venv:
python -m venv packages/ama-python/.venv
packages/ama-python/.venv/bin/pip install -e "packages/ama-python[dev]"
```

## Everyday commands (run from the repo root)

```bash
npm run dev            # start apps/web
npm run build          # build apps/web
npm run lint           # eslint (apps/web)
npm run typecheck      # tsc for apps/web + architecture-contracts
npm run test:unit      # vitest for apps/web + architecture-contracts
npm run test:e2e       # Playwright (needs a live env; excluded from CI)

npm run ama:validate   # validate the AMDL spec
npm run ama:compile    # compile spec -> generated/ + architecture-contracts
npm run ama:test       # AMA/AMDL Python test-suite
npm run ama:drift      # fail if generated contracts are out of date

npm run verify         # the full local quality gate (mirrors CI)
```

## Source vs. generated

- **Source you edit:** `apps/web/src`, `packages/ama-python/src`,
  `specifications/averro`.
- **Generated (never edit):** everything under `generated/` and
  `packages/architecture-contracts/src/generated/`. Regenerate with
  `npm run ama:compile`. See
  [`docs/standards/GENERATED-ARTIFACTS-POLICY.md`](docs/standards/GENERATED-ARTIFACTS-POLICY.md).

## Contributing

Work on a feature branch, keep the app's behavior unchanged unless intended, and
make sure `npm run verify` is green before opening a PR. See
[`docs/runbooks/LOCAL-DEVELOPMENT.md`](docs/runbooks/LOCAL-DEVELOPMENT.md) and
[`docs/runbooks/QUALITY-GATE.md`](docs/runbooks/QUALITY-GATE.md).

## Remote environments and prohibited local operations

- **Supabase** hosts the database/auth/storage (project in `sa-east-1`).
  Migrations live in `supabase/`. **Do not** apply migrations, run destructive
  SQL, or change any Supabase project from local tooling or CI.
- **Vercel** hosts `apps/web`. After the move to `apps/web`, the Vercel project's
  **Root Directory must be set to `apps/web`** (a human action in the Vercel
  dashboard — not changed by this repo). **Do not** deploy from CI.
- Never commit secrets. Only `*.env.example` are tracked; `.env*` is ignored.
- The AMA `database-proposal.sql` is a **proposal only** and is never applied.

## Documentation

- Architecture: [`docs/architecture/MONOREPO-ARCHITECTURE.md`](docs/architecture/MONOREPO-ARCHITECTURE.md),
  [`AMA-INTEGRATION.md`](docs/architecture/AMA-INTEGRATION.md),
  [`DOMAIN-BOUNDARIES.md`](docs/architecture/DOMAIN-BOUNDARIES.md),
  [`CODE-OWNERSHIP.md`](docs/architecture/CODE-OWNERSHIP.md)
- Runbooks: [`LOCAL-DEVELOPMENT.md`](docs/runbooks/LOCAL-DEVELOPMENT.md),
  [`QUALITY-GATE.md`](docs/runbooks/QUALITY-GATE.md),
  [`ARCHITECTURE-COMPILATION.md`](docs/runbooks/ARCHITECTURE-COMPILATION.md)
- Audits: [`AVERRO-REPOSITORY-BASELINE.md`](docs/audits/AVERRO-REPOSITORY-BASELINE.md),
  [`AMA-SUPABASE-GAP-ANALYSIS.md`](docs/audits/AMA-SUPABASE-GAP-ANALYSIS.md)
- The app's own docs live in `apps/web/` (`ARCHITECTURE.md`, `IMPLEMENTATION_STATUS.md`, …).
