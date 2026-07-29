"use server";

import { revalidatePath } from "next/cache";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { getWorkspaceContext } from "@/lib/workspace";
import { folderNameSchema, tagSchema, renameContentItemSchema } from "@/lib/validations/library";
import type { ActionResult } from "@/lib/actions/auth";

const LIBRARY_PATH = "/biblioteca";

export async function createFolderAction(_prev: ActionResult, formData: FormData): Promise<ActionResult> {
  const parsed = folderNameSchema.safeParse({ name: formData.get("name") });
  if (!parsed.success) {
    return { fieldErrors: parsed.error.flatten().fieldErrors as Record<string, string[]> };
  }

  const context = await getWorkspaceContext();
  if (!context?.workspace) return { error: "Sessão expirada." };

  const supabase = await createServerSupabaseClient();
  const { error } = await supabase.from("folders").insert({
    workspace_id: context.workspace.id,
    name: parsed.data.name,
    created_by: context.user.id,
  });

  if (error) return { error: error.message };
  revalidatePath(LIBRARY_PATH);
  return { success: "Pasta criada." };
}

export async function createTagAction(_prev: ActionResult, formData: FormData): Promise<ActionResult> {
  const parsed = tagSchema.safeParse({ name: formData.get("name"), color: formData.get("color") });
  if (!parsed.success) {
    return { fieldErrors: parsed.error.flatten().fieldErrors as Record<string, string[]> };
  }

  const context = await getWorkspaceContext();
  if (!context?.workspace) return { error: "Sessão expirada." };

  const supabase = await createServerSupabaseClient();
  const { error } = await supabase.from("tags").insert({
    workspace_id: context.workspace.id,
    name: parsed.data.name,
    color: parsed.data.color || null,
  });

  if (error) {
    if (error.message.includes("duplicate key")) return { error: "Já existe uma tag com esse nome." };
    return { error: error.message };
  }
  revalidatePath(LIBRARY_PATH);
  return { success: "Tag criada." };
}

async function assertOwnedItem(
  supabase: Awaited<ReturnType<typeof createServerSupabaseClient>>,
  workspaceId: string,
  itemId: string,
) {
  const { data } = await supabase
    .from("content_items")
    .select("*")
    .eq("id", itemId)
    .eq("workspace_id", workspaceId)
    .maybeSingle();
  return data;
}

export async function toggleFavoriteAction(itemId: string): Promise<ActionResult> {
  const context = await getWorkspaceContext();
  if (!context?.workspace) return { error: "Sessão expirada." };
  const supabase = await createServerSupabaseClient();

  const item = await assertOwnedItem(supabase, context.workspace.id, itemId);
  if (!item) return { error: "Item não encontrado." };

  const { error } = await supabase
    .from("content_items")
    .update({ is_favorite: !item.is_favorite })
    .eq("id", itemId);
  if (error) return { error: error.message };

  revalidatePath(LIBRARY_PATH);
  return {};
}

export async function renameContentItemAction(itemId: string, formData: FormData): Promise<ActionResult> {
  const parsed = renameContentItemSchema.safeParse({ title: formData.get("title") });
  if (!parsed.success) {
    return { fieldErrors: parsed.error.flatten().fieldErrors as Record<string, string[]> };
  }

  const context = await getWorkspaceContext();
  if (!context?.workspace) return { error: "Sessão expirada." };
  const supabase = await createServerSupabaseClient();

  const item = await assertOwnedItem(supabase, context.workspace.id, itemId);
  if (!item) return { error: "Item não encontrado." };

  const { error } = await supabase
    .from("content_items")
    .update({ title: parsed.data.title })
    .eq("id", itemId);
  if (error) return { error: error.message };

  revalidatePath(LIBRARY_PATH);
  return { success: "Renomeado." };
}

export async function duplicateContentItemAction(itemId: string): Promise<ActionResult> {
  const context = await getWorkspaceContext();
  if (!context?.workspace) return { error: "Sessão expirada." };
  const supabase = await createServerSupabaseClient();

  const item = await assertOwnedItem(supabase, context.workspace.id, itemId);
  if (!item) return { error: "Item não encontrado." };

  const { error } = await supabase.from("content_items").insert({
    workspace_id: context.workspace.id,
    type: item.type,
    title: `${item.title} (cópia)`,
    status: "draft",
    data: item.data,
    folder_id: item.folder_id,
    created_by: context.user.id,
  });
  if (error) return { error: error.message };

  revalidatePath(LIBRARY_PATH);
  return { success: "Item duplicado." };
}

export async function archiveContentItemAction(itemId: string): Promise<ActionResult> {
  const context = await getWorkspaceContext();
  if (!context?.workspace) return { error: "Sessão expirada." };
  const supabase = await createServerSupabaseClient();

  const item = await assertOwnedItem(supabase, context.workspace.id, itemId);
  if (!item) return { error: "Item não encontrado." };

  const { error } = await supabase
    .from("content_items")
    .update({ status: "archived" })
    .eq("id", itemId);
  if (error) return { error: error.message };

  revalidatePath(LIBRARY_PATH);
  return { success: "Arquivado." };
}

export async function softDeleteContentItemAction(itemId: string): Promise<ActionResult> {
  const context = await getWorkspaceContext();
  if (!context?.workspace) return { error: "Sessão expirada." };
  const supabase = await createServerSupabaseClient();

  const item = await assertOwnedItem(supabase, context.workspace.id, itemId);
  if (!item) return { error: "Item não encontrado." };

  const { error } = await supabase
    .from("content_items")
    .update({ deleted_at: new Date().toISOString() })
    .eq("id", itemId);
  if (error) return { error: error.message };

  await supabase.from("audit_logs").insert({
    workspace_id: context.workspace.id,
    user_id: context.user.id,
    action: "content_item.deleted",
    entity_type: "content_item",
    entity_id: itemId,
    metadata: {},
  });

  revalidatePath(LIBRARY_PATH);
  return { success: "Excluído. Pode ser restaurado nos itens excluídos." };
}

export async function restoreContentItemAction(itemId: string): Promise<ActionResult> {
  const context = await getWorkspaceContext();
  if (!context?.workspace) return { error: "Sessão expirada." };
  const supabase = await createServerSupabaseClient();

  const { error } = await supabase
    .from("content_items")
    .update({ deleted_at: null })
    .eq("id", itemId)
    .eq("workspace_id", context.workspace.id);
  if (error) return { error: error.message };

  revalidatePath(LIBRARY_PATH);
  return { success: "Restaurado." };
}

export async function moveToFolderAction(itemId: string, folderId: string | null): Promise<ActionResult> {
  const context = await getWorkspaceContext();
  if (!context?.workspace) return { error: "Sessão expirada." };
  const supabase = await createServerSupabaseClient();

  const item = await assertOwnedItem(supabase, context.workspace.id, itemId);
  if (!item) return { error: "Item não encontrado." };

  const { error } = await supabase
    .from("content_items")
    .update({ folder_id: folderId })
    .eq("id", itemId);
  if (error) return { error: error.message };

  revalidatePath(LIBRARY_PATH);
  return { success: "Movido." };
}

export async function toggleTagOnItemAction(
  itemId: string,
  tagId: string,
  attach: boolean,
): Promise<ActionResult> {
  const context = await getWorkspaceContext();
  if (!context?.workspace) return { error: "Sessão expirada." };
  const supabase = await createServerSupabaseClient();

  const item = await assertOwnedItem(supabase, context.workspace.id, itemId);
  if (!item) return { error: "Item não encontrado." };

  if (attach) {
    const { error } = await supabase.from("content_item_tags").insert({ content_item_id: itemId, tag_id: tagId });
    if (error && !error.message.includes("duplicate key")) return { error: error.message };
  } else {
    const { error } = await supabase
      .from("content_item_tags")
      .delete()
      .eq("content_item_id", itemId)
      .eq("tag_id", tagId);
    if (error) return { error: error.message };
  }

  revalidatePath(LIBRARY_PATH);
  return {};
}
