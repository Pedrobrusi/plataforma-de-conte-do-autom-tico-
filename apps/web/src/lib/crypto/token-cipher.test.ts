import { describe, expect, it, beforeAll } from "vitest";
import { encryptToken, decryptToken } from "./token-cipher";

beforeAll(() => {
  process.env.TOKEN_ENCRYPTION_KEY = "IUUEPanXA5vhEB8Jq+3EjGec4mJV7ewZiXz8qKa4osc=";
});

describe("token-cipher", () => {
  it("encripta e descriptografa de volta para o valor original", () => {
    const plaintext = "IGAAxxxxx-access-token-de-teste";
    const encrypted = encryptToken(plaintext);
    expect(encrypted).not.toBe(plaintext);
    expect(decryptToken(encrypted)).toBe(plaintext);
  });

  it("gera saídas diferentes para a mesma entrada (IV aleatório)", () => {
    const a = encryptToken("mesmo-valor");
    const b = encryptToken("mesmo-valor");
    expect(a).not.toBe(b);
  });

  it("falha ao descriptografar um payload corrompido", () => {
    const encrypted = encryptToken("valor-original");
    const tampered = encrypted.slice(0, -4) + "abcd";
    expect(() => decryptToken(tampered)).toThrow();
  });

  it("lança erro claro se TOKEN_ENCRYPTION_KEY não estiver configurada", () => {
    const original = process.env.TOKEN_ENCRYPTION_KEY;
    delete process.env.TOKEN_ENCRYPTION_KEY;
    expect(() => encryptToken("x")).toThrow(/TOKEN_ENCRYPTION_KEY/);
    process.env.TOKEN_ENCRYPTION_KEY = original;
  });
});
