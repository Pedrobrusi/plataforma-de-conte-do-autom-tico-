"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { getWorkspaceContext } from "@/lib/workspace";
import { twitterPostSchema } from "@/lib/validations/twitter-post";
import { buildTwitterPostDocument } from "@/lib/design/templates/twitter-post";
import { isExportBlocked, type DesignDocument } from "@/lib/design/document";
import { renderDesignPng } from "@/lib/design/renderer";
import { costPreflight } from "@/lib/providers/registry";
import type { ActionResult } from "@/lib/actions/auth";
import type { Json } from "@/lib/supabase/types";

export async function saveTwitterPostAction(_prev: ActionResult, formData: FormData): Promise<ActionResult> {
  const parsed = twitterPostSchema.safeParse({
    itemId: formData.get("itemId"),
    title: formData.get("title"),
    name: formData.get("name"),
    handle: formData.get("handle"),
    verified: formData.get("verified") ?? "false",
    content: formData.get("content"),
    theme: formData.get("theme"),
    avatarUrl: formData.get("avatarUrl"),
  });

  if (!parsed.success) {
    return { fieldErrors: parsed.error.flatten().fieldErrors as Record<string, string[]> };
  }

  const context = await getWorkspaceContext();
  if (!context?.workspace) return { error: "Sessão expirada." };

  const doc = buildTwitterPostDocument({
    name: parsed.data.name,
    handle: parsed.data.handle || "",
    verified: parsed.data.verified === "true",
    content: parsed.data.content,
    theme: parsed.data.theme,
    avatarUrl: parsed.data.avatarUrl || null,
  });

  const supabase = await createServerSupabaseClient();

  if (parsed.data.itemId) {
    const { data: existing } = await supabase
      .from("content_items")
      .select("*")
      .eq("id", parsed.data.itemId)
      .eq("workspace_id", context.workspace.id)
      .maybeSingle();
    if (!existing) return { error: "Projeto não encontrado." };

    const { count } = await supabase
      .from("content_versions")
      .select("id", { count: "exact", head: true })
      .eq("content_item_id", existing.id);

    const { error: versionError } = await supabase.from("content_versions").insert({
      content_item_id: existing.id,
      workspace_id: context.workspace.id,
      version_number: (count ?? 0) + 1,
      data: existing.data as Json,
      created_by: context.user.id,
    });
    if (versionError) return { error: versionError.message };

    const { error: updateError } = await supabase
      .from("content_items")
      .update({ title: parsed.data.title, data: doc as unknown as Json })
      .eq("id", existing.id);
    if (updateError) return { error: updateError.message };

    revalidatePath("/posts/twitter");
    redirect(`/posts/twitter?id=${existing.id}&saved=1`);
  }

  const { data: created, error: insertError } = await supabase
    .from("content_items")
    .insert({
      workspace_id: context.workspace.id,
      type: "twitter_post",
      title: parsed.data.title,
      status: "draft",
      data: doc as unknown as Json,
      created_by: context.user.id,
    })
    .select("id")
    .single();
  if (insertError || !created) return { error: insertError?.message ?? "Falha ao criar projeto." };

  revalidatePath("/posts/twitter");
  redirect(`/posts/twitter?id=${created.id}&saved=1`);
}

export async function renderTwitterPostAction(itemId: string): Promise<ActionResult & { downloadUrl?: string }> {
  const context = await getWorkspaceContext();
  if (!context?.workspace) return { error: "Sessão expirada." };

  const preflight = costPreflight({ providerId: "local-og-image", operation: "twitter_post_render" });
  if (!preflight.allowed) return { error: `Renderização bloqueada: ${preflight.reason}` };

  const supabase = await createServerSupabaseClient();
  const { data: item } = await supabase
    .from("content_items")
    .select("*")
    .eq("id", itemId)
    .eq("workspace_id", context.workspace.id)
    .maybeSingle();
  if (!item) return { error: "Projeto não encontrado." };

  const doc = item.data as unknown as DesignDocument;
  const blocked = isExportBlocked(doc);
  if (blocked.blocked) return { error: blocked.reason };

  const { data: job, error: jobError } = await supabase
    .from("render_jobs")
    .insert({
      workspace_id: context.workspace.id,
      content_item_id: itemId,
      status: "processing",
      provider: "local-og-image",
      render_kind: "design_png",
      payload: { templateId: doc.templateId },
      created_by: context.user.id,
    })
    .select("id")
    .single();
  if (jobError || !job) return { error: jobError?.message ?? "Falha ao criar job de renderização." };

  try {
    const png = await renderDesignPng(doc);
    const path = `${context.workspace.id}/exports/${itemId}/${Date.now()}.png`;

    const { error: uploadError } = await supabase.storage
      .from("media")
      .upload(path, png, { contentType: "image/png" });
    if (uploadError) throw new Error(uploadError.message);

    const { data: publicUrlData } = supabase.storage.from("media").getPublicUrl(path);

    await supabase
      .from("render_jobs")
      .update({
        status: "completed",
        progress: 100,
        result: { png: publicUrlData.publicUrl },
        result_url: publicUrlData.publicUrl,
      })
      .eq("id", job.id);

    await supabase.from("content_items").update({ status: "ready" }).eq("id", itemId);

    revalidatePath("/posts/twitter");
    return { success: "PNG renderizado.", downloadUrl: publicUrlData.publicUrl };
  } catch (error) {
    const message = error instanceof Error ? error.message : "Erro desconhecido";
    await supabase.from("render_jobs").update({ status: "failed", error: message }).eq("id", job.id);
    return { error: `Falha ao renderizar: ${message}` };
  }
}
