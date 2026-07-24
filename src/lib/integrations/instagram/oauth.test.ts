import { describe, expect, it, beforeEach, afterEach } from "vitest";
import { buildAuthorizationUrl } from "./oauth";

const ORIGINAL_ENV = { ...process.env };

beforeEach(() => {
  process.env.META_APP_ID = "test-app-id";
  process.env.OAUTH_REDIRECT_BASE_URL = "https://example.com";
});

afterEach(() => {
  process.env = { ...ORIGINAL_ENV };
});

describe("buildAuthorizationUrl", () => {
  it("aponta para o domínio oficial da Instagram Platform", () => {
    const url = buildAuthorizationUrl("state-123");
    expect(url.startsWith("https://www.instagram.com/oauth/authorize?")).toBe(true);
  });

  it("inclui client_id, redirect_uri, response_type e state corretos", () => {
    const url = new URL(buildAuthorizationUrl("state-abc"));
    expect(url.searchParams.get("client_id")).toBe("test-app-id");
    expect(url.searchParams.get("redirect_uri")).toBe(
      "https://example.com/api/integrations/instagram/callback",
    );
    expect(url.searchParams.get("response_type")).toBe("code");
    expect(url.searchParams.get("state")).toBe("state-abc");
  });

  it("solicita apenas os scopes oficiais mínimos necessários", () => {
    const url = new URL(buildAuthorizationUrl("state-xyz"));
    const scopes = url.searchParams.get("scope")?.split(",");
    expect(scopes).toEqual(["instagram_business_basic", "instagram_business_content_publish"]);
  });

  it("lança erro claro se META_APP_ID não estiver configurado", () => {
    delete process.env.META_APP_ID;
    expect(() => buildAuthorizationUrl("state-1")).toThrow(/META_APP_ID/);
  });
});
