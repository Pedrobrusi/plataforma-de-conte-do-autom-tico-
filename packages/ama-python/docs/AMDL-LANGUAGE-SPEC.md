# AMDL 1.0 — Language Specification

## 1. Purpose

AMDL is a declarative language for describing an AI-native enterprise system before choosing its database, web framework, model provider or deployment platform. Its source is intended to become the stable contract from which documentation, schemas, APIs, agents, prompts, workflows, tests and UI manifests are derived.

The canonical serialization is YAML. JSON is equally valid because the semantic model is defined by `schemas/amdl.schema.json`.

## 2. Compilation pipeline

```text
AMDL source
  → include resolver
  → structural parser
  → typed AST
  → semantic validator
  → Meta Registry
  → Meta Graph
  → generator plugins
  → artifact manifest
```

## 3. Root document

```yaml
amdl: "1.0"
metadata: { ... }
defaults: { ... }
includes: [ ... ]
domains: [ ... ]
```

### `metadata`

- `id`: stable machine identifier.
- `name`: human name.
- `version`: semantic version of the specified system.
- `description`: system purpose.
- `owners`: accountable humans or agents.
- `tags`: classification labels.

### `defaults`

Default behavior applied to entities and generated artifacts:

- `workspace_scoped`
- `audited`
- `versioned`
- `soft_delete`
- `approval_for_external_writes`

### `includes`

Relative file paths resolved recursively. Includes are merged deterministically. Circular includes fail compilation.

## 4. Domain

A domain is an ownership boundary. It may declare:

```yaml
- id: content-studio
  name: Content Studio
  owner: Lia
  depends_on: [foundation, aios]
  capabilities: []
  entities: []
  value_objects: []
  events: []
  policies: []
  use_cases: []
  workflows: []
  agents: []
  tools: []
  integrations: []
  api_resources: []
  ui_surfaces: []
  metrics: []
```

A domain owns its entities. Another domain may reference those entities through contracts, but must not mutate them by bypassing the owning domain's use cases.

## 5. Capability

A capability describes what the enterprise can do, independent of a screen or implementation.

```yaml
- id: monitor-offer-activity
  name: Monitor Offer Activity
  inputs: [offer-watch]
  outputs: [offer-snapshot, offer-alert]
  depends_on: [discover-scaled-offers]
  quality_gates: [permission-basis, rate-limit]
  tags: [external-write]
```

Tags can activate semantic governance rules. For example, `reference-modeling` requires `originality-guard` and `authorized-source-use` policies in the same domain.

## 6. Entity

```yaml
- id: offer-watch
  name: Offer Watch
  versioned: true
  fields:
    - name: display_name
      type: string
      required: true
    - name: offer_reference_id
      type: ref:offer-reference
      indexed: true
  states: [active, paused, archived]
```

### Supported field types

- `string`, `text`
- `integer`, `number`, `money`
- `boolean`
- `uuid`, `date`, `datetime`, `url`, `email`
- `json`
- `enum:a|b|c`
- `array:string`
- `ref:entity-id`
- expanded vector type:

```yaml
type:
  kind: vector
  dimensions: 1536
```

Every generated entity receives standard identity, metadata and audit fields according to defaults.

## 7. Event

Events are immutable facts, not commands.

```yaml
- id: offer-snapshot-captured
  name: Offer Snapshot Captured
  aggregate: offer-snapshot
  producers: [monitor-offer-activity]
  consumers: [analytics, mission-control]
  version: 1
  payload:
    - {name: snapshot_id, type: uuid, required: true}
```

Generated event contracts carry an event ID, workspace ID, time, correlation ID and versioned payload.

## 8. Policy

```yaml
- id: human-approval
  name: Human Approval
  effect: require
  condition: approval.decision == approved
  enforcement: runtime
  severity: critical
```

Policy effects are `allow`, `deny`, `require`, `transform` and `audit`. Policies may be compile-time, runtime or both.

## 9. Use case

A use case is the public mutation or query contract of a domain.

```yaml
- id: publish-approved-content
  name: Publish Approved Content
  capability: publish-content
  actor: authorized-publisher
  input: [content-item, channel]
  output: [publication]
  emits: [content-published]
  policies: [publication-human-approval]
  approval: required
```

## 10. Workflow

```yaml
- id: ai-carousel-production
  name: AI Carousel Production
  trigger: carousel-requested
  steps:
    - id: generate
      name: Generate Draft
      uses: generate-carousel-draft
      agent: lia
      on_success: render
      on_failure: escalate
      retry: 1
      timeout_seconds: 900
```

Special terminal targets: `finish`, `fail`, `escalate`.

## 11. Agent and tool

Agents declare capabilities, tools, memory classes, event contracts, budgets and approval boundaries. Tools are runtime-owned; agents never receive infrastructure credentials directly.

```yaml
- id: lia
  name: Lia
  role: Creative director
  mission: Produce original and on-brand content.
  capabilities: [generate-ai-carousel]
  tools: [knowledge-search-tool, image-generation-tool]
  policies: [content-originality]
  memory: [permanent, operational, shared]
  max_cost_per_run: 5.0
```

## 12. Integration

Integrations explicitly declare authorization, rate limiting, data classification and allowed access basis.

```yaml
- id: authorized-web-capture
  name: Authorized Web Capture
  kind: source
  auth: none
  rate_limit: 1-request-per-second-per-host
  respect_robots: true
  permission_mode: authorized
  data_classification: public
```

## 13. API and UI declarations

AMDL does not encode framework-specific React components. It declares product surfaces and public contracts, from which framework adapters can be generated.

```yaml
api_resources:
  - id: offers-api
    name: Offers API
    entity: offer
    path: /offers
    operations: [list, get, create, update, archive]

ui_surfaces:
  - id: offer-workbench
    name: Offer Workbench
    kind: editor
    entity: offer
    route: /offers/:id
    components: [EvidencePanel, OfferCanvas, ApprovalPanel]
    actions: [generate-draft, submit-approval]
```

## 14. References

References may use:

- a globally unique short ID: `offer`
- a domain-qualified ID: `offer-modeling.offer`
- a fully qualified registry ID: `entity:offer-modeling.offer`

Ambiguous references are rejected.

## 15. Determinism and versioning

The compiler builds a normalized source fingerprint. Generated artifacts are reproducible except for the `generated_at` timestamp in the manifest. Breaking language changes require a new AMDL major version.
