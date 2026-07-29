import {
  API_VERSION,
  AUTHORIZE_URL,
  TOKEN_EXCHANGE_URL,
  GRAPH_BASE,
  REQUIRED_SCOPES,
  getMetaAppId,
  getMetaAppSecret,
  getRedirectUri,
} from "./config";

export function buildAuthorizationUrl(state: string): string {
  const params = new URLSearchParams({
    client_id: getMetaAppId(),
    redirect_uri: getRedirectUri(),
    response_type: "code",
    scope: REQUIRED_SCOPES.join(","),
    state,
  });
  return `${AUTHORIZE_URL}?${params.toString()}`;
}

export type ShortLivedTokenResult = {
  accessToken: string;
  userId: string;
};

/** Troca o código de autorização por um token de curta duração (~1h). */
export async function exchangeCodeForShortLivedToken(code: string): Promise<ShortLivedTokenResult> {
  const body = new URLSearchParams({
    client_id: getMetaAppId(),
    client_secret: getMetaAppSecret(),
    grant_type: "authorization_code",
    redirect_uri: getRedirectUri(),
    code,
  });

  const res = await fetch(TOKEN_EXCHANGE_URL, { method: "POST", body });
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Falha ao trocar código por token: ${res.status} ${text}`);
  }
  const data = await res.json();
  return { accessToken: data.access_token, userId: String(data.user_id) };
}

export type LongLivedTokenResult = {
  accessToken: string;
  expiresInSeconds: number;
};

/** Troca o token de curta duração por um de longa duração (60 dias). */
export async function exchangeForLongLivedToken(shortLivedToken: string): Promise<LongLivedTokenResult> {
  const params = new URLSearchParams({
    grant_type: "ig_exchange_token",
    client_secret: getMetaAppSecret(),
    access_token: shortLivedToken,
  });
  const res = await fetch(`https://graph.instagram.com/access_token?${params.toString()}`);
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Falha ao obter token de longa duração: ${res.status} ${text}`);
  }
  const data = await res.json();
  return { accessToken: data.access_token, expiresInSeconds: data.expires_in };
}

/**
 * Renova um token de longa duração antes de expirar (precisa ter ao menos
 * 24h de vida restante; um token já expirado não pode ser renovado).
 */
export async function refreshLongLivedToken(currentToken: string): Promise<LongLivedTokenResult> {
  const params = new URLSearchParams({
    grant_type: "ig_refresh_token",
    access_token: currentToken,
  });
  const res = await fetch(`https://graph.instagram.com/refresh_access_token?${params.toString()}`);
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Falha ao renovar token: ${res.status} ${text}`);
  }
  const data = await res.json();
  return { accessToken: data.access_token, expiresInSeconds: data.expires_in };
}

export type InstagramProfile = {
  id: string;
  username: string;
  accountType: string | null;
  name: string | null;
};

export async function getInstagramProfile(accessToken: string): Promise<InstagramProfile> {
  const params = new URLSearchParams({
    fields: "id,username,account_type,name",
    access_token: accessToken,
  });
  const res = await fetch(`${GRAPH_BASE}/me?${params.toString()}`);
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Falha ao consultar perfil do Instagram: ${res.status} ${text}`);
  }
  const data = await res.json();
  return {
    id: String(data.id),
    username: data.username,
    accountType: data.account_type ?? null,
    name: data.name ?? null,
  };
}

export { API_VERSION };
