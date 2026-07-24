import { createHmac, randomBytes, timingSafeEqual } from "node:crypto";

const STATE_TTL_MS = 5 * 60 * 1000;

type OAuthStatePayload = {
  state: string;
  workspaceId: string;
  userId: string;
  issuedAt: number;
};

function getSecret(): string {
  const secret = process.env.TOKEN_ENCRYPTION_KEY;
  if (!secret) throw new Error("TOKEN_ENCRYPTION_KEY não configurada.");
  return secret;
}

function sign(payload: string): string {
  return createHmac("sha256", getSecret()).update(payload).digest("base64url");
}

/** Gera o valor de um cookie assinado para proteger o fluxo OAuth contra CSRF. */
export function createOAuthStateCookie(workspaceId: string, userId: string): {
  cookieValue: string;
  state: string;
} {
  const state = randomBytes(16).toString("base64url");
  const payload: OAuthStatePayload = { state, workspaceId, userId, issuedAt: Date.now() };
  const payloadJson = JSON.stringify(payload);
  const payloadB64 = Buffer.from(payloadJson).toString("base64url");
  const signature = sign(payloadB64);
  return { cookieValue: `${payloadB64}.${signature}`, state };
}

/**
 * Valida o cookie de state contra o parâmetro `state` recebido no callback.
 * Retorna o payload apenas se a assinatura for válida, não estiver expirada
 * e o `state` corresponder exatamente (mitiga CSRF e replay).
 */
export function verifyOAuthStateCookie(
  cookieValue: string | undefined,
  receivedState: string | null,
): OAuthStatePayload | null {
  if (!cookieValue || !receivedState) return null;

  const [payloadB64, signature] = cookieValue.split(".");
  if (!payloadB64 || !signature) return null;

  const expectedSignature = sign(payloadB64);
  const a = Buffer.from(signature);
  const b = Buffer.from(expectedSignature);
  if (a.length !== b.length || !timingSafeEqual(a, b)) return null;

  let payload: OAuthStatePayload;
  try {
    payload = JSON.parse(Buffer.from(payloadB64, "base64url").toString("utf8"));
  } catch {
    return null;
  }

  if (payload.state !== receivedState) return null;
  if (Date.now() - payload.issuedAt > STATE_TTL_MS) return null;

  return payload;
}
