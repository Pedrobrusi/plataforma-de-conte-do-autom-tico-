import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { verifyOAuthStateCookie } from "@/lib/crypto/oauth-state";
import { encryptToken } from "@/lib/crypto/token-cipher";
import {
  exchangeCodeForShortLivedToken,
  exchangeForLongLivedToken,
  getInstagramProfile,
} from "@/lib/integrations/instagram/oauth";
import { isAccountAllowed, REQUIRED_SCOPES, INSTAGRAM_OAUTH_STATE_COOKIE } from "@/lib/integrations/instagram/config";

function redirectToSetup(request: Request, status: string, reason?: string) {
  const url = new URL("/configuracoes/instagram-setup", request.url);
  url.searchParams.set("status", status);
  if (reason) url.searchParams.set("reason", reason);
  return NextResponse.redirect(url);
}

export async function GET(request: Request) {
  const url = new URL(request.url);
  const code = url.searchParams.get("code");
  const receivedState = url.searchParams.get("state");
  const oauthError = url.searchParams.get("error_description") ?? url.searchParams.get("error");

  const cookieStore = await cookies();
  const stateCookieValue = cookieStore.get(INSTAGRAM_OAUTH_STATE_COOKIE)?.value;

  const supabase = await createServerSupabaseClient();
  const { data: userData } = await supabase.auth.getUser();
  if (!userData.user) {
    return redirectToSetup(request, "error", "Sessão expirada. Faça login e tente novamente.");
  }

  if (oauthError) {
    return redirectToSetup(request, "error", oauthError);
  }

  const statePayload = verifyOAuthStateCookie(stateCookieValue, receivedState);
  if (!statePayload || statePayload.userId !== userData.user.id) {
    return redirectToSetup(request, "error", "Tentativa de login inválida ou expirada. Tente novamente.");
  }

  if (!code) {
    return redirectToSetup(request, "error", "Código de autorização ausente.");
  }

  const workspaceId = statePayload.workspaceId;

  try {
    const shortLived = await exchangeCodeForShortLivedToken(code);
    const longLived = await exchangeForLongLivedToken(shortLived.accessToken);
    const profile = await getInstagramProfile(longLived.accessToken);

    if (!isAccountAllowed({ id: profile.id, username: profile.username })) {
      await supabase.from("audit_logs").insert({
        workspace_id: workspaceId,
        user_id: userData.user.id,
        action: "instagram.connect_rejected_not_allowlisted",
        entity_type: "social_connection",
        metadata: { instagram_id: profile.id, instagram_username: profile.username },
      });
      const response = redirectToSetup(request, "rejected");
      response.cookies.delete(INSTAGRAM_OAUTH_STATE_COOKIE);
      return response;
    }

    const expiresAt = new Date(Date.now() + longLived.expiresInSeconds * 1000).toISOString();

    const { error: upsertError } = await supabase
      .from("social_connections")
      .upsert(
        {
          workspace_id: workspaceId,
          platform: "instagram",
          status: "connected",
          display_name: profile.username,
          external_account_id: profile.id,
          access_token_encrypted: encryptToken(longLived.accessToken),
          refresh_token_encrypted: null,
          scopes: REQUIRED_SCOPES,
          expires_at: expiresAt,
          is_mock: false,
          last_synced_at: new Date().toISOString(),
          last_error: null,
          connected_by: userData.user.id,
        },
        { onConflict: "workspace_id,platform" },
      );

    if (upsertError) throw new Error(upsertError.message);

    await supabase.from("audit_logs").insert({
      workspace_id: workspaceId,
      user_id: userData.user.id,
      action: "instagram.connected",
      entity_type: "social_connection",
      metadata: { instagram_id: profile.id, instagram_username: profile.username },
    });

    const response = redirectToSetup(request, "connected");
    response.cookies.delete(INSTAGRAM_OAUTH_STATE_COOKIE);
    return response;
  } catch (error) {
    await supabase.from("audit_logs").insert({
      workspace_id: workspaceId,
      user_id: userData.user.id,
      action: "instagram.connect_error",
      entity_type: "social_connection",
      metadata: { error: error instanceof Error ? error.message : String(error) },
    });
    const response = redirectToSetup(
      request,
      "error",
      error instanceof Error ? error.message : "Erro desconhecido ao conectar.",
    );
    response.cookies.delete(INSTAGRAM_OAUTH_STATE_COOKIE);
    return response;
  }
}
