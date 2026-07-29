# Monorepo Architecture

## Why a monorepo

Averro couples a running product (`apps/web`) with a formal architecture spec
(AMDL) and a compiler (AMA) that generates contracts the product consumes. A
monorepo keeps the spec, the generated contracts, and the code that depends on
them versioned together, so drift is detectable in a single CI run.

## Package manager

**npm workspaces.** The app was already on npm (`package-lock.json`) with native
dependencies (`ffmpeg-static`, `tesseract.js`); migrating to pnpm now would add
risk without benefit. npm workspaces give a single hoisted `node_modules` and a
single root lockfile. This decision can be revisited later.

## Workspaces and layout

| Path | Type | Role |
| --- | --- | --- |
| `apps/web` | npm workspace | The Next.js 16 product (unchanged behavior). |
| `apps/mission-control` | (not a workspace) | Reserved placeholder — README only. |
| `packages/architecture-contracts` | npm workspace | TS boundary over generated artifacts. |
| `packages/ama-python` | Python (venv) | AMA/AMDL compiler + language. Not an npm workspace. |
| `specifications/averro` | source | Canonical AMDL spec. |
| `generated/` | derived | Stable versioned contracts (+ gitignored raw tree). |
| `supabase/` | source | Existing migrations (unchanged). |

The root `workspaces` array lists only JS/TS packages
(`["apps/web", "packages/architecture-contracts"]`). The Python package is driven
by `scripts/ama.sh` and its own venv, so npm never tries to treat it as a
workspace.

## Data / contract flow

```
specifications/averro (AMDL)  ──ama compile──▶  generated/architecture (raw, ignored)
                                                     │ export_contracts.py
                                                     ▼
        generated/*.json|sql|yaml   +   packages/architecture-contracts/src/generated/*.ts
                                                     │  @averro/architecture-contracts
                                                     ▼
                                   apps/web / apps/mission-control (TS consumers)
```

TypeScript **never** imports Python. It imports the generated artifacts through
`@averro/architecture-contracts`, which also verifies the architecture
fingerprint at runtime/test time.

## Determinism & drift

Compilation is deterministic (`SOURCE_DATE_EPOCH` pinned). `npm run ama:drift`
recompiles and diffs against the versioned contracts; CI fails on any
uncommitted drift. See `docs/standards/GENERATED-ARTIFACTS-POLICY.md`.

## Non-goals for this stage

No new product surfaces (Offer Intelligence, Offer Modeling, full agents, new
screens) are implemented. The move is structural and non-destructive; the app's
behavior is preserved and verified by the same gates as before.
