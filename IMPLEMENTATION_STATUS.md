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
- **Proteção contra senhas vazadas (HaveIBeenPwned) não habilitada**: o
  Supabase retorna `402 Payment Required` ao tentar ativar
  `password_hibp_enabled` — é um recurso de plano pago. Mantido desabilitado
  para preservar o projeto 100% gratuito; reavaliar se o projeto for
  upgradeado. Todos os outros advisories de segurança do banco estão limpos
  (`get_advisors` → 0 findings restantes).
- **Convite de membros**: schema pronto (`workspace_members.invited_email`,
  `invite_token`), UI/e-mail de convite ainda não implementados (Fase 2).
- **Migrations foram aplicadas via Supabase Management API**, não via
  `supabase db push`/MCP, porque o MCP local está em modo `--read-only` e não
  há Docker instalado. Ver `ARCHITECTURE.md` → "Nota sobre ambiente".

## Fase 2 — Planejador, Biblioteca, Calendário, créditos

**Status: Planejador completed · Biblioteca/Calendário not_started.**

Planejador (`/planejador`) é vertical slice completo:
- Formulário com os 16 campos do perfil de nicho, salvamento cria uma nova
  linha de versão (`niche_profiles.version` incrementa, snapshot da versão
  anterior vai para `niche_profile_versions`) — nada é sobrescrito ou perdido.
- Dados persistem de fato: recarregar a página mostra os valores salvos.
- "Restaurar" traz uma versão antiga de volta (e cria uma nova versão do
  estado atual antes de restaurar, para a restauração também ser reversível).
- "Testar geração" usa o provider `local-template-text` (registry de custo
  zero) via `costPreflight()`, grava `ai_generation_runs` +
  `ai_generation_outputs` — primeiro consumidor real dessas tabelas.
- Cobertura: `e2e/planejador.spec.ts` (salvar → recarregar → testar geração →
  nova versão → restaurar, tudo contra o Supabase real).

Sistema de créditos (carteira + transações) já funciona desde a Fase 1
(criado no signup, visível em `/configuracoes/creditos`) — falta apenas
*debitar* créditos quando houver geração de mídia real (Fase 3+; texto local
não consome crédito, por não ter custo).

Biblioteca (`/biblioteca`) também é vertical slice completo:
- Busca por título, filtros por tipo/status/pasta/tag/favoritos (todos via
  query no Supabase, não em memória), alternância grade/lista.
- Criar pasta, criar tag, mover item entre pastas, anexar/remover tags —
  tudo persistido, sem estado que "parece" salvo mas não é.
- Favoritar, renomear, duplicar (cria linha nova real), arquivar, excluir
  (soft delete via `deleted_at`) e restaurar — com view de "Itens excluídos".
- Estado vazio distingue "biblioteca vazia" de "filtro sem resultado".
- Cobertura: `e2e/biblioteca.spec.ts` (semeia um `content_item` via Admin API,
  testa busca, favoritar com persistência real após reload, renomear,
  duplicar com contagem real no banco, excluir/restaurar).

Calendário continua `not_started` — schema já existe (`calendars`,
`calendar_events`).

**Nota sobre flakiness dos testes E2E**: em algumas execuções da suíte
completa (não isoladas), `supabase.auth.admin.createUser()` falha
esporadicamente com `invalid JWT: unrecognized JWT kid` — é um erro do lado
do Supabase (infra de assinatura de JWT do projeto), não do código da
aplicação; roda isolado ou re-executado sempre passa. Se vir esse erro
específico, rode o arquivo de teste isoladamente antes de investigar como bug.

## Fase 3 — Post Twitter, Frase de Efeito, Post YouTube, Post GPT, Google Post

**Status: motor de design completed · Frase de Efeito completed · demais not_started.**

Construído o motor de design real (`src/lib/design/`) exigido pelo adendo do
usuário — `DesignDocument` único compartilhado entre preview e exportação,
renderizadores reais de PNG/JPEG/PDF/ZIP, todos com testes que verificam o
arquivo binário (dimensão exata, formato válido), não só que "não deu erro".
Ver `ARCHITECTURE.md` → "Motor de design" para os detalhes técnicos e a
justificativa de usar FFmpeg puro em vez de Remotion para vídeo (licença).

**Frase de Efeito** é o primeiro vertical slice completo sobre esse motor:
editor com preview ao vivo, salvar (com versionamento real via
`content_versions`), renderizar PNG real (1170×1560, upload real no Storage,
`render_jobs` com status/erro reais), baixar o arquivo de verdade, reabrir o
projeto e editar (gera nova versão). Testado ponta a ponta em
`e2e/frase-de-efeito.spec.ts`, incluindo baixar o PNG resultante via HTTP e
validar com `sharp` que é um PNG real nas dimensões certas — não apenas que o
botão existe.

**Carrossel Pessoal** também completo: foto obrigatória por slide (upload real,
sem placeholder quando ausente — exportação é recusada de verdade, não gera
arquivo fictício), controle de foco horizontal/vertical do recorte, overlay
escuro configurável, frase e @usuário. Reaproveita `useSlideList` e os
componentes `SlideNavigator`/`CarouselExportPanel` extraídos do Carrossel Dark.

Durante os testes E2E deste módulo, apagar o usuário de teste começou a falhar
silenciosamente (o SDK do Supabase engolia o erro como `{}`). Investigação
por SQL direto revelou uma referência circular real no schema:
`user_profiles.active_workspace_id → workspaces` não tinha `ON DELETE`
definido (padrão `NO ACTION`), então apagar um workspace ficava bloqueado
enquanto qualquer perfil (inclusive o do próprio dono) ainda apontasse para
ele como workspace ativo — o que por sua vez bloqueava apagar o usuário.
Corrigido na migration `0008_fix_workspace_delete_fks.sql` para
`ON DELETE SET NULL`. Também corrigido o helper de teste
(`e2e/helpers/supabase-admin.ts`) para sempre apagar o workspace do usuário de
teste antes do usuário, com retry para a mesma flakiness de JWT já conhecida.
26 usuários/workspaces órfãos de execuções anteriores foram limpos do banco.

**Post Twitter** está completo: avatar circular (upload real via
`MediaUploadButton`, reutilizável pelos próximos templates), nome, @usuário,
selo de verificação opcional, texto com auto-fit, tema claro/escuro. A
inspeção visual real do PNG exportado (não só a checagem de dimensão/formato)
revelou um bug genuíno — o caractere "✓" em texto virava um quadrado vazio,
porque a fonte padrão do renderizador (Satori) não tem esse glifo — corrigido
substituindo por um selo desenhado como SVG embutido (círculo + check),
renderizado como imagem em vez de texto. Documentado em
`ARCHITECTURE.md`/`render-tree.tsx` como armadilha conhecida de compatibilidade
Satori. Composição original, não copia a interface do X.

Post YouTube, Post GPT, Google Post e os 4 carrosséis vão sobre a mesma base
(`DesignDocument` + `documentToJsx` + `renderer.ts`), com templates próprios
por tipo de conteúdo — ver tarefas em andamento.

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

**Status: Instagram partial (código 100% pronto, aguardando credencial
externa) · demais plataformas not_started.**

O produto foi redefinido para uso **single-owner**: só a conta do proprietário
pode conectar, sem App Review, sem Live Mode, sem clientes externos. Construído:

- `src/lib/integrations/instagram/{config,oauth,publish}.ts` — Instagram API
  with Instagram Login (sem Facebook Page), scopes
  `instagram_business_basic` + `instagram_business_content_publish`.
- `src/lib/crypto/{token-cipher,oauth-state}.ts` — tokens sempre criptografados
  (AES-256-GCM) em repouso; CSRF do OAuth via cookie assinado HMAC (TTL 5min).
- Allowlist **fail-closed**: `INSTAGRAM_ALLOWED_ACCOUNT_IDS` /
  `INSTAGRAM_ALLOWED_USERNAMES` — sem allowlist configurada, nenhuma conta é
  aceita. Tentativa de conta não autorizada é recusada e registrada em
  `audit_logs`, nunca fica "Conectado" sem essa verificação.
- Rotas `/api/integrations/instagram/{connect,callback,test-image}` e página
  `/configuracoes/instagram-setup` (checklist real, redirect URI para copiar,
  botões Conectar/Verificar/Publicar teste/Desconectar).
- `/conexoes` virou hub real (deixou de ser `ComingSoon`): Instagram tem card
  funcional, Facebook/YouTube/Google Business aparecem como "não
  implementado" honestamente.
- 17 testes unitários (Vitest) + 2 testes E2E (Playwright) cobrindo cifra de
  token, allowlist, construção da URL OAuth, proteção de rota e o
  redirecionamento correto quando `META_APP_ID` está ausente.

**Bloqueio real, não de arquitetura**: sem `META_APP_ID`/`META_APP_SECRET` (só
o proprietário pode gerá-los, criando o Meta App e aceitando o convite de
Instagram Tester), o botão "Conectar meu Instagram" redireciona para
`status=blocked_official_auth_unavailable` em vez de simular sucesso ou
quebrar com erro 500 — isso está testado. Publicação real, teste de conexão e
desconexão dependem dessa mesma credencial e ficam `blocked_official_auth_unavailable`
até lá.

Facebook Pages, X/Twitter, YouTube e Google Business Profile continuam
`not_started` — mesmo princípio (OAuth real, sem API paga, sem chave inserida
pelo usuário) será aplicado quando chegar a vez de cada uma.

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
