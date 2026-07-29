# Code Ownership

Who/what owns each part of the tree, and the rules for changing it.

| Area | Owner | Change rule |
| --- | --- | --- |
| `apps/web/**` | Product (web) | Normal PRs; keep behavior unless intended; unit + build must pass. |
| `apps/mission-control/**` | Architecture | Placeholder only until the real app is brought in. |
| `packages/ama-python/**` | Architecture (AMA) | Change the compiler/language here; keep 37 tests + ruff + mypy green. |
| `specifications/averro/**` | Architecture (AMDL) | The source of truth. Any change requires `npm run ama:compile` + committing regenerated contracts. |
| `packages/architecture-contracts/src/index.ts` | Architecture | Hand-written boundary API. |
| `packages/architecture-contracts/src/generated/**` | **generated** | Never edit by hand. |
| `generated/**` | **generated** | Never edit by hand; regenerate. `generated/architecture/**` is gitignored. |
| `supabase/**` | Platform/DB | Migrations only via reviewed incremental changes; never auto-applied. |
| `scripts/**`, `.github/workflows/**` | Platform/CI | Keep the local `verify` and CI in lockstep. |
| root config (`package.json`, `.gitignore`, `.env.example`) | Platform | Workspace-wide; review carefully. |

## Golden rules

1. Edit the spec, not the generated output.
2. Never commit secrets; only `*.env.example` are tracked.
3. Never apply migrations or deploy from local/CI.
4. `npm run verify` must be green before merge.

## Suggested CODEOWNERS (future)

When the team grows, add a `.github/CODEOWNERS` mapping the areas above to teams
(e.g. `/packages/ama-python/ @architecture`, `/apps/web/ @product`,
`/generated/ @architecture`).
