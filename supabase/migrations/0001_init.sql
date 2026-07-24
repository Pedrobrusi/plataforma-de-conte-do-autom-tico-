-- ============================================================================
-- Averro Content OS — schema inicial
-- Multi-tenant SaaS de criação/organização/geração/agendamento de conteúdo.
-- Todas as entidades de negócio são isoladas por workspace_id via RLS.
-- ============================================================================

create extension if not exists pgcrypto;

-- ----------------------------------------------------------------------------
-- Enums
-- ----------------------------------------------------------------------------
create type workspace_role as enum ('owner', 'admin', 'editor', 'viewer');
create type workspace_member_status as enum ('invited', 'active', 'removed');

create type content_type as enum (
  'twitter_post', 'quote_card', 'youtube_post', 'gpt_post', 'google_post',
  'carousel_ai', 'carousel_twitter', 'carousel_personal', 'carousel_dark',
  'reel', 'reel_script', 'bio', 'creative_brief'
);
create type content_status as enum ('draft', 'ready', 'scheduled', 'published', 'failed', 'archived');

create type media_kind as enum ('image', 'video', 'audio', 'pdf', 'other');
create type source_type as enum (
  'youtube_url', 'instagram_url', 'tiktok_url', 'article_url',
  'pdf', 'audio', 'video', 'text_file', 'manual_text'
);
create type import_status as enum ('queued', 'processing', 'completed', 'failed');

create type ai_provider as enum ('openai', 'anthropic', 'google', 'mock');
create type ai_run_status as enum ('queued', 'processing', 'completed', 'failed');

create type calendar_event_status as enum ('draft', 'ready', 'scheduled', 'published', 'failed');

create type social_platform as enum ('instagram', 'facebook', 'twitter', 'youtube', 'google_business', 'tiktok');
create type connection_status as enum ('disconnected', 'connected', 'expired', 'error');

create type job_status as enum ('queued', 'processing', 'completed', 'failed', 'cancelled');

create type credit_transaction_type as enum ('credit', 'debit', 'refund');

create type subscription_status as enum ('trialing', 'active', 'past_due', 'canceled', 'incomplete');

create type notification_type as enum ('info', 'success', 'warning', 'error');

create type folder_kind as enum (
  'content', 'media', 'template', 'brief', 'general'
);

-- ----------------------------------------------------------------------------
-- Helpers
-- ----------------------------------------------------------------------------
create or replace function set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

-- ----------------------------------------------------------------------------
-- Core tenancy
-- ----------------------------------------------------------------------------
create table workspaces (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  slug text not null unique,
  owner_id uuid not null references auth.users(id) on delete restrict,
  timezone text not null default 'America/Sao_Paulo',
  logo_url text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  deleted_at timestamptz
);
create trigger trg_workspaces_updated_at before update on workspaces
  for each row execute function set_updated_at();

create table workspace_members (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references workspaces(id) on delete cascade,
  user_id uuid references auth.users(id) on delete cascade,
  invited_email text,
  role workspace_role not null default 'viewer',
  status workspace_member_status not null default 'active',
  invited_by uuid references auth.users(id),
  invite_token uuid default gen_random_uuid(),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (workspace_id, user_id),
  constraint member_has_identity check (user_id is not null or invited_email is not null)
);
create index idx_workspace_members_workspace on workspace_members(workspace_id);
create index idx_workspace_members_user on workspace_members(user_id);
create trigger trg_workspace_members_updated_at before update on workspace_members
  for each row execute function set_updated_at();

create table user_profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  full_name text,
  avatar_url text,
  bio text,
  active_workspace_id uuid references workspaces(id),
  onboarding_completed_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create trigger trg_user_profiles_updated_at before update on user_profiles
  for each row execute function set_updated_at();

-- ----------------------------------------------------------------------------
-- Brand / niche strategic context (used by every AI generator)
-- ----------------------------------------------------------------------------
create table brand_profiles (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references workspaces(id) on delete cascade,
  display_name text,
  logo_url text,
  primary_color text,
  secondary_color text,
  tone_of_voice text,
  forbidden_words text[] not null default '{}',
  preferred_words text[] not null default '{}',
  references_urls text[] not null default '{}',
  social_links jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create unique index idx_brand_profiles_workspace on brand_profiles(workspace_id);
create trigger trg_brand_profiles_updated_at before update on brand_profiles
  for each row execute function set_updated_at();

create table niche_profiles (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references workspaces(id) on delete cascade,
  version integer not null default 1,
  niche text,
  what_i_do text,
  target_audience text,
  audience_pains text,
  audience_desires text,
  objections text,
  differentiators text,
  proof_and_authority text,
  products_or_services text,
  tone_of_voice text,
  topics_to_cover text,
  topics_to_avoid text,
  creator_references text,
  publish_frequency text,
  main_goal text,
  website_url text,
  social_links jsonb not null default '{}'::jsonb,
  created_by uuid references auth.users(id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index idx_niche_profiles_workspace on niche_profiles(workspace_id, version desc);
create trigger trg_niche_profiles_updated_at before update on niche_profiles
  for each row execute function set_updated_at();

create table niche_profile_versions (
  id uuid primary key default gen_random_uuid(),
  niche_profile_id uuid not null references niche_profiles(id) on delete cascade,
  workspace_id uuid not null references workspaces(id) on delete cascade,
  snapshot jsonb not null,
  created_by uuid references auth.users(id),
  created_at timestamptz not null default now()
);
create index idx_niche_profile_versions_profile on niche_profile_versions(niche_profile_id);

-- ----------------------------------------------------------------------------
-- Folders & tags (biblioteca)
-- ----------------------------------------------------------------------------
create table folders (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references workspaces(id) on delete cascade,
  name text not null,
  kind folder_kind not null default 'general',
  parent_id uuid references folders(id) on delete cascade,
  created_by uuid references auth.users(id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  deleted_at timestamptz
);
create index idx_folders_workspace on folders(workspace_id);
create trigger trg_folders_updated_at before update on folders
  for each row execute function set_updated_at();

create table tags (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references workspaces(id) on delete cascade,
  name text not null,
  color text,
  created_at timestamptz not null default now(),
  unique (workspace_id, name)
);
create index idx_tags_workspace on tags(workspace_id);

-- ----------------------------------------------------------------------------
-- Content
-- ----------------------------------------------------------------------------
create table content_items (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references workspaces(id) on delete cascade,
  type content_type not null,
  title text not null default 'Sem título',
  status content_status not null default 'draft',
  data jsonb not null default '{}'::jsonb,
  folder_id uuid references folders(id) on delete set null,
  is_favorite boolean not null default false,
  scheduled_at timestamptz,
  published_at timestamptz,
  created_by uuid references auth.users(id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  deleted_at timestamptz
);
create index idx_content_items_workspace on content_items(workspace_id, deleted_at);
create index idx_content_items_type on content_items(workspace_id, type);
create index idx_content_items_status on content_items(workspace_id, status);
create trigger trg_content_items_updated_at before update on content_items
  for each row execute function set_updated_at();

create table content_item_tags (
  content_item_id uuid not null references content_items(id) on delete cascade,
  tag_id uuid not null references tags(id) on delete cascade,
  primary key (content_item_id, tag_id)
);

create table content_versions (
  id uuid primary key default gen_random_uuid(),
  content_item_id uuid not null references content_items(id) on delete cascade,
  workspace_id uuid not null references workspaces(id) on delete cascade,
  version_number integer not null,
  data jsonb not null,
  created_by uuid references auth.users(id),
  created_at timestamptz not null default now(),
  unique (content_item_id, version_number)
);
create index idx_content_versions_item on content_versions(content_item_id);

create table content_blocks (
  id uuid primary key default gen_random_uuid(),
  content_item_id uuid not null references content_items(id) on delete cascade,
  workspace_id uuid not null references workspaces(id) on delete cascade,
  block_type text not null,
  position integer not null default 0,
  data jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index idx_content_blocks_item on content_blocks(content_item_id, position);
create trigger trg_content_blocks_updated_at before update on content_blocks
  for each row execute function set_updated_at();

create table carousel_slides (
  id uuid primary key default gen_random_uuid(),
  content_item_id uuid not null references content_items(id) on delete cascade,
  workspace_id uuid not null references workspaces(id) on delete cascade,
  position integer not null default 0,
  title text,
  body text,
  image_url text,
  background text,
  font text,
  text_color text,
  template text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index idx_carousel_slides_item on carousel_slides(content_item_id, position);
create trigger trg_carousel_slides_updated_at before update on carousel_slides
  for each row execute function set_updated_at();

-- ----------------------------------------------------------------------------
-- Media & source imports
-- ----------------------------------------------------------------------------
create table media_assets (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references workspaces(id) on delete cascade,
  folder_id uuid references folders(id) on delete set null,
  storage_path text not null,
  public_url text,
  mime_type text,
  kind media_kind not null default 'other',
  size_bytes bigint,
  created_by uuid references auth.users(id),
  created_at timestamptz not null default now(),
  deleted_at timestamptz
);
create index idx_media_assets_workspace on media_assets(workspace_id, deleted_at);

create table source_imports (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references workspaces(id) on delete cascade,
  source_type source_type not null,
  source_url text,
  media_asset_id uuid references media_assets(id) on delete set null,
  raw_text text,
  extracted_text text,
  status import_status not null default 'queued',
  error text,
  created_by uuid references auth.users(id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index idx_source_imports_workspace on source_imports(workspace_id);
create trigger trg_source_imports_updated_at before update on source_imports
  for each row execute function set_updated_at();

-- ----------------------------------------------------------------------------
-- AI generation
-- ----------------------------------------------------------------------------
create table ai_generation_runs (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references workspaces(id) on delete cascade,
  user_id uuid references auth.users(id),
  content_item_id uuid references content_items(id) on delete set null,
  provider ai_provider not null default 'mock',
  model text,
  prompt_key text not null,
  input jsonb not null default '{}'::jsonb,
  status ai_run_status not null default 'queued',
  tokens_input integer,
  tokens_output integer,
  cost_usd numeric(10, 4),
  error text,
  started_at timestamptz,
  completed_at timestamptz,
  created_at timestamptz not null default now()
);
create index idx_ai_generation_runs_workspace on ai_generation_runs(workspace_id);

create table ai_generation_outputs (
  id uuid primary key default gen_random_uuid(),
  generation_run_id uuid not null references ai_generation_runs(id) on delete cascade,
  workspace_id uuid not null references workspaces(id) on delete cascade,
  output jsonb not null,
  is_selected boolean not null default false,
  created_at timestamptz not null default now()
);
create index idx_ai_generation_outputs_run on ai_generation_outputs(generation_run_id);

-- ----------------------------------------------------------------------------
-- Calendar
-- ----------------------------------------------------------------------------
create table calendars (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references workspaces(id) on delete cascade,
  name text not null default 'Calendário Editorial',
  timezone text not null default 'America/Sao_Paulo',
  is_default boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index idx_calendars_workspace on calendars(workspace_id);
create trigger trg_calendars_updated_at before update on calendars
  for each row execute function set_updated_at();

create table calendar_events (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references workspaces(id) on delete cascade,
  calendar_id uuid not null references calendars(id) on delete cascade,
  content_item_id uuid references content_items(id) on delete set null,
  title text not null,
  platform social_platform,
  status calendar_event_status not null default 'draft',
  starts_at timestamptz not null,
  ends_at timestamptz,
  all_day boolean not null default false,
  created_by uuid references auth.users(id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  deleted_at timestamptz
);
create index idx_calendar_events_workspace on calendar_events(workspace_id, starts_at);
create index idx_calendar_events_status on calendar_events(workspace_id, status);
create trigger trg_calendar_events_updated_at before update on calendar_events
  for each row execute function set_updated_at();

-- ----------------------------------------------------------------------------
-- Social connections & publishing
-- ----------------------------------------------------------------------------
create table social_connections (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references workspaces(id) on delete cascade,
  platform social_platform not null,
  status connection_status not null default 'disconnected',
  display_name text,
  external_account_id text,
  access_token_encrypted text,
  refresh_token_encrypted text,
  scopes text[] not null default '{}',
  expires_at timestamptz,
  is_mock boolean not null default false,
  last_synced_at timestamptz,
  last_error text,
  connected_by uuid references auth.users(id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index idx_social_connections_workspace on social_connections(workspace_id, platform);
create trigger trg_social_connections_updated_at before update on social_connections
  for each row execute function set_updated_at();

create table social_accounts (
  id uuid primary key default gen_random_uuid(),
  social_connection_id uuid not null references social_connections(id) on delete cascade,
  workspace_id uuid not null references workspaces(id) on delete cascade,
  external_id text not null,
  name text,
  avatar_url text,
  kind text,
  is_selected boolean not null default false,
  created_at timestamptz not null default now()
);
create index idx_social_accounts_connection on social_accounts(social_connection_id);

create table publish_jobs (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references workspaces(id) on delete cascade,
  content_item_id uuid not null references content_items(id) on delete cascade,
  social_connection_id uuid references social_connections(id) on delete set null,
  status job_status not null default 'queued',
  scheduled_at timestamptz,
  attempts integer not null default 0,
  last_error text,
  payload jsonb not null default '{}'::jsonb,
  result jsonb,
  created_by uuid references auth.users(id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index idx_publish_jobs_workspace on publish_jobs(workspace_id, status);
create trigger trg_publish_jobs_updated_at before update on publish_jobs
  for each row execute function set_updated_at();

create table publish_attempts (
  id uuid primary key default gen_random_uuid(),
  publish_job_id uuid not null references publish_jobs(id) on delete cascade,
  workspace_id uuid not null references workspaces(id) on delete cascade,
  attempt_number integer not null,
  status job_status not null,
  response jsonb,
  error text,
  started_at timestamptz not null default now(),
  finished_at timestamptz
);
create index idx_publish_attempts_job on publish_attempts(publish_job_id);

-- ----------------------------------------------------------------------------
-- Reels: avatars, voices, render jobs
-- ----------------------------------------------------------------------------
create table avatar_catalog (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  gender text,
  provider text not null default 'mock',
  external_id text,
  thumbnail_url text,
  is_active boolean not null default true,
  created_at timestamptz not null default now()
);

create table voice_catalog (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  language text not null default 'pt-BR',
  accent text,
  gender text,
  provider text not null default 'mock',
  external_id text,
  sample_url text,
  is_active boolean not null default true,
  created_at timestamptz not null default now()
);

create table render_jobs (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references workspaces(id) on delete cascade,
  content_item_id uuid references content_items(id) on delete set null,
  avatar_id uuid references avatar_catalog(id),
  voice_id uuid references voice_catalog(id),
  status job_status not null default 'queued',
  progress integer not null default 0,
  provider text not null default 'mock',
  payload jsonb not null default '{}'::jsonb,
  result_url text,
  error text,
  credits_charged integer not null default 0,
  created_by uuid references auth.users(id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index idx_render_jobs_workspace on render_jobs(workspace_id, status);
create trigger trg_render_jobs_updated_at before update on render_jobs
  for each row execute function set_updated_at();

-- ----------------------------------------------------------------------------
-- Credits & billing
-- ----------------------------------------------------------------------------
create table credit_wallets (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null unique references workspaces(id) on delete cascade,
  balance integer not null default 0,
  updated_at timestamptz not null default now()
);
create trigger trg_credit_wallets_updated_at before update on credit_wallets
  for each row execute function set_updated_at();

create table credit_transactions (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references workspaces(id) on delete cascade,
  wallet_id uuid not null references credit_wallets(id) on delete cascade,
  amount integer not null,
  type credit_transaction_type not null,
  reason text not null,
  related_job_id uuid,
  created_by uuid references auth.users(id),
  created_at timestamptz not null default now()
);
create index idx_credit_transactions_workspace on credit_transactions(workspace_id);

create table subscriptions (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null unique references workspaces(id) on delete cascade,
  plan text not null default 'free',
  status subscription_status not null default 'active',
  provider text,
  external_subscription_id text,
  current_period_end timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create trigger trg_subscriptions_updated_at before update on subscriptions
  for each row execute function set_updated_at();

-- ----------------------------------------------------------------------------
-- Templates & creative briefs
-- ----------------------------------------------------------------------------
create table templates (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid references workspaces(id) on delete cascade,
  name text not null,
  category text,
  kind text not null,
  config jsonb not null default '{}'::jsonb,
  thumbnail_url text,
  is_system boolean not null default false,
  created_by uuid references auth.users(id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index idx_templates_workspace on templates(workspace_id);
create trigger trg_templates_updated_at before update on templates
  for each row execute function set_updated_at();

create table creative_briefs (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references workspaces(id) on delete cascade,
  name text not null,
  campaign_id uuid,
  data jsonb not null default '{}'::jsonb,
  status text not null default 'draft',
  created_by uuid references auth.users(id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  deleted_at timestamptz
);
create index idx_creative_briefs_workspace on creative_briefs(workspace_id);
create trigger trg_creative_briefs_updated_at before update on creative_briefs
  for each row execute function set_updated_at();

-- ----------------------------------------------------------------------------
-- Audit & notifications
-- ----------------------------------------------------------------------------
create table audit_logs (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid references workspaces(id) on delete cascade,
  user_id uuid references auth.users(id),
  action text not null,
  entity_type text not null,
  entity_id uuid,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);
create index idx_audit_logs_workspace on audit_logs(workspace_id, created_at desc);

create table notifications (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid references workspaces(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  type notification_type not null default 'info',
  title text not null,
  body text,
  link text,
  is_read boolean not null default false,
  created_at timestamptz not null default now()
);
create index idx_notifications_user on notifications(user_id, is_read, created_at desc);

-- ----------------------------------------------------------------------------
-- Helpers de RLS (definidos após as tabelas para permitir validação do corpo SQL)
-- ----------------------------------------------------------------------------
create or replace function is_workspace_member(target_workspace_id uuid)
returns boolean
language sql
security definer
stable
set search_path = public
as $$
  select exists (
    select 1 from workspace_members wm
    where wm.workspace_id = target_workspace_id
      and wm.user_id = auth.uid()
      and wm.status = 'active'
  );
$$;

create or replace function workspace_role_of(target_workspace_id uuid)
returns workspace_role
language sql
security definer
stable
set search_path = public
as $$
  select wm.role from workspace_members wm
  where wm.workspace_id = target_workspace_id
    and wm.user_id = auth.uid()
    and wm.status = 'active'
  limit 1;
$$;

create or replace function is_workspace_admin(target_workspace_id uuid)
returns boolean
language sql
security definer
stable
set search_path = public
as $$
  select workspace_role_of(target_workspace_id) in ('owner', 'admin');
$$;

-- ============================================================================
-- Row Level Security
-- ============================================================================
alter table workspaces enable row level security;
alter table workspace_members enable row level security;
alter table user_profiles enable row level security;
alter table brand_profiles enable row level security;
alter table niche_profiles enable row level security;
alter table niche_profile_versions enable row level security;
alter table folders enable row level security;
alter table tags enable row level security;
alter table content_items enable row level security;
alter table content_item_tags enable row level security;
alter table content_versions enable row level security;
alter table content_blocks enable row level security;
alter table carousel_slides enable row level security;
alter table media_assets enable row level security;
alter table source_imports enable row level security;
alter table ai_generation_runs enable row level security;
alter table ai_generation_outputs enable row level security;
alter table calendars enable row level security;
alter table calendar_events enable row level security;
alter table social_connections enable row level security;
alter table social_accounts enable row level security;
alter table publish_jobs enable row level security;
alter table publish_attempts enable row level security;
alter table avatar_catalog enable row level security;
alter table voice_catalog enable row level security;
alter table render_jobs enable row level security;
alter table credit_wallets enable row level security;
alter table credit_transactions enable row level security;
alter table subscriptions enable row level security;
alter table templates enable row level security;
alter table creative_briefs enable row level security;
alter table audit_logs enable row level security;
alter table notifications enable row level security;

-- workspaces: membros veem; apenas owner atualiza/deleta; qualquer usuário autenticado pode criar (torna-se owner)
create policy "workspaces_select_members" on workspaces for select
  using (is_workspace_member(id));
create policy "workspaces_insert_self" on workspaces for insert
  with check (owner_id = auth.uid());
create policy "workspaces_update_owner" on workspaces for update
  using (owner_id = auth.uid());
create policy "workspaces_delete_owner" on workspaces for delete
  using (owner_id = auth.uid());

-- workspace_members: membros veem os membros do próprio workspace; admins gerenciam
create policy "workspace_members_select" on workspace_members for select
  using (is_workspace_member(workspace_id) or user_id = auth.uid());
create policy "workspace_members_insert_admin" on workspace_members for insert
  with check (is_workspace_admin(workspace_id));
create policy "workspace_members_update_admin" on workspace_members for update
  using (is_workspace_admin(workspace_id));
create policy "workspace_members_delete_admin" on workspace_members for delete
  using (is_workspace_admin(workspace_id));

-- user_profiles: cada usuário vê/edita apenas o próprio perfil
create policy "user_profiles_select_self" on user_profiles for select
  using (id = auth.uid());
create policy "user_profiles_update_self" on user_profiles for update
  using (id = auth.uid());
create policy "user_profiles_insert_self" on user_profiles for insert
  with check (id = auth.uid());

-- Padrão genérico workspace-scoped (select/insert/update por membros; delete por admin)
do $$
declare
  t text;
  workspace_scoped_tables text[] := array[
    'brand_profiles', 'niche_profiles', 'niche_profile_versions', 'folders', 'tags',
    'content_items', 'content_versions', 'content_blocks', 'carousel_slides',
    'media_assets', 'source_imports', 'ai_generation_runs', 'ai_generation_outputs',
    'calendars', 'calendar_events', 'social_connections', 'social_accounts',
    'publish_jobs', 'publish_attempts', 'render_jobs', 'credit_wallets',
    'credit_transactions', 'subscriptions', 'creative_briefs', 'audit_logs'
  ];
begin
  foreach t in array workspace_scoped_tables loop
    execute format(
      'create policy "%1$s_select_members" on %1$s for select using (is_workspace_member(workspace_id));',
      t
    );
    execute format(
      'create policy "%1$s_insert_members" on %1$s for insert with check (is_workspace_member(workspace_id));',
      t
    );
    execute format(
      'create policy "%1$s_update_members" on %1$s for update using (is_workspace_member(workspace_id));',
      t
    );
    execute format(
      'create policy "%1$s_delete_admin" on %1$s for delete using (is_workspace_admin(workspace_id));',
      t
    );
  end loop;
end $$;

-- templates: sistema (workspace_id null) visível a todos autenticados; workspace-scoped segue padrão
create policy "templates_select" on templates for select
  using (workspace_id is null or is_workspace_member(workspace_id));
create policy "templates_insert_members" on templates for insert
  with check (workspace_id is not null and is_workspace_member(workspace_id));
create policy "templates_update_members" on templates for update
  using (workspace_id is not null and is_workspace_member(workspace_id));
create policy "templates_delete_admin" on templates for delete
  using (workspace_id is not null and is_workspace_admin(workspace_id));

-- content_item_tags: segue o workspace do content_item
create policy "content_item_tags_select" on content_item_tags for select
  using (exists (
    select 1 from content_items ci
    where ci.id = content_item_tags.content_item_id and is_workspace_member(ci.workspace_id)
  ));
create policy "content_item_tags_insert" on content_item_tags for insert
  with check (exists (
    select 1 from content_items ci
    where ci.id = content_item_tags.content_item_id and is_workspace_member(ci.workspace_id)
  ));
create policy "content_item_tags_delete" on content_item_tags for delete
  using (exists (
    select 1 from content_items ci
    where ci.id = content_item_tags.content_item_id and is_workspace_member(ci.workspace_id)
  ));

-- avatar_catalog / voice_catalog: catálogo global, leitura para qualquer usuário autenticado
create policy "avatar_catalog_select_authenticated" on avatar_catalog for select
  using (auth.role() = 'authenticated');
create policy "voice_catalog_select_authenticated" on voice_catalog for select
  using (auth.role() = 'authenticated');

-- notifications: cada usuário vê apenas as suas
create policy "notifications_select_self" on notifications for select
  using (user_id = auth.uid());
create policy "notifications_update_self" on notifications for update
  using (user_id = auth.uid());
create policy "notifications_insert_self_or_workspace" on notifications for insert
  with check (user_id = auth.uid() or (workspace_id is not null and is_workspace_member(workspace_id)));

-- ============================================================================
-- Onboarding automático: perfil + workspace + créditos iniciais
-- ============================================================================
create or replace function handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  new_workspace_id uuid;
  base_slug text;
  final_slug text;
  suffix int := 0;
begin
  insert into user_profiles (id, full_name, avatar_url)
  values (new.id, new.raw_user_meta_data->>'full_name', new.raw_user_meta_data->>'avatar_url');

  base_slug := coalesce(
    regexp_replace(lower(split_part(new.email, '@', 1)), '[^a-z0-9]+', '-', 'g'),
    'workspace'
  );
  final_slug := base_slug;

  while exists (select 1 from workspaces where slug = final_slug) loop
    suffix := suffix + 1;
    final_slug := base_slug || '-' || suffix::text;
  end loop;

  insert into workspaces (name, slug, owner_id)
  values (coalesce(new.raw_user_meta_data->>'full_name', split_part(new.email, '@', 1)) || ' Workspace', final_slug, new.id)
  returning id into new_workspace_id;

  insert into workspace_members (workspace_id, user_id, role, status)
  values (new_workspace_id, new.id, 'owner', 'active');

  insert into credit_wallets (workspace_id, balance)
  values (new_workspace_id, 100);

  insert into credit_transactions (workspace_id, wallet_id, amount, type, reason)
  select new_workspace_id, id, 100, 'credit', 'Créditos de boas-vindas'
  from credit_wallets where workspace_id = new_workspace_id;

  insert into subscriptions (workspace_id, plan, status)
  values (new_workspace_id, 'free', 'active');

  insert into calendars (workspace_id, name, is_default)
  values (new_workspace_id, 'Calendário Editorial', true);

  update user_profiles set active_workspace_id = new_workspace_id where id = new.id;

  insert into audit_logs (workspace_id, user_id, action, entity_type, entity_id, metadata)
  values (new_workspace_id, new.id, 'workspace.created', 'workspace', new_workspace_id, jsonb_build_object('trigger', 'handle_new_user'));

  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function handle_new_user();

-- ============================================================================
-- Seed: catálogos globais (avatares e vozes mock para desenvolvimento)
-- ============================================================================
insert into avatar_catalog (name, gender, provider, thumbnail_url) values
  ('Ana', 'feminino', 'mock', null),
  ('Bruno', 'masculino', 'mock', null),
  ('Carla', 'feminino', 'mock', null),
  ('Diego', 'masculino', 'mock', null);

insert into voice_catalog (name, language, accent, gender, provider) values
  ('Aurora', 'pt-BR', 'neutro', 'feminino', 'mock'),
  ('Theo', 'pt-BR', 'nordestino', 'masculino', 'mock'),
  ('Luma', 'pt-BR', 'carioca', 'feminino', 'mock'),
  ('Rocco', 'pt-BR', 'paulista', 'masculino', 'mock');
