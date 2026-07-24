# Implementation Status — Averro Content OS

Última atualização: 2026-07-24.

Ver também `ACTIONS_MANIFEST.md` (inventário de toda ação de UI) e
`FUNCTIONAL_PARITY.md` (matriz de paridade por feature). Este arquivo é o
resumo executivo por fase.

## Fase 1 — Auditoria, auth, workspace, sidebar, dashboard, banco, RLS

**Status: completed** (evidências abaixo).

| Item | Status | Evidência |
|---|---|---|
| Auditoria do repositório/pasta local | done | repo e pasta estavam vazios → greenfield com Next.js 16 + TS + Tailwind |
| Projeto Supabase dedicado | done | `averro-content-os` / ref `pzyshwpfsbiznbbznivt` / `sa-east-1` |
| Schema completo (32 tabelas da seção 17) + RLS + índices + FKs | done | `supabase/migrations/0001_init.sql`, `0002_harden_functions.sql`, `0003_storage.sql`; `0` security advisories (`get_advisors`) |
| Cadastro / login / logout / recuperação de senha / confirmação de e-mail | done | `src/app/(auth)/*`, `src/app/auth/callback`, `src/app/reset-password`, `src/lib/actions/auth.ts` |
| Sessão persistente + proteção de rotas | done | `src/middleware.ts` |
| Onboarding + criação automática de workspace | done | trigger `handle_new_user` + `/onboarding` |
| Papéis (owner/admin/editor/viewer) + isolamento por workspace | done | RLS em todas as tabelas workspace-scoped |
| Sidebar completa (todas as seções do briefing) | done | `src/config/navigation.ts`, `src/components/layout/sidebar.tsx` — itens da Fase 1 levam a telas reais, os demais levam a `ComingSoon` citando a fase, nunca a "#" |
| Botão "Criar", menu de perfil, indicador de créditos, alternância de workspace | done | `src/components/layout/header.tsx` |
| Dashboard com dados reais (contadores, recentes, próximas publicações, estado vazio, skeleton) | done | `src/app/(app)/dashboard/page.tsx` |
| Configurações de perfil (nome, bio, foto) | done | `src/app/(app)/configuracoes/perfil` |
| Registro de providers com política de custo externo zero | done | `src/lib/providers/{types,policy,registry}.ts` |
| FFmpeg local (sem Homebrew/sudo) | done | `ffmpeg-static` — `ffmpeg version 6.0`, build com libx264/libx265/libvpx |
| OCR local (sem Homebrew/sudo) | done | `tesseract.js` (WASM) |
| Testes E2E do fluxo de cadastro | done | `e2e/auth-onboarding.spec.ts` |
| Lint + typecheck + build | done | ver seção "Verificação" abaixo |

### Decisões / limitações conhecidas da Fase 1

- **E-mail de confirmação/recuperação usa o fluxo padrão do Supabase** (hash de
  URL), não `token_hash`, porque customização de template de e-mail exige
  plano pago ou SMTP customizado no Supabase. Funciona, mas o parsing do token
  acontece no client (`/auth/callback`, `/reset-password`), não no servidor.
- **Envio de e-mail usa o serviço de e-mail embutido do Supabase** (tier
  gratuito) — limite de taxa baixo. Para produção, configurar SMTP customizado
  em Project Settings → Auth.
- **Convite de membros**: schema pronto (`workspace_members.invited_email`,
  `invite_token`), UI/e-mail de convite ainda não implementados (Fase 2).
- **Migrations foram aplicadas via Supabase Management API**, não via
  `supabase db push`/MCP, porque o MCP local está em modo `--read-only` e não
  há Docker instalado. Ver `ARCHITECTURE.md` → "Nota sobre ambiente".

## Fase 2 — Planejador, Biblioteca, Calendário, créditos

**Status: not_started.** Schema já existe (`niche_profiles`,
`niche_profile_versions`, `brand_profiles`, `content_items` com `folder_id`,
`tags`, `calendars`, `calendar_events`). Sistema de créditos (carteira +
transações) já funciona desde a Fase 1 (criado no signup, visível em
`/configuracoes/creditos`) — falta apenas *debitar* créditos quando houver
geração de IA real (Fase 3+).

## Fase 3 — Post Twitter, Frase de Efeito, Post YouTube, Post GPT, Google Post

**Status: not_started.** Infra de renderização (`next/og` para imagem,
FFmpeg local para vídeo) já disponível. Bloqueio real: nenhum.

## Fase 4 — Carrossel IA (importação de fonte, OCR, transcrição, editor de slides, exportação)

**Status: not_started.** `tesseract.js` (OCR) disponível. Transcrição de
áudio/vídeo ainda não tem provider local definido — avaliar `whisper.cpp` via
binário ou WASM antes de habilitar (requer download de modelo; não fazer sem
aprovação explícita, conforme política de "não instalar silenciosamente
modelos grandes").

## Fase 5 — Carrossel Twitter/Pessoal/Dark, Roteiro Reels, Criador de Reels

**Status: not_started.** Criador de Reels depende de: (a) FFmpeg — disponível;
(b) TTS — `say` (macOS, vozes pt-BR reais como "Luciana") é tecnicamente
funcional e sem custo, mas **pendente de revisão da licença da Apple para uso
comercial multi-tenant** antes de habilitar no registry; (c) avatar — nenhum
provider local de avatar identificado ainda, ficará como `manual_handoff`
(upload de foto própria) até decisão.

## Fase 6 — Conexões, publicação, agendamento, filas, retries, logs

**Status: not_started / blocked_official_auth_unavailable por padrão.**
Nenhuma rede social (Instagram, Facebook, X, YouTube, Google Business) tem um
app OAuth cadastrado ainda — isso exige o proprietário criar o app em cada
painel de desenvolvedores (Meta for Developers, X Developer Portal, Google
Cloud Console) e preencher `*_OAUTH_CLIENT_ID`/`SECRET` em `.env`. A
arquitetura de OAuth (Authorization Code + PKCE, tokens criptografados,
`provider_connections`) será implementada de qualquer forma; o *status* de
cada conexão só passa de `blocked_official_auth_unavailable` para
`connected` depois que essas credenciais existirem e o fluxo real for testado.

## Fase 7 — Bio Magnética, Criativos, métricas, acessibilidade, deploy

**Status: not_started.**

## Notas de UX do vídeo de referência (para orientar as fases 2-7)

Extraídas de frames do vídeo fornecido (análise estrutural apenas — nenhum
ativo visual, texto ou código do produto de referência foi copiado):

- **Dashboard**: já bate com o que implementamos (saudação, cards de resumo,
  grade "Criar rápido", "Em andamento" e "Criações recentes"). O card de
  conexão expirada usa borda vermelha — já replicamos esse padrão de alerta.
- **Planejador**: mais simples do que o texto original sugeria — é um único
  formulário curto (nicho/segmento, público-alvo, tom de voz, oferta/produto
  opcional, sobre você/marca opcional) com botão "Salvar e continuar". Não
  precisa ser um formulário de 15+ campos na Fase 2; começar simples e
  expandir depois é mais fiel à referência.
- **Frase de Efeito / Post YouTube / Google Post**: layout de duas colunas
  confirmado — configuração à esquerda, preview ao vivo à direita, export em
  1170×1560 (imagem) ou 1080×1920 (vídeo). Google Post explicitamente diz "o
  vídeo é processado localmente no navegador e não é enviado ao servidor" —
  interessante para decidir client-side vs server-side rendering na Fase 3.
- **Carrossel IA**: import por Link (YouTube/Instagram/TikTok/Artigo/PDF/Áudio/
  Vídeo) ou Arquivo, com botão "Importar" que preenche automaticamente
  título/tema. Galeria de "Template visual" com thumbnails (nomes como
  Cinematic, Twitter/X, Bold Typography, Dark Brutalist, Documentary) — vale
  adotar nomes de template equivalentes e originais na Fase 4.
- **Roteiro Reels**: não é um formulário — é uma interface de **chat**
  ("Nova conversa", histórico de conversas na esquerda, input de mensagem
  "Enter envia, Shift+Enter quebra linha"). Isso muda o desenho da Fase 5:
  Roteiro Reels deve ser modelado como conversa, não como form de campos.

## Como validar o que já existe

```bash
cd "the social media machine"
npm install
npm run lint
npm run typecheck
npm run build
npm run test:e2e   # requer `npm run dev` rodando em outra aba, ou usa webServer do Playwright
```
