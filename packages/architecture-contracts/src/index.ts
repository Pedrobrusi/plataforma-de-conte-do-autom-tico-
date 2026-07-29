// Public entry point for @averro/architecture-contracts.
//
// This package is the ONLY sanctioned boundary between the Python AMA/AMDL
// compiler and the TypeScript codebase: TS consumes the generated artifacts
// and never imports Python. All generated modules are produced by
// `npm run ama:compile` and must not be edited by hand.

import { readFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

// Re-export the generated domain contracts (interfaces + event payload types).
export * from "./generated/contracts.generated";
// Named re-exports avoid the duplicate ARCHITECTURE_FINGERPRINT symbol that
// each generated module declares.
export { EVENT_IDS, type EventId } from "./generated/events.generated";
export {
  PERMISSION_IDS,
  ROLE_PERMISSIONS,
  type PermissionId,
  type RoleId,
} from "./generated/permissions.generated";

import { ARCHITECTURE_FINGERPRINT } from "./generated/contracts.generated";

export interface ArchitectureManifest {
  compiler: string;
  fingerprint: string;
  system: { id: string; name: string; version: string } & Record<string, unknown>;
  object_count: number;
  [key: string]: unknown;
}

const HERE = dirname(fileURLToPath(import.meta.url));
/** Repo-root `generated/` directory (packages/architecture-contracts/src → repo root). */
const DEFAULT_GENERATED_DIR = resolve(HERE, "../../../generated");

/** Read the stable architecture manifest, with a readable error if missing. */
export function readArchitectureManifest(
  generatedDir: string = DEFAULT_GENERATED_DIR,
): ArchitectureManifest {
  const path = resolve(generatedDir, "architecture-manifest.json");
  let raw: string;
  try {
    raw = readFileSync(path, "utf-8");
  } catch {
    throw new Error(
      `Architecture manifest not found at ${path}. ` +
        `Run "npm run ama:compile" to generate the architecture contracts.`,
    );
  }
  return JSON.parse(raw) as ArchitectureManifest;
}

/** Throw a readable error if the generated fingerprint differs from `expected`. */
export function assertArchitectureFingerprint(
  expected: string,
  generatedDir: string = DEFAULT_GENERATED_DIR,
): void {
  const manifest = readArchitectureManifest(generatedDir);
  if (manifest.fingerprint !== expected) {
    throw new Error(
      "Architecture fingerprint mismatch.\n" +
        `  expected (code): ${expected}\n` +
        `  generated:       ${manifest.fingerprint}\n` +
        'The AMDL spec changed but the TypeScript code was built against an older ' +
        'architecture. Run "npm run ama:compile" and rebuild.',
    );
  }
}

/**
 * Verify the compiled-in fingerprint matches the on-disk generated manifest.
 * Call this at app startup or in a contract test to fail fast on drift.
 */
export function verifyContractsInSync(generatedDir: string = DEFAULT_GENERATED_DIR): void {
  assertArchitectureFingerprint(ARCHITECTURE_FINGERPRINT, generatedDir);
}

export { ARCHITECTURE_FINGERPRINT };
