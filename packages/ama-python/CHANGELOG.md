# Changelog

All notable changes to AMA/AMDL are recorded here. This project follows
[Keep a Changelog](https://keepachangelog.com/) and semantic versioning.

## [Unreleased]

### Added

- CLI commands `inspect`, `diff` and `doctor`, plus `--json` output on
  `validate`, `inspect`, `diff` and `doctor` for automation.
- First-class object types: `role`, `permission`, `feature_flag`,
  `deployment_target`, `evaluation` and `test_spec`.
- Audit metadata (`version`, `status`, `owners`, `tags`) on every architecture
  object via a shared `MetaObject` base.
- Command/query discriminator on use cases.
- Generators: dependency graph, impact graph, per-entity JSON Schema, event
  catalog, policy catalog, component manifest, governance & safety report and a
  compile report.
- Reusable security scanner (`amdl.security`) that flags destructive SQL
  (DROP/TRUNCATE/column drops, RLS disabling, unrestricted policies, public
  grants) and embedded secrets, and requires explicit human approval for
  destructive changes.
- Determinism guarantees: portable relative source path in the manifest and
  `SOURCE_DATE_EPOCH` support for byte-identical output.
- `scripts/gen_schema.py` to regenerate the JSON Schema from the model.
- `make verify` single quality gate (lint, typecheck, test, validate, compile,
  determinism); `CONTRIBUTING.md`, `SECURITY.md`, `.env.example`.
- Tests grew from 16 to 37, covering security, determinism, the new object
  types, the new CLI commands and video-evidence coverage.
- `docs/audits/AMA-AMDL-BASELINE-AUDIT.md` and
  `docs/integration/TYPESCRIPT-MONOREPO-INTEGRATION.md`.

### Changed

- `FieldSpec.type` is now always a normalized `TypeSpec` (the dead `str` union
  was removed), which makes `mypy src` pass cleanly.
- Centralized the collection→kind mapping in `registry.COLLECTION_KIND`
  (previously duplicated in the registry and graph builders).
- Generators are registered as instances; ruff rule set widened
  (`B`, `SIM`, `UP`, `I`, `RUF`) and the whole tree is formatted.

### Security

- No secrets are committed; generated SQL is additive-only and destructive
  operations are blocked from silent generation.

## 0.1.0 — 2026-07-28

- Added AMDL 1.0 typed language model and JSON Schema.
- Added modular YAML/JSON parsing with include-cycle detection.
- Added semantic, security and governance validation.
- Added Meta Registry, Meta Graph and impact analysis.
- Added eleven built-in generators.
- Added CLI commands: validate, compile, graph, impact, init and watch.
- Added complete Averro reference specification.
- Added video-derived Offer Intelligence, Offer Modeling and Carousel Studio architecture.
- Added 16 automated tests and CI workflow.
