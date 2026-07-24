/**
 * Instagram API with Instagram Login ("Business Login for Instagram").
 * Não usa Facebook Login nem exige Página do Facebook vinculada — é o
 * caminho oficial recomendado pela Meta para conectar uma única conta
 * profissional (Business/Creator) sem app público, mantendo o Meta App em
 * Development Mode (sem App Review).
 *
 * Docs: https://developers.facebook.com/docs/instagram-platform/instagram-api-with-instagram-login/business-login
 */
export const API_VERSION = process.env.META_API_VERSION || "v25.0";

export const AUTHORIZE_URL = "https://www.instagram.com/oauth/authorize";
export const TOKEN_EXCHANGE_URL = "https://api.instagram.com/oauth/access_token";
export const GRAPH_BASE = `https://graph.instagram.com/${API_VERSION}`;

export const REQUIRED_SCOPES = ["instagram_business_basic", "instagram_business_content_publish"];

export function getMetaAppId(): string {
  const id = process.env.META_APP_ID;
  if (!id) throw new Error("META_APP_ID não configurado.");
  return id;
}

export function getMetaAppSecret(): string {
  const secret = process.env.META_APP_SECRET;
  if (!secret) throw new Error("META_APP_SECRET não configurado.");
  return secret;
}

export function getRedirectUri(): string {
  const base = process.env.OAUTH_REDIRECT_BASE_URL || process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000";
  return `${base}/api/integrations/instagram/callback`;
}

function parseAllowlist(value: string | undefined): string[] {
  return (value ?? "")
    .split(",")
    .map((v) => v.trim())
    .filter(Boolean);
}

export function getAllowedAccountIds(): string[] {
  return parseAllowlist(process.env.INSTAGRAM_ALLOWED_ACCOUNT_IDS);
}

export function getAllowedUsernames(): string[] {
  return parseAllowlist(process.env.INSTAGRAM_ALLOWED_USERNAMES).map((u) => u.toLowerCase());
}

export function isAccountAllowed(account: { id: string; username: string }): boolean {
  const allowedIds = getAllowedAccountIds();
  const allowedUsernames = getAllowedUsernames();

  if (allowedIds.length === 0 && allowedUsernames.length === 0) {
    // Nenhuma allowlist configurada ainda: nenhuma conta é permitida por padrão.
    // Evita "fail open" enquanto o proprietário não cadastrou a própria conta.
    return false;
  }

  return allowedIds.includes(account.id) || allowedUsernames.includes(account.username.toLowerCase());
}

export const REJECTION_MESSAGE = "Esta instalação aceita somente a conta do proprietário.";

export const INSTAGRAM_OAUTH_STATE_COOKIE = "ig_oauth_state";
