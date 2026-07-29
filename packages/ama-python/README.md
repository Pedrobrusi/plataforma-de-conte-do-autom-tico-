# AMA + AMDL — Averro Meta Architecture

This repository contains the first executable version of two foundations:

- **AMDL — Averro Meta Definition Language:** a modular YAML/JSON language for describing business domains, capabilities, entities, value objects, fields, events, policies, use cases (command/query), workflows, agents, tools, integrations, APIs, UI surfaces, metrics, roles, permissions, feature flags, deployment targets, evaluations and test specifications. Every object carries a stable id, name, version, status, owners, tags and description for audit and governance.
- **AMA — Averro Meta Architecture:** a deterministic compiler that validates AMDL and generates architecture and engineering artifacts.

The repository also contains a complete AMDL reference model for the Averro Platform, including the features extracted from the five uploaded product walkthrough videos.

## What is implemented

The compiler currently generates (18 generators, 95 artifacts for the Averro spec):

1. Enterprise and per-domain Blueprints.
2. A normalized Meta Registry.
3. A directed Meta Graph, a domain Dependency Graph and an Impact Graph (JSON + Mermaid).
4. Supabase/PostgreSQL migration scaffolding with workspace RLS.
5. Per-entity JSON Schema (draft 2020-12) and OpenAPI 3.1.
6. TypeScript domain contracts and events.
7. Agent manifests and base prompts.
8. Declarative workflow manifests.
9. UI surface and component manifests.
10. Event and policy catalogs.
11. A generated verification plan.
12. A static Architecture Explorer.
13. A governance & safety report (destructive-operation and secret scan).
14. A compilation manifest and compile report with a deterministic source fingerprint.

Every generated file carries a header stating it is derived and must not be
edited by hand. Compilation is deterministic: identical input produces
byte-identical output except the manifest `generated_at`, which is pinned when
`SOURCE_DATE_EPOCH` is set.

## Repository map

```text
src/amdl/                    Parser, AST models, validator, registry, graph, security, compiler, CLI, generators
schemas/amdl.schema.json     Machine-readable AMDL schema (regenerate with scripts/gen_schema.py)
examples/averro/             Modular executable specification of the Averro Platform
docs/                        Architecture, language, video analysis, security, roadmap
docs/audits/                 Baseline audit (AMA-AMDL-BASELINE-AUDIT.md)
docs/integration/            TypeScript monorepo integration contract
generated/averro/            Artifacts generated from the Averro AMDL source (do not edit)
scripts/                     verify.sh and gen_schema.py
tests/                       Compiler, CLI, determinism, security and model verification
```

## Quality gate

A single command runs the whole local quality base — format check, lint,
typecheck, tests, example validation, full compile and a determinism check:

```bash
make verify        # or: bash scripts/verify.sh
```

## Quick start

```bash
python -m venv .venv
source .venv/bin/activate
pip install -e .[dev]

amdl validate examples/averro/system.amdl.yaml
amdl compile examples/averro/system.amdl.yaml --output generated/averro
python -m http.server 8080 --directory generated/averro/explorer
```

Open `http://localhost:8080` to explore every registered architecture object.

Without installing the package:

```bash
PYTHONPATH=src python -m amdl validate examples/averro/system.amdl.yaml
PYTHONPATH=src python -m amdl compile examples/averro/system.amdl.yaml -o generated/averro
```

## CLI

```text
amdl validate <source> [--json]
amdl compile  <source> --output <directory> [--generators a,b] [--no-clean] [--plugins]
amdl inspect  <source> [--kind K] [--domain D] [--id ID] [--full] [--json]
amdl graph    <source> --format mermaid|json [--output FILE]
amdl diff     <old> <new> [--json]
amdl impact   <source> <reference> --depth 3
amdl doctor   [source] [--json]
amdl init     <directory>
amdl watch    <source> --output <directory>
```

Exit codes are automation-friendly: `validate`, `inspect` and `doctor` return
non-zero on failure; `diff` returns `1` when the two systems differ and `0`
when they are identical, so it doubles as a drift check in CI.

```bash
amdl impact  examples/averro/system.amdl.yaml generate-ai-carousel
amdl inspect examples/averro/system.amdl.yaml --kind agent
amdl diff    examples/averro/system.amdl.yaml examples/averro/system.amdl.yaml
amdl doctor  examples/averro/system.amdl.yaml
```

## AMDL example

```yaml
amdl: "1.0"
metadata:
  id: example
  name: Example Platform
  version: 0.1.0

domains:
  - id: content
    name: Content
    capabilities:
      - id: generate-carousel
        name: Generate Carousel
        outputs: [design-document]
    entities:
      - id: design-document
        name: Design Document
        versioned: true
        fields:
          - name: title
            type: string
            required: true
    events:
      - id: carousel-generated
        name: Carousel Generated
        aggregate: design-document
        producers: [generate-carousel]
```

## Architectural guarantees

The validator enforces or warns about:

- unresolved cross-domain references;
- duplicate identifiers;
- invalid workflow edges;
- missing agent tools and policies;
- workspace isolation contracts;
- secret-field classification;
- crawl authorization, access controls and rate limits;
- required originality and authorization policies for reference modeling;
- human approval boundaries for external writes.

## Important boundary

The generated SQL, APIs and code contracts are **reviewable scaffolding**, not automatically deployed production code. Database migrations and external actions remain subject to tests, review and human approval.

## Video-derived architecture

The five walkthroughs were translated into capabilities rather than copied screens:

- offer monitoring and historical activity;
- curated scaled-offer swipe discovery;
- governed funnel URL extraction and page graphing;
- authorized structural modeling with originality controls;
- AI carousel generation, editing, versioning, rendering and export.

See [`docs/VIDEO-FEATURE-ANALYSIS.md`](docs/VIDEO-FEATURE-ANALYSIS.md) and [`docs/FINAL-AVERRO-ARCHITECTURE.md`](docs/FINAL-AVERRO-ARCHITECTURE.md).
