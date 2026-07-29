# Runbook — Quality Gate

`npm run verify` (`scripts/verify.sh`) is the single local gate and mirrors CI
(`.github/workflows/quality.yml`). It runs, in order:

1. **Secret + env safety** — `scripts/scan-secrets.sh`, `scripts/check-env.sh`
   (no committed secret values; no secret concept in `NEXT_PUBLIC_*`).
2. **AMDL validation** — `npm run ama:validate`.
3. **AMA/AMDL tests** — `npm run ama:test` (37 tests: unit, determinism, security, governance).
4. **Compile architecture** — `npm run ama:compile`.
5. **Drift check** — `npm run ama:drift` (generated contracts match the spec).
6. **Lint** — `npm run lint`.
7. **Typecheck** — `npm run typecheck` (apps/web + architecture-contracts).
8. **Unit tests** — `npm run test:unit` (apps/web 22 + contracts 5).
9. **Build** — `npm run build` (apps/web).

Excluded on purpose: Playwright e2e (needs a live environment), migrations,
deploys, and anything touching Supabase/Vercel remotes.

## CI

`.github/workflows/quality.yml` runs the same steps on `pull_request` and pushes
to `main`, with:

- Node 20 (`npm ci`) + Python 3.11 (venv + editable install of `ama-python[dev]`).
- `permissions: contents: read` (no write access to the repo).
- Failure uploads `generated/compilation-report.json` and the AMA report dir as
  artifacts for debugging.

## Interpreting failures

| Failure | Fix |
| --- | --- |
| `ama:drift` reports DRIFT | `npm run ama:compile` and commit the regenerated files. |
| Typecheck error in `architecture-contracts` | The generated TS is stale/missing — run `npm run ama:compile`. |
| Secret/env check fails | Remove the secret value / rename the `NEXT_PUBLIC_*` variable. |
| Build fails | A real app regression — fix in `apps/web`. |

## Golden rule

Do not weaken or skip a gate to make it pass. Fix the cause.
