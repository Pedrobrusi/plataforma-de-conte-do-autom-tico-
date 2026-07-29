# Domain Boundaries

The AMDL spec (`specifications/averro/`) defines the platform's domains. This
stage integrates the model; it does **not** implement the future domains.

## Domains in the spec

| Domain | Status in `apps/web` |
| --- | --- |
| Platform Foundation (workspaces, approvals, audit, RBAC) | Partially implemented (workspaces, auth, audit) |
| Identity & Workspace | Implemented (auth, membership, roles) |
| Knowledge Engine | Not implemented (future) |
| AI Runtime | Provider registry exists (`apps/web/src/lib/providers`); full runtime future |
| Agent Runtime | Not implemented (future) |
| Automation Engine | Not implemented (future) |
| Mission Control | Placeholder only (`apps/mission-control`) |
| Offer Intelligence | Not implemented (future) |
| Offer Modeling | Not implemented (future) |
| Content Studio | Implemented (design engine, carousels, rendering, library) |
| Analytics & Learning | Not implemented (future) |

## Ownership rules

- **The spec owns contracts.** Entities, events, policies, roles, APIs and agent
  manifests are derived from `specifications/averro`, never hand-duplicated in TS.
- **The app owns runtime behavior.** Business logic, UI and data access live in
  `apps/web`; the app consumes contracts but is not generated.
- **Generated code is read-only.** See the generated-artifacts policy.

## Cross-cutting invariants (from the spec's governance)

- Workspace isolation: tenant data is workspace-scoped with RLS.
- Human approval for external writes and destructive/agent actions.
- Zero external paid-provider cost by default (enforced in `apps/web`).
- Secrets are server-only; never in `NEXT_PUBLIC_*` or the client bundle.

## Boundary enforcement

- `packages/architecture-contracts` is the only sanctioned import surface for
  generated types.
- `npm run ama:drift` prevents the spec and the contracts from diverging.
- The Supabase gap analysis governs how (and whether) proposed tables ever reach
  the database.
