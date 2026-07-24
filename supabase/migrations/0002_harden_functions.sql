-- Move helpers internos para fora do schema exposto pela API (evita RPC público)
-- e trava search_path em todas as funções SECURITY DEFINER / trigger.

create schema if not exists private;

alter function set_updated_at() set search_path = public, pg_temp;

alter function is_workspace_member(uuid) set schema private;
alter function workspace_role_of(uuid) set schema private;
alter function is_workspace_admin(uuid) set schema private;
alter function handle_new_user() set schema private;

-- Nota: NÃO revogar EXECUTE de anon/authenticated nas funções acima.
-- As policies de RLS chamam essas funções como a role da sessão (authenticated),
-- então elas precisam do privilégio de EXECUTE para as policies funcionarem.
-- Mover para o schema `private` já as remove da API pública (PostgREST só expõe `public`).
