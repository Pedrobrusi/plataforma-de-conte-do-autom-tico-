-- Bucket público para mídia gerada pelo app (ex.: imagens de teste de publicação,
-- exports). Caminho sempre prefixado por workspace_id/, RLS restrita a membros
-- do respectivo workspace.
insert into storage.buckets (id, name, public)
values ('media', 'media', true)
on conflict (id) do nothing;

create policy "media_public_read" on storage.objects for select
  using (bucket_id = 'media');

create policy "media_workspace_insert" on storage.objects for insert
  with check (
    bucket_id = 'media'
    and private.is_workspace_member(((storage.foldername(name))[1])::uuid)
  );

create policy "media_workspace_update" on storage.objects for update
  using (
    bucket_id = 'media'
    and private.is_workspace_member(((storage.foldername(name))[1])::uuid)
  );

create policy "media_workspace_delete" on storage.objects for delete
  using (
    bucket_id = 'media'
    and private.is_workspace_member(((storage.foldername(name))[1])::uuid)
  );
