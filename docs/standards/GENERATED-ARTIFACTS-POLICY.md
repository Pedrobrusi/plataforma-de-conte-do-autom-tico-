# Generated Artifacts Policy

The AMDL specification in `specifications/averro/` is the **single source of
truth**. Everything the AMA compiler produces is *derived* and must never be
edited by hand. This document defines what is versioned, what is regenerated,
and how drift is prevented.

## Source vs. generated

| Kind | Path | Versioned? |
| --- | --- | --- |
| **Source of truth** — AMDL spec | `specifications/averro/**` | ✅ yes |
| **Source of truth** — AMA compiler | `packages/ama-python/**` | ✅ yes |
| **Stable contract** — TS types | `packages/architecture-contracts/src/generated/*.generated.ts` | ✅ yes |
| **Stable contract** — JSON/SQL/YAML | `generated/*.json`, `generated/*.sql`, `generated/*.yaml` | ✅ yes |
| **Raw compile output** — full tree (explorer, blueprints, full registry, prompts, …) | `generated/architecture/**` | ❌ no — gitignored, regenerated |
| Local caches / reports | `.venv/`, `node_modules/`, `.next/`, `.determinism/`, `*.tsbuildinfo` | ❌ no |

## What we version (and why)

Small, stable, review-friendly artifacts that TypeScript consumes:

- `generated/architecture-manifest.json` — fingerprint + system + generator list
  (the volatile `generated_at` is dropped).
- `generated/registry.json` — compact object index (identity + audit metadata,
  no heavy bodies).
- `generated/domain-graph.json` — architecture dependency/impact graph.
- `generated/openapi.generated.yaml` — API contract.
- `generated/events-catalog.json`, `generated/policies-catalog.json`.
- `generated/agents.generated.json`, `generated/workflows.generated.json`.
- `generated/database-proposal.sql` — **proposal only**, never auto-applied.
- `generated/compilation-report.json` — object/artifact counts + fingerprint.
- `packages/architecture-contracts/src/generated/{contracts,events,permissions}.generated.ts`.

## What we do NOT version

- `generated/architecture/**` — the full raw compile (includes the ~340 KB
  explorer HTML and the ~600 KB full registry). Reproducible from the spec, so
  it is regenerated in CI and locally with `npm run ama:compile`.
- Anything transient: caches, logs, local hashes, coverage, build output.

## Determinism

Compilation is deterministic. `scripts/compile-architecture.sh` pins
`SOURCE_DATE_EPOCH`, so identical spec input yields byte-identical artifacts.
The architecture **fingerprint** (a content hash of the normalized spec) is
embedded in every generated TS module and in the manifest.

## Drift prevention

- `npm run ama:drift` (`scripts/check-architecture-drift.sh`) recompiles into a
  temp dir, re-exports the stable artifacts, and diffs them against the
  versioned copies. It exits non-zero if they differ and prints the regenerate
  command.
- CI runs the drift check, so a spec change that isn't accompanied by
  regenerated contracts fails the build.
- `@averro/architecture-contracts` exposes `verifyContractsInSync()` /
  `assertArchitectureFingerprint()` for a runtime/startup fingerprint check.

## Regenerating

```bash
npm run ama:compile     # compile spec -> generated/ + architecture-contracts
git add generated packages/architecture-contracts/src/generated
```

Never edit generated files directly; change `specifications/averro/` and
recompile.
