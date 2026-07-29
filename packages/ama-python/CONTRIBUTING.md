# Contributing to AMA/AMDL

AMA (Averro Meta Architecture) and AMDL (Averro Meta Definition Language) are
the executable foundation of the Averro platform. The specification is the
source of truth; everything under `generated/` is derived.

## Golden rules

1. **Edit the AMDL source, never the generated artifacts.** Files under
   `generated/averro/` and `schemas/amdl.schema.json` are produced by the
   compiler and carry a "do not edit" header.
2. **Determinism is a contract.** The same input must produce the same output.
   The only volatile field is `ama-manifest.json:generated_at`, which is pinned
   when `SOURCE_DATE_EPOCH` is set.
3. **No secrets, ever.** Do not commit tokens, keys or credentials. `.env` is
   git-ignored; use `.env.example` as the template.
4. **Migrations are additive.** Generated SQL uses `CREATE ... IF NOT EXISTS`.
   Destructive changes must be proposed, risk-classified and approved by a human.

## Setup

```bash
make bootstrap          # creates .venv and installs -e .[dev]
source .venv/bin/activate
```

## Everyday commands

```bash
make verify             # lint + typecheck + tests + validate + compile + determinism
make test               # pytest only
make validate           # validate the Averro example
make compile            # regenerate generated/averro
make schema             # regenerate schemas/amdl.schema.json from the model
make doctor             # environment/project health
```

Run `make verify` before every commit; CI runs the same gate.

## Changing the model

When you touch `src/amdl/models.py`:

1. Update the validator, registry (`COLLECTION_KIND`), graph edges and the
   relevant generators.
2. Run `make schema` to regenerate the JSON Schema.
3. Run `make compile` to regenerate `generated/averro`.
4. Add or update tests under `tests/`.
5. Update `CHANGELOG.md`.

## Adding a generator

Subclass `amdl.generator.Generator`, implement `generate(context)`, prefix
every output with the derived-artifact header, keep output sorted/deterministic,
and register the instance in `BUILTIN_GENERATORS`. Add a test asserting the
artifact exists and is stable.

## Commit style

Small, intentional commits with a conventional prefix
(`audit:`, `fix:`, `feat:`, `test:`, `docs:`). Describe the *why*.

## Code style

- Python 3.11+, `from __future__ import annotations`.
- `ruff` for lint and formatting, `mypy` for types (both enforced by `make verify`).
- Prefer readable diagnostics with a stable code, message, path and hint.
