# Runbook — Architecture Compilation

How the AMDL spec becomes the versioned contracts.

## One command

```bash
npm run ama:compile
```

This runs `scripts/compile-architecture.sh`, which:

1. Pins `SOURCE_DATE_EPOCH` (deterministic output).
2. `amdl validate specifications/averro/system.amdl.yaml`.
3. `amdl compile … -o generated/architecture` (the raw, gitignored tree).
4. `export_contracts.py` — maps the raw output to the **stable** artifacts:
   - `generated/architecture-manifest.json`, `registry.json`, `domain-graph.json`
   - `generated/openapi.generated.yaml`, `events-catalog.json`, `policies-catalog.json`
   - `generated/agents.generated.json`, `workflows.generated.json`
   - `generated/database-proposal.sql`, `compilation-report.json`
   - `packages/architecture-contracts/src/generated/{contracts,events,permissions}.generated.ts`

## After compiling

```bash
git add generated packages/architecture-contracts/src/generated
npm run ama:drift        # confirms in-sync
```

## Determinism

The same spec yields byte-identical artifacts. The AMA fingerprint (a content
hash of the normalized spec) is embedded in every generated TS module and in the
manifest, and is asserted by `@averro/architecture-contracts`.

## Drift detection

`npm run ama:drift` (`scripts/check-architecture-drift.sh`) recompiles into a
temp directory, re-exports, and diffs against the versioned files. It fails with
the exact regenerate command when they differ. CI runs it on every PR, so a spec
change without regenerated contracts is blocked.

## Troubleshooting

- **`amdl: command not found` / import errors:** create the venv
  (`python -m venv packages/ama-python/.venv && …/pip install -e "packages/ama-python[dev]"`),
  or set `AMA_PYTHON` to a Python that has the package installed.
- **Drift after a pull:** run `npm run ama:compile` and commit.
- **The database proposal looks scary:** it is additive-only and never applied —
  see `docs/audits/AMA-SUPABASE-GAP-ANALYSIS.md`.
