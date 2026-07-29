# Averro Repository — Baseline Audit

**Date:** 2026-07-29
**Repo:** `Pedrobrusi/plataforma-de-conte-do-autom-tico-`
**Base branch:** `main` · **Initial SHA:** `d0a5c7fc574ae0dfb684be63bfe623620ec99c14`
**Work branch:** `chore/averro-monorepo-foundation`
**Scope:** Read-only audit performed **before** any restructuring. No file was
moved and no behaviour changed while producing this document.

## 1. What the repository is

`averro-content-os` — a multi-tenant SaaS for creating, organizing, generating,
editing, scheduling and publishing social-media content. Single Next.js project
(front-end + back-end via Server Components / Server Actions / Route Handlers).

## 2. Stack (from `package.json`)

| Area | Value |
| --- | --- |
| Package manager | **npm** (`package-lock.json`, 316 KB) |
| Framework | **Next.js 16.2.11** (App Router) |
| UI | **React 19.2.4**, **Tailwind CSS v4** (`@tailwindcss/postcss`) |
| Language | **TypeScript 5** (strict), `moduleResolution: bundler`, alias `@/* → ./src/*` |
| Data | **Supabase** (`@supabase/ssr` 0.12, `@supabase/supabase-js` 2.110) |
| Validation | **Zod 4** + react-hook-form |
| Media | `ffmpeg-static` + `fluent-ffmpeg` (video), `tesseract.js` (OCR), `pdf-lib`, `jszip`, `next/og`/Satori (image) |
| Tests | **Vitest 4** (unit) + **Playwright 1.61** (e2e) |
| Lint | ESLint 9 + `eslint-config-next` |

Scripts: `dev`, `build`, `start`, `lint`, `typecheck` (`tsc --noEmit`),
`test:unit` (`vitest run`), `test:e2e` (`playwright test`).

## 3. Baseline quality gates (executed on `main` before any change)

| Gate | Command | Result |
| --- | --- | --- |
| Install | `npm ci` | 523 packages, OK |
| Typecheck | `npm run typecheck` | **PASS** |
| Lint | `npm run lint` | **PASS** |
| Unit tests | `npm run test:unit` | **PASS — 5 files, 22 tests** |
| Build | `npm run build` | **PASS — 31 routes** |
| E2E | `npm run test:e2e` | **not run** — requires a live Supabase project, secrets and a running server; excluded from the local gate by policy (no remote/destructive tests) |

This green baseline is the equivalence target after the monorepo move.

## 4. Architecture found (evidence by path)

- **Routing** (`src/app`): route groups `(auth)` (login/signup/forgot/reset),
  `auth/callback`, `onboarding`, and the authenticated shell `(app)` with
  `dashboard`, `planejador`, `calendario`, `biblioteca`, `conexoes`,
  `configuracoes/*`, `marca/*`, `posts/*`, `carrosseis/*` (dark/ia/pessoal/twitter),
  `reels/*`. API route handlers under `src/app/api/integrations/instagram/*`.
- **Multi-tenancy** (`ARCHITECTURE.md`, `supabase/migrations/0001_init.sql`):
  `workspaces` + `workspace_members` (owner/admin/editor/viewer), RLS on business
  tables, `private.is_workspace_member/_admin` SECURITY DEFINER helpers, atomic
  `handle_new_user` trigger provisioning profile/workspace/credits/subscription/calendar.
- **Auth**: Supabase Auth (email/password) via `@supabase/ssr`, session renewed in
  `src/middleware.ts`; implicit-hash email flow (free-tier constraint).
- **Data layer** (`src/lib/supabase/{client,server,types}.ts`): typed clients;
  `types.ts` (60 KB) is generated from the Supabase schema — **derived, regenerate
  after each migration**.
- **Design engine** (`src/lib/design/`): single `DesignDocument` model rendered by
  one `documentToJsx` for both editor preview and server PNG/PDF/ZIP export
  (`renderer.ts`), with real binary tests in `renderer.test.ts`.
- **Zero-external-cost providers** (`src/lib/providers/`): paid LLM providers are
  registered `enabled:false` / `expectedExternalCost:-1`; `costPreflight()` blocks
  `metered_paid_api` by code.
- **Instagram integration** (`src/lib/integrations/instagram/`, `src/lib/crypto/`):
  single-owner, fail-closed allowlist, AES-256-GCM token encryption at rest, signed
  OAuth-state cookie. Other networks are declared but not yet implemented.
- **Supabase** (`supabase/migrations/0001…0008`): init schema, function hardening,
  storage, FK indexes, unique constraints, media bucket, render-job result columns,
  workspace-delete FK fixes.

## 5. Functionality inventory

Implemented: authentication, workspaces/multi-tenancy, dashboard, planner
(`content_items` + `content_versions` versioning + autosave pattern), content
library, carousel editors (dark/personal/twitter), the `DesignDocument` model &
templates, server rendering (PNG/JPEG/PDF/ZIP), Supabase storage uploads, render
jobs, and the real Instagram single-owner connection wizard. Many product surfaces
(`posts/*`, `reels/*`, `marca/*`, other social networks) render `ComingSoon`
placeholders by design (documented in `IMPLEMENTATION_STATUS.md`).

## 6. Risks, debts and inconsistencies

| # | Severity | Item | Evidence | Note / recommendation |
| --- | --- | --- | --- | --- |
| R1 | Low | Root `README.md` is the default create-next-app template | `README.md` | Replace with a real monorepo README (this task). |
| R2 | Low | Supabase project ref appears in prose | `ARCHITECTURE.md` | Project refs are semi-public identifiers, not secrets; left unchanged. No keys are committed. |
| R3 | Info | Large generated file committed | `src/lib/supabase/types.ts` (60 KB) | Legitimately versioned (consumed at build); flagged in the generated-artifacts policy. |
| R4 | Info | E2E needs a live environment | `playwright.config.ts` loads `.env.local`, hits Supabase | Keep e2e out of the offline quality gate. |
| R5 | Info | No CI present | no `.github/` | Add `quality.yml` (this task). |
| R6 | Medium | Deploy assumes repo root = app root | Vercel/Next defaults | After moving to `apps/web`, Vercel **Root Directory** must be set to `apps/web` (human action, documented; not changed here). |

## 7. Migration recommendation

- **Keep npm** (native `workspaces`); migrating to pnpm now adds risk (native deps:
  `ffmpeg-static`, `tesseract.js`) without benefit at this stage. Documented decision.
- **Move the app to `apps/web`** — the `@/*` alias and all tool configs
  (`vitest`, `playwright`, `tsconfig`, `postcss`, `eslint`) are path-relative and
  self-contained, so the move is mechanical and immediately re-validated by the
  same gates. This is safe to do in one phase.
- **Keep `supabase/` at repo root** — app code reaches Supabase via env-based
  clients, never via the migrations folder path, so the folder location is free.
- **Do not** apply migrations, touch Supabase/Vercel, or change business logic.

## 8. Critical entry points

- `src/middleware.ts` (session + route protection)
- `src/lib/workspace.ts` (`getWorkspaceContext`)
- `src/app/(app)/layout.tsx` (authenticated shell)
- `src/lib/design/renderer.ts` (export pipeline)
- `src/lib/integrations/instagram/*` (only live external integration)
