import { describe, expect, it } from "vitest";

import {
  ARCHITECTURE_FINGERPRINT,
  EVENT_IDS,
  PERMISSION_IDS,
  ROLE_PERMISSIONS,
  readArchitectureManifest,
  verifyContractsInSync,
} from "./index";

describe("architecture-contracts", () => {
  it("exposes a 64-hex architecture fingerprint", () => {
    expect(ARCHITECTURE_FINGERPRINT).toMatch(/^[0-9a-f]{64}$/);
  });

  it("reads the generated architecture manifest", () => {
    const manifest = readArchitectureManifest();
    expect(manifest.fingerprint).toBe(ARCHITECTURE_FINGERPRINT);
    expect(manifest.object_count).toBeGreaterThan(0);
    expect(manifest.system.id).toBe("averro-platform");
  });

  it("verifies the compiled-in contracts match the generated manifest", () => {
    expect(() => verifyContractsInSync()).not.toThrow();
  });

  it("throws a readable error on fingerprint drift", () => {
    expect(() => verifyContractsInSync("/nonexistent")).toThrow(/not found|mismatch/);
  });

  it("exposes generated events and role permissions", () => {
    expect(EVENT_IDS.length).toBeGreaterThan(0);
    expect(PERMISSION_IDS).toContain("workspace-admin");
    expect(Object.keys(ROLE_PERMISSIONS)).toContain("owner");
  });
});
