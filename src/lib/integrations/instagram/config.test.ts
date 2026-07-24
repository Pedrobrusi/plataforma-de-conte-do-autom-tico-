import { describe, expect, it, afterEach } from "vitest";
import { isAccountAllowed } from "./config";

const ORIGINAL_ENV = { ...process.env };

afterEach(() => {
  process.env = { ...ORIGINAL_ENV };
});

describe("isAccountAllowed", () => {
  it("nega por padrão quando nenhuma allowlist está configurada (fail closed)", () => {
    delete process.env.INSTAGRAM_ALLOWED_ACCOUNT_IDS;
    delete process.env.INSTAGRAM_ALLOWED_USERNAMES;
    expect(isAccountAllowed({ id: "123", username: "dono" })).toBe(false);
  });

  it("permite quando o ID está na allowlist", () => {
    process.env.INSTAGRAM_ALLOWED_ACCOUNT_IDS = "123,456";
    expect(isAccountAllowed({ id: "123", username: "qualquer" })).toBe(true);
  });

  it("permite quando o username está na allowlist (case-insensitive)", () => {
    process.env.INSTAGRAM_ALLOWED_USERNAMES = "MeuPerfil";
    expect(isAccountAllowed({ id: "999", username: "meuperfil" })).toBe(true);
  });

  it("recusa uma conta que não está em nenhuma allowlist", () => {
    process.env.INSTAGRAM_ALLOWED_ACCOUNT_IDS = "123";
    process.env.INSTAGRAM_ALLOWED_USERNAMES = "dono";
    expect(isAccountAllowed({ id: "999", username: "intruso" })).toBe(false);
  });
});
