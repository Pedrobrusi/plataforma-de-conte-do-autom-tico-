# Final Averro Architecture — AMA/AMDL Baseline

## 1. Strategic definition

Averro is an AI-native operating system for direct-response research, original offer development, content production, governed distribution, analytics and organizational learning. AMA is its engineering system; AMDL is its executable source of truth.

## 2. System layers

```text
Experience Layer
  Web · Slack · API · future mobile/CLI

Product Domains
  Offer Intelligence · Offer Modeling · Content Studio · Analytics · Mission Control

AI and Knowledge Platform
  AIOS · Knowledge Engine · Workflow manifests · Agent registry

Foundation
  Identity · Workspace · RLS · Approvals · Audit · Storage · Events

Meta Engineering Layer
  AMDL · Parser · Validator · Registry · Graph · AMA Generators
```

## 3. Domain ownership

| Domain | Owns | Main actor |
|---|---|---|
| Platform Foundation | workspace, membership, approval, audit | Laura / human owner |
| AIOS | agent definition, run, tool call, evaluation, memory | Laura, Nexo |
| Knowledge Engine | source, document, chunk, citation | Nilo / indexing workers |
| Offer Intelligence | reference, watch, snapshot, alert, page graph, opportunity score | Mika |
| Offer Modeling | abstract structure, customer model, original offer, funnel blueprint, review | Cora |
| Content Studio | brief, content item, design document, versions, media, render, approval, publication | Lia |
| Analytics | metric observation, insight, reviewed learning | Iris |
| Mission Control | goal, initiative, operational alert, incident | Laura |

## 4. Primary value stream

```text
GoalCreated
  → SearchOfferSwipe
  → CreateOfferWatch
  → CaptureOfferSnapshot
  → CalculateOpportunityScore
  → ExtractOfferURLs
  → AnalyzeReferenceOffer
  → DraftOriginalOffer
  → CreateFunnelBlueprint
  → ReviewOffer [human approval]
  → CreateContentBrief
  → GenerateCarouselDraft
  → RenderContent
  → ReviewContent [human approval]
  → PublishApprovedContent [human approval]
  → MetricObserved
  → InsightGenerated
  → LearningPromoted [human approval]
```

## 5. Data and event contracts

Every material record is scoped to a workspace unless explicitly system-owned. Generated entities receive:

- UUID identity;
- workspace ID;
- version and metadata;
- created/updated timestamps;
- human/agent/correlation audit attributes;
- optional soft deletion.

Every material event carries:

- event ID and type;
- workspace ID;
- aggregate identity;
- occurrence time;
- correlation/causation context;
- versioned payload.

## 6. Human control boundaries

Human approval is mandatory before:

- an offer is approved for live use;
- content is approved;
- content is published externally;
- an ad or budget is activated in future integrations;
- destructive actions are executed;
- candidate learning becomes institutional memory.

Agents can prepare, analyze, recommend and create drafts. They cannot silently publish, spend or bypass workspace policies.

## 7. Video feature placement

| Video capability | Final domain | Core objects |
|---|---|---|
| Offer monitoring and history | Offer Intelligence | OfferWatch, OfferSnapshot, OfferAlert |
| Curated swipe and filters | Offer Intelligence | OfferReference, OpportunityScore |
| Funnel URL discovery | Offer Intelligence | CrawlRun, OfferPage, OfferPageEdge |
| Offer “cloning” workflow | Offer Modeling, redefined as original modeling | OfferStructure, Offer, OriginalityReport |
| AI carousel builder/editor | Content Studio | ContentBrief, DesignDocument, Version, RenderJob |

## 8. Deployment topology target

### Existing Supabase separation

- `averro-content-os`: content, design documents, knowledge/media-facing production data.
- `averro-mission-control`: orchestration, agent runs, approvals, operational events and executive telemetry.

### Recommended integration

- public versioned APIs and signed webhooks/events;
- an outbox table per project;
- idempotent event consumers;
- correlation IDs spanning both projects;
- no direct cross-project table writes;
- central Mission Control read models built from events.

## 9. Build order

1. Stabilize AMDL and AMA CI gates.
2. Reconcile generated registry with the existing production schemas.
3. Implement the event envelope and outbox.
4. Build Offer Intelligence read models and monitoring jobs.
5. Build governed crawler and funnel graph.
6. Build Offer Modeling with originality/claims review.
7. Connect the existing Content Studio implementation to generated contracts.
8. Add the full carousel AI wizard/editor workflow.
9. Integrate Mission Control timelines and approvals.
10. Add analytics and reviewed learning.

## 10. Definition of done for architecture changes

A feature is not ready for implementation until it has:

- an AMDL capability and owner;
- owned entities and states;
- use cases and policies;
- events and consumers;
- workflow failure/approval behavior;
- API/UI declarations;
- metrics;
- generated impact analysis;
- tests and rollback strategy.
