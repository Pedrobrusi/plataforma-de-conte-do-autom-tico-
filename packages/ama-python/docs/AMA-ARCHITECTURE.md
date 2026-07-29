# AMA — Averro Meta Architecture

## Mission

AMA turns an executable enterprise model into reviewable engineering artifacts. It is not intended to replace deliberate product design or automatic code review; it removes repetitive translation work and preserves architecture across humans and development agents.

## Kernel components

### 1. Parser

- YAML and JSON input.
- Recursive includes.
- circular-include detection.
- strict typed AST through Pydantic.
- unknown properties rejected.

### 2. Semantic validator

The validator resolves references and checks architecture beyond JSON Schema:

- uniqueness by domain and object kind;
- domain dependencies;
- entity field references and indexes;
- event producers, consumers and aggregates;
- workflow operations, agents and graph edges;
- agent tools, policies and capabilities;
- integration authorization and rate limits;
- secret classification;
- originality and permission requirements for reference modeling.

### 3. Meta Registry

Every object receives a fully qualified ID:

```text
domain:content-studio
entity:content-studio.design-document
capability:content-studio.generate-ai-carousel
agent:content-studio.lia
```

The registry is the normalized, queryable source used by all generators and future runtime services.

### 4. Meta Graph

A directed graph records relationships such as:

- domain `contains` entity;
- capability `depends_on` capability;
- use case `implements` capability;
- use case `emits` event;
- event is `consumed_by` domain or agent;
- workflow `orchestrates` use case;
- agent `can_execute` capability;
- agent `uses` tool.

This enables impact analysis before implementation.

### 5. Generator plugin system

Built-in generators implement a stable interface and can be replaced or extended through Python entry points. Current outputs:

| Engine | Output |
|---|---|
| Blueprint Engine | Enterprise and domain Markdown Blueprints |
| Registry Engine | Normalized JSON registry |
| Graph Engine | Meta, dependency and impact graphs (JSON + Mermaid) |
| Schema Engine | Forward-only Supabase/PostgreSQL scaffold |
| JSON Schema Engine | Per-entity JSON Schema (draft 2020-12) |
| API Engine | OpenAPI 3.1 |
| Contract Engine | TypeScript interfaces and event types |
| Agent Engine | Agent manifests and base prompts |
| Workflow Engine | Runtime-neutral workflow JSON |
| UI Engine | Surface manifest |
| Component Engine | Component usage manifest |
| Catalog Engines | Event catalog and policy catalog |
| Test Engine | Verification plan |
| Explorer Engine | Static searchable architecture application |
| Governance Engine | Destructive-operation/secret scan and risk report |
| Report Engine | Compile report and build manifest |

18 generators run per compile; the Averro spec produces 95 files.

## Compiler guarantees

- No generator deploys infrastructure.
- Generated migrations contain no `DROP TABLE`, destructive data rewrite or automatic production execution.
- External writes remain behind explicit approval contracts.
- A build manifest records fingerprint, generators and outputs.
- Any validation error prevents generation.

## Runtime integration target

The generated registry and graph are designed to become read-only inputs for the AIOS Kernel. An agent will be able to ask:

- Which capability owns this operation?
- Which policies govern it?
- Which tool is authorized?
- Which events must be emitted?
- What downstream domains are impacted?
- Is human approval required?

## Future compiler stages

### AMA v1 — implemented here

Specification, validation, Blueprints, graph, contracts, workflows and scaffolding.

### AMA v2

- template packs for Next.js/Supabase;
- migration diffing against a live schema;
- generated repository and use-case skeletons;
- generated contract tests;
- visual AMDL editor;
- architecture linter inside pull requests.

### AMA v3

- agent-assisted RFC creation;
- approved patch generation;
- sandboxed implementation;
- automatic test/evaluation runs;
- pull-request creation with impact analysis;
- human-controlled merge and deployment.
