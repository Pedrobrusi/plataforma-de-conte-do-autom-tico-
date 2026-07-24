-- Índices para todas as foreign keys sem índice de cobertura (apontado pelo
-- database linter de performance). Sem isso, filtros e joins nessas colunas
-- caem em sequential scan à medida que as tabelas crescem.

create index if not exists idx_ai_generation_outputs_workspace on ai_generation_outputs(workspace_id);
create index if not exists idx_ai_generation_runs_content_item on ai_generation_runs(content_item_id);
create index if not exists idx_ai_generation_runs_user on ai_generation_runs(user_id);
create index if not exists idx_audit_logs_user on audit_logs(user_id);
create index if not exists idx_calendar_events_calendar on calendar_events(calendar_id);
create index if not exists idx_calendar_events_content_item on calendar_events(content_item_id);
create index if not exists idx_calendar_events_created_by on calendar_events(created_by);
create index if not exists idx_carousel_slides_workspace on carousel_slides(workspace_id);
create index if not exists idx_content_blocks_workspace on content_blocks(workspace_id);
create index if not exists idx_content_item_tags_tag on content_item_tags(tag_id);
create index if not exists idx_content_items_created_by on content_items(created_by);
create index if not exists idx_content_items_folder on content_items(folder_id);
create index if not exists idx_content_versions_created_by on content_versions(created_by);
create index if not exists idx_content_versions_workspace on content_versions(workspace_id);
create index if not exists idx_creative_briefs_created_by on creative_briefs(created_by);
create index if not exists idx_credit_transactions_created_by on credit_transactions(created_by);
create index if not exists idx_credit_transactions_wallet on credit_transactions(wallet_id);
create index if not exists idx_folders_created_by on folders(created_by);
create index if not exists idx_folders_parent on folders(parent_id);
create index if not exists idx_media_assets_created_by on media_assets(created_by);
create index if not exists idx_media_assets_folder on media_assets(folder_id);
create index if not exists idx_niche_profile_versions_created_by on niche_profile_versions(created_by);
create index if not exists idx_niche_profile_versions_workspace on niche_profile_versions(workspace_id);
create index if not exists idx_niche_profiles_created_by on niche_profiles(created_by);
create index if not exists idx_notifications_workspace on notifications(workspace_id);
create index if not exists idx_publish_attempts_workspace on publish_attempts(workspace_id);
create index if not exists idx_publish_jobs_content_item on publish_jobs(content_item_id);
create index if not exists idx_publish_jobs_created_by on publish_jobs(created_by);
create index if not exists idx_publish_jobs_social_connection on publish_jobs(social_connection_id);
create index if not exists idx_render_jobs_avatar on render_jobs(avatar_id);
create index if not exists idx_render_jobs_content_item on render_jobs(content_item_id);
create index if not exists idx_render_jobs_created_by on render_jobs(created_by);
create index if not exists idx_render_jobs_voice on render_jobs(voice_id);
create index if not exists idx_social_accounts_workspace on social_accounts(workspace_id);
create index if not exists idx_social_connections_connected_by on social_connections(connected_by);
create index if not exists idx_source_imports_created_by on source_imports(created_by);
create index if not exists idx_source_imports_media_asset on source_imports(media_asset_id);
create index if not exists idx_templates_created_by on templates(created_by);
create index if not exists idx_user_profiles_active_workspace on user_profiles(active_workspace_id);
create index if not exists idx_workspace_members_invited_by on workspace_members(invited_by);
create index if not exists idx_workspaces_owner on workspaces(owner_id);
