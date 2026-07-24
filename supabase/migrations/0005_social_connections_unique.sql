-- Uma conexão por plataforma por workspace (necessário para upsert idempotente
-- no callback OAuth em vez de duplicar linhas a cada reconexão).
alter table social_connections
  add constraint social_connections_workspace_platform_unique unique (workspace_id, platform);
