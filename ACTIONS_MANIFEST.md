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

## Módulos ainda não implementados (fases 2-7)

Todas as rotas abaixo existem, estão protegidas por autenticação e mostram um
estado `ComingSoon` explícito citando a fase — **não simulam sucesso**. Handlers,
backend, processamento e testes desses módulos estão em `not_started`.

| Módulo | Rota | Fase | Status |
|---|---|---|---|
| Planejador | `/planejador` | 2 | not_started |
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
| Conexões | `/conexoes` | 6 | not_started (bloqueado: nenhum app OAuth de terceiros cadastrado ainda) |
| Bio Magnética | `/marca/bio` | 7 | not_started |
| Criativos | `/marca/criativos` | 7 | not_started |
