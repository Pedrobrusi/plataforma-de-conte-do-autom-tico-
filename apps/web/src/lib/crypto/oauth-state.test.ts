import { describe, expect, it, beforeAll, vi } from "vitest";
import { createOAuthStateCookie, verifyOAuthStateCookie } from "./oauth-state";

beforeAll(() => {
  process.env.TOKEN_ENCRYPTION_KEY = "IUUEPanXA5vhEB8Jq+3EjGec4mJV7ewZiXz8qKa4osc=";
});

describe("oauth-state", () => {
  it("valida um cookie recém-criado com o state correto", () => {
    const { cookieValue, state } = createOAuthStateCookie("workspace-1", "user-1");
    const payload = verifyOAuthStateCookie(cookieValue, state);
    expect(payload).not.toBeNull();
    expect(payload?.workspaceId).toBe("workspace-1");
    expect(payload?.userId).toBe("user-1");
  });

  it("rejeita quando o state recebido não corresponde ao cookie (CSRF)", () => {
    const { cookieValue } = createOAuthStateCookie("workspace-1", "user-1");
    expect(verifyOAuthStateCookie(cookieValue, "state-forjado")).toBeNull();
  });

  it("rejeita um cookie com assinatura adulterada", () => {
    const { cookieValue, state } = createOAuthStateCookie("workspace-1", "user-1");
    const [payload] = cookieValue.split(".");
    const tampered = `${payload}.assinatura-invalida`;
    expect(verifyOAuthStateCookie(tampered, state)).toBeNull();
  });

  it("rejeita cookie ausente", () => {
    expect(verifyOAuthStateCookie(undefined, "qualquer-state")).toBeNull();
  });

  it("expira após o TTL", () => {
    vi.useFakeTimers();
    const { cookieValue, state } = createOAuthStateCookie("workspace-1", "user-1");
    vi.advanceTimersByTime(6 * 60 * 1000);
    expect(verifyOAuthStateCookie(cookieValue, state)).toBeNull();
    vi.useRealTimers();
  });
});
