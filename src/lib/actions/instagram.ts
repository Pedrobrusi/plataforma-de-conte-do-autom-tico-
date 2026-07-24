"use server";

import { revalidatePath } from "next/cache";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { getWorkspaceContext } from "@/lib/workspace";
import { decryptToken } from "@/lib/crypto/token-cipher";
import { getInstagramProfile } from "@/lib/integrations/instagram/oauth";
import {
  createMediaContainer,
  pollContainerUntilFinished,
  publishContainer,
  getMediaPermalink,
} from "@/lib/integrations/instagram/publish";
import type { ActionResult } from "@/lib/actions/auth";

async function getConnection(supabase: Awaited<ReturnType<typeof createServerSupabaseClient>>, workspaceId: string) {
  const { data } = await supabase
    .from("social_connections")
    .select("*")
    .eq("workspace_id", workspaceId)
    .eq("platform", "instagram")
    .maybeSingle();
  return data;
}

export async function testInstagramConnectionAction(): Promise<ActionResult> {
  const context = await getWorkspaceContext();
  if (!context?.workspace) return { error: "Sessão expirada." };

  const supabase = await createServerSupabaseClient();
  const connection = await getConnection(supabase, context.workspace.id);

  if (!connection || !connection.access_token_encrypted) {
    return { error: "Nenhuma conexão do Instagram encontrada. Conecte primeiro." };
  }

  try {
    const accessToken = decryptToken(connection.access_token_encrypted);
    const profile = await getInstagramProfile(accessToken);

    await supabase
      .from("social_connections")
      .update({ status: "connected", last_synced_at: new Date().toISOString(), last_error: null })
      .eq("id", connection.id);

    await supabase.from("audit_logs").insert({
      workspace_id: context.workspace.id,
      user_id: context.user.id,
      action: "instagram.connection_verified",
      entity_type: "social_connection",
      entity_id: connection.id,
      metadata: { instagram_username: profile.username },
    });

    revalidatePath("/configuracoes/instagram-setup");
    return { success: `Conexão válida: @${profile.username}` };
  } catch (error) {
    const message = error instanceof Error ? error.message : "Erro desconhecido";
    await supabase
      .from("social_connections")
      .update({ status: "error", last_error: message })
      .eq("id", connection.id);
    return { error: `Falha ao verificar conexão: ${message}` };
  }
}

export async function publishTestPostAction(): Promise<ActionResult & { permalink?: string }> {
  const context = await getWorkspaceContext();
  if (!context?.workspace) return { error: "Sessão expirada." };

  const supabase = await createServerSupabaseClient();
  const connection = await getConnection(supabase, context.workspace.id);

  if (!connection || !connection.access_token_encrypted || connection.status !== "connected") {
    return { error: "Conecte uma conta do Instagram antes de publicar um teste." };
  }

  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";

  try {
    const accessToken = decryptToken(connection.access_token_encrypted);

    const imageRes = await fetch(`${siteUrl}/api/integrations/instagram/test-image`);
    if (!imageRes.ok) throw new Error("Falha ao renderizar a imagem de teste.");
    const imageBuffer = await imageRes.arrayBuffer();

    const storagePath = `${context.workspace.id}/test-posts/test-${Date.now()}.png`;
    const { error: uploadError } = await supabase.storage
      .from("media")
      .upload(storagePath, imageBuffer, { contentType: "image/png" });
    if (uploadError) throw new Error(`Falha ao salvar imagem: ${uploadError.message}`);

    const { data: publicUrlData } = supabase.storage.from("media").getPublicUrl(storagePath);

    const container = await createMediaContainer({
      igUserId: connection.external_account_id!,
      accessToken,
      imageUrl: publicUrlData.publicUrl,
      caption: `Teste de publicação via ${context.workspace.name} — ${new Date().toLocaleString("pt-BR")}`,
    });

    const status = await pollContainerUntilFinished(container.id, accessToken);
    if (status !== "FINISHED") {
      throw new Error(`Container não ficou pronto para publicação (status: ${status}).`);
    }

    const published = await publishContainer(connection.external_account_id!, container.id, accessToken);
    const { permalink } = await getMediaPermalink(published.mediaId, accessToken);

    await supabase.from("audit_logs").insert({
      workspace_id: context.workspace.id,
      user_id: context.user.id,
      action: "instagram.test_post_published",
      entity_type: "social_connection",
      entity_id: connection.id,
      metadata: { media_id: published.mediaId, permalink },
    });

    revalidatePath("/configuracoes/instagram-setup");
    return { success: "Publicação de teste concluída.", permalink };
  } catch (error) {
    const message = error instanceof Error ? error.message : "Erro desconhecido";
    await supabase.from("audit_logs").insert({
      workspace_id: context.workspace.id,
      user_id: context.user.id,
      action: "instagram.test_post_failed",
      entity_type: "social_connection",
      entity_id: connection.id,
      metadata: { error: message },
    });
    return { error: `Falha ao publicar teste: ${message}` };
  }
}

export async function disconnectInstagramAction(): Promise<ActionResult> {
  const context = await getWorkspaceContext();
  if (!context?.workspace) return { error: "Sessão expirada." };

  const supabase = await createServerSupabaseClient();
  const connection = await getConnection(supabase, context.workspace.id);
  if (!connection) return { error: "Nenhuma conexão para desconectar." };

  const { error } = await supabase
    .from("social_connections")
    .update({
      status: "disconnected",
      access_token_encrypted: null,
      refresh_token_encrypted: null,
      last_error: null,
    })
    .eq("id", connection.id);

  if (error) return { error: error.message };

  await supabase.from("audit_logs").insert({
    workspace_id: context.workspace.id,
    user_id: context.user.id,
    action: "instagram.disconnected",
    entity_type: "social_connection",
    entity_id: connection.id,
    metadata: {},
  });

  revalidatePath("/configuracoes/instagram-setup");
  return {
    success:
      "Desconectado deste app. Para remover o acesso por completo, também revogue em Instagram → Configurações → Apps e sites.",
  };
}
