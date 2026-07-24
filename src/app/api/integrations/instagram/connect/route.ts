import { NextResponse } from "next/server";
import { getWorkspaceContext } from "@/lib/workspace";
import { createOAuthStateCookie } from "@/lib/crypto/oauth-state";
import { buildAuthorizationUrl } from "@/lib/integrations/instagram/oauth";
import { INSTAGRAM_OAUTH_STATE_COOKIE } from "@/lib/integrations/instagram/config";

export async function GET(request: Request) {
  const context = await getWorkspaceContext();
  if (!context || !context.workspace) {
    return NextResponse.redirect(new URL("/login", request.url));
  }

  if (!process.env.META_APP_ID || !process.env.META_APP_SECRET) {
    const url = new URL("/configuracoes/instagram-setup", request.url);
    url.searchParams.set("status", "blocked_official_auth_unavailable");
    return NextResponse.redirect(url);
  }

  const { cookieValue, state } = createOAuthStateCookie(context.workspace.id, context.user.id);
  const authorizationUrl = buildAuthorizationUrl(state);

  const response = NextResponse.redirect(authorizationUrl);
  response.cookies.set(INSTAGRAM_OAUTH_STATE_COOKIE, cookieValue, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    maxAge: 5 * 60,
    path: "/",
  });
  return response;
}
