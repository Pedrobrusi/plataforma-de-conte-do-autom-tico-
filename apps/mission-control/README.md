# apps/mission-control — architectural placeholder

> **This is a reserved location, not an application.** There is no Mission
> Control code in this repository yet. This directory intentionally contains
> only this README so the monorepo has a stable home for it later. It is **not**
> an npm workspace (it has no `package.json`) and nothing builds or imports it.

## Responsibility

Mission Control is the operator surface for the Averro platform: workspace-level
observability, the approval inbox, agent-run monitoring, alerts/incidents, and
governance actions. It consumes domain **events** and **audit** records; it does
not own business data.

## Relationship to `averro-mission-control`

When the real Mission Control implementation becomes available, it will be
brought in here (as `apps/mission-control`) the same way `apps/web` was: moved
in without a rewrite, wired into the npm workspace, and validated by the same
quality gate. Until then, this placeholder must not be turned into a scaffold or
a fake app.

## Contract (future)

- **Consumes:** the generated event catalog (`generated/events-catalog.json`),
  agent manifests (`generated/agents.generated.json`), and the architecture
  registry (`generated/registry.json`) via `@averro/architecture-contracts`.
- **Reads:** `audit_entries` / operational alerts (see the AMA foundation and the
  Supabase gap analysis) — subject to workspace RLS.
- **APIs / events:** to be derived from the AMDL spec (`specifications/averro/`),
  never hand-duplicated.
- **Restrictions:** no cross-workspace access; destructive/agent actions require
  human approval; server-only secrets never reach the client.

## When implementing

1. Add the real app here and a `package.json`.
2. Add `apps/mission-control` to the root `workspaces` array.
3. Consume `@averro/architecture-contracts` for types and fingerprint checks.
4. Ensure `npm run verify` stays green.
