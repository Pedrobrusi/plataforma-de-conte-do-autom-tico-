# AMA / AMDL Integration

## Components

- **`packages/ama-python`** — the AMA compiler and AMDL language: parser, typed
  models, semantic + security + governance validation, registry, graph,
  generators, and a CLI (`amdl validate|compile|inspect|diff|doctor|graph|…`).
  It has its own venv, 37 tests, and passes `ruff` + `mypy`.
- **`specifications/averro`** — the canonical AMDL spec (system + 8 domains).
- **`packages/architecture-contracts`** — the TypeScript boundary.

## The Python ↔ TypeScript boundary

Python produces **stable artifacts**; TypeScript **consumes** them. TS never
imports or executes Python.

Produced by `npm run ama:compile` (`scripts/compile-architecture.sh` →
`export_contracts.py`):

| Artifact | Path | Consumer |
| --- | --- | --- |
| Architecture manifest | `generated/architecture-manifest.json` | fingerprint/version checks |
| Registry (compact) | `generated/registry.json` | tooling |
| Domain graph | `generated/domain-graph.json` | tooling, docs |
| OpenAPI | `generated/openapi.generated.yaml` | API clients/tests |
| Event / policy catalogs | `generated/events-catalog.json`, `policies-catalog.json` | event bus, authz |
| Agents / workflows | `generated/agents.generated.json`, `workflows.generated.json` | Agent Runtime |
| Database proposal | `generated/database-proposal.sql` | review only (never applied) |
| Compilation report | `generated/compilation-report.json` | CI |
| TS contracts | `packages/architecture-contracts/src/generated/*.generated.ts` | apps |

## Consuming contracts from TypeScript

```ts
import {
  ARCHITECTURE_FINGERPRINT,
  EVENT_IDS,
  ROLE_PERMISSIONS,
  verifyContractsInSync,
} from "@averro/architecture-contracts";

verifyContractsInSync(); // throws a readable error on drift
```

`verifyContractsInSync()` compares the fingerprint compiled into the TS bundle
against `generated/architecture-manifest.json`, so a spec change that wasn't
regenerated fails fast.

## Regeneration workflow

1. Edit `specifications/averro/**`.
2. `npm run ama:compile`.
3. `git add generated packages/architecture-contracts/src/generated`.
4. `npm run verify` (includes `ama:drift`).

## What is intentionally not integrated yet

The app does not yet import `@averro/architecture-contracts` at runtime — the
boundary exists and is tested, but wiring it into product code is deferred so the
app's behavior stays unchanged in this stage.
