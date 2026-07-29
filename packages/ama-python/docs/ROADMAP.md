# AMA/AMDL Roadmap

## Release 0.1 — delivered in this repository

- modular YAML/JSON language;
- strict typed parser;
- semantic and governance validation;
- normalized registry;
- dependency/meta graph;
- impact analysis;
- plugin-based generators;
- Blueprints, SQL, OpenAPI, TypeScript, agents, prompts, workflows, UI manifest, test plan and explorer;
- complete Averro reference specification containing the five video-derived capability groups.

## Release 0.2 — production schema reconciliation

- import current Supabase schemas into a read-only observed model;
- compare observed schema with declared AMDL;
- produce additive migration plans only;
- bind existing `content_items`, `design_documents`, versions, render jobs and storage entities;
- map Mission Control agents/runs/events to existing orchestration data;
- add schema contract tests.

## Release 0.3 — runtime contracts

- versioned event envelope;
- transactional outbox;
- idempotent consumers;
- workflow state machine adapter;
- approval adapter;
- generated repositories and use-case interfaces;
- AIOS registry API.

## Release 0.4 — Offer Intelligence

- swipe catalogue ingestion;
- saved filters and views;
- offer watch scheduler;
- snapshot capture and historical charts;
- explainable opportunity scoring;
- alert rules and Slack/Mission Control notifications.

## Release 0.5 — Governed funnel graph

- scope/permission wizard;
- rate-limited URL discovery;
- page classification and relevance scoring;
- redirect/form/checkout relationship extraction;
- funnel graph visualization;
- evidence package export.

## Release 0.6 — Original Offer Modeling

- source structure analysis;
- customer/VOC model;
- offer canvas;
- claims register;
- originality evaluator;
- versioning and approval;
- funnel blueprint editor.

## Release 0.7 — Carousel Studio integration

- AI generation wizard;
- narrative and slide plan;
- original image generation;
- DesignDocument operation protocol;
- multi-slide editor;
- per-slide regeneration;
- version history and undo/redo;
- PNG/PDF/ZIP rendering;
- accessibility, brand and evidence review.

## Release 0.8 — Mission Control and learning

- cross-project event timeline;
- agent/tool/cost traces;
- goals and initiatives;
- approval inbox;
- operational alerts and incidents;
- reviewed insight-to-memory flow.

## Release 1.0 — Model-driven engineering platform

- visual AMDL editor;
- RFC/ADR generator;
- pull-request architecture checks;
- Next.js/Supabase generator packs;
- sandboxed implementation agents;
- marketplace for safe generator plugins and templates;
- public SDK and CLI stability guarantees.
