# Relatório de Paridade Funcional

Estado real de cada feature do produto. Uma feature só recebe `completed` quando
TODAS as colunas aplicáveis a ela estão de fato prontas — interface, backend,
banco, processamento (quando houver), exportação (quando houver), publicação
(quando houver) e teste E2E.

| Feature | Interface | Backend | Banco | Processamento | Exportação | Publicação | E2E | Status |
|---|---|---|---|---|---|---|---|---|
| Cadastro / login / logout | ✅ | ✅ | ✅ | — | — | — | ✅ | **completed** |
| Recuperação de senha | ✅ | ✅ | ✅ | — | — | — | manual | **completed** |
| Onboarding + criação automática de workspace | ✅ | ✅ | ✅ | — | — | — | ✅ | **completed** |
| Multi-tenancy (papéis, RLS, alternância de workspace) | ✅ | ✅ | ✅ | — | — | — | manual | **completed** |
| Shell autenticado (sidebar, header, créditos, perfil) | ✅ | ✅ | ✅ | — | — | — | manual | **completed** |
| Dashboard com dados reais | ✅ | ✅ | ✅ | — | — | — | manual | **completed** |
| Configurações de perfil (nome, bio, foto) | ✅ | ✅ | ✅ | ✅ (upload) | — | — | manual | **completed** |
| Créditos (visualização + histórico) | ✅ | ✅ | ✅ | — | — | — | manual | **completed** |
| Registro de providers + cost preflight (custo zero) | — | ✅ | — | — | — | — | pendente | **partial** (arquitetura pronta; sem consumidor ainda) |
| Planejador (perfil de nicho/marca) | ✅ | ✅ | ✅ | ✅ (gerador local) | — | — | ✅ | **completed** |
| Calendário editorial | 🔲 | 🔲 | ✅ (schema) | — | — | ✅ (schema `publish_jobs`) | 🔲 | **not_started** |
| Biblioteca | ✅ | ✅ | ✅ | — | — | — | ✅ | **completed** |
| Post Twitter | 🔲 | 🔲 | ✅ (schema) | 🔲 (render `next/og`) | 🔲 | 🔲 | 🔲 | **not_started** |
| Frase de Efeito | ✅ | ✅ | ✅ | ✅ (`next/og` real, testado) | ✅ (PNG real) | — | ✅ | **completed** |
| Post YouTube | 🔲 | 🔲 | ✅ (schema) | 🔲 (FFmpeg disponível) | 🔲 | 🔲 | 🔲 | **not_started** |
| Post GPT | 🔲 | 🔲 | ✅ (schema) | 🔲 (FFmpeg disponível) | 🔲 | 🔲 | 🔲 | **not_started** |
| Google Post | 🔲 | 🔲 | ✅ (schema) | 🔲 (FFmpeg disponível) | 🔲 | 🔲 (conector ausente) | 🔲 | **not_started** |
| Carrossel IA | 🔲 | 🔲 | ✅ (schema) | 🔲 (OCR/transcrição disponíveis) | 🔲 | 🔲 | 🔲 | **not_started** |
| Carrossel Twitter | 🔲 | 🔲 | ✅ (schema) | 🔲 | 🔲 | 🔲 | 🔲 | **not_started** |
| Carrossel Pessoal | 🔲 | 🔲 | ✅ (schema) | 🔲 | 🔲 | 🔲 | 🔲 | **not_started** |
| Carrossel Dark | 🔲 | 🔲 | ✅ (schema) | 🔲 | 🔲 | 🔲 | 🔲 | **not_started** |
| Roteiro Reels | 🔲 | 🔲 | ✅ (schema) | 🔲 (gerador local de texto) | 🔲 | — | 🔲 | **not_started** |
| Criador de Reels | 🔲 | 🔲 | ✅ (schema) | 🔲 (FFmpeg; voz pendente de revisão de licença) | 🔲 | 🔲 | 🔲 | **not_started** |
| Bio Magnética | 🔲 | 🔲 | ✅ (schema) | 🔲 (gerador local de texto) | — | — | 🔲 | **not_started** |
| Criativos | 🔲 | 🔲 | ✅ (schema) | 🔲 (gerador local de texto) | — | — | 🔲 | **not_started** |
| Conexões — Instagram (single-owner) | ✅ | ✅ | ✅ | — | — | ✅ (código) | ✅ | **partial** — todo o código está pronto e testado (allowlist fail-closed, criptografia AES-256-GCM, CSRF via cookie assinado, publicação real com container→poll→publish→permalink); falta apenas o proprietário criar o Meta App e fornecer `META_APP_ID`/`META_APP_SECRET` para o teste E2E de publicação real. Status reportado ao usuário: `blocked_official_auth_unavailable` |
| Conexões — Facebook/YouTube/Google Business | 🔲 | 🔲 | ✅ (schema) | — | — | 🔲 | 🔲 | **not_started** |

Legenda: ✅ pronto · 🔲 não implementado · — não aplicável a esta feature.

## Por que "schema pronto" não é "feature completed"

O `FUNCTIONAL_PARITY.md` propositalmente **não** marca uma feature como
completed só porque a tabela do banco já existe (migration `0001_init.sql`).
Todas as 32 tabelas de negócio da seção 17 do briefing já estão criadas com RLS,
índices e FKs — isso remove risco de retrabalho de schema nas próximas fases,
mas não substitui interface, regra de negócio, processamento, testes e
verificação manual, que são exigidos para `completed`.
