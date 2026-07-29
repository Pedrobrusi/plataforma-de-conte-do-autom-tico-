# TypeScript Monorepo Integration Contract

**Status:** planning only — this repository is **not** integrated into the main
Averro monorepo yet. This document defines the contract so integration can
happen later without rewriting either side.

## 1. Principle

AMDL is the **single source of truth** for architecture. The Python compiler
(AMA) turns it into artifacts that TypeScript, Next.js, Supabase and the Agent
Runtime **consume but never hand-edit**. Manual code and generated code live
side by side under a clear ownership boundary.

## 2. Artifacts published by the Python side

Produced by `amdl compile examples/averro/system.amdl.yaml -o generated/averro`:

| Artifact | Path | Consumer |
| --- | --- | --- |
| Meta registry | `registry/meta-registry.json` | tooling, codegen, docs |
| Meta / dependency / impact graphs | `graph/*.json`, `graph/*.mmd` | architecture tooling, docs |
| TypeScript contracts | `contracts/domain.ts` | web + server packages |
| Per-entity JSON Schema | `schema/json/*.schema.json` | runtime validation (zod/ajv), forms |
| OpenAPI 3.1 | `api/openapi.json` | API clients, contract tests |
| Supabase migration (additive) | `schema/supabase-migration.sql` | database package (review-gated) |
| Event & policy catalogs | `catalog/*.json` | event bus, authorization layer |
| Agent manifests & prompts | `agents/*.json`, `prompts/agents/*.md` | Agent Runtime |
| Workflow manifests | `workflows/*.json` | Automation Engine |
| UI surface & component manifests | `ui/*.json` | Next.js app scaffolding |
| Verification plan | `tests/verification-plan.md` | QA |
| Governance report | `governance/governance-report.json` | security review, CI gate |
| Compile report + manifest | `report/compile-report.json`, `ama-manifest.json` | CI drift/fingerprint checks |

Machine-readable language schema: `schemas/amdl.schema.json`.

## 3. Recommended location in the future monorepo

```text
<monorepo>/
  packages/
    ama-amdl/            # this Python project, vendored as-is (uv/pip)
    contracts/           # generated TS types + JSON Schema (from ama-amdl)
    db/                  # generated SQL migrations (review-gated)
  apps/
    web/                 # Next.js — imports @averro/contracts
    agent-runtime/       # imports agent manifests + prompts
  generated/averro/      # full compiler output (checked in, read-only)
```

The Python package stays intact under `packages/ama-amdl` (no rewrite). A thin
`@averro/contracts` package re-exports the generated `domain.ts` and schemas so
app code imports a stable specifier.

## 4. Contract between AMDL and manual code

- **Generated files are read-only.** Every one carries a "do not edit" header.
  Manual overrides go in adjacent, non-generated files (e.g. `domain.ts` is
  generated; `domain.extensions.ts` is hand-written and imports it).
- **Additive database changes only** from the generator. Destructive changes are
  proposed in the governance report, risk-classified, and require an explicit
  human-approved migration authored outside the generator.
- **Names are stable.** Object `id`s are the contract; renames are breaking and
  surface as `diff` removals/additions.

## 5. CI strategy

1. `make verify` (lint, typecheck, tests, validate, compile, determinism).
2. **Schema drift:** `python scripts/gen_schema.py && git diff --exit-code
   schemas/amdl.schema.json`.
3. **Artifact drift:** recompile and `git diff --exit-code generated/averro`
   ignoring `ama-manifest.json:generated_at` (or compile with
   `SOURCE_DATE_EPOCH` for a byte-exact check).
4. **Spec drift between branches:** `amdl diff <base> <head>` (exit `1` on
   change) to force a human review when architecture objects change.
5. **Governance gate:** fail the build if the governance report's
   `requires_human_approval` is `true` without an approving review.

## 6. Versioning strategy

- The compiler and language are versioned together (`amdl --version`, package
  `version`). Bump on any change to generated output shape.
- The `fingerprint` in `ama-manifest.json` is a content hash of the normalized
  spec; identical fingerprints guarantee identical artifacts (modulo the
  documented volatile field).
- Downstream packages pin the `ama-amdl` version and regenerate on bump.

## 7. Drift detection summary

| Drift type | Detector |
| --- | --- |
| Schema ↔ model | `scripts/gen_schema.py` + `git diff --exit-code` |
| Artifacts ↔ spec | recompile + `git diff` (or `SOURCE_DATE_EPOCH` byte check) |
| Spec ↔ spec (PRs) | `amdl diff` (non-zero exit on change) |
| Unsafe generation | `amdl.security` scanner + governance report |

## 8. Migration plan (no rewrite)

1. **Vendor** `ama-amdl` into `packages/` unchanged; keep its own `.venv`/CI job.
2. **Publish** `generated/averro` as a read-only build input; add the drift and
   determinism checks above to the monorepo CI.
3. **Adopt incrementally:** new features model in AMDL first, then consume the
   generated contracts; existing hand-written code keeps working untouched.
4. **Bridge types:** `@averro/contracts` re-exports generated TS + schemas.
5. **Gate the database:** generated SQL is proposal-only; a human authors and
   approves the applied migration. No automatic apply, ever.
6. **Only after** the contracts are consumed in at least one app do we consider
   moving the compiler build into the shared pipeline.

No step rewrites the existing system or reduces its scope; each is reversible.
