import { redirect } from "next/navigation";
import { Inbox } from "lucide-react";
import { getWorkspaceContext } from "@/lib/workspace";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import type { Database } from "@/lib/supabase/types";
import { LibraryToolbar } from "./library-toolbar";
import { ContentItemCard, type ContentItemView } from "./content-item-card";

const CONTENT_TYPES = [
  "twitter_post",
  "quote_card",
  "youtube_post",
  "gpt_post",
  "google_post",
  "carousel_ai",
  "carousel_twitter",
  "carousel_personal",
  "carousel_dark",
  "reel",
  "reel_script",
  "bio",
  "creative_brief",
];

export default async function BibliotecaPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | undefined>>;
}) {
  const context = await getWorkspaceContext();
  if (!context) redirect("/login");
  if (!context.workspace) redirect("/onboarding");

  const params = await searchParams;
  const view = params.view === "list" ? "list" : "grid";
  const showTrash = params.trash === "1";

  const supabase = await createServerSupabaseClient();
  const workspaceId = context.workspace.id;

  const [{ data: folders }, { data: tags }] = await Promise.all([
    supabase.from("folders").select("id, name").eq("workspace_id", workspaceId).order("name"),
    supabase.from("tags").select("id, name").eq("workspace_id", workspaceId).order("name"),
  ]);

  let itemIdsForTagFilter: string[] | null = null;
  if (params.tag) {
    const { data: taggedRows } = await supabase
      .from("content_item_tags")
      .select("content_item_id")
      .eq("tag_id", params.tag);
    itemIdsForTagFilter = (taggedRows ?? []).map((r) => r.content_item_id);
  }

  let query = supabase.from("content_items").select("*").eq("workspace_id", workspaceId);
  query = showTrash ? query.not("deleted_at", "is", null) : query.is("deleted_at", null);
  if (params.q) query = query.ilike("title", `%${params.q}%`);
  if (params.type) query = query.eq("type", params.type as Database["public"]["Enums"]["content_type"]);
  if (params.status) query = query.eq("status", params.status as Database["public"]["Enums"]["content_status"]);
  if (params.folder) query = query.eq("folder_id", params.folder);
  if (params.favorite === "1") query = query.eq("is_favorite", true);
  if (itemIdsForTagFilter) query = query.in("id", itemIdsForTagFilter.length ? itemIdsForTagFilter : ["00000000-0000-0000-0000-000000000000"]);

  const { data: items } = await query.order("created_at", { ascending: false }).limit(100);

  const itemIds = (items ?? []).map((i) => i.id);
  const { data: itemTagRows } =
    itemIds.length > 0
      ? await supabase.from("content_item_tags").select("content_item_id, tag_id").in("content_item_id", itemIds)
      : { data: [] };

  const tagsByItem = new Map<string, string[]>();
  for (const row of itemTagRows ?? []) {
    const list = tagsByItem.get(row.content_item_id) ?? [];
    list.push(row.tag_id);
    tagsByItem.set(row.content_item_id, list);
  }

  const views: ContentItemView[] = (items ?? []).map((item) => ({
    id: item.id,
    title: item.title,
    type: item.type,
    status: item.status,
    isFavorite: item.is_favorite,
    folderId: item.folder_id,
    isDeleted: Boolean(item.deleted_at),
    tagIds: tagsByItem.get(item.id) ?? [],
    createdAt: item.created_at,
  }));

  const hasAnyFilter = Boolean(params.q || params.type || params.status || params.folder || params.tag || params.favorite);

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-2xl font-semibold">Biblioteca</h1>
        <p className="text-sm text-[color:var(--color-text-muted)]">
          Central de posts, carrosséis, roteiros, bios e criativos.
        </p>
      </div>

      <LibraryToolbar folders={folders ?? []} tags={tags ?? []} contentTypes={CONTENT_TYPES} />

      {views.length === 0 ? (
        <div className="flex flex-col items-center gap-2 py-16 text-center">
          <Inbox className="size-6 text-[color:var(--color-text-muted)]" />
          <p className="text-sm text-[color:var(--color-text-muted)]">
            {showTrash
              ? "Nenhum item excluído."
              : hasAnyFilter
                ? "Nenhum item corresponde a esse filtro."
                : "Nada na biblioteca ainda. Conteúdos criados nos geradores (Fases 3+) aparecem aqui."}
          </p>
        </div>
      ) : (
        <div className={view === "grid" ? "grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3" : "flex flex-col gap-2"}>
          {views.map((item) => (
            <ContentItemCard key={item.id} item={item} folders={folders ?? []} tags={tags ?? []} view={view} />
          ))}
        </div>
      )}
    </div>
  );
}
