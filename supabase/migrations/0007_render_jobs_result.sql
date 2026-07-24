-- render_jobs passa a suportar múltiplos formatos de saída por job (ex.: um
-- carrossel gera PNG por slide + ZIP + PDF no mesmo job) e a identificar que
-- tipo de renderização foi feita, reaproveitando a tabela já existente em vez
-- de criar design_projects/design_documents/render_outputs paralelos —
-- content_items.data já armazena o DesignDocument, content_versions já
-- versiona, media_assets já guarda uploads.
alter table render_jobs add column if not exists render_kind text;
alter table render_jobs add column if not exists result jsonb not null default '{}'::jsonb;
