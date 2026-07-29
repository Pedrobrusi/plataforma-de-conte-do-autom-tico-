# AMA ↔ Supabase Gap Analysis

**Date:** 2026-07-29
**Inputs:**
- Existing schema: `supabase/migrations/0001…0008` (32 tables, RLS, `private` helpers).
- AMA proposal: `generated/database-proposal.sql` (derived from
  `specifications/averro/`; 49 tables; **additive-only**, `CREATE … IF NOT EXISTS`).

> **No migration was applied. Nothing in Supabase (any environment) was changed.**
> The AMA SQL is a *proposal* and must stay one until each item below is
> individually reviewed and an incremental migration is authored by a human.

## Executive summary

The AMA proposal reflects the **full Averro vision** (Offer Intelligence, Offer
Modeling, Knowledge Engine, AI/Agent Runtime, Mission Control, Analytics). The
current app implements the **content-creation core** only. Therefore the two
schemas overlap on just a few tables, and even those diverge in columns. The
proposal is **not** a drop-in migration and must never be applied over the
existing database. This stage integrates the compiler and the proposal; it does
**not** implement the future domains.

## Classification

| Item (proposed) | Existing counterpart | Classification | Note |
| --- | --- | --- | --- |
| `workspaces` | `workspaces` | **conflict (columns differ)** | Same name, different shape. `IF NOT EXISTS` means the proposal is a no-op against the real table — do **not** apply. Reconcile the AMDL model to the real columns before any migration. |
| `content_items` | `content_items` | **conflict (columns differ)** | The app stores the `DesignDocument` in `content_items.data`; the AMDL model differs. Keep the app's table; adapt the model, not the DB. |
| `media_assets` | `media_assets` | **compatible (name match)** | Concept matches; verify columns before ever aligning. |
| `render_jobs` | `render_jobs` | **compatible (name match)** | App already extended it (`render_kind`, `result`). |
| `workspace_memberships` | `workspace_members` | **exists with another name** | Same concept; rename in the AMDL model to `workspace_members` (do not create a second table). |
| `audit_entries` | `audit_logs` | **exists with another name** | Same concept; align the model name to `audit_logs`. |
| `approval_requests` | — | **requires incremental migration** | Not in the app yet; a real approvals table is a plausible near-term addition, but out of scope for this stage. |
| `brand_communication_profiles` | `brand_profiles` / `niche_profiles` | **exists with another name / requires adaptation** | Overlapping intent; reconcile before modeling. |
| `content_briefs` | `creative_briefs` | **exists with another name** | Same concept, different name. |
| `content_approvals`, `publications` | `publish_jobs` / `publish_attempts` | **requires adaptation** | Publishing already exists in the app under different names. |
| `design_documents`, `design_document_versions` | (lives in `content_items.data` + `content_versions`) | **compatible — do not implement** | The app deliberately reuses existing tables; the standalone tables should stay unimplemented. |
| `offer_*` (references, watches, snapshots, alerts, pages, page_edges, crawl_runs, opportunity_scores) | — | **must not be implemented yet** | Offer Intelligence — explicitly out of scope this stage. |
| `offers`, `offer_structures`, `offer_versions`, `funnel_blueprints`, `customer_models` | — | **must not be implemented yet** | Offer Modeling — out of scope. |
| `knowledge_documents`, `knowledge_sources`, `source_chunks`, `citations` | `source_imports` (partial) | **must not be implemented yet** | Knowledge Engine — out of scope. |
| `agent_definitions`, `agent_runs`, `agent_memories`, `agent_evaluations`, `tool_calls` | — | **must not be implemented yet** | AI/Agent Runtime — out of scope. |
| `initiatives`, `incidents`, `operational_alerts`, `insights` | `notifications` (partial) | **must not be implemented yet** | Mission Control — out of scope. |
| `business_goals`, `metric_observations`, `learning_records` | — | **must not be implemented yet** | Analytics & Learning — out of scope. |
| `*_versions` tables | `content_versions`, `niche_profile_versions` | **requires adaptation** | The app has its own versioning pattern; align the model to it. |

Existing app tables with **no proposed counterpart** (keep as-is, unaffected):
`ai_generation_runs/outputs`, `avatar_catalog`, `voice_catalog`, `calendars`,
`calendar_events`, `carousel_slides`, `content_blocks`, `content_item_tags`,
`credit_wallets`, `credit_transactions`, `subscriptions`, `folders`,
`social_accounts`, `social_connections`, `tags`, `templates`, `user_profiles`.

## Safety findings

- The AMA proposal contains **no** `DROP TABLE`, `TRUNCATE`, column drops or RLS
  disabling (verified by the AMA governance scanner and re-checked here). It is
  additive-only and workspace-scoped with RLS.
- Because it is additive and `IF NOT EXISTS`, applying it would **not** damage
  existing tables — but it would create ~40 empty forward-looking tables that the
  app does not use. That is undesirable now, so it stays a proposal.

## Recommendation

1. **Do not apply** `generated/database-proposal.sql` to any environment.
2. Treat naming divergences (`workspace_members`↔`workspace_memberships`,
   `audit_logs`↔`audit_entries`, `creative_briefs`↔`content_briefs`) as **model**
   fixes in `specifications/averro/`, so the AMA model converges toward the real
   schema — not the other way around.
3. Implement future-domain tables only when their product surface is actually
   built, each via a reviewed incremental migration under `supabase/migrations/`.
4. Keep regenerating `supabase/types.ts` from the **real** Supabase schema, never
   from the AMA proposal.
