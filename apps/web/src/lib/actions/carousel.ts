"use server";

import { revalidatePath } from "next/cache";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { getWorkspaceContext } from "@/lib/workspace";
import { isExportBlocked, type DesignDocument } from "@/lib/design/document";
import { renderCarouselZip, renderDesignPdf } from "@/lib/design/renderer";
import { costPreflight } from "@/lib/providers/registry";
import type { Json, Database } from "@/lib/supabase/types";

type CarouselContentType = Database["public"]["Enums"]["content_type"];

export type CarouselActionResult = {
  error?: string;
  success?: string;
  itemId?: string;
};

const PATH_BY_TYPE: Record<string, string> = {
  carousel_dark: "/carrosseis/dark",
  carousel_personal: "/carrosseis/pessoal",
  carousel_ai: "/carrosseis/ia",
  carousel_twitter: "/carrosseis/twitter",
};

export async function saveCarouselAction(input: {
  itemId?: string;
  type: CarouselContentType;
  title: string;
  slides: DesignDocument[];
}): Promise<CarouselActionResult> {
  if (!input.title.trim()) return { error: "Dê um título ao projeto." };
  if (!input.slides.length) return { error: "O carrossel precisa de ao menos um slide." };

  const context = await getWorkspaceContext();
  if (!context?.workspace) return { error: "Sessão expirada." };

  const supabase = await createServerSupabaseClient();
  const revalidate = () => revalidatePath(PATH_BY_TYPE[input.type] ?? "/biblioteca");

  if (input.itemId) {
    const { data: existing } = await supabase
      .from("content_items")
      .select("*")
      .eq("id", input.itemId)
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
      .update({ title: input.title, data: { slides: input.slides } as unknown as Json })
      .eq("id", existing.id);
    if (updateError) return { error: updateError.message };

    revalidate();
    return { success: "Salvo.", itemId: existing.id };
  }

  const { data: created, error: insertError } = await supabase
    .from("content_items")
    .insert({
      workspace_id: context.workspace.id,
      type: input.type,
      title: input.title,
      status: "draft",
      data: { slides: input.slides } as unknown as Json,
      created_by: context.user.id,
    })
    .select("id")
    .single();
  if (insertError || !created) return { error: insertError?.message ?? "Falha ao criar projeto." };

  revalidate();
  return { success: "Salvo.", itemId: created.id };
}

export async function renderCarouselExportAction(
  itemId: string,
  format: "zip" | "pdf",
): Promise<CarouselActionResult & { downloadUrl?: string }> {
  const context = await getWorkspaceContext();
  if (!context?.workspace) return { error: "Sessão expirada." };

  const preflight = costPreflight({ providerId: "local-og-image", operation: `carousel_render_${format}` });
  if (!preflight.allowed) return { error: `Renderização bloqueada: ${preflight.reason}` };

  const supabase = await createServerSupabaseClient();
  const { data: item } = await supabase
    .from("content_items")
    .select("*")
    .eq("id", itemId)
    .eq("workspace_id", context.workspace.id)
    .maybeSingle();
  if (!item) return { error: "Projeto não encontrado." };

  const slides = (item.data as unknown as { slides: DesignDocument[] }).slides ?? [];
  if (!slides.length) return { error: "Não há slides para exportar." };

  for (const slide of slides) {
    const blocked = isExportBlocked(slide);
    if (blocked.blocked) return { error: blocked.reason };
  }

  const { data: job, error: jobError } = await supabase
    .from("render_jobs")
    .insert({
      workspace_id: context.workspace.id,
      content_item_id: itemId,
      status: "processing",
      provider: "local-og-image",
      render_kind: format === "zip" ? "design_zip" : "design_pdf",
      payload: { slideCount: slides.length },
      created_by: context.user.id,
    })
    .select("id")
    .single();
  if (jobError || !job) return { error: jobError?.message ?? "Falha ao criar job de renderização." };

  try {
    const buffer = format === "zip" ? await renderCarouselZip(slides, "slide") : await renderDesignPdf(slides);
    const path = `${context.workspace.id}/exports/${itemId}/${Date.now()}.${format}`;
    const contentType = format === "zip" ? "application/zip" : "application/pdf";

    const { error: uploadError } = await supabase.storage.from("media").upload(path, buffer, { contentType });
    if (uploadError) throw new Error(uploadError.message);

    const { data: publicUrlData } = supabase.storage.from("media").getPublicUrl(path);

    await supabase
      .from("render_jobs")
      .update({
        status: "completed",
        progress: 100,
        result: { [format]: publicUrlData.publicUrl },
        result_url: publicUrlData.publicUrl,
      })
      .eq("id", job.id);

    await supabase.from("content_items").update({ status: "ready" }).eq("id", itemId);

    return { success: `${format.toUpperCase()} renderizado.`, downloadUrl: publicUrlData.publicUrl };
  } catch (error) {
    const message = error instanceof Error ? error.message : "Erro desconhecido";
    await supabase.from("render_jobs").update({ status: "failed", error: message }).eq("id", job.id);
    return { error: `Falha ao renderizar: ${message}` };
  }
}
