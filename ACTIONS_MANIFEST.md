# Manifesto de Ações

Toda ação de interface (botão, link, submit) do produto, com o handler real, o
endpoint/server action, o serviço, a tabela afetada, o teste correspondente e o
status atual. Nenhum botão existe fora deste inventário.

Status possíveis: `completed`, `partial`, `blocked`, `not_started`.

## Autenticação

| Página | Elemento | Handler | Backend | Tabela | Teste | Status |
|---|---|---|---|---|---|---|
| `/signup` | Botão "Criar conta" | `signUpAction` | `supabase.auth.signUp` + trigger `handle_new_user` | `auth.users`, `user_profiles`, `workspaces`, `workspace_members`, `credit_wallets`, `credit_transactions`, `subscriptions`, `calendars` | `e2e/auth-onboarding.spec.ts` | completed |
| `/login` | Botão "Entrar" | `loginAction` | `supabase.auth.signInWithPassword` | `auth.users` | `e2e/auth-onboarding.spec.ts` | completed |
| Header | Botão "Sair" | `logoutAction` | `supabase.auth.signOut` | — | `e2e/auth-onboarding.spec.ts` | completed |
| `/forgot-password` | Botão "Enviar link" | `forgotPasswordAction` | `supabase.auth.resetPasswordForEmail` | — | manual (depende de e-mail real) | completed |
| `/reset-password` | Botão "Atualizar senha" | client `handleSubmit` → `supabase.auth.updateUser` | Supabase Auth | `auth.users` | manual (depende de link de e-mail) | completed |
| `/auth/callback` | (automático) | client `getSession()` | Supabase Auth (detecção de hash) | — | manual | completed |

## Onboarding

| Página | Elemento | Handler | Backend | Tabela | Teste | Status |
|---|---|---|---|---|---|---|
| `/onboarding` | Botão "Concluir e ir para o Dashboard" | `completeOnboardingAction` | update direto via `@supabase/ssr` | `workspaces`, `niche_profiles`, `user_profiles` | `e2e/auth-onboarding.spec.ts` | completed |

## Shell / Header

| Página | Elemento | Handler | Backend | Tabela | Teste | Status |
|---|---|---|---|---|---|---|
| Header | Dropdown "Criar" | links diretos | — (navegação) | — | manual | completed |
| Header | Indicador de créditos | link para `/configuracoes/creditos` | leitura `credit_wallets` | `credit_wallets` | manual | completed |
| Header | Alternância de workspace | `switchWorkspaceAction` | update `user_profiles.active_workspace_id` | `user_profiles`, `workspace_members` | manual | completed |
| Header | Menu de perfil → Configurações | link | — | — | manual | completed |
| Sidebar | Todos os itens | `next/link` | rota real protegida por middleware | — | manual | completed (rotas "planned" mostram `ComingSoon`, não fingem funcionalidade) |

## Configurações

| Página | Elemento | Handler | Backend | Tabela | Teste | Status |
|---|---|---|---|---|---|---|
| `/configuracoes/perfil` | Botão "Alterar foto" | `AvatarUploader.handleFileChange` | Supabase Storage (`avatars` bucket) + update `user_profiles` | `storage.objects`, `user_profiles` | manual | completed |
| `/configuracoes/perfil` | Botão "Salvar alterações" | `updateProfileAction` | update `user_profiles` | `user_profiles` | manual | completed |
| `/configuracoes/creditos` | (leitura) | Server Component | select `credit_wallets`, `credit_transactions` | `credit_wallets`, `credit_transactions` | manual | completed |

## Dashboard

| Página | Elemento | Handler | Backend | Tabela | Teste | Status |
|---|---|---|---|---|---|---|
| `/dashboard` | Cards de resumo | Server Component `SummaryCards` | select agregado por workspace | `content_items`, `calendar_events`, `social_connections` | manual | completed |
| `/dashboard` | Atalhos "Criar agora" | `next/link` | navegação para geradores | — | manual | completed (destinos ainda são `ComingSoon`, fases 3-7) |
| `/dashboard` | Conteúdos recentes / Próximas publicações | Server Components com `Suspense` | select `content_items` / `calendar_events` | idem | manual | completed |

## Planejador

| Página | Elemento | Handler | Backend | Tabela | Teste | Status |
|---|---|---|---|---|---|---|
| `/planejador` | Botão "Salvar configurações" | `saveNicheProfileAction` | snapshot da versão anterior + update/insert | `niche_profiles`, `niche_profile_versions` | `e2e/planejador.spec.ts` | completed |
| `/planejador` | Botão "Restaurar" (histórico) | `restoreNicheProfileVersionAction` | snapshot do estado atual + restaura snapshot antigo | `niche_profiles`, `niche_profile_versions` | `e2e/planejador.spec.ts` | completed |
| `/planejador` | Botão "Testar geração" | `testGenerationAction` | `costPreflight` + gerador local determinístico | `ai_generation_runs`, `ai_generation_outputs` | `e2e/planejador.spec.ts` | completed |

## Conexões / Instagram (single-owner)

| Página | Elemento | Handler | Backend | Tabela | Teste | Status |
|---|---|---|---|---|---|---|
| `/conexoes` | Card "Instagram" | `next/link` | leitura `social_connections` | `social_connections` | `e2e/instagram-setup.spec.ts` | completed |
| `/configuracoes/instagram-setup` | Botão "Conectar meu Instagram" | link → `GET /api/integrations/instagram/connect` | gera state assinado, redireciona para `instagram.com/oauth/authorize` (ou para `status=blocked_official_auth_unavailable` se `META_APP_ID` ausente) | — | `e2e/instagram-setup.spec.ts` (cobre o caminho bloqueado) | **blocked_official_auth_unavailable** até `META_APP_ID`/`META_APP_SECRET` serem configurados |
| (callback) | — | `GET /api/integrations/instagram/callback` | valida state, troca código, busca perfil, checa allowlist, criptografa e grava token | `social_connections`, `audit_logs` | requer Meta App real (manual) | blocked_official_auth_unavailable |
| `/configuracoes/instagram-setup` | Botão "Verificar conexão" | `testInstagramConnectionAction` | chama `GET /me` na Graph API com o token descriptografado | `social_connections`, `audit_logs` | requer conexão real (manual) | blocked_official_auth_unavailable |
| `/configuracoes/instagram-setup` | Botão "Publicar teste" | `publishTestPostAction` | renderiza imagem via `next/og`, sobe para Storage, cria container, publica, busca permalink | `social_connections`, `audit_logs`, Storage `media` | requer conexão real (manual) | blocked_official_auth_unavailable |
| `/configuracoes/instagram-setup` | Botão "Desconectar" | `disconnectInstagramAction` | limpa tokens, marca `disconnected` | `social_connections`, `audit_logs` | requer conexão real (manual) | blocked_official_auth_unavailable |
| `/configuracoes/instagram-setup` | Botão "Copiar redirect URI" | `navigator.clipboard.writeText` | — | — | manual | completed |
| `/configuracoes/instagram-setup` | Link "Abrir Meta for Developers" | link externo | — | — | manual | completed |

Toda a integração está **implementada e testada no que depende só do código
desta aplicação** (allowlist fail-closed, criptografia, CSRF do OAuth,
proteção de rota, redirecionamento honesto quando faltam credenciais). O que
falta é exclusivamente externo: o proprietário criar o Meta App e me passar
`META_APP_ID`/`META_APP_SECRET` — só então os itens marcados
`blocked_official_auth_unavailable` acima podem ser testados de ponta a ponta
e promovidos a `completed`.

## Módulos ainda não implementados (fases 2-7)

Todas as rotas abaixo existem, estão protegidas por autenticação e mostram um
estado `ComingSoon` explícito citando a fase — **não simulam sucesso**. Handlers,
backend, processamento e testes desses módulos estão em `not_started`.

| Módulo | Rota | Fase | Status |
|---|---|---|---|
| Calendário | `/calendario` | 2 | not_started |
| Biblioteca | `/biblioteca` | 2 | not_started |
| Post Twitter | `/posts/twitter` | 3 | not_started |
| Frase de Efeito | `/posts/frase-de-efeito` | 3 | not_started |
| Post YouTube | `/posts/youtube` | 3 | not_started (infra OK: FFmpeg local via `ffmpeg-static` já instalado) |
| Post GPT | `/posts/gpt` | 3 | not_started (infra OK: FFmpeg local já instalado) |
| Google Post | `/posts/google` | 3 | not_started (infra OK: FFmpeg local já instalado) |
| Carrossel IA | `/carrosseis/ia` | 4 | not_started (OCR local via `tesseract.js` já instalado) |
| Carrossel Twitter | `/carrosseis/twitter` | 5 | not_started |
| Carrossel Pessoal | `/carrosseis/pessoal` | 5 | not_started |
| Carrossel Dark | `/carrosseis/dark` | 5 | not_started |
| Criador de Reels | `/reels/criador` | 5 | not_started (infra OK: FFmpeg local; voz via `say` do macOS pendente de revisão de licença para uso multi-tenant) |
| Roteiro Reels | `/reels/roteiro` | 5 | not_started |
| Conexões — Instagram | `/conexoes`, `/configuracoes/instagram-setup` | 6 | **partial** — ver seção dedicada acima (código completo, falta só `META_APP_ID`/`META_APP_SECRET` do proprietário) |
| Conexões — Facebook/YouTube/Google Business | `/conexoes` | 6 | not_started |
| Bio Magnética | `/marca/bio` | 7 | not_started |
| Criativos | `/marca/criativos` | 7 | not_started |
