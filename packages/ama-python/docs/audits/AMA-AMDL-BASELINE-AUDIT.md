# AMA / AMDL — Baseline Audit

**Date:** 2026-07-28
**Scope:** Full audit of the AMA compiler and the AMDL language foundation, with
local, reversible corrections applied. No remote environment was touched; no
migration was applied; no secret was added or exposed.

## 1. Environment

| Item | Value |
| --- | --- |
| OS | Ubuntu 24.04.4 LTS |
| Architecture | x86_64 |
| Python | 3.11.15 (project requires ≥ 3.11) |
| pip | 26.x in `.venv` |
| Node.js / pnpm / npm | v22.22.2 / 10.33.0 / 10.9.7 (present) |
| Docker | 29.3.1 (present) |
| Git | 2.43.0 |
| Supabase CLI | **not installed** (not required for this stage) |
| GitHub CLI | **not installed** (GitHub access is via MCP) |

A `.venv` was created and the project installed editable with dev extras
(`pip install -e ".[dev]"`). System tools were **not** installed silently.

## 2. Method

1. Extracted and inspected the full repository (source, models, parser,
   validator, registry, graph, generators, CLI, examples, schema, docs, tests,
   previously generated artifacts).
2. Ran the existing quality base (ruff, mypy, pytest, validate, compile) to
   capture the true starting state.
3. Compiled the Averro spec twice in separate directories to measure
   determinism and compared normalized hashes.
4. Compared committed `generated/averro/` against a fresh compile to detect
   drift.
5. Applied local fixes and re-ran every gate.

## 3. Findings

Severity: **S1** blocking correctness/portability · **S2** quality/maintainability ·
**S3** minor/cosmetic.

| # | Severity | Area | Evidence | Correction applied |
| --- | --- | --- | --- | --- |
| F1 | S1 | Types | `mypy src` reported **29 errors**. Root cause: `FieldSpec.type: TypeSpec \| str` kept a dead `str` branch (the before-validator always coerces to `TypeSpec`), producing ~15 `union-attr` errors across `validator.py` and `builtin_generators.py`. | `FieldSpec.type` is now `TypeSpec`; the validator still normalizes strings. All `union-attr` errors removed. |
| F2 | S1 | Types | Loop-variable shadowing in `graph.py` (`event`, `capability`) and `builtin_generators.py` (`entity`) reassigned typed loop vars to `str`/`RegistryEntry`, causing `assignment`/`attr-defined` errors. | Renamed inner loop variables (`emitted`, `capability_ref`, `entity_entry`, …). |
| F3 | S1 | Types | `compiler.py` instantiated abstract `Generator` (`generator_type()` over `list[type[Generator]]`). | `BUILTIN_GENERATORS` now holds concrete **instances**; the compiler registers them directly. |
| F4 | S2 | Types | Missing stubs for `PyYAML` and `networkx`; no `[tool.mypy]` config. | Added `types-PyYAML` to dev deps, a `[tool.mypy]` section, and a `networkx.*` ignore-missing-imports override. `mypy src` is now clean. |
| F5 | S1 | Portability / Determinism | `ama-manifest.json.source` embedded an **absolute build-machine path** (`/mnt/data/averro-ama-amdl/...`), breaking cross-machine reproducibility. | Source is now stored relative to the working directory (bare name fallback), so the manifest is machine-independent. |
| F6 | S2 | Determinism | `generated_at` made the manifest non-reproducible with no documented escape hatch. | Added `SOURCE_DATE_EPOCH` support (byte-identical output when set) and documented `generated_at` as the single volatile field; the compile report records it. |
| F7 | S2 | Lint | Ruff reported **24 issues** (unsorted/unused imports, `collections.abc`, `__all__` order, one `SIM102`). | Auto-fixed; `SIM102`/`SIM108` resolved by hand; ruff rule set widened to `E,F,I,UP,B,SIM,RUF`; whole tree formatted. |
| F8 | S2 | DRY | The collection→kind mapping was duplicated verbatim in `registry.py` and `graph.py` (drift risk). | Centralized in `registry.COLLECTION_KIND`; both consumers import it. |
| F9 | S1 | CLI completeness | Required commands `inspect`, `diff` and `doctor` did not exist. | Implemented all three with readable output, correct exit codes and `--json`. `diff` returns `1` on differences for CI drift detection. |
| F10 | S2 | Model normalization | Objects lacked `version`/`status`/audit metadata; several required object types (role, permission, feature flag, deployment target, evaluation, test spec) were unrepresentable; command vs query was not expressible. | Added a `MetaObject` base (id, name, version, status, owners, tags, description) to every object; added the six object types as optional collections wired through registry/graph/validator/schema/generators; added a `kind: command\|query` discriminator; populated the foundation domain with the platform's real RBAC, flags and deployment targets. |
| F11 | S2 | Generators (ETAPA 7) | Missing required artifacts: dependency graph, impact graph, JSON Schema, event catalog, policy catalog, component manifest, compile report. | Added generators for all of them (18 generators total). |
| F12 | S1 | Governance (ETAPA 8) | No automated block against a spec generating destructive SQL / secret exposure. | Added `amdl.security` scanner (DROP/TRUNCATE/column-drop/RLS-disable/public-grant/`USING (true)`/secret patterns) and a `governance` generator that classifies risk and requires explicit human approval; covered by tests. |
| F13 | S3 | Tests | No tests for security, determinism, the new object types or the new CLI commands; the video-evidence map was unverified. | Test count raised from 16 → 37, including a test that every video-evidence reference resolves in the registry. |
| F14 | S3 | Packaging | A stale `src/averro_ama_amdl.egg-info/` was checked in. | Left untracked and covered by `.gitignore` (`*.egg-info/`); not committed. |

### Non-findings (verified healthy)

- The parser's modular include merge with cycle detection works and is tested.
- The committed `generated/averro/` matched a fresh compile byte-for-byte
  except the volatile manifest fields — i.e. **no real drift**.
- The Averro specification validated with **zero** semantic errors before and
  after the changes.
- Generated SQL was already additive (`CREATE ... IF NOT EXISTS`, RLS enabled);
  the new scanner now enforces this as an invariant.

## 4. Verification results (after fixes)

| Gate | Result |
| --- | --- |
| `ruff check` / `ruff format --check` | pass |
| `mypy src` | pass (0 errors, 15 files) |
| `pytest` | **37 passed** |
| `amdl validate` (Averro) | VALID, 0 diagnostics |
| `amdl compile` (Averro) | 95 files, **252 objects** |
| Determinism (2× compile) | identical except `ama-manifest.json:generated_at`; byte-identical with `SOURCE_DATE_EPOCH` |
| Governance scan | overall risk `info`, 0 destructive operations, additive-only |
| Schema regeneration | idempotent |

Objects by kind: agent 6 · api_resource 13 · capability 31 · deployment_target 3
· domain 8 · entity 43 · evaluation 1 · event 30 · feature_flag 2 · integration 5
· metric 15 · permission 5 · policy 22 · role 4 · test_spec 1 · tool 13 ·
ui_surface 16 · use_case 27 · workflow 7.

## 5. Reproduce this audit

```bash
make bootstrap        # or: python -m venv .venv && ./.venv/bin/pip install -e ".[dev]"
make verify           # lint + typecheck + tests + validate + compile + determinism
amdl doctor examples/averro/system.amdl.yaml
```

## 6. Remaining limitations

- `value_object`, `evaluation` and `test_spec` are fully representable but only
  lightly instantiated in the Averro example; broader modeling is future work.
- The Supabase CLI and GitHub CLI are not installed in this environment; no
  remote Supabase project was contacted (by design).
- Generated SQL, OpenAPI and TypeScript are reviewable scaffolding, not
  production code; they are not deployed or applied here.
