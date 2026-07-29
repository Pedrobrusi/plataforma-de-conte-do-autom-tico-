# Implementation Report

## Build identity

- Package: `averro-ama-amdl`
- Version: `0.1.0`
- AMDL language: `1.0`
- Reference system: `averro-platform@1.0.0`
- Source fingerprint: `09cce0db8c0089fe349d17db168207f949d761b356a8bc836bf7496dcb72e8d1`

## Compiler modules

- `models.py`: strict typed AST.
- `parser.py`: YAML/JSON parsing and include resolution.
- `validator.py`: cross-reference and governance rules.
- `registry.py`: normalized object registry.
- `graph.py`: architecture dependency graph and impact analysis.
- `security.py`: destructive-SQL and secret scanners (governance).
- `plugins.py`: generator plugin registry.
- `builtin_generators.py`: eighteen built-in artifact generators.
- `compiler.py`: validation and deterministic artifact orchestration.
- `cli.py`: validate, compile, inspect, diff, doctor, graph, impact, init and watch commands.

## Verification

```text
AMDL validation: pass
Semantic validation: pass
Automated tests: 37 passed
Objects compiled: 252
Generated artifacts: 95 files
Determinism: byte-identical (SOURCE_DATE_EPOCH pinned)
Governance scan: overall risk info, additive-only
Python bytecode compilation: pass
```

The normal isolated wheel build could not resolve build dependencies from the execution environment's package index. Re-running with `--no-build-isolation` succeeded using the installed toolchain. This is an environment/package-index limitation, not a source failure.

## Generated safety properties

- no destructive schema command;
- tenant RLS templates;
- explicit human approval declarations;
- web-crawl permission basis and rate limit;
- originality and evidence policies;
- no credentials in agent manifests;
- deterministic architecture fingerprint;
- artifacts generated only after semantic validation succeeds.
