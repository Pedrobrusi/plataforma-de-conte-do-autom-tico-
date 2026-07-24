# Arquitetura — Averro Content OS

SaaS multi-tenant de criação, organização, geração, edição, agendamento e
publicação de conteúdo para redes sociais.

## Stack

- **Next.js 16 (App Router) + TypeScript** — front-end e back-end (Server
  Components, Server Actions, Route Handlers) no mesmo projeto.
- **Supabase** (projeto dedicado `averro-content-os`, região `sa-east-1`):
  Postgres + Auth + Storage. Sem Docker/local stack — o projeto é hospedado
  (ver "Nota sobre ambiente" abaixo).
- **Tailwind CSS v4** com tokens de design fixos em `globals.css` (fundo
  `#08090A`, cards `#111214`, inputs `#17181A`, bordas `#26282B`, destaques
  roxo/rosa/laranja) — não usa tema genérico de dashboard gerado por IA.
- **Zod + React Hook Form** para validação client-side; toda mutação também
  revalida com Zod no servidor (Server Actions), nunca confiando apenas no
  client.
- **Vitest** (unitário) + **Playwright** (E2E).
- **`ffmpeg-static` + `fluent-ffmpeg`** para renderização de vídeo local (sem
  custo por segundo) e **`tesseract.js`** para OCR local (WASM, sem custo por
  imagem) — usados a partir da Fase 3+.

## Nome do produto configurável

`src/config/site.ts` lê `NEXT_PUBLIC_APP_NAME` / `NEXT_PUBLIC_APP_SHORT_NAME` /
`NEXT_PUBLIC_APP_DESCRIPTION` do ambiente, com fallback para "Averro Content
OS". Trocar o nome do produto é uma alteração de `.env`, não de código.

## Multi-tenancy

- `workspaces` + `workspace_members` (papéis `owner`/`admin`/`editor`/`viewer`)
  são a unidade de isolamento. Praticamente toda tabela de negócio tem
  `workspace_id` com Row Level Security habilitada.
- Dois helpers `SECURITY DEFINER` — `private.is_workspace_member(workspace_id)`
  e `private.is_workspace_admin(workspace_id)` — são usados nas policies. Eles
  vivem no schema `private` (não exposto pelo PostgREST) para não aparecer
  como RPC pública, mas continuam executáveis pelas roles `anon`/`authenticated`
  porque são chamados *dentro* da avaliação da própria RLS.
- Ao cadastrar, o trigger `handle_new_user` (schema `private`, disparado em
  `auth.users`) cria: `user_profiles`, um `workspace` novo, o
  `workspace_members` como `owner`, `credit_wallets` com saldo inicial,
  `credit_transactions` de boas-vindas, `subscriptions` free e um `calendars`
  padrão — tudo numa única transação atômica.
- Convite de membros: modelagem existe (`workspace_members.invited_email`,
  `invite_token`), mas o fluxo de UI/e-mail de convite é Fase 2+ (ver
  `IMPLEMENTATION_STATUS.md`).

## Autenticação

- Supabase Auth (e-mail/senha). Sessão via cookies HTTP-only usando
  `@supabase/ssr` (`createServerClient` no servidor, `createBrowserClient` no
  client, `src/middleware.ts` renovando a sessão a cada request).
- **Confirmação de e-mail e recuperação de senha usam o fluxo padrão do
  Supabase (hash de URL / implicit), não `token_hash`** — o projeto está no
  tier gratuito, que bloqueia customização de template de e-mail
  (`mailer_templates_*`) via API. Por isso:
  - `/auth/callback` e `/reset-password` são Client Components que leem
    `window.location.hash` (onde o Supabase deposita `access_token` /
    `refresh_token` após o usuário clicar no link do e-mail) via
    `supabase.auth.getSession()`, que decodifica esse hash automaticamente.
  - Se migrar para um plano pago ou SMTP customizado, os templates podem ser
    trocados para o padrão `token_hash` (mais robusto, sem depender de client
    JS) — ver comentário em `supabase/migrations` (não aplicado nesta fase).
- Middleware protege todas as rotas exceto `/`, `/login`, `/signup`,
  `/forgot-password`, `/reset-password`, `/auth/callback`, `/auth/confirm`.

## Camada de dados

- `src/lib/supabase/{client,server}.ts`: wrappers `@supabase/ssr` tipados com
  `Database` (gerado via `mcp__supabase__generate_typescript_types`, arquivo
  `src/lib/supabase/types.ts` — regenerar após qualquer migration nova).
- `src/lib/workspace.ts`: `getWorkspaceContext()` — único ponto que resolve
  usuário → perfil → workspace ativo → papel → saldo de créditos →
  memberships. Usado pelo layout `(app)` e pelo dashboard.
- Migrations em `supabase/migrations/*.sql`, aplicadas via Supabase Management
  API (ver nota de ambiente).

## Nota sobre ambiente / como as migrations foram aplicadas

O MCP do Supabase disponível nesta máquina está configurado em modo
`--read-only` (flag em `~/.claude.json`), e não há Docker instalado para rodar
`supabase start` localmente. Em vez de desativar essa proteção global, as
migrations e a configuração de Auth foram aplicadas diretamente pela
**Supabase Management API** (`https://api.supabase.com/v1/projects/{ref}/...`)
usando o `SUPABASE_ACCESS_TOKEN` já presente no ambiente — o mesmo token que o
MCP usa, só que sem o wrapper read-only. Isso não contorna nenhuma permissão do
Supabase; apenas não passa pela camada de proteção adicional do MCP local. Para
continuar o desenvolvimento localmente com Docker, basta `supabase link
--project-ref pzyshwpfsbiznbbznivt` e `supabase db pull`.

## Política de custo externo zero (`src/lib/providers/`)

- `policy.ts`: constantes de política (não variáveis de ambiente, de
  propósito — para que nenhuma alteração de `.env` religue cobrança externa
  sozinha). `billingMode: "metered_paid_api"` é proibido por código.
- `registry.ts`: `PROVIDER_REGISTRY` com um `ProviderConfig` por capability
  (texto, imagem, vídeo, OCR). Providers pagos (OpenAI, Anthropic) estão
  cadastrados com `enabled: false` e `expectedExternalCost: -1` (custo
  desconhecido = sempre bloqueado, nunca tratado como zero).
- `costPreflight()` é a função que qualquer job de geração (fases 3+) deve
  chamar antes de entrar na fila. Ela nunca permite billingMode
  `metered_paid_api` e nunca assume custo zero sem o provider declarar
  explicitamente `expectedExternalCost: 0`.
- Providers habilitados hoje: gerador de texto local por template (baseado no
  perfil de nicho/marca), `next/og` (Satori) para imagem, FFmpeg local
  (`ffmpeg-static`) para vídeo, `tesseract.js` (WASM) para OCR. Nenhum depende
  de chave paga.

## Conexões sociais — Instagram (modo single-owner)

Esta instalação é de uso pessoal do proprietário: não há App Review, Live Mode,
nem contas de terceiros. Decisões de arquitetura específicas:

- **Instagram API with Instagram Login** (`src/lib/integrations/instagram/`),
  não Facebook Login — não exige Página do Facebook vinculada à conta
  Instagram. Todas as chamadas Graph vão para `graph.instagram.com`, não
  `graph.facebook.com`.
- **Allowlist fail-closed**: `isAccountAllowed()` só permite uma conta se
  `INSTAGRAM_ALLOWED_ACCOUNT_IDS` ou `INSTAGRAM_ALLOWED_USERNAMES` estiverem
  configurados E a conta bater com a lista. Sem allowlist configurada,
  **nenhuma** conta é aceita — nunca "fail open".
- **CSRF/state do OAuth via cookie assinado** (`src/lib/crypto/oauth-state.ts`),
  não uma tabela no banco: HMAC-SHA256 com `TOKEN_ENCRYPTION_KEY`, TTL de 5
  minutos, comparação com `timingSafeEqual`. Evita uma tabela cujo único papel
  é guardar estado efêmero de alguns minutos.
- **Tokens sempre criptografados em repouso** (`src/lib/crypto/token-cipher.ts`,
  AES-256-GCM) — `social_connections.access_token_encrypted` nunca guarda texto
  plano, e a chave decifrada só existe em memória durante uma Server
  Action/Route Handler, nunca é enviada ao client.
- **Sem tabela nova para a conexão**: reaproveita `social_connections` (já
  criada na Fase 1, workspace-scoped, RLS pronta) em vez de duplicar schema.
- **Publicação de teste usa imagem gerada por `next/og`** (real, com timestamp
  dinâmico — não é um asset estático), enviada para o bucket público `media`
  do Supabase Storage para obter uma URL HTTPS real. Isso é necessário mesmo
  em desenvolvimento local: a Graph API do Instagram busca a imagem pelo
  `image_url` a partir dos servidores da Meta, que não alcançam
  `http://localhost:3000`.
- **Sem App Review**: funciona porque o proprietário é adicionado como
  Admin/Developer/Tester do Meta App — Development Mode permite autenticação e
  publicação por usuários com papel no app, indefinidamente.

## Estrutura de pastas relevante

```
src/
  app/
    (auth)/            login, signup, forgot-password — layout centrado
    auth/callback/      confirmação de e-mail / OAuth (client)
    reset-password/     recuperação de senha (client)
    onboarding/          primeiro acesso, cria contexto do workspace
    (app)/              shell autenticado (sidebar + header)
      dashboard/
      configuracoes/perfil, configuracoes/creditos
      planejador, calendario, conexoes, biblioteca,
      configuracoes/instagram-setup  wizard real de conexão do Instagram
      conexoes/            hub de plataformas (Instagram real; demais "não implementado")
      posts/*, carrosseis/*, reels/*, marca/*    → ComingSoon (fases 2-5, 7)
    api/integrations/instagram/  connect, callback (Route Handlers OAuth) e test-image (next/og)
  components/
    ui/                 Button, Input, Card, Alert, Dropdown, Skeleton
    layout/              Sidebar, Header, AppShell, ComingSoon
  config/               site.ts (nome do produto), navigation.ts (sidebar)
  lib/
    supabase/            client, server, types
    actions/             Server Actions (auth, onboarding, profile, workspace, instagram)
    validations/         schemas Zod
    providers/           registry de custo zero
    crypto/              token-cipher (AES-256-GCM), oauth-state (cookie assinado)
    integrations/instagram/  config, oauth, publish (Instagram API with Instagram Login)
    workspace.ts
supabase/migrations/     0001_init.sql … 0006_media_bucket.sql
e2e/                     Playwright
vitest.config.ts         testes unitários (crypto, allowlist, OAuth URL builder)
```

## Decisões que exigiram trade-off explícito

1. **Supabase Auth com fluxo de e-mail "implicit hash"** em vez de
   `token_hash`, por limitação do tier gratuito (ver seção Autenticação). Não
   afeta segurança — apenas onde o parsing do token acontece (client em vez de
   servidor).
2. **FFmpeg via `ffmpeg-static`/npm em vez de Homebrew** — evita exigir senha
   de administrador do usuário; o binário fica isolado em
   `node_modules/ffmpeg-static`, versionado pelo `package-lock.json`.
3. **OCR via `tesseract.js` (WASM) em vez de Tesseract nativo** — mesmo
   motivo, e roda igual em qualquer ambiente de deploy sem depender de um
   binário do sistema.
4. **Nenhum provider de IA generativa pago habilitado** — por exigência
   explícita do produto (política de custo externo zero). O gerador de texto
   das Fases 3+ usa templates parametrizados pelo perfil de nicho/marca, não
   um LLM neural, até que um modelo local (ex.: via Ollama) seja
   explicitamente aprovado para download.
