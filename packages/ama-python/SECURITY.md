# Security Policy

## Reporting a vulnerability

If you discover a security issue in AMA/AMDL, please report it privately to the
maintainers rather than opening a public issue. Include a description, the
affected version/commit, and reproduction steps. You will receive an
acknowledgement and a remediation plan.

Do **not** include real secrets, tokens or customer data in a report.

## What AMA/AMDL guarantees at compile time

The compiler is designed so a specification can never *silently* produce an
unsafe change. The reusable scanner in `src/amdl/security.py` runs as part of
the `governance` generator and the test suite, and flags:

- destructive SQL: `DROP TABLE`, `DROP SCHEMA`, `DROP COLUMN`, `TRUNCATE`,
  unscoped `DELETE`;
- weakening tenant isolation: disabling or unforcing row-level security;
- unrestricted access: `GRANT ... TO public`, RLS policies of `USING (true)`;
- embedded secrets: JWT-shaped tokens, `sk-` API keys, inline
  `service_role`/`password`/`secret` values.

Any destructive operation is classified by risk and marked
`requires_human_approval`. The generated Supabase migration is **additive-only**
(`CREATE ... IF NOT EXISTS`) and is never applied automatically — it is
reviewable scaffolding. The result is written to
`generated/averro/governance/governance-report.{json,md}`.

## Secrets

- No secrets are committed. `.env` is git-ignored; `.env.example` holds only
  blank placeholders.
- The service-role key is server-side only and must never appear in a frontend
  bundle or in generated artifacts, prompts, events or logs.
- Fields whose names look like secrets must be marked `sensitive: true`; the
  validator warns (`SEC001`) otherwise.

## Runtime and modeling governance

Tenant isolation, agent boundaries, authorized web-evidence crawling,
reference-modeling originality rules and audit/incident response are documented
in [`docs/SECURITY-GOVERNANCE.md`](docs/SECURITY-GOVERNANCE.md).

## Scope of this repository

This repository is the meta-architecture and language foundation. It does not
apply migrations, mutate any Supabase project, or perform external writes. Those
actions are governed by the downstream runtime and always require human
approval.
