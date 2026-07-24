-- user_profiles.active_workspace_id referenciava workspaces sem ON DELETE,
-- o que bloqueava para sempre a exclusão de um workspace (ou do usuário,
-- transitivamente) enquanto qualquer perfil ainda apontasse para ele como
-- workspace ativo — inclusive o do próprio dono. Corrige para SET NULL:
-- apagar um workspace apenas limpa a referência de "workspace ativo" de quem
-- apontava para ele, em vez de impedir a exclusão.
alter table user_profiles
  drop constraint user_profiles_active_workspace_id_fkey;

alter table user_profiles
  add constraint user_profiles_active_workspace_id_fkey
  foreign key (active_workspace_id) references workspaces(id) on delete set null;
